import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaFolderOpen, FaImage } from 'react-icons/fa';
import { api } from '../services/api';

/**
 * AdminInspectionReports Component
 * Admins view and review driver-submitted maintenance checklists
 */
export default function AdminInspectionReports() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending'); // pending, reviewed, all

  useEffect(() => {
    loadPendingInspections();
  }, [filterStatus]);

  const loadPendingInspections = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getPendingInspectionReviews();
      let data = response.data || [];

      // Filter based on selection
      if (filterStatus === 'reviewed') {
        data = data.filter(i => i.admin_reviewed);
      } else if (filterStatus === 'pending') {
        data = data.filter(i => !i.admin_reviewed);
      }

      setInspections(data.sort((a, b) => 
        new Date(b.submitted_at) - new Date(a.submitted_at)
      ));
    } catch (err) {
      setError('Failed to load inspections: ' + (err.message || ''));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (inspectionId, result, adminNotes) => {
    setReviewLoading(true);
    try {
      await api.reviewInspection(inspectionId, {
        result,
        admin_notes: adminNotes,
      });

      setSelectedInspection(null);
      loadPendingInspections();
    } catch (err) {
      setError('Failed to review inspection: ' + (err.message || ''));
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (inspection) => {
    if (!inspection.submitted_by_driver) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Not Submitted</span>;
    }
    if (!inspection.admin_reviewed) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><FaClock size={12} /> Pending Review</span>;
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        inspection.result === 'pass'
          ? 'bg-green-100 text-green-700 flex items-center gap-1'
          : inspection.result === 'fail'
          ? 'bg-red-100 text-red-700 flex items-center gap-1'
          : 'bg-blue-100 text-blue-700 flex items-center gap-1'
      }`}>
        {inspection.result === 'pass' && <FaCheckCircle size={12} />}
        {inspection.result === 'fail' && <FaTimesCircle size={12} />}
        {inspection.result?.replace('_', ' ') || 'Reviewed'}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Maintenance Inspection Reports</h1>
          <p className="text-gray-600">Review and approve/reject driver-submitted maintenance checklists</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            <FaClock className="inline mr-2" />
            Pending ({inspections.filter(i => !i.admin_reviewed).length})
          </button>
          <button
            onClick={() => setFilterStatus('reviewed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'reviewed'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            <FaCheckCircle className="inline mr-2" />
            Reviewed ({inspections.filter(i => i.admin_reviewed).length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            <FaFolderOpen className="inline mr-2" />
            All
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Loading inspections...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && inspections.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaFolderOpen className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filterStatus === 'pending' && 'No pending inspection reviews'}
              {filterStatus === 'reviewed' && 'No reviewed inspections'}
              {filterStatus === 'all' && 'No inspection reports found'}
            </p>
          </div>
        )}

        {/* Inspections Table */}
        {!loading && inspections.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Driver</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {inspection.driver?.user?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {inspection.vehicle?.make} {inspection.vehicle?.model}
                      <br />
                      <span className="text-xs text-gray-500">{inspection.vehicle?.license_plate}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inspection.submitted_at
                        ? new Date(inspection.submitted_at).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {inspection.checklist_items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(inspection)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedInspection(inspection)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <FaEye /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inspection Detail Modal */}
        {selectedInspection && (
          <InspectionDetailModal
            inspection={selectedInspection}
            onClose={() => setSelectedInspection(null)}
            onReview={handleReview}
            loading={reviewLoading}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Modal for reviewing individual inspection
 */
function InspectionDetailModal({ inspection, onClose, onReview, loading }) {
  const [result, setResult] = useState(inspection.result || 'pass');
  const [adminNotes, setAdminNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onReview(inspection.id, result, adminNotes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
          <h2 className="text-2xl font-bold">Inspection Details</h2>
          <p className="text-blue-100 text-sm mt-1">
            {inspection.driver?.user?.name} - {inspection.vehicle?.make} {inspection.vehicle?.model}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Inspection Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Submitted</p>
              <p className="font-medium text-gray-900">
                {new Date(inspection.submitted_at).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-medium text-gray-900">
                {inspection.admin_reviewed ? 'Reviewed' : 'Pending Review'}
              </p>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Checklist Items</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {inspection.checklist_items?.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-start gap-3">
                    {item.checked ? (
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-gray-300 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${item.checked ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Notes:</strong> {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Notes */}
          {inspection.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Driver Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">
                {inspection.notes}
              </p>
            </div>
          )}

          {/* Maintenance Image */}
          {inspection.inspection_image_path && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaImage /> Maintenance Image
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <img 
                  src={`http://localhost:8000/storage/${inspection.inspection_image_path}`}
                  alt="Maintenance" 
                  className="max-w-full h-auto rounded-lg max-h-96 object-cover w-full"
                />
              </div>
            </div>
          )}

          {/* Review Form (only if not already reviewed) */}
          {!inspection.admin_reviewed && (
            <form onSubmit={handleSubmit} className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Review & Approve</h3>

              {/* Result Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Result *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'pass', label: 'Approved ✓', color: 'green' },
                    { value: 'conditional_pass', label: 'Conditionally Approved ⚠', color: 'blue' },
                    { value: 'fail', label: 'Failed ✗', color: 'red' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="result"
                        value={option.value}
                        checked={result === option.value}
                        onChange={(e) => setResult(e.target.value)}
                        className={`w-4 h-4 text-${option.color}-600`}
                      />
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any feedback or additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Reviewing...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Close Button */}
          {inspection.admin_reviewed && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
