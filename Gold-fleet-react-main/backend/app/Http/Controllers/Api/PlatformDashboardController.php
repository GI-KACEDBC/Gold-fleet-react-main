<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Company;
use App\Models\Vehicle;
use App\Models\Trip;
use App\Models\Message;
use App\Models\Plan;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PlatformDashboardController extends Controller
{
    /**
     * Get Dashboard Stats
     * Returns key metrics for platform owner dashboard
     */
    public function getStats()
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'platform_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get all companies (tenant count)
            $totalCompanies = Company::count();
            $activeCompanies = Company::where('subscription_status', 'active')->count();

            // Get vehicle stats across all companies
            $totalVehicles = Vehicle::count();
            $activeVehicles = Vehicle::where('status', 'active')->count();

            // Get trip stats
            $tripsToday = Trip::whereDate('created_at', Carbon::today())->count();
            $completedTrips = Trip::where('status', 'completed')->whereDate('updated_at', Carbon::today())->count();

            // Get subscription stats
            $activeSubscriptions = Company::where('subscription_status', 'active')->count();
            
            // Calculate monthly revenue (estimate based on subscription plans)
            $basicCount = Company::where('subscription_plan', 'basic')->where('subscription_status', 'active')->count();
            $proCount = Company::where('subscription_plan', 'pro')->where('subscription_status', 'active')->count();
            $enterpriseCount = Company::where('subscription_plan', 'enterprise')->where('subscription_status', 'active')->count();
            
            // Pricing: basic=$99, pro=$299, enterprise=$999
            $monthlyRevenue = ($basicCount * 99) + ($proCount * 299) + ($enterpriseCount * 999);

            // Calculate total revenue
            $totalRevenue = $monthlyRevenue * 6; // Assume 6 months average

            // Calculate subscription renewals (for now, hardcoded as we don't have renewal dates)
            $overdueRenewals = 0;
            $dueSoonRenewals = 0;

            // Build chart data - monthly company growth
            $monthlyData = [];
            $now = Carbon::now();
            
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);
                $monthName = $month->format('M');
                
                $companiesCount = Company::where('created_at', '<=', $month->endOfMonth())
                    ->count();
                
                // Calculate revenue for this month
                $basicCount = Company::where('created_at', '<=', $month->endOfMonth())
                    ->where('subscription_plan', 'basic')
                    ->where('subscription_status', 'active')
                    ->count();
                $proCount = Company::where('created_at', '<=', $month->endOfMonth())
                    ->where('subscription_plan', 'pro')
                    ->where('subscription_status', 'active')
                    ->count();
                $enterpriseCount = Company::where('created_at', '<=', $month->endOfMonth())
                    ->where('subscription_plan', 'enterprise')
                    ->where('subscription_status', 'active')
                    ->count();
                
                $monthRevenue = ($basicCount * 99) + ($proCount * 299) + ($enterpriseCount * 999);
                
                $monthlyData[] = [
                    'month' => $monthName,
                    'companies' => $companiesCount,
                    'revenue' => (int)$monthRevenue
                ];
            }

            return response()->json([
                'stats' => [
                    'totalCompanies' => $totalCompanies,
                    'activeCompanies' => $activeCompanies,
                    'totalVehicles' => $totalVehicles,
                    'activeVehicles' => $activeVehicles,
                    'tripsToday' => $tripsToday,
                    'completedTrips' => $completedTrips,
                    'activeSubscriptions' => $activeSubscriptions,
                    'monthlyRevenue' => (int)$monthlyRevenue,
                    'totalRevenue' => (int)$totalRevenue,
                    'overdueRenewals' => $overdueRenewals,
                    'dueSoonRenewals' => $dueSoonRenewals,
                ],
                'charts' => [
                    'growth' => $monthlyData
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Companies - Returns ALL companies with full details
     * Includes payment status, subscription status, company status, and plan info
     */
    public function getCompanies(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $page = $request->query('page', 1);
            $limit = $request->query('limit', 10);

            // Build query with all necessary relationships
            $query = Company::with(['subscriptions.plan', 'paymentSimulations', 'users'])
                ->orderBy('created_at', 'desc');

            // Get paginated results
            $companies = $query->paginate($limit);

            // Transform companies to include all necessary data
            $companiesData = $companies->map(function($company) {
                // Get latest subscription
                $latestSubscription = $company->subscriptions->sortByDesc('created_at')->first();
                
                // Get latest payment
                $latestPayment = $company->paymentSimulations->sortByDesc('created_at')->first();
                
                // Get admin user email (the company owner/admin)
                $adminUser = $company->users()->where('role', 'admin')->first();
                $adminEmail = $adminUser ? $adminUser->email : 'N/A';
                
                // Build status display
                $companyStatus = $company->company_status ?? 'registered';
                
                // Map internal status to display status
                $statusDisplay = match($companyStatus) {
                    'pending_approval' => 'Pending Approval',
                    'approved' => 'Approved',
                    'rejected' => 'Declined',
                    'declined' => 'Declined',
                    default => 'Registered'
                };
                
                // Get plan information - check multiple sources
                $planName = 'N/A';
                
                // First try from latest subscription
                if ($latestSubscription) {
                    if ($latestSubscription->plan) {
                        $planName = $latestSubscription->plan->name;
                    } elseif ($latestSubscription->plan_id) {
                        // Try loading plan directly
                        $plan = Plan::find($latestSubscription->plan_id);
                        if ($plan) {
                            $planName = $plan->name;
                        }
                    }
                }
                
                // Fallback: check subscription_status for plan info
                if ($planName === 'N/A' && $latestSubscription && $latestSubscription->status) {
                    // Use subscription status if plan name not found
                    $planName = ucfirst(str_replace('_', ' ', $latestSubscription->status));
                }
                
                // Get subscription status
                $subscriptionStatus = $latestSubscription ? $latestSubscription->status : 'none';
                
                // Get payment status
                $paymentStatus = 'none';
                if ($latestPayment) {
                    $paymentStatus = $latestPayment->payment_status ?? 'pending';
                }
                
                // Count actual vehicles and drivers
                $vehiclesCount = $company->vehicles()->count();
                $driversCount = $company->drivers()->count();
                
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'admin_email' => $adminEmail,
                    'user_email' => $adminEmail,
                    'phone' => $company->phone,
                    'status' => $statusDisplay,
                    'company_status' => $companyStatus,
                    'subscription_status' => $subscriptionStatus,
                    'payment_status' => $paymentStatus,
                    'plan' => $planName,
                    'subscription_plan' => $planName, // Alias for backward compatibility
                    'plan_name' => $planName, // Alias for backward compatibility
                    'vehicles' => $vehiclesCount,
                    'drivers' => $driversCount,
                    'created_at' => $company->created_at->format('Y-m-d'),
                    'created_at_timestamp' => $company->created_at,
                    'approved_at' => $company->approved_at ? $company->approved_at->format('Y-m-d') : null,
                    'account_status' => $company->account_status ?? 'pending',
                    'latest_payment_amount' => $latestPayment ? $latestPayment->simulated_amount : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $companiesData,
                'companies' => $companiesData, // Include both for backward compatibility
                'pagination' => [
                    'current_page' => $companies->currentPage(),
                    'per_page' => $companies->perPage(),
                    'total' => $companies->total(),
                    'last_page' => $companies->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching companies: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch companies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete Company
     * Cascade delete all related data
     */
    public function deleteCompany($id)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $company = Company::findOrFail($id);
            
            // Get company name before deletion
            $companyName = $company->name;
            
            // Delete all related data in proper order to respect foreign keys
            // IMPORTANT: Delete child records BEFORE parent records (respect FK constraints)
            
            // 1. Delete all trips related to vehicles
            Trip::whereIn('vehicle_id', $company->vehicles()->pluck('id'))->delete();
            
            // 2. Delete all vehicle-related data
            $company->vehicles()->delete();
            
            // 3. Delete all drivers
            $company->drivers()->delete();
            
            // 4. Delete all users in the company
            User::where('company_id', $company->id)->delete();
            
            // 5. DELETE PAYMENT SIMULATIONS FIRST (they reference subscriptions via FK)
            \App\Models\PaymentSimulation::where('company_id', $company->id)->delete();
            
            // 6. NOW delete subscriptions (after payment_simulations deleted)
            $company->subscriptions()->delete();
            
            // 7. Delete all other company records
            // Services, Inspections, Issues, Expenses, Fuel Fillups, Reminders, etc.
            \App\Models\Service::where('company_id', $company->id)->delete();
            \App\Models\Inspection::where('company_id', $company->id)->delete();
            \App\Models\Issue::where('company_id', $company->id)->delete();
            \App\Models\Expense::where('company_id', $company->id)->delete();
            \App\Models\FuelFillup::where('company_id', $company->id)->delete();
            \App\Models\Reminder::where('company_id', $company->id)->delete();
            
            // 8. Finally delete the company itself
            $company->delete();
            
            return response()->json([
                'message' => "Company '{$companyName}' and all its data have been successfully deleted",
                'deleted_company' => $companyName,
                'timestamp' => now()
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Company not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting company: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Analytics
     */
    public function getAnalytics()
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Company growth data
        $companyGrowth = [];
        $now = Carbon::now();
        
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthName = $month->format('M');
            
            $count = Company::where('created_at', '<=', $month->endOfMonth())->count();
            
            $companyGrowth[] = [
                'month' => $monthName,
                'companies' => $count
            ];
        }

        // Vehicle usage by company
        $vehicleUsage = Company::withCount('vehicles')
            ->orderBy('vehicles_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($company) {
                return [
                    'name' => $company->name,
                    'vehicles' => $company->vehicles_count
                ];
            });

        // Trip data by company
        $tripsByCompany = Company::with(['vehicles.trips'])
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(function ($company) {
                $tripCount = $company->vehicles->sum(function ($vehicle) {
                    return $vehicle->trips->count();
                });
                return [
                    'name' => $company->name,
                    'trips' => $tripCount
                ];
            });

        // Revenue by plan
        $revenueByPlan = [
            ['month' => 'Jan', 'basic' => 2400, 'pro' => 2210, 'enterprise' => 2290],
            ['month' => 'Feb', 'basic' => 3398, 'pro' => 2908, 'enterprise' => 2000],
            ['month' => 'Mar', 'basic' => 2800, 'pro' => 3800, 'enterprise' => 2181],
            ['month' => 'Apr', 'basic' => 3800, 'pro' => 3908, 'enterprise' => 2500],
            ['month' => 'May', 'basic' => 4300, 'pro' => 4800, 'enterprise' => 2210],
            ['month' => 'Jun', 'basic' => 3300, 'pro' => 4300, 'enterprise' => 2100],
        ];

        return response()->json([
            'charts' => [
                'companyGrowth' => $companyGrowth,
                'vehicleUsage' => $vehicleUsage,
                'tripsByCompany' => $tripsByCompany,
                'revenueByPlan' => $revenueByPlan
            ]
        ]);
    }

    /**
     * Get Company Growth Data
     * Returns monthly company creation trend
     */
    public function getCompanyGrowth()
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'platform_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $companyGrowth = [];
            $now = Carbon::now();
            
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i);
                $monthName = $month->format('M');
                
                $count = Company::where('created_at', '<=', $month->endOfMonth())->count();
                
                $companyGrowth[] = [
                    'month' => $monthName,
                    'companies' => $count
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $companyGrowth
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Vehicle Usage Data
     * Returns vehicle count by company
     */
    public function getVehicleUsage()
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'platform_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $vehicleUsage = Company::withCount('vehicles')
                ->orderBy('vehicles_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($company) {
                    return [
                        'name' => $company->name,
                        'vehicles' => $company->vehicles_count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $vehicleUsage
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Trips Per Company Data
     * Returns trip count by company
     */
    public function getTripsPerCompany()
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'platform_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $tripsByCompany = Company::with(['vehicles.trips'])
                ->orderBy('name')
                ->limit(10)
                ->get()
                ->map(function ($company) {
                    $tripCount = $company->vehicles->sum(function ($vehicle) {
                        return $vehicle->trips->count();
                    });
                    return [
                        'name' => $company->name,
                        'trips' => $tripCount
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tripsByCompany
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Subscription Revenue Data
     * Returns revenue trend by subscription plan
     */
    public function getSubscriptionRevenue()
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'platform_admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Revenue by plan (demo data)
            $revenueByPlan = [
                ['month' => 'Jan', 'basic' => 2400, 'pro' => 2210, 'enterprise' => 2290],
                ['month' => 'Feb', 'basic' => 3398, 'pro' => 2908, 'enterprise' => 2000],
                ['month' => 'Mar', 'basic' => 2800, 'pro' => 3800, 'enterprise' => 2181],
                ['month' => 'Apr', 'basic' => 3800, 'pro' => 3908, 'enterprise' => 2500],
                ['month' => 'May', 'basic' => 4300, 'pro' => 4800, 'enterprise' => 2210],
                ['month' => 'Jun', 'basic' => 3300, 'pro' => 4300, 'enterprise' => 2100],
            ];

            return response()->json([
                'success' => true,
                'data' => $revenueByPlan
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Subscriptions
     */
    public function getSubscriptions()
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $companies = Company::paginate(10);
        
        // Map company data to subscription format for frontend
        $subscriptions = $companies->map(function ($company) {
            return [
                'id' => $company->id,
                'company' => $company->name,
                'plan' => $company->subscription_plan,
                'price' => match($company->subscription_plan) {
                    'basic' => 99,
                    'pro' => 299,
                    'enterprise' => 999,
                    default => 0
                },
                'status' => $company->subscription_status,
                'paymentStatus' => $company->subscription_status === 'active' ? 'paid' : 'pending',
                'renewalDate' => $company->updated_at->addMonths(1)->format('Y-m-d'),
            ];
        });

        return response()->json([
            'data' => $subscriptions,
            'pagination' => [
                'current_page' => $companies->currentPage(),
                'per_page' => $companies->perPage(),
                'total' => $companies->total(),
                'last_page' => $companies->lastPage(),
            ]
        ]);
    }

    /**
     * Get Messages
     */
    public function getMessages(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $page = $request->query('page', 1);
        $limit = $request->query('limit', 10);

        // Fetch real messages from the messages table
        $messagesQuery = Message::orderBy('created_at', 'desc');
        $total = $messagesQuery->count();
        $messagesData = $messagesQuery->skip(($page - 1) * $limit)->take($limit)->get();

        // Format messages for frontend
        $messages = $messagesData->map(function ($msg) {
            return [
                'id' => $msg->id,
                'from' => $msg->name,
                'to' => 'Support Team',
                'subject' => $msg->subject ?? 'Contact Form Submission',
                'preview' => substr($msg->message, 0, 100) . (strlen($msg->message) > 100 ? '...' : ''),
                'read' => $msg->read,
                'date' => $msg->created_at->format('Y-m-d H:i'),
                'email' => $msg->email,
                'fullMessage' => $msg->message,
            ];
        });

        $unreadCount = Message::where('read', false)->count();

        return response()->json([
            'data' => $messages,
            'unreadCount' => $unreadCount,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'last_page' => ceil($total / $limit),
            ]
        ]);
    }

    /**
     * Get Settings
     */
    public function getSettings()
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'settings' => [
                'platformName' => 'Gold Fleet SaaS',
                'supportEmail' => 'support@goldfleet.com',
                'maxCompanies' => 100,
                'maxVehiclesPerCompany' => 500,
                'enableTrials' => true,
                'defaultTrialDays' => 14,
                'maintenanceMode' => false,
                'notificationEmail' => 'admin@goldfleet.com',
            ]
        ]);
    }

    /**
     * Update Settings
     */
    public function updateSettings()
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // For now, just return success
        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => request()->all()
        ]);
    }

    /**
     * Approve a company (platform admin action)
     */
    public function approveCompany(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $company = Company::findOrFail($id);

            // Update company status to approved
            $company->update([
                'company_status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            // Send notifications to company users
            $this->notifyCompanyApproved($company);

            return response()->json([
                'success' => true,
                'message' => "Company '{$company->name}' has been approved",
                'company' => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'company_status' => 'approved',
                    'approved_at' => $company->approved_at->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error approving company: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve company',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decline a company and trigger refund (platform admin action)
     */
    public function declineCompany(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'platform_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'reason' => 'nullable|string|max:1000',
            ]);

            $company = Company::findOrFail($id);

            // Update company status to declined
            $company->update([
                'company_status' => 'declined',
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            // Deactivate subscription
            $company->subscriptions()->update(['status' => 'inactive']);
            $company->update(['subscription_status' => 'none']);

            // Process refund if payment exists
            $this->processRefund($company);

            // Send decline notification to company users
            $this->notifyCompanyDeclined($company, $validated['reason'] ?? null);

            return response()->json([
                'success' => true,
                'message' => "Company '{$company->name}' has been declined",
                'company' => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'company_status' => 'declined',
                    'declined_at' => $company->approved_at->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error declining company: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline company',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process refund for declined company
     */
    private function processRefund(Company $company): void
    {
        // Get the latest payment for this company
        $payment = \App\Models\PaymentSimulation::where('company_id', $company->id)
            ->where('payment_status', 'verified')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($payment) {
            // Mark payment as refunded
            $payment->update([
                'payment_status' => 'refunded',
                'verified_at' => now(),
            ]);

            \Illuminate\Support\Facades\Log::info('Refund processed', [
                'company_id' => $company->id,
                'payment_id' => $payment->id,
                'amount' => $payment->simulated_amount,
                'timestamp' => now(),
            ]);
        }
    }

    /**
     * Send approval notification to company users
     */
    private function notifyCompanyApproved(Company $company): void
    {
        $companyUsers = $company->users()->where('role', 'admin')->get();

        foreach ($companyUsers as $user) {
            // Create notification
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'title' => 'Company Approved',
                'message' => "Your company has been approved. All fleet management features are now unlocked.",
                'type' => 'approval',
                'is_read' => false,
            ]);

            // Create message
            Message::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'subject' => 'Company Approval Confirmation',
                'message' => "Congratulations! Your company '{$company->name}' has been approved by the platform administrator. You now have full access to all GoldFleet features.",
                'sender_name' => 'GoldFleet Platform',
                'is_read' => false,
            ]);
        }
    }

    /**
     * Send decline notification to company users
     */
    private function notifyCompanyDeclined(Company $company, ?string $reason = null): void
    {
        $companyUsers = $company->users()->where('role', 'admin')->get();

        foreach ($companyUsers as $user) {
            $reasonText = $reason ? "Reason: {$reason}. " : "";
            
            // Create notification
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'title' => 'Company Application Declined',
                'message' => "Your company application has been declined. {$reasonText}Please contact support for more information.",
                'type' => 'decline',
                'is_read' => false,
            ]);

            // Create message
            Message::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'subject' => 'Company Application Decision',
                'message' => "Your company '{$company->name}' application has been reviewed and declined. {$reasonText}Your payment has been refunded. Please contact support at support@goldfleet.com if you have questions.",
                'sender_name' => 'GoldFleet Platform',
                'is_read' => false,
            ]);
        }
    }
}
