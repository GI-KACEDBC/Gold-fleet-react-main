# Gold Fleet Backend (Laravel)

A Laravel-based backend for the Gold Fleet management system.

## Setup Instructions

### Prerequisites
- PHP 8.1 or higher
- Composer
- Node.js and npm (for frontend assets)
- MySQL or another supported database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gold-fleet-react-main/backend
   ```

2. **Run the automated setup script**
   ```bash
   # On Windows
   setup.bat

   # On Linux/Mac
   ./setup.sh
   ```

   This script will:
   - Install PHP dependencies
   - Copy environment file
   - Generate application key
   - Run database migrations
   - Create storage symlink (important for image uploads)
   - Install and build frontend assets

3. **Configure environment**
   - Edit `.env` file with your database credentials and other settings
   - Ensure `APP_URL` is set correctly

4. **Start the development server**
   ```bash
   php artisan serve
   ```

### Manual Setup (if script fails)

If the automated script doesn't work:

1. Install dependencies:
   ```bash
   composer install
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Setup database:
   ```bash
   php artisan migrate
   ```

4. **Critical: Create storage symlink for image uploads**
   ```bash
   php artisan storage:link
   ```

   On Windows, if you get permission errors:
   - Run Command Prompt as Administrator
   - Or manually create symlink: `mklink /D public\storage ..\storage\app\public`

5. Clear cache:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

### Image Upload Setup

The application uses Laravel's storage system for image uploads. After setup:

- Images are stored in `storage/app/public/drivers/` and `storage/app/public/vehicles/`
- They are accessible via web at `public/storage/drivers/` and `public/storage/vehicles/`
- The `php artisan storage:link` command creates the necessary symlink

**Important:** If images appear broken after cloning:
1. Ensure `php artisan storage:link` was run
2. Check that `public/storage` exists and points to `storage/app/public`
3. On Windows, you may need Administrator privileges for symlink creation

### Development

- Start Laravel server: `php artisan serve`
- For frontend development: go to `../frontend` and run `npm run dev`
- Run tests: `php artisan test`

### API Documentation

The backend provides REST API endpoints for:
- User authentication
- Driver management
- Vehicle management
- Trip management
- And more...

Base URL: `http://localhost:8000/api/`

## Troubleshooting

### Images not displaying
- Run `php artisan storage:link`
- Check file permissions on `storage/` directory
- Ensure web server can read `storage/app/public/`

### Database connection issues
- Verify `.env` database credentials
- Run `php artisan migrate` to setup tables

### Permission issues on Windows
- Run commands as Administrator
- Check folder permissions for `storage/` and `bootstrap/cache/`
