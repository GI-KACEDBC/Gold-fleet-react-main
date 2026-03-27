<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$user = \App\Models\User::find(28);
if ($user) {
    $hash = hash('sha256', $user->email);
    $verificationLink = 'http://localhost:8000/api/email/verify/28/' . $hash;
    echo "VERIFICATION LINK FOR USER 28 (Willy):\n";
    echo $verificationLink . "\n\n";
    echo "Click this link to verify the email.\n";
    echo "Status: " . ($user->hasVerifiedEmail() ? 'ALREADY VERIFIED' : 'NEEDS VERIFICATION') . "\n";
} else {
    echo 'User not found.' . "\n";
}