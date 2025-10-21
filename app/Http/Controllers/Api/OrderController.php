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

        // ✅ FIXED: Load 'transactions' (plural) and 'booking.bookable'
        // We also eager-load all relations the frontend needs.
        $orders = Order::with([
                'booking.bookable', // Gets the CarRental/HolidayPackage info
                'transactions'      // Gets all payment attempts
            ])
            ->where('user_id', $user->id)
            ->latest() // Show newest orders first
            ->get();

        return response()->json($orders);
    }

    /**
     * 🧠 Show a specific order.
     */
    public function show($id)
    {
        $user = Auth::user();

        // ✅ FIXED: Load 'transactions' (plural)
        $order = Order::with(['booking.bookable', 'transactions'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    /**
     * 🛑 NOTE: The store() method has been removed.
     * Order creation is now correctly handled by controllers like
     * BookingController (e.g., storeCarRentalBooking)
     * to ensure all items (Order, OrderItem, Booking) are created together.
     */
}