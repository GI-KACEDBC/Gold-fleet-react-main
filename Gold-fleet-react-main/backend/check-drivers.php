<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Http\Kernel::class);

use App\Models\User;
use App\Models\Driver;

echo "=== CHECKING DRIVER ACCOUNTS ===\n\n";

// Get all users with user_type = 'driver'
$drivers = User::where('user_type', 'driver')->get();

if ($drivers->isEmpty()) {
    echo "❌ NO DRIVERS FOUND with user_type='driver'\n\n";
} else {
    echo "✓ Found " . $drivers->count() . " driver account(s):\n\n";
    foreach ($drivers as $driver) {
        echo "User ID: {$driver->id}\n";
        echo "  Name: {$driver->name}\n";
        echo "  Email: {$driver->email}\n";
        echo "  Role: {$driver->role}\n";
        echo "  User Type: {$driver->user_type}\n";
        echo "  Account Status: {$driver->account_status}\n";
        
        // Check driver profile
        $driverProfile = Driver::where('user_id', $driver->id)->first();
        if ($driverProfile) {
            echo "  ✓ Driver Profile Found (ID: {$driverProfile->id})\n";
            echo "    - Company ID: {$driverProfile->company_id}\n";
            echo "    - Status: {$driverProfile->status}\n";
        } else {
            echo "  ❌ NO DRIVER PROFILE FOUND\n";
        }
        echo "\n";
    }
}

echo "\n=== CHECKING ALL USERS ===\n\n";

$allUsers = User::select('id', 'name', 'email', 'role', 'user_type')->get();
echo "Total users: " . $allUsers->count() . "\n\n";
foreach ($allUsers as $user) {
    echo "{$user->email} | Role: {$user->role} | User Type: {$user->user_type}\n";
}
