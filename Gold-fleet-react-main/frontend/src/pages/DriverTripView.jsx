import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FaArrowLeft, FaPlay, FaStop, FaMapMarkerAlt, FaClock, FaPhone } from 'react-icons/fa';

const vehicleIcon = L.icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Ccircle cx="12" cy="12" r="10" fill="%23D97706" stroke="%23FFFFFF" stroke-width="2"/%3E%3Ctext x="12" y="16" text-anchor="middle" font-size="12" fill="white" font-weight="bold"%3E📍%3C/text%3E%3C/svg%3E',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const destinationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23DC2626"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/%3E%3C/svg%3E',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function DriverTripView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [stoppingTrip, setStoppingTrip] = useState(false);
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Default Ghana center

  // Fetch trip details
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await api.getTrip(tripId);
        const tripData = response.data || response;
        setTrip(tripData);
        
        // Use stored coordinates if available, otherwise geocode
        if (tripData.origin_lat && tripData.origin_lng) {
          const startCoord = [parseFloat(tripData.origin_lat), parseFloat(tripData.origin_lng)];
          setStartCoords(startCoord);
          setMapCenter(startCoord);
        } else if (tripData.start_location) {
          try {
            const coords = await geocodeLocation(tripData.start_location);
            setStartCoords(coords);
            setMapCenter(coords);
          } catch (err) {
            console.error('Error geocoding start location:', err);
            setStartCoords([5.6037, -0.1870]); // Ghana center
          }
        } else {
          setStartCoords([5.6037, -0.1870]); // Ghana center
        }

        if (tripData.destination_lat && tripData.destination_lng) {
          const endCoord = [parseFloat(tripData.destination_lat), parseFloat(tripData.destination_lng)];
          setEndCoords(endCoord);
        } else if (tripData.end_location) {
          try {
            const coords = await geocodeLocation(tripData.end_location);
            setEndCoords(coords);
          } catch (err) {
            console.error('Error geocoding end location:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    if (user && tripId) {
      fetchTrip();
    }
  }, [user, tripId]);

  // Geocoding function
  const geocodeLocation = async (locationString) => {
    if (!locationString) return [5.6037, -0.1870];

    try {
      const response = await api.geocode(locationString);
      if (response.success && response.data && response.data.length > 0) {
        const firstResult = response.data[0];
        return [firstResult.lat, firstResult.lon];
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    
    return [5.6037, -0.1870]; // Default Ghana fallback
  };

  const handleStartTrip = async () => {
    if (!trip) return;
    
    try {
      setStartingTrip(true);
      
      // Format time to Y-m-d\TH:i format (remove seconds if present)
      const formatTimeForBackend = (timeString) => {
        if (!timeString) return '';
        if (timeString.includes('T')) {
          return timeString.substring(0, 16);
        }
        return timeString;
      };
      
      // Include all required fields for the update
      const updateData = {
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        start_time: formatTimeForBackend(trip.start_time),
        end_time: formatTimeForBackend(trip.end_time) || '',
        start_mileage: trip.start_mileage,
        end_mileage: trip.end_mileage || '',
        distance: trip.distance || '',
        trip_date: trip.trip_date,
        status: 'active',
      };
      
      await api.updateTrip(trip.id, updateData);
      
      // Update local state
      setTrip({ ...trip, status: 'active' });
      
      // Show success message
      alert('Trip started! Safe travels!');
    } catch (err) {
      console.error('Error starting trip:', err);
      alert('Failed to start trip. Please try again.');
    } finally {
      setStartingTrip(false);
    }
  };

  const handleStopTrip = async () => {
    if (!trip) return;
    
    try {
      setStoppingTrip(true);
      
      // Format time to Y-m-d\TH:i format (remove seconds if present)
      const formatTimeForBackend = (timeString) => {
        if (!timeString) return '';
        if (timeString.includes('T')) {
          return timeString.substring(0, 16);
        }
        return timeString;
      };
      
      // Include all required fields for the update
      const updateData = {
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        start_time: formatTimeForBackend(trip.start_time),
        end_time: formatTimeForBackend(trip.end_time) || formatTimeForBackend(new Date().toISOString().slice(0, 16)),
        start_mileage: trip.start_mileage,
        end_mileage: trip.end_mileage || '',
        distance: trip.distance || '',
        trip_date: trip.trip_date,
        status: 'completed',
      };
      
      await api.updateTrip(trip.id, updateData);
      
      // Update local state
      setTrip({ ...trip, status: 'completed' });
      
      // Show success and go back to trips
      alert('Trip completed successfully!');
      navigate('/driver/trips');
    } catch (err) {
      console.error('Error completing trip:', err);
      alert('Failed to complete trip. Please try again.');
    } finally {
      setStoppingTrip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/driver/trips')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Go Back to Trips
          </button>
        </div>
      </div>
    );
  }

  const tripDate = trip.date ? new Date(trip.date).toLocaleDateString() : 'No date';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/driver/trips')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip #{trip.id}</h1>
              <p className="text-sm text-gray-600">{tripDate}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold capitalize ${
            trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            trip.status === 'active' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {trip.status}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {startCoords && (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Start Location Marker */}
                <Marker position={startCoords} icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-green-700">Start Location</p>
                      <p className="text-sm">{trip.start_location || 'Current Location'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* End Location Marker */}
                {endCoords && (
                  <Marker position={endCoords} icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold text-red-700">Destination</p>
                        <p className="text-sm">{trip.end_location || 'Destination'}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Polyline */}
                {startCoords && endCoords && (
                  <Polyline
                    positions={[startCoords, endCoords]}
                    color="#D97706"
                    weight={3}
                    opacity={0.8}
                    dashArray="5, 5"
                  />
                )}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Trip Details Sidebar */}
        <div className="space-y-4">
          {/* Route Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Route Summary</h2>
            
            <div className="space-y-4">
              {/* From */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="text-green-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-gray-500 font-medium">From</p>
                  <p className="text-gray-900 font-semibold">{trip.start_location || 'Current Location'}</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-red-600"></div>
              </div>

              {/* To */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="text-red-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-gray-500 font-medium">To</p>
                  <p className="text-gray-900 font-semibold">{trip.end_location || 'Destination'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Vehicle</p>
                <p className="text-gray-900 font-semibold">{trip.vehicle?.name || 'Unassigned'}</p>
              </div>

              {trip.vehicle?.registration_number && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Registration</p>
                  <p className="text-gray-900 font-semibold">{trip.vehicle.registration_number}</p>
                </div>
              )}

              {trip.distance && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Distance</p>
                  <p className="text-gray-900 font-semibold">{trip.distance} km</p>
                </div>
              )}

              {trip.estimated_duration && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Estimated Duration</p>
                  <p className="text-gray-900 font-semibold">{trip.estimated_duration}</p>
                </div>
              )}

              {trip.notes && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Notes</p>
                  <p className="text-gray-700 text-sm">{trip.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {trip.status === 'pending' && (
              <button
                onClick={handleStartTrip}
                disabled={startingTrip}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <FaPlay className="w-4 h-4" />
                {startingTrip ? 'Starting...' : 'Start Trip'}
              </button>
            )}

            {trip.status === 'active' && (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                  <p className="font-semibold">Trip in Progress</p>
                  <p className="text-xs mt-1">Your trip is currently active. Navigate safely to your destination.</p>
                </div>
                <button
                  onClick={handleStopTrip}
                  disabled={stoppingTrip}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaStop className="w-4 h-4" />
                  {stoppingTrip ? 'Completing...' : 'Complete Trip'}
                </button>
              </div>
            )}

            {trip.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-center">
                <p className="font-semibold">Trip Completed</p>
                <p className="text-xs mt-1">This trip has been successfully completed.</p>
              </div>
            )}

            <button
              onClick={() => navigate('/driver/trips')}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Back to Trips
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
