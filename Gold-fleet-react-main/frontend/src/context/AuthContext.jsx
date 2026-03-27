import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth from sessionStorage - validate token with backend
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        const savedToken = sessionStorage.getItem('auth_token')
        console.log('[Auth] App initialized. Checking sessionStorage for token...')
        console.log('[Auth] Token exists:', !!savedToken)
        
        // If no token exists, user is unauthenticated
        if (!savedToken) {
          console.log('[Auth] ✓ No token - user must login')
          setToken(null)
          setUser(null)
          setCompany(null)
          setLoading(false)
          setIsInitialized(true)
          return
        }

        // Token exists in sessionStorage, validate it with backend
        console.log('[Auth] Token found in sessionStorage. Validating with API...')
        await validateToken(savedToken)
      } catch (error) {
        console.error('[Auth] ✗ Initialization error:', error.message)
        sessionStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
        setCompany(null)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  const validateToken = async (authToken) => {
    try {
      console.log('[Auth] Validating token with backend at http://localhost:8000/api/user...')
      const response = await fetch('http://localhost:8000/api/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      console.log('[Auth] Validation response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Auth] ✓ Token is valid! User data:', data)
        setUser(data.user || data)
        setCompany(data.company || null)
        setToken(authToken)
      } else {
        // Token is invalid, clear it
        console.log('[Auth] ✗ Token validation failed with status', response.status)
        const errorText = await response.text().catch(() => '')
        console.log('[Auth] Response:', errorText)
        sessionStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
        setCompany(null)
      }
    } catch (error) {
      console.error('[Auth] ✗ Token validation error:', error.message)
      sessionStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setCompany(null)
    }
  }

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user || data)
        setCompany(data.company || null)
        setToken(authToken)
      } else {
        // Token is invalid, clear it
        sessionStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
        setCompany(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      sessionStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error('Backend returned non-JSON response:', response.status)
        throw new Error('Server error: ' + response.statusText)
      }

      // If driver login fails with 403 (permission denied), try company admin login
      if (response.status === 403) {
        console.log('[Auth] Driver login denied (403). Attempting company admin login...')
        return await loginAsCompanyAdmin(email, password)
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Only set token if we have valid data
      if (data.token) {
        setToken(data.token)
        setUser(data.user || null)
        setCompany(data.company || null)
        sessionStorage.setItem('auth_token', data.token)
      } else {
        throw new Error('No token received from server')
      }

      return data
    } catch (error) {
      // Ensure failed login doesn't leave any auth state
      setToken(null)
      setUser(null)
      setCompany(null)
      sessionStorage.removeItem('auth_token')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginAsCompanyAdmin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/company-admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error('Backend returned non-JSON response:', response.status)
        throw new Error('Server error: ' + response.statusText)
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Only set token if we have valid data
      if (data.token) {
        setToken(data.token)
        setUser(data.user || null)
        setCompany(data.company || null)
        sessionStorage.setItem('auth_token', data.token)
      } else {
        throw new Error('No token received from server')
      }

      return data
    } catch (error) {
      // Ensure failed login doesn't leave any auth state
      setToken(null)
      setUser(null)
      setCompany(null)
      sessionStorage.removeItem('auth_token')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (formData) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error('Backend returned non-JSON response:', response.status)
        throw new Error('Server error: ' + response.statusText)
      }

      if (!response.ok) {
        // Handle validation errors
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join(' | ')
          throw new Error(errorMessages)
        }
        throw new Error(data.message || 'Signup failed')
      }

      // Store token temporarily for subscription setup during signup flow.
      // The token will be cleared on login page before user authenticates.
      if (data.token) {
        setToken(data.token)
        setUser(data.user || null)
        setCompany(data.company || null)
        sessionStorage.setItem('auth_token', data.token)
      }

      return data
    } catch (error) {
      // Ensure failed signup doesn't leave any auth state
      setToken(null)
      setUser(null)
      setCompany(null)
      sessionStorage.removeItem('auth_token')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch('http://localhost:8000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear auth state regardless of logout API success
      setToken(null)
      setUser(null)
      setCompany(null)
      sessionStorage.removeItem('auth_token')
    }
  }

  /**
   * Refresh user and company data from the API.
   * This is useful after approval/rejection to get the latest status.
   */
  const refreshAuth = async () => {
    try {
      const currentToken = token || sessionStorage.getItem('auth_token')
      if (!currentToken) {
        console.warn('[Auth] No token available for refresh')
        return false
      }

      console.log('[Auth] Refreshing auth state with API...')
      const response = await fetch('http://localhost:8000/api/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Auth] ✓ Auth refreshed successfully! New company status:', data.company?.company_status)
        setUser(data.user || data)
        setCompany(data.company || null)
        return true
      } else {
        console.warn('[Auth] ⚠ Auth refresh failed with status', response.status)
        return false
      }
    } catch (error) {
      console.error('[Auth] ✗ Auth refresh error:', error.message)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, company, token, loading, login, signup, logout, refreshAuth, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
