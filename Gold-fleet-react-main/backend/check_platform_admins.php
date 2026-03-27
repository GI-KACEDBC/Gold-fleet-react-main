<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$users = \App\Models\User::where('role', 'admin')->where('user_type', 'platform')->get();
echo 'Platform admins: ' . $users->count() . PHP_EOL;
foreach($users as $u) {
    echo $u->email . ' - ' . $u->name . PHP_EOL;
}

$users2 = \App\Models\User::where('role', 'platform_admin')->get();
echo 'Platform_admin role users: ' . $users2->count() . PHP_EOL;
foreach($users2 as $u) {
    echo $u->email . ' - ' . $u->name . PHP_EOL;
}
?>