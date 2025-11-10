<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Auth\Events\Registered; // ✅ 1. Import this
class ProfileController extends Controller
{
    /**
     * Get the user's profile data.
     */
    public function show(Request $request)
    {
        // We just return the user, as the 'User' model
        // doesn't have the 'full_name' etc. fields yet.
        // You will need to add these fields to your User model and migration.
        return response()->json($request->user());
    }

    /**
     * Update the user's profile data.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'full_name' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'nationality' => ['nullable', 'string', Rule::in(['WNI', 'WNA'])],
        ]);

        // !! IMPORTANT !!
        // You must add 'full_name', 'phone_number', and 'nationality'
        // to the $fillable array in your app/Models/User.php file!

        $user->update($validated);

        return response()->json($user);
    }
    public function updateEmail(Request $request)
    {
        $user = Auth::user();

        // 1. Validate the new email
        $validated = $request->validate([
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id), // Must be unique
            ],
        ]);

        // 2. Update the user's email and reset verification
        $user->forceFill([
            'email' => $validated['email'],
            'email_verified_at' => null,
        ])->save();

        // 3. Send a new verification email to the new address
        // This re-uses the event from registration.
        event(new Registered($user));

        // 4. Return the updated user
        return response()->json($user);
    }
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent!']);
    }
}
