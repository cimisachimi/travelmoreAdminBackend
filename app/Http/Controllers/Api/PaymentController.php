<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    /**
     * Creates an Order and a Transaction from a Booking to generate a Midtrans Snap Token.
     */
    public function createTransaction(Request $request)
{
    $request->validate(['booking_id' => 'required|exists:bookings,id']);

    $booking = Booking::with('user', 'bookable')->findOrFail($request->booking_id);

    if ($request->user()->id !== $booking->user_id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    try {
        return DB::transaction(function () use ($booking) {

            // Step 1️⃣ — Find existing pending order for this user & same bookable item
            $order = \App\Models\Order::where('user_id', $booking->user_id)
                ->where('status', 'pending')
                ->whereHas('orderItems', function ($query) use ($booking) {
                    $query->where('orderable_id', $booking->bookable_id)
                          ->where('orderable_type', $booking->bookable_type);
                })
                ->first();

            if (!$order) {
                // Create new order if not found
                $order = \App\Models\Order::create([
                    'user_id' => $booking->user_id,
                    'order_number' => 'ORD-' . strtoupper(uniqid()),
                    'status' => 'pending',
                    'total_amount' => $booking->total_price,
                ]);

                // Add related order item
                $order->orderItems()->create([
                    'orderable_id' => $booking->bookable_id,
                    'orderable_type' => $booking->bookable_type,
                    'price' => $booking->total_price,
                ]);
            }

            // Step 2️⃣ — Find existing or create new transaction
            $transaction = \App\Models\Transaction::firstOrCreate(
                [
                    'order_id' => $order->id,
                    'user_id' => $booking->user_id,
                    'status' => 'pending',
                ],
                [
                    'gross_amount' => $order->total_amount,
                ]
            );

            // If Snap token already exists, reuse it
            if ($transaction->snap_token) {
                return response()->json(['snap_token' => $transaction->snap_token]);
            }

            // Step 3️⃣ — Create Midtrans payment request
            $params = [
                'transaction_details' => [
                    'order_id' => 'TRX-' . $transaction->id . '-' . time(),
                    'gross_amount' => $transaction->gross_amount,
                ],
                'customer_details' => [
                    'first_name' => $booking->user->name,
                    'email' => $booking->user->email,
                ],
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($params);
            $transaction->update(['snap_token' => $snapToken]);

            return response()->json(['snap_token' => $snapToken]);
        });

    } catch (\Exception $e) {
        \Log::error('Payment creation failed: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to create payment transaction.'], 500);
    }
}


    /**
     * Handles incoming webhook notifications from Midtrans.
     */
    public function notificationHandler(Request $request)
    {
        try {
            $notif = new Notification();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid notification'], 400);
        }

        $transactionStatus = $notif->transaction_status;
        $fraudStatus = $notif->fraud_status;
        $orderIdParts = explode('-', $notif->order_id);
        $transactionId = $orderIdParts[1];

        $transaction = Transaction::with('order.orderable')->find($transactionId);

        if (!$transaction || !$transaction->order) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            if ($fraudStatus == 'accept') {
                $transaction->status = 'settlement';
                $transaction->order->status = 'paid';
                
                // You can also update the original booking status if needed
                $booking = Booking::where('bookable_id', $transaction->order->orderable_id)
                    ->where('bookable_type', $transaction->order->orderable_type)
                    ->first();
                if ($booking) {
                    $booking->payment_status = 'paid';
                    $booking->status = 'confirmed';
                    $booking->save();
                }
            }
        } else if (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $transaction->status = 'failed';
            $transaction->order->status = 'failed';
        }
        
        $transaction->order->save();
        $transaction->save();

        return response()->json(['message' => 'Notification handled']);
    }
}