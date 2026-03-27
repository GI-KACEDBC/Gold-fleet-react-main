import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FaMapMarkerAlt, FaRoute, FaClock, FaCheck, FaPlay, FaTimes } from 'react-icons/fa';

export default function DriverTrips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, active, completed

  // Fetch driver's assigned trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await api.getTrips();
        const allTrips = response.data || response;
        
        // Filter trips and set today's and future trips
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filteredTrips = Array.isArray(allTrips) ? allTrips : [];
        
        // Sort by date
        filteredTrips.sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at));
        
        setTrips(filteredTrips);
      } catch (err) {
        console.error('Error fetching trips:', err);
        setError('Failed to load assigned trips');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  const handleStartTrip = (trip) => {
    // Update trip status to active and navigate to map view
    navigate(`/driver/trip/${trip.id}`);
  };

  const getTabTrips = () => {
    return trips.filter(trip => {
      if (activeTab === 'pending') return trip.status === 'pending';
      if (activeTab === 'active') return trip.status === 'active';
      if (activeTab === 'completed') return trip.status === 'completed';
      return true;
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="w-4 h-4" />;
      case 'active':
        return <FaPlay className="w-4 h-4" />;
      case 'completed':
        return <FaCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const tabTrips = getTabTrips();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assigned trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">My Trips</h1>
          <p className="text-amber-700">View and manage your assigned trips</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-amber-200">
          {[
            { id: 'pending', label: 'Pending', count: trips.filter(t => t.status === 'pending').length },
            { id: 'active', label: 'Active', count: trips.filter(t => t.status === 'active').length },
            { id: 'completed', label: 'Completed', count: trips.filter(t => t.status === 'completed').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-amber-600'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-sm">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Trips Grid */}
        {tabTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaTimes className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No {activeTab} trips at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tabTrips.map(trip => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Trip Header with Status */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold">Trip #{trip.id}</h3>
                      <p className="text-sm opacity-90">
                        {trip.date ? new Date(trip.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusBadgeColor(trip.status)}`}>
                      {getStatusIcon(trip.status)}
                      <span className="text-sm font-medium capitalize">{trip.status}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="p-6 space-y-4">
                  {/* From Location */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FaMapMarkerAlt className="text-green-600" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-500 font-medium">From</p>
                      <p className="text-gray-900 font-semibold">
                        {(trip.start_location === 'Selected Location' || !trip.start_location)
                          ? `${trip.origin_lat ? `${parseFloat(trip.origin_lat).toFixed(6)}` : '—'}, ${trip.origin_lng ? `${parseFloat(trip.origin_lng).toFixed(6)}` : '—'}`
                          : (trip.start_location || 'Current Location')}
                      </p>
                    </div>
                  </div>

                  {/* Route Icon */}
                  <div className="flex justify-center">
                    <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-red-600"></div>
                  </div>

                  {/* To Location */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FaMapMarkerAlt className="text-red-600" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-500 font-medium">To</p>
                      <p className="text-gray-900 font-semibold">
                        {(trip.end_location === 'Selected Location' || !trip.end_location)
                          ? `${trip.destination_lat ? `${parseFloat(trip.destination_lat).toFixed(6)}` : '—'}, ${trip.destination_lng ? `${parseFloat(trip.destination_lng).toFixed(6)}` : '—'}`
                          : (trip.end_location || 'Destination')
                      </p>
                    </div>
                  </div>

                  {/* Trip Info Row */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {trip.vehicle?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {trip.distance ? `${trip.distance} km` : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {trip.notes && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-700">{trip.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  {trip.status === 'pending' ? (
                    <button
                      onClick={() => handleStartTrip(trip)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaPlay className="w-4 h-4" />
                      Start Trip
                    </button>
                  ) : trip.status === 'active' ? (
                    <button
                      onClick={() => handleStartTrip(trip)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaRoute className="w-4 h-4" />
                      Continue Trip
                    </button>
                  ) : (
                    <div className="text-center py-2 text-gray-600 font-medium">
                      <FaCheck className="w-4 h-4 inline mr-2 text-green-600" />
                      Trip Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
