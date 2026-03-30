import React, { useEffect, useState, useCallback } from 'react';
import { FaBuilding, FaSpinner, FaPlus, FaSearch, FaChevronRight, FaSync, FaTrash, FaEye, FaExclamationTriangle, FaArrowRight, FaCheckCircle, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import platformApi from '../services/platformApi';

/**
 * Platform Companies
 * List all tenant companies in the SaaS with light theme
 */
export default function PlatformCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await platformApi.getCompanies(page, 10);
      setCompanies(data.data || data.companies || []);
    } catch (err) {
      setError(err.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCompanies();
    
    // Auto-refresh companies every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchCompanies();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchCompanies]);

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
  };

  const handleApproveCompany = async (company = null) => {
    const targetCompany = company || selectedCompany;
    if (!targetCompany) return;

    setActioning(true);
    try {
      const result = await platformApi.approveCompany(targetCompany.id);
      setSuccessMessage(result.message || `Company '${targetCompany.name}' has been approved`);
      setSelectedCompany(null);
      
      // Refresh the list
      setTimeout(() => {
        fetchCompanies();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActioning(false);
    }
  };

  const handleDeclineCompanyInitiate = (company) => {
    setSelectedCompany(company);
    setShowDeclineModal(true);
  };

  const handleDeclineCompany = async () => {
    if (!selectedCompany) return;

    setActioning(true);
    try {
      const result = await platformApi.declineCompany(selectedCompany.id, declineReason);
      setSuccessMessage(result.message || `Company '${selectedCompany.name}' has been declined`);
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedCompany(null);
      
      // Refresh the list
      setTimeout(() => {
        fetchCompanies();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
      setShowDeclineModal(false);
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    setDeleting(true);
    try {
      const result = await platformApi.deleteCompany(selectedCompany.id);
      setSuccessMessage(result.message || `Company '${selectedCompany.name}' deleted successfully`);
      setShowDeleteConfirm(false);
      setSelectedCompany(null);
      
      // Refresh the list
      setTimeout(() => {
        fetchCompanies();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending approval':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'none':
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'none':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4">
      <div className="w-full px-2 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-lg text-green-700" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !successMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-lg text-red-700" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600 text-lg" />
        <input
          type="text"
          placeholder="Search companies by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-yellow-500 rounded-lg text-gray-900 placeholder-gray-500 font-medium focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
        />
      </div>

        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FaBuilding className="text-white" />
              Tenant Companies
            </h1>
            <p className="text-yellow-50 mt-2">Manage all companies on your platform ({companies.length} total)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCompanies}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 hover:shadow-md active:scale-95 transition-all duration-200"
              title="Refresh the list"
            >
              <FaSync className="text-sm" />
              Refresh
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-3 bg-white text-yellow-600 font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200">
              <FaPlus className="text-sm" /> Add Company
            </button>
          </div>
        </div>

      {/* Responsive Grid for Mobile, Table for Desktop */}
      <div className="space-y-4 lg:space-y-0">
        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg border-2 border-yellow-500 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-600">{company.email}</p>
                  <p className="text-sm text-blue-600 font-medium">{company.admin_email || company.user_email || 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(company.status)}`}>
                  {company.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-yellow-200">
                <div>
                  <p className="text-xs text-gray-600">Co. Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(company.company_status)}`}>
                    {company.company_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Subscription</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSubscriptionColor(company.subscription_status)}`}>
                    {company.subscription_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Payment</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getPaymentColor(company.payment_status)}`}>
                    {company.payment_status}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-yellow-200 flex-wrap">
                {/* Approve Button */}
                <button 
                  onClick={() => handleApproveCompany(company)}
                  disabled={actioning || (company.company_status === 'approved' || company.company_status === 'declined')}
                  className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border transition-all duration-200 text-xs font-semibold flex-shrink-0 ${
                    company.company_status === 'approved' || company.company_status === 'declined'
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:shadow-md active:scale-95'
                  }`}
                  title="Approve Company"
                >
                  {actioning ? <FaSpinner className="animate-spin text-lg" /> : <FaCheck className="text-lg" />}
                </button>

                {/* Decline Button */}
                <button 
                  onClick={() => handleDeclineCompanyInitiate(company)}
                  disabled={company.company_status === 'declined' || company.company_status === 'approved'}
                  className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border transition-all duration-200 text-xs font-semibold flex-shrink-0 ${
                    company.company_status === 'declined' || company.company_status === 'approved'
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 hover:shadow-md active:scale-95'
                  }`}
                  title="Decline Company"
                >
                  <FaTimes className="text-lg" />
                </button>

                {/* View Button */}
                <button 
                  onClick={() => handleViewCompany(company)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:shadow-md active:scale-95 transition-all duration-200 text-xs font-semibold flex-shrink-0"
                  title="View Details"
                >
                  <FaEye className="text-lg" />
                </button>

                {/* Delete Button */}
                <button 
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowDeleteConfirm(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md active:scale-95 transition-all duration-200 text-xs font-semibold flex-shrink-0"
                  title="Delete Company"
                >
                  <FaTrash className="text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg border-2 border-yellow-500 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-yellow-50 border-b-2 border-yellow-500">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Admin Email</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Subscription</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Plan</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Vehicles</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Drivers</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-yellow-200 hover:bg-yellow-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">{company.name}</td>
                      <td className="px-6 py-4 text-gray-600">{company.email}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">{company.admin_email || company.user_email || 'N/A'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(company.company_status)}`}>
                          {company.company_status ? company.company_status.replace('_', ' ') : 'registered'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSubscriptionColor(company.subscription_status)}`}>
                          {company.subscription_status ? company.subscription_status.charAt(0).toUpperCase() + company.subscription_status.slice(1) : 'none'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(company.payment_status)}`}>
                          {company.payment_status ? company.payment_status.charAt(0).toUpperCase() + company.payment_status.slice(1) : 'none'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (company.plan && company.plan !== 'N/A' && company.plan !== 'None')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {company.plan || company.subscription_plan || company.plan_name || 'No Plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{company.vehicles || 0}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{company.drivers || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-start gap-1.5 flex-nowrap min-w-0">
                          {/* Approve Button */}
                          <button 
                            onClick={() => handleApproveCompany(company)}
                            disabled={actioning || (company.company_status === 'approved' || company.company_status === 'declined')}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-all duration-200 flex-shrink-0 ${
                              company.company_status === 'approved' || company.company_status === 'declined'
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:shadow-md active:scale-95'
                            }`}
                            title="Approve Company"
                          >
                            {actioning ? <FaSpinner className="animate-spin text-sm" /> : <FaCheck className="text-sm" />}
                          </button>

                          {/* Decline Button */}
                          <button 
                            onClick={() => handleDeclineCompanyInitiate(company)}
                            disabled={company.company_status === 'declined' || company.company_status === 'approved'}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-all duration-200 flex-shrink-0 ${
                              company.company_status === 'declined' || company.company_status === 'approved'
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 hover:shadow-md active:scale-95'
                            }`}
                            title="Decline Company"
                          >
                            <FaTimes className="text-sm" />
                          </button>

                          {/* View Button */}
                          <button 
                            onClick={() => handleViewCompany(company)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:shadow-md active:scale-95 transition-all duration-200 flex-shrink-0"
                            title="View Details"
                          >
                            <FaEye className="text-sm" />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDeleteConfirm(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md active:scale-95 transition-all duration-200 flex-shrink-0"
                            title="Delete Company"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <p className="text-gray-600 font-medium">
          Showing {filteredCompanies.length} of {companies.length} companies
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg disabled:opacity-50 hover:bg-gray-200 active:scale-95 transition-all duration-200"
          >
            ← Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg hover:shadow-md active:scale-95 transition-all duration-200"
          >
            Next →
          </button>
        </div>
      </div>

      </div>

      {/* Modals */}
      <>
      {/* Company Details Modal */}
      {selectedCompany && !showDeleteConfirm && !showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h3>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Company Email</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCompany.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admin User Email</p>
                  <p className="text-lg font-semibold text-blue-700">{selectedCompany.admin_email || selectedCompany.user_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCompany.company_status)}`}>
                    {selectedCompany.company_status ? selectedCompany.company_status.replace('_', ' ') : 'registered'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subscription Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSubscriptionColor(selectedCompany.subscription_status)}`}>
                    {selectedCompany.subscription_status ? selectedCompany.subscription_status.charAt(0).toUpperCase() + selectedCompany.subscription_status.slice(1) : 'none'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPaymentColor(selectedCompany.payment_status)}`}>
                    {selectedCompany.payment_status ? selectedCompany.payment_status.charAt(0).toUpperCase() + selectedCompany.payment_status.slice(1) : 'none'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className={`text-lg font-semibold ${
                    (selectedCompany.plan && selectedCompany.plan !== 'N/A' && selectedCompany.plan !== 'None')
                      ? 'text-blue-700'
                      : 'text-gray-500'
                  }`}>
                    {selectedCompany.plan || selectedCompany.subscription_plan || selectedCompany.plan_name || 'No Active Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicles</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCompany.vehicles || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Drivers</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCompany.drivers || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Joined</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCompany.created_at || 'N/A'}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4 flex gap-3 flex-wrap">
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 hover:shadow-md active:scale-95 transition-all duration-200"
                >
                  Close
                </button>
                {selectedCompany.company_status !== 'approved' && selectedCompany.company_status !== 'declined' && (
                  <>
                    <button 
                      onClick={handleApproveCompany}
                      disabled={actioning}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {actioning ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      Approve
                    </button>
                    <button 
                      onClick={() => setShowDeclineModal(true)}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FaTimes /> Decline
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaTrash className="text-sm" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <FaExclamationTriangle className="text-3xl" />
                <h3 className="text-xl font-bold">Decline Company?</h3>
              </div>
              <p className="text-gray-600">
                Are you sure you want to decline <strong>{selectedCompany.name}</strong>? A refund will be processed automatically.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decline Reason (Optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Provide a reason for declining this company..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 hover:shadow-md active:scale-95 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeclineCompany}
                  disabled={actioning}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {actioning ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <FaTimes className="text-sm" /> Decline
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <FaExclamationTriangle className="text-3xl" />
                <h3 className="text-xl font-bold">Delete Company?</h3>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{selectedCompany.name}</strong>? This action is permanent and will delete:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
                <li>All company information</li>
                <li>All vehicles ({selectedCompany.vehicles || 0})</li>
                <li>All drivers ({selectedCompany.drivers || 0})</li>
                <li>All users and accounts</li>
                <li>All subscriptions and billing data</li>
                <li>All trips, services, inspections, and records</li>
              </ul>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedCompany(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 hover:shadow-md active:scale-95 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteCompany}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="text-sm" /> Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  );
}

