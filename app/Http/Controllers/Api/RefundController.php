<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RefundController extends Controller
{
    /**
     * Get all refund requests for the authenticated user.
     */
    public function index(Request $request)
    {
        // TODO: Create a 'Refund' model and database table
        // and query it here.
        // $refunds = $request->user()->refunds()->latest()->get();

        // For now, return an empty array to stop the 404 error.
        return response()->json([]);
    }
}
