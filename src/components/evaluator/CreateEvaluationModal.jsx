/**
 * CreateEvaluationModal
 * 
 * Modal dialog for creating new evaluation projects.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish (Bug fix for BUG-001)
 */

import React, { useState } from 'react';
import { X, Plus, Briefcase } from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { supabase } from '../../lib/supabase';

export default function CreateEvaluationModal({ isOpen, onClose, onSuccess }) {
  const { organisationId } = useOrganisation();
  const { refreshEvaluationAssignments } = useEvaluation();
  
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    description: '',
    target_start_date: '',
    target_end_date: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Evaluation name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Call the API endpoint (bypasses RLS using service role)
      const response = await fetch('/api/evaluator/create-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          client_name: formData.client_name.trim() || null,
          description: formData.description.trim() || null,
          target_start_date: formData.target_start_date || null,
          target_end_date: formData.target_end_date || null,
          organisation_id: organisationId,
          adminToken: session.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create evaluation project');
      }

      // Refresh the evaluation list in context
      await refreshEvaluationAssignments();

      // Reset form
      setFormData({
        name: '',
        client_name: '',
        description: '',
        target_start_date: '',
        target_end_date: ''
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result.evaluation);
      }

      onClose();
    } catch (err) {
      console.error('Failed to create evaluation project:', err);
      setError(err.message || 'Failed to create evaluation project');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setFormData({
        name: '',
        client_name: '',
        description: '',
        target_start_date: '',
        target_end_date: ''
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Briefcase size={24} style={{ color: '#7c3aed' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create Evaluation Project</h2>
          </div>
          <button 
            onClick={handleClose}
            disabled={creating}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: creating ? 'not-allowed' : 'pointer', 
              padding: '4px',
              opacity: creating ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                Evaluation Name *
              </label>
              <input
                type="text"
                placeholder="e.g., CRM Platform Selection 2026"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={creating}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            {/* Client Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                Client Name
              </label>
              <input
                type="text"
                placeholder="e.g., Carey Olsen"
                value={formData.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                The client this evaluation is being conducted for
              </p>
            </div>
            
            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                Description
              </label>
              <textarea
                placeholder="Brief description of the evaluation project..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={creating}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dates Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                  Target Start Date
                </label>
                <input
                  type="date"
                  value={formData.target_start_date}
                  onChange={(e) => handleChange('target_start_date', e.target.value)}
                  disabled={creating}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                  Target End Date
                </label>
                <input
                  type="date"
                  value={formData.target_end_date}
                  onChange={(e) => handleChange('target_end_date', e.target.value)}
                  disabled={creating}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ 
            marginTop: '24px', 
            paddingTop: '16px', 
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleClose}
              disabled={creating}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: creating ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating || !formData.name.trim()}
              style={{
                padding: '10px 20px',
                background: creating || !formData.name.trim() ? '#94a3b8' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: creating || !formData.name.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              {creating ? 'Creating...' : 'Create Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
