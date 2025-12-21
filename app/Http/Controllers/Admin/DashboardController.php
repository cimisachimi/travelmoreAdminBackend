<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Refund;
use App\Models\TripPlanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $range = $request->input('range', 'month');
        $today = Carbon::today();

        // --- 0. DATE RANGE LOGIC ---
        switch ($range) {
            case 'today':
                $startDate = Carbon::today();
                $previousStartDate = Carbon::yesterday();
                $previousEndDate = Carbon::today()->subSecond();
                $dateFormat = '%H:00';
                $labelFormat = 'H:i';
                break;
            case 'week':
                $startDate = Carbon::now()->subDays(7);
                $previousStartDate = Carbon::now()->subDays(14);
                $previousEndDate = Carbon::now()->subDays(7);
                $dateFormat = '%Y-%m-%d';
                $labelFormat = 'D d';
                break;
            case 'year':
                $startDate = Carbon::now()->subYear();
                $previousStartDate = Carbon::now()->subYears(2);
                $previousEndDate = Carbon::now()->subYear();
                $dateFormat = '%Y-%m';
                $labelFormat = 'M Y';
                break;
            case 'month':
            default:
                $startDate = Carbon::now()->subDays(30);
                $previousStartDate = Carbon::now()->subDays(60);
                $previousEndDate = Carbon::now()->subDays(30);
                $dateFormat = '%Y-%m-%d';
                $labelFormat = 'd M';
                break;
        }

        // --- 1. KEY METRICS & GROWTH ---
        $totalRevenue = Transaction::where('status', 'settlement')
            ->where('created_at', '>=', $startDate)
            ->sum('gross_amount') ?? 0;

        $previousRevenue = Transaction::where('status', 'settlement')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->sum('gross_amount') ?? 0;

        $revenueGrowth = 0;
        if ($previousRevenue > 0) {
            $revenueGrowth = round((($totalRevenue - $previousRevenue) / $previousRevenue) * 100, 1);
        } elseif ($totalRevenue > 0) {
            $revenueGrowth = 100;
        }

        $totalOrders = Order::where('created_at', '>=', $startDate)->count();
        $totalClients = User::where('role', 'client')->count();
        $newClients = User::where('role', 'client')
            ->where('created_at', '>=', $startDate)
            ->count();

        // New Metric: Total confirmed bookings that need to be delivered in the future
        $upcomingCount = Order::whereIn('status', ['paid', 'settlement', 'partially_paid'])
            ->whereHas('booking', function ($q) use ($today) {
                $q->where('start_date', '>=', $today)
                  ->orWhere('booking_date', '>=', $today);
            })->count();

        $needsDelivery = Order::whereIn('status', ['paid', 'partially_paid', 'settlement'])->count();
        $pendingRefunds = class_exists(Refund::class) ? Refund::where('status', 'pending')->count() : 0;

        // --- 2. CHARTS DATA ---
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
                return ['name' => $name, 'total' => (float)$item->total];
            });

        $categoryChart = OrderItem::whereHas('order', function($q) use ($startDate) {
                $q->where('created_at', '>=', $startDate);
            })
            ->select('orderable_type', DB::raw('count(*) as count'))
            ->groupBy('orderable_type')
            ->get()
            ->map(function ($item) {
                $name = class_basename($item->orderable_type);
                $formattedName = trim(preg_replace('/(?<!\ )[A-Z]/', ' $0', $name));
                return ['name' => $formattedName, 'value' => (int)$item->count];
            });

        // --- 3. LOGISTICS: UPCOMING SERVICE SCHEDULE ---
        $upcomingSchedule = Order::with(['user', 'booking', 'orderItems.orderable'])
            ->whereIn('status', ['paid', 'settlement', 'partially_paid'])
            ->whereHas('booking', function ($query) use ($today) {
                $query->where('start_date', '>=', $today)
                      ->orWhere('booking_date', '>=', $today);
            })
            ->get()
            ->map(function ($order) {
                $booking = $order->booking;
                $serviceDate = $booking->start_date ?? $booking->booking_date;
                $type = class_basename($booking->bookable_type);

                // Safe Service Name Resolver (Handles Car Rental brand+model)
                $firstItem = $order->orderItems->first();
                $serviceName = $firstItem->name ?? 'Service';
                if ($firstItem->orderable && isset($firstItem->orderable->name)) {
                    $serviceName = $firstItem->orderable->name;
                } elseif ($type === 'CarRental' && $firstItem->orderable) {
                    $serviceName = $firstItem->orderable->brand . ' ' . $firstItem->orderable->car_model;
                }

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->user->name ?? 'Guest',
                    'service_name' => $serviceName,
                    'service_type' => $type,
                    'date' => $serviceDate,
                    'is_today' => Carbon::parse($serviceDate)->isToday(),
                    'status' => $order->status,
                ];
            })
            ->sortBy('date')
            ->values();

        // --- 4. FORMATTERS & RECENT ACTIVITY ---

        $formatOrderData = function ($order) {
            $serviceName = 'Unknown';
            $type = 'Unknown';
            if ($order->orderItems->isNotEmpty()) {
                $firstItem = $order->orderItems->first();
                $rawType = class_basename($firstItem->orderable_type);
                $type = trim(preg_replace('/(?<!\ )[A-Z]/', ' $0', $rawType));

                // Name resolver
                $serviceName = $firstItem->name ?? 'Service';
                if ($firstItem->orderable && isset($firstItem->orderable->name)) {
                    $serviceName = $firstItem->orderable->name;
                }
            }

            $paymentMethod = 'N/A';
            if ($order->transaction) {
                $paymentMethod = $order->transaction->payment_type ?? 'Manual';
            }

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer' => $order->user->name ?? 'Guest',
                'customer_initials' => strtoupper(substr($order->user->name ?? 'G', 0, 2)),
                'email' => $order->user->email ?? '-',
                'amount' => (float)$order->total_amount,
                'status' => $order->status,
                'service' => $serviceName,
                'service_type_label' => $type,
                'payment_method' => ucwords(str_replace('_', ' ', $paymentMethod)),
                'date_formatted' => $order->created_at->format('d M Y, H:i'),
                'date_relative' => $order->created_at->diffForHumans(),
            ];
        };

        $recentOrders = Order::with(['user', 'orderItems.orderable', 'transaction'])
            ->latest()
            ->take(5)
            ->get()
            ->map($formatOrderData);

        // This list shows orders based on delivery urgency (Oldest confirmed but not yet delivered)
        $deliveryOrders = Order::with(['user', 'orderItems.orderable', 'transaction'])
            ->whereIn('status', ['paid', 'partially_paid', 'settlement'])
            ->oldest()
            ->take(5)
            ->get()
            ->map($formatOrderData);

        $activeTripPlanners = TripPlanner::whereIn('status', ['pending', 'drafting', 'revision', 'sent_to_client'])
            ->with(['user', 'bookings'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($planner) {
                $isPaid = $planner->bookings->contains(fn($b) => in_array($b->payment_status, ['paid', 'partial']));
                return [
                    'id' => $planner->id,
                    'customer' => $planner->full_name ?? $planner->user->name ?? 'Guest',
                    'email' => $planner->email ?? $planner->user->email ?? '-',
                    'destination' => $planner->city ? "{$planner->city}, {$planner->province}" : 'Custom Destination',
                    'status' => $planner->status ?? 'pending',
                    'date' => $planner->created_at->diffForHumans(),
                    'is_paid' => $isPaid,
                ];
            });

        // --- 5. RETURN TO INERTIA ---
        return Inertia::render('Dashboard', [
            'stats' => [
                'total_revenue' => (float)$totalRevenue,
                'revenue_growth' => (float)$revenueGrowth,
                'total_orders' => (int)$totalOrders,
                'total_clients' => (int)$totalClients,
                'new_clients' => (int)$newClients,
                'needs_delivery' => (int)$needsDelivery,
                'upcoming_deliveries_count' => (int)$upcomingCount, // Added new stat
                'pending_refunds' => (int)$pendingRefunds,
            ],
            'charts' => [
                'revenue' => $revenueChart,
                'categories' => $categoryChart,
            ],
            'upcoming_schedule' => $upcomingSchedule, // New Logistics List
            'recent_orders' => $recentOrders,
            'delivery_orders' => $deliveryOrders,
            'active_planners' => $activeTripPlanners,
            'filters' => [
                'range' => $range
            ]
        ]);
    }
}
