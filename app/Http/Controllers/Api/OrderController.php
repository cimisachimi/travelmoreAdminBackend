<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * 📋 Get all orders for the authenticated user.
     *
     * This is the main endpoint for the "Purchase History" page.
     */
    public function index()
    {
        $user = Auth::user();

        // ✅ FIXED: Added 'discountCode' to eager loading
        $orders = Order::with([
                'booking.bookable',
                'transactions',
                'discountCode'
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * 🧠 Show a specific order.
     */
    public function show($id)
    {
        $user = Auth::user();

        // ✅ FIXED: Added 'discountCode' to eager loading
        $order = Order::with(['booking.bookable', 'transactions', 'discountCode'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json($order);
    }
}
