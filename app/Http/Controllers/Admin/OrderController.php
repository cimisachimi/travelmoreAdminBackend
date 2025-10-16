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
        // Eager load all related data for efficiency
        $orders = Order::with(['user', 'orderItems.orderable'])->latest()->get();

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders,
        ]);
    }
}