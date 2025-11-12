<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User; //
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request, $id)
    {
        $user = User::find($id); //

        // --- 1. Handle Invalid User ---
        if (!$user) {
            return response()->json(['message' => 'Invalid user.'], 404);
        }

        // --- 2. Check Hash ---
        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 401);
        }

        // --- 3. Check if Already Verified ---
        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 200);
        }

        // --- 4. Mark as Verified ---
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // --- 5. Return Success JSON ---
        return response()->json(['message' => 'Email verified successfully. You can now log in.']);
    }

    /* We no longer need the buildFrontendRedirect helper function */
}
