<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
// Note: You will need to create a 'Refund' model later
// use App\Models\Refund;

class RefundController extends Controller
{
    /**
     * Get all refund requests for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // --- TODO: When you build the Refund model ---
        // $refunds = $user->refunds()
        //     ->orderBy('created_at', 'desc')
        //     ->get();
        // return response()->json($refunds);
        // ---------------------------------------------

        // For now, return an empty array.
        // This stops the 404 error and lets your frontend load.
        return response()->json([]);
    }

    /**
     * Store a new refund request (coming soon).
     */
    public function store(Request $request)
    {
        // --- TODO: Add logic to create a refund request ---
        // 1. Validate the request (e.g., order_id, reason)
        // 2. Check if the user is allowed to refund this order
        // 3. Create the Refund record
        // 4. Return the new refund

        return response()->json(['message' => 'Feature not yet implemented.'], 501);
    }
}
