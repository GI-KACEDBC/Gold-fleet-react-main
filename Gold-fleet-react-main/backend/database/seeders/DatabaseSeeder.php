<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Comprehensive dummy data seeder for testing and optimization
        $this->call([
            PlanSeeder::class,  // Add plans first
            ComprehensiveDummySeeder::class,
            // DriverLoginSeeder::class,  // Uncomment to run driver login seeder
        ]);
    }
}

