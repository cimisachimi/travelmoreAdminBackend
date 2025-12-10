<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Refund; // Ensure this model exists, or remove the refund logic below
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // --- 1. KEY METRICS ---

        // Revenue (Settled Transactions only)
        // We use 'coalesce' or '?? 0' to ensure we never send null
        $totalRevenue = Transaction::where('status', 'settlement')->sum('gross_amount') ?? 0;

        // Growth Calculation
        $currentMonthRevenue = Transaction::where('status', 'settlement')
            ->where('created_at', '>=', $currentMonth)
            ->sum('gross_amount') ?? 0;

        $lastMonthRevenue = Transaction::where('status', 'settlement')
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('gross_amount') ?? 0;

        // Avoid division by zero
        $revenueGrowth = 0;
        if ($lastMonthRevenue > 0) {
            $revenueGrowth = round((($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1);
        } elseif ($currentMonthRevenue > 0) {
            $revenueGrowth = 100; // 100% growth if we had 0 last month and some this month
        }

        // Counts
        $totalOrders = Order::count();
        $totalClients = User::where('role', 'client')->count();
        $newClients = User::where('role', 'client')->where('created_at', '>=', $currentMonth)->count();

        // Operational Needs
        $needsDelivery = Order::whereIn('status', ['paid', 'partially_paid'])->count();

        // Handle Refund count safely (check if table/model exists or just default to 0)
        $pendingRefunds = class_exists(Refund::class) ? Refund::where('status', 'pending')->count() : 0;

        // --- 2. CHARTS DATA ---

        // Revenue Chart (Last 6 Months)
        $revenueChart = Transaction::where('status', 'settlement')
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(gross_amount) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => Carbon::createFromFormat('Y-m', $item->month)->format('M'),
                    'total' => (float)$item->total,
                ];
            });

        // Sales by Category (Service Type)
        // We look at OrderItems to see what was actually sold
        $categoryChart = OrderItem::select('orderable_type', DB::raw('count(*) as count'))
            ->groupBy('orderable_type')
            ->get()
            ->map(function ($item) {
                // Convert "App\Models\CarRental" -> "Car Rental"
                $name = class_basename($item->orderable_type);
                $formattedName = trim(preg_replace('/(?<!\ )[A-Z]/', ' $0', $name));
                return [
                    'name' => $formattedName,
                    'value' => (int)$item->count,
                ];
            });

        // --- 3. RECENT ACTIVITY ---
        $recentOrders = Order::with(['user', 'orderItems'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($order) {
                // Get the first item name or type for display
                $serviceName = 'Unknown';
                if ($order->orderItems->isNotEmpty()) {
                    $type = class_basename($order->orderItems->first()->orderable_type);
                    $serviceName = trim(preg_replace('/(?<!\ )[A-Z]/', ' $0', $type));
                }

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->user->name ?? 'Guest',
                    'email' => $order->user->email ?? '-',
                    'amount' => (float)$order->total_amount,
                    'status' => $order->status,
                    'service' => $serviceName,
                    'date' => $order->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_revenue' => (float)$totalRevenue,
                'revenue_growth' => (float)$revenueGrowth,
                'total_orders' => (int)$totalOrders,
                'total_clients' => (int)$totalClients,
                'new_clients' => (int)$newClients,
                'needs_delivery' => (int)$needsDelivery,
                'pending_refunds' => (int)$pendingRefunds,
            ],
            'charts' => [
                'revenue' => $revenueChart,
                'categories' => $categoryChart,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
