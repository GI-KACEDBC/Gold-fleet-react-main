<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$user = \App\Models\User::find(28);
if ($user) {
    $user->email_verified_at = null;
    $user->save();
    echo 'Email verification reset for user 28 (Willy)' . "\n";
    echo 'Now you can try to login and see the verification instructions.' . "\n";
}