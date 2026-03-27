import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function TripDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    try {
      const tripData = await api.getTrip(id);
      setTrip(tripData.data || tripData);
    } catch (err) {
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.deleteTrip(id);
        navigate('/trips');
      } catch (err) {
        setError('Failed to delete trip');
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!trip) return <div className="text-center py-12 text-red-600">Trip not found</div>;

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Details</h1>
          <span className={`inline-block mt-3 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(trip.status)}`}>
            {trip.status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/trips')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={() => navigate(`/trips/${id}/edit`)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Information Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Start Location</p>
              <p className="text-lg text-gray-900 mt-1">
                {(trip.start_location === 'Selected Location' || !trip.start_location)
                  ? `${trip.origin_lat ? `${parseFloat(trip.origin_lat).toFixed(6)}` : '—'}, ${trip.origin_lng ? `${parseFloat(trip.origin_lng).toFixed(6)}` : '—'}`
                  : trip.start_location}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">End Location</p>
              <p className="text-lg text-gray-900 mt-1">
                {(trip.end_location === 'Selected Location' || !trip.end_location)
                  ? `${trip.destination_lat ? `${parseFloat(trip.destination_lat).toFixed(6)}` : '—'}, ${trip.destination_lng ? `${parseFloat(trip.destination_lng).toFixed(6)}` : '—'}`
                  : trip.end_location}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600">Distance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{trip.distance || 'N/A'} km</p>
            </div>
          </div>
        </div>

        {/* Trip Participants Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Participants</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle</p>
              <p className="text-lg text-gray-900 mt-1">
                {trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : 'N/A'}
              </p>
              {trip.vehicle?.license_plate && (
                <p className="text-sm text-gray-600 mt-1 font-mono">{trip.vehicle.license_plate}</p>
              )}
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600">Driver</p>
              <p className="text-lg text-gray-900 mt-1">{trip.driver?.user?.name || trip.driver?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timing Information Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timing</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Trip Date</p>
              <p className="text-lg text-gray-900 mt-1">
                {trip.trip_date ? new Date(trip.trip_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Start Time</p>
              <p className="text-lg text-gray-900 mt-1">{trip.start_time ? new Date(trip.start_time).toLocaleTimeString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">End Time</p>
              <p className="text-lg text-gray-900 mt-1">{trip.end_time ? new Date(trip.end_time).toLocaleTimeString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Mileage Information Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mileage</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Start Mileage</p>
              <p className="text-lg text-gray-900 mt-1">{trip.start_mileage || 'N/A'} mi</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">End Mileage</p>
              <p className="text-lg text-gray-900 mt-1">{trip.end_mileage || 'N/A'} mi</p>
            </div>
            {trip.start_mileage && trip.end_mileage && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600">Calculated Distance</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{(trip.end_mileage - trip.start_mileage).toFixed(2)} mi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
