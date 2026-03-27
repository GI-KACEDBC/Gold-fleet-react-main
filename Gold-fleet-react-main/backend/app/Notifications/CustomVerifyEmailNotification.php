<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmailNotification extends VerifyEmail
{
    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        
        // Log in DEVELOPMENT mode - include clickable link
        if (app()->environment('local', 'development')) {
            Log::info('═══════════════════════════════════════════════════════════════');
            Log::info('📧 EMAIL VERIFICATION LINK - DEVELOPMENT MODE');
            Log::info('═══════════════════════════════════════════════════════════════');
            Log::info('User: ' . $notifiable->name . ' (' . $notifiable->email . ')');
            Log::info('User ID: ' . $notifiable->id);
            Log::info('─────────────────────────────────────────────────────────────');
            Log::info('🔗 CLICK LINK TO VERIFY EMAIL:');
            Log::info($verificationUrl);
            Log::info('─────────────────────────────────────────────────────────────');
            Log::info('Or open in your application:');
            Log::info('Frontend will receive: id=' . $notifiable->id . '&hash=' . hash('sha256', $notifiable->getEmailForVerification()));
            Log::info('═══════════════════════════════════════════════════════════════');
        } else {
            // Production logging
            Log::info('Email verification notification queued for sending', [
                'user_id' => $notifiable->id,
                'email' => $notifiable->email,
                'verification_url_generated' => true,
                'timestamp' => now(),
            ]);
        }

        return $this->buildMailMessage($verificationUrl);
    }

    /**
     * Get the email verification URL for the notifiable.
     */
    protected function verificationUrl($notifiable)
    {
        // Generate verification URL with id and hash
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $id = $notifiable->getKey();
        $hash = hash('sha256', $notifiable->getEmailForVerification());
        
        return $frontendUrl . '/email/verify?id=' . $id . '&hash=' . $hash;
    }

    /**
     * Build the mail message with Gold Fleet branding.
     */
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Verify Your Email Address - Gold Fleet')
            ->greeting('Welcome to Gold Fleet!')
            ->line('Thank you for registering with us. Please verify your email address by clicking the button below.')
            ->action('Verify Email Address', $url)
            ->line('This verification link will expire in 60 minutes.')
            ->line('If you did not create this account, please ignore this email.')
            ->salutation('Best regards, Gold Fleet Team')
            ->footer('If you're having trouble clicking the link above, copy and paste this URL into your browser:')
            ->footerText($url);
    }
}
