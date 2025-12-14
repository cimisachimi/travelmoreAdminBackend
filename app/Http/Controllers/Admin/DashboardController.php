<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Refund;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $range = $request->input('range', 'month'); // Default to 'month'

        // Define date ranges and chart granularity based on selection
        switch ($range) {
            case 'today':
                $startDate = Carbon::today();
                $previousStartDate = Carbon::yesterday();
                $previousEndDate = Carbon::today()->subSecond();
                // Group by Hour for Today
                $dateFormat = '%H:00';
                $labelFormat = 'H:i';
                break;

            case 'week':
                $startDate = Carbon::now()->subDays(7);
                $previousStartDate = Carbon::now()->subDays(14);
                $previousEndDate = Carbon::now()->subDays(7);
                // Group by Day for Week
                $dateFormat = '%Y-%m-%d';
                $labelFormat = 'D d';
                break;

            case 'year':
                $startDate = Carbon::now()->subYear();
                $previousStartDate = Carbon::now()->subYears(2);
                $previousEndDate = Carbon::now()->subYear();
                // Group by Month for Year
                $dateFormat = '%Y-%m';
                $labelFormat = 'M Y';
                break;

            case 'month':
            default:
                $startDate = Carbon::now()->subDays(30);
                $previousStartDate = Carbon::now()->subDays(60);
                $previousEndDate = Carbon::now()->subDays(30);
                // Group by Day for Month
                $dateFormat = '%Y-%m-%d';
                $labelFormat = 'd M';
                break;
        }

        // --- 1. KEY METRICS ---

        // Revenue (Settled Transactions only)
        $totalRevenue = Transaction::where('status', 'settlement')
            ->where('created_at', '>=', $startDate)
            ->sum('gross_amount') ?? 0;

        // Growth Calculation (Current Range vs Previous Range)
        $previousRevenue = Transaction::where('status', 'settlement')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->sum('gross_amount') ?? 0;

        $revenueGrowth = 0;
        if ($previousRevenue > 0) {
            $revenueGrowth = round((($totalRevenue - $previousRevenue) / $previousRevenue) * 100, 1);
        } elseif ($totalRevenue > 0) {
            $revenueGrowth = 100;
        }

        // Counts (Filtered by date where applicable)
        $totalOrders = Order::where('created_at', '>=', $startDate)->count();

        // Total Clients (Lifetime) vs New Clients (In Range)
        $totalClients = User::where('role', 'client')->count();
        $newClients = User::where('role', 'client')
            ->where('created_at', '>=', $startDate)
            ->count();

        // Operational Needs (Usually backlog, so we keep this absolute/all-time)
        $needsDelivery = Order::whereIn('status', ['paid', 'partially_paid'])->count();

        // Handle Refund count
        $pendingRefunds = class_exists(Refund::class) ? Refund::where('status', 'pending')->count() : 0;

        // --- 2. CHARTS DATA ---

        // Revenue Chart (Dynamic grouping)
        $revenueChart = Transaction::where('status', 'settlement')
            ->where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '$dateFormat') as date_label"),
                DB::raw('SUM(gross_amount) as total')
            )
            ->groupBy('date_label')
            ->orderBy('date_label')
            ->get()
            ->map(function ($item) use ($range, $labelFormat) {
                // Parse the date based on the format returned by SQL
                try {
                    if ($range === 'today') {
                        $date = Carbon::createFromFormat('H:00', $item->date_label);
                    } elseif ($range === 'year') {
                        $date = Carbon::createFromFormat('Y-m', $item->date_label);
                    } else {
                        $date = Carbon::createFromFormat('Y-m-d', $item->date_label);
                    }
                    $name = $date->format($labelFormat);
                } catch (\Exception $e) {
                    $name = $item->date_label;
                }

                return [
                    'name' => $name,
                    'total' => (float)$item->total,
                ];
            });

        // Sales by Category (Filtered by date range to show relevance)
        $categoryChart = OrderItem::whereHas('order', function($q) use ($startDate) {
                $q->where('created_at', '>=', $startDate);
            })
            ->select('orderable_type', DB::raw('count(*) as count'))
            ->groupBy('orderable_type')
            ->get()
            ->map(function ($item) {
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
            'filters' => [
                'range' => $range
            ]
        ]);
    }
}
