/**
 * Step 1: Organisation Details
 * 
 * Allows user to review and update their organisation information.
 * Pre-populated from the organisation they just created.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { Building2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

export default function Step1OrgDetails({ 
  wizardData, 
  updateWizardData, 
  onNext,
  isFirstStep 
}) {
  const { currentOrganisation, organisationId, refreshOrganisation } = useOrganisation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form from current organisation
  useEffect(() => {
    if (currentOrganisation) {
      setFormData({
        name: currentOrganisation.name || '',
        description: currentOrganisation.description || '',
      });
    }
  }, [currentOrganisation]);

  // Track changes
  useEffect(() => {
    if (currentOrganisation) {
      const changed = 
        formData.name !== (currentOrganisation.name || '') ||
        formData.description !== (currentOrganisation.description || '');
      setHasChanges(changed);
    }
  }, [formData, currentOrganisation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Organisation name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Only update if there are changes
      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('organisations')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organisationId);

        if (updateError) throw updateError;

        // Refresh organisation in context
        await refreshOrganisation();
      }

      // Update wizard data
      updateWizardData('organisation', {
        ...wizardData.organisation,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      // Move to next step
      onNext();

    } catch (err) {
      console.error('Error updating organisation:', err);
      setError(err.message || 'Failed to update organisation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Organisation Details</h2>
        <p>Review your organisation information. You can update these details anytime in settings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="step-body">
          {error && (
            <div className="wizard-error" style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}

          <div className="wizard-form-field">
            <label htmlFor="org-name">Organisation Name *</label>
            <input
              id="org-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Acme Corporation"
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="wizard-form-field">
            <label htmlFor="org-description">
              Description
              <span className="label-optional">(optional)</span>
            </label>
            <textarea
              id="org-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your organisation..."
              rows={4}
              maxLength={500}
              disabled={saving}
            />
            <p className="field-hint">
              Help your team understand what this organisation is for.
            </p>
          </div>

          {/* Organisation URL (read-only) */}
          <div className="wizard-form-field">
            <label>Organisation URL</label>
            <div style={{
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '0.9375rem'
            }}>
              projecttracker.com/<strong style={{ color: '#1e293b' }}>
                {currentOrganisation?.slug || 'your-org'}
              </strong>
            </div>
            <p className="field-hint">
              This is your organisation's unique URL. Contact support to change it.
            </p>
          </div>
        </div>

        <div className="step-footer">
          <div>
            {/* No back button on first step */}
          </div>
          <button 
            type="submit" 
            className="btn-wizard-primary"
            disabled={saving || !formData.name.trim()}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="wizard-spinner" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
