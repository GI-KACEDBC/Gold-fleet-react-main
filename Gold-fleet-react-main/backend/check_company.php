<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$company = \App\Models\Company::find(2);
echo 'Company 2 exists: ' . ($company ? 'YES' : 'NO') . PHP_EOL;
if ($company) {
    echo 'Name: ' . $company->name . PHP_EOL;
}
?>