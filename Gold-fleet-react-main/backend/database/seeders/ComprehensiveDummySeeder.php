<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Service;
use App\Models\Inspection;
use App\Models\Issue;
use App\Models\Expense;
use App\Models\FuelFillup;
use App\Models\Reminder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ComprehensiveDummySeeder extends Seeder
{
    /**
     * Run the database seeds for comprehensive dummy data.
     */
    public function run(): void
    {
        // Create Main Company
        $company = Company::firstOrCreate(
            ['email' => 'clark@gmail.com'],
            [
                'name' => 'Premium Fleet Transport Solutions',
                'phone' => '233-24-123-4567',
                'address' => '123 Transportation Hub, Accra, Ghana',
            ]
        );

        // Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'clark@gmail.com'],
            [
                'name' => 'Clark Admin',
                'password' => Hash::make('Zachy0324'),
                'role' => 'admin',
                'user_type' => 'company',
                'company_id' => $company->id,
                'api_token' => Str::random(80),
                'email_verified_at' => now(),
            ]
        );

        // Create 15 Vehicles
        $vehicles = [];
        $vehicleData = [
            ['make' => 'Toyota', 'model' => 'Hiace', 'year' => 2023, 'type' => 'Bus', 'fuel_type' => 'diesel'],
            ['make' => 'Mercedes', 'model' => 'Sprinter', 'year' => 2023, 'type' => 'Van', 'fuel_type' => 'diesel'],
            ['make' => 'Isuzu', 'model' => 'NPR', 'year' => 2022, 'type' => 'Truck', 'fuel_type' => 'diesel'],
            ['make' => 'Toyota', 'model' => 'Land Cruiser', 'year' => 2023, 'type' => 'Car', 'fuel_type' => 'diesel'],
            ['make' => 'Nissan', 'model' => 'Navara', 'year' => 2022, 'type' => 'Van', 'fuel_type' => 'diesel'],
            ['make' => 'BMW', 'model' => 'X5', 'year' => 2023, 'type' => 'Car', 'fuel_type' => 'petrol'],
            ['make' => 'Audi', 'model' => 'Q7', 'year' => 2023, 'type' => 'Car', 'fuel_type' => 'petrol'],
            ['make' => 'Volkswagen', 'model' => 'Transporter', 'year' => 2022, 'type' => 'Van', 'fuel_type' => 'diesel'],
            ['make' => 'Hyundai', 'model' => 'H350', 'year' => 2023, 'type' => 'Van', 'fuel_type' => 'diesel'],
            ['make' => 'Ford', 'model' => 'Transit', 'year' => 2023, 'type' => 'Van', 'fuel_type' => 'diesel'],
            ['make' => 'Daf', 'model' => 'XF', 'year' => 2022, 'type' => 'Truck', 'fuel_type' => 'diesel'],
            ['make' => 'Volvo', 'model' => 'FH16', 'year' => 2023, 'type' => 'Truck', 'fuel_type' => 'diesel'],
            ['make' => 'Scania', 'model' => 'R450', 'year' => 2022, 'type' => 'Truck', 'fuel_type' => 'diesel'],
            ['make' => 'Toyota', 'model' => 'Avensis', 'year' => 2023, 'type' => 'Car', 'fuel_type' => 'petrol'],
            ['make' => 'Honda', 'model' => 'Accord', 'year' => 2023, 'type' => 'Car', 'fuel_type' => 'petrol'],
        ];

        foreach ($vehicleData as $index => $data) {
            $vehicle = Vehicle::firstOrCreate(
                ['license_plate' => 'GHS-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'company_id' => $company->id,
                    'name' => $data['make'] . ' ' . $data['model'] . ' ' . ($index + 1),
                    'type' => $data['type'],
                    'make' => $data['make'],
                    'model' => $data['model'],
                    'year' => $data['year'],
                    'vin' => 'VIN' . strtoupper(Str::random(14)) . ($index + 1),
                    'status' => $index % 4 === 0 ? 'maintenance' : 'active',
                    'fuel_capacity' => rand(40, 250),
                    'fuel_type' => $data['fuel_type'],
                    'mileage' => rand(15000, 200000) + rand(0, 999) / 100,
                    'notes' => 'Fleet vehicle ' . ($index + 1),
                ]
            );
            $vehicles[] = $vehicle;
        }

        // Create 12 Drivers
        $drivers = [];
        $driverNames = [
            'Kwame Asante', 'Ama Boateng', 'Kofi Mensah', 'Abena Osei',
            'Yaw Adjei', 'Akosua Poku', 'Ebenezer Quaye', 'Cynthia Owusu',
            'Michael Gyamfi', 'Sandra Amoah', 'Stephen Addo', 'Rebecca Appiah'
        ];

        foreach ($driverNames as $index => $name) {
            $driverUser = User::firstOrCreate(
                ['email' => 'driver' . ($index + 1) . '@fleet.com'],
                [
                    'name' => $name,
                    'password' => Hash::make('password123'),
                    'role' => 'driver',
                    'user_type' => 'driver',
                    'company_id' => $company->id,
                    'api_token' => Str::random(80),
                    'email_verified_at' => now(),
                ]
            );

            $driver = Driver::firstOrCreate(
                ['user_id' => $driverUser->id],
                [
                    'company_id' => $company->id,
                    'license_number' => 'DL' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                    'license_expiry' => now()->addYears(3)->toDateString(),
                    'phone' => '0501' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                    'status' => $index % 3 === 0 ? 'inactive' : 'active',
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                ]
            );
            $drivers[] = $driver;
        }

        // Create Inspections (past, recent, and future)
        for ($i = 0; $i < 20; $i++) {
            $inspectionDate = now()->subDays(rand(0, 60))->toDateString();
            $nextDueDate = now()->addDays(rand(30, 180))->toDateString();
            $result = ['pass', 'fail', 'conditional_pass'][rand(0, 2)];

            Inspection::firstOrCreate(
                [
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                    'inspection_date' => $inspectionDate,
                ],
                [
                    'company_id' => $company->id,
                    'driver_id' => $drivers[array_rand($drivers)]->id,
                    'result' => $result,
                    'notes' => 'Inspection completed. ' . ['Vehicle passed all checks', 'Minor issues found', 'Major maintenance needed'][rand(0, 2)],
                    'next_due_date' => $nextDueDate,
                ]
            );
        }

        // Create Issues (linked to failed inspections)
        $failedInspections = Inspection::where('result', '!=', 'pass')->limit(15)->get();
        foreach ($failedInspections as $inspection) {
            for ($j = 0; $j < rand(1, 3); $j++) {
                Issue::firstOrCreate(
                    [
                        'vehicle_id' => $inspection->vehicle_id,
                        'title' => ['Brake System Problem', 'Engine Noise', 'Tire Wear', 'Light Malfunction', 'Suspension Issue'][rand(0, 4)],
                    ],
                    [
                        'company_id' => $company->id,
                        'driver_id' => $inspection->driver_id,
                        'description' => 'Issue found during inspection. Requires immediate attention.',
                        'status' => ['open', 'in_progress', 'resolved'][rand(0, 2)],
                        'severity' => 'high',
                        'priority' => ['low', 'medium', 'high', 'critical'][rand(0, 3)],
                        'reported_date' => $inspection->inspection_date,
                    ]
                );
            }
        }

        // Create Services
        for ($i = 0; $i < 15; $i++) {
            $serviceDate = now()->subDays(rand(10, 60));
            Service::create(
                [
                    'company_id' => $company->id,
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                    'service_type' => ['maintenance', 'repair', 'inspection', 'cleaning'][rand(0, 3)],
                    'description' => ['Oil change and filter replacement', 'Brake system inspection', 'Tire rotation and balance', 'Engine diagnostics', 'Transmission fluid change'][rand(0, 4)],
                    'cost' => (float) round(rand(50, 300) + rand(0, 99) / 100, 2),
                    'service_date' => $serviceDate->toDateString(),
                    'next_service_date' => $serviceDate->addMonths(rand(1, 6))->toDateString(),
                    'status' => 'completed',
                ]
            );
        }

        // Create Trips (20 trips)
        for ($i = 0; $i < 20; $i++) {
            $startTime = now()->subDays(rand(0, 90));
            $endTime = $startTime->copy()->addHours(rand(1, 12));
            $selectedDriver = $drivers[array_rand($drivers)];
            $startMileage = rand(10000, 100000);
            $endMileage = $startMileage + rand(50, 500);

            Trip::create(
                [
                    'company_id' => $company->id,
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                    'driver_id' => $selectedDriver->id,
                    'start_time' => $startTime->format('Y-m-d H:i:s'),
                    'end_time' => $endTime->format('Y-m-d H:i:s'),
                    'start_mileage' => $startMileage,
                    'end_mileage' => $endMileage,
                    'distance' => $endMileage - $startMileage,
                    'status' => ['completed', 'active', 'cancelled'][rand(0, 2)],
                    'notes' => ['Regular trip', 'Long haul', 'Local delivery', 'Passenger transport'][rand(0, 3)],
                ]
            );
        }

        // Create Fuel Fillups (20 entries)
        for ($i = 0; $i < 20; $i++) {
            $selectedVehicle = $vehicles[array_rand($vehicles)];
            $selectedDriver = $drivers[array_rand($drivers)];
            $gallons = rand(10, 80);
            $costPerGallon = rand(3, 6);

            FuelFillup::create(
                [
                    'company_id' => $company->id,
                    'vehicle_id' => $selectedVehicle->id,
                    'driver_id' => $selectedDriver->id,
                    'gallons' => $gallons,
                    'cost_per_gallon' => $costPerGallon,
                    'cost' => $gallons * $costPerGallon,
                    'odometer_reading' => rand(50000, 200000),
                    'fillup_date' => now()->subDays(rand(0, 60))->toDateString(),
                ]
            );
        }

        // Create Expenses (30 various expenses)
        $expenseTypes = ['fuel', 'maintenance', 'toll', 'parking', 'insurance', 'registration', 'cleaning', 'parts'];
        for ($i = 0; $i < 30; $i++) {
            Expense::create(
                [
                    'company_id' => $company->id,
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                    'expense_date' => now()->subDays(rand(0, 90))->toDateString(),
                    'category' => $expenseTypes[array_rand($expenseTypes)],
                    'description' => 'Expense for ' . $expenseTypes[array_rand($expenseTypes)] . ' #' . ($i + 1),
                    'amount' => rand(10, 1000),
                    'status' => ['pending', 'approved'][rand(0, 1)],
                ]
            );
        }

        // Create Reminders (15 reminders)
        $reminderTypes = ['oil_change', 'tire_rotation', 'inspection', 'registration_renewal', 'insurance_renewal', 'maintenance'];
        for ($i = 0; $i < 15; $i++) {
            Reminder::create(
                [
                    'company_id' => $company->id,
                    'vehicle_id' => $vehicles[array_rand($vehicles)]->id,
                    'title' => ['Oil Change Due', 'Tire Rotation', 'Scheduled Inspection', 'Registration Renewal', 'Insurance Renewal', 'General Maintenance'][rand(0, 5)],
                    'description' => 'Maintenance reminder for fleet vehicle',
                    'due_date' => now()->addDays(rand(5, 180))->toDateString(),
                    'status' => ['pending', 'completed'][rand(0, 1)],
                    'priority' => ['low', 'medium', 'high'][rand(0, 2)],
                ]
            );
        }

        $this->command->info('✓ Comprehensive dummy data created successfully!');
        $this->command->info('✓ Admin Account: clark@gmail.com');
        $this->command->info('✓ Password: Zachy0324');
        $this->command->info('✓ Company: Premium Fleet Transport Solutions');
        $this->command->info('');
        $this->command->info('Data Summary:');
        $this->command->info('  - Vehicles: ' . Vehicle::count());
        $this->command->info('  - Drivers: ' . Driver::count());
        $this->command->info('  - Inspections: ' . Inspection::count());
        $this->command->info('  - Issues: ' . Issue::count());
        $this->command->info('  - Services: ' . Service::count());
        $this->command->info('  - Trips: ' . Trip::count());
        $this->command->info('  - Fuel Fillups: ' . FuelFillup::count());
        $this->command->info('  - Expenses: ' . Expense::count());
        $this->command->info('  - Reminders: ' . Reminder::count());
    }
}
