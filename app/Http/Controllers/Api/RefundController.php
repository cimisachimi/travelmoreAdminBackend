<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Refund;
use App\Models\Order;

class RefundController extends Controller
{
    /**
     * Get all refund requests for the authenticated user.
     */
    public function index(Request $request)
    {
        $refunds = Refund::where('user_id', Auth::id())
            ->with('order') // Load the related order
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($refunds);
    }

    /**
     * Store a new refund request.
     */
    public function store(Request $request)
    {
        // 1. Validate
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'reason'   => 'required|string|min:10',
        ]);

        // 2. Find Order & Verify Ownership
        $order = Order::where('id', $validated['order_id'])
            ->where('user_id', Auth::id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found or access denied.'], 404);
        }

        // 3. Check for duplicates
        $existingRefund = Refund::where('order_id', $order->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingRefund) {
            return response()->json(['message' => 'A refund request is already active for this order.'], 409);
        }

        // 4. Create Refund
        $refund = Refund::create([
            'user_id'  => Auth::id(),
            'order_id' => $order->id,
            'reason'   => $validated['reason'],
            'status'   => 'pending',
        ]);

        return response()->json([
            'message' => 'Refund request submitted successfully.',
            'refund' => $refund
        ], 201);
    }
}
