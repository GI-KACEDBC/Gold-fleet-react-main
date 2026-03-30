<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Company;
use App\Models\Driver;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Find or create company
$company = Company::where('email', 'clark@gmail.com')->first() 
    ?? Company::first()
    ?? Company::create([
        'name' => 'Test Company',
        'email' => 'test@company.com',
        'phone' => '123-456-7890',
    ]);

// Create test admin user
$adminUser = User::firstOrCreate(
    ['email' => 'christianabaaja120@gmail.com'],
    [
        'name' => 'Christian Baaja Admin',
        'password' => Hash::make('TestPassword123!'),
        'role' => 'admin',
        'user_type' => 'company',
        'company_id' => $company->id,
        'api_token' => Str::random(80),
        'email_verified_at' => now(),
        'account_status' => 'verified',
    ]
);

echo "✓ Test admin user created/updated:\n";
echo "Email: {$adminUser->email}\n";
echo "Password: TestPassword123!\n";
echo "Role: {$adminUser->role}\n";
echo "User Type: {$adminUser->user_type}\n";
echo "Company: {$company->name}\n";
echo "\nYou can now login with these credentials!\n";
