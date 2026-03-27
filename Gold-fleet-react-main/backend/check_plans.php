<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Plan;

echo "Checking plans in database...\n\n";

$plans = Plan::all();

if ($plans->count() > 0) {
    echo "Found " . $plans->count() . " plans:\n";
    foreach ($plans as $plan) {
        echo "ID: {$plan->id} | Name: {$plan->name} | Price: \${$plan->price} | Status: {$plan->status}\n";
    }
} else {
    echo "No plans found in database!\n";
}