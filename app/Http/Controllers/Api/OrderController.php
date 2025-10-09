<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Retrieve the authenticated user's order history.
     */
    public function index(Request $request)
    {
        // Get the authenticated user and load their orders with all related items
        $orders = $request->user()->orders()->with(['items.orderable', 'transaction'])->latest()->get();

        return response()->json($orders);
    }
}