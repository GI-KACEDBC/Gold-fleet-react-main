import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FaPlay, FaStop, FaMapMarkerAlt, FaRoute, FaClock, FaCar, FaClipboardList, FaExclamationTriangle, FaBell, FaEnvelope, FaCheckCircle, FaChevronRight } from 'react-icons/fa';
import VehicleInspectionChecklist from '../components/VehicleInspectionChecklist';
import ManualIssueReport from '../components/ManualIssueReport';

// Utility function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Utility function to format duration
const formatDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
};

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom vehicle marker icon with better styling
const vehicleIcon = L.divIcon({
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
  className: 'vehicle-marker',
  html: `
    <div style="
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        border: 3px solid white;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6), inset 0 0 10px rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 16 16"
        style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
          <!-- Vehicle icon -->
          <path d="M8 1a1 1 0 0 1 1 1v4h4a1 1 0 0 1 .82 1.573l-4 6A1 1 0 0 1 8 14a1 1 0 0 1-.82-.427l-4-6A1 1 0 0 1 3 6h4V2a1 1 0 0 1 1-1z"/>
        </svg>
      </div>
      <!-- Pulsing outer ring -->
      <div style="
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 2px solid rgba(59, 130, 246, 0.4);
        animation: pulse 2s infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { 
          transform: scale(1);
          opacity: 1;
        }
        100% { 
          transform: scale(1.4);
          opacity: 0;
        }
      }
    </style>
  `
});

export default function DriverDashboard() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([5.6037, -0.1870]); // Default to Ghana
  const [tripDistance, setTripDistance] = useState(0);
  const [tripDuration, setTripDuration] = useState('0h 0m');
  const [showInspection, setShowInspection] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('trips'); // trips, overview, trip, maintenance
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mapRef = useRef(null);
  const [startLocationCoords, setStartLocationCoords] = useState(null);
  const [endLocationCoords, setEndLocationCoords] = useState(null);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on larger screens
  useEffect(() => {
    if (windowSize.width >= 1024) {
      setSidebarOpen(false);
    }
  }, [windowSize.width]);

  // Update trip duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTrip) {
        const duration = formatDuration(currentTrip.created_at, currentTrip.updated_at);
        setTripDuration(duration);
      }
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentTrip]);

  // Calculate initial trip duration
  useEffect(() => {
    if (currentTrip) {
      const duration = formatDuration(currentTrip.created_at, currentTrip.updated_at);
      setTripDuration(duration);
    }
  }, [currentTrip]);

  // Geocode location string to coordinates (Nominatim free API)
  const geocodeLocation = async (locationString) => {
    if (!locationString || locationString === 'Current Location' || locationString === 'TBD') {
      return null;
    }
    
    try {
      const response = await api.geocode(locationString);
      if (response.success && response.data && response.data.length > 0) {
        const firstResult = response.data[0];
        return [firstResult.lat, firstResult.lon];
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    
    return null;
  };

  // Load location coordinates when trip changes
  useEffect(() => {
    if (currentTrip) {
      const loadCoordinates = async () => {
        // Start location: if "Current Location", use current GPS
        if (currentTrip.start_location === 'Current Location' || !currentTrip.start_location) {
          setStartLocationCoords(currentLocation);
        } else {
          const coords = await geocodeLocation(currentTrip.start_location);
          setStartLocationCoords(coords || currentLocation);
        }
        
        // End location: geocode it
        const endCoords = await geocodeLocation(currentTrip.end_location);
        setEndLocationCoords(endCoords);
      };
      
      loadCoordinates();
    } else {
      setStartLocationCoords(null);
      setEndLocationCoords(null);
    }
  }, [currentTrip]);

  // Fetch driver data and assign trips
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        
        // Get all drivers and find the one for this user
        const driversResponse = await api.getDrivers();
        const drivers = driversResponse.data || driversResponse;
        // Find driver that matches current user
        const userDriver = Array.isArray(drivers) 
          ? drivers.find(d => d.user_id === user.id || d.id === user.driver_id) || drivers[0]
          : null;
        
        if (userDriver) {
          setDriverId(userDriver.id);
        }

        // Get all trips and find active ones for this driver
        const tripsResponse = await api.getTrips();
        const trips = tripsResponse.data || tripsResponse;
        
        // Filter to get today and future trips only (assigned trips inbox)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const assignedTripsList = Array.isArray(trips) 
          ? trips.filter(trip => {
              const tripDate = new Date(trip.date || trip.created_at);
              tripDate.setHours(0, 0, 0, 0);
              return tripDate >= today && trip.status !== 'completed';
            })
          : [];
        
        setAssignedTrips(assignedTripsList);
        
        // Set the first trip as active if available, otherwise the first incomplete one
        const activeTrip = assignedTripsList.find(trip => trip.status === 'active') || 
                          assignedTripsList.find(trip => trip.status === 'pending') ||
                          null;
        setCurrentTrip(activeTrip);

        // Fetch messages (notifications)
        fetchMessages();

      } catch (err) {
        console.error('Error fetching driver data:', err);
        setError('Failed to load driver data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDriverData();
    }
  }, [user]);

  // Fetch vehicle data from the current trip (not from driver's permanent vehicle)
  useEffect(() => {
    const fetchTripVehicle = async () => {
      if (currentTrip?.vehicle_id) {
        try {
          const vehicleResponse = await api.getVehicle(currentTrip.vehicle_id);
          const vehicleData = vehicleResponse.data || vehicleResponse;
          setVehicle(vehicleData);
        } catch (err) {
          console.error('Error fetching trip vehicle:', err);
          setVehicle(null);
        }
      } else {
        setVehicle(null);
      }
    };

    fetchTripVehicle();
  }, [currentTrip]);

  // Fetch messages/notifications
  const fetchMessages = async () => {
    try {
      // Simulated messages - in a real app, these would come from the API
      // For now, we'll create mock messages for demo purposes
      const mockMessages = [
        {
          id: 1,
          type: 'info',
          title: 'Maintenance Reminder',
          message: 'Your vehicle is due for oil change in 500 km',
          timestamp: new Date(Date.now() - 3600000),
          read: false
        },
        {
          id: 2,
          type: 'warning',
          title: 'Vehicle Alert',
          message: 'Please check tire pressure before next trip',
          timestamp: new Date(Date.now() - 7200000),
          read: false
        },
        {
          id: 3,
          type: 'success',
          title: 'Trip Completed',
          message: 'Your last trip was completed successfully',
          timestamp: new Date(Date.now() - 86400000),
          read: true
        }
      ];
      setMessages(mockMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mark message as read
  const markMessageAsRead = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  // Dismiss/remove message
  const dismissMessage = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  // Start GPS tracking
  const startGPSTracking = () => {
    if (!vehicle) return;

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          
          setCurrentLocation(newLocation);
          
          // Add waypoint to route
          setRouteWaypoints(prev => {
            const updated = [...prev, newLocation];
            return updated;
          });

          // Calculate distance if we have multiple waypoints
          if (routeWaypoints.length > 0) {
            const lastPoint = routeWaypoints[routeWaypoints.length - 1];
            const segmentDistance = calculateDistance(lastPoint[0], lastPoint[1], latitude, longitude);
            setTripDistance(prev => prev + segmentDistance);
          }
          
          try {
            await api.sendVehicleLocation({
              vehicle_id: vehicle.id,
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Error sending location:', err);
          }
        },
        (error) => {
          console.error('GPS error:', error);
          // If high accuracy times out, retry with lower accuracy
          if (error.code === 3) {
            console.log('GPS timeout - retrying with lower accuracy');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
      setWatchId(id);
      setRouteWaypoints([currentLocation]); // Initialize route with current position
    }
  };

  // Stop GPS tracking
  const stopGPSTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setRouteWaypoints([]);
      setTripDistance(0);
    }
  };

  // Center map on current location when tracking
  useEffect(() => {
    if (mapRef.current && currentLocation && activeTab === 'overview') {
      const map = mapRef.current._leaflet_map || mapRef.current;
      if (map) {
        // Smooth pan to current location
        map.panTo(currentLocation, { animate: true, duration: 0.5 });
      }
    }
  }, [currentLocation, activeTab]);

  // Format time to Y-m-d\TH:i format (remove seconds)
  const formatTimeForBackend = (timeString) => {
    if (!timeString) return '';
    // Handle both ISO format and datetime-local format
    if (timeString.includes('T')) {
      // Remove seconds if present
      return timeString.substring(0, 16); // YYYY-MM-DDTHH:MM
    }
    return timeString;
  };

  // Start trip
  const startTrip = async () => {
    if (!vehicle || !driverId || !currentTrip) return;
    
    try {
      // Get the current trip data to ensure all required fields are included
      const tripData = currentTrip;
      
      // Format times to match Laravel's expected format (Y-m-d\TH:i)
      const startTime = formatTimeForBackend(tripData.start_time);
      const endTime = formatTimeForBackend(tripData.end_time);
      
      // Update only the status while preserving other fields
      const updateData = {
        vehicle_id: tripData.vehicle_id,
        driver_id: tripData.driver_id,
        start_location: tripData.start_location,
        end_location: tripData.end_location,
        start_time: startTime,
        end_time: endTime || '',
        start_mileage: tripData.start_mileage || 0,
        end_mileage: tripData.end_mileage || '',
        distance: tripData.distance || '',
        trip_date: tripData.trip_date || new Date().toISOString().split('T')[0],
        status: 'in_progress',
      };
      
      await api.updateTrip(currentTrip.id, updateData);
      
      // Start GPS tracking first
      startGPSTracking();
      
      // Switch to map view to show the route
      setActiveTab('overview');
      
      // Refresh trip data
      const updatedTrip = await api.getTrip(currentTrip.id);
      setCurrentTrip(updatedTrip.data || updatedTrip);
    } catch (err) {
      console.error('Error starting trip:', err);
      setError('Failed to start trip');
    }
  };

  // End trip
  const endTrip = async () => {
    if (!currentTrip) return;
    
    try {
      stopGPSTracking();
      
      // Get the current trip data to ensure all required fields are included
      const tripData = currentTrip;
      
      // Format times to match Laravel's expected format (Y-m-d\TH:i)
      const startTime = formatTimeForBackend(tripData.start_time);
      const endTime = formatTimeForBackend(tripData.end_time) || formatTimeForBackend(new Date().toISOString().slice(0, 16));
      
      // Update only the status while preserving other fields
      const updateData = {
        vehicle_id: tripData.vehicle_id,
        driver_id: tripData.driver_id,
        start_location: tripData.start_location,
        end_location: tripData.end_location,
        start_time: startTime,
        end_time: endTime,
        start_mileage: tripData.start_mileage || 0,
        end_mileage: tripData.end_mileage || '',
        distance: tripData.distance || '',
        trip_date: tripData.trip_date || new Date().toISOString().split('T')[0],
        status: 'completed',
      };
      
      await api.updateTrip(currentTrip.id, updateData);
      
      // Refresh trip data
      const updatedTrip = await api.getTrip(currentTrip.id);
      setCurrentTrip(updatedTrip.data || updatedTrip);
    } catch (err) {
      console.error('Error ending trip:', err);
      setError('Failed to end trip');
    }
  };

  // Handle Inspection Submission
  const handleInspectionSubmit = async (inspectionData) => {
    try {
      setLoading(true);
      await api.createInspection(inspectionData);
      setShowInspection(false);
      setError(null);
      setSuccessMessage('Inspection submitted successfully!');
      // Auto-dismiss success message after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting inspection:', err);
      setError('Failed to submit inspection');
      setLoading(false);
    }
  };

  // Handle Issue Report Submission
  const handleIssueSubmit = async (issueData) => {
    try {
      setLoading(true);
      await api.createIssue(issueData);
      setShowIssueReport(false);
      setError(null);
      setSuccessMessage('Issue report submitted successfully!');
      // Auto-dismiss success message after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting issue:', err);
      setError('Failed to submit issue report');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg">
        <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
              <p className="text-yellow-100 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                Welcome • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            {/* Messages Bell Icon - Mobile Optimized */}
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="relative p-2 sm:p-3 hover:bg-yellow-500 rounded-full transition-colors flex-shrink-0"
              aria-label="Messages"
            >
              <FaBell className="text-lg sm:text-xl" />
              {messages.some(m => !m.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Quick Stats Row - Responsive Grid */}
        {currentTrip && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 line-clamp-1">
                <FaRoute className="text-blue-600 flex-shrink-0" />
                <span className="hidden sm:inline">Distance</span>
                <span className="sm:hidden">Dist</span>
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{tripDistance.toFixed(1)} km</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 line-clamp-1">
                <FaClock className="text-green-600 flex-shrink-0" />
                <span className="hidden sm:inline">Duration</span>
                <span className="sm:hidden">Time</span>
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{tripDuration}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 line-clamp-1">
                <FaCar className="text-yellow-600 flex-shrink-0" />
                <span className="hidden sm:inline">Vehicle</span>
                <span className="sm:hidden">Car</span>
              </p>
              <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1 line-clamp-1">{vehicle?.make}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 line-clamp-1">
                <FaCheckCircle className="text-orange-600 flex-shrink-0" />
                <span className="hidden sm:inline">Status</span>
                <span className="sm:hidden">Info</span>
              </p>
              <p className="text-sm sm:text-lg font-bold text-green-600 capitalize mt-1">{currentTrip?.status}</p>
            </div>
          </div>
        )}

        {/* Messages Panel - Responsive */}
        {showMessages && (
          <div className="mb-4 sm:mb-8 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden max-h-96 sm:max-h-full">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-50 to-gray-50 border-b border-gray-200 p-3 sm:p-4 z-10">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 flex-1">
                  <FaEnvelope className="text-yellow-600 flex-shrink-0" />
                  <span>Messages</span>
                  <span className="text-sm text-gray-500">({messages.filter(m => !m.read).length})</span>
                </h3>
                <button
                  onClick={() => setShowMessages(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-300 rounded"
                  aria-label="Close messages"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-80">
              {messages.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  <FaCheckCircle className="mx-auto text-2xl sm:text-3xl mb-2 text-green-400" />
                  <p className="text-sm sm:text-base">No messages</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 sm:p-4 transition-colors hover:bg-gray-50 ${!msg.read ? 'bg-yellow-50 border-l-4 border-yellow-600' : ''}`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div 
                          className={`mt-1 p-1.5 sm:p-2 rounded flex-shrink-0 cursor-pointer ${
                            msg.type === 'success' ? 'bg-green-100' :
                            msg.type === 'warning' ? 'bg-orange-100' :
                            'bg-blue-100'
                          }`}
                          onClick={() => markMessageAsRead(msg.id)}
                        >
                          {msg.type === 'success' ? <FaCheckCircle className="text-green-600 text-sm sm:text-base" /> :
                           msg.type === 'warning' ? <FaExclamationTriangle className="text-orange-600 text-sm sm:text-base" /> :
                           <FaBell className="text-blue-600 text-sm sm:text-base" />}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => markMessageAsRead(msg.id)}>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{msg.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                          <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                            {msg.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissMessage(msg.id);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded mt-1"
                          aria-label="Dismiss message"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success and Error Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation - Responsive and Scrollable */}
        <div className="flex gap-2 mb-4 sm:mb-8 border-b border-gray-200 bg-white rounded-t-lg px-3 sm:px-6 overflow-x-auto sticky top-0 z-20">
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'trips'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Assigned Trips
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'overview'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trip')}
            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'trip'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Trip
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'maintenance'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Maintenance
          </button>
        </div>

        {/* Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content Area - Map */}
          <div className="lg:col-span-2">
            {activeTab === 'trips' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 gap-2">
                    <FaClipboardList className="text-blue-600 flex-shrink-0" />
                    <span className="truncate">Assigned Trips Inbox</span>
                  </h2>
                </div>
                
                {assignedTrips.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-3">📭</div>
                    <p className="text-gray-600 font-medium">No trips assigned</p>
                    <p className="text-gray-500 text-sm mt-1">Check back soon for new trip assignments</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {assignedTrips.map((trip) => (
                      <div
                        key={trip.id}
                        onClick={() => {
                          setCurrentTrip(trip);
                          setActiveTab('overview');
                        }}
                        className={`p-4 sm:p-6 cursor-pointer transition-all hover:bg-blue-50 border-l-4 ${
                          currentTrip?.id === trip.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-transparent hover:border-blue-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                Trip {trip.id}
                              </h3>
                              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                trip.status === 'active' ? 'bg-green-100 text-green-800' :
                                trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {trip.status}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">From: {trip.start_location || 'TBD'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">To: {trip.end_location || 'TBD'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <FaClock className="text-gray-400 flex-shrink-0" />
                                {trip.date ? new Date(trip.date).toLocaleDateString() : 'Date TBD'}
                                {trip.time ? ` at ${trip.time}` : ''}
                              </p>
                              {trip.distance && (
                                <p className="flex items-center gap-2">
                                  <FaRoute className="text-gray-400 flex-shrink-0" />
                                  Estimated: {trip.distance} km
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-gray-400 flex-shrink-0 mt-1">
                            <FaChevronRight />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                  <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 gap-2">
                    <FaMapMarkerAlt className="text-yellow-600 flex-shrink-0" />
                    <span className="truncate">Vehicle Location & Route</span>
                  </h2>
                </div>
                <div 
                  style={{ 
                    height: windowSize.width < 640 ? '250px' : windowSize.width < 1024 ? '350px' : '400px'
                  }}
                  className="p-2 sm:p-4"
                >
                  <MapContainer
                    center={currentLocation}
                    zoom={13}
                    style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Start-to-End Route Line */}
                    {startLocationCoords && endLocationCoords && (
                      <Polyline 
                        positions={[startLocationCoords, endLocationCoords]} 
                        color="#10b981" 
                        weight={4}
                        opacity={0.6}
                        dashArray="5, 5"
                      />
                    )}
                    
                    {/* GPS Tracked Route Waypoints */}
                    {routeWaypoints.length >= 1 && (
                      <Polyline 
                        positions={routeWaypoints} 
                        color="#3b82f6" 
                        weight={3}
                        opacity={0.7}
                      />
                    )}
                    
                    {/* Start Location Marker */}
                    {startLocationCoords && (
                      <Marker position={startLocationCoords} icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}>
                        <Popup>
                          <div className="text-xs sm:text-sm">
                            <p className="font-semibold text-green-600">Start Location</p>
                            <p>{currentTrip?.start_location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* End Location Marker */}
                    {endLocationCoords && (
                      <Marker position={endLocationCoords} icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}>
                        <Popup>
                          <div className="text-xs sm:text-sm">
                            <p className="font-semibold text-red-600">End Location</p>
                            <p>{currentTrip?.end_location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Vehicle Marker (live position) */}
                    {vehicle && (
                      <Marker position={currentLocation} icon={vehicleIcon}>
                        <Popup>
                          <div className="text-xs sm:text-sm">
                            <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                            <p className="text-xs">License: {vehicle.license_plate}</p>
                            <p className="text-xs">Status: {vehicle.status}</p>
                            {currentTrip && (
                              <>
                                <p className="text-xs mt-2 font-semibold">Trip Stats:</p>
                                <p className="text-xs">Distance: {tripDistance.toFixed(2)} km</p>
                                <p className="text-xs">Duration: {tripDuration}</p>
                              </>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            {activeTab === 'trip' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Trip Information Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 gap-2">
                      <FaRoute className="text-blue-600 flex-shrink-0" />
                      <span className="truncate">Trip Details</span>
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    {currentTrip ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Status</p>
                            <p className="text-base sm:text-lg font-bold text-blue-600 capitalize mt-1">{currentTrip.status}</p>
                          </div>
                          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Trip Date</p>
                            <p className="text-base sm:text-lg font-bold text-green-600 mt-1">{new Date(currentTrip.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Route Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <FaMapMarkerAlt className="text-green-600 mt-1 flex-shrink-0 text-sm sm:text-base" />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-600">Start Location</p>
                                <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                                  {(currentTrip.start_location === 'Selected Location' || !currentTrip.start_location)
                                    ? `${currentTrip.origin_lat ? `${parseFloat(currentTrip.origin_lat).toFixed(6)}` : '—'}, ${currentTrip.origin_lng ? `${parseFloat(currentTrip.origin_lng).toFixed(6)}` : '—'}`
                                    : currentTrip.start_location}
                                </p>
                              </div>
                            </div>
                            {currentTrip.end_location && (
                              <div className="flex items-start gap-2 sm:gap-3">
                                <FaMapMarkerAlt className="text-red-600 mt-1 flex-shrink-0 text-sm sm:text-base" />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm text-gray-600">End Location</p>
                                  <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                                    {(currentTrip.end_location === 'Selected Location' || !currentTrip.end_location)
                                      ? `${currentTrip.destination_lat ? `${parseFloat(currentTrip.destination_lat).toFixed(6)}` : '—'}, ${currentTrip.destination_lng ? `${parseFloat(currentTrip.destination_lng).toFixed(6)}` : '—'}`
                                      : currentTrip.end_location}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Trip Timeline</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <p className="text-gray-600">Started</p>
                              <p className="font-medium text-gray-900">{new Date(currentTrip.created_at).toLocaleTimeString()}</p>
                            </div>
                            {currentTrip.end_time && (
                              <div className="flex justify-between text-xs sm:text-sm">
                                <p className="text-gray-600">Ended</p>
                                <p className="font-medium text-gray-900">{new Date(currentTrip.end_time).toLocaleTimeString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaClock className="mx-auto text-3xl sm:text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium text-sm sm:text-base">No active trip</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Start a trip to begin tracking</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Statistics */}
                {currentTrip && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Trip Statistics</h3>
                    </div>
                    <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
                        <p className="text-gray-700 font-medium">Total Distance</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{tripDistance.toFixed(2)} km</p>
                      </div>
                      <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
                        <p className="text-gray-700 font-medium">Trip Duration</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{tripDuration}</p>
                      </div>
                      {tripDistance > 0 && (
                        <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-100 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
                          <p className="text-gray-700 font-medium">Avg. Speed</p>
                          <p className="text-xl sm:text-2xl font-bold text-orange-600">
                            {tripDuration && currentTrip ? 
                              (tripDistance / ((new Date() - new Date(currentTrip.created_at)) / 3600000)).toFixed(2) 
                              : '0.00'
                            } km/h
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Maintenance Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 gap-2">
                      <FaClipboardList className="text-yellow-600 flex-shrink-0" />
                      <span className="truncate">Vehicle Maintenance Check</span>
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Perform a pre-trip or safety inspection of your vehicle.</p>
                    <button
                      onClick={() => setShowInspection(true)}
                      disabled={!currentTrip || !driverId}
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base gap-2"
                    >
                      <FaClipboardList />
                      <span className="hidden sm:inline">Start Vehicle Inspection</span>
                      <span className="sm:hidden">Start Inspection</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      Check brakes, tires, lights, engine, oil, mirrors & horn
                    </p>
                  </div>
                </div>

                {/* Issue Reporting Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 gap-2">
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                      <span className="truncate">Report Safety Issues</span>
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Report any problems or concerns with your vehicle.</p>
                    <button
                      onClick={() => setShowIssueReport(true)}
                      disabled={!currentTrip || !driverId}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base gap-2"
                    >
                      <FaExclamationTriangle />
                      <span className="hidden sm:inline">Report a Problem</span>
                      <span className="sm:hidden">Report Issue</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      Include details and photos of the issue
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Collapsible on Mobile */}
          <div className={`space-y-4 sm:space-y-6 ${windowSize.width < 1024 ? 'col-span-1' : 'col-span-1'}`}>
            {/* Vehicle Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                <h3 className="font-semibold flex items-center text-gray-900 gap-2 text-sm sm:text-base">
                  <FaCar className="text-yellow-600 flex-shrink-0" />
                  <span className="truncate">Assigned Vehicle</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {vehicle ? (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Vehicle</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 truncate">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600">License</p>
                        <p className="font-bold text-blue-600 text-xs sm:text-sm mt-1 truncate">{vehicle.license_plate}</p>
                      </div>
                      <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Status</p>
                        <p className="font-bold text-green-600 text-xs sm:text-sm mt-1 capitalize">{vehicle.status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No vehicle assigned</p>
                )}
              </div>
            </div>

            {/* Trip Controls - Only shown when trip is selected */}
            {currentTrip && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                <h3 className="font-semibold flex items-center text-gray-900 gap-2 text-sm sm:text-base">
                  <FaClock className="text-yellow-600 flex-shrink-0" />
                  <span className="truncate">Trip Controls</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {currentTrip.status !== 'active' ? (
                  <button
                    onClick={startTrip}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base gap-2"
                  >
                    <FaPlay className="flex-shrink-0" />
                    <span>Start Trip</span>
                  </button>
                ) : (
                  <button
                    onClick={endTrip}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base gap-2"
                  >
                    <FaStop className="flex-shrink-0" />
                    <span>End Trip</span>
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Quick Actions</h3>
              </div>
              <div className="p-3 sm:p-6 space-y-1 sm:space-y-2">
                <button
                  onClick={() => { setShowInspection(true); setActiveTab('maintenance'); }}
                  disabled={!currentTrip || !driverId}
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-yellow-50 transition-colors flex items-center text-gray-700 hover:text-yellow-700 font-medium text-sm sm:text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaClipboardList className="text-yellow-600 flex-shrink-0" />
                  <span className="truncate">Run Inspection</span>
                </button>
                <button
                  onClick={() => { setShowIssueReport(true); setActiveTab('maintenance'); }}
                  disabled={!currentTrip || !driverId}
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center text-gray-700 hover:text-red-700 font-medium text-sm sm:text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                  <span className="truncate">Report Issue</span>
                </button>
              </div>
            </div>

            {/* Help/Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 sm:p-6">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Need Help?</h4>
              <p className="text-xs sm:text-sm text-blue-800 mb-3">
                Use the tabs to navigate between different sections.
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Overview: Vehicle location</li>
                <li>• Trip: Trip details</li>
                <li>• Maintenance: Inspections</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Inspection Modal */}
        {showInspection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
              <VehicleInspectionChecklist
                vehicleId={currentTrip?.vehicle_id}
                driverId={driverId}
                tripId={currentTrip?.id}
                onSubmit={handleInspectionSubmit}
                onCancel={() => setShowInspection(false)}
              />
            </div>
          </div>
        )}

        {/* Issue Report Modal */}
        {showIssueReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
              <ManualIssueReport
                vehicleId={currentTrip?.vehicle_id}
                driverId={driverId}
                tripId={currentTrip?.id}
                onSubmit={handleIssueSubmit}
                onCancel={() => setShowIssueReport(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}