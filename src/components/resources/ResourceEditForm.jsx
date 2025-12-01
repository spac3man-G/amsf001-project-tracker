/**
 * Resource Edit Form Component
 * 
 * Form for editing resource details including:
 * - Basic info (name, email, role, reference)
 * - SFIA level and allocation
 * - Rate information
 * - Resource type and partner assignment
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from ResourceDetail.jsx
 */

import React from 'react';
import { Save, X } from 'lucide-react';

export default function ResourceEditForm({
  form,
  onFormChange,
  onSave,
  onCancel,
  saving,
  partners,
  canSeeCostPrice,
  canSeeResourceType
}) {
  const inputStyle = {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    width: '100%'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: '500',
    fontSize: '0.875rem'
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Name */}
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            style={inputStyle}
            value={form.name}
            onChange={(e) => onFormChange({...form, name: e.target.value})}
          />
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            style={inputStyle}
            value={form.email}
            onChange={(e) => onFormChange({...form, email: e.target.value})}
          />
        </div>

        {/* Role */}
        <div>
          <label style={labelStyle}>Role</label>
          <input
            type="text"
            style={inputStyle}
            value={form.role}
            onChange={(e) => onFormChange({...form, role: e.target.value})}
          />
        </div>

        {/* Resource Ref */}
        <div>
          <label style={labelStyle}>Reference</label>
          <input
            type="text"
            style={inputStyle}
            value={form.resource_ref}
            onChange={(e) => onFormChange({...form, resource_ref: e.target.value})}
            placeholder="e.g., R01"
          />
        </div>

        {/* SFIA Level */}
        <div>
          <label style={labelStyle}>SFIA Level</label>
          <select
            style={inputStyle}
            value={form.sfia_level}
            onChange={(e) => onFormChange({...form, sfia_level: e.target.value})}
          >
            <option value="L3">Level 3</option>
            <option value="L4">Level 4</option>
            <option value="L5">Level 5</option>
            <option value="L6">Level 6</option>
          </select>
        </div>

        {/* Days Allocated */}
        <div>
          <label style={labelStyle}>Days Allocated</label>
          <input
            type="number"
            style={inputStyle}
            value={form.days_allocated}
            onChange={(e) => onFormChange({...form, days_allocated: e.target.value})}
          />
        </div>

        {/* Daily Rate */}
        <div>
          <label style={labelStyle}>Daily Rate (£) - Customer</label>
          <input
            type="number"
            style={inputStyle}
            value={form.daily_rate}
            onChange={(e) => onFormChange({...form, daily_rate: e.target.value})}
          />
        </div>

        {/* Cost Price - Admin/Supplier PM only */}
        {canSeeCostPrice && (
          <div>
            <label style={labelStyle}>Cost Price (£) - Internal</label>
            <input
              type="number"
              style={inputStyle}
              value={form.cost_price}
              onChange={(e) => onFormChange({...form, cost_price: e.target.value})}
              placeholder="Optional"
            />
          </div>
        )}

        {/* Discount */}
        <div>
          <label style={labelStyle}>Discount %</label>
          <input
            type="number"
            style={inputStyle}
            value={form.discount_percent}
            onChange={(e) => onFormChange({...form, discount_percent: e.target.value})}
          />
        </div>

        {/* Resource Type - Admin/Supplier PM only */}
        {canSeeResourceType && (
          <>
            <div>
              <label style={labelStyle}>Resource Type</label>
              <select
                style={inputStyle}
                value={form.resource_type}
                onChange={(e) => onFormChange({
                  ...form, 
                  resource_type: e.target.value,
                  partner_id: e.target.value === 'internal' ? '' : form.partner_id
                })}
              >
                <option value="internal">Internal Supplier Resource</option>
                <option value="third_party">Third-Party Partner</option>
              </select>
            </div>

            {/* Partner Selection - only when third_party */}
            {form.resource_type === 'third_party' && (
              <div>
                <label style={labelStyle}>Partner</label>
                <select
                  style={inputStyle}
                  value={form.partner_id}
                  onChange={(e) => onFormChange({...form, partner_id: e.target.value})}
                >
                  <option value="">-- Select Partner --</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save/Cancel buttons */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}
