@echo off
echo Setting up Gold Fleet React Backend...
echo.

REM Navigate to backend directory if not already there
cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "artisan" (
    echo Error: This script must be run from the backend directory (where artisan is located).
    pause
    exit /b 1
)

echo Installing PHP dependencies...
call composer install --no-interaction

echo.
echo Setting up environment file...
if not exist ".env" (
    copy .env.example .env
    echo .env file created. Please configure your database and other settings in .env
) else (
    echo .env file already exists.
)

echo.
echo Generating application key...
php artisan key:generate

echo.
echo Running database migrations...
php artisan migrate

echo.
echo Creating storage symlink...
php artisan storage:link

echo.
echo Clearing and caching config...
php artisan config:clear
php artisan cache:clear

echo.
echo Setting up frontend...
cd ../frontend
if exist "package.json" (
    echo Installing Node.js dependencies...
    call npm install

    echo.
    echo Building frontend assets...
    call npm run build
) else (
    echo Frontend directory not found or package.json missing.
)

cd ../backend

echo.
echo Setup complete! 
echo.
echo Next steps:
echo 1. Configure your .env file with database credentials
echo 2. Run 'php artisan serve' to start the development server
echo 3. For frontend development, run 'npm run dev' in the frontend directory
echo.
echo If you encounter permission issues with storage:link on Windows:
echo - Run this script as Administrator, or
echo - Manually create symlink: mklink /D public\storage ..\storage\app\public
echo.
pause