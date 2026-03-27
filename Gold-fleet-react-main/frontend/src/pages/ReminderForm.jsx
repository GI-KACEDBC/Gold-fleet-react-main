import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function ReminderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
  });

  useEffect(() => {
    fetchVehicles();
    if (id) {
      fetchReminder();
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

  const fetchReminder = async () => {
    try {
      const reminder = await api.getReminder(id);
      if (reminder) {
        const reminderData = reminder.data || reminder;
        setFormData({
          vehicle_id: reminderData.vehicle_id ?? '',
          title: reminderData.title ?? '',
          description: reminderData.description ?? '',
          due_date: reminderData.due_date ?? new Date().toISOString().split('T')[0],
          priority: reminderData.priority ?? 'medium',
          status: reminderData.status ?? 'pending',
        });
      }
    } catch (err) {
      setError('Failed to load reminder');
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
    if (!formData.title || formData.title.trim().length === 0) {
      setError('Please enter a title');
      setLoading(false);
      return;
    }
    if (!formData.due_date) {
      setError('Please select a due date');
      setLoading(false);
      return;
    }

    // Validate title length
    if (formData.title.length > 255) {
      setError('Title cannot exceed 255 characters');
      setLoading(false);
      return;
    }

    // Validate description length if provided
    if (formData.description && formData.description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      setLoading(false);
      return;
    }

    // Validate due date is not in the past (optional - reminders can be overdue)
    const today = new Date().toISOString().split('T')[0];
    if (formData.due_date < today && formData.status === 'pending') {
      // Allow overdue reminders but warn about them
      console.warn('Reminder due date is in the past');
    }

    try {
      if (id) {
        await api.updateReminder(id, formData);
      } else {
        await api.createReminder(formData);
      }
      navigate('/reminders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

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
      <ModernTextInput
        label="Title"
        name="title"
        type="text"
        value={formData.title ?? ''}
        onChange={handleChange}
        required
      />
      <ModernTextInput
        label="Description"
        name="description"
        type="textarea"
        value={formData.description ?? ''}
        onChange={handleChange}
        placeholder="Enter reminder details..."
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Due Date"
        name="due_date"
        type="date"
        value={formData.due_date ?? ''}
        onChange={handleChange}
        required
      />
      <ModernSelectInput
        label="Priority"
        name="priority"
        value={formData.priority ?? 'medium'}
        onChange={handleChange}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ]}
      />
      <ModernSelectInput
        label="Status"
        name="status"
        value={formData.status ?? 'pending'}
        onChange={handleChange}
        options={[
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'overdue', label: 'Overdue' }
        ]}
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Reminder' : 'Add New Reminder'}
      subtitle="Create and manage vehicle reminders"
      icon={FaBell}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/reminders"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
