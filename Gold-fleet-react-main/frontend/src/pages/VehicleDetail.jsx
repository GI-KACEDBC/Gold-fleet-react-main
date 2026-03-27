import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const data = await api.getVehicle(id);
      setVehicle(data.data || data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load vehicle: ' + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.deleteVehicle(id);
        navigate('/vehicles');
      } catch (err) {
        setError('Failed to delete vehicle: ' + err.message);
      }
    }
  };

  const canTrackVehicle = (vehicle) => {
    return vehicle.status === 'active' && (vehicle.assigned_driver_id || vehicle.driver);
  };

  const handleCheckLocation = () => {
    navigate(`/map?vehicleId=${vehicle.id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Vehicle not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h1>
          <p className="mt-2 text-gray-600">License Plate: {vehicle.license_plate}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/vehicles')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={handleCheckLocation}
            disabled={!canTrackVehicle(vehicle)}
            className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors font-medium ${
              canTrackVehicle(vehicle)
                ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={canTrackVehicle(vehicle) ? 'View vehicle location' : 'Vehicle must be active and assigned to a driver'}
          >
            Track
          </button>
          <Link
            to={`/vehicles/${id}/edit`}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-center"
          >
            Edit
          </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
            <div className="relative w-full bg-gray-100" style={{ paddingTop: '56.25%' }}>
              {vehicle.image_url ? (
                <img
                  src={vehicle.image_url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center">
                    <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm">No image</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
              vehicle.status === 'active'
                ? 'bg-green-100 text-green-800'
                : vehicle.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {vehicle.status ? vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1) : 'Active'}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Make</p>
                <p className="text-lg text-gray-900 mt-1">{vehicle.make || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Model</p>
                <p className="text-lg text-gray-900 mt-1">{vehicle.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Year</p>
                <p className="text-lg text-gray-900 mt-1">{vehicle.year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">License Plate</p>
                <p className="text-lg text-gray-900 mt-1 font-mono">{vehicle.license_plate || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Mileage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{(vehicle.mileage || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">miles</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fuel Type</p>
                <p className="text-lg text-gray-900 mt-1">{vehicle.fuel_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
