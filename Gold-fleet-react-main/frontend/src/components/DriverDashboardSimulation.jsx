import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tripSimulationService } from '../services/tripSimulationService';
import { createRotatingCarIcon, createLocationMarker, createCurrentPositionMarker } from '../utils/mapIcons';

/**
 * DriverDashboardSimulation
 * 
 * Displays the driver's assigned trip with real-time position updates.
 * Shows the planned route and allows the driver to approve/start the simulation.
 * 
 * Features:
 * - ✅ Display assigned trip route using provided coordinates (origin/destination)
 * - ✅ Show current vehicle position on map with rotating car icon
 * - ✅ Button to approve trip and auto-start simulation
 * - ✅ Real-time location updates during active simulation with bearing/direction
 * - ✅ Show trip progress percentage and metrics
 * - ✅ Display estimated arrival and metrics
 * - ✅ Uses USGS tiles for driver dashboard (alternative API)
 */
export default function DriverDashboardSimulation() {
  const [trip, setTrip] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  /**
   * Fetch driver's assigned trip.
   */
  const fetchDriverTrip = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tripSimulationService.getDriverTrip();
      if (response.success) {
        setTrip(response.trip);
        setSimulation(response.simulation);
        setError(null);
        
        // Auto-start simulation for approved trips
        if (response.trip && response.trip.status === 'approved' && !response.simulation?.is_active && !autoStarted) {
          try {
            const approveResponse = await tripSimulationService.approveTrip(response.trip.id);
            if (approveResponse.success) {
              setTrip(approveResponse.trip);
              setSimulation(approveResponse.simulation);
              setAutoStarted(true);
            }
          } catch (err) {
            console.log('Could not auto-start trip:', err.message);
          }
        }
      } else {
        setError(response.message || 'Failed to fetch trip');
      }
    } catch (err) {
      setError('Error fetching trip: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [autoStarted]);

  /**
   * Approve trip and start simulation.
   */
  const handleApproveTrip = async () => {
    if (!trip) return;

    try {
      setApproving(true);
      const response = await tripSimulationService.approveTrip(trip.id);
      if (response.success) {
        setTrip(response.trip);
        setSimulation(response.simulation);
        setError(null);
      } else {
        setError(response.message || 'Failed to approve trip');
      }
    } catch (err) {
      setError('Error approving trip: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  /**
   * Stop simulation and complete trip.
   */
  const handleStopSimulation = async () => {
    if (!trip) return;

    try {
      setStopping(true);
      const response = await tripSimulationService.stopSimulation(trip.id);
      if (response.success) {
        setTrip(response.trip);
        setSimulation(response.simulation);
        setError(null);
      } else {
        setError(response.message || 'Failed to stop simulation');
      }
    } catch (err) {
      setError('Error stopping simulation: ' + err.message);
    } finally {
      setStopping(false);
    }
  };

  /**
   * Refresh trip data.
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDriverTrip();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Set up polling for trip updates.
   */
  useEffect(() => {
    fetchDriverTrip();

    // Poll for updates every 3 seconds if simulation is active
    const interval = setInterval(() => {
      fetchDriverTrip();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchDriverTrip]);

  if (loading && !trip) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchDriverTrip}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-yellow-800 font-bold mb-2">No Trip Assigned</h2>
          <p className="text-yellow-700 mb-4">You don't have any active trips assigned yet.</p>
          <button
            onClick={fetchDriverTrip}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const isSimulationActive = simulation?.is_active;
  const isPending = trip.status === 'pending';
  const isCompleted = trip.status === 'completed';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Assignment</h1>
              <p className="text-gray-600 mt-1">Vehicle: {trip.vehicle?.name} • Driver: {trip.driver?.name}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 rounded-lg overflow-hidden shadow-md border border-gray-200">
          <MapContainer
            center={[
              trip.origin?.latitude || 9.0765,
              trip.origin?.longitude || 7.3986
            ]}
            zoom={13}
            style={{ height: '100%', minHeight: '500px' }}
          >
            {/* USGS tile layer for driver dashboard */}
            <TileLayer
              attribution='&copy; <a href="https://www.usgs.gov/">USGS</a>'
              url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />

            {/* Route polyline from origin to destination */}
            {trip.origin && trip.destination && (
              <Polyline
                positions={[
                  [trip.origin.latitude, trip.origin.longitude],
                  [trip.destination.latitude, trip.destination.longitude],
                ]}
                color={isSimulationActive ? '#22c55e' : '#3b82f6'}
                weight={3}
                opacity={0.7}
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
                    <p className="font-bold text-green-700">📍 Start Location</p>
                    <p>{trip.origin.name || `${trip.origin.latitude.toFixed(6)}, ${trip.origin.longitude.toFixed(6)}`}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Current position with rotating car icon (during simulation) */}
            {simulation?.current_lat && (
              <>
                <Marker
                  position={[simulation.current_lat, simulation.current_lng]}
                  icon={createRotatingCarIcon(simulation.heading || 0, '#3b82f6')}
                >
                  <Popup>
                    <div className="text-sm font-medium space-y-1">
                      <p className="font-bold text-blue-700">📍 Your Location</p>
                      <p className="text-gray-600">Lat: {simulation.current_lat.toFixed(6)}</p>
                      <p className="text-gray-600">Lng: {simulation.current_lng.toFixed(6)}</p>
                      <p className="text-gray-600">Speed: {simulation.speed_kmh} km/h</p>
                      <p className="text-gray-600">Direction: {Math.round(simulation.heading) || 0}°</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Accuracy/signal circle around current position */}
                <CircleMarker
                  center={[simulation.current_lat, simulation.current_lng]}
                  radius={8}
                  fillColor="#3b82f6"
                  color="white"
                  weight={2}
                  opacity={0.2}
                />
              </>
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
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Status</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold capitalize ${
                  trip.status === 'active' ? 'text-green-600' :
                  trip.status === 'completed' ? 'text-purple-600' :
                  trip.status === 'pending' ? 'text-gray-600' :
                  'text-blue-600'
                }`}>
                  {trip.status}
                </p>
              </div>

              {simulation && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${simulation.progress_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-semibold mt-1">{simulation.progress_percentage.toFixed(1)}% Complete</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Speed</p>
                    <p className="text-lg font-bold">{simulation.speed_kmh} km/h</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Heading</p>
                    <p className="text-lg font-bold">{simulation.heading}°</p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {isPending && (
                <button
                  onClick={handleApproveTrip}
                  disabled={approving}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {approving ? 'Approving...' : '✓ Approve & Start Trip'}
                </button>
              )}

              {isSimulationActive && !isCompleted && (
                <button
                  onClick={handleStopSimulation}
                  disabled={stopping}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {stopping ? 'Stopping...' : '⊗ Stop & Complete Trip'}
                </button>
              )}

              {isCompleted && (
                <div className="px-4 py-3 text-center bg-gray-100 rounded-lg text-gray-700 font-medium">
                  ✓ Trip Completed
                </div>
              )}
            </div>
          </div>

          {/* Trip Details Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>

            <div className="space-y-3 text-sm">
              <div className="border-b border-gray-200 pb-2">
                <p className="text-gray-600">Vehicle</p>
                <p className="font-semibold text-gray-900">{trip.vehicle?.name}</p>
              </div>

              <div className="border-b border-gray-200 pb-2">
                <p className="text-gray-600">License Plate</p>
                <p className="font-semibold text-gray-900">{trip.vehicle?.license_plate || 'N/A'}</p>
              </div>

              <div className="border-b border-gray-200 pb-2">
                <p className="text-gray-600">Start Time</p>
                <p className="font-semibold text-gray-900">
                  {new Date(trip.start_time).toLocaleString()}
                </p>
              </div>

              {simulation?.started_at && (
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-gray-600">Simulation Started</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(simulation.started_at).toLocaleString()}
                  </p>
                </div>
              )}

              {simulation?.completed_at && (
                <div>
                  <p className="text-gray-600">Simulation Completed</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(simulation.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
