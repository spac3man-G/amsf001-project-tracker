/**
 * Partners Page - Apple Design System (Clean)
 * 
 * Manages third-party partner companies for resource allocation and invoicing.
 * Click on any row to view/edit partner details.
 * Only accessible to Admin and Supplier PM roles.
 * 
 * @version 2.0 - Apple design, removed dashboard cards and inline actions
 * @updated 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Mail, User, FileText, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { partnersService } from '../services';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import './Partners.css';

export default function Partners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useProject();
  const { canManagePartners, hasRole } = usePermissions();
  const { showSuccess, showError } = useToast();
  
  // State
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, partner: null, dependents: null });
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    payment_terms: 'Net 30',
    notes: '',
    is_active: true
  });

  // Check access
  const canAccess = hasRole(['admin', 'supplier_pm']);

  // Load partners
  useEffect(() => {
    if (projectId && canAccess) {
      loadPartners();
    }
  }, [projectId, canAccess]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnersService.getAll(projectId);
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
      showError('Failed to load partners. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPartners();
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      payment_terms: 'Net 30',
      notes: '',
      is_active: true
    });
    setEditingPartner(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Partner name is required');
      return;
    }

    try {
      setSaving(true);

      if (editingPartner) {
        await partnersService.update(editingPartner.id, formData);
        showSuccess('Partner updated successfully');
      } else {
        await partnersService.create({
          ...formData,
          project_id: projectId
        });
        showSuccess('Partner added successfully');
      }

      await loadPartners();
      resetForm();
    } catch (err) {
      console.error('Failed to save partner:', err);
      showError(err.message || 'Failed to save partner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (e, partner) => {
    e.stopPropagation();
    try {
      await partnersService.toggleActive(partner.id);
      await loadPartners();
      showSuccess(`Partner ${partner.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) {
      console.error('Failed to toggle partner status:', err);
      showError('Failed to update partner status.');
    }
  };

  // Access denied
  if (!canAccess) {
    return (
      <div className="partners-page">
        <div className="ptr-content">
          <div className="ptr-access-denied">
            <p>You don't have permission to access this page. Partners management is only available to Admin and Supplier PM roles.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading partners..." size="large" fullPage />;
  }

  return (
    <div className="partners-page">
      {/* Header */}
      <header className="ptr-header">
        <div className="ptr-header-content">
          <div className="ptr-header-left">
            <div className="ptr-header-icon">
              <Building2 size={24} />
            </div>
            <div>
              <h1>Partners</h1>
              <p>Manage third-party partner companies for resource allocation and invoicing</p>
            </div>
          </div>
          <div className="ptr-header-actions">
            <button 
              className="ptr-btn ptr-btn-secondary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="ptr-btn ptr-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} />
              Add Partner
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="ptr-content">
        {/* Partners Table */}
        <div className="ptr-table-card">
          <div className="ptr-table-header">
            <h2 className="ptr-table-title">Partner Companies</h2>
            <span className="ptr-table-count">
              {partners.length} partner{partners.length !== 1 ? 's' : ''}
            </span>
          </div>

          {partners.length === 0 ? (
            <div className="ptr-empty">
              <div className="ptr-empty-icon">
                <Building2 size={32} />
              </div>
              <div className="ptr-empty-title">No Partners Yet</div>
              <div className="ptr-empty-text">
                Add your first partner company to start tracking third-party resources and expenses.
              </div>
              <button className="ptr-empty-btn" onClick={() => setShowForm(true)}>
                <Plus size={18} />
                Add Partner
              </button>
            </div>
          ) : (
            <table className="ptr-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Contact</th>
                  <th>Payment Terms</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr 
                    key={partner.id} 
                    onClick={() => navigate(`/partners/${partner.id}`)}
                  >
                    <td>
                      <div className="ptr-partner-cell">
                        <div className="ptr-partner-icon">
                          <Building2 size={20} />
                        </div>
                        <div className="ptr-partner-info">
                          <span className="ptr-partner-name">{partner.name}</span>
                          {partner.notes && (
                            <span className="ptr-partner-notes" title={partner.notes}>
                              {partner.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ptr-contact-cell">
                        {partner.contact_name && (
                          <div className="ptr-contact-name">
                            <User size={14} />
                            {partner.contact_name}
                          </div>
                        )}
                        {partner.contact_email && (
                          <div className="ptr-contact-email">
                            <Mail size={14} />
                            <a 
                              href={`mailto:${partner.contact_email}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {partner.contact_email}
                            </a>
                          </div>
                        )}
                        {!partner.contact_name && !partner.contact_email && (
                          <span className="ptr-no-contact">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="ptr-terms">
                        <FileText size={14} />
                        {partner.payment_terms}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`ptr-status-badge ${partner.is_active ? 'active' : 'inactive'}`}
                        onClick={(e) => handleToggleActive(e, partner)}
                      >
                        {partner.is_active ? (
                          <>
                            <ToggleRight size={14} />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="ptr-modal-overlay">
          <div className="ptr-modal">
            <div className="ptr-modal-header">
              <h2 className="ptr-modal-title">
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="ptr-modal-body">
                <div className="ptr-form-group">
                  <label className="ptr-form-label">
                    Company Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="ptr-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Agilisys"
                    required
                  />
                </div>

                <div className="ptr-form-group">
                  <label className="ptr-form-label">Contact Name</label>
                  <input
                    type="text"
                    className="ptr-form-input"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Primary contact name"
                  />
                </div>

                <div className="ptr-form-group">
                  <label className="ptr-form-label">Contact Email</label>
                  <input
                    type="email"
                    className="ptr-form-input"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="ptr-form-group">
                  <label className="ptr-form-label">Payment Terms</label>
                  <select
                    className="ptr-form-select"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div className="ptr-form-group">
                  <label className="ptr-form-label">Notes</label>
                  <textarea
                    className="ptr-form-textarea"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes about this partner..."
                  />
                </div>

                <div className="ptr-form-checkbox">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active">Partner is active</label>
                </div>
              </div>

              <div className="ptr-modal-footer">
                <button
                  type="button"
                  className="ptr-modal-btn ptr-modal-btn-cancel"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ptr-modal-btn ptr-modal-btn-save"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingPartner ? 'Update Partner' : 'Add Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
