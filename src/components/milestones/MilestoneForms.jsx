/**
 * Milestone Form Components
 * 
 * Form components for milestone management:
 * - MilestoneAddForm - Inline form for adding new milestones
 * - MilestoneEditModal - Modal for editing existing milestones
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Milestones.jsx
 */

import React from 'react';
import { Plus, Edit2, Save, X } from 'lucide-react';

/**
 * Add Milestone Form - Inline expandable form
 */
export function MilestoneAddForm({ 
  form, 
  onFormChange, 
  onSubmit, 
  onCancel 
}) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #10b981' }} data-testid="milestone-add-form">
      <h3 style={{ marginBottom: '1rem' }}>Add New Milestone</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label className="form-label">Milestone Reference *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="M01"
            value={form.milestone_ref}
            onChange={(e) => onFormChange({ ...form, milestone_ref: e.target.value })}
            data-testid="milestone-ref-input"
          />
        </div>
        <div>
          <label className="form-label">Name *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Milestone name"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            data-testid="milestone-name-input"
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Description</label>
        <textarea 
          className="form-input" 
          rows={2}
          placeholder="Description"
          value={form.description}
          onChange={(e) => onFormChange({ ...form, description: e.target.value })}
          data-testid="milestone-description-input"
        />
      </div>
      
      {/* Baseline Dates */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>Baseline Schedule (Original Plan)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Baseline Start Date</label>
            <input 
              type="date" 
              className="form-input"
              value={form.baseline_start_date || form.start_date}
              onChange={(e) => onFormChange({ ...form, baseline_start_date: e.target.value, start_date: e.target.value })}
              data-testid="milestone-baseline-start-input"
            />
          </div>
          <div>
            <label className="form-label">Baseline End Date</label>
            <input 
              type="date" 
              className="form-input"
              value={form.baseline_end_date || form.end_date}
              onChange={(e) => onFormChange({ ...form, baseline_end_date: e.target.value, end_date: e.target.value })}
              data-testid="milestone-baseline-end-input"
            />
          </div>
        </div>
      </div>
      
      {/* Actual/Forecast Dates */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>Current Schedule</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Actual Start Date</label>
            <input 
              type="date" 
              className="form-input"
              value={form.actual_start_date || form.start_date}
              onChange={(e) => onFormChange({ ...form, actual_start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Forecast End Date</label>
            <input 
              type="date" 
              className="form-input"
              value={form.forecast_end_date || form.end_date}
              onChange={(e) => onFormChange({ ...form, forecast_end_date: e.target.value })}
            />
          </div>
        </div>
      </div>
      
      {/* Billable Amount */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Billable Amount (£)</label>
        <input 
          type="number" 
          className="form-input"
          placeholder="0"
          style={{ maxWidth: '200px' }}
          value={form.billable}
          onChange={(e) => onFormChange({ ...form, billable: e.target.value })}
          data-testid="milestone-billable-input"
        />
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
          The amount that can be invoiced when this milestone is completed (not a budget for doing the work)
        </p>
      </div>
      
      <div style={{ 
        padding: '0.75rem', 
        backgroundColor: '#eff6ff', 
        borderRadius: '6px', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#1e40af'
      }}>
        <strong>Note:</strong> Milestone status and progress will be automatically calculated from associated deliverables.
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={onSubmit} data-testid="milestone-save-button">
          <Plus size={16} /> Add Milestone
        </button>
        <button className="btn btn-secondary" onClick={onCancel} data-testid="milestone-cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Edit Milestone Modal
 */
export function MilestoneEditModal({ 
  form, 
  onFormChange, 
  onSave, 
  onClose 
}) {
  const inputStyle = { 
    width: '100%', 
    padding: '0.5rem', 
    border: '1px solid #e2e8f0', 
    borderRadius: '6px' 
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }} data-testid="milestone-edit-modal">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <Edit2 size={20} />
          Edit Milestone - {form.milestone_ref}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Reference *</label>
            <input
              type="text"
              value={form.milestone_ref}
              onChange={(e) => onFormChange({ ...form, milestone_ref: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            rows={3}
            style={inputStyle}
          />
        </div>

        {/* Baseline Dates */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Baseline Schedule (Original Plan)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Baseline Start</label>
              <input
                type="date"
                value={form.baseline_start_date}
                onChange={(e) => onFormChange({ ...form, baseline_start_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Baseline End</label>
              <input
                type="date"
                value={form.baseline_end_date}
                onChange={(e) => onFormChange({ ...form, baseline_end_date: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Actual/Forecast Dates */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Current Schedule</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Actual Start</label>
              <input
                type="date"
                value={form.actual_start_date}
                onChange={(e) => onFormChange({ ...form, actual_start_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Forecast End</label>
              <input
                type="date"
                value={form.forecast_end_date}
                onChange={(e) => onFormChange({ ...form, forecast_end_date: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Billable Amount (£)</label>
          <input
            type="number"
            value={form.billable}
            onChange={(e) => onFormChange({ ...form, billable: e.target.value })}
            style={{ ...inputStyle, width: '200px' }}
          />
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Amount invoiced when milestone is completed (not a budget for doing the work)
          </p>
        </div>

        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#1e40af'
        }}>
          <strong>💡 Note:</strong> Status and progress are <strong>automatically calculated</strong> from associated deliverables and cannot be manually edited.
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0.5rem' }}>
            <li><strong>Not Started</strong> — No deliverables have begun</li>
            <li><strong>In Progress</strong> — At least one deliverable is in progress</li>
            <li><strong>Completed</strong> — All deliverables are delivered</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
