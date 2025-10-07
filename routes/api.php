<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controller Imports
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\HolidayPackageController as AdminHolidayPackageController;
use App\Http\Controllers\Api\Public\HolidayPackageController as PublicHolidayPackageController;
use App\Http\Controllers\Api\BookingController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
|
| These routes are accessible to everyone, including unauthenticated users.
|
*/

Route::get('/packages', [PublicHolidayPackageController::class, 'index']);
Route::get('/packages/{holidayPackage}', [PublicHolidayPackageController::class, 'show']);


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

    // Booking a package
    Route::post('/bookings', [BookingController::class, 'store']);
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
});