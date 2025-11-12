<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User; //
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Config;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     *
     * This method is called by the frontend after extracting the 'verify_url'
     * from the email link.
     */
    public function verify(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->buildFrontendRedirect(false, 'invalid_user');
        }

        // Check if the hash is valid
        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return $this->buildFrontendRedirect(false, 'invalid_link');
        }

        // Check if already verified
        if ($user->hasVerifiedEmail()) {
            return $this->buildFrontendRedirect(true, 'already_verified');
        }

        // Verify the user
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return $this->buildFrontendRedirect(true, 'success');
    }

    /**
     * Helper function to build the final redirect to the frontend.
     * This provides a better user experience than showing a JSON.
     */
    protected function buildFrontendRedirect(bool $success, string $status)
    {
        $frontendUrl = Config::get('app.frontend_url', 'http://localhost:3000');

        // Redirect to a frontend page (e.g., /login or /verification-status)
        // You can customize this URL
        $redirectUrl = $frontendUrl . '/login?verification_status=' . $status;

        return redirect()->away($redirectUrl);
    }
}
