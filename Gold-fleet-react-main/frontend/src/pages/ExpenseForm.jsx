import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaDollarSign } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    category: 'fuel',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchVehicles();
    if (id) {
      fetchExpense();
    }
  }, [id]);

  const fetchVehicles = async () => {
    try {
      const response = await api.getVehicles();
      setVehicles(response.data || []);
    } catch (err) {
      setError('Failed to load vehicles');
    }
  };

  const fetchExpense = async () => {
    try {
      const expense = await api.getExpense(id);
      if (expense) {
        const expenseData = expense.data || expense;
        setFormData({
          vehicle_id: expenseData.vehicle_id ?? '',
          category: expenseData.category ?? 'fuel',
          amount: expenseData.amount ?? '',
          expense_date: expenseData.expense_date ?? new Date().toISOString().split('T')[0],
          notes: expenseData.notes ?? '',
        });
      }
    } catch (err) {
      setError('Failed to load expense');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      setLoading(false);
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      setLoading(false);
      return;
    }
    if (!formData.expense_date) {
      setError('Please select an expense date');
      setLoading(false);
      return;
    }

    // Validate amount format and range
    const amount = parseFloat(formData.amount);
    if (amount > 1000000) { // Reasonable max for expenses
      setError('Amount cannot exceed $1,000,000');
      setLoading(false);
      return;
    }
    try {
      if (id) {
        await api.updateExpense(id, formData);
      } else {
        await api.createExpense(formData);
      }
      navigate('/expenses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };
  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'repair', label: 'Repair' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'tolls', label: 'Tolls' },
    { value: 'parking', label: 'Parking' },
    { value: 'registration', label: 'Registration' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' }
  ];

  const leftBlock = (
    <FormFieldGroup>
      <ModernSelectInput
        label="Vehicle"
        name="vehicle_id"
        value={formData.vehicle_id ?? ''}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select a vehicle' },
          ...vehicles.map((v) => ({
            value: v.id,
            label: `${v.make} ${v.model} (${v.license_plate})`
          }))
        ]}
        required
      />
      <ModernSelectInput
        label="Category"
        name="category"
        value={formData.category ?? ''}
        onChange={handleChange}
        options={categoryOptions}
        required
      />
      <ModernTextInput
        label="Amount"
        name="amount"
        type="number"
        value={formData.amount ?? ''}
        onChange={handleChange}
        step="0.01"
        required
      />
      <ModernTextInput
        label="Expense Date"
        name="expense_date"
        type="date"
        value={formData.expense_date ?? ''}
        onChange={handleChange}
        required
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Notes"
        name="notes"
        type="textarea"
        value={formData.notes ?? ''}
        onChange={handleChange}
        placeholder="Additional notes about this expense..."
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Expense' : 'Add New Expense'}
      subtitle="Track vehicle expenses and costs"
      icon={FaDollarSign}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/expenses"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
