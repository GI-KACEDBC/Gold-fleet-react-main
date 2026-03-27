<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$user = \App\Models\User::find(28);
if ($user) {
    echo 'User 28 exists: ' . $user->name . ' (' . $user->email . ')' . "\n";
    echo 'Has password: ' . (!empty($user->password) ? 'YES' : 'NO') . "\n";
    echo 'Role: ' . $user->role . "\n";
    echo 'Email verified: ' . ($user->hasVerifiedEmail() ? 'YES' : 'NO') . "\n";
} else {
    echo 'User 28 not found' . "\n";
}