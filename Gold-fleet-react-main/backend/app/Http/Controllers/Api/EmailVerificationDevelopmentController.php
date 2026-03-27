<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Email Verification Development Controller
 * 
 * This controller provides development-only endpoints to manage email verification
 * It allows viewing pending verifications and clicking links directly without email
 */
class EmailVerificationDevelopmentController extends Controller
{
    /**
     * Get all users with their verification status and clickable verification links
     * DEVELOPMENT ONLY - Shows verification links
     */
    public function getPendingVerifications(): JsonResponse
    {
        // Only allow in development environment
        if (!app()->environment('local', 'development')) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is only available in development environment',
            ], 403);
        }

        $users = User::select('id', 'name', 'email', 'email_verified_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                $isVerified = $user->email_verified_at !== null;
                $hash = hash('sha256', $user->email);
                $verificationLink = config('app.frontend_url', 'http://localhost:5173') . 
                                   '/email/verify?id=' . $user->id . '&hash=' . $hash;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'verified' => $isVerified,
                    'verified_at' => $user->email_verified_at,
                    'registered_at' => $user->created_at,
                    'status' => $isVerified ? '✅ VERIFIED' : '⏳ PENDING VERIFICATION',
                    'verification_link' => $verificationLink,
                    'api_verification_endpoint' => '/api/email/verify/' . $user->id . '/' . $hash,
                ];
            });

        $pendingCount = $users->where('verified', false)->count();
        $verifiedCount = $users->where('verified', true)->count();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_users' => $users->count(),
                'verified_users' => $verifiedCount,
                'pending_verifications' => $pendingCount,
            ],
            'users' => $users,
            'instructions' => [
                'To verify an email:' => [
                    '1. Copy the "verification_link" URL',
                    '2. Paste it in your browser',
                    '3. The email will be marked as verified',
                ],
                'Alternative (API)' => [
                    'GET /api/email/verify/{id}/{hash}',
                    'Example: GET /api/email/verify/1/abc123...',
                ],
                'Check logs' => [
                    'Search laravel.log for: "EMAIL VERIFICATION LINK - DEVELOPMENT MODE"',
                    'Search for: "CLICK LINK TO VERIFY EMAIL"',
                ],
            ],
        ]);
    }

    /**
     * Get a single user's verification status with clickable link
     * DEVELOPMENT ONLY
     */
    public function getUserVerificationStatus($userId): JsonResponse
    {
        // Only allow in development environment
        if (!app()->environment('local', 'development')) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is only available in development environment',
            ], 403);
        }

        $user = User::findOrFail($userId);
        $isVerified = $user->email_verified_at !== null;
        $hash = hash('sha256', $user->email);
        $verificationLink = config('app.frontend_url', 'http://localhost:5173') . 
                           '/email/verify?id=' . $user->id . '&hash=' . $hash;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'verified' => $isVerified,
                'verified_at' => $user->email_verified_at,
                'registered_at' => $user->created_at,
                'status' => $isVerified ? '✅ VERIFIED' : '⏳ PENDING VERIFICATION',
            ],
            'verification_link' => $verificationLink,
            'api_endpoint' => '/api/email/verify/' . $user->id . '/' . $hash,
            'instructions' => $isVerified 
                ? 'This user\'s email is already verified'
                : 'Click the verification_link URL above to verify this user\'s email',
        ]);
    }

    /**
     * Force verify a user's email (Development only)
     * DEVELOPMENT ONLY - Useful for testing
     */
    public function forceVerifyEmail($userId): JsonResponse
    {
        // Only allow in development environment
        if (!app()->environment('local', 'development')) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is only available in development environment',
            ], 403);
        }

        $user = User::findOrFail($userId);

        if ($user->email_verified_at !== null) {
            return response()->json([
                'success' => false,
                'message' => 'This user\'s email is already verified',
                'email_verified_at' => $user->email_verified_at,
            ], 400);
        }

        // Force mark as verified
        $user->markEmailAsVerified();

        return response()->json([
            'success' => true,
            'message' => 'User email forcibly verified (DEVELOPMENT ONLY)',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    /**
     * Resend verification email to a user
     * DEVELOPMENT & PRODUCTION
     */
    public function resendVerificationEmail($userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        if ($user->email_verified_at !== null) {
            return response()->json([
                'success' => false,
                'message' => 'This user\'s email is already verified',
            ], 400);
        }

        try {
            $user->sendEmailVerificationNotification();

            return response()->json([
                'success' => true,
                'message' => 'Verification email sent to: ' . $user->email,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
                'development_info' => app()->environment('local', 'development')
                    ? 'Check laravel.log for verification link (search for "CLICK LINK TO VERIFY EMAIL")'
                    : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification email: ' . $e->getMessage(),
            ], 500);
        }
    }
}
