<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---

// Public Controllers
use App\Http\Controllers\Api\Public\HolidayPackageController as PublicHolidayPackageController;
use App\Http\Controllers\Api\Public\CarRentalController as PublicCarRentalController;
use App\Http\Controllers\Api\Public\ActivityController as PublicActivityController;
use App\Http\Controllers\Api\TripPlannerController;

// Authenticated Client Controllers
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\OrderController; // Import the new controller
// Admin Controllers
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\HolidayPackageController as AdminHolidayPackageController;


/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
|
| These routes are accessible to everyone for the client-side application.
|
*/

// Holiday Packages
Route::get('/packages', [PublicHolidayPackageController::class, 'index']);
Route::get('/packages/{holidayPackage}', [PublicHolidayPackageController::class, 'show']);

// Car Rentals
Route::get('/car-rentals', [PublicCarRentalController::class, 'index']);
Route::get('/car-rentals/{carRental}', [PublicCarRentalController::class, 'show']);

// Activities
Route::get('/activities', [PublicActivityController::class, 'index']);
Route::get('/activities/{activity}', [PublicActivityController::class, 'show']);

// Trip Planner Submission
Route::post('/trip-planners', [TripPlannerController::class, 'store']);


/*
|--------------------------------------------------------------------------
| Authenticated Client API Routes
|--------------------------------------------------------------------------
|
| These routes require a user to be logged in (client or admin).
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/my-orders', [OrderController::class, 'index']);
    // Booking & Payment (Note: This is now part of the Order system)
    // You will likely replace 'bookings' with 'orders' soon.
    Route::post('/bookings', [BookingController::class, 'store']); 
    Route::post('/payment/token', [PaymentController::class, 'createTransaction']);
});


/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
|
| These routes are protected and only accessible by users with the 'admin' role.
|
*/

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('holiday-packages', AdminHolidayPackageController::class);
    // You will add admin routes for your other services here.
});