<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PlatformAuthController extends Controller
{
    /**
     * Platform Login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::where('email', $validated['email'])
            ->where('role', 'platform_admin')
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Generate API token (legacy api_token system)
        $token = Str::random(60);
        $user->update(['api_token' => $token]);

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Platform Signup - Register new platform admin with company
     */
    public function signup(Request $request)
    {
        $validated = $request->validate([
            // Admin info
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8|confirmed',
            'admin_password_confirmation' => 'required|string|same:admin_password',

            // Company info (simplified for owner onboarding)
            'company_name' => 'required|string|max:255|unique:companies,name',
            'company_phone' => 'required|string',
            // optional: company_email may be provided, otherwise we'll use admin_email
            'company_email' => 'nullable|email|unique:companies,email',
            // address details are optional and can be updated later in settings
            'company_address' => 'nullable|string',
            'company_city' => 'nullable|string',
            'company_state' => 'nullable|string',
            'company_zip' => 'nullable|string',
            'company_country' => 'nullable|string',
            'company_industry' => 'nullable|string',
            'fleet_size' => 'nullable|integer|min:0',
            'num_employees' => 'nullable|integer|min:0',
            'subscription_plan' => 'required|string|in:basic,pro,enterprise',
        ]);

        DB::beginTransaction();

        try {
            // Create company
            // Use admin email as company email if none provided
            $companyEmail = $validated['company_email'] ?? $validated['admin_email'];

            $company = Company::create([
                'name' => $validated['company_name'],
                'email' => $companyEmail,
                'phone' => $validated['company_phone'],
                'address' => $validated['company_address'] ?? null,
                'city' => $validated['company_city'] ?? null,
                'state' => $validated['company_state'] ?? null,
                'zip' => $validated['company_zip'] ?? null,
                'country' => $validated['company_country'] ?? null,
                'industry' => $validated['company_industry'] ?? null,
                'fleet_size' => $validated['fleet_size'] ?? 0,
                'num_employees' => $validated['num_employees'] ?? 0,
                'subscription_plan' => $validated['subscription_plan'],
                'subscription_status' => 'active',
            ]);

            // Create admin user
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'role' => 'platform_admin',
                'user_type' => 'platform',
                'company_id' => $company->id,
                'email_verified_at' => now(),
            ]);

            // Generate API token (legacy api_token system)
            $token = Str::random(60);
            $user->update(['api_token' => $token]);

            DB::commit();

            return response()->json([
                'message' => 'Platform admin account created successfully',
                'token' => $token,
                'user' => $user,
                'company' => $company,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error for debugging
            Log::error('Platform signup error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return response()->json([
                'message' => 'Failed to create account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated platform admin
     */
    public function getUser(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Use legacy api_token system: clear the user's api_token
        $user = $request->user();
        if ($user) {
            $user->api_token = null;
            $user->save();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }
}
