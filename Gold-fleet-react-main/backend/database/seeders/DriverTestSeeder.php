<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DriverTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test company
        $company = Company::firstOrCreate(
            ['email' => 'testcompany@example.com'],
            [
                'name' => 'Test Fleet Company',
                'phone' => '555-0000',
                'address' => '123 Fleet Street',
            ]
        );

        // Create a test vehicle
        $vehicle = Vehicle::firstOrCreate(
            ['license_plate' => 'TEST123'],
            [
                'company_id' => $company->id,
                'make' => 'Toyota',
                'model' => 'Camry',
                'year' => 2023,
                'vin' => 'TESTVIN123456789',
                'status' => 'active',
            ]
        );

        // Create a test driver user
        $driverUser = User::firstOrCreate(
            ['email' => 'driver@example.com'],
            [
                'name' => 'Test Driver',
                'password' => Hash::make('password123'),
                'role' => 'driver',
                'user_type' => 'driver',
                'company_id' => $company->id,
                'api_token' => Str::random(80),
            ]
        );

        // Create driver record linked to user
        Driver::firstOrCreate(
            ['user_id' => $driverUser->id],
            [
                'company_id' => $company->id,
                'license_number' => 'DL123456',
                'license_expiry' => now()->addYears(2)->toDateString(),
                'phone' => '555-1234',
                'status' => 'active',
                'vehicle_id' => $vehicle->id,
            ]
        );

        $this->command->info('Driver test account created!');
        $this->command->info('Email: driver@example.com');
        $this->command->info('Password: password123');
    }
}
