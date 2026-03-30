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
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_phone' => 'required|string|max:20',
            'admin_password' => 'required|string|min:8|confirmed',
            'admin_password_confirmation' => 'required|string|same:admin_password',
        ]);

        try {
            // Create platform admin user (no company required)
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'phone' => $validated['admin_phone'],
                'password' => Hash::make($validated['admin_password']),
                'role' => 'platform_admin',
                'user_type' => 'platform',
                'company_id' => null, // Platform admins don't belong to a company
                'email_verified_at' => now(),
            ]);

            // Generate API token (legacy api_token system)
            $token = Str::random(60);
            $user->update(['api_token' => $token]);

            return response()->json([
                'message' => 'Platform admin account created successfully',
                'token' => $token,
                'user' => $user,
            ], 201);

        } catch (\Exception $e) {
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
