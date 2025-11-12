<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\CarRental;          // ✅ ADD THIS
use App\Observers\CarRentalObserver; // ✅ ADD THIS
use Illuminate\Auth\Notifications\VerifyEmail; // 1. IMPORT THIS
use Illuminate\Notifications\Messages\MailMessage; // 2. IMPORT THIS
use Illuminate\Support\Facades\URL; // 3. IMPORT THIS
use Illuminate\Support\Facades\Config; // 4. IMPORT THIS
use Illuminate\Support\Carbon; // 5. IMPORT THIS


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

        // --- 6. ADD THIS ENTIRE BLOCK ---
        VerifyEmail::createUrlUsing(function ($notifiable) {
            // Get your frontend URL from config/app.php
            $frontendUrl = Config::get('app.frontend_url');

            // Create the signed API verification route
            $verifyUrl = URL::temporarySignedRoute(
                'verification.verify.api', // The name of our new API route
                Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );

            // Create the link for the email
            // Example: https://travelmore-topaz.vercel.app/verify-email?verify_url=...
            return $frontendUrl . '/verify-email?verify_url=' . urlencode($verifyUrl);
        });
    }
}
