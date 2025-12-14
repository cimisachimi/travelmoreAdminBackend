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
use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DiscountCodeController as AdminDiscountCodeController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\OpenTripController as AdminOpenTripController;
use App\Http\Controllers\Admin\RefundController;
use App\Http\Controllers\Admin\GalleryController;
use App\Models\User;
use App\Models\HolidayPackage;
use App\Models\Booking;
use App\Models\TripPlanner;

Route::get('/', function () {
    return redirect()->route('login');
});

// FIX: Changed this to use DashboardController so it returns the correct stats (Revenue, Orders, etc.)
// instead of the incompatible user/package counts.
Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- ADMIN ROUTES ---
    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');

        // --- Holiday Packages ---
        Route::post('/holiday-packages/{package}/images', [AdminHolidayPackageController::class, 'storeImage'])->name('packages.images.store');
        Route::delete('/holiday-packages/{package}/images/{image}', [AdminHolidayPackageController::class, 'destroyImage'])->name('packages.images.destroy');
        Route::post('/holiday-packages/{package}/thumbnail', [AdminHolidayPackageController::class, 'updateThumbnail'])->name('packages.thumbnail.update');
        Route::resource('holiday-packages', AdminHolidayPackageController::class)->names('packages');

        Route::put('/trip-planners/update-price', [AdminTripPlannerController::class, 'updateGeneralPrice'])->name('planners.update-price');
        Route::get('/trip-planners', [AdminTripPlannerController::class, 'index'])->name('planners.index');
        Route::get('/trip-planners/{tripPlanner}/edit', [AdminTripPlannerController::class, 'edit'])->name('planners.edit');
        Route::put('/trip-planners/{tripPlanner}', [AdminTripPlannerController::class, 'update'])->name('planners.update');

        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
        Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index');

        // --- FIXED ORDER ROUTES ---
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
        Route::post('/orders/{order}/refund', [AdminOrderController::class, 'refund'])->name('orders.refund');

        // This route is admin.dashboard
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        // --- Activities ---
        Route::post('activities/{activity}/thumbnail', [ActivityController::class, 'updateThumbnail'])->name('activities.thumbnail.update');
        Route::post('activities/{activity}/gallery', [ActivityController::class, 'storeGallery'])->name('activities.gallery.store');
        Route::delete('activities/{activity}/images/{image}', [ActivityController::class, 'destroyImage'])->name('activities.images.destroy');
        Route::resource('activities', ActivityController::class)->names('activities');

        // --- Car Rentals ---
        Route::post('/car-rentals/{carRental}/availability', [AdminCarRentalController::class, 'update_availability'])->name('rentals.update_availability');
        Route::post('/car-rentals/{carRental}/images', [AdminCarRentalController::class, 'storeImage'])->name('rentals.images.store');
        Route::delete('/car-rentals/{carRental}/images/{image}', [AdminCarRentalController::class, 'destroyImage'])->name('rentals.images.destroy');
        Route::post('/car-rentals/{carRental}/thumbnail', [AdminCarRentalController::class, 'updateThumbnail'])->name('rentals.thumbnail.update');
        Route::resource('car-rentals', AdminCarRentalController::class)->names('rentals');

        Route::resource('discount-codes', AdminDiscountCodeController::class)->names('discount-codes');
        Route::resource('posts', AdminPostController::class)->names('posts');
        Route::resource('galleries', GalleryController::class);

        // --- OPEN TRIPS ---
        Route::post('/open-trips/{openTrip}/images', [AdminOpenTripController::class, 'storeImage'])->name('open-trips.images.store');
        Route::delete('/open-trips/{openTrip}/images/{image}', [AdminOpenTripController::class, 'destroyImage'])->name('open-trips.images.destroy');
        Route::post('/open-trips/{openTrip}/thumbnail', [AdminOpenTripController::class, 'updateThumbnail'])->name('open-trips.thumbnail.update');
        Route::resource('open-trips', AdminOpenTripController::class);

        Route::get('/refunds', [RefundController::class, 'index'])->name('refunds.index');
        Route::put('/refunds/{refund}', [RefundController::class, 'update'])->name('refunds.update');
    });
});

require __DIR__.'/auth.php';
