import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { api } from '../services/api';
import { useFormValidation } from '../hooks/useFormValidation';
import { compressImage } from '../utils/imageCompression';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, ModernFileInput, FormFieldGroup } from '../components/ModernFormLayout';

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [setupLink, setSetupLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const form = useFormValidation(
    {
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: new Date().toISOString().split('T')[0],
      status: 'active',
      address: '',
    },
    {
      name: {
        required: 'Driver name is required',
        minLength: 'Name must be at least 2 characters',
      },
      email: {
        required: 'Email is required',
        email: 'Please enter a valid email address',
      },
      phone: {
        phone: true, // Custom phone validation
      },
      license_number: {
        required: 'License number is required',
        minLength: 'License number must be at least 5 characters',
        maxLength: 'License number must be less than 50 characters',
      },
      license_expiry: {
        required: 'License expiry date is required',
      },
      status: {
        required: 'Status is required',
      },
    }
  );

  useEffect(() => {
    if (id) {
      loadDriver();
    }
  }, [id]);

  const loadDriver = async () => {
    try {
      const data = await api.getDriver(id);
      const driver = data.data || data;
      
      // Set form fields with null->empty string conversion
      Object.keys(driver).forEach((key) => {
        if (form.values.hasOwnProperty(key)) {
          let value = driver[key] ?? '';
          // Ensure status is valid
          if (key === 'status' && !['active', 'suspended'].includes(value)) {
            value = 'active';
          }
          form.setFieldValue(key, value);
        }
      });
      
      // Set image preview if exists
      if (driver.image_url) {
        console.log('[DriverForm] Loading image:', driver.image_url);
        setPreview(driver.image_url);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load driver: ' + err.message);
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[DriverForm] Image selected:', file.name, file.type);
      try {
        const { file: compressedFile, preview } = await compressImage(file);
        setImageFile(compressedFile);
        setPreview(preview);
        console.log('[DriverForm] Image compressed and preview set');
      } catch (err) {
        console.error('[DriverForm] Image compression error:', err);
        setError('Failed to process image: ' + err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[DriverForm] Submit clicked');
    console.log('[DriverForm] Form is valid:', form.isValid);
    console.log('[DriverForm] Form values:', form.values);
    console.log('[DriverForm] Form errors:', form.errors);

    // Validate form
    if (!form.isValid) {
      console.log('[DriverForm] Form validation failed, marking all touched');
      form.setAllTouched();
      setError('Please correct the errors below and try again.');
      return;
    }

    // Check image for new drivers
    if (!id && !imageFile) {
      console.log('[DriverForm] New driver but no image provided');
      setError('Driver image is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add all form fields, ensuring status is valid
      Object.keys(form.values).forEach((key) => {
        let value = form.values[key];
        // Ensure status is valid
        if (key === 'status' && !['active', 'suspended'].includes(value)) {
          value = 'active';
        }
        formData.append(key, value ?? '');
      });

      // Add image if selected
      if (imageFile) {
        console.log('[DriverForm] Adding image file:', imageFile.name);
        formData.append('image', imageFile);
      }

      if (id) {
        console.log('[DriverForm] Updating driver ID:', id);
        formData.append('_method', 'PUT');
        await api.updateDriver(id, formData);
        navigate('/drivers');
      } else {
        console.log('[DriverForm] Creating new driver');
        const response = await api.createDriver(formData);
        const data = response.data || response;
        
        // Show setup link modal
        if (data.setup_link) {
          setSetupLink(data.setup_link);
          setShowLinkModal(true);
        } else {
          navigate('/drivers');
        }
      }
    } catch (err) {
      console.error('[DriverForm] Save error:', err);
      setError(err.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const leftBlock = (
    <FormFieldGroup>
      <ModernTextInput
        label="Name"
        name="name"
        type="text"
        value={form.values.name ?? ''}
        onChange={form.handleChange}
        placeholder="John Doe"
        error={form.errors.name}
        required
      />
      <ModernTextInput
        label="Email"
        name="email"
        type="email"
        value={form.values.email ?? ''}
        onChange={form.handleChange}
        placeholder="john@example.com"
        error={form.errors.email}
        required
      />
      <ModernTextInput
        label="Phone"
        name="phone"
        type="tel"
        value={form.values.phone ?? ''}
        onChange={form.handleChange}
        placeholder="(555) 123-4567"
        error={form.errors.phone}
        required
      />
      <ModernTextInput
        label="License Number"
        name="license_number"
        type="text"
        value={form.values.license_number ?? ''}
        onChange={form.handleChange}
        placeholder="DL-12345678"
        error={form.errors.license_number}
        required
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <ModernFileInput
        label="Driver Photo"
        onChange={handleImageChange}
        preview={preview}
        helperText="Any image format (PNG, JPG, GIF, WebP, SVG, BMP, etc.) up to 50MB"
      />
      <ModernTextInput
        label="License Expiry"
        name="license_expiry"
        type="date"
        value={form.values.license_expiry ?? ''}
        onChange={form.handleChange}
        error={form.errors.license_expiry}
        required
      />
      <ModernSelectInput
        label="Status"
        name="status"
        value={form.values.status ?? 'active'}
        onChange={form.handleChange}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' }
        ]}
        error={form.errors.status}
        required
      />
      <ModernTextInput
        label="Address"
        name="address"
        type="text"
        value={form.values.address ?? ''}
        onChange={form.handleChange}
        placeholder="123 Main St"
        error={form.errors.address}
      />
    </FormFieldGroup>
  );

  // Modal to display setup link
  if (showLinkModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver Created Successfully!</h2>
            <p className="text-gray-600 mb-4">Share this link with the driver to complete their account setup.</p>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Setup Link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={setupLink}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(setupLink);
                  alert('Setup link copied to clipboard!');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-medium"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>How to share:</strong> Send this link to the driver via email, SMS, or chat. They'll use it to set their own password and activate their account.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(setupLink);
                navigate('/drivers');
              }}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Copy & Close
            </button>
            <button
              onClick={() => navigate('/drivers')}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModernFormLayout
      title={id ? 'Edit Driver' : 'Add New Driver'}
      subtitle="Manage driver information and details"
      icon={FaUser}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/drivers"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
