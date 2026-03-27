<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$user = \App\Models\User::find(28);
if ($user) {
    $hash = hash('sha256', $user->email);
    $verificationUrl = 'http://localhost:8000/api/email/verify/28/' . $hash;
    echo 'Verification Link for Willy: ' . $verificationUrl . "\n";
    echo 'Click this link to verify the email manually.' . "\n";
} else {
    echo 'User not found.' . "\n";
}