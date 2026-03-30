import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaDollarSign, FaMapMarkerAlt, FaPhone, FaEnvelope, FaLock } from 'react-icons/fa';
import platformApi from '../services/platformApi';

/**
 * Platform Signup Page
 * Admin registration with company information
 * Collects comprehensive company CRUD data
 */
export default function PlatformSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for platform admin registration (fullname, email, phone, password)
  const [formData, setFormData] = useState({
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirmation: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.admin_name.trim()) return 'Full name is required';
    if (!formData.admin_email.trim()) return 'Email is required';
    if (!formData.admin_phone.trim()) return 'Phone is required';
    if (!formData.admin_password) return 'Password is required';
    if (formData.admin_password.length < 8) return 'Password must be 8+ characters';
    if (formData.admin_password !== formData.admin_password_confirmation) return 'Passwords don\'t match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await platformApi.signup(formData);
      setSuccess('✓ Registration successful! Redirecting to login...');

      // Redirect to login after brief delay so user can sign in with credentials
      setTimeout(() => {
        navigate('/platform/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-4 py-12 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Background image as an <img> for better control */}
      <img
        src="/images/maxresdefault-3490897627.jpg"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 0.95 }}
      />

      {/* Light overlay to slightly dim when needed */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none z-0"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full flex flex-col items-center min-h-screen">
        {/* Header Section */}
        <div className="text-center mb-4 md:mb-6 pt-2 md:pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-100 border-2 border-yellow-600 mb-2">
            <span className="text-lg md:text-xl font-bold text-yellow-600">GF</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Gold Fleet</h1>
          <p className="text-xs md:text-sm text-slate-300">Owner Registration</p>
        </div>

        {/* Signup Form Card Container */}
        <div className="w-full max-w-2xl mb-8 md:mb-12">
          {/* Form Card */}
          <div 
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-yellow-600 rounded-xl shadow-2xl p-6 md:p-8"
            style={{
              maxHeight: 'auto',
            }}
          >
            {/* Success Message */}
            {success && (
              <div className="mb-3 p-3 bg-gray-700/10 border border-gray-400/30 rounded-lg text-gray-400 text-sm animate-pulse">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-3 bg-gray-700/10 border border-gray-400/30 rounded-lg text-gray-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Owner Registration Form - Simplified */}
            <div className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Full Name <span className="text-gray-400">*</span>
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Email <span className="text-gray-400">*</span>
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Phone <span className="text-gray-400">*</span>
                </label>
                <input
                  type="tel"
                  name="admin_phone"
                  value={formData.admin_phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Password - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                    Password <span className="text-gray-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                    Confirm <span className="text-gray-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="admin_password_confirmation"
                    value={formData.admin_password_confirmation}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign InLink */}
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-xs">
              Have an account?{' '}
              <Link to="/platform/login" className="text-gray-400 hover:text-gray-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Quick Note */}
          <div className="mt-4 p-3 bg-gray-700/10 border border-gray-400/20 rounded-lg">
            <p className="text-xs text-gray-300">
              ✓ Instant access • ✓ Secure data • ✓ Update details in admin panel
            </p>
          </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="w-full text-center mt-6 md:mt-8 pb-6 md:pb-8">
          <p className="text-slate-400 text-xs font-light">
            Gold Fleet Platform © 2026
          </p>
        </div>
      </div>
    </div>
  );
}

