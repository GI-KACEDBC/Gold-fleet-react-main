<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Get user ID from command line argument
$userId = $argv[1] ?? null;

if (!$userId) {
    echo "Usage: php verify_email.php <user_id>\n";
    echo "Example: php verify_email.php 15\n";
    exit(1);
}

$user = \App\Models\User::find($userId);

if (!$user) {
    echo "User with ID {$userId} not found\n";
    exit(1);
}

if ($user->hasVerifiedEmail()) {
    echo "User {$user->name} ({$user->email}) is already verified\n";
    exit(0);
}

// Mark email as verified
$user->email_verified_at = now();
$user->save();

echo "✓ Email verified for user: {$user->name} ({$user->email})\n";
echo "User can now login.\n";