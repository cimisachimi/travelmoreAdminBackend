<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Set your Merchant Server Key
        Config::$serverKey = config('midtrans.server_key');
        // Set to Development/Sandbox Environment (default). Set to true for Production Environment.
        Config::$isProduction = config('midtrans.is_production');
        // Set sanitization on (default)
        Config::$isSanitized = true;
        // Set 3DS transaction for credit card to true
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
}