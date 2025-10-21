<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\CarRental;
use App\Models\CarRentalAvailability;
use App\Models\TripPlanner;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Ensure Midtrans config keys are loaded correctly
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function createTransaction(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_option' => 'sometimes|string|in:down_payment,full_payment',
        ]);

        $order = Order::with(['user', 'orderItems.orderable', 'booking'])
            ->findOrFail($validated['order_id']);
        $paymentOption = $validated['payment_option'] ?? 'down_payment';

        // Authorization and status checks...
        if ($request->user()->id !== $order->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        // ... (other checks remain the same)

        $amountToCharge = 0;
        $itemNameSuffix = '';
        $transactionNote = ''; // Variable to store the note

        if ($paymentOption === 'full_payment') {
            if ($order->status === 'partially_paid') {
                $amountToCharge = $order->total_amount - $order->down_payment_amount;
                $itemNameSuffix = '-BAL';
                $transactionNote = 'balance_payment'; // Note for balance
            } else {
                $amountToCharge = $order->total_amount;
                $transactionNote = 'full_payment'; // Note for full payment
            }
        } else { // down_payment
            $amountToCharge = $order->down_payment_amount;
            $itemNameSuffix = '-DP';
            $transactionNote = 'down_payment'; // Note for down payment

            if (empty($amountToCharge) || $amountToCharge <= 0) {
                // Fallback logic remains the same...
                $amountToCharge = $order->total_amount;
                $paymentOption = 'full_payment';
                $transactionNote = 'full_payment';
                $itemNameSuffix = '';
            }
        }

        if ($amountToCharge <= 0) {
            return response()->json(['message' => 'Invalid payment amount calculation.'], 400);
        }

        try {
            return DB::transaction(function () use ($order, $amountToCharge, $paymentOption, $itemNameSuffix, $transactionNote) { // Pass $transactionNote
                // ✅ Ensure the 'notes' field is correctly set when creating the transaction
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => $amountToCharge,
                    'notes' => $transactionNote, // Use the determined note
                ]);

                // Map order items for Midtrans payload
                $item_details = $order->orderItems->map(function ($item) use ($amountToCharge, $paymentOption, $itemNameSuffix, $order) {
                     // ... (item name logic remains the same)
                    $itemName = 'Unknown Item';
                    if ($item->orderable instanceof CarRental) {
                        $itemName = $item->orderable->brand . ' ' . $item->orderable->car_model;
                    } elseif (isset($item->orderable->name)) {
                         $itemName = $item->orderable->name;
                    }

                    $displayName = $itemName;
                    if ($paymentOption === 'down_payment') {
                        $displayName = 'DP (50%) for ' . $itemName;
                    } elseif ($paymentOption === 'full_payment' && $order->status === 'partially_paid') {
                        $displayName = 'Balance for ' . $itemName;
                    }
                    // ... (end item name logic)

                    return [
                        'id' => $item->orderable_type . '-' . $item->orderable_id . $itemNameSuffix,
                        'price' => (int) $amountToCharge,
                        'quantity' => 1,
                        'name' => substr($displayName, 0, 50),
                    ];
                })->toArray();

                if (empty($item_details)) {
                     throw new \Exception('Cannot create payment with no items.');
                }

                // Calculate expiry duration
                $now = Carbon::now();
                $orderDeadline = $order->payment_deadline;
                $midtransExpiryTime = $now->copy()->addHours(2);
                // ... (expiry logic remains the same)
                $duration = (int) $now->diffInMinutes($midtransExpiryTime);

                // Midtrans parameters
                $params = [
                    'transaction_details' => [
                        'order_id' => 'TRX-' . $transaction->id . '-' . time(),
                        'gross_amount' => (int) $transaction->gross_amount,
                    ],
                    'item_details' => $item_details,
                    'customer_details' => [
                        'first_name' => $order->user->name,
                        'email' => $order->user->email,
                    ],
                    'expiry' => [
                        'start_time' => $now->format('Y-m-d H:i:s O'),
                        'unit' => 'minute',
                        'duration' => $duration > 1 ? $duration : 1,
                    ],
                ];

                // Get Snap token and update transaction/order
                $snapToken = Snap::getSnapToken($params);
                $transaction->update(['snap_token' => $snapToken]);
                $order->update(['status' => 'processing']);

                return response()->json(['snap_token' => $snapToken]);
            });
        } catch (\Throwable $e) {
            Log::error('Payment creation failed for Order ID: ' . $order->id . ' - ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create payment transaction. Please try again later.'], 500);
        }
    }

    /**
     * Handles incoming notifications from Midtrans.
     */
    public function notificationHandler(Request $request)
    {
        Log::info('Midtrans notification received:', $request->all());

        try {
            $notification = new Notification();

            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status;
            $midtransOrderId = $notification->order_id;

            // Extract transaction ID from Midtrans order ID
            $orderIdParts = explode('-', $midtransOrderId);
            // ... (validation remains the same)
            $transactionId = $orderIdParts[1];

            $transaction = Transaction::find($transactionId);
            // ... (validation for transaction existence remains the same)
            if (!$transaction) {
                 Log::error('Midtrans webhook: Transaction not found.', ['transaction_id' => $transactionId]);
                 return response()->json(['message' => 'Transaction not found'], 404);
            }


            // Load related order and booking
            $transaction->load('order.booking.bookable');
            $order = $transaction->order;
             // ... (validation for order existence remains the same)
            if (!$order) {
                 Log::error('Midtrans webhook: Order not found for transaction.', ['transaction_id' => $transactionId]);
                 return response()->json(['message' => 'Order association missing'], 200); // 200 to Midtrans
            }


            // Prevent re-processing
            if ($transaction->status === 'settlement' || $transaction->status === 'failed') {
                Log::info('Midtrans webhook: Transaction already processed.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Transaction already processed.']);
            }

            // --- Main Update Logic ---
            DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus) {
                // Always update transaction details from notification
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse());

                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                    $transaction->status = 'settlement';

                    // ✅ THE FIX: Explicitly check the 'notes' field for 'down_payment'
                    $isDownPayment = ($transaction->notes === 'down_payment');

                    if ($isDownPayment && $order->status !== 'partially_paid') {
                        // This transaction was specifically for a down payment
                        $order->status = 'partially_paid';
                        if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'partial';
                        }
                        Log::info('Order ID ' . $order->id . ' status updated to partially_paid.');
                    } else {
                        // This transaction was for the full amount or the remaining balance
                        $order->status = 'paid';
                        if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'paid';
                        }
                        Log::info('Order ID ' . $order->id . ' status updated to paid.');
                    }

                // PENDING PAYMENT
                } else if ($transactionStatus == 'pending') {
                    $transaction->status = 'pending';
                    // Keep order status as 'processing' (or potentially 'pending' if not already processing)
                    if ($order->status === 'pending') {
                        $order->status = 'processing';
                    }
                    Log::info('Transaction ID ' . $transaction->id . ' is pending.');

                // FAILED/EXPIRED/DENIED PAYMENT
                } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                    $transaction->status = 'failed';

                    if ($order->status !== 'partially_paid' && $order->status !== 'paid') {
                        // Only fail the order if no prior payment was made
                        $order->status = 'failed';
                        if ($order->booking) {
                            $order->booking->status = 'cancelled';
                            $order->booking->payment_status = 'unpaid';
                        }
                        Log::info('Payment failed/expired for Order ID: ' . $order->id . '. Releasing availability.');
                        $this->releaseAvailability($order);
                    } else {
                        Log::warning('Balance payment failed for Order ID: ' . $order->id . '. Booking remains confirmed.');
                    }

                // UNHANDLED STATUS
                } else {
                     Log::warning('Midtrans webhook: Unhandled transaction status.', [/*...*/]);
                     $transaction->status = 'pending'; // Revert to pending if unknown
                }

                // Save changes
                $transaction->save();
                $order->save();
                if ($order->booking) {
                    $order->booking->save();
                }

            }); // End DB Transaction

            Log::info('Midtrans notification handled successfully for Transaction ID: ' . $transaction->id);
            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Exception $e) { // Catch standard exceptions during handling
            Log::error('Midtrans notification handler failed.', [
                'error_message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_content' => $request->getContent()
            ]);
            // Return 500 so Midtrans might retry
            return response()->json(['message' => 'An internal error occurred.'], 500);
        }
    }
    /**
     * Helper Function: Release availability for failed/cancelled orders.
     */
    protected function releaseAvailability(Order $order)
    {
        if ($order->booking && $order->booking->bookable instanceof CarRental) {
            $carRental = $order->booking->bookable;
            $startDate = $order->booking->start_date;
            $endDate = $order->booking->end_date;

            if ($startDate && $endDate) {
                try {
                    $affectedRows = CarRentalAvailability::where('car_rental_id', $carRental->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->where('status', 'booked') 
                        ->update(['status' => 'available']);
                        
                    Log::info('Released availability for CarRental ID: ' . $carRental->id . ' from ' . $startDate . ' to ' . $endDate . '. Rows affected: ' . $affectedRows);
                } catch (\Exception $e) {
                    Log::error('Failed to release availability for CarRental ID: ' . $carRental->id, [
                        'error' => $e->getMessage(),
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ]);
                }
            }
        }
    }
}