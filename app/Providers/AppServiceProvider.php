<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\CarRental;          // ✅ ADD THIS
use App\Observers\CarRentalObserver; // ✅ ADD THIS

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
    }
}
