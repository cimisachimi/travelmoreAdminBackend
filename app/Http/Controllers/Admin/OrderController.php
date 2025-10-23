<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Eager-load the user, orderItems, and transaction relationships
        $orders = Order::with(['user', 'orderItems', 'transaction'])
            ->latest() // Show newest orders first
            ->paginate(10);

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        // You might want to load relationships for a detail view here too
        $order->load(['user', 'orderItems.orderable', 'transaction']);

        // Example: Return JSON or render a detail page
        return response()->json($order);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        // Example: Update order status (e.g., to 'delivered')
        $request->validate([
            'status' => 'required|string|in:pending,paid,partially_paid,delivered,cancelled',
        ]);

        $order->status = $request->status;
        $order->save();

        return redirect()->back()->with('success', 'Order status updated.');
    }
}