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

            // Extract transaction ID
            $orderIdParts = explode('-', $midtransOrderId);
            if (count($orderIdParts) < 2 || $orderIdParts[0] !== 'TRX') {
                Log::warning('Midtrans webhook: Invalid order_id format.', ['order_id' => $midtransOrderId]);
                return response()->json(['message' => 'Invalid order ID format'], 400);
            }
            $transactionId = $orderIdParts[1];

            // Use findOrFail to ensure transaction exists or throw an error
            $transaction = Transaction::findOrFail($transactionId);

            $transaction->load('order.booking.bookable');
            $order = $transaction->order;
            // Use findOrFail earlier, but double-check association
            if (!$order) {
                Log::error('Midtrans webhook: Order not found for transaction.', ['transaction_id' => $transactionId]);
                // Still return 200 to Midtrans to avoid retries, but log the error.
                return response()->json(['message' => 'Order association missing'], 200);
            }

            // Prevent re-processing an already settled/failed transaction
            if (in_array($transaction->status, ['settlement', 'failed', 'expire'])) {
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

                // Determine the correct final statuses, default to current
                $finalTransactionStatus = $transaction->status;
                $finalOrderStatus = $order->status;
                $finalBookingStatus = optional($order->booking)->status; // Use optional() helper
                $finalBookingPaymentStatus = optional($order->booking)->payment_status; // Use optional() helper

                // --- DETAILED DEBUGGING BLOCK ---
                $currentTransactionNotes = $transaction->notes;
                $currentOrderSatus = $order->status;
                $noteType = gettype($currentTransactionNotes);
                $expectedNote = 'down_payment';
                $trimmedNote = trim($currentTransactionNotes ?? '');
                $areNotesEqual = ($trimmedNote === $expectedNote);

                Log::debug("[Txn ID: {$transaction->id}] --- DEBUG START ---");
                Log::debug("[Txn ID: {$transaction->id}] Raw Notes: ", [$currentTransactionNotes]); // Log raw value maybe it's not string
                Log::debug("[Txn ID: {$transaction->id}] Type of Notes: {$noteType}");
                Log::debug("[Txn ID: {$transaction->id}] Trimmed Notes: '{$trimmedNote}'");
                Log::debug("[Txn ID: {$transaction->id}] Expected Note: '{$expectedNote}'");
                Log::debug("[Txn ID: {$transaction->id}] Are Notes Equal (trimmed === 'down_payment')? " . ($areNotesEqual ? 'YES' : 'NO'));
                Log::debug("[Txn ID: {$transaction->id}] Current Order Status: '{$currentOrderSatus}'");
                Log::debug("[Txn ID: {$transaction->id}] --- DEBUG END ---");
                // --- END DETAILED DEBUGGING BLOCK ---


                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                    $finalTransactionStatus = 'settlement';
                    $isDownPayment = $areNotesEqual; // Use the result from debug block

                    Log::info("[Txn ID: {$transaction->id}] Processing successful payment based on debug check. Is Down Payment? " . ($isDownPayment ? 'YES' : 'NO'));

                    // Condition 1: It IS a down payment AND the order isn't already partially paid
                    if ($isDownPayment && $finalOrderStatus !== 'partially_paid') {
                        $finalOrderStatus = 'partially_paid';
                        if ($order->booking) {
                            $finalBookingStatus = 'confirmed';
                            $finalBookingPaymentStatus = 'partial';
                        }
                        Log::info("[Txn ID: {$transaction->id}] Order ID {$order->id} status WILL BE updated to partially_paid.");
                    }
                    // Condition 2: It's NOT a down payment AND the order isn't already paid
                    else if (!$isDownPayment && $finalOrderStatus !== 'paid') {
                        $finalOrderStatus = 'paid';
                        if ($order->booking) {
                            $finalBookingStatus = 'confirmed';
                            $finalBookingPaymentStatus = 'paid';
                        }
                        Log::info("[Txn ID: {$transaction->id}] Order ID {$order->id} status WILL BE updated to paid.");
                    }
                    // Condition 3: Status doesn't need changing (already correct or duplicate notification)
                    else {
                         Log::info("[Txn ID: {$transaction->id}] Order ID {$order->id} status ('{$finalOrderStatus}') requires no change for this payment type.");
                    }

                // PENDING PAYMENT
                } else if ($transactionStatus == 'pending') {
                    $finalTransactionStatus = 'pending';
                    if ($finalOrderStatus === 'pending') { // Only from initial pending state
                        $finalOrderStatus = 'processing';
                    }
                    Log::info("[Txn ID: {$transaction->id}] Payment is pending.");

                // FAILED/EXPIRED/DENIED PAYMENT
                } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                    $finalTransactionStatus = 'failed';
                    // Only fail the order if no payment (down payment or full) was successful before
                    if ($finalOrderStatus !== 'partially_paid' && $finalOrderStatus !== 'paid') {
                        $finalOrderStatus = 'failed';
                        if ($order->booking) {
                            $finalBookingStatus = 'cancelled';
                            $finalBookingPaymentStatus = 'unpaid';
                        }
                        Log::info("[Txn ID: {$transaction->id}] Payment failed/expired for Order ID {$order->id}. Releasing availability.");
                        $this->releaseAvailability($order);
                    } else {
                        // e.g., Balance payment failed, but DP was successful. Keep order status.
                        Log::warning("[Txn ID: {$transaction->id}] Failed payment for Order ID {$order->id}, but order status is '{$finalOrderStatus}'. No status change.");
                    }

                // UNHANDLED STATUS
                } else {
                     Log::warning("[Txn ID: {$transaction->id}] Unhandled Midtrans status: '{$transactionStatus}'. Keeping transaction as pending.");
                     $finalTransactionStatus = 'pending';
                }

                // Apply the determined statuses
                $transaction->status = $finalTransactionStatus;
                $order->status = $finalOrderStatus;
                if ($order->booking) {
                    // Only update booking if status changed
                    if ($finalBookingStatus !== $order->booking->status) {
                         $order->booking->status = $finalBookingStatus;
                    }
                    if ($finalBookingPaymentStatus !== $order->booking->payment_status) {
                         $order->booking->payment_status = $finalBookingPaymentStatus;
                    }
                }

                // Save changes
                $transaction->save();
                $order->save();
                if ($order->booking && $order->booking->isDirty()) { // Save booking only if it changed
                    $order->booking->save();
                }

            }); // End DB Transaction

            Log::info('Midtrans notification handled successfully for Transaction ID: ' . $transaction->id);
            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
             Log::error('Midtrans webhook: Transaction not found via findOrFail.', ['transaction_id' => $transactionId ?? null]);
             return response()->json(['message' => 'Transaction not found.'], 404);
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