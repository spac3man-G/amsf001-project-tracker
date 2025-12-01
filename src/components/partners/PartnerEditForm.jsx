/**
 * Partner Edit Form Component
 * 
 * Editable form for partner details including:
 * - Partner name
 * - Contact name and email
 * - Payment terms
 * - Active status
 * - Notes
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from PartnerDetail.jsx
 */

import React from 'react';
import { Save, X } from 'lucide-react';

export default function PartnerEditForm({
  editForm,
  onFormChange,
  onSave,
  onCancel,
  saving
}) {
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Name */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Partner Name *
          </label>
          <input
            type="text"
            className="input-field"
            value={editForm.name}
            onChange={(e) => onFormChange({...editForm, name: e.target.value})}
            style={{ width: '100%' }}
          />
        </div>

        {/* Contact Name */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Contact Name
          </label>
          <input
            type="text"
            className="input-field"
            value={editForm.contact_name}
            onChange={(e) => onFormChange({...editForm, contact_name: e.target.value})}
            style={{ width: '100%' }}
          />
        </div>

        {/* Contact Email */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Contact Email
          </label>
          <input
            type="email"
            className="input-field"
            value={editForm.contact_email}
            onChange={(e) => onFormChange({...editForm, contact_email: e.target.value})}
            style={{ width: '100%' }}
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Payment Terms
          </label>
          <select
            className="input-field"
            value={editForm.payment_terms}
            onChange={(e) => onFormChange({...editForm, payment_terms: e.target.value})}
            style={{ width: '100%' }}
          >
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Net 60">Net 60</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Status
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => onFormChange({...editForm, is_active: e.target.checked})}
            />
            Active Partner
          </label>
        </div>

        {/* Notes */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Notes
          </label>
          <textarea
            className="input-field"
            value={editForm.notes}
            onChange={(e) => onFormChange({...editForm, notes: e.target.value})}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
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
