const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
};

const apiCall = async (url, options = {}) => {
  const headers = { ...getAuthHeaders(), ...options.headers };
  
  // Only add Content-Type if not FormData (FormData sets its own boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    // Try to parse JSON response for better error messages
    let responseData = null;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
    
    if (!response.ok) {
      // Use error from response if available
      let errorMessage = responseData?.error || responseData?.message || response.statusText;
      
      // If validation errors exist, format them
      if (responseData?.errors) {
        const errors = Object.values(responseData.errors).flat();
        errorMessage = errors.join(', ');
      }
      
      console.error(`API error [${response.status}]:`, errorMessage);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = responseData;
      throw error;
    }
    
    if (response.status === 204) {
      return { success: true };
    }
    
    return responseData || { success: true };
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error:', error.message);
      throw new Error('Network error - Backend may be unavailable. Make sure Laravel server is running on http://localhost:8000');
    }
    throw error;
  }
};

export const api = {
  // Vehicles
  getVehicles: () => apiCall(`${API_BASE_URL}/vehicles`),
  getVehicle: (id) => apiCall(`${API_BASE_URL}/vehicles/${id}`),
  createVehicle: (data) => apiCall(`${API_BASE_URL}/vehicles`, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  updateVehicle: (id, data) => apiCall(`${API_BASE_URL}/vehicles/${id}`, { 
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  deleteVehicle: (id) => apiCall(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE' }),

  // Drivers
  getDrivers: () => apiCall(`${API_BASE_URL}/drivers`),
  getDriver: (id) => apiCall(`${API_BASE_URL}/drivers/${id}`),
  createDriver: (data) => apiCall(`${API_BASE_URL}/drivers`, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  updateDriver: (id, data) => apiCall(`${API_BASE_URL}/drivers/${id}`, { 
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  deleteDriver: (id) => apiCall(`${API_BASE_URL}/drivers/${id}`, { method: 'DELETE' }),

  // Trips
  getTrips: () => apiCall(`${API_BASE_URL}/trips`),
  getTrip: (id) => apiCall(`${API_BASE_URL}/trips/${id}`),
  createTrip: (data) => apiCall(`${API_BASE_URL}/trips`, { method: 'POST', body: JSON.stringify(data) }),
  updateTrip: (id, data) => apiCall(`${API_BASE_URL}/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrip: (id) => apiCall(`${API_BASE_URL}/trips/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => apiCall(`${API_BASE_URL}/services`),
  getService: (id) => apiCall(`${API_BASE_URL}/services/${id}`),
  createService: (data) => apiCall(`${API_BASE_URL}/services`, { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => apiCall(`${API_BASE_URL}/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => apiCall(`${API_BASE_URL}/services/${id}`, { method: 'DELETE' }),

  // Inspections
  getInspections: () => apiCall(`${API_BASE_URL}/inspections`),
  getInspection: (id) => apiCall(`${API_BASE_URL}/inspections/${id}`),
  createInspection: (data) => apiCall(`${API_BASE_URL}/inspections`, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  updateInspection: (id, data) => apiCall(`${API_BASE_URL}/inspections/${id}`, { 
    method: 'PUT', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  deleteInspection: (id) => apiCall(`${API_BASE_URL}/inspections/${id}`, { method: 'DELETE' }),

  // Driver Maintenance Checklist
  submitMaintenanceChecklist: (data) => apiCall(`${API_BASE_URL}/inspections/submit-checklist`, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  getPendingInspectionReviews: () => apiCall(`${API_BASE_URL}/inspections/pending-reviews`),
  reviewInspection: (id, data) => apiCall(`${API_BASE_URL}/inspections/${id}/review`, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),

  // Issues
  getIssues: () => apiCall(`${API_BASE_URL}/issues`),
  getIssue: (id) => apiCall(`${API_BASE_URL}/issues/${id}`),
  createIssue: (data) => apiCall(`${API_BASE_URL}/issues`, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  updateIssue: (id, data) => apiCall(`${API_BASE_URL}/issues/${id}`, { 
    method: 'PUT', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  deleteIssue: (id) => apiCall(`${API_BASE_URL}/issues/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => apiCall(`${API_BASE_URL}/expenses`),
  getExpense: (id) => apiCall(`${API_BASE_URL}/expenses/${id}`),
  createExpense: (data) => apiCall(`${API_BASE_URL}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => apiCall(`${API_BASE_URL}/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => apiCall(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' }),

  // Fuel Fillups
  getFuelFillups: () => apiCall(`${API_BASE_URL}/fuel-fillups`),
  getFuelFillup: (id) => apiCall(`${API_BASE_URL}/fuel-fillups/${id}`),
  createFuelFillup: (data) => apiCall(`${API_BASE_URL}/fuel-fillups`, { method: 'POST', body: JSON.stringify(data) }),
  updateFuelFillup: (id, data) => apiCall(`${API_BASE_URL}/fuel-fillups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFuelFillup: (id) => apiCall(`${API_BASE_URL}/fuel-fillups/${id}`, { method: 'DELETE' }),

  // Reminders
  getReminders: () => apiCall(`${API_BASE_URL}/reminders`),
  getReminder: (id) => apiCall(`${API_BASE_URL}/reminders/${id}`),
  createReminder: (data) => apiCall(`${API_BASE_URL}/reminders`, { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => apiCall(`${API_BASE_URL}/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => apiCall(`${API_BASE_URL}/reminders/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => apiCall(`${API_BASE_URL}/dashboard`),
  getVehicleLocations: () => apiCall(`${API_BASE_URL}/vehicle-locations`),
  getChartData: () => apiCall(`${API_BASE_URL}/dashboard/info/chart-data`),
  getPlatformStatus: () => apiCall(`${API_BASE_URL}/platform/status`),

  // Chart Data Endpoints
  getChartRepairPriorityClass: () => apiCall(`${API_BASE_URL}/charts/repair-priority-class`),
  getChartTimeToResolve: () => apiCall(`${API_BASE_URL}/charts/time-to-resolve`),
  getChartFuelCosts: () => apiCall(`${API_BASE_URL}/charts/fuel-costs`),
  getChartServiceCosts: () => apiCall(`${API_BASE_URL}/charts/service-costs`),

  // Phone Tracker
  updateTrackerLocation: (data) => apiCall(`${API_BASE_URL}/tracker/update-location`, { method: 'POST', body: JSON.stringify(data) }),
  getLastTrackerLocation: (vehicleId) => apiCall(`${API_BASE_URL}/tracker/last-location/${vehicleId}`),
  simulateTrackerUpdate: (vehicleId) => apiCall(`${API_BASE_URL}/tracker/simulate/${vehicleId}`, { method: 'POST' }),

  // Vehicle Simulation
  startSimulation: (interval = 5) => apiCall(`${API_BASE_URL}/simulation/start`, { method: 'POST', body: JSON.stringify({ interval }) }),
  stopSimulation: () => apiCall(`${API_BASE_URL}/simulation/stop`, { method: 'POST' }),
  getSimulationStatus: () => apiCall(`${API_BASE_URL}/simulation/status`),
  updateSimulation: () => apiCall(`${API_BASE_URL}/simulation/update`, { method: 'POST' }),

  // Vehicle Location
  sendVehicleLocation: (data) => apiCall(`${API_BASE_URL}/vehicle-location`, { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => apiCall(`${API_BASE_URL}/notifications`),
  markNotificationAsRead: (id) => apiCall(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => apiCall(`${API_BASE_URL}/notifications/mark-all-read`, { method: 'PATCH' }),

  // Profile
  getProfile: () => apiCall(`${API_BASE_URL}/profile`),
  updateProfile: (data) => apiCall(`${API_BASE_URL}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProfile: () => apiCall(`${API_BASE_URL}/profile`, { method: 'DELETE' }),

  // Plans
  getPlans: () => apiCall(`${API_BASE_URL}/plans`),
  getPlan: (id) => apiCall(`${API_BASE_URL}/plans/${id}`),
  createPlan: (data) => apiCall(`${API_BASE_URL}/plans`, { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id, data) => apiCall(`${API_BASE_URL}/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id) => apiCall(`${API_BASE_URL}/plans/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: () => apiCall(`${API_BASE_URL}/subscriptions`),
  getSubscription: (id) => apiCall(`${API_BASE_URL}/subscriptions/${id}`),
  createSubscription: (data) => apiCall(`${API_BASE_URL}/subscriptions`, { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id, data) => apiCall(`${API_BASE_URL}/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id) => apiCall(`${API_BASE_URL}/subscriptions/${id}`, { method: 'DELETE' }),
  getCurrentSubscription: () => apiCall(`${API_BASE_URL}/subscriptions/current`),

  // Payment Simulations
  getPaymentSimulations: () => apiCall(`${API_BASE_URL}/payment-simulations`),
  getPaymentSimulation: (id) => apiCall(`${API_BASE_URL}/payment-simulations/${id}`),
  createPaymentSimulation: (data) => apiCall(`${API_BASE_URL}/payment-simulations`, { method: 'POST', body: JSON.stringify(data) }),
  updatePaymentSimulation: (id, data) => apiCall(`${API_BASE_URL}/payment-simulations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePaymentSimulation: (id) => apiCall(`${API_BASE_URL}/payment-simulations/${id}`, { method: 'DELETE' }),
  getPaymentSimulationsBySubscription: (subscriptionId) => apiCall(`${API_BASE_URL}/payment-simulations/subscription/${subscriptionId}`),
  processPaymentSimulation: (id, data) => apiCall(`${API_BASE_URL}/payment-simulations/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),

  // Messages
  getMessages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/messages?${query}` : `${API_BASE_URL}/messages`;
    return apiCall(url);
  },
  getMessage: (id) => apiCall(`${API_BASE_URL}/messages/${id}`),
  sendMessage: (data) => apiCall(`${API_BASE_URL}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  replyToMessage: (id, data) => apiCall(`${API_BASE_URL}/messages/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  markMessageAsRead: (id) => apiCall(`${API_BASE_URL}/messages/${id}/read`, { method: 'PATCH' }),
  deleteMessage: (id) => apiCall(`${API_BASE_URL}/messages/${id}`, { method: 'DELETE' }),

  // Geocoding (location services - no auth needed)
  geocode: (location) => apiCall(`${API_BASE_URL}/geocode`, { method: 'POST', body: JSON.stringify({ location }) }),
  reverseGeocode: (lat, lon) => apiCall(`${API_BASE_URL}/reverse-geocode`, { method: 'POST', body: JSON.stringify({ lat, lon }) }),
};

export default api;
