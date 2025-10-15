<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Set Midtrans configuration from your .env file
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }


    public function createTransaction(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
        ]);

        $booking = Booking::with('user', 'holidayPackage')->find($request->booking_id);

        // Prevent creating a new transaction if one already exists and is not failed
        $existingTransaction = Transaction::where('booking_id', $booking->id)->where('status', '!=', 'failed')->first();
        if ($existingTransaction && $existingTransaction->snap_token) {
            return response()->json(['snap_token' => $existingTransaction->snap_token]);
        }
        
        // Create a new transaction record
        $transaction = Transaction::create([
            'booking_id' => $booking->id,
            'gross_amount' => $booking->holidayPackage->price,
            'status' => 'pending',
        ]);

        $params = [
            'transaction_details' => [
                'order_id' => 'BOOKING-' . $booking->id . '-' . time(),
                'gross_amount' => $transaction->gross_amount,
            ],
            'customer_details' => [
                'first_name' => $booking->user->name,
                'email' => $booking->user->email,
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        // Update transaction with the Snap Token
        $transaction->update(['snap_token' => $snapToken]);

        return response()->json(['snap_token' => $snapToken]);
    }
    public function createOrderTransaction(Request $request, Order $order)
    {
        // Ensure the authenticated user owns this order
        if ($request->user()->id !== $order->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent re-paying for an already paid order
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
