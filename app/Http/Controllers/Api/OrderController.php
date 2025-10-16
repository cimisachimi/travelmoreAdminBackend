<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Booking;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class OrderController extends Controller
{
    /**
     * 🧾 Store a new order linked to a booking.
     */
    public function store(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
        ]);

        $user = Auth::user();

        try {
            // Load booking and its polymorphic relation
            $booking = Booking::with('bookable')->findOrFail($request->booking_id);

            // 🛑 Ensure booking has a related bookable model (e.g. CarRental)
            if (!$booking->bookable) {
                return response()->json([
                    'error' => 'Booking has no associated bookable model.'
                ], 400);
            }

            // 🟡 Prevent duplicate order creation for the same booking
            if (Order::where('booking_id', $booking->id)->exists()) {
                return response()->json([
                    'message' => 'Order already exists for this booking.'
                ], 409);
            }

            // ✅ Create a new order with proper polymorphic linkage
            $order = Order::create([
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'total_amount' => $booking->total_price,
                'status' => 'pending',
                'orderable_id' => $booking->bookable->id,
                'orderable_type' => get_class($booking->bookable),
            ]);

            // ✅ Automatically create a related transaction
            $transaction = Transaction::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'amount' => $order->total_amount,
                'status' => 'pending',
                'transaction_code' => strtoupper(Str::random(10)),
            ]);

            // ✅ Update booking statuses for consistency
            $booking->update([
                'status' => 'processing',
                'payment_status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Order created successfully.',
                'order' => $order->load(['booking.bookable', 'transaction']),
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Booking not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create order.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 📋 Get all orders for the authenticated user.
     */
    public function index()
    {
        $user = Auth::user();

        $orders = Order::with(['booking.bookable', 'transaction'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * 🧠 Show a specific order (optional, useful for order details page)
     */
    public function show($id)
    {
        $user = Auth::user();

        $order = Order::with(['booking.bookable', 'transaction'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json($order);
    }
}
