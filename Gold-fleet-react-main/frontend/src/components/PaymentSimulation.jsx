import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaPlus, FaTrash, FaCheck, FaCreditCard } from 'react-icons/fa';

export const PaymentSimulation = ({ selectedPlan, subscriptionId, onPaymentProcessed, onSimulationsUpdate }) => {
  const [simulations, setSimulations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    simulated_amount: selectedPlan?.price || 0,
    payment_method: 'credit_card',
    payment_date: new Date().toISOString().split('T')[0],
    due_date: '',
    card_number: '',
    expiry_date: '',
    cvc: '',
  });

  // Fetch payment simulations on component mount
  useEffect(() => {
    fetchPaymentSimulations();
  }, [subscriptionId]);

  // Notify parent when simulations list changes
  useEffect(() => {
    onSimulationsUpdate?.(simulations);
  }, [simulations, onSimulationsUpdate]);

  // Auto-update amount based on selected plan
  useEffect(() => {
    if (selectedPlan?.price !== undefined) {
      setFormData(prev => ({
        ...prev,
        simulated_amount: selectedPlan.price
      }));
    }
  }, [selectedPlan]);

  const fetchPaymentSimulations = async () => {
    try {
      setLoading(true);
      const response = await api.getPaymentSimulationsBySubscription(subscriptionId);
      setSimulations(Array.isArray(response) ? response : (response.data || []));
    } catch (err) {
      console.error('Error fetching payment simulations:', err);
      setError('Failed to load payment simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'simulated_amount' ? 
        (isNaN(value) ? value : Number(value)) : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        subscription_id: subscriptionId,
        ...formData,
        simulated_amount: Number(formData.simulated_amount),
        simulated_vehicles: 0,
        simulated_drivers: 0,
        simulated_users: 0,
      };

      if (editingId) {
        await api.updatePaymentSimulation(editingId, payload);
        setSuccess('Payment simulation updated successfully');
      } else {
        await api.createPaymentSimulation(payload);
        setSuccess('Payment simulation created successfully');
      }

      // Reset form
      setFormData({
        simulated_amount: selectedPlan?.price || 0,
        payment_method: 'credit_card',
        payment_date: new Date().toISOString().split('T')[0],
        due_date: '',
        card_number: '',
        expiry_date: '',
        cvc: '',
      });
      setShowForm(false);
      setEditingId(null);

      // Refresh list
      fetchPaymentSimulations();
      onPaymentProcessed?.();
    } catch (err) {
      console.error('Error:', err);
      if (err.data?.errors) {
        setError(Object.values(err.data.errors).flat().join(', '));
      } else {
        setError(err.message || 'Failed to save payment simulation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (simulation) => {
    setEditingId(simulation.id);
    setFormData({
      simulated_amount: simulation.simulated_amount,
      payment_method: simulation.payment_method,
      payment_date: simulation.payment_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      due_date: simulation.due_date?.split('T')[0] || '',
      card_number: simulation.card_number || '',
      expiry_date: simulation.expiry_date || '',
      cvc: simulation.cvc || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment simulation?')) return;

    try {
      setLoading(true);
      await api.deletePaymentSimulation(id);
      setSuccess('Payment simulation deleted successfully');
      fetchPaymentSimulations();
    } catch (err) {
      setError('Failed to delete payment simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (id) => {
    try {
      setLoading(true);
      const simulation = simulations.find(s => s.id === id);
      await api.processPaymentSimulation(id, {
        payment_method: simulation.payment_method,
        payment_date: simulation.payment_date || new Date().toISOString(),
      });
      setSuccess('Payment processed successfully');
      fetchPaymentSimulations();
      onPaymentProcessed?.(id);
    } catch (err) {
      setError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatPaymentMethod = (method) => {
    const methodMap = {
      'credit_card_visa': 'Credit Card (Visa)',
      'credit_card_mastercard': 'Credit Card (Mastercard)',
      'credit_card_amex': 'Credit Card (American Express)',
      'credit_card_discover': 'Credit Card (Discover)',
      'paypal': 'PayPal',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'other': 'Other'
    };
    return methodMap[method] || method;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
          <p className="text-sm text-gray-600 mt-1">Add payment methods to test your subscription</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                simulated_amount: selectedPlan?.price || 0,
                payment_method: 'credit_card',
                payment_date: new Date().toISOString().split('T')[0],
                due_date: '',
                card_number: '',
                expiry_date: '',
                cvc: '',
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            <FaPlus size={14} /> Add Payment
          </button>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 text-sm">
          <FaCheck size={14} /> {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Payment' : 'Create Payment'}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plan Information */}
            {selectedPlan && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Plan</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Price</p>
                    <p className="font-medium text-gray-900 mt-1">${parseFloat(selectedPlan.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Trial Period</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedPlan.trial_days} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                  <input
                    type="text"
                    value={parseFloat(formData.simulated_amount).toFixed(2)}
                    disabled
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Automatically calculated from your plan</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="Credit & Debit Cards">
                    <option value="credit_card_visa">Visa Card</option>
                    <option value="credit_card_mastercard">Mastercard</option>
                    <option value="credit_card_amex">American Express</option>
                    <option value="credit_card_discover">Discover</option>
                  </optgroup>
                  <optgroup label="Digital Wallets">
                    <option value="paypal">PayPal</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="google_pay">Google Pay</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Card Payment Fields */}
            {formData.payment_method.includes('credit_card') && (
              <div className="border-t border-gray-200 pt-5">
                <h5 className="font-medium text-gray-900 mb-4">Card Details</h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="card_number"
                      value={formData.card_number}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiry_date"
                        value={formData.expiry_date}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm transition-colors"
              >
                {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Create Payment'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments List */}
      {!loading && simulations.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">No payments yet. Click "Add Payment" to create one.</p>
        </div>
      )}

      {simulations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Payments</h4>
          {simulations.map((simulation) => (
            <div
              key={simulation.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        ${Number(simulation.simulated_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatPaymentMethod(simulation.payment_method)} • {new Date(simulation.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        simulation.payment_status
                      )}`}
                    >
                      {simulation.payment_status?.charAt(0).toUpperCase() +
                        simulation.payment_status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {simulation.payment_status === 'pending' && (
                    <button
                      onClick={() => handleProcessPayment(simulation.id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium hover:bg-green-100 disabled:opacity-50 transition-colors"
                    >
                      Process
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(simulation)}
                    disabled={loading || simulation.payment_status !== 'pending'}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(simulation.id)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && !showForm && (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSimulation;
