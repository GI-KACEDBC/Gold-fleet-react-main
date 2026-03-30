<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PlatformAuthController;
use App\Http\Controllers\Api\PlatformDashboardController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\CompanyApprovalController;
use App\Http\Controllers\Api\PlatformStatusController;
use App\Http\Controllers\Api\PlatformMessageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GenericController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MapDashboardController;
use App\Http\Controllers\InfoDashboardController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FuelFillupController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PhoneTrackerController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\Api\ChartController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\MapClickController;
use App\Http\Controllers\Api\SubscriptionManagementController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\PaymentSimulationController;
use App\Http\Controllers\PlatformPaymentController;
use App\Http\Controllers\TripSimulationController;
use App\Http\Controllers\GeocodingController;
use App\Http\Controllers\MapboxProxyController;

// API routes for frontend consumption. These return JSON and are prefixed with /api by the framework.

// API Root endpoint
Route::get('/', function (Request $request) {
    return response()->json([
        'message' => 'Gold Fleet API',
        'version' => '1.0',
        'login_channels' => [
            'driver' => '/api/login (POST) - For drivers only',
            'admin' => '/api/company-admin-login (POST) - For company admins only',
        ],
        'documentation' => 'See storage/logs/auth.log for authentication details',
    ]);
});

// Auth routes (public)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/company-admin-login', [AuthController::class, 'companyAdminLogin']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/driver-register', [AuthController::class, 'driverRegister']);
Route::post('/driver-activate', [AuthController::class, 'driverActivate']);
Route::post('/cancel-signup', [AuthController::class, 'cancelSignup']);

// Email Verification routes (public verification endpoint)
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify']);

// Quick email verification via API (no email link needed)
// Development: Can be public, Production: Add middleware('auth:sanctum')
Route::post('/email/quick-verify', [EmailVerificationController::class, 'quickVerify']);

// Email Verification routes (protected - require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/email/send-verification', [EmailVerificationController::class, 'send']);
});

// ========== DEVELOPMENT ONLY - EMAIL VERIFICATION MANAGEMENT ==========
// These routes are ONLY available in local/development environment
if (app()->environment('local', 'development')) {
    Route::prefix('dev')->group(function () {
        // View all pending email verifications with clickable links
        Route::get('/email/pending-verifications', [
            \App\Http\Controllers\Api\EmailVerificationDevelopmentController::class, 
            'getPendingVerifications'
        ]);
        
        // Get verification status for a specific user
        Route::get('/email/user/{userId}/status', [
            \App\Http\Controllers\Api\EmailVerificationDevelopmentController::class, 
            'getUserVerificationStatus'
        ]);
        
        // Force verify a user's email (for testing)
        Route::post('/email/user/{userId}/force-verify', [
            \App\Http\Controllers\Api\EmailVerificationDevelopmentController::class, 
            'forceVerifyEmail'
        ]);
        
        // Resend verification email to a user
        Route::post('/email/user/{userId}/resend', [
            \App\Http\Controllers\Api\EmailVerificationDevelopmentController::class, 
            'resendVerificationEmail'
        ]);
    });
}

// Public contact endpoint for inbound messages
Route::post('/contact', [ContactController::class, 'store']);

// Public endpoint to record map clicks
Route::post('/map-clicks', [MapClickController::class, 'store']);
Route::get('/map-clicks', [MapClickController::class, 'index']);

// Public geocoding endpoints (no auth needed)
Route::post('/geocode', [GeocodingController::class, 'geocode']);
Route::post('/reverse-geocode', [GeocodingController::class, 'reverseGeocode']);
Route::post('/mapbox-proxy', [MapboxProxyController::class, 'geocode']);

// Platform Owner Auth routes (public)
Route::prefix('platform')->group(function () {
    Route::post('/login', [PlatformAuthController::class, 'login']);
    Route::post('/signup', [PlatformAuthController::class, 'signup']);
    
    // Protected platform routes (require api_token authentication)
    Route::middleware('authorize.api.token')->group(function () {
        Route::post('/logout', [PlatformAuthController::class, 'logout']);
        Route::get('/user', [PlatformAuthController::class, 'getUser']);
        
        // Dashboard endpoints
        Route::get('/dashboard/stats', [PlatformDashboardController::class, 'getStats']);
        Route::get('/companies', [PlatformDashboardController::class, 'getCompanies']);
        Route::delete('/companies/{id}', [PlatformDashboardController::class, 'deleteCompany']);
        Route::post('/companies/{id}/approve', [PlatformDashboardController::class, 'approveCompany']);
        Route::post('/companies/{id}/decline', [PlatformDashboardController::class, 'declineCompany']);
        Route::get('/analytics', [PlatformDashboardController::class, 'getAnalytics']);
        Route::get('/analytics/company-growth', [PlatformDashboardController::class, 'getCompanyGrowth']);
        Route::get('/analytics/vehicle-usage', [PlatformDashboardController::class, 'getVehicleUsage']);
        Route::get('/analytics/trips-per-company', [PlatformDashboardController::class, 'getTripsPerCompany']);
        Route::get('/analytics/subscription-revenue', [PlatformDashboardController::class, 'getSubscriptionRevenue']);
        Route::get('/subscriptions', [PlatformDashboardController::class, 'getSubscriptions']);
        
        // Platform Messaging endpoints (new real-time messaging system)
        Route::get('/messages', [PlatformMessageController::class, 'index']);
        Route::post('/messages', [PlatformMessageController::class, 'store']);
        Route::get('/messages/{message}', [PlatformMessageController::class, 'show']);
        Route::post('/messages/{message}/reply', [PlatformMessageController::class, 'reply']);
        Route::patch('/messages/{message}/read', [PlatformMessageController::class, 'markAsRead']);
        
        // Company and Admin lists for messaging
        Route::get('/companies-list', [PlatformMessageController::class, 'getCompaniesList']);
        Route::get('/company/{companyId}/admins', [PlatformMessageController::class, 'getCompanyAdmins']);
        
        Route::get('/settings', [PlatformDashboardController::class, 'getSettings']);
        Route::match(['post', 'put'], '/settings', [PlatformDashboardController::class, 'updateSettings']);
        
        // Subscription Management endpoints
        Route::get('/subscription-management', [SubscriptionManagementController::class, 'index']);
        Route::get('/subscription-management/with-simulations', [SubscriptionManagementController::class, 'getAllWithSimulations']);
        Route::get('/subscription-management/status/{status}', [SubscriptionManagementController::class, 'getByStatus']);
        Route::get('/subscription-management/{id}', [SubscriptionManagementController::class, 'show']);
        Route::get('/subscription-management/{id}/with-simulations', [SubscriptionManagementController::class, 'getWithSimulations']);
        Route::post('/subscription-management/{id}/activate', [SubscriptionManagementController::class, 'activate']);
        Route::post('/subscription-management/{id}/deactivate', [SubscriptionManagementController::class, 'deactivate']);
        Route::post('/subscription-management/{id}/suspend', [SubscriptionManagementController::class, 'suspend']);
        Route::post('/subscription-management/{id}/resume', [SubscriptionManagementController::class, 'resume']);

        // Payment Management endpoints for super admin
        Route::get('/payments', [PlatformPaymentController::class, 'index']);
        Route::get('/payments/{id}', [PlatformPaymentController::class, 'show']);
        Route::post('/payments/{id}/verify', [PlatformPaymentController::class, 'verifyPayment']);
        Route::get('/payments-stats/revenue', [PlatformPaymentController::class, 'revenueStats']);
        Route::get('/payments-stats/company/{companyId}', [PlatformPaymentController::class, 'companyStats']);
        Route::get('/payments-stats/companies-summary', [PlatformPaymentController::class, 'companiesSummary']);

        // Company Approval endpoints for super admin
        Route::get('/company-approvals', [CompanyApprovalController::class, 'getPendingApprovals']);
        Route::get('/company-approvals/{id}', [CompanyApprovalController::class, 'showForApproval']);
        Route::post('/company-approvals/{id}/approve', [CompanyApprovalController::class, 'approveCompany']);
        Route::post('/company-approvals/{id}/reject', [CompanyApprovalController::class, 'rejectCompany']);
        Route::get('/company-approvals/status/{status}', [CompanyApprovalController::class, 'getCompaniesByStatus']);
    });
});

// Email verification removed - verification endpoints are disabled for API-based flow

// Public plans endpoint - for signup flow
Route::get('/plans', [PlanController::class, 'index']);
Route::get('/plans/{id}', [PlanController::class, 'show']);

// Protected routes (require valid api_token)
Route::middleware('authorize.api.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Platform status - accessible without approval (used to check status)
    Route::get('/platform/status', [PlatformStatusController::class, 'getStatus']);

    // Dashboard data
    Route::get('/dashboard', [InfoDashboardController::class, 'index']);
    Route::get('/dashboard/stats', [InfoDashboardController::class, 'index']);
    Route::get('/dashboard/info/chart-data', [InfoDashboardController::class, 'getChartData']);
    Route::get('/vehicle-locations', [MapDashboardController::class, 'getVehicleLocations']);
    Route::post('/vehicle-location', [MapDashboardController::class, 'storeVehicleLocation'])->middleware('driver');

    // Chart data endpoints
    Route::prefix('charts')->group(function () {
        Route::get('/repair-priority-class', [ChartController::class, 'repairPriorityClass']);
        Route::get('/time-to-resolve', [ChartController::class, 'timeToResolve']);
        Route::get('/fuel-costs', [ChartController::class, 'fuelCosts']);
        Route::get('/service-costs', [ChartController::class, 'serviceCosts']);
    });

    // Phone Tracker
    Route::post('/tracker/update-location', [PhoneTrackerController::class, 'updateLocation']);
    Route::get('/tracker/last-location/{vehicleId}', [PhoneTrackerController::class, 'getLastLocation']);
    Route::post('/tracker/simulate/{vehicleId}', [PhoneTrackerController::class, 'simulateTrackerUpdate']);

    // Vehicle Simulation
    Route::post('/simulation/start', [SimulationController::class, 'start']);
    Route::post('/simulation/stop', [SimulationController::class, 'stop']);
    Route::get('/simulation/status', [SimulationController::class, 'status']);
    Route::post('/simulation/update', [SimulationController::class, 'update']);

    // Profile, Notifications, and Settings (NO approval required)
    Route::get('/profile', [ProfileController::class, 'edit']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);
    
    // Password and settings
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/company-settings', [ProfileController::class, 'getCompanySettings']);
    Route::post('/company-settings', [ProfileController::class, 'updateCompanySettings']);
    
    // Team members
    Route::get('/team-members', [ProfileController::class, 'getTeamMembers']);
    Route::post('/team-members', [ProfileController::class, 'addTeamMember']);
    Route::delete('/team-members/{userId}', [ProfileController::class, 'removeTeamMember']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Messaging and Conversations (Company Admin ↔ Platform Admin)
    Route::get('/conversations', [ConversationController::class, 'indexForCompanyAdmin']); // Company admin views their conversations
    Route::post('/conversations', [ConversationController::class, 'createForCompanyAdmin']); // Company admin creates new conversation
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']); // View specific conversation
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']); // Send message in conversation
    Route::patch('/conversations/{conversation}/close', [ConversationController::class, 'closeConversation']); // Close conversation
    Route::get('/conversations/unread-count', [ConversationController::class, 'getUnreadCount']); // Get unread message count

    // Admin messaging routes (require admin role)
    Route::middleware('role:admin')->group(function () {
        Route::post('/admin/send-message', [NotificationController::class, 'sendAdminMessage']);
        Route::post('/admin/broadcast-message', [NotificationController::class, 'broadcastMessage']);
        Route::get('/admin/conversations', [ConversationController::class, 'indexForPlatformAdmin']); // Platform admin views all conversations
        Route::patch('/conversations/{conversation}/assign', [ConversationController::class, 'assignToPlatformAdmin']); // Assign conversation to admin
    });

    // Plans and Subscriptions (view allowed, modifications may require approval)
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::get('/subscriptions/current', [SubscriptionController::class, 'getCurrentSubscription']);
    Route::post('/plans', [PlanController::class, 'store'])->middleware('role:admin');
    Route::put('/plans/{id}', [PlanController::class, 'update'])->middleware('role:admin');
    Route::delete('/plans/{id}', [PlanController::class, 'destroy'])->middleware('role:admin');

    // Payment Simulations (view allowed)
    Route::apiResource('payment-simulations', PaymentSimulationController::class);
    Route::get('/payment-simulations/subscription/{subscriptionId}', [PaymentSimulationController::class, 'getBySubscription']);
    Route::post('/payment-simulations/{id}/process', [PaymentSimulationController::class, 'processPayment']);

    // Company's own payment history
    Route::get('/payments/my', [PlatformPaymentController::class, 'myPayments']);

    // ========== DRIVER MAINTENANCE CHECKLIST ROUTES (NO APPROVAL REQUIRED) ==========
    // Drivers can submit maintenance checklists whether or not company is approved
    Route::post('/inspections/submit-checklist', [InspectionController::class, 'submitChecklist']);
    Route::get('/inspections/pending-reviews', [InspectionController::class, 'getPendingReviews']);
    Route::patch('/inspections/{inspection}/review', [InspectionController::class, 'reviewChecklist']);

    // ========== COMPANY MESSAGING ROUTES (NO APPROVAL REQUIRED) ==========
    // Company users can send messages to platform regardless of approval status
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{message}', [MessageController::class, 'show']);
    Route::post('/messages/{message}/reply', [MessageController::class, 'reply']);
    Route::patch('/messages/{message}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);

    // ========== FLEET MANAGEMENT ROUTES - REQUIRE COMPANY APPROVAL ==========
    // These routes are protected by EnsureCompanyApproved middleware
    Route::middleware('ensure.company.approved')->group(function () {
        // Resource endpoints - Vehicles, Drivers, Trips, Services, Inspections, Issues, Expenses, Fuel, Reminders
        Route::apiResource('vehicles', VehicleController::class);
        Route::apiResource('drivers', DriverController::class);
        
        // Driver setup link regeneration
        Route::post('/drivers/{driver}/regenerate-setup-link', [DriverController::class, 'regenerateSetupLink']);
        
        Route::apiResource('trips', TripController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('inspections', InspectionController::class);
        Route::apiResource('issues', IssueController::class);
        Route::apiResource('expenses', ExpenseController::class);
        Route::apiResource('fuel-fillups', FuelFillupController::class);
        Route::apiResource('reminders', ReminderController::class);

        // Dashboard data (restricted to approved companies)
        Route::get('/dashboard', [InfoDashboardController::class, 'index']);
        Route::get('/dashboard/stats', [InfoDashboardController::class, 'index']);
        Route::get('/dashboard/info/chart-data', [InfoDashboardController::class, 'getChartData']);

        // Mapping and Tracking (restricted to approved companies)
        Route::get('/vehicle-locations', [MapDashboardController::class, 'getVehicleLocations']);
        Route::post('/vehicle-location', [MapDashboardController::class, 'storeVehicleLocation']);
        Route::middleware('driver')->post('/vehicle-location', [MapDashboardController::class, 'storeVehicleLocation']);

        // Phone Tracker (restricted)
        Route::post('/tracker/update-location', [PhoneTrackerController::class, 'updateLocation']);
        Route::get('/tracker/last-location/{vehicleId}', [PhoneTrackerController::class, 'getLastLocation']);
        Route::post('/tracker/simulate/{vehicleId}', [PhoneTrackerController::class, 'simulateTrackerUpdate']);

        // Chart data endpoints (restricted)
        Route::prefix('charts')->group(function () {
            Route::get('/repair-priority-class', [ChartController::class, 'repairPriorityClass']);
            Route::get('/time-to-resolve', [ChartController::class, 'timeToResolve']);
            Route::get('/fuel-costs', [ChartController::class, 'fuelCosts']);
            Route::get('/service-costs', [ChartController::class, 'serviceCosts']);
        });

        // ========== TRIP SIMULATION ROUTES ==========
        // Real-time vehicle movement simulation along routes
        
        // Create a new trip (Company)
        Route::post('/trips-simulation', [TripSimulationController::class, 'createTrip']);
        
        // Approve trip and start simulation (Driver)
        Route::post('/trips/{tripId}/approve', [TripSimulationController::class, 'approveTrip']);
        
        // Update vehicle location during simulation (Simulator script)
        Route::post('/vehicle/location', [TripSimulationController::class, 'updateLocation']);
        
        // Get all locations for a trip (Dashboard history/playback)
        Route::get('/trips/{tripId}/locations', [TripSimulationController::class, 'getTripLocations']);
        
        // Get simulation status for a trip
        Route::get('/trips/{tripId}/simulation', [TripSimulationController::class, 'getSimulationStatus']);
        
        // Stop/complete a simulation
        Route::post('/trips/{tripId}/simulation/stop', [TripSimulationController::class, 'stopSimulation']);
        
        // Get all active trips for company dashboard (with pagination)
        Route::get('/trips-simulation/company/active', [TripSimulationController::class, 'getActiveTripsByCompany']);
        
        // Get driver's assigned trip
        Route::get('/driver/trip', [TripSimulationController::class, 'getDriverTrip']);
    });
});
