<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * Display a listing of the authenticated user's orders.
     */
    public function index()
    {
        $user = Auth::user();

        // ✅ FIXED: This query is more robust.
        // It properly loads all relationships needed for the profile page.
        $orders = $user->orders()->with([
            // Load the order items and the related bookable item (CarRental, HolidayPackage, etc.)
            'orderItems' => function ($query) {
                $query->with(['orderable']);
            },
            // Also load the associated transaction
            'transaction'
        ])
        ->latest() // Show the newest orders first
        ->get();

        // This ensures that if an orderable item was deleted, it doesn't break the API.
        // It filters out any order items where the related 'orderable' is now null.
        $orders->each(function ($order) {
            $order->order_items = $order->order_items->filter(function ($item) {
                return !is_null($item->orderable);
            });
        });

        return response()->json($orders);
    }
}