import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function ServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    service_date: new Date().toISOString().split('T')[0],
    next_service_date: '',
    cost: '',
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchVehicles();
    if (id) {
      fetchService();
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

  const fetchService = async () => {
    try {
      const response = await api.getService(id);
      const service = response.data || response;
      if (service) {
        setFormData({
          vehicle_id: service.vehicle_id ?? '',
          service_type: service.service_type ?? '',
          service_date: service.service_date ?? new Date().toISOString().split('T')[0],
          next_service_date: service.next_service_date ?? '',
          cost: service.cost ?? '',
          notes: service.notes ?? '',
          status: service.status ?? 'pending',
        });
      }
    } catch (err) {
      setError('Failed to load service');
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
    if (!formData.service_type) {
      setError('Please select a service type');
      setLoading(false);
      return;
    }
    if (!formData.service_date) {
      setError('Please select a service date');
      setLoading(false);
      return;
    }
    if (formData.cost && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
      setError('Cost must be a valid positive number');
      setLoading(false);
      return;
    }

    // Validate cost range
    if (formData.cost) {
      const cost = parseFloat(formData.cost);
      if (cost > 100000) { // Reasonable max for service costs
        setError('Cost cannot exceed $100,000');
        setLoading(false);
        return;
      }
    }

    // Validate date logic
    if (formData.next_service_date && formData.service_date) {
      const serviceDate = new Date(formData.service_date);
      const nextServiceDate = new Date(formData.next_service_date);
      if (nextServiceDate <= serviceDate) {
        setError('Next service date must be after the service date');
        setLoading(false);
        return;
      }
    }

    try {
      if (id) {
        await api.updateService(id, formData);
      } else {
        await api.createService(formData);
      }
      navigate('/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const serviceTypeOptions = [
    { value: '', label: 'Select service type' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'battery_replacement', label: 'Battery Replacement' },
    { value: 'filter_replacement', label: 'Filter Replacement' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
    { value: 'general_inspection', label: 'General Inspection' },
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
        label="Service Type"
        name="service_type"
        value={formData.service_type ?? ''}
        onChange={handleChange}
        options={serviceTypeOptions}
        required
      />
      <ModernTextInput
        label="Service Date"
        name="service_date"
        type="date"
        value={formData.service_date ?? ''}
        onChange={handleChange}
        required
      />
      <ModernTextInput
        label="Next Service Date"
        name="next_service_date"
        type="date"
        value={formData.next_service_date ?? ''}
        onChange={handleChange}
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Cost"
        name="cost"
        type="number"
        value={formData.cost ?? ''}
        onChange={handleChange}
        step="0.01"
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
          { value: 'cancelled', label: 'Cancelled' }
        ]}
      />
      <ModernTextInput
        label="Notes"
        name="notes"
        type="textarea"
        value={formData.notes ?? ''}
        onChange={handleChange}
        placeholder="Additional notes about the service..."
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Service' : 'Add New Service'}
      subtitle="Manage vehicle service information and status"
      icon={FaTools}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/services"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
