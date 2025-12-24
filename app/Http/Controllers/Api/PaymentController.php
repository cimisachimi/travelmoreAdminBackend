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
        if ($paymentOption === 'full_payment' || $order->status === 'partially_paid') {
            if ($order->status === 'partially_paid') {
                $amountToCharge = $order->total_amount - $order->down_payment_amount;
                $transactionNote = 'balance_payment';
                $isPartialPayment = true;
            } else {
                $amountToCharge = $order->total_amount;
                $transactionNote = 'full_payment';
                $isPartialPayment = false;
            }
        } else {
            $amountToCharge = $order->down_payment_amount;
            $transactionNote = 'down_payment';
            $isPartialPayment = true;

            if (empty($amountToCharge) || $amountToCharge <= 0 || $amountToCharge >= $order->total_amount) {
                 $amountToCharge = $order->total_amount;
                 $paymentOption = 'full_payment';
                 $transactionNote = 'full_payment';
                 $isPartialPayment = false;
            }
        }

        try {
            return DB::transaction(function () use ($order, $amountToCharge, $transactionNote, $isPartialPayment) {

                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'status' => 'pending',
                    'gross_amount' => round($amountToCharge), // Use round to prevent decimal issues
                    'notes' => $transactionNote,
                ]);

                $midtransOrderId = 'TRX-' . $transaction->id . '-' . time();
                $transaction->update(['transaction_code' => $midtransOrderId]);

                $item_details = [];

                if ($isPartialPayment) {
                    $item_details[] = [
                        'id'       => 'PAY-' . $transaction->id,
                        'price'    => (int) round($amountToCharge),
                        'quantity' => 1,
                        'name'     => $transactionNote === 'down_payment' ? "Down Payment (50%)" : "Remaining Balance",
                    ];
                } else {
                    // FULL PAYMENT: List items
                    foreach ($order->orderItems as $item) {
                        // Dynamically determine the item name based on the type
                        $itemName = 'Service Item';
                        $orderable = $item->orderable;

                        if ($orderable instanceof \App\Models\CarRental) {
                            $itemName = $orderable->brand . ' ' . $orderable->car_model;
                        } elseif ($orderable instanceof \App\Models\HolidayPackage || $orderable instanceof \App\Models\Activity || $orderable instanceof \App\Models\OpenTrip) {
                            $itemName = $orderable->title ?? $orderable->name ?? 'Travel Service';
                        }

                        $item_details[] = [
                            'id'       => 'ITEM-' . $item->id,
                            'price'    => (int) round($item->price),
                            'quantity' => (int) $item->quantity,
                            'name'     => substr($itemName, 0, 50),
                        ];
                    }

                    if ($order->discount_amount > 0) {
                        $item_details[] = [
                            'id'       => 'DISCOUNT',
                            'price'    => -((int) round($order->discount_amount)),
                            'quantity' => 1,
                            'name'     => 'Discount Applied',
                        ];
                    }
                }

                // Final safety check: sum of items must equal gross_amount
                $itemSum = array_reduce($item_details, function($carry, $item) {
                    return $carry + ($item['price'] * $item['quantity']);
                }, 0);

                if ($itemSum !== (int) round($amountToCharge)) {
                    Log::error("Midtrans Mismatch for Order {$order->id}: Items sum ($itemSum) != Gross Amount ($amountToCharge)");
                    // Force the gross_amount to match the item sum to avoid Midtrans 500 error
                    $transaction->update(['gross_amount' => $itemSum]);
                }

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
                    // We removed start_time to avoid server clock sync issues with Midtrans
                    'expiry' => [
                         'unit' => 'hour',
                         'duration' => 2,
                    ],
                ];

                $snapToken = Snap::getSnapToken($params);
                $transaction->update(['snap_token' => $snapToken]);
                $order->update(['status' => 'processing']);

                return response()->json(['snap_token' => $snapToken]);
            });
        } catch (\Throwable $e) {
            Log::error('Payment creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create payment transaction.'], 500);
        }
    }

    /**
     * Handles incoming notifications from Midtrans.
     */
    public function notificationHandler(Request $request)
{
    // Verifikasi Signature Key Midtrans
    $serverKey = config('midtrans.server_key');
    $hashed = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);

    if ($hashed !== $request->signature_key) {
        Log::error('Midtrans Webhook: Invalid Signature Key detected.');
        return response()->json(['message' => 'Invalid Signature'], 403);
    }

    try {
        $notification = new Notification();
        $transactionStatus = $notification->transaction_status;
        $fraudStatus = $notification->fraud_status;
        $midtransOrderId = $notification->order_id;

        // Ekstrak ID Transaksi dari format TRX-{ID}-{Timestamp}
        $orderIdParts = explode('-', $midtransOrderId);
        $transactionId = $orderIdParts[1];

        $transaction = Transaction::findOrFail($transactionId);
        $transaction->load('order.booking.bookable');
        $order = $transaction->order;

        if (!$order) {
            return response()->json(['message' => 'Order association missing'], 200);
        }

        // Jangan proses ulang jika status sudah final
        if (in_array($transaction->status, ['settlement', 'failed', 'expire', 'refund'])) {
            return response()->json(['message' => 'Transaction already processed.']);
        }

        $shouldNotifyAdmin = false;

        DB::transaction(function () use ($transaction, $order, $notification, $transactionStatus, $fraudStatus, &$shouldNotifyAdmin) {
            $transaction->payment_type = $notification->payment_type;
            $transaction->payment_payloads = json_encode($notification->getResponse());

            $finalOrderStatus = $order->status;
            $finalBookingStatus = optional($order->booking)->status;
            $finalBookingPaymentStatus = optional($order->booking)->payment_status;

            $isDownPayment = (trim($transaction->notes ?? '') === 'down_payment');

            // ✅ LOGIKA PEMBAYARAN BERHASIL
            if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $fraudStatus == 'accept')) {

                $transaction->status = 'settlement';

                // Simpan akumulasi jumlah yang dibayar ke database agar muncul di resi
                $order->paid_amount += $transaction->gross_amount;

                // Tentukan notifikasi admin hanya untuk pembayaran pertama (DP atau Full)
                if ($order->status !== 'paid' && $order->status !== 'partially_paid') {
                    $shouldNotifyAdmin = true;
                }

                if ($isDownPayment && $finalOrderStatus !== 'partially_paid') {
                    $finalOrderStatus = 'partially_paid';
                    if ($order->booking) {
                        $finalBookingStatus = 'confirmed';
                        $finalBookingPaymentStatus = 'partial';
                    }
                } else if (!$isDownPayment && $finalOrderStatus !== 'paid') {
                    $finalOrderStatus = 'paid';
                    if ($order->booking) {
                        $finalBookingStatus = 'confirmed';
                        $finalBookingPaymentStatus = 'paid';
                    }
                }

            // LOGIKA PENDING / GAGAL
            } else if ($transactionStatus == 'pending') {
                $transaction->status = 'pending';
                if ($finalOrderStatus === 'pending') $finalOrderStatus = 'processing';

            } else if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'])) {
                $transaction->status = 'failed';
                if ($finalOrderStatus !== 'partially_paid' && $finalOrderStatus !== 'paid') {
                    $finalOrderStatus = 'failed';
                    if ($order->booking) {
                        $finalBookingStatus = 'cancelled';
                        $finalBookingPaymentStatus = 'unpaid';
                    }
                    $this->releaseAvailability($order);
                }
            }

            // Simpan perubahan ke database
            $order->status = $finalOrderStatus;
            if ($order->booking) {
                $order->booking->status = $finalBookingStatus;
                $order->booking->payment_status = $finalBookingPaymentStatus;
                $order->booking->save();
            }

            $transaction->save();
            $order->save();

            // Update workflow TripPlanner jika perlu
            if ($order->status === 'paid' && $order->booking && $order->booking->bookable instanceof \App\Models\TripPlanner) {
                $order->booking->bookable->update(['status' => 'Waiting to Start', 'payment_status' => 'Paid']);
            }
        });

        // ✅ KIRIM NOTIFIKASI EMAIL
        if ($shouldNotifyAdmin) {
            try {
                $admins = User::where('role', User::ROLE_ADMIN)->get();
                if ($admins->count() > 0) {
                    LaravelNotification::send($admins, new \App\Notifications\NewOrderAdminNotification($order));
                }

                // Kirim Resi ke Customer (paid_amount sekarang sudah terisi)
                $order->user->notify(new \App\Notifications\OrderReceiptNotification($order));
                Log::info('Email resi berhasil dikirim untuk Order #' . $order->order_number);

            } catch (\Exception $e) {
                Log::error('Gagal mengirim email: ' . $e->getMessage());
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
