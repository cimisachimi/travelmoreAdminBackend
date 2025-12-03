<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    public function index()
    {
        $refunds = Refund::with(['user', 'order']) // Eager load relationships
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Refund/Index', [
            'refunds' => $refunds
        ]);
    }

    public function update(Request $request, Refund $refund)
    {
        // Fix: If 'status' is passed in the URL (query) but empty in the body, prefer the query value.
        // This resolves issues where the frontend router params conflict with empty form state.
        if ($request->query('status') && empty($request->input('status'))) {
            $request->merge(['status' => $request->query('status')]);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
        ]);

        // Use a transaction to ensure atomicity
        DB::transaction(function () use ($validated, $refund) {
            // 1. Update the Refund status
            $refund->update(['status' => $validated['status']]);

            // 2. If Approved, update the associated Order and Transaction
            if ($validated['status'] === 'approved') {
                $refund->load('order'); // Ensure order is loaded

                if ($refund->order) {
                    // Update Order status
                    $refund->order->update(['status' => 'refund']);

                    // Update associated Transaction status (if exists)
                    // Assuming 'settlement' or 'paid' transactions are the ones being refunded
                    $refund->order->transactions()
                        ->whereIn('status', ['settlement', 'paid', 'capture'])
                        ->update(['status' => 'refund']);
                }
            }

            // 3. If Rejected, usually no action on Order is needed if it was just 'paid'.
        });

        return back()->with('flash', [
            'success' => 'Refund status updated successfully.'
        ]);
    }
}
