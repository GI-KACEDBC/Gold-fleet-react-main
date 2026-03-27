import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaClipboardList } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function InspectionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    result: 'pass',
    notes: '',
    next_due_date: '',
  });

  useEffect(() => {
    fetchVehicles();
    if (id) {
      fetchInspection();
    }
  }, [id]);

  const fetchVehicles = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.getVehicles(),
        api.getDrivers(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (err) {
      setError('Failed to load vehicles and drivers');
    }
  };

  const fetchInspection = async () => {
    try {
      const response = await api.getInspection(id);
      const inspection = response.data || response;
      if (inspection) {
        setFormData({
          vehicle_id: inspection.vehicle_id ?? '',
          driver_id: inspection.driver_id ?? '',
          inspection_date: inspection.inspection_date ?? new Date().toISOString().split('T')[0],
          result: inspection.result ?? 'pass',
          notes: inspection.notes ?? '',
          next_due_date: inspection.next_due_date ?? '',
        });
      }
    } catch (err) {
      setError('Failed to load inspection');
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
    if (!formData.driver_id) {
      setError('Please select a driver');
      setLoading(false);
      return;
    }
    if (!formData.inspection_date) {
      setError('Please select an inspection date');
      setLoading(false);
      return;
    }

    // Validate date logic
    if (formData.next_due_date && new Date(formData.next_due_date) <= new Date(formData.inspection_date)) {
      setError('Next due date must be after the inspection date');
      setLoading(false);
      return;
    }

    try {
      if (id) {
        await api.updateInspection(id, formData);
      } else {
        await api.createInspection(formData);
      }
      navigate('/inspections');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save inspection');
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
      <ModernSelectInput
        label="Driver"
        name="driver_id"
        value={formData.driver_id ?? ''}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select a driver' },
          ...drivers.map((d) => ({
            value: d.id,
            label: d.user?.name || d.name || 'Unknown Driver'
          }))
        ]}
        required
      />
      <ModernTextInput
        label="Inspection Date"
        name="inspection_date"
        type="date"
        value={formData.inspection_date ?? ''}
        onChange={handleChange}
        required
      />
      <ModernSelectInput
        label="Result"
        name="result"
        value={formData.result ?? 'pass'}
        onChange={handleChange}
        options={[
          { value: 'pass', label: 'Pass' },
          { value: 'fail', label: 'Fail' },
          { value: 'conditional_pass', label: 'Conditional Pass' }
        ]}
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Next Due Date"
        name="next_due_date"
        type="date"
        value={formData.next_due_date ?? ''}
        onChange={handleChange}
      />
      <ModernTextInput
        label="Notes"
        name="notes"
        type="textarea"
        value={formData.notes ?? ''}
        onChange={handleChange}
        placeholder="Additional inspection notes..."
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Inspection' : 'Add New Inspection'}
      subtitle="Manage vehicle inspection records"
      icon={FaClipboardList}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/inspections"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
