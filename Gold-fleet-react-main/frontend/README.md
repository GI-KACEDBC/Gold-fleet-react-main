# Gold Fleet Frontend

A modern React 19 + Vite application for fleet management UI. This is the client-side interface for the Gold Fleet Management System.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and **npm** installed

### Get Started
```bash
# Install dependencies (one time)
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Running the App](#running-the-app)
3. [npm Scripts](#npm-scripts)
4. [Project Structure](#project-structure)
5. [Technology Stack](#technology-stack)
6. [Key Features](#key-features)
7. [Component Architecture](#component-architecture)
8. [Routing](#routing)
9. [API Integration](#api-integration)
10. [Styling with Tailwind CSS](#styling-with-tailwind-css)
11. [Building for Production](#building-for-production)
12. [Code Quality & Linting](#code-quality--linting)
13. [Troubleshooting](#troubleshooting)

---

## 💾 Installation

### Step 1: Install Dependencies
```bash
npm install
```

This reads `package.json` and installs all required packages into `node_modules/`.

### Step 2: Verify Installation
```bash
npm --version          # Show npm version
node --version         # Show Node.js version
npm list --depth=0     # List top-level packages
```

---

## ▶️ Running the App

### Development Server
```bash
npm run dev
```

This starts the Vite development server with:
- ✅ Hot Module Replacement (HMR) - auto-reload on code changes
- ✅ Lightning-fast builds
- ✅ Instant feedback during development
- ✅ Server at http://localhost:5173

**Expected Output:**
```
VITE v7.2.4  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Preview Production Build
```bash
npm run build          # Build for production (creates dist/)
npm run preview        # Show what production will look like
```

---

## 📝 npm Scripts

All available commands in `package.json`:

| Command | Purpose | Output |
|---------|---------|--------|
| `npm run dev` | Start dev server with hot reload | http://localhost:5173 |
| `npm run build` | Create optimized production build | `dist/` folder |
| `npm run preview` | Preview production build locally | http://localhost:4173 |
| `npm run lint` | Check code for issues | ESLint report |
| `npm run lint -- --fix` | Auto-fix linting errors | Fixed files |

### Example Usage
```bash
# Development
npm run dev             # Start coding

# Before committing
npm run lint -- --fix   # Fix code style issues

# Deployment
npm run build           # Create dist/
npm run preview         # Test production build
```

---

## 📁 Project Structure

```
frontend/
├── 📂 src/
│   ├── 📂 components/          # Reusable UI components
│   │   ├── Dashboard.jsx       # Dashboard component
│   │   ├── VehicleList.jsx     # Vehicle listing
│   │   ├── DriverProfile.jsx   # Driver profile
│   │   ├── Map.jsx             # Leaflet map integration
│   │   ├── Charts.jsx          # Data visualization
│   │   └── ...other components
│   │
│   ├── 📂 pages/               # Page-level components
│   │   ├── Home.jsx            # Home page
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Vehicles.jsx        # Vehicle management page
│   │   ├── Drivers.jsx         # Driver management page
│   │   ├── Trips.jsx           # Trip tracking page
│   │   ├── Services.jsx        # Service records page
│   │   ├── Inspections.jsx     # Inspection workflows
│   │   ├── Login.jsx           # Login page
│   │   └── ...other pages
│   │
│   ├── 📂 services/            # API client and utilities
│   │   ├── api.js              # Axios instance configuration
│   │   ├── vehicleService.js   # Vehicle API calls
│   │   ├── driverService.js    # Driver API calls
│   │   ├── tripService.js      # Trip API calls
│   │   └── ...other services
│   │
│   ├── 📂 assets/              # Static files
│   │   ├── images/             # Images and icons
│   │   ├── styles/             # Global styles
│   │   └── fonts/              # Custom fonts (if any)
│   │
│   ├── 📄 App.jsx              # Root component
│   ├── 📄 main.jsx             # React DOM render entry point
│   └── 📄 index.html           # HTML template
│
├── 📄 package.json             # Node.js dependencies
├── 📄 vite.config.js           # Vite configuration
├── 📄 tailwind.config.cjs      # Tailwind CSS setup
├── 📄 postcss.config.js        # PostCSS configuration
├── 📄 eslint.config.js         # ESLint rules
├── 📄 this README              # Documentation
└── 📄 .gitignore              # Git ignore rules
```

---

## 🛠 Technology Stack

### Core Framework & Build
| Package | Version | Purpose |
|---------|---------|----------|
| react | ^19.2.0 | UI library and hooks |
| react-dom | ^19.2.0 | React DOM rendering |
| vite | ^7.2.4 | Build tool and dev server |
| @vitejs/plugin-react | ^5.1.1 | Vite React plugin |

### Routing & State
| Package | Version | Purpose |
|---------|---------|----------|
| react-router-dom | ^7.13.0 | Client-side routing |

### HTTP & API
| Package | Version | Purpose |
|---------|---------|----------|
| axios | ^1.13.4 | HTTP client for API calls |

### Styling
| Package | Version | Purpose |
|---------|---------|----------|
| tailwindcss | ^3.4.1 | Utility-first CSS |
| postcss | ^8.4.32 | CSS transformations |
| autoprefixer | ^10.4.16 | Browser vendor prefixes |

### Data Visualization
| Package | Version | Purpose |
|---------|---------|----------|
| chart.js | ^4.5.1 | Chart library |
| react-chartjs-2 | ^5.3.1 | Chart.js React wrapper |
| recharts | ^3.7.0 | React charting library |

### Maps
| Package | Version | Purpose |
|---------|---------|----------|
| leaflet | ^1.9.4 | Interactive map library |
| react-leaflet | ^5.0.0 | Leaflet React wrapper |

### UI & Layout
| Package | Version | Purpose |
|---------|---------|----------|
| react-icons | ^5.5.0 | Icon library (FontAwesome, etc.) |
| react-grid-layout | ^1.5.3 | Responsive grid layout |

### Development & Linting
| Package | Version | Purpose |
|---------|---------|----------|
| eslint | ^9.16.0 | Code quality checker |
| eslint-plugin-react-hooks | ^5.0.0 | React hooks linting |
| eslint-plugin-react-refresh | ^0.4.24 | Vite HMR validation |

---

## ✨ Key Features

### Dashboard & Analytics
- 📊 Real-time fleet overview
- 📈 Multiple chart types (Charts.js, Recharts)
- 🎯 Key performance indicators
- 📋 Data export capabilities

### Fleet Management
- 🚗 Vehicle registry and tracking
- 👨‍💼 Driver management
- 📍 Real-time location mapping (Leaflet.js)
- 📝 Trip history and analytics

### Operations
- 🔍 Vehicle inspection workflows
- 🔧 Service and maintenance records
- ⚠️ Issue tracking and reporting
- ⏰ Fuel and expense logging

### User Interface
- 💫 Modern, responsive design (Tailwind CSS)
- 🌙 Dark mode support (configurable)
- 📱 Mobile-friendly layout
- ♿ Accessible components

### Performance
- ⚡ Lightning-fast Vite builds
- 🔄 Hot Module Replacement (HMR)
- 📦 Code splitting and lazy loading
- 🎯 Optimized production builds

---

## 🏗 Component Architecture

### Component Types

#### 1. Page Components (`pages/`)
Top-level route components that represent full pages.

#### 2. Component Components (`components/`)
Reusable UI components used across pages.

#### 3. Service Functions (`services/`)
API calls and business logic.

### State Management Pattern
- Use React hooks (`useState`, `useEffect`) for local state
- Use context API for shared state if needed
- Call API services from `useEffect` hooks
- Display loading and error states

---

## 🛣 Routing

Routes are defined in `App.jsx` using React Router:

### Creating New Routes
1. Create page component: `src/pages/NewPage.jsx`
2. Import in `App.jsx`
3. Add route: `<Route path="/new-page" element={<NewPage />} />`
4. Add navigation link in header/sidebar

---

## 🔌 API Integration

### API Configuration (`services/api.js`)
Axios is pre-configured to communicate with the backend at `http://localhost:8000/api`.

### Making API Calls
Import services from `services/` and use them in components:
```javascript
import { getVehicles } from '../services/vehicleService';
```

### Error Handling
Always handle errors in API calls and display them to users.

---

## 🎨 Styling with Tailwind CSS

### Tailwind CSS Classes

Tailwind is already configured. Use utility classes for styling.

### Global Styles
Write globals in `src/styles/globals.css` or `tailwind.config.cjs`.

---

## 🏗 Building for Production

### Create Optimized Build
```bash
npm run build
```

This:
- ✅ Minifies JavaScript and CSS
- ✅ Optimizes images
- ✅ Code-splits bundles
- ✅ Creates `dist/` folder

### Preview Production Build
```bash
npm run preview
```

### Deploy to Backend

The backend `composer setup` script automatically builds the frontend and places it in `backend/public/`.

---

## ✅ Code Quality & Linting

### Run ESLint
```bash
# Check for issues
npm run lint

# Auto-fix issues (when possible)
npm run lint -- --fix
```

### Before Committing
```bash
# 1. Run linter and fix
npm run lint -- --fix

# 2. Test your feature
npm run dev

# 3. Commit changes
git add .
git commit -m "Add new feature"
```

---

## 🐛 Troubleshooting

### Issue: "Port 5173 already in use"
```bash
# Windows - find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>

# OR use different port
npm run dev -- --port 3000
```

### Issue: "Module not found" or "Cannot find module"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Hot reload not working
```bash
# 1. Check if Vite is running: npm run dev
# 2. Clear browser cache (Ctrl+Shift+Delete)
# 3. Restart dev server (Ctrl+C, then npm run dev)
# 4. Check browser console for errors (F12)
```

### Issue: "npm: command not found"
Node.js not installed.
- Download from https://nodejs.org/
- Install LTS version
- Restart terminal
- Verify: `node --version` and `npm --version`

### Issue: ESLint errors block build
```bash
# Auto-fix linting errors
npm run lint -- --fix
```

### Issue: API calls getting 404 or CORS errors
```bash
# Verify backend is running:
# - Terminal 2: cd backend && composer dev
# - Should see "Laravel development server started client 8000"
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Axios Documentation](https://axios-http.com)
- [React Router Documentation](https://reactrouter.com)
- [ESLint Documentation](https://eslint.org)

---

## 🎉 Ready to Code!

Your frontend development environment is now ready. Start with:
```bash
npm run dev
```

Then open http://localhost:5173 in your browser and begin building! 🚀
