<?php

namespace App\Http{

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

        if ($request->user()->id !== $order->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        // ... (other status checks remain the same) ...

        $amountToCharge = 0;
        $itemNameSuffix = '';
        $transactionNote = '';

        if ($paymentOption === 'full_payment') {
            if ($order->status === 'partially_paid') {
                $amountToCharge = $order->total_amount - $order->down_payment_amount;
                $itemNameSuffix = '-BAL';
                $transactionNote = 'balance_payment';
            } else {
                $amountToCharge = $order->total_amount;
                $transactionNote = 'full_payment';
            }
        } else { // down_payment
            $amountToCharge = $order->down_payment_amount;
            $itemNameSuffix = '-DP';
            $transactionNote = 'down_payment'; // This should be saved correctly

            if (empty($amountToCharge) || $amountToCharge <= 0) {
                // ... (Fallback logic) ...
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
            return DB::transaction(function () use ($order, $amountToCharge, $paymentOption, $itemNameSuffix, $transactionNote) {
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => $amountToCharge,
                    'notes' => $transactionNote, // Save the note
                ]);

                // ... (Item details mapping logic) ...
                 $item_details = $order->orderItems->map(function ($item) use ($amountToCharge, $paymentOption, $itemNameSuffix, $order) {
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

                    return [
                        'id' => class_basename($item->orderable_type) . '-' . $item->orderable_id . $itemNameSuffix, // Use class_basename for shorter ID
                        'price' => (int) $amountToCharge,
                        'quantity' => 1,
                        'name' => substr($displayName, 0, 50),
                    ];
                 })->toArray();


                if (empty($item_details)) {
                     throw new \Exception('Cannot create payment with no items.');
                }

                // ... (Expiry calculation logic) ...
                $now = Carbon::now();
                $orderDeadline = $order->payment_deadline;
                $midtransExpiryTime = $now->copy()->addHours(2);
                if ($orderDeadline && $orderDeadline->isAfter($now) && $orderDeadline->lt($midtransExpiryTime)) {
                    $midtransExpiryTime = $orderDeadline;
                } elseif ($orderDeadline && $orderDeadline->isPast()) {
                    throw new \Exception('Payment deadline has passed.');
                }
                $duration = (int) $now->diffInMinutes($midtransExpiryTime);


                $params = [
                    'transaction_details' => [
                        'order_id' => 'TRX-' . $transaction->id . '-' . time(),
                        'gross_amount' => (int) $transaction->gross_amount,
                    ],
                    'item_details' => $item_details,
                    'customer_details' => [ /* ... */ ],
                    'expiry' => [
                         'start_time' => $now->format('Y-m-d H:i:s O'),
                         'unit' => 'minute',
                         'duration' => $duration > 1 ? $duration : 1,
                    ],
                ];

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

            // ... (Extract transactionId) ...
            $orderIdParts = explode('-', $midtransOrderId);
            if (count($orderIdParts) < 2 || $orderIdParts[0] !== 'TRX') { /*...*/ }
            $transactionId = $orderIdParts[1];

            $transaction = Transaction::find($transactionId);
            if (!$transaction) { /*...*/ }

            $transaction->load('order.booking.bookable');
            $order = $transaction->order;
            if (!$order) { /*...*/ }

            // Prevent re-processing
            if ($transaction->status === 'settlement' || $transaction->status === 'failed') { /*...*/ }

            // --- Main Update Logic ---
            DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus) {
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse());

                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                    $transaction->status = 'settlement';

                    // ✅ ADDED EXTRA LOGGING: Log the value of notes and current order status
                    Log::info("Processing successful payment for Txn ID: {$transaction->id}. Notes: '{$transaction->notes}'. Current Order Status: '{$order->status}'");

                    // Refined check: Use trim() just in case of extra spaces
                    $isDownPayment = (trim($transaction->notes) === 'down_payment');

                    if ($isDownPayment && $order->status !== 'partially_paid') {
                        // This transaction was specifically for a down payment
                        $order->status = 'partially_paid';
                        if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'partial';
                        }
                        Log::info('Order ID ' . $order->id . ' status updated to partially_paid.');

                    } else if ($order->status !== 'paid') { // Only update to 'paid' if not already 'paid'
                        // This transaction was for the full amount or the remaining balance
                        $order->status = 'paid';
                        if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'paid';
                        }
                        Log::info('Order ID ' . $order->id . ' status updated to paid.');
                    } else {
                         // Order was already paid (e.g., duplicate notification), log but do nothing.
                         Log::info('Order ID ' . $order->id . ' is already paid. No status change needed.');
                    }

                // ... (PENDING and FAILED logic remains the same) ...
                } else if ($transactionStatus == 'pending') {
                    $transaction->status = 'pending';
                    if ($order->status === 'pending') {
                        $order->status = 'processing';
                    }
                    Log::info('Transaction ID ' . $transaction->id . ' is pending.');

                } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                    $transaction->status = 'failed';
                    if ($order->status !== 'partially_paid' && $order->status !== 'paid') {
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
                } else {
                     Log::warning('Midtrans webhook: Unhandled transaction status.', [/*...*/]);
                     $transaction->status = 'pending';
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

        } catch (\Exception $e) {
            Log::error('Midtrans notification handler failed.', [ /*...*/ ]);
            return response()->json(['message' => 'An internal error occurred.'], 500);
        }
    }


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
}}