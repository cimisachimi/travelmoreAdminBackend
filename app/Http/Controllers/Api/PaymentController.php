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
use App\Models\User;
use App\Notifications\NewOrderAdminNotification;
use Illuminate\Support\Facades\Notification as LaravelNotification;

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
        $transactionNote = '';
        $isPartialPayment = false;

        // --- 1. Determine Amount to Charge ---
        if ($paymentOption === 'full_payment') {
            if ($order->status === 'partially_paid') {
                $amountToCharge = $order->total_amount - $order->down_payment_amount;
                $transactionNote = 'balance_payment';
                $isPartialPayment = true;
            } else {
                $amountToCharge = $order->total_amount;
                $transactionNote = 'full_payment';
                $isPartialPayment = false;
            }
        } else { // down_payment
            $amountToCharge = $order->down_payment_amount;
            $transactionNote = 'down_payment';
            $isPartialPayment = true;

            // ✅ CHANGED: If DP is invalid OR equals/exceeds total, switch to full payment
            if (empty($amountToCharge) || $amountToCharge <= 0 || $amountToCharge >= $order->total_amount) {
                 $amountToCharge = $order->total_amount;
                 $paymentOption = 'full_payment';
                 $transactionNote = 'full_payment';
                 $isPartialPayment = false;
            }
        }

        if ($amountToCharge <= 0) {
            return response()->json(['message' => 'Invalid payment amount calculation.'], 400);
        }

        try {
            return DB::transaction(function () use ($order, $amountToCharge, $transactionNote, $isPartialPayment) {

                // 1. Create Transaction Record
                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => $amountToCharge,
                    'notes' => $transactionNote,
                ]);

                // 2. Generate Unique Midtrans ID
                $midtransOrderId = 'TRX-' . $transaction->id . '-' . time();
                $transaction->update(['transaction_code' => $midtransOrderId]);

                // 3. Prepare Items for Midtrans
                $item_details = [];

                if ($isPartialPayment) {
                    // For DP/Balance, send a SINGLE consolidated item.
                    $item_details[] = [
                        'id'       => 'PAY-' . $transaction->id,
                        'price'    => (int) $amountToCharge,
                        'quantity' => 1,
                        'name'     => $transactionNote === 'down_payment' ? "Down Payment (50%)" : "Remaining Balance",
                    ];
                } else {
                    // For Full Payment, list items with their prices
                    foreach ($order->orderItems as $item) {
                        $itemName = $item->name ?? 'Service';

                        // Fallback for older data without name
                        if ($item->orderable instanceof CarRental) {
                            $itemName = $item->orderable->brand . ' ' . $item->orderable->car_model;
                        }

                        $item_details[] = [
                            'id'       => 'ITEM-' . $item->id,
                            'price'    => (int) $item->price,
                            'quantity' => (int) $item->quantity,
                            'name'     => substr($itemName, 0, 50),
                        ];
                    }

                    // Midtrans requires sum(item_details) == gross_amount.
                    // If we have a discount, we must subtract it from the item list.
                    if ($order->discount_amount > 0) {
                        $item_details[] = [
                            'id'       => 'DISCOUNT',
                            'price'    => -((int) $order->discount_amount),
                            'quantity' => 1,
                            'name'     => 'Discount Applied',
                        ];
                    }
                }

                if (empty($item_details)) {
                     throw new \Exception('Cannot create payment with no items.');
                }

                // 4. Calculate Expiry
                $now = Carbon::now();
                $orderDeadline = $order->payment_deadline;
                $midtransExpiryTime = $now->copy()->addHours(2);

                if ($orderDeadline && $orderDeadline->isAfter($now) && $orderDeadline->lt($midtransExpiryTime)) {
                    $midtransExpiryTime = $orderDeadline;
                } elseif ($orderDeadline && $orderDeadline->isPast()) {
                    throw new \Exception('Payment deadline has passed.');
                }
                $duration = (int) $now->diffInMinutes($midtransExpiryTime);

                // 5. Request Snap Token
                $params = [
                    'transaction_details' => [
                        'order_id' => $midtransOrderId,
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

            $transaction = Transaction::findOrFail($transactionId);
            $transaction->load('order.booking.bookable');
            $order = $transaction->order;

            if (!$order) {
                Log::error('Midtrans webhook: Order not found.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Order association missing'], 200);
            }

            if (in_array($transaction->status, ['settlement', 'failed', 'expire', 'refund'])) {
                return response()->json(['message' => 'Transaction already processed.']);
            }

            // Flag to determine if we need to send an email (default false)
            $shouldNotifyAdmin = false;

            DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus, &$shouldNotifyAdmin) {
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse());

                $finalTransactionStatus = $transaction->status;
                $finalOrderStatus = $order->status;
                $finalBookingStatus = optional($order->booking)->status;
                $finalBookingPaymentStatus = optional($order->booking)->payment_status;

                $areNotesEqual = (trim($transaction->notes ?? '') === 'down_payment');

                // ✅ SUCCESSFUL PAYMENT
                if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                    $finalTransactionStatus = 'settlement';
                    $isDownPayment = $areNotesEqual;

                    // CHECK FOR NOTIFICATION:
                    // Only notify if the order wasn't already marked as paid/partial to avoid duplicates
                    if ($order->status !== 'paid' && $order->status !== 'partially_paid') {
                        $shouldNotifyAdmin = true;
                    }

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

                // PENDING / FAILED
                } else if ($transactionStatus == 'pending') {
                    $finalTransactionStatus = 'pending';
                    if ($finalOrderStatus === 'pending') {
                        $finalOrderStatus = 'processing';
                    }
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
                }

                $transaction->status = $finalTransactionStatus;
                $order->status = $finalOrderStatus;
                if ($order->booking) {
                    if ($finalBookingStatus !== $order->booking->status) $order->booking->status = $finalBookingStatus;
                    if ($finalBookingPaymentStatus !== $order->booking->payment_status) $order->booking->payment_status = $finalBookingPaymentStatus;
                }

                $transaction->save();
                $order->save();
                if ($order->booking && $order->booking->isDirty()) {
                    $order->booking->save();
                }
            });

            // ✅ SEND EMAIL NOTIFICATION
            if ($shouldNotifyAdmin) {
                try {
                    $admins = User::where('role', User::ROLE_ADMIN)->get();

                    if ($admins->count() > 0) {
                        LaravelNotification::send($admins, new NewOrderAdminNotification($order));
                        Log::info('Admin notification email queued for Order #' . $order->order_number);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send admin notification: ' . $e->getMessage());
                }
            }

            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Exception $e) {
            Log::error('Midtrans handler failed: ' . $e->getMessage());
            return response()->json(['message' => 'Internal error'], 500);
        }
    }

    protected function releaseAvailability(Order $order)
    {
        if ($order->booking && $order->booking->bookable instanceof CarRental) {
            $carRental = $order->booking->bookable;
            $startDate = $order->booking->start_date;
            $endDate = $order->booking->end_date;

            if ($startDate && $endDate) {
                CarRentalAvailability::where('car_rental_id', $carRental->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->where('status', 'booked')
                    ->update(['status' => 'available']);
            }
        }
    }
}
