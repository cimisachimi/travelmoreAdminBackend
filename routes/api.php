<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
use App\Http\Controllers\Api\Client\LoginController;
use App\Http\Controllers\Api\Public\HolidayPackageController as PublicHolidayPackageController;
use App\Http\Controllers\Api\Public\CarRentalController as PublicCarRentalController; // Correctly aliased
use App\Http\Controllers\Api\Public\ActivityController as PublicActivityController;
use App\Http\Controllers\Api\TripPlannerController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Admin\HolidayPackageController as AdminHolidayPackageController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [LoginController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

// Holiday Packages
Route::get('/packages', [PublicHolidayPackageController::class, 'index']);
Route::get('/packages/{holidayPackage}', [PublicHolidayPackageController::class, 'show']);

// ✅ FIXED: Use the correct aliased controller name
Route::get('/public/car-rentals', [PublicCarRentalController::class, 'index']);
Route::get('/public/car-rentals/{carRental}', [PublicCarRentalController::class, 'show']);

// Activities
Route::get('/activities', [PublicActivityController::class, 'index']);
Route::get('/activities/{activity}', [PublicActivityController::class, 'show']);


Route::post('/midtrans/notification', [PaymentController::class, 'notificationHandler']);

/*
|--------------------------------------------------------------------------
| Authenticated Client API Routes
|--------------------------------------------------------------------------
*/
// ... inside the Route::middleware('auth:sanctum')->group(...)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/trip-planner', [TripPlannerController::class, 'show']);
    Route::post('/trip-planner', [TripPlannerController::class, 'store']);
    Route::get('/user', fn (Request $request) => $request->user());
    Route::get('/my-orders', [OrderController::class, 'index']);

    // ✅ ADD THIS LINE TO FETCH THE USER'S BOOKINGS
    Route::get('/bookings', [BookingController::class, 'index']);

    Route::post('/car-rentals/{carRental}/book', [BookingController::class, 'storeCarRentalBooking']);

    Route::get('/{booking}', [BookingController::class, 'show']);
    Route::put('/{booking}', [BookingController::class, 'update']);
    Route::delete('/{booking}', [BookingController::class, 'destroy']);

    Route::post('/orders/{order}/pay', [PaymentController::class, 'createOrderTransaction']);
    Route::post('/payment/token', [PaymentController::class, 'createTransaction']);
});
/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('holiday-packages', AdminHolidayPackageController::class);
});