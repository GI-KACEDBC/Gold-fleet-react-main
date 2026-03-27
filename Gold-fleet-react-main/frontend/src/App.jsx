import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ApprovalGuard from './components/ApprovalGuard';
import AuthPage from './pages/AuthPage';
import DriverSignup from './pages/DriverSignup';
import DriverSetup from './pages/DriverSetup';
import FeaturesPage from './pages/FeaturesPage';
import SolutionsPage from './pages/SolutionsPage';
import ResourcesPage from './pages/ResourcesPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Layout from './components/Layout';
import DriverLayout from './components/DriverLayout';
import ProtectedDriverRoute from './components/ProtectedDriverRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DriverDashboard from './pages/DriverDashboard';
import MapDashboard from './pages/MapDashboard';
import InfoDashboard from './pages/InfoDashboard';
import Vehicles from './pages/Vehicles';
import VehicleForm from './pages/VehicleForm';
import VehicleDetail from './pages/VehicleDetail';
import Drivers from './pages/Drivers';
import DriverForm from './pages/DriverForm';
import DriverDetail from './pages/DriverDetail';
import Trips from './pages/Trips';
import TripForm from './pages/TripForm';
import TripDetail from './pages/TripDetail';
import Services from './pages/Services';
import ServiceForm from './pages/ServiceForm';
import ServiceDetail from './pages/ServiceDetail';
import Inspections from './pages/Inspections';
import InspectionForm from './pages/InspectionForm';
import InspectionDetail from './pages/InspectionDetail';
import DriverMaintenanceChecklist from './pages/DriverMaintenanceChecklist';
import AdminInspectionReports from './pages/AdminInspectionReports';
import Issues from './pages/Issues';
import IssueForm from './pages/IssueForm';
import IssueDetail from './pages/IssueDetail';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import ExpenseDetail from './pages/ExpenseDetail';
import FuelFillups from './pages/FuelFillups';
import FuelFillupForm from './pages/FuelFillupForm';
import FuelFillupDetail from './pages/FuelFillupDetail';
import Reminders from './pages/Reminders';
import ReminderForm from './pages/ReminderForm';
import ReminderDetail from './pages/ReminderDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import MessagingPage from './pages/MessagingPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import PlatformRouter from './platform/routes/PlatformRouter';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import './App.css';

// Debug page to clear auth
function LogoutPage() {
  React.useEffect(() => {
    sessionStorage.removeItem('auth_token')
    sessionStorage.clear()
    window.location.href = '/'
  }, [])
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <p className="text-gray-700 mb-4">Logging out...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const ProtectedLayout = ({ children }) => (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route path="/about" element={<AboutPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/driver-signup" element={<DriverSignup />} />
      <Route path="/driver-setup/:setupToken" element={<DriverSetup />} />
      <Route path="/email/verify" element={<EmailVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      
      {/* Dashboard */}
      <Route path="/main" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/dashboard/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedDriverRoute><DriverLayout><DriverDashboard /></DriverLayout></ProtectedDriverRoute>} />
      <Route path="/driver-dashboard" element={<ProtectedDriverRoute><DriverLayout><DriverDashboard /></DriverLayout></ProtectedDriverRoute>} />
      <Route path="/driver/dashboard" element={<ProtectedDriverRoute><DriverLayout><DriverDashboard /></DriverLayout></ProtectedDriverRoute>} />
      <Route path="/driver/maintenance" element={<ProtectedDriverRoute><DriverLayout><DriverMaintenanceChecklist /></DriverLayout></ProtectedDriverRoute>} />
      <Route path="/map" element={<ProtectedRoute><ApprovalGuard><Layout><MapDashboard /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/info" element={<ProtectedRoute><ApprovalGuard><Layout><InfoDashboard /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Fleet Management - Vehicles (require approval) */}
      <Route path="/vehicles" element={<ProtectedRoute><ApprovalGuard><Layout><Vehicles /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/vehicles/create" element={<ProtectedRoute><ApprovalGuard><Layout><VehicleForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/vehicles/:id" element={<ProtectedRoute><ApprovalGuard><Layout><VehicleDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/vehicles/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><VehicleForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Fleet Management - Drivers (require approval) */}
      <Route path="/drivers" element={<ProtectedRoute><ApprovalGuard><Layout><Drivers /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/drivers/create" element={<ProtectedRoute><ApprovalGuard><Layout><DriverForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/drivers/:id" element={<ProtectedRoute><ApprovalGuard><Layout><DriverDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/drivers/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><DriverForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Fleet Management - Trips (require approval) */}
      <Route path="/trips" element={<ProtectedRoute><ApprovalGuard><Layout><Trips /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/trips/create" element={<ProtectedRoute><ApprovalGuard><Layout><TripForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/trips/:id" element={<ProtectedRoute><ApprovalGuard><Layout><TripDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/trips/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><TripForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Maintenance - Services (require approval) */}
      <Route path="/services" element={<ProtectedRoute><ApprovalGuard><Layout><Services /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/services/create" element={<ProtectedRoute><ApprovalGuard><Layout><ServiceForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/services/:id" element={<ProtectedRoute><ApprovalGuard><Layout><ServiceDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/services/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><ServiceForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Maintenance - Inspections (require approval) */}
      <Route path="/inspections" element={<ProtectedRoute><ApprovalGuard><Layout><Inspections /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/inspections/create" element={<ProtectedRoute><ApprovalGuard><Layout><InspectionForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/inspections/:id" element={<ProtectedRoute><ApprovalGuard><Layout><InspectionDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/inspections/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><InspectionForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/admin/inspection-reports" element={<ProtectedRoute><ApprovalGuard><Layout><AdminInspectionReports /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Maintenance - Issues (require approval) */}
      <Route path="/issues" element={<ProtectedRoute><ApprovalGuard><Layout><Issues /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/issues/create" element={<ProtectedRoute><ApprovalGuard><Layout><IssueForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/issues/:id" element={<ProtectedRoute><ApprovalGuard><Layout><IssueDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/issues/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><IssueForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Financial - Expenses (require approval) */}
      <Route path="/expenses" element={<ProtectedRoute><ApprovalGuard><Layout><Expenses /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/expenses/create" element={<ProtectedRoute><ApprovalGuard><Layout><ExpenseForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/expenses/:id" element={<ProtectedRoute><ApprovalGuard><Layout><ExpenseDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/expenses/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><ExpenseForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Financial - Fuel Fillups (require approval) */}
      <Route path="/fuel-fillups" element={<ProtectedRoute><ApprovalGuard><Layout><FuelFillups /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/fuel-fillups/create" element={<ProtectedRoute><ApprovalGuard><Layout><FuelFillupForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/fuel-fillups/:id" element={<ProtectedRoute><ApprovalGuard><Layout><FuelFillupDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/fuel-fillups/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><FuelFillupForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Planning - Reminders (require approval) */}
      <Route path="/reminders" element={<ProtectedRoute><ApprovalGuard><Layout><Reminders /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/reminders/create" element={<ProtectedRoute><ApprovalGuard><Layout><ReminderForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/reminders/:id" element={<ProtectedRoute><ApprovalGuard><Layout><ReminderDetail /></Layout></ApprovalGuard></ProtectedRoute>} />
      <Route path="/reminders/:id/edit" element={<ProtectedRoute><ApprovalGuard><Layout><ReminderForm /></Layout></ApprovalGuard></ProtectedRoute>} />
      
      {/* Profile & Notifications */}
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/change-password" element={<ProtectedLayout><ChangePasswordPage /></ProtectedLayout>} />
      <Route path="/company-settings" element={<ProtectedLayout><CompanySettingsPage /></ProtectedLayout>} />
      <Route path="/messages" element={<ProtectedLayout><MessagingPage /></ProtectedLayout>} />
      <Route path="/messages/:id" element={<ProtectedLayout><MessagingPage /></ProtectedLayout>} />
      <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />

      {/* Platform Owner Panel - /platform/* routes - MUST be before catch-all but after specific routes */}
      <Route path="/platform/*" element={<PlatformRouter />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
