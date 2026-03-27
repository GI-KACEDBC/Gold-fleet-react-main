import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function IssueForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const inspectionIdParam = searchParams.get('inspection_id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    inspection_id: inspectionIdParam || '',
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    reported_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
    if (id) {
      fetchIssue();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [vehiclesRes, inspectionsRes] = await Promise.all([
        api.getVehicles(),
        api.getInspections(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setInspections(inspectionsRes.data || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const fetchIssue = async () => {
    try {
      const issue = await api.getIssue(id);
      if (issue) {
        const issueData = issue.data || issue;
        setFormData({
          vehicle_id: issueData.vehicle_id ?? '',
          inspection_id: issueData.inspection_id ?? '',
          title: issueData.title ?? '',
          description: issueData.description ?? '',
          status: issueData.status ?? 'open',
          priority: issueData.priority ?? 'medium',
          reported_date: issueData.reported_date ?? new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      setError('Failed to load issue');
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
    if (!formData.description || formData.description.trim().length === 0) {
      setError('Please enter a description');
      setLoading(false);
      return;
    }
    if (!formData.reported_date) {
      setError('Please select a reported date');
      setLoading(false);
      return;
    }

    // Validate title length
    if (formData.title.length > 255) {
      setError('Title cannot exceed 255 characters');
      setLoading(false);
      return;
    }

    // Validate description length
    if (formData.description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      setLoading(false);
      return;
    }

    try {
      if (id) {
        await api.updateIssue(id, formData);
      } else {
        await api.createIssue(formData);
      }
      navigate('/issues');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save issue');
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
        label="Related Inspection (Optional)"
        name="inspection_id"
        value={formData.inspection_id ?? ''}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select an inspection (optional)' },
          ...inspections.map((insp) => ({
            value: insp.id,
            label: `${insp.vehicle?.license_plate} - ${new Date(insp.inspection_date).toLocaleDateString()}`
          }))
        ]}
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
        required
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernSelectInput
        label="Priority"
        name="priority"
        value={formData.priority ?? 'medium'}
        onChange={handleChange}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' }
        ]}
      />
      <ModernSelectInput
        label="Status"
        name="status"
        value={formData.status ?? 'open'}
        onChange={handleChange}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' }
        ]}
      />
      <ModernTextInput
        label="Reported Date"
        name="reported_date"
        type="date"
        value={formData.reported_date ?? ''}
        onChange={handleChange}
        required
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Issue' : 'Add New Issue'}
      subtitle="Report and manage vehicle issues"
      icon={FaExclamationTriangle}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/issues"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
