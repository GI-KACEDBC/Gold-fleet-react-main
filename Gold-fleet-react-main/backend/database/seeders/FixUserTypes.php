<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class FixUserTypes extends Seeder
{
    /**
     * Fix user_type column for all existing users based on their role and driver profile.
     * 
     * Rules:
     * - If role is 'driver' and user has a driver profile -> user_type = 'driver'
     * - If role is 'admin' or 'employee' and user has a company_id -> user_type = 'company'
     * - Otherwise -> user_type = 'company' (default)
     */
    public function run(): void
    {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "FIXING USER TYPES FOR ALL USERS\n";
        echo str_repeat('=', 70) . "\n\n";

        $updated = 0;
        $alreadyCorrect = 0;

        $users = User::all();
        echo "Processing " . $users->count() . " users...\n\n";

        foreach ($users as $user) {
            $newUserType = null;

            // Check if user is a driver (has driver profile)
            $hasDriverProfile = $user->driver()->exists();

            if ($hasDriverProfile) {
                $newUserType = 'driver';
            } else {
                // Company user (admin, employee, etc.)
                $newUserType = 'company';
            }

            // Update if different
            if ($user->user_type !== $newUserType) {
                $oldType = $user->user_type ?? 'null';
                echo "⚠️  USER #{$user->id} ({$user->email}): Updating user_type from '{$oldType}' to '{$newUserType}'\n";
                $user->update(['user_type' => $newUserType]);
                $updated++;
            } else {
                $alreadyCorrect++;
            }
        }

        echo "\n" . str_repeat('=', 70) . "\n";
        echo "RESULTS\n";
        echo str_repeat('=', 70) . "\n";
        echo "✓ Total users processed: " . $users->count() . "\n";
        echo "✓ Users updated: $updated\n";
        echo "✓ Already correct: $alreadyCorrect\n";
        echo str_repeat('=', 70) . "\n\n";

        if ($updated > 0) {
            echo "SUCCESS: Updated $updated user types to correct values\n\n";
        } else {
            echo "✓ All users already have correct user_type values!\n\n";
        }
    }
}
