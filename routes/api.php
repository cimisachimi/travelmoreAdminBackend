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
use App\Http\Controllers\Api\ProfileController; // ✅ 1. ADD THIS
use App\Http\Controllers\Api\RefundController; // ✅ ADD THIS
use App\Http\Controllers\Api\SocialiteController; // Add this import
use App\Http\Controllers\Api\Public\PlannerController; // ✅ ADD THIS
use App\Http\Controllers\Api\EmailVerificationController; // <-- ADD THIS
use App\Http\Controllers\Api\Public\OpenTripController; // Import Controller
use App\Http\Controllers\Api\Public\GalleryController; // Don't forget to import this!

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

Route::get('/open-trips', [OpenTripController::class, 'index']);
Route::get('/open-trips/{id}', [OpenTripController::class, 'show']);

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

// SOCIALITE AUTH ROUTES
Route::get('/auth/{provider}/redirect', [SocialiteController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'handleProviderCallback']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->name('verification.verify.api') // <-- Must match the name from Step 1
    ->middleware(['signed', 'throttle:6,1']); // 'signed' middleware is crucial for security

Route::get('/public/planner-config', [PlannerController::class, 'getConfig']);

Route::get('/public/galleries', [GalleryController::class, 'index']);
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

    Route::post('/email/verification-notification', [ProfileController::class, 'resendVerification'])
        ->name('verification.send');

    // PROFILE
    Route::get('/my-profile', [ProfileController::class, 'show']);     // ✅ 3. ADD THIS (For SettingsTab)
    Route::put('/my-profile', [ProfileController::class, 'update']);   // ✅ 4. ADD THIS (For SettingsTab)
 //   Route::get('/my-refunds', [RefundController::class, 'index']);    // ✅ 6. ADD THIS (For RefundsTab)

    Route::put('/email/update', [ProfileController::class, 'updateEmail']); // ✅ ADD THIS
    // --- Trip Planner ---
    Route::get('/trip-planner', [TripPlannerController::class, 'show']);
    Route::post('/trip-planner', [TripPlannerController::class, 'store']);
    Route::post('/trip-planner/book', [BookingController::class, 'storeTripPlannerBooking']); // Keep specific booking route

    Route::post('/open-trips/{id}/book', [BookingController::class, 'storeOpenTripBooking']);

    Route::post('/packages/{packageId}/book', [BookingController::class, 'storeHolidayPackageBooking']);
    // --- Car Rentals ---
    Route::post('/car-rentals/{carRental}/book', [BookingController::class, 'storeCarRentalBooking']);
    // --- Activity Booking ---
    Route::post('/activities/{activity}/book', [BookingController::class, 'storeActivityBooking']); // <-- Add this

    // --- Orders & History ---
    Route::get('/my-orders', [OrderController::class, 'index']);
    Route::get('/my-orders/{id}', [OrderController::class, 'show']); // Added show route
    Route::get('/my-bookings', [BookingController::class, 'index']); // Get user's bookings (consider removing if orders are enough)
    // Removed old booking show/update/delete, manage through orders

    // --- Payment ---
    Route::post('/payment/create-transaction', [PaymentController::class, 'createTransaction']);
    // Removed /orders/{order}/pay and /payment/token as they are covered by create-transaction
    // REFUNDS
    Route::get('/my-refunds', [RefundController::class, 'index']);
    Route::post('/my-refunds', [RefundController::class, 'store']); // Add this line

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

    // Add apiResources for other admin sections (CarRentals, Activities, Orders, etc.) here
    // Example:
    // Route::apiResource('car-rentals', \App\Http\Controllers\Admin\CarRentalController::class);
    // Route::apiResource('activities', \App\Http\Controllers\Admin\ActivityController::class);
    // Route::apiResource('orders', \App\Http\Controllers\Admin\OrderController::class);
    // Route::apiResource('transactions', \App\Http\Controllers\Admin\TransactionController::class);
});
