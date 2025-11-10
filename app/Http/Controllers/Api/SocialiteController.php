<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
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
        try {
            // We must use stateless() because we are in an API context
            $redirectUrl = Socialite::driver($provider)
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json(['redirect_url' => $redirectUrl]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Unable to redirect: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Obtain the user information from the provider.
     */
    public function handleProviderCallback(Request $request, $provider)
    {
        try {
            // Get user info from Google/Facebook
            $socialUser = Socialite::driver($provider)->stateless()->user();

            $userEmail = $socialUser->getEmail();
            $userName = $socialUser->getName();
            $providerId = $socialUser->getId();

            // Check if user already exists
            $user = User::where('email', $userEmail)->first();

            if ($user) {
                // Update existing user’s provider ID and mark as verified
                $user->update([
                    $provider . '_id' => $providerId,
                    'email_verified_at' => now(),
                ]);
            } else {
                // Create a new verified user with random secure password
                $user = User::create([
                    'name' => $userName,
                    'email' => $userEmail,
                    $provider . '_id' => $providerId,
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(24)),
                ]);
            }

            // Create token for the user
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect back to frontend with the token
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

            return redirect()->away(
                $frontendUrl . '/auth/callback?token=' . $token . '&name=' . urlencode($user->name)
            );

        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect()->away($frontendUrl . '/login?error=social_failed');
        }
    }
}
