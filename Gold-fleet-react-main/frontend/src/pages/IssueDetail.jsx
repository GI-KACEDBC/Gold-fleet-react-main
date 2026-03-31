import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaExchangeAlt } from 'react-icons/fa';
import { api } from '../services/api';

export default function IssueDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVehicleAssignModal, setShowVehicleAssignModal] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchIssueData();
  }, [id]);

  const fetchIssueData = async () => {
    try {
      const response = await api.getIssue(id);
      const data = response.data || response;
      
      console.log('📌 Issue data fetched:', {
        issue_id: data.id,
        trip_id: data.trip_id,
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id,
        full_issue: data,
      });

      // If no trip_id, try to find an active trip for this driver + vehicle
      if (!data.trip_id && data.driver_id && data.vehicle_id) {
        console.log('🔍 No trip_id on issue, searching for active trip...');
        try {
          const tripsResponse = await api.get('/api/trips');
          const allTrips = tripsResponse.data || [];
          const activeTrip = allTrips.find(t => 
            t.driver_id === data.driver_id && 
            t.vehicle_id === data.vehicle_id &&
            ['pending', 'approved', 'active'].includes(t.status)
          );
          if (activeTrip) {
            console.log('✅ Found active trip:', activeTrip.id);
            data.trip_id = activeTrip.id;
          } else {
            console.log('⚠️  No active trip found for this driver/vehicle combination');
          }
        } catch (err) {
          console.warn('Could not search for trips:', err);
        }
      }

      setIssue(data);

      // Try vehicle_id first (simple id), otherwise use related vehicle object
      if (data.vehicle_id) {
        const vehicleResponse = await api.getVehicle(data.vehicle_id);
        const vehicleData = vehicleResponse.data || vehicleResponse;
        setVehicle(vehicleData);
      } else if (data.vehicle) {
        setVehicle(data.vehicle);
      }
    } catch (err) {
      setError('Failed to load issue details: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVehicles = async () => {
    try {
      const response = await api.getVehicles();
      const vehicles = response.data || response;
      // Filter out the current vehicle
      const filtered = vehicles.filter(v => v.id !== issue?.vehicle_id);
      setAvailableVehicles(filtered);
    } catch (err) {
      setError('Failed to load vehicles: ' + (err.message || err));
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    setIsAssigning(true);
    try {
      const newVehicleId = parseInt(selectedVehicle);
      const newVehicle = availableVehicles.find(v => v.id === newVehicleId);
      
      console.log('🔄 Starting vehicle reassignment process...');
      console.log('   Trip ID:', issue?.trip_id);
      console.log('   Driver ID:', issue?.driver_id);
      console.log('   Old Vehicle ID:', issue?.vehicle_id);
      console.log('   New Vehicle ID:', newVehicleId);

      // Step 1: Get driver_id - first from issue, then try to fetch from trip
      let driverId = issue?.driver_id || null;
      if (!driverId && issue?.trip_id) {
        try {
          const tripResponse = await api.getTrip(issue.trip_id);
          const trip = tripResponse.data || tripResponse;
          driverId = trip.driver_id;
          console.log('   Driver ID from trip:', driverId);
        } catch (err) {
          console.warn('Could not fetch trip details:', err);
        }
      } else if (driverId) {
        console.log('   Driver ID from issue:', driverId);
      }

      // Step 2: Update trip with new vehicle (if trip exists)
      if (issue?.trip_id) {
        try {
          console.log('📤 Sending update request to server:');
          console.log('   URL: PUT /api/trips/' + issue.trip_id);
          console.log('   Payload:', { vehicle_id: newVehicleId });
          
          const updateResponse = await api.updateTrip(issue.trip_id, {
            vehicle_id: newVehicleId,
          });
          
          console.log('📥 Full response:', updateResponse);
          
          const updatedTrip = updateResponse.data || updateResponse;
          
          console.log('📥 Update response received:', {
            trip_id: updatedTrip?.id,
            vehicle_id: updatedTrip?.vehicle_id,
            vehicle: updatedTrip?.vehicle,
            full_trip_object: updatedTrip,
          });
          
          // CRITICAL: Verify update actually succeeded
          if (parseInt(updatedTrip?.vehicle_id) !== newVehicleId) {
            console.error('❌ CRITICAL ERROR: Vehicle NOT updated in database!');
            console.error('   Expected vehicle_id:', newVehicleId);
            console.error('   Got vehicle_id:', updatedTrip?.vehicle_id);
            console.error('   This means the trip.vehicle_id was NOT saved to the database');
            throw new Error(`Trip vehicle update failed: expected ${newVehicleId}, got ${updatedTrip?.vehicle_id}`);
          }
          
          if (!updatedTrip?.vehicle) {
            console.warn('⚠️ Vehicle relationship not loaded on backend response');
          }
          
          console.log('✅ Trip update VERIFIED - vehicle_id now:', updatedTrip.vehicle_id);
        } catch (err) {
          console.error('❌ Failed to update trip with new vehicle:', err);
          throw err;
        }
      } else {
        console.log('⚠️  No trip linked to this issue - will only update driver vehicle');
      }

      // Step 3: Update driver's assigned vehicle in the driver API
      if (driverId) {
        try {
          await api.updateDriver(driverId, {
            vehicle_id: newVehicleId,
          });
          console.log('✅ Driver vehicle assignment updated in database');
        } catch (err) {
          console.warn('Could not update driver vehicle:', err);
        }
      }

      // Step 4: Create a log entry documenting the vehicle reassignment
      await api.createIssue({
        title: `🔧 Vehicle Re-assignment: ${newVehicle?.make} ${newVehicle?.model}`,
        description: `Original issue: ${issue?.title}\n\nAdmin reassigned the driver to a different vehicle.\n\nNew Vehicle: ${newVehicle?.make} ${newVehicle?.model} (${newVehicle?.license_plate})\n\nDriver ID: ${driverId}`,
        vehicle_id: newVehicleId,
        trip_id: issue?.trip_id || null,
        severity: 'medium',
        priority: 'medium',
        status: 'closed',
        reported_by: 'admin_vehicle_reassignment',
      });
      console.log('✅ Reassignment log created');

      // Step 5: Store reassignment notification for the driver
      const reassignment = {
        tripId: issue?.trip_id,
        driverId: driverId,
        oldVehicleId: issue?.vehicle_id,
        newVehicleId: newVehicleId,
        newVehicle: {
          id: newVehicle?.id,
          make: newVehicle?.make,
          model: newVehicle?.model,
          license_plate: newVehicle?.license_plate,
        },
        timestamp: new Date().toISOString(),
      };
      
      const reassignments = JSON.parse(localStorage.getItem('vehicleReassignments') || '[]');
      reassignments.push(reassignment);
      localStorage.setItem('vehicleReassignments', JSON.stringify(reassignments));
      
      console.log('📦 Reassignment stored for driver notification:', reassignment);
      
      // Refresh the issue data
      await fetchIssueData();
      setShowVehicleAssignModal(false);
      setSelectedVehicle(null);
      setError('');
      // Show success message
      alert(`✅ Vehicle successfully reassigned!\n\nDriver notified: ${newVehicle?.make} ${newVehicle?.model} (${newVehicle?.license_plate})`);
    } catch (err) {
      setError('Failed to assign vehicle: ' + (err.message || err));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await api.deleteIssue(id);
        navigate('/issues');
      } catch (err) {
        setError('Failed to delete issue');
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!issue) return <div className="text-center py-12 text-red-600">Issue not found</div>;

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
          <div className="flex gap-2 mt-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
              {issue.status?.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(issue.priority)}`}>
              {issue.priority?.replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/issues')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={() => {
              loadAvailableVehicles();
              setShowVehicleAssignModal(true);
            }}
            disabled={!issue?.vehicle_id}
            title={!issue?.vehicle_id ? 'Issue must be linked to a vehicle' : 'Assign a different vehicle to the driver'}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              !issue?.vehicle_id
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FaExchangeAlt /> Assign Vehicle
          </button>
          <button
            onClick={() => navigate(`/issues/${id}/edit`)}
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
        {/* Vehicle & Details Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle</p>
              <p className="text-lg text-gray-900 mt-1">
                {vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}
              </p>
              {vehicle?.license_plate && (
                <p className="text-sm text-gray-600 mt-1 font-mono">{vehicle.license_plate}</p>
              )}
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600">Reported Date</p>
              <p className="text-lg text-gray-900 mt-1">
                {new Date(issue.reported_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Priority Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Status</p>
              <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                {issue.status?.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600">Priority Level</p>
              <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(issue.priority)}`}>
                {issue.priority?.replace(/\b\w/g, (char) => char.toUpperCase())}
              </span>
            </div>
            {issue.trip_id && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600">Associated Trip</p>
                <p className="text-lg text-blue-700 mt-1 font-semibold">Trip #{issue.trip_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{issue.description || 'No description provided'}</p>
      </div>

      {/* Vehicle Assignment Modal */}
      {showVehicleAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaExchangeAlt /> Assign New Vehicle
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {issue?.trip_id 
                  ? `Select a replacement vehicle for Driver Trip #${issue.trip_id}`
                  : 'Select a replacement vehicle for the driver'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {availableVehicles.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  No other vehicles available for assignment
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Vehicle
                    </label>
                    <select
                      value={selectedVehicle || ''}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                    >
                      <option value="">-- Choose a vehicle --</option>
                      {availableVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} — {v.license_plate}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedVehicle && availableVehicles.find(v => v.id === parseInt(selectedVehicle)) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">Vehicle Details:</p>
                      <p className="text-gray-900 font-semibold mt-2">
                        {availableVehicles.find(v => v.id === parseInt(selectedVehicle))?.make}{' '}
                        {availableVehicles.find(v => v.id === parseInt(selectedVehicle))?.model}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {availableVehicles.find(v => v.id === parseInt(selectedVehicle))?.license_plate}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowVehicleAssignModal(false);
                  setSelectedVehicle(null);
                  setError('');
                }}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVehicle}
                disabled={isAssigning || !selectedVehicle || availableVehicles.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {isAssigning ? 'Assigning...' : 'Assign Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
