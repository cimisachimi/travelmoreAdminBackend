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

    public function createTransaction(Request $request)
    {
        $request->validate(['booking_id' => 'required|exists:bookings,id']);

        $booking = Booking::with('user', 'bookable')->findOrFail($request->booking_id);

        if ($request->user()->id !== $booking->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Use a database transaction to ensure all records are created or none are.
        return DB::transaction(function () use ($booking) {
            // Step 1: Create an Order from the Booking
            $order = Order::create([
                'user_id' => $booking->user_id,
                'total_amount' => $booking->total_price,
                'status' => 'pending',
            ]);

            // Step 2: Create an OrderItem linking the bookable item (e.g., CarRental) to the Order
            $order->orderItems()->create([
                'orderable_id' => $booking->bookable_id,
                'orderable_type' => $booking->bookable_type,
                'price' => $booking->total_price,
            ]);

            // Step 3: Create a Transaction linked to the new Order
            $transaction = $order->transaction()->create([
                'user_id' => $booking->user_id,
                'gross_amount' => $order->total_amount,
                'status' => 'pending',
            ]);

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

            $snapToken = Snap::getSnapToken($params);
            $transaction->update(['snap_token' => $snapToken]);

            return response()->json(['snap_token' => $snapToken]);
        });
    }
    /**
     * ✅ ADDED: Handles incoming webhooks from Midtrans.
     * This is ESSENTIAL for confirming payments.
     */
    public function notificationHandler(Request $request)
    {
        try {
            $notif = new Notification();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process notification'], 500);
        }

        $transactionStatus = $notif->transaction_status;
        $fraudStatus = $notif->fraud_status;
        $transactionId = explode('-', $notif->order_id)[1];

        $transaction = Transaction::find($transactionId);

        if (!$transaction || !$transaction->booking) {
            return response()->json(['message' => 'Transaction or booking not found'], 404);
        }

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            if ($fraudStatus == 'accept') {
                $transaction->status = 'settlement';
                $transaction->booking->payment_status = 'paid';
                $transaction->booking->status = 'confirmed';
            }
        } else if (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $transaction->status = 'failed';
            $transaction->booking->payment_status = 'failed';
        }

        $transaction->booking->save();
        $transaction->save();

        return response()->json(['message' => 'Notification handled']);
    }

    public function createOrderTransaction(Request $request, Order $order)
    {
        if ($request->user()->id !== $order->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->transaction && $order->transaction->status === 'paid') {
            return response()->json(['message' => 'This order has already been paid.'], 409);
        }

        $params = [
            'transaction_details' => [
                'order_id' => 'ORDER-' . $order->id . '-' . time(),
                'gross_amount' => $order->total_amount,
            ],
            'customer_details' => [
                'first_name' => $order->user->name,
                'email' => $order->user->email,
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return response()->json(['snap_token' => $snapToken]);
    }
}