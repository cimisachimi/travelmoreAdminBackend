<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Controller Imports ---
use App\Http\Controllers\Api\Client\LoginController;
use App\Http\Controllers\Api\Public\HolidayPackageController;
use App\Http\Controllers\Api\Public\CarRentalController as PublicCarRentalController;
use App\Http\Controllers\Api\Public\ActivityController as PublicActivityController;
use App\Http\Controllers\Api\TripPlannerController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\UserController as ApiAdminUserController;
use App\Http\Controllers\Api\Public\PostController as PublicPostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\SocialiteController;
use App\Http\Controllers\Api\Public\PlannerController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\Public\OpenTripController;
use App\Http\Controllers\Api\Public\GalleryController;
use App\Http\Controllers\Api\Public\BannerController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// 1. Critical Auth Routes (Strict Throttling)
Route::middleware('throttle:login')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [LoginController::class, 'register']);
});

// 2. Public Content Routes (Standard API Throttling)
Route::middleware('throttle:api')->group(function () {
    Route::get('/public/packages', [HolidayPackageController::class, 'index']);
    Route::get('/public/packages/{id}', [HolidayPackageController::class, 'show']);
    Route::get('/public/packages/slug/{slug}', [HolidayPackageController::class, 'showBySlug']);

    Route::get('/open-trips', [OpenTripController::class, 'index']);
    Route::get('/open-trips/{id}', [OpenTripController::class, 'show']);

    Route::get('/public/car-rentals', [PublicCarRentalController::class, 'index']);
    Route::get('/public/car-rentals/{carRental}', [PublicCarRentalController::class, 'show']);
    Route::get('/public/car-rentals/{carRental}/availability', [PublicCarRentalController::class, 'getAvailability']);

    Route::get('/activities', [PublicActivityController::class, 'index']);
    Route::get('/activities/{activity}', [PublicActivityController::class, 'show']);

    Route::get('/public/posts', [PublicPostController::class, 'index']);
    Route::get('/public/posts/{slug}', [PublicPostController::class, 'show']);
    Route::get('/public/banner', [BannerController::class, 'index']);

    Route::get('/public/planner-config', [PlannerController::class, 'getConfig']);
    Route::post('/booking/check-price', [BookingController::class, 'checkPrice']);
    Route::get('/public/galleries', [GalleryController::class, 'index']);
});

// 3. Webhooks & Special Routes (No/Specific Throttling)
// Midtrans is excluded to ensure payment notifications are always received
Route::post('/midtrans/notification', [PaymentController::class, 'notificationHandler']);

Route::get('/auth/{provider}/redirect', [SocialiteController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'handleProviderCallback']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->name('verification.verify.api')
    ->middleware(['signed', 'throttle:6,1']);

/*
|--------------------------------------------------------------------------
| Authenticated Client API Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', fn (Request $request) => $request->user());

    Route::post('/email/verification-notification', [ProfileController::class, 'resendVerification'])
        ->name('verification.send');

    // PROFILE
    Route::get('/my-profile', [ProfileController::class, 'show']);
    Route::put('/my-profile', [ProfileController::class, 'update']);
    Route::put('/email/update', [ProfileController::class, 'updateEmail']);

    // TRIP PLANNER
    // TRIP PLANNER
    Route::get('/trip-planner', [TripPlannerController::class, 'show']);
    Route::post('/trip-planner', [TripPlannerController::class, 'store']);
    Route::get('/trip-planner/{id}', [TripPlannerController::class, 'show']); // View specific

    Route::post('/trip-planner/book', [BookingController::class, 'storeTripPlannerBooking']);

    // BOOKINGS
    Route::post('/open-trips/{id}/book', [BookingController::class, 'storeOpenTripBooking']);
    Route::post('/packages/{packageId}/book', [BookingController::class, 'storeHolidayPackageBooking']);
    Route::post('/car-rentals/{carRental}/book', [BookingController::class, 'storeCarRentalBooking']);
    Route::post('/activities/{activity}/book', [BookingController::class, 'storeActivityBooking']);

    // ORDERS & HISTORY
    Route::get('/my-orders', [OrderController::class, 'index']);
    Route::get('/my-orders/{id}', [OrderController::class, 'show']);
    Route::get('/my-bookings', [BookingController::class, 'index']);

    // PAYMENT
    Route::post('/payment/create-transaction', [PaymentController::class, 'createTransaction']);

    // REFUNDS
    Route::get('/my-refunds', [RefundController::class, 'index']);
    Route::post('/my-refunds', [RefundController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin', 'throttle:api'])->prefix('admin')->group(function () {
    // Standard CRUD for Admin (Example placeholders - Add your specific admin resources here)
    // Route::apiResource('car-rentals', \App\Http\Controllers\Admin\CarRentalController::class);
});
