import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tripSimulationService } from '../services/tripSimulationService';
import { createRotatingCarIcon, createLocationMarker, createVehicleStatusMarker } from '../utils/mapIcons';

/**
 * CompanyDashboardSimulation
 * 
 * Displays all active trips as moving markers on a Leaflet map.
 * Updates vehicle positions in real-time (every 3-5 seconds).
 * Features:
 * - ✅ Display all active trips with vehicle markers and rotating car icons
 * - ✅ Show trip origin/destination markers using provided coordinates
 * - ✅ Animate markers as locations update with smooth transitions
 * - ✅ Filter trips by status (pending, active, completed)
 * - ✅ Show trip details in popup
 * - ✅ Real-time location updates with bearing/direction
 * - ✅ Uses CartoDB tiles for company dashboard (alternative API)
 */
export default function CompanyDashboardSimulation() {
  const [trips, setTrips] = useState([]);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, active, completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoStarted, setAutoStarted] = useState(new Set());

  /**
   * Fetch all active trips from the API.
   */
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tripSimulationService.getActiveTrips();
      if (response.success) {
        setTrips(response.trips || []);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch trips');
      }
    } catch (err) {
      setError('Error fetching trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch individual trip details including locations and simulation status.
   */
  const fetchTripDetails = useCallback(async (tripId) => {
    try {
      const response = await tripSimulationService.getTripLocations(tripId);
      if (response.success) {
        setTrips(prev => prev.map(t => t.id === tripId ? response.trip : t));
        
        // Auto-start simulation for approved trips
        const trip = response.trip;
        if (trip.status === 'approved' && !trip.simulation?.is_active && !autoStarted.has(tripId)) {
          try {
            await tripSimulationService.approveTrip(tripId);
            setAutoStarted(prev => new Set([...prev, tripId]));
          } catch (err) {
            console.log(`Could not auto-start trip ${tripId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching trip details:', err);
    }
  }, [autoStarted]);

  /**
   * Set up polling to fetch trips and details periodically.
   */
  useEffect(() => {
    fetchTrips();

    // Poll for new trips every 5 seconds
    const mainInterval = setInterval(fetchTrips, refreshInterval);

    // Poll individual trip details for active simulations
    const detailInterval = setInterval(() => {
      trips.forEach(trip => {
        if (trip.simulation?.is_active) {
          fetchTripDetails(trip.id);
        }
      });
    }, 3000); // More frequent updates for active simulations

    return () => {
      clearInterval(mainInterval);
      clearInterval(detailInterval);
    };
  }, [refreshInterval, fetchTrips, fetchTripDetails, trips]);

  /**
   * Filter trips based on status.
   */
  const filteredTrips = trips.filter(trip => {
    if (statusFilter === 'all') return true;
    return trip.status === statusFilter;
  });

  /**
   * Create custom marker icon for vehicle based on status.
   */
  const createVehicleMarker = (status, bearing = 0) => {
    return createVehicleStatusMarker(status, bearing);
  };

  /**
   * Calculate center of all trips for auto-fit.
   */
  const getMapBounds = () => {
    if (filteredTrips.length === 0) {
      return [[40, 0], [41, 1]]; // Default center around Nigeria
    }

    const allPoints = filteredTrips.flatMap(trip => [
      [trip.origin.latitude, trip.origin.longitude],
      [trip.destination.latitude, trip.destination.longitude],
      trip.simulation ? [trip.simulation.current_lat, trip.simulation.current_lng] : null
    ]).filter(Boolean);

    if (allPoints.length === 0) return [[40, 0], [41, 1]];

    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);

    return [
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
    ];
  };

  if (error && !trips.length) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={fetchTrips}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Trips ({trips.length})</option>
                <option value="pending">Pending ({trips.filter(t => t.status === 'pending').length})</option>
                <option value="approved">Approved ({trips.filter(t => t.status === 'approved').length})</option>
                <option value="active">Active ({trips.filter(t => t.status === 'active').length})</option>
                <option value="completed">Completed ({trips.filter(t => t.status === 'completed').length})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Interval
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3000}>3s (Fast)</option>
                <option value={5000}>5s (Normal)</option>
                <option value={10000}>10s (Slow)</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchTrips}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-grow rounded-lg overflow-hidden shadow-md border border-gray-200">
        {filteredTrips.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">No {statusFilter !== 'all' ? statusFilter : ''} trips to display</p>
          </div>
        ) : (
          <MapContainer
            bounds={getMapBounds()}
            boundsOptions={{ padding: [50, 50] }}
            style={{ height: '100%' }}
            className="rounded-lg"
          >
            {/* CartoDB tile layer for company dashboard */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {filteredTrips.map(trip => (
              <React.Fragment key={trip.id}>
                {/* Route polyline from origin to destination */}
                {trip.origin && trip.destination && (
                  <Polyline
                    positions={[
                      [trip.origin.latitude, trip.origin.longitude],
                      [trip.destination.latitude, trip.destination.longitude],
                    ]}
                    color={trip.status === 'active' ? '#22c55e' : '#3b82f6'}
                    weight={3}
                    opacity={0.7}
                    dashArray="5, 5"
                  />
                )}

                {/* Origin marker with provided coordinates */}
                {trip.origin && (
                  <Marker
                    position={[trip.origin.latitude, trip.origin.longitude]}
                    icon={createLocationMarker('origin')}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-green-700">📍 Origin</p>
                        <p>{trip.origin.name || `${trip.origin.latitude.toFixed(6)}, ${trip.origin.longitude.toFixed(6)}`}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Current vehicle position with rotating car icon (if simulation is active) */}
                {trip.simulation?.is_active && trip.simulation.current_lat && (
                  <Marker
                    position={[trip.simulation.current_lat, trip.simulation.current_lng]}
                    icon={createRotatingCarIcon(trip.simulation.heading || 0, '#22c55e')}
                  >
                    <Popup>
                      <div className="text-sm font-medium space-y-1">
                        <p className="font-bold text-blue-700">{trip.vehicle?.name || 'Vehicle'}</p>
                        <p className="text-gray-600">Driver: {trip.driver?.name || 'Unknown'}</p>
                        <p className="text-gray-600">Status: <span className="font-semibold capitalize">{trip.status}</span></p>
                        <p className="text-gray-600">Progress: {Math.round(trip.simulation.progress_percentage)}%</p>
                        <p className="text-gray-600">Speed: {trip.simulation.speed_kmh} km/h</p>
                        <p className="text-gray-600">Direction: {Math.round(trip.simulation.heading) || 0}°</p>
                        <p className="text-xs text-gray-500">Lat: {trip.simulation.current_lat.toFixed(6)}</p>
                        <p className="text-xs text-gray-500">Lng: {trip.simulation.current_lng.toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination marker with provided coordinates */}
                {trip.destination && (
                  <Marker
                    position={[trip.destination.latitude, trip.destination.longitude]}
                    icon={createLocationMarker('destination')}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-red-700">🎯 Destination</p>
                        <p>{trip.destination.name || `${trip.destination.latitude.toFixed(6)}, ${trip.destination.longitude.toFixed(6)}`}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Show progress circle at current position */}
                {trip.simulation?.is_active && trip.simulation.current_lat && (
                  <CircleMarker
                    center={[trip.simulation.current_lat, trip.simulation.current_lng]}
                    radius={6}
                    fillColor={trip.status === 'active' ? '#22c55e' : '#3b82f6'}
                    color="white"
                    weight={2}
                    opacity={0.3}
                  />
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vehicle</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Driver</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Progress</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Speed</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map(trip => (
                <tr key={trip.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{trip.vehicle?.name || '-'}</td>
                  <td className="px-4 py-3">{trip.driver?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.status === 'active' ? 'bg-green-100 text-green-800' :
                      trip.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                      trip.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {trip.simulation ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${trip.simulation.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{trip.simulation.progress_percentage.toFixed(0)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {trip.simulation?.speed_kmh ? `${trip.simulation.speed_kmh} km/h` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedTrips(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(trip.id)) {
                            newSet.delete(trip.id);
                          } else {
                            newSet.add(trip.id);
                          }
                          return newSet;
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      {selectedTrips.has(trip.id) ? 'Hide' : 'Focus'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
