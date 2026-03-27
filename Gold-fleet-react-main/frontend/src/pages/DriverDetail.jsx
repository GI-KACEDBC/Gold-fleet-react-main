import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupLink, setSetupLink] = useState(null);
  const [showSetupLink, setShowSetupLink] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    loadDriver();
  }, [id]);

  const loadDriver = async () => {
    try {
      const data = await api.getDriver(id);
      setDriver(data.data || data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load driver: ' + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.deleteDriver(id);
        navigate('/drivers');
      } catch (err) {
        setError('Failed to delete driver: ' + err.message);
      }
    }
  };

  const handleRegenerateSetupLink = async () => {
    setLinkLoading(true);
    try {
      const response = await api.regenerateDriverSetupLink(id);
      setSetupLink(response.setup_link);
      setShowSetupLink(true);
    } catch (err) {
      setError('Failed to regenerate setup link: ' + err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(setupLink);
    alert('Setup link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Driver not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{driver.user?.name || driver.name}</h1>
          <p className="mt-2 text-gray-600">{driver.user?.email || driver.email}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/drivers')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={handleRegenerateSetupLink}
            disabled={linkLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            title="Generate a new password setup link for this driver"
          >
            {linkLoading ? 'Generating...' : 'Get Setup Link'}
          </button>
          <Link
            to={`/drivers/${id}/edit`}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-center"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {showSetupLink && setupLink && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Link for Password Configuration</h3>
              <p className="text-sm text-blue-800 mb-3">Share this link with the driver so they can set up their password:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white rounded-lg px-4 py-3 border border-blue-300 overflow-x-auto">
                  <code className="text-sm text-gray-900 font-mono break-all">{setupLink}</code>
                </div>
                <button
                  onClick={copyLinkToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSetupLink(false)}
              className="text-blue-600 hover:text-blue-900 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
            <div className="relative w-full" style={{ paddingTop: '100%' }}>
              {driver.image_url ? (
                <img
                  src={driver.image_url}
                  alt={driver.user?.name || driver.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center">
                    <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mt-2 text-sm">No photo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
              driver.status === 'active'
                ? 'bg-green-100 text-green-800'
                : driver.status === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {driver.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Active'}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-lg text-gray-900 mt-1">{driver.user?.name || driver.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg text-gray-900 mt-1">{driver.user?.email || driver.email || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-lg text-gray-900 mt-1">{driver.user?.phone || driver.phone || 'N/A'}</p>
            </div>
          </div>

          {/* License Info Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">License Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">License Number</p>
                <p className="text-lg text-gray-900 mt-1 font-mono">{driver.license_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">License Expiry</p>
                <p className="text-lg text-gray-900 mt-1">{driver.license_expiry || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
