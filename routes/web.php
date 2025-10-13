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
use App\Models\TripPlanner;

// ... (other routes like '/' and '/dashboard' stay the same) ...

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

    // --- REVISED ADMIN ROUTES ---
    // The name('admin.') automatically adds the 'admin.' prefix to every route inside this group.
    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/holiday-packages', [AdminHolidayPackageController::class, 'index'])->name('packages.index');
        Route::get('/trip-planners', [AdminTripPlannerController::class, 'index'])->name('planners.index');
        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
        Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index');
        Route::get('/activities', [AdminActivityController::class, 'index'])->name('activities.index');
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');


        Route::get('/car-rentals', [AdminCarRentalController::class, 'index'])->name('rentals.index');
        Route::post('/car-rentals', [AdminCarRentalController::class, 'store'])->name('rentals.store');
        Route::post('/car-rentals/{id}/availability', [AdminCarRentalController::class, 'update_availability'])->name('rentals.update_availability');
        Route::delete('/car-rentals/{id}', [AdminCarRentalController::class, 'destroy'])->name('rentals.destroy');

    });
});

require __DIR__.'/auth.php';