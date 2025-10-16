<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
     * Creates a new Order and Transaction for a specific Booking to generate a Midtrans Snap Token.
     */
    public function createTransaction(Request $request)
    {
        $request->validate(['booking_id' => 'required|exists:bookings,id']);

        $booking = Booking::with('user', 'bookable')->findOrFail($request->booking_id);

        if ($request->user()->id !== $booking->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->status === 'confirmed') {
            return response()->json(['message' => 'This booking has already been paid and confirmed.'], 409);
        }

        try {
            return DB::transaction(function () use ($booking) {
                $order = Order::create([
                    'user_id' => $booking->user_id,
                    'booking_id' => $booking->id,
                    'order_number' => 'ORD-' . strtoupper(uniqid()),
                    'status' => 'pending',
                    'total_amount' => $booking->total_price,
                ]);

                $order->orderItems()->create([
                    'orderable_id' => $booking->bookable_id,
                    'orderable_type' => $booking->bookable_type,
                    'price' => $booking->total_price,
                ]);

                $transaction = Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $booking->user_id,
                    'status' => 'pending',
                    'gross_amount' => $order->total_amount,
                ]);

                $itemName = $booking->bookable->name ?? ($booking->bookable->brand . ' ' . $booking->bookable->car_model);
                $params = [
                    'transaction_details' => [
                        'order_id' => 'TRX-' . $transaction->id . '-' . time(),
                        'gross_amount' => $transaction->gross_amount,
                    ],
                    'item_details' => [[
                        'id' => $booking->bookable->id,
                        'price' => $booking->total_price,
                        'quantity' => 1,
                        'name' => $itemName,
                    ]],
                    'customer_details' => [
                        'first_name' => $booking->user->name,
                        'email' => $booking->user->email,
                    ],
                ];

                $snapToken = Snap::getSnapToken($params);
                $transaction->update(['snap_token' => $snapToken]);

                return response()->json(['snap_token' => $snapToken]);
            });
        } catch (\Exception $e) {
            Log::error('Payment creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create payment transaction.'], 500);
        }
    }

    /**
     * Handles incoming webhook notifications from Midtrans.
     */
    public function notificationHandler(Request $request)
    {
        // Log the raw incoming request for debugging
        Log::info('Midtrans notification received:', $request->all());

        try {
            // ✅ FIX: Pass the request payload to the Notification constructor
            $notification = new Notification($request->all());

            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status;
            $orderId = $notification->order_id;

            $orderIdParts = explode('-', $orderId);
            if (count($orderIdParts) < 2 || $orderIdParts[0] !== 'TRX') {
                Log::warning('Midtrans webhook: Invalid order_id format.', ['order_id' => $orderId]);
                return response()->json(['message' => 'Invalid order ID format'], 400);
            }
            $transactionId = $orderIdParts[1];

            $transaction = Transaction::with('order.booking')->find($transactionId);

            if (!$transaction || !$transaction->order) {
                Log::error('Midtrans webhook: Transaction or Order not found.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            if ($transaction->status !== 'pending') {
                Log::info('Midtrans webhook: Transaction already processed.', ['transaction_id' => $transactionId]);
                return response()->json(['message' => 'Transaction already processed.']);
            }

            DB::transaction(function () use ($transaction, $notification, $transactionStatus, $fraudStatus) {
                $transaction->payment_type = $notification->payment_type;
                $transaction->payment_payloads = json_encode($notification->getResponse());

                if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                    if ($fraudStatus == 'accept') {
                        $transaction->status = 'settlement';
                        $transaction->order->status = 'paid';

                        if ($transaction->order->booking) {
                            $booking = $transaction->order->booking;
                            $booking->payment_status = 'paid';
                            $booking->status = 'confirmed';
                            $booking->save();
                        }
                    }
                } else if (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                    $transaction->status = 'failed';
                    $transaction->order->status = 'failed';
                }

                $transaction->save();
                $transaction->order->save();

                Log::info('Midtrans webhook: Processed successfully.', ['transaction_id' => $transaction->id]);
            });

            // Return a 200 OK response to Midtrans
            return response()->json(['message' => 'Notification handled successfully.'], 200);

        } catch (\Exception $e) {
            Log::error('Midtrans notification handler failed.', [
                'error_message' => $e->getMessage(),
                'request_content' => $request->all()
            ]);
            // Return a server error response
            return response()->json(['message' => 'An error occurred.'], 500);
        }
    }
}