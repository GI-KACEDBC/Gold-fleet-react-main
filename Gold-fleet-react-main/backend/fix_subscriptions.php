<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$simulations = \App\Models\PaymentSimulation::all();
$invalid_count = 0;
$valid_count = 0;
$invalid_ids = [];

foreach ($simulations as $sim) {
    $sub = \App\Models\Subscription::find($sim->subscription_id);
    if (!$sub) {
        $invalid_count++;
        $invalid_ids[] = $sim->id;
    } else {
        $valid_count++;
    }
}

echo "Payment Simulations Summary:\n";
echo "Valid: $valid_count\n";
echo "Invalid: $invalid_count\n";

if ($invalid_count > 0) {
    \App\Models\PaymentSimulation::whereIn('id', $invalid_ids)->delete();
    echo "Deleted $invalid_count invalid records.\n";
}

echo "\nDatabase integrity check complete.\n";
