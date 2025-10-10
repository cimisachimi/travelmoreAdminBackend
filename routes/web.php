<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\HolidayPackageController as AdminHolidayPackageController;
use App\Http\Controllers\Admin\TripPlannerController as AdminTripPlannerController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\CarRentalController as AdminCarRentalController;
use App\Http\Controllers\Admin\ActivityController as AdminActivityController;
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
        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('admin.transactions.index');
        Route::get('/services', [AdminServiceController::class, 'index'])->name('admin.services.index');

        Route::get('/car-rentals', [AdminCarRentalController::class, 'index'])->name('admin.rentals.index');
       //Route::get('/car-rentals/create', [AdminCarRentalController::class, 'create'])->name('admin.rentals.create'); // Add this line
        Route::post('/car-rentals', [AdminCarRentalController::class, 'store'])->name('admin.rentals.store'); // Add this line
        Route::get('/car-rentals/{carRental}/availability', [AdminCarRentalController::class, 'getAvailability'])->name('admin.rentals.availability');
        Route::put('/car-rentals/availability/{availability}', [AdminCarRentalController::class, 'updateAvailability'])->name('admin.rentals.availability.update');    
        Route::get('/activities', [AdminActivityController::class, 'index'])->name('admin.activities.index');
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    });
});

require __DIR__.'/auth.php';