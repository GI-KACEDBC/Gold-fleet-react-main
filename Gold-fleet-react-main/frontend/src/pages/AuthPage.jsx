import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFormValidation } from '../hooks/useFormValidation'
import Header from '../components/Header'
import PlanSelection from '../components/PlanSelection'
import PaymentSimulation from '../components/PaymentSimulation'
import api from '../services/api'

const AuthPage = () => {
  const navigate = useNavigate()
  const { login, signup, token, isInitialized, loading: authLoading, user, refreshAuth } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [signupStep, setSignupStep] = useState(1) // 1: Plan Selection, 2: Form, 3: Payment Simulation
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscriptionId, setSubscriptionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false) // Prevent redirect during signup
  const [paymentSimulations, setPaymentSimulations] = useState([]) // Track payment simulations

  // Login validation
  const loginForm = useFormValidation(
    { email: '', password: '' },
    {
      email: {
        required: 'Email is required',
        email: 'Please enter a valid email address',
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
      },
    }
  )

  // Signup validation
  const signupForm = useFormValidation(
    {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      company_name: '',
      company_email: '',
      company_phone: '',
      company_address: '',
    },
    {
      name: {
        required: 'Full name is required',
        minLength: 'Name must be at least 2 characters',
      },
      email: {
        required: 'Email is required',
        email: 'Please enter a valid email address',
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        patternMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      },
      password_confirmation: {
        required: 'Please confirm your password',
        confirmPassword: 'password', // This will check against the password field
      },
      company_name: {
        required: 'Company name is required',
        minLength: 'Company name must be at least 2 characters',
      },
      company_email: {
        required: 'Company email is required',
        email: 'Please enter a valid company email address',
      },
      company_phone: {
        phone: true, // Custom phone validation
      },
    }
  )

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && token && !skipAutoRedirect && !isSignup) {
      const redirectPath = user?.role === 'driver' ? '/driver' : '/main'
      navigate(redirectPath, { replace: true })
    }
  }, [token, isInitialized, authLoading, navigate, user, skipAutoRedirect, isSignup])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.isValid) {
      loginForm.setAllTouched()
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await login(loginForm.values.email, loginForm.values.password)
      
      // If login returns email_verified: false, show appropriate message
      if (!result.user?.email_verified) {
        setError('Please verify your email before logging in. Check your email for the verification link.')
        return
      }
      
      const redirectPath = result.user?.role === 'driver' ? '/driver' : '/main'
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan) => {
    console.log('🎯 Plan selected:', plan)
    setSelectedPlan(plan)
    setSignupStep(2) // Move to form step
    setSkipAutoRedirect(true) // Prevent auto-redirect during signup flow
  }

  const handleBackToPlans = () => {
    setSignupStep(1)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!signupForm.isValid) {
      signupForm.setAllTouched()
      return
    }

    if (!selectedPlan) {
      setError('Please select a plan')
      return
    }

    setError('')
    setLoading(true)

    try {
      const signupData = {
        name: signupForm.values.name,
        email: signupForm.values.email,
        password: signupForm.values.password,
        password_confirmation: signupForm.values.password_confirmation,
        company_name: signupForm.values.company_name,
        company_email: signupForm.values.company_email,
        company_phone: signupForm.values.company_phone || undefined,
        company_address: signupForm.values.company_address || undefined,
      }

      console.log('📤 Submitting signup data:', signupData)
      const result = await signup(signupData)
      console.log('✅ Signup successful:', result)
      
      // Create subscription for the selected plan
      if (result.company) {
        try {
          console.log('📋 Creating subscription with plan:', { 
            company_id: result.company.id, 
            plan_id: selectedPlan?.id,
            plan_name: selectedPlan?.name,
            selectedPlan: selectedPlan
          })
          const subscriptionResponse = await api.createSubscription({
            company_id: result.company.id,
            plan_id: parseInt(selectedPlan.id, 10), // Ensure plan_id is an integer
          })
          console.log('✅ Subscription created:', subscriptionResponse)
          setSubscriptionId(subscriptionResponse.subscription.id)
          
          // CRITICAL: Refresh company status from backend
          // When subscription is created, backend sets company_status to 'pending_approval'
          // We need to fetch this fresh status so it's available when redirecting to dashboard
          try {
            const refreshSuccess = await refreshAuth();
            if (refreshSuccess) {
              console.log('[AuthPage] ✓ Company status refreshed after subscription creation');
            }
          } catch (refreshErr) {
            console.warn('[AuthPage] Warning: Could not refresh auth after subscription:', refreshErr);
            // Don't fail the signup, just warn
          }
          
          setSignupStep(3) // Move to payment simulation step
        } catch (subErr) {
          console.warn('❌ Subscription creation failed:', subErr.message, subErr.data)
          
          // Rollback signup - delete user and company if subscription fails
          if (result.user?.id && result.company?.id) {
            try {
              console.log('🔄 Rolling back signup due to subscription failure...')
              const token = sessionStorage.getItem('auth_token')
              const response = await fetch('http://localhost:8000/api/cancel-signup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  user_id: result.user.id,
                  company_id: result.company.id
                })
              })
              const rollbackResult = await response.json()
              console.log('✅ Signup rolled back successfully:', rollbackResult)
            } catch (rollbackErr) {
              console.error('⚠️ Failed to rollback signup:', rollbackErr)
              // Continue even if rollback fails - still need to show error to user
            }
          }
          
          // Display debug info if available
          let debugInfo = ''
          if (subErr.data?.debug) {
            console.log('🔍 Debug Info:', subErr.data.debug)
            const debug = subErr.data.debug
            if (debug.plans_in_database && debug.plans_in_database.length > 0) {
              debugInfo = ` Available plans in DB: ${debug.plans_in_database.map(p => `${p.name}(ID:${p.id})`).join(', ')}`
            }
          }
          
          // Reset signup state on error
          setIsSignup(false)
          setSignupStep(1)
          setSelectedPlan(null)
          
          setError(`Subscription setup failed: ${subErr.message}${debugInfo}. Please try again.`)
        }
      }
    } catch (err) {
      // Handle detailed validation errors from backend
      let errorMessage = err.message
      console.error('❌ Signup error:', { 
        message: err.message, 
        data: err.data,
        fullError: err 
      })
      if (err.message && err.message.includes(':')) {
        // Error from backend with field:message format
        errorMessage = err.message
      } else if (err.data?.errors) {
        const errors = Object.entries(err.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join(' | ')
        errorMessage = errors
        console.error('Validation errors:', errors)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSignup = () => {
    setIsSignup(true)
    setSignupStep(1)
    setError('')
  }

  return (
    <div className="w-full">
      <Header sidebarOpen={false} setSidebarOpen={() => {}} />
      <div className="w-full bg-gradient-to-br from-yellow-50 to-amber-50 p-4 pt-32 pb-16 flex flex-col items-center justify-start min-h-screen">
        {/* Signup with Plan Selection - Full Width */}
        {isSignup && signupStep === 1 && (
          <div className="w-full max-w-5xl">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Create Your Account</h2>
                <button
                  onClick={() => {
                    setIsSignup(false)
                    setSignupStep(1)
                    setSelectedPlan(null)
                    setError('')
                    setSkipAutoRedirect(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  error.includes('✓')
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {error}
                </div>
              )}

              {/* Plan Selection */}
              <PlanSelection selectedPlan={selectedPlan} onSelectPlan={handleSelectPlan} />

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 gap-4">
                <button
                  onClick={() => {
                    setIsSignup(false)
                    setSignupStep(1)
                    setSelectedPlan(null)
                    setError('')
                    setSkipAutoRedirect(false)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
                  disabled={!selectedPlan}
                  className="px-8 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signup with Form - Split into 2 Blocks */}
        {isSignup && signupStep === 2 && (
          <div className="w-full max-w-6xl">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                  <p className="text-amber-500 mt-1">
                    {selectedPlan && selectedPlan.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsSignup(false)
                    setSignupStep(1)
                    setSelectedPlan(null)
                    setError('')
                    setSkipAutoRedirect(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  error.includes('✓')
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {error}
                </div>
              )}

              {/* Two-Column Form */}
              <form onSubmit={handleSignup} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Block - User Information */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-yellow-400 rounded"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Account</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={signupForm.values.name}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="John Doe"
                        required
                      />
                      {signupForm.errors.name && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={signupForm.values.email}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="you@example.com"
                        required
                      />
                      {signupForm.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={signupForm.values.password}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.password
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="••••••••"
                        required
                      />
                      {signupForm.errors.password && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="password"
                        name="password_confirmation"
                        value={signupForm.values.password_confirmation}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.password_confirmation
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="••••••••"
                        required
                      />
                      {signupForm.errors.password_confirmation && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.password_confirmation}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Block - Company Information */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-yellow-400 rounded"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={signupForm.values.company_name}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.company_name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="ABC Transport Inc."
                        required
                      />
                      {signupForm.errors.company_name && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.company_name}</p>
                      )}
                    </div>

                    {/* Company Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Email
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="company_email"
                        value={signupForm.values.company_email}
                        onChange={signupForm.handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          signupForm.errors.company_email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-yellow-500'
                        }`}
                        placeholder="company@example.com"
                        required
                      />
                      {signupForm.errors.company_email && (
                        <p className="mt-1 text-sm text-red-600">{signupForm.errors.company_email}</p>
                      )}
                    </div>

                    {/* Company Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Phone
                      </label>
                      <input
                        type="tel"
                        name="company_phone"
                        value={signupForm.values.company_phone}
                        onChange={signupForm.handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    {/* Company Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Address
                      </label>
                      <input
                        type="text"
                        name="company_address"
                        value={signupForm.values.company_address}
                        onChange={signupForm.handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 border-t pt-6">
                <button
                  type="button"
                  onClick={handleBackToPlans}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Back to Plans
                </button>
                <button
                  onClick={handleSignup}
                  disabled={loading || !signupForm.isValid || !selectedPlan}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signup Step 3 - Payment Simulation */}
        {isSignup && signupStep === 3 && subscriptionId && (
          <div className="w-full max-w-5xl">
            <div className="bg-gray-900 rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Setup Payment Simulation</h2>
                  <p className="text-amber-500 mt-1">
                    {selectedPlan?.price === 0 ? 'Free Trial (12 days)' : 'Paid Plan - Simulate Your Usage'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Complete signup and navigate
                    setIsSignup(false)
                    setSignupStep(1)
                    setSelectedPlan(null)
                    setSubscriptionId(null)
                    loginForm.resetForm()
                    signupForm.resetForm()
                    setError('✓ Account created successfully! Please check your email for verification.')
                    setSkipAutoRedirect(false)
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  error.includes('✓')
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {error}
                </div>
              )}

              {/* Requirement Message */}
              {(!paymentSimulations || paymentSimulations.length === 0) && (
                <div className="mb-6 p-4 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800">
                  <p className="font-semibold">⚠️ Required Step</p>
                  <p className="text-sm mt-1">You must create at least one payment simulation before completing your account setup. This helps us understand your usage patterns.</p>
                </div>
              )}

              {/* Payment Simulation Component */}
              <PaymentSimulation 
                selectedPlan={selectedPlan}
                subscriptionId={subscriptionId}
                onPaymentProcessed={() => {
                  setError('✓ Payment simulation setup complete! Your account is ready to use.')
                }}
                onSimulationsUpdate={(simulations) => setPaymentSimulations(simulations)}
              />

              {/* Success Message - Show when payment simulations created */}
              {paymentSimulations && paymentSimulations.length > 0 && (
                <div className="mt-6 p-4 rounded-lg border border-green-300 bg-green-50 text-green-800">
                  <p className="font-semibold">✓ Requirement Completed</p>
                  <p className="text-sm mt-1">You have created {paymentSimulations.length} payment simulation{paymentSimulations.length !== 1 ? 's' : ''}. You can now complete the setup.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 border-t border-gray-700 pt-6 mt-8">
                <button
                  type="button"
                  onClick={() => setSignupStep(2)}
                  className="px-6 py-3 border border-amber-500 text-amber-500 rounded-lg font-medium hover:bg-amber-500 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    // Validate that at least one payment simulation exists
                    if (!paymentSimulations || paymentSimulations.length === 0) {
                      setError('Please create at least one payment simulation before completing setup')
                      return
                    }
                    
                    // Show success message first
                    setError('✓ Account created successfully! Redirecting to dashboard...')
                    
                    // Complete signup - DON'T set skipAutoRedirect to false yet
                    setIsSignup(false)
                    setSignupStep(1)
                    setSelectedPlan(null)
                    setSubscriptionId(null)
                    setPaymentSimulations([])
                    loginForm.resetForm()
                    signupForm.resetForm()
                    
                    // Delay navigation so user sees the success message
                    setTimeout(() => {
                      const redirectPath = user?.role === 'driver' ? '/driver' : '/main'
                      navigate(redirectPath, { replace: true })
                    }, 1500)
                  }}
                  disabled={!paymentSimulations || paymentSimulations.length === 0}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                    paymentSimulations && paymentSimulations.length > 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white cursor-pointer'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Default Login View */}
        {!isSignup && (
          <div className="bg-white rounded-xl shadow-md flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
            {/* Left Section - Login Form */}
            <div className="md:w-1/2 p-8">
              <h2 className="text-2xl font-bold mb-6">Sign in to Gold Fleet</h2>
              
              {/* Error/Success Message */}
              {error && (
                <div className={`mb-4 p-3 rounded border ${
                  error.includes('✓') || error.includes('Account created')
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={loginForm.values.email}
                    onChange={loginForm.handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      loginForm.errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-600'
                    }`}
                    placeholder="you@example.com"
                    required
                  />
                  {loginForm.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginForm.errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={loginForm.values.password}
                    onChange={loginForm.handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      loginForm.errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-yellow-600'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  {loginForm.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginForm.errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-yellow-600" />
                    <span className="ml-2 text-sm text-gray-600">Keep me logged in</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-yellow-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading || !loginForm.isValid}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              
              {/* Sign up / Login Toggle */}
              <div className="text-center mt-4">
                <button
                  onClick={handleStartSignup}
                  className="text-sm text-yellow-600 hover:underline"
                >
                  Don't have an account? Sign up
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-2 text-gray-500 text-sm">OR</span>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>

              {/* Social Login Buttons */}
              <button className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition-colors mb-3">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Login with Google
              </button>

              <button className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="mr-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path>
                </svg>
                Login with SMS
              </button>
            </div>

            {/* Right Section - Info Panel (Hidden on Mobile) */}
            <div className="hidden md:flex md:w-1/2 p-8 bg-gray-50 flex-col justify-center">
              <h3 className="text-xl font-semibold mb-4">What's New</h3>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>• Feature A launched</li>
                <li>• Scheduled maintenance tomorrow</li>
                <li>• New notification system</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">System Updates</h3>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>• Version 1.2 deployed</li>
                <li>• API improvements</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">Fleet Notifications</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• New alert: vehicle #42</li>
                <li>• Tire pressure low on vehicle #7</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage
