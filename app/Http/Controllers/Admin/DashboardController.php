<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\HolidayPackage;
use App\Models\Order; // Import the Order model
use App\Models\Transaction;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard with key statistics.
     */
    public function __invoke()
    {
        // Revenue calculation (already handles null)
        $totalRevenue = Transaction::where('status', 'settlement')->sum('gross_amount') ?? 0; //

        // Get counts for other key metrics
        $userCount = User::where('role', 'client')->count(); //
        $packageCount = HolidayPackage::count(); //
        $bookingCount = Booking::count(); //

        // --- NEW: Count orders needing delivery ---
        $ordersNeedingDeliveryCount = Order::whereIn('status', ['paid', 'partially_paid'])->count(); //

        return Inertia::render('Dashboard', [
            'stats' => [
                'revenue' => $totalRevenue,
                'users' => $userCount,
                'packages' => $packageCount,
                'bookings' => $bookingCount,
                'needs_delivery' => $ordersNeedingDeliveryCount, // Pass the new count
            ]
        ]);
    }
}