<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Handle user login and return API token.
     * ONLY allows drivers to login via this endpoint.
     * Company admins and platform admins must use their separate login endpoints.
     * 
     * NOTE: Email verification is required before login.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Prevent company admins and platform admins from logging in via this endpoint
        if (!in_array($user->role, ['driver'])) {
            return response()->json([
                'success' => false,
                'message' => 'This login method is for drivers only. Please use the appropriate admin login portal.',
            ], 403);
        }

        // ========== EMAIL VERIFICATION REQUIRED ==========
        // Check if user's email is verified
        if (!$user->hasVerifiedEmail()) {
            \Illuminate\Support\Facades\Log::warning('Login attempt with unverified email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => $request->ip(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Please verify your email before logging in',
                'code' => 'EMAIL_NOT_VERIFIED',
                'user_id' => $user->id,
                'email' => $user->email,
                'action_required' => 'email_verification',
                'verification_link' => 'Check storage logs for verification link or use API endpoint',
                'api_endpoint' => '/api/dev/email/user/' . $user->id . '/status',
                'instructions' => [
                    '1. Option A: Use API to get verification link: GET /api/dev/email/user/' . $user->id . '/status',
                    '2. Option B: Check laravel.log for "CLICK LINK TO VERIFY EMAIL" marker',
                    '3. Option C: Force verify in development: POST /api/dev/email/user/' . $user->id . '/force-verify',
                    '4. Then click the link or use the verify endpoint',
                ],
            ], 401);
        }

        // Generate a simple token (use Str::random(80) or a more robust method in production)
        $token = \Illuminate\Support\Str::random(80);
        $user->update(['api_token' => $token]);
        
        \Illuminate\Support\Facades\Log::info('User login successful', [
            'user_id' => $user->id,
            'email' => $user->email,
            'email_verified' => true,
            'ip_address' => $request->ip(),
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'account_status' => $user->account_status,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'account_status' => $user->company->account_status,
                'company_status' => $user->company->company_status,
                'subscription_status' => $user->company->subscription_status,
            ] : null,
        ]);
    }

    /**
     * Handle user registration and send verification email.
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
                'password' => ['required', 'confirmed', 'min:8'],
                'company_name' => ['required', 'string', 'max:255'],
                'company_email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.Company::class.',email'],
                'company_phone' => ['nullable', 'string', 'max:20'],
                'company_address' => ['nullable', 'string', 'max:500'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        // Use database transaction to ensure atomicity
        try {
            $result = DB::transaction(function () use ($validated) {
                // Generate unique access code for drivers to join
                $accessCode = strtoupper(\Illuminate\Support\Str::random(8));
                
                // Create company with initial statuses
                $company = Company::create([
                    'name' => $validated['company_name'],
                    'email' => $validated['company_email'],
                    'phone' => $validated['company_phone'] ?? null,
                    'address' => $validated['company_address'] ?? null,
                    'access_code' => $accessCode,
                    'account_status' => 'verified',        // Automatically verified on registration
                    'company_status' => 'pending',          // Waiting for admin approval after payment
                    'subscription_status' => 'none',        // No active subscription yet
                ]);

                // Create user with verified account status
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'admin',
                    'company_id' => $company->id,
                    'account_status' => 'verified',        // Automatically verified on registration
                ]);

                // Create api token so user can use the API immediately
                $token = \Illuminate\Support\Str::random(80);
                $user->update(['api_token' => $token]);

                return compact('user', 'company', 'token');
            });

            return response()->json([
                'success' => true,
                'message' => 'Registration successful.',
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                    'account_status' => $result['user']->account_status,
                    'email_verified' => (bool) $result['user']->email_verified_at,
                ],
                'company' => [
                    'id' => $result['company']->id,
                    'name' => $result['company']->name,
                    'email' => $result['company']->email,
                    'access_code' => $result['company']->access_code,
                    'account_status' => $result['company']->account_status,
                    'company_status' => $result['company']->company_status,
                    'subscription_status' => $result['company']->subscription_status,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rollback signup - delete user and company if subscription setup fails.
     * This is called from the frontend if the subscription creation fails.
     */
    public function cancelSignup(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'company_id' => 'required|integer|exists:companies,id',
            ]);

            // Use transaction to delete both atomically
            DB::transaction(function () use ($validated) {
                // Delete user
                User::findOrFail($validated['user_id'])->delete();
                // Delete company
                Company::findOrFail($validated['company_id'])->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Signup cancelled and user/company deleted.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel signup: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->update(['api_token' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'account_status' => $user->account_status,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'account_status' => $user->company->account_status,
                'company_status' => $user->company->company_status,
                'subscription_status' => $user->company->subscription_status,
            ] : null,
        ]);
    }

    /**
     * Handle driver registration with company code.
     */
    public function driverRegister(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
                'password' => ['required', 'confirmed', 'min:8'],
                'company_code' => ['required', 'string'],
                'phone' => ['nullable', 'string', 'max:20'],
                'license_number' => ['nullable', 'string', 'max:255'],
                'license_expiry' => ['nullable', 'date'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            // Find company by access code
            $company = Company::where('access_code', $validated['company_code'])->first();
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid company code. Please contact your administrator.',
                ], 404);
            }

            $result = DB::transaction(function () use ($validated, $company) {
                // Create user with driver role
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'driver',
                    'company_id' => $company->id,
                ]);

                // Create api token
                $token = \Illuminate\Support\Str::random(80);
                $user->update(['api_token' => $token]);

                // Create driver record
                $driver = \App\Models\Driver::create([
                    'company_id' => $company->id,
                    'user_id' => $user->id,
                    'phone' => $validated['phone'] ?? null,
                    'license_number' => $validated['license_number'] ?? null,
                    'license_expiry' => $validated['license_expiry'] ?? null,
                    'status' => 'active',
                ]);

                return compact('user', 'driver', 'token', 'company');
            });

            return response()->json([
                'success' => true,
                'message' => 'Driver registration successful.',
                'token' => $result['token'],
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                    'role' => 'driver',
                    'company_id' => $result['company']->id,
                ],
                'company' => [
                    'id' => $result['company']->id,
                    'name' => $result['company']->name,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Driver registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activate driver account with setup token.
     */
    public function driverActivate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'setup_token' => ['required', 'string'],
                'password' => ['required', 'confirmed', 'min:8'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            // Find driver by setup token
            $driver = \App\Models\Driver::where('setup_token', $validated['setup_token'])
                ->where('account_activated', false)
                ->first();

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired setup link.',
                ], 404);
            }

            // Update user password and generate token
            $user = $driver->user;
            $apiToken = \Illuminate\Support\Str::random(80);
            
            $user->update([
                'password' => Hash::make($validated['password']),
                'api_token' => $apiToken,
            ]);

            // Mark account as activated and clear setup token
            $driver->update([
                'account_activated' => true,
                'setup_token' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Account activated successfully. You can now log in.',
                'token' => $apiToken,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'driver',
                    'company_id' => $user->company_id,
                ],
                'driver' => [
                    'id' => $driver->id,
                    'company_id' => $driver->company_id,
                    'status' => $driver->status,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Account activation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle company admin login.
     * ONLY allows company admins (role='admin') to login via this endpoint.
     * This is a separate endpoint from the driver login (/api/login).
     */
    public function companyAdminLogin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Only allow company admins (role='admin') with a company_id
        if ($user->role !== 'admin' || !$user->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'This login method is for company admins only. Please use the driver or platform login.',
            ], 403);
        }

        // Generate API token
        $token = \Illuminate\Support\Str::random(80);
        $user->update(['api_token' => $token]);

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'account_status' => $user->account_status,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
            'company' => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'account_status' => $user->company->account_status,
                'company_status' => $user->company->company_status,
                'subscription_status' => $user->company->subscription_status,
            ] : null,
        ]);
    }
}
