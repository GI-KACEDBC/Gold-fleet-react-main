<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Check if storage symlink exists and create if missing
        $storageLink = public_path('storage');
        $storageTarget = storage_path('app/public');

        if (!file_exists($storageLink)) {
            \Log::warning('Storage symlink missing. Attempting to create it...');

            // Try to create the symlink
            if (PHP_OS_FAMILY === 'Windows') {
                // On Windows, use mklink command
                $command = "mklink /D \"$storageLink\" \"$storageTarget\" 2>nul";
                exec($command, $output, $returnCode);
                if ($returnCode === 0) {
                    \Log::info('Storage symlink created successfully on Windows.');
                } else {
                    \Log::error('Failed to create storage symlink on Windows. Please run: mklink /D public\storage ..\storage\app\public as Administrator');
                }
            } else {
                // On Unix-like systems
                if (symlink($storageTarget, $storageLink)) {
                    \Log::info('Storage symlink created successfully.');
                } else {
                    \Log::error('Failed to create storage symlink. Please run: php artisan storage:link');
                }
            }
        }
    }
}
