<?php

namespace App\Notifications\Auth;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomVerifyEmailNotification extends Notification
{
    /**
     * Get the notification's channels.
     *
     * @param  mixed  $notifiable
     * @return array|string
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        // This generates the signed frontend URL
        $verificationUrl = $this->verificationUrl($notifiable);

        // --- START CUSTOMIZING HERE ---
        return (new MailMessage)
            ->subject('Verify Your Email Address for TravelMore')
            ->line('Hi ' . $notifiable->name . ', thanks for signing up!')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email Address', $verificationUrl) // This is the button
            ->line('If you did not create an account, no further action is required.');
        // --- END CUSTOMIZING ---
    }

    /**
     * Get the verification URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function verificationUrl($notifiable)
    {
        // This is the same logic we previously put in AppServiceProvider.
        // It creates the signed API route.
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify.api', // The name of our API route
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // This is the frontend URL from your config/app.php
        $frontendUrl = Config::get('app.frontend_url');

        // This is the final URL that goes in the email
        // e.g., https://frontend.com/verify-email?verify_url=...
        return $frontendUrl . '/verify-email?verify_url=' . urlencode($apiUrl);
    }
}
