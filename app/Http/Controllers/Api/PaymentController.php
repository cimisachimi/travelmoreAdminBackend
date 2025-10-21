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

        if ($order->payment_deadline && $order->payment_deadline->isPast() && $order->status !== 'partially_paid') {
            return response()->json(['message' => 'The payment deadline for this order has passed.'], 409);
        }
        if ($order->status === 'paid') {
            return response()->json(['message' => 'This order has already been paid.'], 409);
        }
        if ($order->status === 'partially_paid' && $paymentOption === 'down_payment') {
            return response()->json(['message' => 'Down payment has already been made for this order.'], 409);
        }

        $amountToCharge = 0;
        $itemNameSuffix = '';

        if ($paymentOption === 'full_payment') {
            if ($order->status === 'partially_paid') {
                $amountToCharge = $order->total_amount - $order->down_payment_amount;
                $itemNameSuffix = '-BAL';
            } else {
                $amountToCharge = $order->total_amount;
            }
        } else {
            $amountToCharge = $order->down_payment_amount;
            $itemNameSuffix = '-DP';

            if (empty($amountToCharge) || $amountToCharge <= 0) {
                Log::warning('Order ID ' . $order->id . ' has no down_payment_amount. Defaulting to full price.');
                $amountToCharge = $order->total_amount;
                $paymentOption = 'full_payment';
                $itemNameSuffix = '';
            }
        }

        if ($amountToCharge <= 0) {
            return response()->json(['message' => 'Invalid payment amount calculation.'], 400);
        }

        try {
            return DB::transaction(function () use ($order, $amountToCharge, $paymentOption, $itemNameSuffix) {
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => $amountToCharge,
                    'notes' => $paymentOption,
                ]);

                $item_details = $order->orderItems->map(function ($item) use ($amountToCharge, $paymentOption, $itemNameSuffix, $order) {
                    $itemName = 'Unknown Item';
                    if ($item->orderable instanceof CarRental) {
                        $itemName = $item->orderable->brand . ' ' . $item->orderable->car_model;
                    }
                    elseif (isset($item->orderable->name)) {
                         $itemName = $item->orderable->name;
                    }

                    $displayName = $itemName;
                    if ($paymentOption === 'down_payment') {
                        $displayName = 'DP (50%) for ' . $itemName;
                    } elseif ($paymentOption === 'full_payment' && $order->status === 'partially_paid') {
                        $displayName = 'Balance for ' . $itemName;
                    }

                    return [
                        'id' => $item->orderable_type . '-' . $item->orderable_id . $itemNameSuffix,
                        'price' => (int) $amountToCharge,
                        'quantity' => 1,
                        'name' => substr($displayName, 0, 50),
                    ];
                })->toArray();
                
                if (empty($item_details)) {
                     Log::error('Order ID ' . $order->id . ' has no items for Midtrans payment.');
                     throw new \Exception('Cannot create payment with no items.');
                }

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
                // This is correct: set status to 'processing'
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
     * ✅ THIS IS THE METHOD THAT FIXES YOUR PROBLEM
     */
    public function notificationHandler(Request $request)
    {
        Log::info('Midtrans notification received:', $request->all());

        try {
            $notification = new Notification();

            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status;
            $midtransOrderId = $notification->order_id; 

            $orderIdParts = explode('-', $midtransOrderId);
            if (count($orderIdParts) < 2 || $orderIdParts[0] !== 'TRX') {
                Log::warning('Midtrans webhook: Invalid order_id format received.', ['order_id' => $midtransOrderId]);
                return response()->json(['message' => 'Invalid order ID format'], 400);
            }
            $transactionId = $orderIdParts[1];

            $transaction = Transaction::find($transactionId);

            if (!$transaction) {
                Log::error('Midtrans webhook: Transaction not found.', ['transaction_id' => $transactionId, 'midtrans_order_id' => $midtransOrderId]);
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            $transaction->load('order.booking.bookable');
            $order = $transaction->order; 

            if (!$order) {
                Log::error('Midtrans webhook: Order not found for transaction.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Order association missing'], 200);
            }

            // Prevent re-processing an already handled transaction
            if ($transaction->status === 'settlement' || $transaction->status === 'failed') {
                Log::info('Midtrans webhook: Transaction already processed.', ['transaction_id' => $transactionId, 'current_status' => $transaction->status]);
                return response()->json(['message' => 'Transaction already processed.']);
            }

            DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus) {
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse()); 

                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {
                    
                    $transaction->status = 'settlement';
                    
                    // Check if this was a Down Payment or Full Payment
                    $isDownPayment = ($transaction->notes === 'down_payment');
                    
                    if ($isDownPayment && $order->status !== 'partially_paid') {
                        // This was a Down Payment
                        $order->status = 'partially_paid'; 
                        if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'partial';
                        }
                    } else { 
                        // This was a Full Payment (or remaining balance)
                        $order->status = 'paid';
                         if ($order->booking) {
                            $order->booking->status = 'confirmed';
                            $order->booking->payment_status = 'paid';
                        }
                    }

                // ✅ PENDING PAYMENT
                } else if ($transactionStatus == 'pending') {
                    $transaction->status = 'pending';
                    // We keep the ORDER status as 'processing'
                    // No change needed to the $order object here.
                    
                // ✅ FAILED/EXPIRED/DENIED PAYMENT
                } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                    $transaction->status = 'failed';
                    
                    // Only fail the order if a DP hasn't already been paid
                    if ($order->status !== 'partially_paid' && $order->status !== 'paid') {
                        $order->status = 'failed';
                        if ($order->booking) {
                             $order->booking->status = 'cancelled';
                             $order->booking->payment_status = 'unpaid';
                        }
                        
                        Log::info('Payment failed/expired for Order ID: ' . $order->id . '. Releasing availability.');
                        $this->releaseAvailability($order);
                    } else {
                        // A DP was paid, but the final balance payment failed.
                        // We don't cancel the booking, just log it.
                        Log::warning('Balance payment failed for Order ID: ' . $order->id . '. Booking remains confirmed.');
                    }
                } else {
                     Log::warning('Midtrans webhook: Unhandled transaction status.', [
                        'transaction_id' => $transaction->id,
                        'midtrans_status' => $transactionStatus,
                        'fraud_status' => $fraudStatus,
                    ]);
                     $transaction->status = 'pending'; // Default to pending
                }

                $transaction->save();
                $order->save(); // This will save 'paid' or 'partially_paid'
                if ($order->booking) {
                    $order->booking->save(); // This saves 'confirmed'
                }

            });

            Log::info('Midtrans notification handled successfully for Transaction ID: ' . $transaction->id);
            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Exception $e) {
            Log::error('Midtrans notification handler failed.', [
                'error_message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(), 
                'request_content' => $request->getContent()
            ]);
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