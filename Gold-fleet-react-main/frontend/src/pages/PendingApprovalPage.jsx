import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle, FaLock, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * PendingApprovalPage Component
 * 
 * Shown when a user tries to access fleet management features 
 * but their company is pending approval.
 * 
 * Features:
 * - Auto-refresh every 5 seconds to detect approval changes
 * - Manual refresh button so users can check immediately
 * - Clear status display showing what's required  * - Timeline of the approval process
 */
export default function PendingApprovalPage() {
  const { company, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const success = await refreshAuth();
      setLastCheckTime(new Date());
      
      // Check if company is now approved and redirect
      if (success && company?.company_status === 'approved') {
        console.log('[PendingApprovalPage] Company approved! Redirecting to dashboard...');
        navigate('/main', { replace: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshAuth, company?.company_status, navigate]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshAuth();
      setLastCheckTime(new Date());
      if (success) {
        console.log('[PendingApprovalPage] Status check complete');
        
        // Check if company is now approved and redirect
        // Give a brief moment for state to update
        setTimeout(() => {
          // Note: We'll check the updated company status in the effect below
          console.log('[PendingApprovalPage] Verifying approval status...');
        }, 100);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Watch for company status changes and redirect if approved
  useEffect(() => {
    if (company?.company_status === 'approved') {
      console.log('[PendingApprovalPage] ✓ Company is now approved! Redirecting to dashboard...');
      navigate('/main', { replace: true });
    }
  }, [company?.company_status, navigate]);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.clear();
    navigate('/logout', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg border border-yellow-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-12 text-center">
            <FaClock className="text-white text-5xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Under Review</h1>
            <p className="text-yellow-100 mt-2">Your company account is pending approval</p>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            {/* Status Summary */}
            <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto mb-2">
                    <FaCheckCircle />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Account Status</p>
                  <p className="text-lg font-bold text-green-600 mt-1">Verified</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto mb-2">
                    <FaCheckCircle />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Subscription</p>
                  <p className="text-lg font-bold text-green-600 mt-1">Active</p>
                </div>

                <div className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${
                    company?.company_status === 'approved' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {company?.company_status === 'approved' ? <FaCheckCircle /> : <FaClock />}
                  </div>
                  <p className="text-sm font-medium text-gray-600">Company Status</p>
                  <p className={`text-lg font-bold mt-1 ${
                    company?.company_status === 'approved' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {company?.company_status === 'approved' ? 'Approved' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Refresh Section */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-3">
                {lastCheckTime ? (
                  <>Last checked: {lastCheckTime.toLocaleTimeString()}</>
                ) : (
                  <>Checking for approval status automatically every 5 seconds...</>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Checking...' : 'Check Status Now'}
                </button>
                <button
                  onClick={() => navigate('/main')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">What Happens Next</h3>
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600 font-bold">
                      ✓
                    </div>
                    <div className="absolute top-10 left-5 w-0.5 h-12 bg-gray-300"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Account Verified</h4>
                    <p className="text-sm text-gray-600 mt-1">Your account and billing information have been secured.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 font-bold">
                      2
                    </div>
                    <div className="absolute top-10 left-5 w-0.5 h-12 bg-gray-300"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Under Review</h4>
                    <p className="text-sm text-gray-600 mt-1">Our team is reviewing your company information. <strong>With automated approval, this happens instantly when your payment is processed.</strong></p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-500 font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Approval Granted</h4>
                    <p className="text-sm text-gray-600 mt-1">Once approved, you'll get full access to all fleet management features.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">Messages & Communication</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">Notifications</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">Profile Management</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-700">Billing & Subscriptions</span>
                </div>
              </div>

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Restricted Until Approval</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3">
                  <FaLock className="text-gray-400 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-600">Vehicles & Drivers</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaLock className="text-gray-400 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-600">Tracking & Mapping</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaLock className="text-gray-400 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-600">Reports & Analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <FaLock className="text-gray-400 flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-600">Fleet Management Tools</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Company Information</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Company:</strong> {company?.name}</p>
                <p className="mt-1"><strong>Administrator:</strong> {user?.name}</p>
                <p className="mt-2 text-blue-700">For questions about the approval process, please contact support@goldfleet.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
