import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaPlus, FaTrash, FaImage, FaTimes } from 'react-icons/fa';
import { api } from '../services/api';

/**
 * DriverMaintenanceChecklist Component
 * Allows drivers to submit vehicle maintenance checklists
 * Checklist items get reported to company admin with notifications
 */
export default function DriverMaintenanceChecklist() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fromTrip = null, vehicleId = null, tripId = null } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default maintenance check items
  const DEFAULT_ITEMS = [
    { name: 'Brakes', checked: false, is_spoilt: false, notes: '' },
    { name: 'Tires', checked: false, is_spoilt: false, notes: '' },
    { name: 'Lights (Front & Back)', checked: false, is_spoilt: false, notes: '' },
    { name: 'Engine Oil Level', checked: false, is_spoilt: false, notes: '' },
    { name: 'Mirrors', checked: false, is_spoilt: false, notes: '' },
    { name: 'Horn', checked: false, is_spoilt: false, notes: '' },
    { name: 'Windshield Wipers', checked: false, is_spoilt: false, notes: '' },
    { name: 'Battery', checked: false, is_spoilt: false, notes: '' },
  ];

  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    checklist_items: DEFAULT_ITEMS,
    notes: '',
    trip_id: tripId || null,
  });
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  // Advanced workflow prevention
  const submissionRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionDetails, setCompletionDetails] = useState(null);

  // Load vehicles when component mounts
  useEffect(() => {
    loadVehicles();
  }, [vehicleId]);

  // If trip has vehicle data embedded, use it immediately
  useEffect(() => {
    if (fromTrip?.vehicle && !selectedVehicle) {
      setSelectedVehicle(fromTrip.vehicle);
      setFormData(prev => ({
        ...prev,
        vehicle_id: String(fromTrip.vehicle.id),
      }));
    }
  }, [fromTrip]);

  const loadVehicles = async () => {
    try {
      const response = await api.getVehicles();
      const allVehicles = response.data || [];
      setVehicles(allVehicles);

      // If a vehicle ID was provided (from trip), select it
      if (vehicleId) {
        const numVehicleId = typeof vehicleId === 'string' ? parseInt(vehicleId) : vehicleId;
        let vehicle = allVehicles.find(v => {
          const vId = typeof v.id === 'string' ? parseInt(v.id) : v.id;
          return vId === numVehicleId;
        });
        
        // Fallback: check if fromTrip has a vehicle object
        if (!vehicle && fromTrip?.vehicle) {
          vehicle = fromTrip.vehicle;
          // Ensure vehicle has an id field
          if (!vehicle.id && vehicleId) {
            vehicle.id = vehicleId;
          }
        }
        
        if (vehicle) {
          setSelectedVehicle(vehicle);
          // Also update formData with the vehicle ID
          setFormData(prev => ({
            ...prev,
            vehicle_id: String(vehicle.id),
          }));
          console.log('✓ Vehicle loaded:', vehicle);
        } else {
          console.warn('Vehicle not found. vehicleId:', vehicleId, 'fromTrip.vehicle:', fromTrip?.vehicle, 'Available:', allVehicles.map(v => v.id));
        }
      }
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    }
  };

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
    }));
    
    // Update selectedVehicle for display
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId || v.id === parseInt(vehicleId));
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    } else {
      setSelectedVehicle(null);
    }
  };

  const handleItemChecked = (index, checked) => {
    const newItems = [...formData.checklist_items];
    newItems[index].checked = checked;
    setFormData(prev => ({
      ...prev,
      checklist_items: newItems,
    }));
  };

  const handleItemNotesChange = (index, notes) => {
    const newItems = [...formData.checklist_items];
    newItems[index].notes = notes;
    setFormData(prev => ({
      ...prev,
      checklist_items: newItems,
    }));
  };

  const handleItemSpoilt = (index, is_spoilt) => {
    const newItems = [...formData.checklist_items];
    newItems[index].is_spoilt = is_spoilt;
    setFormData(prev => ({
      ...prev,
      checklist_items: newItems,
    }));
  };

  const addCustomItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist_items: [
        ...prev.checklist_items,
        { name: 'Custom Item', checked: false, is_spoilt: false, notes: '' },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.filter((_, i) => i !== index),
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  // Validate inspection completion (all items must be marked as either OK or Spoilt)
  const validateInspectionCompletion = () => {
    const incompleteItems = formData.checklist_items.filter(
      item => !item.checked && !item.is_spoilt
    );
    return incompleteItems;
  };

  // Transform checklist items to API format and detect issues
  const prepareInspectionData = () => {
    const items = formData.checklist_items.map((item) => ({
      item_name: item.name,
      status: item.is_spoilt ? 'fail' : 'ok',
      notes: item.notes || '',
    }));

    const spoiltItems = formData.checklist_items.filter(item => item.is_spoilt);
    const hasFailures = spoiltItems.length > 0;

    return {
      items,
      spoiltItems,
      hasFailures,
    };
  };

  // Create issue reports for spoilt parts
  const reportSpoiltParts = async (inspectionId) => {
    try {
      const { spoiltItems } = prepareInspectionData();
      
      if (spoiltItems.length === 0) return { success: true, issueCount: 0 };

      const issuesCreated = [];
      
      for (const item of spoiltItems) {
        try {
          const issueData = {
            vehicle_id: formData.vehicle_id,
            trip_id: formData.trip_id,
            title: `🔴 Pre-Trip Inspection Issue: ${item.name}`,
            description: `Driver reported ${item.name} is spoilt/damaged during pre-trip inspection.${item.notes ? `\n\nDriver Notes: ${item.notes}` : ''}`,
            severity: 'high',
            priority: 'high',
            status: 'open',
            reported_by: 'driver_inspection',
            inspection_id: inspectionId,
          };
          
          const response = await api.createIssue(issueData);
          if (response.data?.id) {
            issuesCreated.push(response.data);
            console.log('✓ Issue created:', response.data.id);
          }
        } catch (issueErr) {
          console.error(`Failed to create issue for ${item.name}:`, issueErr);
        }
      }

      return { success: true, issueCount: issuesCreated.length };
    } catch (err) {
      console.error('Error in reportSpoiltParts:', err);
      return { success: false, issueCount: 0, error: err };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Advanced workflow prevention - prevent double submission
    if (isSubmitting || submissionRef.current) {
      console.warn('Submission already in progress...');
      return;
    }

    // Validate inspection completion
    const incompleteItems = validateInspectionCompletion();
    if (incompleteItems.length > 0) {
      setError(
        `Please complete all inspections. Incomplete items: ${incompleteItems.map(i => i.name).join(', ')}`
      );
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    setIsSubmitting(true);
    submissionRef.current = true;

    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      setLoading(false);
      setIsSubmitting(false);
      submissionRef.current = null;
      return;
    }

    try {
      // Prepare inspection data
      const { items, spoiltItems, hasFailures } = prepareInspectionData();
      
      const inspectionPayload = {
        vehicle_id: formData.vehicle_id,
        trip_id: formData.trip_id,
        inspection_date: new Date().toISOString().split('T')[0],
        notes: formData.notes || 'Pre-trip vehicle inspection completed',
        items: items,
        result: hasFailures ? 'fail' : 'pass',
        status: hasFailures ? 'failed' : 'passed',
      };

      // Submit inspection
      const response = await api.submitMaintenanceChecklist(inspectionPayload);
      const inspectionId = response.data?.id;

      console.log('✓ Inspection submitted:', inspectionId);

      // Upload image if selected
      if (selectedImage && inspectionId) {
        try {
          await api.uploadInspectionImage(inspectionId, selectedImage);
          console.log('✓ Inspection image uploaded');
        } catch (imageErr) {
          console.warn('Image upload failed (non-critical):', imageErr);
        }
      }

      // Report spoilt parts to admin if any
      let issueReportResult = { success: true, issueCount: 0 };
      if (hasFailures) {
        issueReportResult = await reportSpoiltParts(inspectionId);
      }

      // Prepare completion details
      const completionInfo = {
        inspectionId,
        hasFailures,
        failureCount: spoiltItems.length,
        issuesReported: issueReportResult.issueCount,
        vehicleInfo: selectedVehicle || fromTrip?.vehicle,
      };
      setCompletionDetails(completionInfo);

      // Build success message
      let successMsg = '✓ Vehicle inspection completed successfully!';
      if (hasFailures) {
        successMsg += `\n⚠ ${spoiltItems.length} issue(s) found and reported to your company admin.`;
        successMsg += `\n📋 Issues created: ${issueReportResult.issueCount}`;
      }
      successMsg += '\n🚗 Redirecting to trip overview...';
      
      setSuccess(successMsg);

      // Reset form
      setFormData({
        vehicle_id: vehicleId || '',
        checklist_items: DEFAULT_ITEMS.map(item => ({ ...item })),
        notes: '',
        trip_id: tripId || null,
      });
      setSelectedImage(null);
      setImagePreview('');

      // Redirect after 2.5 seconds
      setTimeout(() => {
        if (fromTrip) {
          // Return to trip overview/map with completion context
          navigate('/driver/dashboard', { 
            state: { 
              selectedTrip: fromTrip,
              inspectionCompleted: true,
              inspectionStatus: hasFailures ? 'completed_with_issues' : 'passed',
              successMessage: hasFailures 
                ? `Vehicle inspected with ${spoiltItems.length} issue(s). Issues reported to admin.`
                : 'Vehicle pre-trip inspection passed! Ready to proceed.'
            }
          });
        } else {
          navigate('/driver/dashboard');
        }
      }, 2500);
    } catch (err) {
      console.error('Inspection submission error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to submit inspection. Please try again.'
      );
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      submissionRef.current = null;
    }
  };

  const checkedCount = formData.checklist_items.filter(item => item.checked || item.is_spoilt).length;
  const totalItems = formData.checklist_items.length;
  const completionPercentage = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const spoiltItemsCount = formData.checklist_items.filter(item => item.is_spoilt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Maintenance Checklist
          </h1>
          <p className="text-gray-600">
            Complete this checklist before or after your trip. Your admin will be notified.
          </p>
        </div>

        {/* Trip Information Alert - shown when coming from assigned trip */}
        {fromTrip && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Trip Assigned for Pre-Departure Inspection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-semibold">Trip ID:</p>
                <p>{fromTrip.id}</p>
              </div>
              <div>
                <p className="font-semibold">Status:</p>
                <p className="capitalize">{fromTrip.status}</p>
              </div>
              <div>
                <p className="font-semibold">From:</p>
                <p>{fromTrip.start_location || 'TBD'}</p>
              </div>
              <div>
                <p className="font-semibold">To:</p>
                <p>{fromTrip.end_location || 'TBD'}</p>
              </div>
              {fromTrip.date && (
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(fromTrip.date).toLocaleDateString()}</p>
                </div>
              )}
              {fromTrip.time && (
                <div>
                  <p className="font-semibold">Scheduled Time:</p>
                  <p>{fromTrip.time}</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-blue-900 font-semibold">✓ Please inspect the vehicle before proceeding on this trip.</p>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Form Content */}
          <div className="p-8">
            {/* Vehicle Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Vehicle *
              </label>
              {fromTrip && (selectedVehicle || fromTrip?.vehicle) ? (
                // Display vehicle info when coming from trip
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Make & Model</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(selectedVehicle?.make || fromTrip?.vehicle?.make)} {(selectedVehicle?.model || fromTrip?.vehicle?.model)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">License Plate</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedVehicle?.license_plate || fromTrip?.vehicle?.license_plate}
                      </p>
                    </div>
                    {(selectedVehicle?.vin || fromTrip?.vehicle?.vin) && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">VIN</p>
                        <p className="text-sm text-gray-900">{selectedVehicle?.vin || fromTrip?.vehicle?.vin}</p>
                      </div>
                    )}
                    {(selectedVehicle?.year || fromTrip?.vehicle?.year) && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Year</p>
                        <p className="text-sm text-gray-900">{selectedVehicle?.year || fromTrip?.vehicle?.year}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : fromTrip && !selectedVehicle && !fromTrip?.vehicle ? (
                // Loading state while vehicle is being fetched
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 font-semibold">Loading vehicle details...</p>
                </div>
              ) : (
                // Show dropdown when not from trip
                <select
                  value={formData.vehicle_id}
                  onChange={handleVehicleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Completion: {checkedCount} of {totalItems}
                </span>
                <span className="text-lg font-bold text-yellow-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              {/* Issues Summary */}
              {spoiltItemsCount > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-semibold text-red-700">
                    ⚠ {spoiltItemsCount} issue(s) detected - Will be reported to admin
                  </p>
                  <div className="text-xs text-red-600 mt-1 space-y-1">
                    {formData.checklist_items
                      .filter(item => item.is_spoilt)
                      .map((item, idx) => (
                        <p key={idx}>• {item.name} {item.notes ? `- ${item.notes}` : ''}</p>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checklist Items */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Inspection Items
              </h2>
              <div className="space-y-4">
                {formData.checklist_items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition ${
                      item.is_spoilt 
                        ? 'border-red-300 bg-red-50 hover:border-red-400' 
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Item Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          {item.is_spoilt ? (
                            <FaTimesCircle className="text-red-500 text-lg flex-shrink-0 mt-1" />
                          ) : item.checked ? (
                            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0 mt-1" />
                          ) : (
                            <FaTimesCircle className="text-gray-300 text-lg flex-shrink-0 mt-1" />
                          )}
                          <label className={`font-semibold ${
                            item.is_spoilt 
                              ? 'text-red-700' 
                              : item.checked ? 'text-green-700 line-through' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </label>
                        </div>

                        {/* Checkboxes Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 p-3 bg-white rounded border border-gray-100">
                          {/* Checkbox 1: OK/Checked */}
                          <div className="flex items-center gap-3 p-2 rounded hover:bg-green-50 transition">
                            <input
                              type="checkbox"
                              id={`checked-${index}`}
                              checked={item.checked && !item.is_spoilt}
                              onChange={(e) => {
                                handleItemChecked(index, e.target.checked);
                                if (e.target.checked) {
                                  handleItemSpoilt(index, false);
                                }
                              }}
                              className="w-5 h-5 text-green-600 rounded cursor-pointer"
                              disabled={item.is_spoilt}
                            />
                            <label htmlFor={`checked-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                              ✓ OK / Checked
                            </label>
                          </div>

                          {/* Checkbox 2: Spoilt/Damaged */}
                          <div className="flex items-center gap-3 p-2 rounded hover:bg-red-50 transition">
                            <input
                              type="checkbox"
                              id={`spoilt-${index}`}
                              checked={item.is_spoilt}
                              onChange={(e) => {
                                handleItemSpoilt(index, e.target.checked);
                                if (e.target.checked) {
                                  handleItemChecked(index, false);
                                }
                              }}
                              className="w-5 h-5 text-red-600 rounded cursor-pointer"
                            />
                            <label htmlFor={`spoilt-${index}`} className="text-sm font-medium text-red-700 cursor-pointer">
                              ✗ Spoilt / Damaged
                            </label>
                          </div>
                        </div>

                        {/* Notes Input */}
                        <textarea
                          value={item.notes}
                          onChange={(e) => handleItemNotesChange(index, e.target.value)}
                          placeholder={item.is_spoilt ? "Describe the damage or issue..." : "Add notes if there's an issue..."}
                          className={`w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:border-transparent outline-none resize-none ${
                            item.is_spoilt
                              ? 'border-red-300 focus:ring-red-400 bg-red-50'
                              : 'border-gray-200 focus:ring-yellow-400'
                          }`}
                          rows="2"
                        />
                      </div>

                      {/* Remove Button (for custom items) */}
                      {index >= DEFAULT_ITEMS.length && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 pt-2"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={addCustomItem}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-500 hover:text-yellow-600 transition flex items-center justify-center gap-2 font-medium"
              >
                <FaPlus /> Add Custom Item
              </button>
            </div>

            {/* Image Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Maintenance Image
              </label>
              <p className="text-xs text-gray-600 mb-4">
                Upload a photo of any vehicle issues or maintenance work completed
              </p>

              {imagePreview ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-w-xs h-auto rounded-lg border-2 border-gray-300" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <FaImage className="text-4xl text-gray-400" />
                    <p className="text-gray-600 font-medium">Click to upload image</p>
                    <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP (max 5MB)</p>
                  </div>
                </label>
              )}
            </div>

            {/* General Notes */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional observations or concerns..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
                rows="4"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/driver/dashboard')}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isSubmitting || !formData.vehicle_id || completionPercentage < 100}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                  completionPercentage < 100
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⏳</span>
                    Submitting...
                  </span>
                ) : completionPercentage < 100 ? (
                  `Complete Inspection (${completionPercentage}%)`
                ) : isSubmitting ? (
                  'Processing...'
                ) : (
                  `✓ Submit Inspection ${spoiltItemsCount > 0 ? `(${spoiltItemsCount} issues)` : ''}`
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className={`mt-8 p-6 rounded-lg ${
          spoiltItemsCount > 0
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            spoiltItemsCount > 0 ? 'text-red-900' : 'text-blue-900'
          }`}>
            {spoiltItemsCount > 0 ? '⚠ Issues Detected - Workflow' : '✓ Inspection Workflow'}
          </h3>
          <ul className={`text-sm space-y-2 ${
            spoiltItemsCount > 0 ? 'text-red-800' : 'text-blue-800'
          }`}>
            {spoiltItemsCount > 0 ? (
              <>
                <li>🔴 {spoiltItemsCount} part(s) marked as spoilt/damaged</li>
                <li>📢 Automatically creating issue report(s) for your admin</li>
                <li>🔔 Admin will receive real-time notification</li>
                <li>📋 Issues will have HIGH priority and require immediate attention</li>
                <li>👤 You can still proceed with the trip</li>
                <li>💬 Admin may contact you about the reported issues</li>
              </>
            ) : (
              <>
                <li>✓ Inspection will be submitted to your company admin</li>
                <li>✓ All parts verified as working correctly</li>
                <li>✓ Quick notification sent to admins</li>
                <li>✓ You may proceed with your trip</li>
                <li>✓ Redirecting to trip overview after submission</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
