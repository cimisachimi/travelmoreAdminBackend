<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'orderItems', 'transaction']);

        // --- 1. Sorting Logic ---
        if ($request->has('sort') && $request->has('direction')) {
            $sort = $request->input('sort');
            $direction = $request->input('direction') === 'desc' ? 'desc' : 'asc';

            if ($sort === 'user.name') {
                // Sort by related User name
                $query->join('users', 'orders.user_id', '=', 'users.id')
                      ->orderBy('users.name', $direction)
                      ->select('orders.*'); // Avoid overwriting IDs
            } else {
                // Sort by direct Order columns
                $query->orderBy($sort, $direction);
            }
        } else {
            // Default sort: Date Descending
            $query->latest();
        }

        $orders = $query->paginate(10)->withQueryString(); // Persist params in pagination links

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders,
            // Pass current sort state back to frontend
            'filters' => $request->only(['sort', 'direction']),
        ]);
    }

    /**
     * Show the specified order.
     */
    public function show(Order $order)
    {
        // Eager load all data for the detail view
        $order->load([
            'user',
            'orderItems.orderable', // ✅ CHANGED: Loads the actual Activity/Car/Package model
            'transaction',          // Gets the 'settlement' transaction
            'transactions',         // Gets ALL transactions (to find refunds, etc.)
            'booking.bookable'
        ]);

        return Inertia::render('Admin/Order/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Issue a refund for a specific order via Midtrans.
     */
    public function refund(Request $request, Order $order)
    {
        $refundedTransaction = $order->transactions()->where('status', 'refund')->first();
        if ($refundedTransaction) {
            return back()->with('error', 'This order has already been refunded.');
        }

        $transactionToRefund = $order->transactions()->where('status', 'settlement')->first();
        if (!$transactionToRefund) {
            // Allow manual cancellation if no paid transaction exists
            $order->update(['status' => 'cancelled']);
            return back()->with('success', 'Order cancelled manually (no refundable transaction found).');
        }

        // 1. Try to get ID from the new column, OR fallback to the JSON payload
        $midtransOrderId = $transactionToRefund->transaction_code;

        if (!$midtransOrderId && !empty($transactionToRefund->payment_payloads)) {
            $payloads = json_decode($transactionToRefund->payment_payloads, true);
            $midtransOrderId = $payloads['order_id'] ?? null;
        }

        // 2. Setup Midtrans
        $serverKey = config('midtrans.server_key');
        $isProduction = config('midtrans.is_production');
        $baseUrl = $isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

        try {
            // 3. Attempt Midtrans Refund
            if ($midtransOrderId) {
                $response = Http::withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Basic ' . base64_encode($serverKey . ':')
                ])->post("{$baseUrl}/v2/{$midtransOrderId}/refund", [
                    'refund_key' => 'order-' . $order->id . '-refund-' . time(),
                    'reason' => 'Refund requested by admin'
                ]);

                $responseBody = $response->json();

                // If Midtrans fails (e.g., 404 transaction not found), we might still want to cancel locally
                if ($response->failed() && $response->status() != 404) {
                     return back()->with('error', 'Midtrans Error: ' . ($responseBody['status_message'] ?? 'Unknown error'));
                }
            }

            // 4. Update Local Database (Even if Midtrans ID was missing, or it was a 404 on Sandbox)
            $transactionToRefund->update(['status' => 'refund']);
            $order->update(['status' => 'cancelled']);

            // Release availability if needed
            // $this->releaseAvailability($order); // Ensure you have this function available or imported

            return back()->with('success', 'Refund processed successfully.');

        } catch (\Exception $e) {
            return back()->with('error', 'Refund failed: ' . $e->getMessage());
        }
    }
}
