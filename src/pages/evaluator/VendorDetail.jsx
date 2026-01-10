/**
 * VendorDetail Page
 * 
 * Detailed view of a single vendor with contacts,
 * status management, and portal access controls.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 5 - Vendor Management (Task 5A.7)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  User,
  Plus,
  Edit,
  Trash2,
  Key,
  Clock,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  MoreVertical,
  Copy,
  RefreshCw,
  FileText,
  Star,
  StarOff,
  MessageSquare,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  vendorsService, 
  VENDOR_STATUS_CONFIG,
  VENDOR_STATUSES
} from '../../services/evaluator';
import { VendorForm, VendorResponseViewer, VendorIntelligencePanel } from '../../components/evaluator';
import './VendorDetail.css';

function VendorDetail() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { currentEvaluation } = useEvaluation();
  const { user } = useAuth();

  // State
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'responses' | 'intelligence'

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    is_primary: false
  });

  // Fetch vendor
  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await vendorsService.getByIdWithDetails(vendorId);
      if (!data) {
        setError('Vendor not found');
        return;
      }

      setVendor(data);
    } catch (err) {
      console.error('Failed to fetch vendor:', err);
      setError('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // Handlers
  const handleBack = () => {
    navigate('/evaluator/vendors');
  };

  const handleEditVendor = async (formData) => {
    try {
      setIsSubmitting(true);
      await vendorsService.updateVendor(vendor.id, formData);
      setShowEditModal(false);
      fetchVendor();
    } catch (err) {
      console.error('Failed to update vendor:', err);
      setError('Failed to update vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!user?.id) return;

    try {
      await vendorsService.updateStatus(vendor.id, newStatus, user.id);
      fetchVendor();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(`Failed to update status: ${err.message}`);
    }
  };

  // Contact handlers
  const handleAddContact = async () => {
    if (!contactForm.name && !contactForm.email) {
      setError('Contact name or email is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await vendorsService.addContact(vendor.id, contactForm);
      setShowAddContact(false);
      setContactForm({ name: '', email: '', phone: '', role: '', is_primary: false });
      fetchVendor();
    } catch (err) {
      console.error('Failed to add contact:', err);
      setError('Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;

    try {
      setIsSubmitting(true);
      await vendorsService.updateContact(editingContact.id, contactForm);
      setEditingContact(null);
      setContactForm({ name: '', email: '', phone: '', role: '', is_primary: false });
      fetchVendor();
    } catch (err) {
      console.error('Failed to update contact:', err);
      setError('Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;

    try {
      await vendorsService.removeContact(contactId);
      fetchVendor();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      setError('Failed to remove contact');
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      await vendorsService.setPrimaryContact(vendor.id, contactId);
      fetchVendor();
    } catch (err) {
      console.error('Failed to set primary contact:', err);
      setError('Failed to update primary contact');
    }
  };

  const startEditContact = (contact) => {
    setContactForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      role: contact.role || '',
      is_primary: contact.is_primary || false
    });
    setEditingContact(contact);
    setShowAddContact(false);
  };

  // Portal handlers
  const handleGeneratePortalCode = async () => {
    try {
      await vendorsService.generatePortalAccessCode(vendor.id);
      fetchVendor();
    } catch (err) {
      console.error('Failed to generate portal code:', err);
      setError('Failed to generate portal access');
    }
  };

  const handleRevokePortalAccess = async () => {
    if (!confirm('Are you sure you want to revoke portal access?')) return;

    try {
      await vendorsService.revokePortalAccess(vendor.id);
      fetchVendor();
    } catch (err) {
      console.error('Failed to revoke portal access:', err);
      setError('Failed to revoke portal access');
    }
  };

  const handleCopyAccessCode = () => {
    if (vendor?.portal_access_code) {
      navigator.clipboard.writeText(vendor.portal_access_code);
      // Could add toast notification here
    }
  };

  // Status config
  const statusConfig = vendor ? VENDOR_STATUS_CONFIG[vendor.status] : null;
  const validTransitions = vendor ? vendorsService.getValidTransitions(vendor.status) : [];

  // Loading state
  if (loading) {
    return (
      <div className="vendor-detail">
        <div className="vendor-detail-loading">
          <div className="spinner" />
          <span>Loading vendor details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !vendor) {
    return (
      <div className="vendor-detail">
        <div className="vendor-detail-error">
          <AlertCircle size={48} />
          <h2>{error}</h2>
          <button onClick={handleBack}>Back to Vendors</button>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="vendor-detail">
      {/* Header */}
      <div className="vendor-detail-header">
        <button className="vendor-back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Back to Vendors
        </button>

        <div className="vendor-detail-title-row">
          <div className="vendor-detail-icon">
            <Building2 size={32} />
          </div>
          <div className="vendor-detail-title-content">
            <h1>{vendor.name}</h1>
            {vendor.website && (
              <a 
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vendor-website-link"
              >
                <Globe size={14} />
                {vendor.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          <button 
            className="vendor-edit-btn"
            onClick={() => setShowEditModal(true)}
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="vendor-detail-error-banner">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="vendor-detail-tabs">
        <button
          className={`vendor-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Building2 size={16} />
          Details
        </button>
        <button
          className={`vendor-tab ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          <MessageSquare size={16} />
          Responses
          <Sparkles size={12} className="ai-badge" />
        </button>
        <button
          className={`vendor-tab ${activeTab === 'intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('intelligence')}
        >
          <TrendingUp size={16} />
          Intelligence
          <Sparkles size={12} className="ai-badge" />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'responses' ? (
        <div className="vendor-detail-responses">
          <div className="responses-header">
            <h2>
              <MessageSquare size={20} />
              Vendor Responses
            </h2>
            <p className="responses-subtitle">
              Review {vendor.name}'s responses to RFP questions with AI-powered analysis
            </p>
          </div>
          <VendorResponseViewer
            vendorId={vendor.id}
            evaluationProjectId={currentEvaluation?.id}
            vendorName={vendor.name}
            showAiAnalysis={true}
          />
        </div>
      ) : activeTab === 'intelligence' ? (
        <div className="vendor-detail-intelligence">
          <VendorIntelligencePanel
            vendorId={vendor.id}
            vendorName={vendor.name}
            onDataUpdate={fetchVendor}
          />
        </div>
      ) : (
        <div className="vendor-detail-content">
        {/* Left Column */}
        <div className="vendor-detail-main">
          {/* Status Section */}
          <section className="vendor-section">
            <h2>Status</h2>
            <div className="vendor-status-card">
              <div className="vendor-current-status">
                <span 
                  className="vendor-status-badge-large"
                  style={{ 
                    backgroundColor: statusConfig?.bgColor,
                    color: statusConfig?.color 
                  }}
                >
                  {statusConfig?.label}
                </span>
                {vendor.status_changed_at && (
                  <span className="vendor-status-date">
                    <Clock size={14} />
                    Changed {new Date(vendor.status_changed_at).toLocaleDateString()}
                    {vendor.status_changed_by_profile && (
                      <> by {vendor.status_changed_by_profile.full_name}</>
                    )}
                  </span>
                )}
              </div>

              {validTransitions.length > 0 && (
                <div className="vendor-status-actions">
                  <span className="vendor-status-label">Move to:</span>
                  <div className="vendor-status-buttons">
                    {validTransitions.map(status => {
                      const config = VENDOR_STATUS_CONFIG[status];
                      return (
                        <button
                          key={status}
                          className="vendor-status-btn"
                          style={{ 
                            borderColor: config?.color,
                            color: config?.color 
                          }}
                          onClick={() => handleStatusChange(status)}
                        >
                          <ChevronRight size={14} />
                          {config?.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Description Section */}
          {vendor.description && (
            <section className="vendor-section">
              <h2>Description</h2>
              <p className="vendor-description">{vendor.description}</p>
            </section>
          )}

          {/* Notes Section */}
          {vendor.notes && (
            <section className="vendor-section">
              <h2>Notes</h2>
              <div className="vendor-notes">
                {vendor.notes.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="vendor-detail-sidebar">
          {/* Contacts Section */}
          <section className="vendor-section">
            <div className="vendor-section-header">
              <h2>Contacts</h2>
              <button 
                className="vendor-add-btn"
                onClick={() => {
                  setShowAddContact(true);
                  setEditingContact(null);
                  setContactForm({ name: '', email: '', phone: '', role: '', is_primary: false });
                }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {(showAddContact || editingContact) && (
              <div className="vendor-contact-form">
                <div className="vendor-contact-form-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={contactForm.name}
                    onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={contactForm.role}
                    onChange={e => setContactForm(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={contactForm.phone}
                  onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                />
                <label className="vendor-contact-primary-toggle">
                  <input
                    type="checkbox"
                    checked={contactForm.is_primary}
                    onChange={e => setContactForm(prev => ({ ...prev, is_primary: e.target.checked }))}
                  />
                  Set as primary contact
                </label>
                <div className="vendor-contact-form-actions">
                  <button 
                    className="vendor-btn-cancel"
                    onClick={() => {
                      setShowAddContact(false);
                      setEditingContact(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="vendor-btn-save"
                    onClick={editingContact ? handleEditContact : handleAddContact}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : (editingContact ? 'Update' : 'Add')}
                  </button>
                </div>
              </div>
            )}

            <div className="vendor-contacts-list">
              {vendor.contacts?.length === 0 && !showAddContact && (
                <div className="vendor-empty-contacts">
                  <User size={24} />
                  <p>No contacts added yet</p>
                </div>
              )}

              {vendor.contacts?.map(contact => (
                <div key={contact.id} className="vendor-contact-item">
                  <div className="vendor-contact-main">
                    <div className="vendor-contact-name">
                      {contact.name || 'Unnamed Contact'}
                      {contact.is_primary && (
                        <span className="vendor-primary-badge">
                          <Star size={12} />
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.role && (
                      <span className="vendor-contact-role">{contact.role}</span>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="vendor-contact-link">
                        <Mail size={12} />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <span className="vendor-contact-phone">
                        <Phone size={12} />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  <div className="vendor-contact-actions">
                    {!contact.is_primary && (
                      <button 
                        title="Set as primary"
                        onClick={() => handleSetPrimaryContact(contact.id)}
                      >
                        <StarOff size={14} />
                      </button>
                    )}
                    <button 
                      title="Edit contact"
                      onClick={() => startEditContact(contact)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      title="Remove contact"
                      className="vendor-contact-delete"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Portal Access Section */}
          <section className="vendor-section">
            <div className="vendor-section-header">
              <h2>Portal Access</h2>
            </div>

            {vendor.portal_enabled ? (
              <div className="vendor-portal-info">
                <div className="vendor-portal-status vendor-portal-active">
                  <Key size={16} />
                  <span>Portal Enabled</span>
                </div>

                <div className="vendor-portal-code">
                  <label>Access Code</label>
                  <div className="vendor-code-display">
                    <code>{vendor.portal_access_code}</code>
                    <button 
                      title="Copy code"
                      onClick={handleCopyAccessCode}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {vendor.portal_access_expires_at && (
                  <div className="vendor-portal-expiry">
                    <Clock size={14} />
                    <span>
                      Expires: {new Date(vendor.portal_access_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="vendor-portal-actions">
                  <button 
                    className="vendor-btn-secondary"
                    onClick={() => vendorsService.extendPortalAccess(vendor.id, 14).then(fetchVendor)}
                  >
                    <RefreshCw size={14} />
                    Extend 14 days
                  </button>
                  <button 
                    className="vendor-btn-danger"
                    onClick={handleRevokePortalAccess}
                  >
                    <X size={14} />
                    Revoke Access
                  </button>
                </div>
              </div>
            ) : (
              <div className="vendor-portal-disabled">
                <p>Portal access is not enabled for this vendor.</p>
                <button 
                  className="vendor-btn-primary"
                  onClick={handleGeneratePortalCode}
                >
                  <Key size={14} />
                  Enable Portal Access
                </button>
              </div>
            )}
          </section>

          {/* Metadata */}
          <section className="vendor-section vendor-metadata">
            <div className="vendor-meta-item">
              <span className="vendor-meta-label">Created</span>
              <span className="vendor-meta-value">
                {new Date(vendor.created_at).toLocaleString()}
              </span>
            </div>
            {vendor.updated_at && (
              <div className="vendor-meta-item">
                <span className="vendor-meta-label">Last Updated</span>
                <span className="vendor-meta-value">
                  {new Date(vendor.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <VendorForm
          vendor={vendor}
          onSubmit={handleEditVendor}
          onCancel={() => setShowEditModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default VendorDetail;
