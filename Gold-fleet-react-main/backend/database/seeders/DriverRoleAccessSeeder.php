<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DriverRoleAccessSeeder extends Seeder
{
    /**
     * Run the database seeds for driver role access.
     */
    public function run(): void
    {
        // Create or get test company
        $company = Company::firstOrCreate(
            ['email' => 'driver-company@example.com'],
            [
                'name' => 'Driver Role Test Company',
                'phone' => '555-0001',
                'address' => '456 Driver Lane',
            ]
        );

        // Create test vehicles for drivers
        $vehicles = [];
        for ($i = 1; $i <= 3; $i++) {
            $vehicles[] = Vehicle::firstOrCreate(
                ['license_plate' => "DRV-VEH-00{$i}"],
                [
                    'company_id' => $company->id,
                    'make' => ['Toyota', 'Honda', 'Mercedes'][$i - 1],
                    'model' => ['Camry', 'Civic', 'Sprinter'][$i - 1],
                    'year' => 2023,
                    'vin' => "DRVVIN123456789{$i}",
                    'status' => 'active',
                ]
            );
        }

        // Create multiple test driver users with driver role
        $drivers = [
            [
                'email' => 'driver1@example.com',
                'name' => 'John Kwame Driver',
                'phone' => '555-1001',
                'license_number' => 'DL001234',
            ],
            [
                'email' => 'driver2@example.com',
                'name' => 'Ama Seidu Driver',
                'phone' => '555-1002',
                'license_number' => 'DL001235',
            ],
            [
                'email' => 'driver3@example.com',
                'name' => 'Kwesi Osei Driver',
                'phone' => '555-1003',
                'license_number' => 'DL001236',
            ],
        ];

        foreach ($drivers as $index => $driverData) {
            // Create driver user account
            $driverUser = User::firstOrCreate(
                ['email' => $driverData['email']],
                [
                    'name' => $driverData['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'driver',
                    'user_type' => 'driver',
                    'company_id' => $company->id,
                    'api_token' => Str::random(80),
                    'email_verified_at' => now(),
                ]
            );

            // Create driver record linked to user
            Driver::firstOrCreate(
                ['user_id' => $driverUser->id],
                [
                    'company_id' => $company->id,
                    'license_number' => $driverData['license_number'],
                    'license_expiry' => now()->addYears(3)->toDateString(),
                    'phone' => $driverData['phone'],
                    'status' => 'active',
                    'vehicle_id' => $vehicles[$index]->id ?? null,
                ]
            );

            $this->command->info("✓ Driver account created: {$driverData['email']} (Password: password123)");
        }

        $this->command->info("\n✓ Driver role access seeding completed!");
        $this->command->info("✓ Total drivers created: " . count($drivers));
        $this->command->info("\nLogin Credentials:");
        foreach ($drivers as $driver) {
            $this->command->info("  - Email: {$driver['email']} | Password: password123");
        }
    }
}
