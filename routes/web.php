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
use App\Http\Controllers\Admin\ActivityController; // Add this
use App\Http\Controllers\Admin\DashboardController;
// Import the missing models
use App\Models\User;
use App\Models\HolidayPackage;
use App\Models\Booking;
use App\Models\TripPlanner;

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
        'recentBookings' => Booking::with(['user', 'bookable'])
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

    // --- ADMIN ROUTES ---
    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');

        // ✅ Use Route::resource for Holiday Packages
        Route::resource('holiday-packages', AdminHolidayPackageController::class)
            ->names('packages'); // This defines index, create, store, show, edit, update, destroy routes with names like admin.packages.index, admin.packages.create, etc.
        // Add these routes for package images
        Route::post('/holiday-packages/{package}/images', [AdminHolidayPackageController::class, 'storeImage'])
            ->name('packages.images.store');
        Route::delete('/holiday-packages/{package}/images/{image}', [AdminHolidayPackageController::class, 'destroyImage'])
            ->name('packages.images.destroy');
        Route::post('/holiday-packages/{package}/thumbnail', [AdminHolidayPackageController::class, 'updateThumbnail'])
            ->name('packages.thumbnail.update');


        Route::get('/trip-planners', [AdminTripPlannerController::class, 'index'])->name('planners.index');
        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
        Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index');
        Route::resource('activities', ActivityController::class); // <-- ADD THIS
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/dashboard', DashboardController::class)->name('admin.dashboard'); // Add this line
        // Car Rental Resource Routes
        
        Route::resource('car-rentals', AdminCarRentalController::class)->names('rentals');
        // Custom Car Rental Routes
        Route::post('/car-rentals/{carRental}/availability', [AdminCarRentalController::class, 'update_availability'])->name('rentals.update_availability');
        Route::post('/car-rentals/{carRental}/images', [AdminCarRentalController::class, 'storeImage'])->name('rentals.images.store');
        Route::delete('/car-rentals/{carRental}/images/{image}', [AdminCarRentalController::class, 'destroyImage'])->name('rentals.images.destroy');
        
        // ✅ CORRECTED THUMBNAIL ROUTE
    Route::post('/car-rentals/{carRental}/thumbnail', [AdminCarRentalController::class, 'updateThumbnail'])
         ->name('rentals.thumbnail.update');
    });
});

require __DIR__.'/auth.php';