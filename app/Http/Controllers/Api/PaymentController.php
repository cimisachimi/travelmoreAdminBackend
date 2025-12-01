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
            $transactionNote = 'down_payment';

            if (empty($amountToCharge) || $amountToCharge <= 0) {
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
                // 1. Create the Transaction first
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => $amountToCharge,
                    'notes' => $transactionNote,
                ]);

                // 2. Generate the unique Midtrans Order ID
                // We use the Transaction ID to ensure uniqueness and match the webhook logic
                $midtransOrderId = 'TRX-' . $transaction->id . '-' . time();

                // 3. IMPORTANT: Save this code to the database immediately
                $transaction->update(['transaction_code' => $midtransOrderId]);

                // 4. Prepare Items
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
                        'id' => class_basename($item->orderable_type) . '-' . $item->orderable_id . $itemNameSuffix,
                        'price' => (int) $amountToCharge,
                        'quantity' => 1,
                        'name' => substr($displayName, 0, 50),
                    ];
                 })->toArray();

                if (empty($item_details)) {
                     throw new \Exception('Cannot create payment with no items.');
                }

                // 5. Calculate Expiry
                $now = Carbon::now();
                $orderDeadline = $order->payment_deadline;
                $midtransExpiryTime = $now->copy()->addHours(2);
                if ($orderDeadline && $orderDeadline->isAfter($now) && $orderDeadline->lt($midtransExpiryTime)) {
                    $midtransExpiryTime = $orderDeadline;
                } elseif ($orderDeadline && $orderDeadline->isPast()) {
                    throw new \Exception('Payment deadline has passed.');
                }
                $duration = (int) $now->diffInMinutes($midtransExpiryTime);

                // 6. Request Snap Token using the SAVED $midtransOrderId
                $params = [
                    'transaction_details' => [
                        'order_id' => $midtransOrderId, // <--- Using the saved ID
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

            // Extract transaction ID
            // Format is TRX-{TransactionID}-{Timestamp}
            $orderIdParts = explode('-', $midtransOrderId);
            if (count($orderIdParts) < 2 || $orderIdParts[0] !== 'TRX') {
                Log::warning('Midtrans webhook: Invalid order_id format.', ['order_id' => $midtransOrderId]);
                return response()->json(['message' => 'Invalid order ID format'], 400);
            }
            $transactionId = $orderIdParts[1];

            // Use findOrFail to ensure transaction exists
            $transaction = Transaction::findOrFail($transactionId);

            // Optional: Verify that the transaction_code matches if you want extra security
            // if ($transaction->transaction_code !== $midtransOrderId) { ... }

            $transaction->load('order.booking.bookable');
            $order = $transaction->order;

            if (!$order) {
                Log::error('Midtrans webhook: Order not found for transaction.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Order association missing'], 200);
            }

            // Prevent re-processing an already settled/failed transaction
            if (in_array($transaction->status, ['settlement', 'failed', 'expire', 'refund'])) {
                Log::info('Midtrans webhook: Transaction already processed.', [
                    'transaction_id' => $transactionId,
                    'status' => $transaction->status
                ]);
                return response()->json(['message' => 'Transaction already processed.']);
            }

            // --- Main Update Logic ---
            DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus) {
                // Always update transaction details from the notification
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse());

                // Determine the correct final statuses
                $finalTransactionStatus = $transaction->status;
                $finalOrderStatus = $order->status;
                $finalBookingStatus = optional($order->booking)->status;
                $finalBookingPaymentStatus = optional($order->booking)->payment_status;

                $currentTransactionNotes = $transaction->notes;
                $areNotesEqual = (trim($currentTransactionNotes ?? '') === 'down_payment');

                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                    $finalTransactionStatus = 'settlement';
                    $isDownPayment = $areNotesEqual;

                    if ($isDownPayment && $finalOrderStatus !== 'partially_paid') {
                        $finalOrderStatus = 'partially_paid';
                        if ($order->booking) {
                            $finalBookingStatus = 'confirmed';
                            $finalBookingPaymentStatus = 'partial';
                        }
                    }
                    else if (!$isDownPayment && $finalOrderStatus !== 'paid') {
                        $finalOrderStatus = 'paid';
                        if ($order->booking) {
                            $finalBookingStatus = 'confirmed';
                            $finalBookingPaymentStatus = 'paid';
                        }
                    }

                // PENDING PAYMENT
                } else if ($transactionStatus == 'pending') {
                    $finalTransactionStatus = 'pending';
                    if ($finalOrderStatus === 'pending') {
                        $finalOrderStatus = 'processing';
                    }

                // FAILED/EXPIRED/DENIED PAYMENT
                } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                    $finalTransactionStatus = 'failed';
                    if ($finalOrderStatus !== 'partially_paid' && $finalOrderStatus !== 'paid') {
                        $finalOrderStatus = 'failed';
                        if ($order->booking) {
                            $finalBookingStatus = 'cancelled';
                            $finalBookingPaymentStatus = 'unpaid';
                        }
                        $this->releaseAvailability($order);
                    }
                } else {
                     $finalTransactionStatus = 'pending';
                }

                // Apply the determined statuses
                $transaction->status = $finalTransactionStatus;
                $order->status = $finalOrderStatus;
                if ($order->booking) {
                    if ($finalBookingStatus !== $order->booking->status) {
                         $order->booking->status = $finalBookingStatus;
                    }
                    if ($finalBookingPaymentStatus !== $order->booking->payment_status) {
                         $order->booking->payment_status = $finalBookingPaymentStatus;
                    }
                }

                $transaction->save();
                $order->save();
                if ($order->booking && $order->booking->isDirty()) {
                    $order->booking->save();
                }
            });

            Log::info('Midtrans notification handled successfully for Transaction ID: ' . $transaction->id);
            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
             Log::error('Midtrans webhook: Transaction not found via findOrFail.', ['transaction_id' => $transactionId ?? null]);
             return response()->json(['message' => 'Transaction not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Midtrans notification handler failed.', [
                'error_message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_content' => $request->getContent()
            ]);
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
                    CarRentalAvailability::where('car_rental_id', $carRental->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->where('status', 'booked')
                        ->update(['status' => 'available']);
                } catch (\Exception $e) {
                    Log::error('Failed to release availability', ['error' => $e->getMessage()]);
                }
            }
        }
    }
}
