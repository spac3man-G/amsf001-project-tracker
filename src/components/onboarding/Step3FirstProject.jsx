/**
 * Step 3: Create First Project
 * 
 * Allows user to create their first project.
 * Uses the existing create-project API.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useProject } from '../../contexts/ProjectContext';
import { 
  FolderKanban, ChevronRight, ChevronLeft, Loader2, 
  AlertCircle, CheckCircle2
} from 'lucide-react';

export default function Step3FirstProject({ 
  wizardData, 
  updateWizardData, 
  onNext, 
  onPrev 
}) {
  const { organisationId, currentOrganisation } = useOrganisation();
  const { refreshProjectAssignments } = useProject();
  
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [projectCreated, setProjectCreated] = useState(!!wizardData.project);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-uppercase reference
    if (name === 'reference') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    if (!formData.reference.trim()) {
      setError('Project reference is required');
      return;
    }

    // Validate reference format
    const referenceRegex = /^[A-Z0-9-]+$/;
    if (!referenceRegex.test(formData.reference)) {
      setError('Reference can only contain uppercase letters, numbers, and hyphens');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          reference: formData.reference.trim(),
          description: formData.description.trim() || undefined,
          organisation_id: organisationId,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Update wizard data
      updateWizardData('project', result.project);
      
      // Refresh projects in context
      await refreshProjectAssignments();
      
      // Mark as created
      setProjectCreated(true);

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = () => {
    onNext();
  };

  // If project already created, show success state
  if (projectCreated) {
    const project = wizardData.project;
    
    return (
      <div className="wizard-step">
        <div className="step-header">
          <h2>First Project Created!</h2>
          <p>Your project is ready. You can start adding milestones, resources, and more.</p>
        </div>

        <div className="step-body">
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#166534' }}>
              {project?.name || formData.name}
            </h3>
            <p style={{ margin: 0, color: '#64748b' }}>
              Reference: <strong>{project?.reference || formData.reference}</strong>
            </p>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn-wizard-text"
              onClick={() => {
                setProjectCreated(false);
                updateWizardData('project', null);
              }}
            >
              Create another project
            </button>
          </div>
        </div>

        <div className="step-footer">
          <button 
            type="button" 
            className="btn-wizard-secondary"
            onClick={onPrev}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <button 
            type="button" 
            className="btn-wizard-primary"
            onClick={handleContinue}
          >
            Finish Setup
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Create Your First Project</h2>
        <p>Projects help you organise work, track progress, and manage your team's time.</p>
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
            <label htmlFor="project-name">Project Name *</label>
            <input
              id="project-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Website Redesign"
              maxLength={100}
              disabled={creating}
              autoFocus
            />
          </div>

          <div className="wizard-form-field">
            <label htmlFor="project-reference">Reference Code *</label>
            <input
              id="project-reference"
              name="reference"
              type="text"
              value={formData.reference}
              onChange={handleChange}
              placeholder="e.g., WEB001"
              maxLength={20}
              disabled={creating}
              style={{ textTransform: 'uppercase' }}
            />
            <p className="field-hint">
              A short, unique identifier for your project. Letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="wizard-form-field">
            <label htmlFor="project-description">
              Description
              <span className="label-optional">(optional)</span>
            </label>
            <textarea
              id="project-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the project goals..."
              rows={3}
              maxLength={500}
              disabled={creating}
            />
          </div>
        </div>

        <div className="step-footer">
          <button 
            type="button" 
            className="btn-wizard-secondary"
            onClick={onPrev}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn-wizard-text"
              onClick={handleContinue}
            >
              Skip for now
            </button>
            <button 
              type="submit" 
              className="btn-wizard-primary"
              disabled={creating || !formData.name.trim() || !formData.reference.trim()}
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="wizard-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderKanban size={18} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
