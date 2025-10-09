<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\HolidayPackageController as AdminHolidayPackageController;
use App\Http\Controllers\Admin\TripPlannerController as AdminTripPlannerController;

// Import the missing models
use App\Models\User;
use App\Models\HolidayPackage;
use App\Models\Booking;
use App\Models\TripPlanner; // <-- ADD THIS LINE

// Redirect the root URL to the login page
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'stats' => [
            'users' => User::count(),
            'packages' => HolidayPackage::count(),
            'bookings' => Booking::count(),
            'planners' => TripPlanner::count(),
        ],
        'recentBookings' => Booking::with(['user', 'holidayPackage'])
                                ->latest()
                                ->take(5)
                                ->get(),
        'newUsers' => User::latest()->take(5)->get(),
        'recentPlanners' => TripPlanner::latest()->take(5)->get(),
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin-only routes for the dashboard pages
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::get('/holiday-packages', [AdminHolidayPackageController::class, 'index'])->name('admin.packages.index');
        Route::get('/trip-planners', [AdminTripPlannerController::class, 'index'])->name('admin.planners.index');
    });
});

require __DIR__.'/auth.php';