<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Carbon\Carbon; // ✅ Required for date calculations

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    // Start query with explicit selection to prevent column collisions after joins
    $query = Order::with(['user', 'orderItems.orderable', 'transaction'])
                  ->select('orders.*');

    // --- 1. SEARCH LOGIC ---
    if ($request->filled('search')) {
        $search = $request->input('search');
        $query->where(function ($q) use ($search) {
            $q->where('orders.order_number', 'like', "%{$search}%")
                ->orWhereHas('user', function ($qu) use ($search) {
                    $qu->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                });
        });
    }

    // --- 2. SERVICE FILTER LOGIC ---
    if ($request->filled('service') && $request->service !== 'all') {
        $service = $request->input('service');
        $query->whereHas('orderItems', function ($q) use ($service) {
            $q->where('orderable_type', 'like', "%{$service}%");
        });
    }

    // --- 3. DATE FILTER LOGIC (FIXED AMBIGUITY) ---
    if ($request->filled('date_filter') && $request->date_filter !== 'all') {
        $dateFilter = $request->input('date_filter');

        if ($dateFilter === 'today') {
            // ✅ Specify orders table
            $query->whereDate('orders.created_at', \Carbon\Carbon::today());
        } elseif ($dateFilter === 'last_week') {
            // ✅ Specify orders table
            $query->where('orders.created_at', '>=', \Carbon\Carbon::now()->subDays(7));
        } elseif ($dateFilter === 'this_month') {
            // ✅ Specify orders table
            $query->whereMonth('orders.created_at', \Carbon\Carbon::now()->month)
                  ->whereYear('orders.created_at', \Carbon\Carbon::now()->year);
        }
    }

    // --- 4. SORTING LOGIC ---
    if ($request->has('sort') && $request->has('direction')) {
        $sort = $request->input('sort');
        $direction = $request->input('direction') === 'desc' ? 'desc' : 'asc';

        if ($sort === 'user.name') {
            // This join causes the ambiguity if created_at isn't prefixed
            $query->join('users', 'orders.user_id', '=', 'users.id')
                  ->orderBy('users.name', $direction);
        } elseif ($sort === 'created_at') {
            $query->orderBy('orders.created_at', $direction);
        } else {
            $query->orderBy($sort, $direction);
        }
    } else {
        // ✅ Default sort: Use explicit table name
        $query->orderBy('orders.created_at', 'desc');
    }

    $orders = $query->paginate(10)->withQueryString();

    return Inertia::render('Admin/Order/Index', [
        'orders' => $orders,
        'filters' => $request->only(['sort', 'direction', 'search', 'service', 'date_filter']),
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
