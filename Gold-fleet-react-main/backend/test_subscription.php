<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Subscription;
use App\Models\Company;
use Illuminate\Http\Request;

// Test data
$testData = [
    'company_id' => 1, // Assuming company with ID 1 exists
    'plan_id' => 1,    // Plan ID 1 should exist
];

// Check if company exists
$companies = Company::all();
echo "Companies in database: " . $companies->count() . "\n";
if ($companies->count() > 0) {
    echo "First company: " . json_encode($companies->first()) . "\n";
    $testData['company_id'] = $companies->first()->id;
} else {
    echo "No companies exist. Creating a test company...\n";
    $company = Company::create([
        'name' => 'Test Company',
        'email' => 'test@example.com',
        'phone' => '123-456-7890',
        'address' => '123 Test St',
        'company_status' => 'active',
        'subscription_status' => 'inactive',
    ]);
    $testData['company_id'] = $company->id;
    echo "Created test company with ID: {$company->id}\n";
}

$company = Company::find($testData['company_id']);
if (!$company) {
    echo "ERROR: Company with ID {$testData['company_id']} does not exist\n";
    exit(1);
}

echo "Testing subscription creation...\n";
echo "Company ID: {$testData['company_id']}\n";
echo "Plan ID: {$testData['plan_id']}\n\n";

// Create a mock request
$request = new Request();
$request->merge($testData);

// Try validation
try {
    $validated = $request->validate([
        'company_id' => 'required|integer|exists:companies,id',
        'plan_id' => 'required|integer|exists:plans,id',
    ]);

    echo "✅ Validation passed!\n";
    echo "Validated data: " . json_encode($validated) . "\n";

} catch (\Illuminate\Validation\ValidationException $e) {
    echo "❌ Validation failed!\n";
    echo "Errors: " . json_encode($e->errors()) . "\n";

    // Get plans for debugging
    $plans = \DB::table('plans')->select('id', 'name', 'status')->get();
    echo "Plans in database: " . json_encode($plans) . "\n";
}