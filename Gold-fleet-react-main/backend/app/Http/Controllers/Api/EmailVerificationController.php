<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Verified;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class EmailVerificationController extends Controller
{
    /**
     * Quick verification endpoint - For API-based verification
     * Used during login flow when user needs to verify email
     * 
     * Development: Can be called without authentication
     * Production: Should be protected
     */
    public function quickVerify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        Log::info('Quick email verification request via API', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $request->ip(),
            'timestamp' => now(),
        ]);

        if ($user->hasVerifiedEmail()) {
            Log::warning('Quick verify: Email already verified', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Email already verified',
                'email_verified_at' => $user->email_verified_at,
            ], 400);
        }

        // Mark as verified
        if ($user->markEmailAsVerified()) {
            Log::info('✓ EMAIL VERIFIED VIA API - USER CAN NOW LOGIN', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'email' => $user->email,
                'verified_at' => $user->email_verified_at,
                'ip_address' => $request->ip(),
                'timestamp' => now(),
            ]);

            event(new Verified($user));
        }

        return response()->json([
            'success' => true,
            'message' => '✓ Email verified successfully! You can now login.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
            'next_step' => 'Login with your email and password',
        ]);
    }

    /**
     * Send email verification notification
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            Log::info('Email verification already completed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'verified_at' => $user->email_verified_at,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Email already verified',
            ], 400);
        }

        Log::info('Email verification notification sent', [
            'user_id' => $user->id,
            'email' => $user->email,
            'timestamp' => now(),
        ]);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Verification email sent',
        ]);
    }

    /**
     * Verify email with signed URL
     */
    public function verify(Request $request, $id, $hash): JsonResponse
    {
        Log::info('Email verification attempt', [
            'user_id' => $id,
            'hash_provided' => substr($hash, 0, 10) . '...',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);

        try {
            $user = User::findOrFail($id);

            if ($user->hasVerifiedEmail()) {
                Log::warning('Email verification attempted for already verified user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'verified_at' => $user->email_verified_at,
                    'ip_address' => $request->ip(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Email already verified',
                ], 400);
            }

            $expectedHash = hash('sha256', $user->getEmailForVerification());
            
            if (!hash_equals((string) $hash, $expectedHash)) {
                Log::warning('Invalid email verification hash', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'provided_hash' => substr($hash, 0, 10) . '...',
                    'expected_hash' => substr($expectedHash, 0, 10) . '...',
                    'ip_address' => $request->ip(),
                    'timestamp' => now(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification link',
                ], 400);
            }

            if ($user->markEmailAsVerified()) {
                Log::info('✓ EMAIL VERIFICATION SUCCESSFUL', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'email' => $user->email,
                    'verified_at' => $user->email_verified_at,
                    'ip_address' => $request->ip(),
                    'timestamp' => now(),
                    'message' => 'User email successfully verified and marked as verified in database',
                ]);
                
                event(new Verified($user));
            }

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Email verification: User not found', [
                'user_id' => $id,
                'ip_address' => $request->ip(),
                'timestamp' => now(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Email verification failed with exception', [
                'user_id' => $id,
                'error' => $e->getMessage(),
                'ip_address' => $request->ip(),
                'timestamp' => now(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}

