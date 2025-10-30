<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
use App\Http\Controllers\Api\Client\LoginController;
use App\Http\Controllers\Api\Public\HolidayPackageController;
use App\Http\Controllers\Api\Public\CarRentalController as PublicCarRentalController; // Correctly aliased
use App\Http\Controllers\Api\Public\ActivityController as PublicActivityController;
use App\Http\Controllers\Api\TripPlannerController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\UserController as ApiAdminUserController; // Aliased to avoid conflict
use App\Http\Controllers\Api\Public\PostController as PublicPostController; // ✅ ADD THIS
/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
|
| Routes accessible without authentication.
| All these routes are automatically prefixed with /api by Laravel.
|
*/

// --- Authentication ---
Route::post('/register', [LoginController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

// --- Public Listings ---
// ✅ TAMBAHKAN/UBAH: Rute untuk Holiday Packages
Route::get('/public/packages', [HolidayPackageController::class, 'index']);
Route::get('/public/packages/{id}', [HolidayPackageController::class, 'show']);

Route::get('/public/car-rentals', [PublicCarRentalController::class, 'index']);
Route::get('/public/car-rentals/{carRental}', [PublicCarRentalController::class, 'show']);
Route::get('/public/car-rentals/{carRental}/availability', [PublicCarRentalController::class, 'getAvailability']);

Route::get('/activities', [PublicActivityController::class, 'index']);
Route::get('/activities/{activity}', [PublicActivityController::class, 'show']);
// --- Webhooks ---
// ✅ FIXED: Added the implicit /api prefix to match Ngrok/CSRF setup
// This route should NOT have auth middleware.
Route::post('/midtrans/notification', [PaymentController::class, 'notificationHandler']);

// ✅ ADD THESE TWO NEW ROUTES FOR THE BLOG
    Route::get('/public/posts', [PublicPostController::class, 'index']);
    Route::get('/public/posts/{slug}', [PublicPostController::class, 'show']);
/*
|--------------------------------------------------------------------------
| Authenticated Client API Routes
|--------------------------------------------------------------------------
|
| Routes requiring user authentication (Sanctum).
| All these routes are automatically prefixed with /api by Laravel.
|
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', fn (Request $request) => $request->user());

    // --- Trip Planner ---
    Route::get('/trip-planner', [TripPlannerController::class, 'show']);
    Route::post('/trip-planner', [TripPlannerController::class, 'store']);
    Route::post('/trip-planner/book', [BookingController::class, 'storeTripPlannerBooking']); // Keep specific booking route


    Route::post('/packages/{packageId}/book', [BookingController::class, 'storeHolidayPackageBooking']);
    // --- Car Rentals ---
    Route::post('/car-rentals/{carRental}/book', [BookingController::class, 'storeCarRentalBooking']);
    // --- Activity Booking ---
    Route::post('/activities/{activity}/book', [BookingController::class, 'storeActivityBooking']); // <-- Add this

    // --- Orders & History ---
    Route::get('/my-orders', [OrderController::class, 'index']);
    Route::get('/my-orders/{id}', [OrderController::class, 'show']); // Added show route
    Route::get('/bookings', [BookingController::class, 'index']); // Get user's bookings (consider removing if orders are enough)
    // Removed old booking show/update/delete, manage through orders

    // --- Payment ---
    Route::post('/payment/create-transaction', [PaymentController::class, 'createTransaction']);
    // Removed /orders/{order}/pay and /payment/token as they are covered by create-transaction

});

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
|
| Routes requiring admin authentication.
| These routes are prefixed with /api/admin.
|
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Using apiResource automatically creates standard CRUD routes
    // (index, store, show, update, destroy)

    Route::apiResource('users', ApiAdminUserController::class); // Use aliased controller
    Route::apiResource('holiday-packages', AdminHolidayPackageController::class);
    // Add apiResources for other admin sections (CarRentals, Activities, Orders, etc.) here
    // Example:
    // Route::apiResource('car-rentals', \App\Http\Controllers\Admin\CarRentalController::class);
    // Route::apiResource('activities', \App\Http\Controllers\Admin\ActivityController::class);
    // Route::apiResource('orders', \App\Http\Controllers\Admin\OrderController::class);
    // Route::apiResource('transactions', \App\Http\Controllers\Admin\TransactionController::class);
});
