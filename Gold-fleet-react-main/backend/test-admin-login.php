<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'clark@gmail.com')->first();

if ($user) {
    echo "=== User Record ===" . PHP_EOL;
    echo "Name: " . $user->name . " (ID: " . $user->id . ")" . PHP_EOL;
    echo "Email: " . $user->email . PHP_EOL;
    echo "User Type: " . $user->user_type . PHP_EOL;
    echo "Role: " . $user->role . PHP_EOL;
    echo "Company ID: " . $user->company_id . PHP_EOL;
    echo "Password Hash Present: " . (strlen($user->password) > 0 ? 'YES' : 'NO') . PHP_EOL;
    echo "Hash (first 30 chars): " . substr($user->password, 0, 30) . "..." . PHP_EOL;
    echo PHP_EOL;
    
    // Test password
    $testPassword = 'Zachy0324';
    $passwordMatches = Hash::check($testPassword, $user->password);
    
    echo "=== Password Test ===" . PHP_EOL;
    echo "Testing password: " . $testPassword . PHP_EOL;
    echo "Hash check result: " . ($passwordMatches ? 'MATCH ✓' : 'NO MATCH ✗') . PHP_EOL;
    echo PHP_EOL;
    
    // Check company
    if ($user->company) {
        echo "=== Company Record ===" . PHP_EOL;
        echo "Company ID: " . $user->company->id . PHP_EOL;
        echo "Company Name: " . $user->company->name . PHP_EOL;
        echo "Company Status: " . $user->company->account_status . PHP_EOL;
    } else {
        echo "NO COMPANY RECORD FOUND" . PHP_EOL;
    }
} else {
    echo "User not found!" . PHP_EOL;
}
