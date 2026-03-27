#!/bin/bash

echo "Setting up Gold Fleet React Backend..."
echo

# Navigate to backend directory if not already there
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "Error: This script must be run from the backend directory (where artisan is located)."
    exit 1
fi

echo "Installing PHP dependencies..."
composer install --no-interaction

echo
echo "Setting up environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ".env file created. Please configure your database and other settings in .env"
else
    echo ".env file already exists."
fi

echo
echo "Generating application key..."
php artisan key:generate

echo
echo "Running database migrations..."
php artisan migrate

echo
echo "Creating storage symlink..."
php artisan storage:link

echo
echo "Clearing and caching config..."
php artisan config:clear
php artisan cache:clear

echo
echo "Setting up frontend..."
cd ../frontend
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install

    echo
    echo "Building frontend assets..."
    npm run build
else
    echo "Frontend directory not found or package.json missing."
fi

cd ../backend

echo
echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Configure your .env file with database credentials"
echo "2. Run 'php artisan serve' to start the development server"
echo "3. For frontend development, run 'npm run dev' in the frontend directory"
echo
echo "If you encounter permission issues with storage:link:"
echo "- Ensure you have write permissions to the public directory"
echo "- On some systems, you may need to adjust folder permissions"