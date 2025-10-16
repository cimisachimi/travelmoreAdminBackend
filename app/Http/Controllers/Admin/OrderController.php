<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // ✅ This ensures all data needed by the frontend is loaded efficiently.
        $orders = Order::with([
            'user',
            'booking.bookable', // Gets the booking and the associated product (or the default).
        ])->latest()->get();

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders
        ]);
    }
}