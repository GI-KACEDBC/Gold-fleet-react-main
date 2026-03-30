<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$user = User::where('email', 'christianabaaja120@gmail.com')->first();

if ($user) {
    echo "✓ User found!\n\n";
    echo "ID: {$user->id}\n";
    echo "Name: {$user->name}\n";
    echo "Email: {$user->email}\n";
    echo "Role: {$user->role}\n";
    echo "User Type: {$user->user_type}\n";
    echo "Email Verified At: " . ($user->email_verified_at ? $user->email_verified_at->format('Y-m-d H:i:s') : 'NOT VERIFIED') . "\n";
    echo "Account Status: {$user->account_status}\n";
    echo "Company ID: {$user->company_id}\n";
    echo "\n";
    
    if ($user->company) {
        echo "Company: {$user->company->name}\n";
        echo "Company Status: {$user->company->company_status}\n";
    }
} else {
    echo "✗ User not found\n";
}
