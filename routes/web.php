<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\HolidayPackageController as AdminHolidayPackageController;
use App\Http\Controllers\Admin\TripPlannerController as AdminTripPlannerController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController; // This is your alias
use App\Http\Controllers\Admin\CarRentalController as AdminCarRentalController;
use App\Http\Controllers\Admin\ActivityController; // Make sure this is imported
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DiscountCodeController as AdminDiscountCodeController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
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
    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () { // This applies 'admin.' prefix to all names inside
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index'); // Becomes admin.users.index

        // --- Holiday Packages ---
        Route::post('/holiday-packages/{package}/images', [AdminHolidayPackageController::class, 'storeImage'])
            ->name('packages.images.store'); // Becomes admin.packages.images.store
        Route::delete('/holiday-packages/{package}/images/{image}', [AdminHolidayPackageController::class, 'destroyImage'])
            ->name('packages.images.destroy'); // Becomes admin.packages.images.destroy
        Route::post('/holiday-packages/{package}/thumbnail', [AdminHolidayPackageController::class, 'updateThumbnail'])
            ->name('packages.thumbnail.update'); // Becomes admin.packages.thumbnail.update
        Route::resource('holiday-packages', AdminHolidayPackageController::class)
            ->names('packages'); // Use 'packages' base name -> admin.packages.index etc.


        Route::get('/trip-planners', [AdminTripPlannerController::class, 'index'])->name('planners.index'); // Becomes admin.planners.index
        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index'); // Becomes admin.transactions.index
        Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index'); // Becomes admin.services.index

        // --- FIXED ORDER ROUTES ---
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show'); // <-- FIX HERE
        Route::post('/orders/{order}/refund', [AdminOrderController::class, 'refund'])->name('orders.refund'); // <-- FIX HERE

        Route::get('/dashboard', DashboardController::class)->name('dashboard'); // Becomes admin.dashboard (Corrected from admin.admin.dashboard)

        // --- Activities (Corrected) ---
        Route::post('activities/{activity}/thumbnail', [ActivityController::class, 'updateThumbnail'])->name('activities.thumbnail.update'); // Becomes admin.activities.thumbnail.update
        Route::post('activities/{activity}/gallery', [ActivityController::class, 'storeGallery'])->name('activities.gallery.store'); // Becomes admin.activities.gallery.store
        Route::delete('activities/{activity}/images/{image}', [ActivityController::class, 'destroyImage'])->name('activities.images.destroy'); // Becomes admin.activities.images.destroy
        Route::resource('activities', ActivityController::class)->names('activities'); // Use 'activities' base name -> admin.activities.index etc.

        // --- Car Rentals ---
        Route::post('/car-rentals/{carRental}/availability', [AdminCarRentalController::class, 'update_availability'])->name('rentals.update_availability'); // Becomes admin.rentals.update_availability
        Route::post('/car-rentals/{carRental}/images', [AdminCarRentalController::class, 'storeImage'])->name('rentals.images.store'); // Becomes admin.rentals.images.store
        Route::delete('/car-rentals/{carRental}/images/{image}', [AdminCarRentalController::class, 'destroyImage'])->name('rentals.images.destroy'); // Becomes admin.rentals.images.destroy
        Route::post('/car-rentals/{carRental}/thumbnail', [AdminCarRentalController::class, 'updateThumbnail'])
                ->name('rentals.thumbnail.update'); // Becomes admin.rentals.thumbnail.update
        Route::resource('car-rentals', AdminCarRentalController::class)->names('rentals'); // Use 'rentals' base name -> admin.rentals.index etc.


        Route::resource('discount-codes', AdminDiscountCodeController::class)->names('discount-codes');


        Route::resource('posts', AdminPostController::class)->names('posts');
    });
});

require __DIR__.'/auth.php';
