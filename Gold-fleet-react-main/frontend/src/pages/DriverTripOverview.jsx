import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FaMapMarkerAlt, FaClock, FaRoute, FaCar, FaUser, FaArrowRight } from 'react-icons/fa';
import { api } from '../services/api';

export default function DriverTripOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [trip, setTrip] = useState(location.state?.tripData || null);
  const [loading, setLoading] = useState(!trip);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (!trip) {
      fetchTripData();
    }
  }, [id, trip]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const tripData = await api.getTrip(id);
      setTrip(tripData.data || tripData);
    } catch (err) {
      setError('Failed to load trip details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async () => {
    if (!trip) {
      setError('Trip data not loaded');
      return;
    }

    try {
      setError('');
      
      console.log('🚗 Starting trip in background:', trip.id);

      // Format time to Y-m-d\TH:i format that backend expects
      const formatTimeForBackend = (timeStr) => {
        if (!timeStr) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        if (typeof timeStr === 'object') {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        if (timeStr.includes(':') && !timeStr.includes('-')) {
          const [hours, minutes] = timeStr.split(':');
          const tripDate = trip.date || trip.trip_date || new Date().toISOString().split('T')[0];
          return `${tripDate}T${hours || '00'}:${minutes || '00'}`;
        }
        
        if (timeStr.includes('T')) {
          return timeStr.substring(0, 16);
        }
        
        return timeStr;
      };

      const startTime = formatTimeForBackend(trip.start_time);
      const tripDate = trip.date || trip.trip_date || new Date().toISOString().split('T')[0];

      const updatePayload = {
        status: 'active',
        driver_id: trip.driver_id,
        start_location: trip.start_location || 'Current Location',
        start_time: startTime,
        end_location: trip.end_location || 'Destination',
        trip_date: tripDate,
        start_mileage: trip.start_mileage || 0,
      };

      // Make API call in background without waiting
      api.updateTrip(trip.id, updatePayload)
        .then((response) => {
          const updatedTrip = response.data || response;
          console.log('✅ Trip started:', updatedTrip.id);
          setTrip(updatedTrip);
          // Silently navigate after success
          setTimeout(() => {
            navigate('/driver/dashboard', {
              state: {
                tripStarted: true,
                tripId: trip.id,
                activeTrip: updatedTrip,
              },
            });
          }, 300);
        })
        .catch((err) => {
          console.error('❌ Error starting trip:', err);
          setError(`Failed to start trip: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        });

      // Navigate immediately for instant UX
      navigate('/driver/dashboard', {
        state: {
          tripStarted: true,
          tripId: trip.id,
        },
      });
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Failed to start trip: ${err.message}`);
    }
  };

  const endTrip = async () => {
    if (!trip) {
      setError('Trip data not loaded');
      return;
    }

    try {
      setError('');
      
      console.log('🛑 Ending trip in background:', trip.id);

      // Format end time to Y-m-d\TH:i format that backend expects
      const formatTimeForBackend = (timeStr) => {
        if (!timeStr) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        if (typeof timeStr === 'object') {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        if (timeStr.includes(':') && !timeStr.includes('-')) {
          const [hours, minutes] = timeStr.split(':');
          const tripDate = trip.date || trip.trip_date || new Date().toISOString().split('T')[0];
          return `${tripDate}T${hours || '00'}:${minutes || '00'}`;
        }
        
        if (timeStr.includes('T')) {
          return timeStr.substring(0, 16);
        }
        
        return timeStr;
      };

      const endTime = formatTimeForBackend(trip.end_time);
      const tripDate = trip.date || trip.trip_date || new Date().toISOString().split('T')[0];

      const updatePayload = {
        status: 'completed',
        end_time: endTime,
        end_location: trip.end_location || 'Destination',
        trip_date: tripDate,
      };

      // Make API call in background without waiting
      api.updateTrip(trip.id, updatePayload)
        .then((response) => {
          const updatedTrip = response.data || response;
          console.log('✅ Trip ended:', updatedTrip.id);
          setTrip(updatedTrip);
          // Silently navigate after success
          setTimeout(() => {
            navigate('/driver/dashboard', {
              state: {
                tripCompleted: true,
                tripId: trip.id,
                completedTrip: updatedTrip,
              },
            });
          }, 300);
        })
        .catch((err) => {
          console.error('❌ Error ending trip:', err);
          setError(`Failed to end trip: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        });

      // Navigate immediately for instant UX
      navigate('/driver/dashboard', {
        state: {
          tripCompleted: true,
          tripId: trip.id,
        },
      });
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Failed to end trip: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Trip Not Found</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const hasCoordinates =
    trip.origin_lat && trip.origin_lng && trip.destination_lat && trip.destination_lng;

  const startLatLng = [parseFloat(trip.origin_lat) || 40, parseFloat(trip.origin_lng) || -74];
  const endLatLng = [parseFloat(trip.destination_lat) || 40.7, parseFloat(trip.destination_lng) || -74.05];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Trip Overview</h1>
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500 text-white font-semibold">
            Trip #{trip.id}
          </span>
        </div>
        <div className="flex items-center text-blue-100">
          <FaMapMarkerAlt className="mr-2" />
          <span className="font-semibold">{trip.start_location || 'Start Location'}</span>
          <FaArrowRight className="mx-3 opacity-75" />
          <span className="font-semibold">{trip.end_location || 'End Location'}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 m-4">
          <p className="text-red-800 font-semibold">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Trip Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Information */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center mb-4">
              <FaRoute className="text-blue-600 mr-2 text-lg" />
              <h3 className="text-lg font-semibold text-gray-900">Route Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Starting Point</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.start_location || 'TBD'}
                </p>
                {trip.origin_lat && trip.origin_lng && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {parseFloat(trip.origin_lat).toFixed(6)}, {parseFloat(trip.origin_lng).toFixed(6)}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-gray-600 uppercase">Destination</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.end_location || 'TBD'}
                </p>
                {trip.destination_lat && trip.destination_lng && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {parseFloat(trip.destination_lat).toFixed(6)}, {parseFloat(trip.destination_lng).toFixed(6)}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-gray-600 uppercase">Distance</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{trip.distance || '—'} km</p>
              </div>
            </div>
          </div>

          {/* Trip Information */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
            <div className="flex items-center mb-4">
              <FaClock className="text-amber-600 mr-2 text-lg" />
              <h3 className="text-lg font-semibold text-gray-900">Trip Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Date</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.date ? new Date(trip.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'TBD'}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-gray-600 uppercase">Scheduled Time</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.time || 'TBD'} {trip.start_time && `(Start: ${trip.start_time})`}
                </p>
              </div>

              {trip.start_mileage && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-600 uppercase">Starting Mileage</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">{trip.start_mileage} km</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
            <div className="flex items-center mb-4">
              <FaCar className="text-green-600 mr-2 text-lg" />
              <h3 className="text-lg font-semibold text-gray-900">Vehicle</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Model</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : 'N/A'}
                </p>
              </div>

              {trip.vehicle?.license_plate && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase">License Plate</p>
                  <p className="text-sm font-mono font-bold text-green-600 mt-1">
                    {trip.vehicle.license_plate}
                  </p>
                </div>
              )}

              {trip.vehicle?.color && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase">Color</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{trip.vehicle.color}</p>
                </div>
              )}
            </div>
          </div>

          {/* Driver Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
            <div className="flex items-center mb-4">
              <FaUser className="text-purple-600 mr-2 text-lg" />
              <h3 className="text-lg font-semibold text-gray-900">Driver</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {trip.driver?.user?.name || trip.driver?.name || 'N/A'}
                </p>
              </div>

              {trip.driver?.phone && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase">Contact</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{trip.driver.phone}</p>
                </div>
              )}

              {trip.driver?.license_number && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase">License #</p>
                  <p className="text-sm font-mono text-purple-600 mt-1">{trip.driver.license_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Section */}
        {hasCoordinates && (
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden h-96 shadow-sm">
            <MapContainer
              center={[(parseFloat(trip.origin_lat) + parseFloat(trip.destination_lat)) / 2, 
                      (parseFloat(trip.origin_lng) + parseFloat(trip.destination_lng)) / 2]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* Start location marker */}
              <Marker position={startLatLng}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Start: {trip.start_location}</p>
                    <p className="text-xs text-gray-600">{startLatLng[0].toFixed(6)}, {startLatLng[1].toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>

              {/* End location marker */}
              <Marker position={endLatLng}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">End: {trip.end_location}</p>
                    <p className="text-xs text-gray-600">{endLatLng[0].toFixed(6)}, {endLatLng[1].toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route line */}
              <Polyline positions={[startLatLng, endLatLng]} color="blue" weight={3} opacity={0.7} />
            </MapContainer>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mb-4">
            <p className="text-red-800 font-semibold">❌ Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Trip Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-blue-900">
            Trip Status: <span className="font-bold text-lg">
              {trip.status === 'pending' && '⏳ Pending'}
              {trip.status === 'inspection' && '🔍 Inspection Required'}
              {trip.status === 'active' && '🚗 In Progress'}
              {trip.status === 'completed' && '✅ Completed'}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {trip.status !== 'active' && (
            <button
              onClick={() => navigate('/driver/dashboard')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return to Dashboard
            </button>
          )}

          {trip.status !== 'active' && (
            <button
              onClick={startTrip}
              className="flex-1 px-6 py-3 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaCar />
              Start Trip
            </button>
          )}

          {trip.status === 'active' && (
            <>
              <button
                onClick={() => navigate('/driver/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Dashboard
              </button>

              <button
                onClick={endTrip}
                className="flex-1 px-6 py-3 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaArrowRight />
                End Trip
              </button>
            </>
          )}
        </div>

        {/* Warning Banner if inspection just passed */}
        {location.state?.inspectionCompleted && location.state?.inspectionStatus === 'passed' && (
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
            <p className="text-green-800 font-semibold">✅ Pre-trip inspection passed!</p>
            <p className="text-green-700 text-sm mt-1">Your vehicle is ready. Click "Start Trip" below to begin your journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
