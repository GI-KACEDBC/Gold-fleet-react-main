/**
 * Platform Owner API Service
 * Handles all /api/platform/* calls exclusively
 * Stores token in platformToken (NOT authToken)
 */

const API_BASE_URL = 'http://localhost:8000/api/platform';

const platformApi = {
  /**
   * Platform Login - exchange credentials for platformToken
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    // Store platform token separately from main auth
    if (data.token) {
      sessionStorage.setItem('platformToken', data.token);
    }
    return data;
  },

  /**
   * Platform Signup - register new platform admin with company info
   */
  signup: async (formData) => {
    console.log('Sending signup request with formData:', formData);
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('Signup error response status:', response.status);
        console.error('Signup error details:', error);
        // Handle validation errors
        if (error.errors) {
          const errorMessages = Object.values(error.errors)
            .flat()
            .join(', ');
          throw new Error(errorMessages || 'Validation failed');
        }
        throw new Error(error.message || 'Signup failed');
      } catch (err) {
        console.error('Error parsing response:', err);
        throw new Error(err.message || 'Server error occurred');
      }
    }

    const data = await response.json();
    console.log('Signup successful:', data);
    // Store platform token after successful signup
    if (data.token) {
      sessionStorage.setItem('platformToken', data.token);
    }
    return data;
  },

  /**
   * Get Authorization Header with platformToken
   */
  getAuthHeader: () => {
    const token = sessionStorage.getItem('platformToken');
    return {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`,
    };
  },

  /**
   * Dashboard Stats
   */
  getDashboardStats: async () => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch dashboard stats (${response.status})`);
    }
    return response.json();
  },

  /**
   * Companies
   */
  getCompaniesCount: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/count`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch companies count');
    return response.json();
  },

  getCompanies: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/companies?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch companies');
    return response.json();
  },

  deleteCompany: async (companyId) => {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
      method: 'DELETE',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete company');
    }
    return response.json();
  },

  /**
   * Vehicles
   */
  getVehiclesCount: async () => {
    const response = await fetch(`${API_BASE_URL}/vehicles/count`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch vehicles count');
    return response.json();
  },

  /**
   * Trips
   */
  getTripsToday: async () => {
    const response = await fetch(`${API_BASE_URL}/trips/today`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch trips today');
    return response.json();
  },

  /**
   * Subscriptions
   */
  getActiveSubscriptions: async () => {
    const response = await fetch(`${API_BASE_URL}/subscriptions/active`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  getSubscriptions: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/subscriptions?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  /**
   * Analytics - Company Growth
   */
  getCompanyGrowth: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/company-growth`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch company growth');
    return response.json();
  },

  /**
   * Analytics - Trips Per Company
   */
  getTripsPerCompany: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/trips-per-company`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch trips per company');
    return response.json();
  },

  /**
   * Analytics - Vehicle Usage
   */
  getVehicleUsage: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/vehicle-usage`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch vehicle usage');
    return response.json();
  },

  /**
   * Analytics - Subscription Revenue
   */
  getSubscriptionRevenue: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/subscription-revenue`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscription revenue');
    return response.json();
  },

  /**
   * Messages - Complete messaging system
   */
  getMessages: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/messages?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  getMessage: async (messageId) => {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch message');
    return response.json();
  },

  sendMessage: async (companyId, subject, message, toUserId = null) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        ...platformApi.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        company_id: companyId, 
        subject, 
        message,
        to_user_id: toUserId 
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }
    return response.json();
  },

  replyToMessage: async (messageId, message) => {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reply`, {
      method: 'POST',
      headers: {
        ...platformApi.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to send reply');
    return response.json();
  },

  markMessageAsRead: async (messageId) => {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to mark message as read');
    return response.json();
  },

  getCompaniesList: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const url = `${API_BASE_URL}/companies-list${query}`;
    console.log('Fetching companies from:', url);
    const response = await fetch(url, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Company list fetch error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorData.message || `Failed to fetch companies list (${response.status})`);
    }
    return response.json();
  },

  getCompanyAdmins: async (companyId) => {
    const response = await fetch(`${API_BASE_URL}/company/${companyId}/admins`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch company admins');
    return response.json();
  },

  /**
   * Settings
   */
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        ...platformApi.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  /**
   * Subscription Management (Platform Admin)
   */
  getSubscriptionManagement: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  getSubscriptionWithSimulations: async (subscriptionId) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/subscription-management/${subscriptionId}/with-simulations`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch subscription details (${response.status})`);
    }
    return response.json();
  },

  getAllSubscriptionsWithSimulations: async (page = 1, limit = 10) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }
    
    const response = await fetch(`${API_BASE_URL}/subscription-management/with-simulations?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch subscriptions (${response.status})`);
    }
    return response.json();
  },

  getSubscriptionsByStatus: async (status, page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management/status/${status}?page=${page}&limit=${limit}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to fetch ${status} subscriptions`);
    return response.json();
  },

  activateSubscription: async (subscriptionId) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management/${subscriptionId}/activate`, {
      method: 'POST',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to activate subscription (${response.status})`);
    }
    return response.json();
  },

  deactivateSubscription: async (subscriptionId) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management/${subscriptionId}/deactivate`, {
      method: 'POST',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to deactivate subscription (${response.status})`);
    }
    return response.json();
  },

  suspendSubscription: async (subscriptionId) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management/${subscriptionId}/suspend`, {
      method: 'POST',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to suspend subscription (${response.status})`);
    }
    return response.json();
  },

  resumeSubscription: async (subscriptionId) => {
    const response = await fetch(`${API_BASE_URL}/subscription-management/${subscriptionId}/resume`, {
      method: 'POST',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to resume subscription (${response.status})`);
    }
    return response.json();
  },

  // ===== Payment Management Methods =====

  /**
   * Get all payments with pagination and filtering
   */
  getAllPayments: async (page = 1, limit = 50, filters = {}) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    let url = `${API_BASE_URL}/payments?page=${page}&per_page=${limit}`;
    
    // Add filters to URL
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.company_id) url += `&company_id=${filters.company_id}`;
    if (filters.from_date) url += `&from_date=${filters.from_date}`;
    if (filters.to_date) url += `&to_date=${filters.to_date}`;

    const response = await fetch(url, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch payments (${response.status})`);
    }
    return response.json();
  },

  /**
   * Get single payment details
   */
  getPaymentDetails: async (paymentId) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch payment details (${response.status})`);
    }
    return response.json();
  },

  /**
   * Verify a payment
   */
  verifyPayment: async (paymentId) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to verify payment (${response.status})`);
    }
    return response.json();
  },

  /**
   * Get platform revenue statistics
   */
  getRevenueStats: async () => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/payments-stats/revenue`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch revenue stats (${response.status})`);
    }
    return response.json();
  },

  /**
   * Get company payment statistics
   */
  getCompanyPaymentStats: async (companyId) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/payments-stats/company/${companyId}`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch company stats (${response.status})`);
    }
    return response.json();
  },

  /**
   * Get all companies payment summary
   */
  getCompaniesSummary: async () => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/payments-stats/companies-summary`, {
      headers: platformApi.getAuthHeader(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      throw new Error(`Failed to fetch companies summary (${response.status})`);
    }
    return response.json();
  },

  // ===== Company Management Actions =====

  /**
   * Approve a company
   */
  approveCompany: async (companyId) => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/approve`, {
      method: 'POST',
      headers: {
        ...platformApi.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to approve company (${response.status})`);
    }
    return response.json();
  },

  /**
   * Decline a company and trigger refund
   */
  declineCompany: async (companyId, reason = '') => {
    const token = sessionStorage.getItem('platformToken');
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/decline`, {
      method: 'POST',
      headers: {
        ...platformApi.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please login again.');
      }
      const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(error.message || `Failed to decline company (${response.status})`);
    }
    return response.json();
  },
};

export default platformApi;
