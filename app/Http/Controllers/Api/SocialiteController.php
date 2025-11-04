<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    /**
     * Redirect the user to the provider's authentication page.
     */
    public function redirectToProvider($provider)
    {
        // We must use stateless() because we are in an API context
        $redirectUrl = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        return response()->json([
            'redirect_url' => $redirectUrl,
        ]);
    }

    /**
     * Obtain the user information from the provider.
     */
    public function handleProviderCallback($provider)
    {
        try {
            // Get user info from provider
            $socialUser = Socialite::driver($provider)->stateless()->user();

            // Find or create the user in our database
            $user = User::updateOrCreate(
                [
                    // Use the provider's ID to find the user
                    $provider . '_id' => $socialUser->getId(),
                ],
                [
                    // Or create them if they don't exist
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'avatar' => $socialUser->getAvatar(),
                    'password' => Hash::make(Str::random(24)), // Create a random password
                    'role' => 'client', // Set default role
                ]
            );

            // Create a Sanctum token for the user
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect back to the frontend with the token
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

            return redirect()->away(
                $frontendUrl . '/auth/callback?token=' . $token . '&name=' . urlencode($user->name)
            );

        } catch (\Exception $e) {
            // Handle error
            report($e);
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect()->away($frontendUrl . '/login?error=social_login_failed');
        }
    }
}
