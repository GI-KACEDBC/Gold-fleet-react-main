import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaGasPump } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function FuelFillupForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    gallons: '',
    cost: '',
    fillup_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
  });

  useEffect(() => {
    fetchVehicles();
    if (id) {
      fetchFuelFillup();
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

  const fetchFuelFillup = async () => {
    try {
      const response = await api.getFuelFillup(id);
      const fuelFillup = response.data || response;
      if (fuelFillup) {
        setFormData({
          vehicle_id: fuelFillup.vehicle_id ?? '',
          driver_id: fuelFillup.driver_id ?? '',
          gallons: fuelFillup.gallons ?? '',
          cost: fuelFillup.cost ?? '',
          fillup_date: fuelFillup.fillup_date ?? new Date().toISOString().split('T')[0],
          odometer_reading: fuelFillup.odometer_reading ?? '',
        });
      }
    } catch (err) {
      setError('Failed to load fuel fillup');
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
    if (!formData.gallons || isNaN(parseFloat(formData.gallons)) || parseFloat(formData.gallons) <= 0) {
      setError('Please enter a valid gallons amount greater than 0');
      setLoading(false);
      return;
    }
    if (!formData.cost || isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) <= 0) {
      setError('Please enter a valid cost greater than 0');
      setLoading(false);
      return;
    }
    if (!formData.fillup_date) {
      setError('Please select a fillup date');
      setLoading(false);
      return;
    }
    if (!formData.odometer_reading || isNaN(parseFloat(formData.odometer_reading)) || parseFloat(formData.odometer_reading) < 0) {
      setError('Please enter a valid odometer reading');
      setLoading(false);
      return;
    }

    // Validate ranges
    const gallons = parseFloat(formData.gallons);
    const cost = parseFloat(formData.cost);
    const odometer = parseFloat(formData.odometer_reading);

    if (gallons > 1000) { // Reasonable max for fuel capacity
      setError('Gallons cannot exceed 1,000');
      setLoading(false);
      return;
    }
    if (cost > 10000) { // Reasonable max for fuel cost
      setError('Cost cannot exceed $10,000');
      setLoading(false);
      return;
    }
    if (odometer > 9999999) { // Reasonable max for odometer
      setError('Odometer reading cannot exceed 9,999,999 km');
      setLoading(false);
      return;
    }

    try {
      if (id) {
        await api.updateFuelFillup(id, formData);
      } else {
        await api.createFuelFillup(formData);
      }
      navigate('/fuel-fillups');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fuel fillup');
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
        label="Gallons"
        name="gallons"
        type="number"
        value={formData.gallons ?? ''}
        onChange={handleChange}
        step="0.01"
        required
      />
      <ModernTextInput
        label="Cost"
        name="cost"
        type="number"
        value={formData.cost ?? ''}
        onChange={handleChange}
        step="0.01"
        required
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Fillup Date"
        name="fillup_date"
        type="date"
        value={formData.fillup_date ?? ''}
        onChange={handleChange}
        required
      />
      <ModernTextInput
        label="Odometer Reading (km)"
        name="odometer_reading"
        type="number"
        value={formData.odometer_reading ?? ''}
        onChange={handleChange}
        required
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Fuel Fillup' : 'Add New Fuel Fillup'}
      subtitle="Record fuel fillup information"
      icon={FaGasPump}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/fuel-fillups"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
