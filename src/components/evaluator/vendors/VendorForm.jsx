/**
 * VendorForm Component
 * 
 * Form for creating and editing vendors.
 * Handles vendor details and initial contact.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 5 - Vendor Management (Task 5A.5)
 */

import React, { useState, useEffect } from 'react';
import { 
  X,
  Building2,
  Globe,
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  Save,
  AlertCircle
} from 'lucide-react';
import { VENDOR_STATUS_CONFIG, VENDOR_STATUSES } from '../../../services/evaluator';
import './VendorForm.css';

function VendorForm({ 
  vendor = null, // null for create, vendor object for edit
  onSubmit,
  onCancel,
  isSubmitting = false
}) {
  const isEditing = !!vendor;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    notes: '',
    status: VENDOR_STATUSES.IDENTIFIED
  });

  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    is_primary: true
  });

  const [includeContact, setIncludeContact] = useState(!isEditing);
  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        description: vendor.description || '',
        website: vendor.website || '',
        notes: vendor.notes || '',
        status: vendor.status || VENDOR_STATUSES.IDENTIFIED
      });
    }
  }, [vendor]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleContactChange = (field, value) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is modified
    if (errors[`contact_${field}`]) {
      setErrors(prev => ({ ...prev, [`contact_${field}`]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    // Validate website URL format if provided
    if (formData.website.trim()) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = 'Please enter a valid URL';
      }
    }

    // Validate contact if including one
    if (includeContact && !isEditing) {
      if (!contactData.name.trim() && !contactData.email.trim()) {
        newErrors.contact_name = 'Contact name or email is required';
      }
      
      if (contactData.email.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(contactData.email)) {
          newErrors.contact_email = 'Please enter a valid email address';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const submitData = {
      ...formData,
      contact: includeContact && !isEditing ? contactData : null
    };

    onSubmit?.(submitData);
  };

  return (
    <div className="vendor-form-overlay" onClick={onCancel}>
      <div className="vendor-form-modal" onClick={e => e.stopPropagation()}>
        <div className="vendor-form-header">
          <h2>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          <button className="vendor-form-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vendor-form">
          {/* Vendor Details Section */}
          <div className="vendor-form-section">
            <h3 className="vendor-form-section-title">
              <Building2 size={18} />
              Vendor Details
            </h3>

            <div className="vendor-form-field">
              <label htmlFor="vendor-name">
                Vendor Name <span className="required">*</span>
              </label>
              <input
                id="vendor-name"
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g., Acme Solutions Inc."
                className={errors.name ? 'error' : ''}
                autoFocus
              />
              {errors.name && (
                <span className="vendor-form-error">
                  <AlertCircle size={14} />
                  {errors.name}
                </span>
              )}
            </div>

            <div className="vendor-form-field">
              <label htmlFor="vendor-website">
                <Globe size={14} />
                Website
              </label>
              <input
                id="vendor-website"
                type="text"
                value={formData.website}
                onChange={e => handleChange('website', e.target.value)}
                placeholder="e.g., www.acme.com"
                className={errors.website ? 'error' : ''}
              />
              {errors.website && (
                <span className="vendor-form-error">
                  <AlertCircle size={14} />
                  {errors.website}
                </span>
              )}
            </div>

            <div className="vendor-form-field">
              <label htmlFor="vendor-description">
                <FileText size={14} />
                Description
              </label>
              <textarea
                id="vendor-description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Brief description of the vendor and their offering..."
                rows={3}
              />
            </div>

            <div className="vendor-form-field">
              <label htmlFor="vendor-notes">Notes</label>
              <textarea
                id="vendor-notes"
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Primary Contact Section (only for new vendors) */}
          {!isEditing && (
            <div className="vendor-form-section">
              <div className="vendor-form-section-header">
                <h3 className="vendor-form-section-title">
                  <User size={18} />
                  Primary Contact
                </h3>
                <label className="vendor-form-toggle">
                  <input
                    type="checkbox"
                    checked={includeContact}
                    onChange={e => setIncludeContact(e.target.checked)}
                  />
                  <span>Add contact now</span>
                </label>
              </div>

              {includeContact && (
                <div className="vendor-form-contact-fields">
                  <div className="vendor-form-row">
                    <div className="vendor-form-field">
                      <label htmlFor="contact-name">Contact Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        value={contactData.name}
                        onChange={e => handleContactChange('name', e.target.value)}
                        placeholder="Full name"
                        className={errors.contact_name ? 'error' : ''}
                      />
                      {errors.contact_name && (
                        <span className="vendor-form-error">
                          <AlertCircle size={14} />
                          {errors.contact_name}
                        </span>
                      )}
                    </div>

                    <div className="vendor-form-field">
                      <label htmlFor="contact-role">
                        <Briefcase size={14} />
                        Role
                      </label>
                      <input
                        id="contact-role"
                        type="text"
                        value={contactData.role}
                        onChange={e => handleContactChange('role', e.target.value)}
                        placeholder="e.g., Sales Director"
                      />
                    </div>
                  </div>

                  <div className="vendor-form-row">
                    <div className="vendor-form-field">
                      <label htmlFor="contact-email">
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={contactData.email}
                        onChange={e => handleContactChange('email', e.target.value)}
                        placeholder="email@company.com"
                        className={errors.contact_email ? 'error' : ''}
                      />
                      {errors.contact_email && (
                        <span className="vendor-form-error">
                          <AlertCircle size={14} />
                          {errors.contact_email}
                        </span>
                      )}
                    </div>

                    <div className="vendor-form-field">
                      <label htmlFor="contact-phone">
                        <Phone size={14} />
                        Phone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={contactData.phone}
                        onChange={e => handleContactChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="vendor-form-actions">
            <button 
              type="button" 
              className="vendor-form-btn vendor-form-btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="vendor-form-btn vendor-form-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small" />
                  {isEditing ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Save Changes' : 'Add Vendor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorForm;
