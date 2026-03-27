import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import api from '../services/api'

const DriverSignup = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1) // 1: Company Code, 2: Details
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Step 1: Company Code
  const [companyCode, setCompanyCode] = useState('')

  // Step 2: Registration Details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    license_number: '',
    license_expiry: '',
  })

  const handleCompanyCodeSubmit = async (e) => {
    e.preventDefault()
    if (!companyCode.trim()) {
      setError('Please enter a company code')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Validate company code by attempting to use it in driver register
      // For now, we just proceed to the form
      setStep(2)
    } catch (err) {
      setError('Failed to validate company code')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/driver-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          company_code: companyCode,
          phone: formData.phone || null,
          license_number: formData.license_number || null,
          license_expiry: formData.license_expiry || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      setSuccess('Registration successful! Redirecting to login page...')
      
      // Redirect to login page - user must log in with their credentials
      // Clear any temporary token that may have been created
      setTimeout(() => {
        sessionStorage.removeItem('auth_token')
        navigate('/auth', { replace: true })
      }, 1500)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Header sidebarOpen={false} setSidebarOpen={() => {}} />
      <div className="w-full bg-gradient-to-br from-yellow-50 to-amber-50 p-4 pt-32 pb-16 flex flex-col items-center justify-start min-h-screen">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Driver Registration</h1>
          <p className="text-gray-600 mb-6">Join your fleet and start tracking movements</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          {/* Step 1: Company Code */}
          {step === 1 && (
            <form onSubmit={handleCompanyCodeSubmit}>
              <div className="mb-6">
                <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyCode"
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Enter your company's code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-2">Ask your fleet manager for your company code</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Registration Details */}
          {step === 2 && (
            <form onSubmit={handleFormSubmit}>
              {/* Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password_confirmation"
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleFormChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Phone (Optional) */}
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* License Number (Optional) */}
              <div className="mb-4">
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  id="license_number"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleFormChange}
                  placeholder="DL12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* License Expiry (Optional) */}
              <div className="mb-6">
                <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 mb-2">
                  License Expiry Date
                </label>
                <input
                  id="license_expiry"
                  type="date"
                  name="license_expiry"
                  value={formData.license_expiry}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverSignup
