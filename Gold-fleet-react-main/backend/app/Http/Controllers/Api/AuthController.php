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
     * Handle unified login for both drivers and company admins.
     * Accepts any user with valid credentials.
     * User type is determined by the 'user_type' field (driver or company).
     * Drivers are company-specific via company_id and user_type='driver'.
     * 
     * NOTE: Email verification is NOT required - removed to simplify login flow.
     */
    public function login(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::channel('auth')->info('=== LOGIN ATTEMPT ===', [
            'email' => $request->input('email'),
            'ip_address' => $request->ip(),
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            \Illuminate\Support\Facades\Log::channel('auth')->warning('LOGIN FAILED: Invalid credentials', [
                'email' => $credentials['email'],
                'ip_address' => $request->ip(),
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'reason' => 'Email or password is incorrect',
            ], 401);
        }

        // Generate API token
        $token = \Illuminate\Support\Str::random(80);
        $user->update(['api_token' => $token]);
        
        \Illuminate\Support\Facades\Log::channel('auth')->info('✓ LOGIN SUCCESSFUL', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'user_type' => $user->user_type,
            'ip_address' => $request->ip(),
            'timestamp' => now()->format('Y-m-d H:i:s'),
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
                'user_type' => $user->user_type, // 'driver' or 'company' - determines user type
                'company_id' => $user->company_id,
                'account_status' => $user->account_status,
                'email_verified' => true,
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
     * Handle COMPANY ADMIN login - alternative endpoint.
     * Accepts company admins (user_type='company' AND role='admin').
     * Both /api/login and /api/company-admin-login work for admins.
     */
    public function companyAdminLogin(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::channel('auth')->info('=== LOGIN ATTEMPT ===', [
            'email' => $request->input('email'),
            'ip_address' => $request->ip(),
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            \Illuminate\Support\Facades\Log::channel('auth')->warning('LOGIN FAILED: Invalid credentials', [
                'email' => $credentials['email'],
                'ip_address' => $request->ip(),
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'reason' => 'Email or password is incorrect',
            ], 401);
        }

        // Generate API token
        $token = \Illuminate\Support\Str::random(80);
        $user->update(['api_token' => $token]);

        \Illuminate\Support\Facades\Log::channel('auth')->info('✓ LOGIN SUCCESSFUL', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'user_type' => $user->user_type,
            'company_id' => $user->company_id,
            'ip_address' => $request->ip(),
            'timestamp' => now()->format('Y-m-d H:i:s'),
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
                'user_type' => $user->user_type, // 'driver' or 'company' - determines user type
                'company_id' => $user->company_id,
                'account_status' => $user->account_status,
                'email_verified' => true,
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
                    'account_status' => 'verified',
                    'company_status' => 'pending',
                    'subscription_status' => 'none',
                ]);

                // Create user with verified account status
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'admin',
                    'company_id' => $company->id,
                    'account_status' => 'verified',
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
                    'email_verified' => true,
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
     */
    public function cancelSignup(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'company_id' => 'required|integer|exists:companies,id',
            ]);

            DB::transaction(function () use ($validated) {
                User::findOrFail($validated['user_id'])->delete();
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
                'email_verified' => true,
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
            $company = Company::where('access_code', $validated['company_code'])->first();
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid company code. Please contact your administrator.',
                ], 404);
            }

            $result = DB::transaction(function () use ($validated, $company) {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'driver',
                    'company_id' => $company->id,
                ]);

                $token = \Illuminate\Support\Str::random(80);
                $user->update(['api_token' => $token]);

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
            $driver = \App\Models\Driver::where('setup_token', $validated['setup_token'])
                ->where('account_activated', false)
                ->first();

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired setup link.',
                ], 404);
            }

            $user = $driver->user;
            $apiToken = \Illuminate\Support\Str::random(80);
            
            $user->update([
                'password' => Hash::make($validated['password']),
                'api_token' => $apiToken,
            ]);

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
     * Check user type before login to determine correct endpoint.
     * This allows frontend to intelligently route to correct login endpoint.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function checkUserType(Request $request): JsonResponse
    {
        $email = $request->input('email');

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email is required',
                'login_channel' => null,
            ], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'login_channel' => null,
            ], 404);
        }

        // Determine which login channel this user should use
        $loginChannel = $user->user_type === 'driver' ? 'driver' : 'company-admin';

        \Illuminate\Support\Facades\Log::channel('auth')->info('USER TYPE CHECK', [
            'email' => $email,
            'user_type' => $user->user_type,
            'role' => $user->role,
            'login_channel' => $loginChannel,
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'success' => true,
            'email' => $email,
            'user_type' => $user->user_type,
            'role' => $user->role,
            'login_channel' => $loginChannel,
            'endpoint' => $loginChannel === 'driver' ? '/api/login' : '/api/company-admin-login',
        ], 200);
    }
}
