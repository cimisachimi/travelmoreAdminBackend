<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Make sure this is imported
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Eager load the relationships your Index.jsx file needs
        $orders = Order::with([
            'user',
            'orderItems', // Use 'orderItems' (camelCase)
            'transaction' // This correctly gets the one with status = 'settlement'
        ])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Order/Index', [
            'orders' => $orders,
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
            'orderItems', // Use 'orderItems'
            'transaction', // Gets the 'settlement' transaction
            'transactions', // Gets ALL transactions (to find refunds, etc.)
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
        // --- THIS IS THE NEW, CORRECTED LOGIC ---

        // 1. Check if a refund has already been issued
        $refundedTransaction = $order->transactions()
                                     ->where('status', 'refund')
                                     ->first();

        if ($refundedTransaction) {
            return back()->with('error', 'This order has already been refunded.');
        }

        // 2. Find the original 'settlement' transaction to be refunded
        $transactionToRefund = $order->transactions()
                                     ->where('status', 'settlement')
                                     ->first();

        if (!$transactionToRefund) {
            return back()->with('error', 'No successful payment transaction found to refund.');
        }

        // 3. Get Midtrans config
        $serverKey = config('midtrans.server_key');
        $isProduction = config('midtrans.is_production');
        $baseUrl = $isProduction
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';

        // Use the transaction's code as the Midtrans Order ID
        $midtransOrderId = $transactionToRefund->transaction_code;

        try {
            // 4. Make the API call to Midtrans to refund
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($serverKey . ':')
            ])->post("{$baseUrl}/v2/{$midtransOrderId}/refund", [
                'refund_key' => 'order-' . $order->id . '-refund-' . time(),
                'reason' => 'Refund requested by admin'
            ]);

            $responseBody = $response->json();

            // 5. Handle Midtrans response
            if ($response->successful() && isset($responseBody['status_code']) && $responseBody['status_code'] == '200') {

                // 6. Update your local database
                // We update the original transaction to 'refund'
                $transactionToRefund->update(['status' => 'refund']);

                // We also update the order status
                $order->update(['status' => 'cancelled']);

                return back()->with('success', 'Refund processed successfully.');

            } else {
                return back()->with('error', 'Midtrans Error: ' . ($responseBody['status_message'] ?? 'Unknown error'));
            }

        } catch (\Exception $e) {
            return back()->with('error', 'Refund failed: ' . $e->getMessage());
        }
    }
}
