<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DriverLoginSeeder extends Seeder
{
    /**
     * Run the database seeds for driver login testing.
     */
    public function run(): void
    {
        // Get or create company
        $company = Company::firstOrCreate(
            ['email' => 'clark@gmail.com'],
            [
                'name' => 'Premium Fleet Transport Solutions',
                'phone' => '233-24-123-4567',
                'address' => '123 Transportation Hub, Accra, Ghana',
            ]
        );

        // Get or create some test vehicles if they don't exist
        $vehicleSpecs = [
            ['make' => 'Toyota', 'model' => 'Hiace', 'type' => 'Van', 'year' => 2022, 'fuel_type' => 'Diesel'],
            ['make' => 'Mercedes', 'model' => 'Sprinter', 'type' => 'Van', 'year' => 2023, 'fuel_type' => 'Diesel'],
            ['make' => 'TATA', 'model' => 'Prima', 'type' => 'Truck', 'year' => 2021, 'fuel_type' => 'Diesel'],
        ];

        $vehicles = [];
        foreach ($vehicleSpecs as $index => $data) {
            $licensePlate = 'DRIVER-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            $vehicle = Vehicle::firstOrCreate(
                ['license_plate' => $licensePlate],
                [
                    'company_id' => $company->id,
                    'name' => $data['make'] . ' ' . $data['model'] . ' Driver-' . ($index + 1),
                    'type' => $data['type'],
                    'make' => $data['make'],
                    'model' => $data['model'],
                    'year' => $data['year'],
                    'vin' => 'DRIVER' . strtoupper(Str::random(14)) . ($index + 1),
                    'status' => 'active',
                    'fuel_capacity' => rand(40, 250),
                    'fuel_type' => $data['fuel_type'],
                    'notes' => 'Driver test vehicle',
                ]
            );
            $vehicles[] = $vehicle;
        }

        // Create test drivers with easy-to-remember credentials
        $testDrivers = [
            [
                'name' => 'James Osei',
                'email' => 'james.osei@fleet.com',
                'password' => 'Driver123',
                'license' => 'DL001001',
                'phone' => '0501234567',
            ],
            [
                'name' => 'Mary Mensah',
                'email' => 'mary.mensah@fleet.com',
                'password' => 'Driver123',
                'license' => 'DL001002',
                'phone' => '0502234567',
            ],
            [
                'name' => 'Paul Adjei',
                'email' => 'paul.adjei@fleet.com',
                'password' => 'Driver123',
                'license' => 'DL001003',
                'phone' => '0503234567',
            ],
            [
                'name' => 'Grace Boateng',
                'email' => 'grace.boateng@fleet.com',
                'password' => 'Driver123',
                'license' => 'DL001004',
                'phone' => '0504234567',
            ],
            [
                'name' => 'Samuel Gyamfi',
                'email' => 'samuel.gyamfi@fleet.com',
                'password' => 'Driver123',
                'license' => 'DL001005',
                'phone' => '0505234567',
            ],
        ];

        foreach ($testDrivers as $index => $driverData) {
            // Create user
            $user = User::firstOrCreate(
                ['email' => $driverData['email']],
                [
                    'name' => $driverData['name'],
                    'password' => Hash::make($driverData['password']),
                    'role' => 'driver',
                    'user_type' => 'driver',
                    'company_id' => $company->id,
                    'api_token' => Str::random(80),
                    'email_verified_at' => now(),
                ]
            );

            // Create driver profile
            Driver::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'company_id' => $company->id,
                    'license_number' => $driverData['license'],
                    'license_expiry' => now()->addYears(3)->toDateString(),
                    'phone' => $driverData['phone'],
                    'status' => 'active',
                    'vehicle_id' => $vehicles[$index % count($vehicles)]->id,
                ]
            );

            echo "✓ Created driver: {$driverData['name']} ({$driverData['email']})\n";
        }

        echo "\n" . str_repeat('=', 60) . "\n";
        echo "DRIVER LOGIN TEST CREDENTIALS\n";
        echo str_repeat('=', 60) . "\n\n";
        
        foreach ($testDrivers as $driver) {
            echo "Email:    {$driver['email']}\n";
            echo "Password: {$driver['password']}\n";
            echo "Name:     {$driver['name']}\n";
            echo "\n";
        }

        echo str_repeat('=', 60) . "\n";
        echo "Total drivers created: " . count($testDrivers) . "\n";
        echo "Test vehicle assigned to each driver\n";
        echo str_repeat('=', 60) . "\n";
    }
}
