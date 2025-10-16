<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\HolidayPackage;
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
        // ✅ FIXED: Ensure the sum returns 0 instead of null if no records are found.
        $totalRevenue = Transaction::where('status', 'settlement')->sum('gross_amount') ?? 0;

        // Get counts for other key metrics
        $userCount = User::where('role', 'user')->count();
        $packageCount = HolidayPackage::count();
        $bookingCount = Booking::count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'revenue' => $totalRevenue,
                'users' => $userCount,
                'packages' => $packageCount,
                'bookings' => $bookingCount,
            ]
        ]);
    }
}