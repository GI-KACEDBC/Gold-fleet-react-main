import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function DriverSetup() {
  const { setupToken } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    console.log('DriverSetup mounted with token:', setupToken);
    if (!setupToken) {
      setError('Invalid setup link. No token provided.');
      setTokenValid(false);
    }
  }, [setupToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.password || !formData.password_confirmation) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Try using api service first, fall back to fetch
      let response;
      try {
        const result = await api.post('/api/driver-activate', {
          setup_token: setupToken,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        });
        response = result;
      } catch (apiErr) {
        // Fall back to direct fetch
        const fetchResponse = await fetch('http://localhost:8000/api/driver-activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setup_token: setupToken,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
          }),
        });

        if (!fetchResponse.ok) {
          const data = await fetchResponse.json();
          throw new Error(data.message || `Activation failed: ${fetchResponse.status}`);
        }

        response = await fetchResponse.json();
      }

      if (response && response.user) {
        setSuccess(true);
        
        // Store token in sessionStorage with correct key for consistency with AuthContext
        if (response.token) {
          sessionStorage.setItem('auth_token', response.token);
          
          // Redirect to driver dashboard after short delay
          setTimeout(() => {
            navigate('/driver-dashboard');
          }, 2000);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error during activation:', err);
      setError(err.message || 'Activation failed. Please try again.');
      setLoading(false);
    }
  };

  // Error state - show clear message
  if (!tokenValid && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Setup Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h2>
          <p className="text-gray-600 mb-6">Your account has been successfully activated. You can now log in with your credentials.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-900">Gold Fleet</h1>
          <p className="text-gray-600 mt-2">Complete Your Driver Account Setup</p>
          {setupToken && (
            <p className="text-xs text-gray-400 mt-2 break-all">Token: {setupToken.substring(0, 10)}...</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !setupToken}
            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
              loading || !setupToken
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? 'Setting Up...' : 'Activate Account'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          After activation, you'll be redirected to your driver dashboard.
        </p>
      </div>
    </div>
  );
}
