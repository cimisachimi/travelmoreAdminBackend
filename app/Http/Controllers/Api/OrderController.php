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
    $orders = Order::with([
            'user',                  // 👈 Added to fix the 'undefined' error
            'booking.bookable',
            'orderItems.orderable',  // 👈 Added for the items table
            'transaction',           // 👈 Added for payment details
            'discountCode'
        ])
        ->where('user_id', $user->id)
        ->latest()
        ->get();

    return response()->json($orders);
}

public function show($id)
{
    $user = Auth::user();
    $order = Order::with([
            'booking.bookable',
            'transactions',
            'discountCode',
            'orderItems.orderable' // 👈 Added this to match Admin logic
        ])
        ->where('user_id', $user->id)
        ->findOrFail($id);

    return response()->json($order);
}
}
