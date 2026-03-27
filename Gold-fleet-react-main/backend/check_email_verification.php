<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== USERS EMAIL VERIFICATION STATUS ===\n";
$users = \App\Models\User::select('id', 'name', 'email', 'email_verified_at', 'role', 'company_id', 'account_status')->get();

foreach ($users as $user) {
    $verified = $user->email_verified_at ? 'VERIFIED' : 'UNVERIFIED';
    $hash = hash('sha256', $user->email);
    $verificationUrl = "http://localhost:8000/api/email/verify/{$user->id}/{$hash}";

    echo "ID: {$user->id} | Name: {$user->name} | Email: {$user->email} | Status: {$verified}\n";
    if (!$user->email_verified_at) {
        echo "  Verification URL: {$verificationUrl}\n";
    }
    echo "\n";
}