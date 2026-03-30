import React, { useEffect, useState, useCallback } from 'react';
import { FaCreditCard, FaSpinner, FaSearch, FaSync, FaCheckCircle, FaBan, FaPause, FaPlayCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import platformApi from '../services/platformApi';

/**
 * Platform Subscriptions - Admin Management
 * View and manage all company subscriptions with payment simulations
 */
export default function PlatformSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // view details state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    subscriptionId: null,
    actionType: ''
  });
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);


  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await platformApi.getAllSubscriptionsWithSimulations(page, 10);
      setSubscriptions(data.data || []);
    } catch (err) {
      setError(err.message);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const fetchSubscriptionDetails = async (subscriptionId) => {
    setDetailLoading(true);
    try {
      const data = await platformApi.getSubscriptionWithSimulations(subscriptionId);
      setSubscriptionDetails(data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = (subscriptionId) => {
    setSelectedSubscription(subscriptionId);
    fetchSubscriptionDetails(subscriptionId);
  };


  const handleActivate = async (subscriptionId) => {
    setActionLoading(subscriptionId);
    setError('');
    setSuccess('');
    try {
      await platformApi.activateSubscription(subscriptionId);
      setSuccess('✓ Subscription activated successfully!');
      await fetchSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`✗ Activation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate Subscription',
      message: 'Are you sure you want to deactivate this subscription? This will cancel the subscription permanently.',
      action: async () => {
        setActionLoading(subscriptionId);
        setError('');
        setSuccess('');
        try {
          await platformApi.deactivateSubscription(subscriptionId);
          setSuccess('✓ Subscription deactivated successfully!');
          await fetchSubscriptions();
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(`✗ Deactivation failed: ${err.message}`);
        } finally {
          setActionLoading(null);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
      subscriptionId,
      actionType: 'deactivate'
    });
  };

  const handleSuspend = (subscriptionId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Suspend Subscription',
      message: 'Are you sure you want to suspend this subscription? The company will be temporarily disabled.',
      action: async () => {
        setActionLoading(subscriptionId);
        setError('');
        setSuccess('');
        try {
          await platformApi.suspendSubscription(subscriptionId);
          setSuccess('✓ Subscription suspended successfully!');
          await fetchSubscriptions();
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(`✗ Suspension failed: ${err.message}`);
        } finally {
          setActionLoading(null);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
      subscriptionId,
      actionType: 'suspend'
    });
  };

  const handleResume = async (subscriptionId) => {
    setActionLoading(subscriptionId);
    setError('');
    setSuccess('');
    try {
      await platformApi.resumeSubscription(subscriptionId);
      setSuccess('✓ Subscription resumed successfully!');
      await fetchSubscriptions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`✗ Resume failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSubscriptions = subscriptions.filter((item) => {
    const sub = item.subscription;
    const company = sub.company;
    const plan = item.plan_details; // use plan_details consistently
    
    return (
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan && plan.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sub.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalRevenue = () => {
    return subscriptions
      .filter(item => item.subscription.status === 'active')
      .reduce((sum, item) => sum + (item.plan_details.price * 12), 0);
  };

  const getActiveCount = () => {
    return subscriptions.filter(item => item.subscription.status === 'active').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4">
      <div className="w-full px-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FaCreditCard className="text-white" />
              Subscription Management
            </h1>
            <p className="text-yellow-50 mt-2">Manage and monitor all company subscriptions</p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 hover:shadow-md active:scale-95 transition-all duration-200"
          >
            <FaSync className="text-sm" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm animate-pulse">
            {success}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-500 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Annual Revenue (Active)</p>
                <p className="text-3xl font-bold text-gray-900">${getTotalRevenue().toLocaleString()}</p>
              </div>
              <div className="text-yellow-600 text-3xl">💰</div>
            </div>
            <p className="text-xs text-gray-600 mt-3 font-medium">From active subscriptions</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-500 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{getActiveCount()}</p>
              </div>
              <div className="text-yellow-600 text-3xl">✓</div>
            </div>
            <p className="text-xs text-gray-600 mt-3 font-medium">Running plans</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-500 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{subscriptions.length}</p>
              </div>
              <div className="text-yellow-600 text-3xl">🏢</div>
            </div>
            <p className="text-xs text-gray-600 mt-3 font-medium">With subscriptions</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600 text-lg" />
          <input
            type="text"
            placeholder="Search by company or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-yellow-500 rounded-lg text-gray-900 placeholder-gray-500 font-medium focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
          />
        </div>

        {/* Subscriptions Table */}
        <div className="hidden lg:block bg-white rounded-lg border-2 border-yellow-500 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-yellow-50 border-b-2 border-yellow-500">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plan</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Monthly Price</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trial</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((item) => {
                  const sub = item.subscription;
                  const plan = item.plan_details;
                  const isInTrial = sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
                  
                  return (
                    <tr key={sub.id} className="border-b border-yellow-200 hover:bg-yellow-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">{sub.company.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {plan.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">${plan.price}/mo</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {isInTrial ? (
                          <span className="text-gray-700 font-medium">Active</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 flex items-center justify-center gap-2 flex-wrap">
                        {sub.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleSuspend(sub.id)}
                              disabled={actionLoading === sub.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold rounded-md text-xs border border-yellow-300 hover:border-yellow-400 disabled:opacity-50 active:scale-95 transition-all duration-200"
                              title="Suspend subscription"
                            >
                              <FaPause className="w-3 h-3" /> Suspend
                            </button>
                            <button
                              onClick={() => handleDeactivate(sub.id)}
                              disabled={actionLoading === sub.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-md text-xs border border-red-300 hover:border-red-400 disabled:opacity-50 active:scale-95 transition-all duration-200"
                              title="Deactivate subscription"
                            >
                              <FaBan className="w-3 h-3" /> Deactivate
                            </button>
                          </>
                        )}
                        {sub.status === 'suspended' && (
                          <button
                            onClick={() => handleResume(sub.id)}
                            disabled={actionLoading === sub.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-md text-xs border border-green-300 hover:border-green-400 disabled:opacity-50 active:scale-95 transition-all duration-200"
                            title="Resume subscription"
                          >
                            <FaPlayCircle className="w-3 h-3" /> Resume
                          </button>
                        )}
                        {(sub.status === 'cancelled' || sub.status === 'expired') && (
                          <button
                            onClick={() => handleActivate(sub.id)}
                            disabled={actionLoading === sub.id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-md text-xs disabled:opacity-50 active:scale-95 transition-all duration-200"
                            title="Activate subscription"
                          >
                            <FaCheckCircle className="w-3 h-3" /> Activate
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(sub.id)}
                          className="text-yellow-600 hover:text-yellow-700 transition-colors"
                          title="View subscription"
                        >
                          <FaInfoCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {filteredSubscriptions.map((item) => {
            const sub = item.subscription;
            const plan = item.plan_details;
            const isInTrial = sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
            
            return (
              <div key={sub.id} className="bg-white rounded-lg border-2 border-yellow-500 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.company.name}</h3>
                    <p className="text-sm text-gray-600">Plan: {plan.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sub.status)}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 py-3 border-t border-yellow-200">
                  <div>
                    <p className="text-xs text-gray-600">Price</p>
                    <p className="font-semibold text-gray-900">${plan.price}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Trial</p>
                    <p className={`font-semibold ${isInTrial ? 'text-gray-700' : 'text-gray-500'}`}>
                      {isInTrial ? 'Active' : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {sub.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleSuspend(sub.id)}
                        className="flex-1 py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium rounded text-sm transition"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeactivate(sub.id)}
                        className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded text-sm transition"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                  {sub.status === 'suspended' && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      className="flex-1 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded text-sm transition"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(sub.id)}
                    className="flex-1 py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium rounded text-sm transition"
                  >
                    <FaInfoCircle className="inline mr-1" /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg p-4 border-2 border-yellow-500">
          <p className="text-gray-600">
            Showing {filteredSubscriptions.length} subscriptions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg disabled:opacity-50 hover:bg-yellow-200 transition-colors font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
            >
              Next
            </button>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && subscriptionDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-yellow-600 text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{subscriptionDetails.subscription.company.name}</h2>
                  <p className="text-gray-300 text-sm mt-1">Plan: {subscriptionDetails.plan_details.name}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-300 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 text-center">
                  <FaSpinner className="animate-spin mx-auto text-4xl text-gray-700 mb-4" />
                  <p className="text-gray-600">Loading details...</p>
                </div>
              ) : (
                <div className="p-6 space-y-8">
                  {/* Subscription Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Subscription Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscriptionDetails.subscription.status)}`}>
                            {subscriptionDetails.subscription.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Started</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(subscriptionDetails.subscription.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        {subscriptionDetails.subscription.trial_ends_at && (
                          <div>
                            <p className="text-xs text-gray-600">Trial Ends</p>
                            <p className={`font-semibold ${new Date(subscriptionDetails.subscription.trial_ends_at) > new Date() ? 'text-gray-700' : 'text-gray-900'}`}>
                              {new Date(subscriptionDetails.subscription.trial_ends_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {subscriptionDetails.subscription.expires_at && (
                          <div>
                            <p className="text-xs text-gray-600">Expires</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(subscriptionDetails.subscription.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Details */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Plan Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">Plan Name</p>
                          <p className="font-semibold text-gray-900">{subscriptionDetails.plan_details.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Monthly Price</p>
                          <p className="font-semibold text-gray-900">${subscriptionDetails.plan_details.price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Trial Days</p>
                          <p className="font-semibold text-gray-900">{subscriptionDetails.plan_details.trial_days} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Limits</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Vehicles: {subscriptionDetails.plan_details.max_vehicles || 'Unlimited'}</li>
                            <li>• Drivers: {subscriptionDetails.plan_details.max_drivers || 'Unlimited'}</li>
                            <li>• Users: {subscriptionDetails.plan_details.max_users || 'Unlimited'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Simulations */}
                  {subscriptionDetails.simulations && subscriptionDetails.simulations.length > 0 && (
                    <div className="border-t pt-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Simulations</h3>
                      <div className="space-y-3">
                        {subscriptionDetails.simulations.map((sim) => (
                          <div key={sim.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">${sim.simulated_amount}</p>
                                <p className="text-sm text-gray-600">
                                  Vehicles: {sim.simulated_vehicles}, Drivers: {sim.simulated_drivers}, Users: {sim.simulated_users}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Method: {sim.payment_method} | Date: {new Date(sim.payment_date).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                sim.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                sim.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}> 
                                      {sim.payment_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              <div className="bg-yellow-50 border-b border-yellow-200 p-6 flex items-center gap-4">
                <FaExclamationTriangle className="text-yellow-600 text-2xl flex-shrink-0" />
                <h2 className="text-lg font-bold text-gray-900">{confirmModal.title}</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-6">{confirmModal.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmModal.action}
                    disabled={actionLoading !== null}
                    className={`flex-1 px-4 py-2 font-medium rounded-lg text-white transition ${
                      confirmModal.actionType === 'deactivate'
                        ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                        : 'bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


