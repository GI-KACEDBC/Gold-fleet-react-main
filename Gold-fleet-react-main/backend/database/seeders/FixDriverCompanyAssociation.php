<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FixDriverCompanyAssociation extends Seeder
{
    /**
     * Fix driver-company associations to ensure drivers are linked to the correct company.
     * 
     * This seeder verifies that:
     * 1. Each driver's company_id matches their user's company_id
     * 2. Each driver has a valid company_id (not null)
     * 3. Each driver's associated company exists
     */
    public function run(): void
    {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "FIXING DRIVER-COMPANY ASSOCIATIONS\n";
        echo str_repeat('=', 70) . "\n\n";

        $fixed = 0;
        $errors = 0;

        // Get all drivers with their users
        $drivers = Driver::with('user', 'company')->get();

        echo "Checking " . $drivers->count() . " drivers...\n\n";

        foreach ($drivers as $driver) {
            $driverId = $driver->id;
            $userId = $driver->user_id;
            $driverCompanyId = $driver->company_id;
            $userCompanyId = $driver->user?->company_id;

            // Check 1: User exists
            if (!$driver->user) {
                echo "❌ DRIVER #$driverId: User #$userId not found\n";
                $errors++;
                continue;
            }

            // Check 2: Driver has company_id
            if (!$driverCompanyId) {
                if ($userCompanyId) {
                    echo "⚠️  DRIVER #$driverId: Missing company_id. Setting to user's company #$userCompanyId\n";
                    $driver->update(['company_id' => $userCompanyId]);
                    $fixed++;
                } else {
                    echo "❌ DRIVER #$driverId: Both driver and user have no company_id\n";
                    $errors++;
                }
                continue;
            }

            // Check 3: Company mismatch
            if ($userCompanyId && $driverCompanyId !== $userCompanyId) {
                echo "⚠️  DRIVER #$driverId: Mismatch! Driver company #$driverCompanyId ≠ User company #$userCompanyId\n";
                echo "   Fixing: Setting driver company to user's company #$userCompanyId\n";
                $driver->update(['company_id' => $userCompanyId]);
                $fixed++;
                continue;
            }

            // Check 4: Company exists
            if (!$driver->company) {
                echo "❌ DRIVER #$driverId: Company #$driverCompanyId does not exist\n";
                $errors++;
                continue;
            }

            // All checks passed
            echo "✓ DRIVER #$driverId ({$driver->user->name}): correctly associated with company #{$driverCompanyId}\n";
        }

        echo "\n" . str_repeat('=', 70) . "\n";
        echo "RESULTS\n";
        echo str_repeat('=', 70) . "\n";
        echo "✓ Total drivers checked: " . $drivers->count() . "\n";
        echo "✓ Fixed associations: $fixed\n";
        echo "❌ Errors found: $errors\n";
        echo str_repeat('=', 70) . "\n\n";

        if ($fixed > 0) {
            echo "SUCCESS: Fixed $fixed driver-company associations\n\n";
        }

        if ($errors > 0) {
            echo "WARNING: $errors errors found that need manual intervention\n\n";
        }

        if ($fixed === 0 && $errors === 0) {
            echo "✓ All drivers are correctly associated with their companies!\n\n";
        }
    }
}
