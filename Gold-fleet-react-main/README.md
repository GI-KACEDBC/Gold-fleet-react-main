# Gold Fleet Management System

A comprehensive fleet management application built with modern technologies. This system enables teams to efficiently manage vehicles, drivers, trips, services, inspections, and maintenance workflows across their fleet operations.

---

## 🚀 Quick Start (5 Minutes)

Get the entire application running with these simple steps:

### Prerequisites
- **Node.js** 16+ and **npm** installed
- **PHP** 8.2+ and **Composer** installed
- **PostgreSQL** 12+ running and accessible
- **Git** for cloning repositories

### 1. Clone & Setup Backend
```bash
cd backend
composer setup
```

This single command will:
- ✅ Install PHP dependencies
- ✅ Copy environment configuration
- ✅ Generate application key
- ✅ Create database and run migrations
- ✅ Seed test data (optional)
- ✅ Create storage symlink (for file uploads)
- ✅ Install and build frontend assets

### 2. Start Development Environment
Open **two separate terminals**:

**Terminal 1 - Backend (Laravel API)**
```bash
cd backend
composer dev
```
This starts the Laravel server, queue listener, logs, and Vite watcher concurrently.

**Terminal 2 - Frontend (React)**
```bash
cd frontend
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Default Admin Login**: (Check seeded test data in backend)

---

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Installation & Setup](#installation--setup)
4. [Running the Application](#running-the-application)
5. [Project Architecture](#project-architecture)
6. [Key Features](#key-features)
7. [Database Configuration](#database-configuration)
8. [API Endpoints](#api-endpoints)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Contributing Guidelines](#contributing-guidelines)
12. [Documentation Links](#documentation-links)

---

## 📁 Project Structure

```
gold-fleet-react-main/
├── 📂 backend/                 # Laravel 12 API Server
│   ├── app/                    # Application logic (Controllers, Models, Services)
│   ├── database/               # Migrations and seeders
│   ├── routes/                 # API route definitions
│   ├── config/                 # Configuration files
│   ├── storage/                # File uploads and cache
│   ├── public/                 # Public assets
│   ├── .env.example            # Environment template
│   ├── composer.json           # PHP dependencies
│   ├── setup.bat               # Windows automated setup
│   └── setup.sh                # Linux/Mac automated setup
│
├── 📂 frontend/                # React 19 + Vite Application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page-level components
│   │   ├── services/           # API client and service layer
│   │   ├── assets/             # Images, icons, styles
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Application entry point
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.cjs     # Tailwind CSS configuration
│   └── eslintrc.config.js      # ESLint rules
│
└── 📄 This README              # Project overview
```

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|----------|
| **React** | 19.2.0 | UI framework |
| **Vite** | 7.2.4 | Build tool and dev server |
| **React Router** | 7.13.0 | Client-side routing |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS styling |
| **Axios** | 1.13.4 | HTTP client for API calls |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Chart.js** | 4.5.1 | Data visualization |
| **Recharts** | 3.7.0 | React charting library |
| **ESLint** | 9.39.1 | Code quality and linting |

### Backend
| Technology | Version | Purpose |
|-----------|---------|----------|
| **Laravel** | 12.0 | Web framework |
| **PHP** | 8.2+ | Server-side language |
| **PostgreSQL** | 12+ | Primary database |
| **Sanctum** | (built-in) | SPA authentication |
| **Composer** | Latest | PHP dependency manager |
| **Pest PHP** | 4.2 | Testing framework |

---

## 📦 Installation & Setup

### Option 1: Automated Setup (Recommended)

#### Windows
```bash
cd backend
setup.bat
```

#### Linux/Mac
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### Step 1: Backend Setup
```bash
cd backend

# Copy environment file
cp .env.example .env

# Install PHP dependencies
composer install

# Generate application key
php artisan key:generate

# Configure database in .env (see Database Configuration section below)

# Run database migrations
php artisan migrate

# Create storage symlink (required for file uploads)
php artisan storage:link

# Seed test data (optional - for development)
php artisan db:seed

# Return to root
cd ..
```

#### Step 2: Frontend Setup
```bash
cd frontend

# Install Node.js dependencies
npm install

# Return to root
cd ..
```

---

## 🎯 Running the Application

### Full Stack Development (All Services)

**Option 1: Using Composer (Backend Only)**
```bash
cd backend
composer dev
```
This runs all services concurrently:
- Laravel API server
- Queue listener
- Application logs
- Frontend Vite watcher (npm run dev)

**Option 2: Manual (Separate Terminals)**

Open **Terminal 1** in the `backend` folder:
```bash
composer dev
# OR manually:
php artisan serve              # Starts Laravel at http://localhost:8000
```

Open **Terminal 2** in the `frontend` folder:
```bash
npm run dev                     # Starts React dev server at http://localhost:5173
```

### Frontend Only
```bash
cd frontend
npm run dev
```
Access at: http://localhost:5173

### Backend Only
```bash
cd backend
php artisan serve
```
Access API at: http://localhost:8000/api

### Production Build
```bash
# Build frontend
cd frontend
npm run build                  # Creates dist/ folder

# Build backend (Laravel auto-serves from frontend/dist)
cd ../backend
php artisan optimize          # Optimize for production
```

---

## 🏗 Project Architecture

### Frontend-Backend Communication

The frontend and backend communicate over HTTP using a REST API architecture:

```
Frontend (React)
   ↓ Axios HTTP Requests
   ↓ (http://localhost:8000/api)
Backend (Laravel)
   ↓ API Routes
   ↓ Controllers & Services
   ↓
Database (PostgreSQL)
```

### Authentication Flow (Sanctum SPA)

1. User logs in via frontend
2. Backend issues a session cookie (Sanctum)
3. Subsequent requests include the cookie automatically
4. Backend validates session and returns user data

**Key Configuration** (in `backend/.env`):
```
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

### Key Modules

| Module | Purpose | Key Files |
|--------|---------|----------|
| **Vehicles** | Fleet vehicle management | `app/Models/Vehicle.php`, `routes/api.php` |
| **Drivers** | Driver profiles and status | `app/Models/Driver.php` |
| **Trips** | Trip tracking and logging | `app/Models/Trip.php` |
| **Services** | Maintenance and service records | `app/Models/Service.php` |
| **Inspections** | Vehicle inspection workflows | `app/Models/Inspection.php` |
| **Dashboard** | Analytics and overview | `frontend/src/pages/Dashboard.jsx` |
| **Messaging** | Inter-user communication | `app/Models/Message.php` |
| **Authentication** | User login and authorization | `app/Models/User.php`, Sanctum |

---

## ✨ Key Features

### Fleet Management
- ✅ **Vehicle Registry** - Track all vehicles with detailed specifications
- ✅ **Driver Management** - Driver profiles, licenses, and certifications
- ✅ **Trip Tracking** - Log trips, routes, and distances
- ✅ **Service Records** - Maintenance history and scheduling

### Operations
- ✅ **Real-time Dashboard** - Fleet overview with analytics
- ✅ **Map View** - Interactive vehicle location mapping (Leaflet.js)
- ✅ **Inspection Workflows** - Pre-trip and post-trip inspections
- ✅ **Issue Tracking** - Report and manage fleet issues

### Communications
- ✅ **Driver Messaging** - Internal communication system
- ✅ **Notifications** - Real-time alerts for important events
- ✅ **Email Verification** - Secure user authentication

### Analytics
- ✅ **Charts & Reports** - Multiple visualization options (Charts.js, Recharts)
- ✅ **Performance Metrics** - Fuel consumption, trip efficiency
- ✅ **Export Capabilities** - Download reports and data

---

## 🗄 Database Configuration

### Setup Requirements

**PostgreSQL** must be installed and running before migrations.

### Configuration (backend/.env)

```env
# Database Connection
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=Gold_Fleet
DB_USERNAME=postgres
DB_PASSWORD=Christian12345@      # Change this in production!

# Session & Authentication
SESSION_DOMAIN=localhost
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

### Create Database

PostgreSQL will **automatically create the database** during `php artisan migrate`, or manually:

```bash
psql -U postgres -c "CREATE DATABASE Gold_Fleet;"
```

### Run Migrations

```bash
cd backend
php artisan migrate              # Create all tables
php artisan migrate:fresh        # Reset database (development only)
php artisan db:seed              # Seed test data
```

### View Database Tables

```bash
psql -U postgres -d Gold_Fleet
\dt                              # List all tables
\q                               # Exit psql
```

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication
```
POST   /api/login                 # User login
POST   /api/logout                # User logout
POST   /api/signup                # New user registration
GET    /api/user                  # Current user info
```

### Vehicles
```
GET    /api/vehicles              # List all vehicles
POST   /api/vehicles              # Create new vehicle
GET    /api/vehicles/{id}         # Get vehicle details
PUT    /api/vehicles/{id}         # Update vehicle
DELETE /api/vehicles/{id}         # Delete vehicle
```

### Drivers
```
GET    /api/drivers               # List all drivers
POST   /api/drivers               # Create new driver
GET    /api/drivers/{id}          # Get driver details
PUT    /api/drivers/{id}          # Update driver
DELETE /api/drivers/{id}          # Delete driver
```

### Trips
```
GET    /api/trips                 # List all trips
POST   /api/trips                 # Create new trip
GET    /api/trips/{id}            # Get trip details
PUT    /api/trips/{id}            # Update trip
DELETE /api/trips/{id}            # Delete trip
```

### Dashboard & Analytics
```
GET    /api/dashboard             # Dashboard summary data
GET    /api/analytics/vehicles    # Vehicle analytics
GET    /api/analytics/drivers     # Driver analytics
GET    /api/analytics/trips       # Trip analytics
```

See [backend/README.md](backend/README.md) for complete API documentation.

---

## 💻 Development Workflow

### Daily Development Routine

1. **Start backend services** (Terminal 1):
   ```bash
   cd backend
   composer dev
   ```

2. **Start frontend dev server** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open in browser**: http://localhost:5173

4. **Make code changes** - React hot-reloads automatically, Laravel logs appear in Terminal 1

5. **Stop services** - Press `Ctrl+C` in each terminal

### Database Changes

If you add new features that require database changes:

```bash
# Create a new migration
php artisan make:migration create_new_table_name

# Edit database/migrations/YYYY_MM_DD_HHMMSS_create_new_table_name.php

# Run the migration
php artisan migrate
```

### Testing

```bash
cd backend

# Run all tests
composer test

# Run specific test file
php artisan test tests/Feature/VehicleTest.php

# Run with coverage
php artisan test --coverage
```

### Code Quality

```bash
# Lint frontend code
cd frontend
npm run lint

# Fix linting errors (auto)
npm run lint -- --fix
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Issue: "Port 8000 already in use"
```bash
# Find process using port 8000
netstat -ano | findstr :8000                    # Windows
lsof -i :8000                                    # Mac/Linux

# Kill the process (Windows)
taskkill /PID <PID> /F

# Use different port
php artisan serve --port=8001
```

#### Issue: "CORS error: Access-Control-Allow-Origin"
This typically happens when frontend/backend ports are mismatched.

**Solution**:
1. Verify frontend is at http://localhost:5173
2. Verify backend is at http://localhost:8000
3. Check `backend/.env` has correct SANCTUM_STATEFUL_DOMAINS
4. Restart both services

#### Issue: "Storage symlink does not exist" or File Upload Fails
```bash
cd backend
php artisan storage:link
```

#### Issue: "SQLSTATE[08006] could not connect to server"
Database connection failed.

**Solution**:
1. Ensure PostgreSQL is running
2. Check connection in `backend/.env`
3. Verify database exists
4. Restart PostgreSQL service

#### Issue: "npm: command not found"
Node.js not installed.

**Solution**:
1. Download from https://nodejs.org/ (LTS version)
2. Install and restart terminal
3. Verify: `node --version` and `npm --version`

#### Issue: 502 Bad Gateway or API not responding
Backend service crashed.

**Solution**:
1. Check Terminal 1 for error messages
2. Restart backend: `Ctrl+C` then `composer dev`

See [Troubleshooting](#troubleshooting) section in each README for more issues.

---

## 👥 Contributing Guidelines

### Code Style
- **Frontend**: Follow ESLint rules (`npm run lint`)
- **Backend**: Follow Laravel conventions and PSR-12 standards
- **Commit Messages**: Use descriptive, present-tense messages

### Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run linting: `npm run lint` (frontend), `composer test` (backend)
4. Commit changes: `git commit -m "Add new feature"`
5. Push and create Pull Request
6. Code review before merge

---

## 📚 Documentation Links

For detailed documentation specific to each part of the system:

- **[Frontend README](frontend/README.md)** - React, Vite, npm scripts, component structure
- **[Backend README](backend/README.md)** - Laravel, API routes, database, Artisan commands

### Additional Resources
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Axios Documentation](https://axios-http.com)

---

## 🎉 Ready to Go!

Your Gold Fleet Management System is now ready for development and deployment. Start with the [Quick Start](#-quick-start-5-minutes) section and refer back to this documentation as needed.

**Happy coding!** 🚀
