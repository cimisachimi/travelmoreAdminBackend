<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\CarRental;          // ✅ ADD THIS
use App\Observers\CarRentalObserver; // ✅ ADD THIS
use Illuminate\Cache\RateLimiting\Limit; // Add this
use Illuminate\Support\Facades\RateLimiter; // Add this
use Illuminate\Http\Request; // Add this

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        CarRental::observe(CarRentalObserver::class); // ✅ ADD THIS
        // Define a general API rate limiter (e.g., 60 requests per minute)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Define a stricter limiter for sensitive endpoints like Login
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
