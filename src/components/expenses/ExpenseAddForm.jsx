/**
 * Expense Add Form Component
 * 
 * Multi-category expense entry form with:
 * - Resource and date selection
 * - Travel, Accommodation, Sustenance category inputs
 * - Chargeable and procurement method options
 * - File upload for receipts
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Expenses.jsx
 */

import React from 'react';
import { Car, Home, Utensils, Upload, FileText, X, Save } from 'lucide-react';

/**
 * Category Input Component - Single category expense input
 */
function CategoryInput({ 
  category, 
  icon, 
  bgColor, 
  textColor, 
  borderColor, 
  amount, 
  reason, 
  chargeable, 
  procurement, 
  onAmountChange, 
  onReasonChange, 
  onChargeableChange, 
  onProcurementChange, 
  hasRole 
}) {
  return (
    <div style={{ padding: '1rem', backgroundColor: bgColor, borderRadius: '8px', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: textColor, marginBottom: '0.75rem' }}>
        {icon}
        <span style={{ fontWeight: '600', fontSize: '1rem' }}>{category}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
        <div>
          <label className="form-label">Amount (£)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-input" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => onAmountChange(e.target.value)} 
          />
        </div>
        <div>
          <label className="form-label">Reason / Description</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={`e.g., ${category} expense description`} 
            value={reason} 
            onChange={(e) => onReasonChange(e.target.value)} 
          />
        </div>
      </div>
      {parseFloat(amount) > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: `1px solid ${borderColor}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={chargeable} 
              onChange={(e) => onChargeableChange(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: textColor }} 
            />
            <span style={{ fontSize: '0.85rem', color: textColor }}>Chargeable to Customer</span>
          </label>
          {hasRole(['admin', 'supplier_pm']) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: textColor }}>Paid by:</span>
              <select 
                value={procurement} 
                onChange={(e) => onProcurementChange(e.target.value)} 
                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: `1px solid ${borderColor}`, fontSize: '0.85rem', backgroundColor: '#fff' }}
              >
                <option value="supplier">Supplier (JT)</option>
                <option value="partner">Partner</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main Add Expense Form
 */
export default function ExpenseAddForm({ 
  newExpense, 
  setNewExpense, 
  availableResources, 
  hasRole, 
  handleAdd, 
  handleFileSelect, 
  removeFile, 
  uploadingFiles, 
  onCancel 
}) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
      <h3 style={{ marginBottom: '1rem' }}>Add New Expenses</h3>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Enter amounts for any categories that apply. Leave blank to skip a category.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="form-label">Resource Name *</label>
          <select 
            className="form-input" 
            value={newExpense.resource_id} 
            onChange={(e) => setNewExpense({ ...newExpense, resource_id: e.target.value })}
          >
            <option value="">Select Resource</option>
            {availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Date *</label>
          <input 
            type="date" 
            className="form-input" 
            value={newExpense.expense_date} 
            onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })} 
          />
        </div>
      </div>

      {/* Travel */}
      <CategoryInput
        category="Travel"
        icon={<Car size={20} />}
        bgColor="#dbeafe"
        textColor="#2563eb"
        borderColor="#93c5fd"
        amount={newExpense.travel_amount}
        reason={newExpense.travel_reason}
        chargeable={newExpense.travel_chargeable}
        procurement={newExpense.travel_procurement}
        onAmountChange={(v) => setNewExpense({ ...newExpense, travel_amount: v })}
        onReasonChange={(v) => setNewExpense({ ...newExpense, travel_reason: v })}
        onChargeableChange={(v) => setNewExpense({ ...newExpense, travel_chargeable: v })}
        onProcurementChange={(v) => setNewExpense({ ...newExpense, travel_procurement: v })}
        hasRole={hasRole}
      />

      {/* Accommodation */}
      <CategoryInput
        category="Accommodation"
        icon={<Home size={20} />}
        bgColor="#f3e8ff"
        textColor="#7c3aed"
        borderColor="#d8b4fe"
        amount={newExpense.accommodation_amount}
        reason={newExpense.accommodation_reason}
        chargeable={newExpense.accommodation_chargeable}
        procurement={newExpense.accommodation_procurement}
        onAmountChange={(v) => setNewExpense({ ...newExpense, accommodation_amount: v })}
        onReasonChange={(v) => setNewExpense({ ...newExpense, accommodation_reason: v })}
        onChargeableChange={(v) => setNewExpense({ ...newExpense, accommodation_chargeable: v })}
        onProcurementChange={(v) => setNewExpense({ ...newExpense, accommodation_procurement: v })}
        hasRole={hasRole}
      />

      {/* Sustenance */}
      <CategoryInput
        category="Sustenance"
        icon={<Utensils size={20} />}
        bgColor="#ffedd5"
        textColor="#ea580c"
        borderColor="#fdba74"
        amount={newExpense.sustenance_amount}
        reason={newExpense.sustenance_reason}
        chargeable={newExpense.sustenance_chargeable}
        procurement={newExpense.sustenance_procurement}
        onAmountChange={(v) => setNewExpense({ ...newExpense, sustenance_amount: v })}
        onReasonChange={(v) => setNewExpense({ ...newExpense, sustenance_reason: v })}
        onChargeableChange={(v) => setNewExpense({ ...newExpense, sustenance_chargeable: v })}
        onProcurementChange={(v) => setNewExpense({ ...newExpense, sustenance_procurement: v })}
        hasRole={hasRole}
      />

      {/* Notes */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Additional Notes</label>
        <textarea 
          className="form-input" 
          rows={2} 
          placeholder="Any additional information..." 
          value={newExpense.notes} 
          onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} 
        />
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Attach Receipts</label>
        <div 
          style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb' }} 
          onClick={() => document.getElementById('file-upload').click()}
        >
          <Upload size={24} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Click to upload receipts</div>
          <input id="file-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.zip" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>
        {newExpense.files.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            {newExpense.files.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                <FileText size={14} />
                <span style={{ flex: 1 }}>{file.name}</span>
                <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={handleAdd} disabled={uploadingFiles}>
          <Save size={16} /> {uploadingFiles ? 'Uploading...' : 'Save Expenses'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}
