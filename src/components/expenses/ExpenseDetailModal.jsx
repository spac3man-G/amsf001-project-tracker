/**
 * Expense Detail Modal
 * 
 * Full-screen modal for viewing, editing, and validating individual expenses.
 * Includes receipt preview, full edit form, and action buttons.
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Save, Send, CheckCircle, Trash2, Download, Edit2,
  Car, Home, Utensils, Receipt, Building2, Briefcase, Calendar,
  User, DollarSign, FileText, Clock
} from 'lucide-react';

const CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];
const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected',
  'Paid': 'Paid'
};

function getCategoryIcon(category) {
  switch (category) {
    case 'Travel': return <Car size={20} />;
    case 'Accommodation': return <Home size={20} />;
    case 'Sustenance': return <Utensils size={20} />;
    default: return <Receipt size={20} />;
  }
}

function getCategoryColor(category) {
  switch (category) {
    case 'Travel': return { bg: '#dbeafe', color: '#2563eb' };
    case 'Accommodation': return { bg: '#f3e8ff', color: '#7c3aed' };
    case 'Sustenance': return { bg: '#ffedd5', color: '#ea580c' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Approved': case 'Paid': return { bg: '#dcfce7', color: '#166534' };
    case 'Submitted': return { bg: '#dbeafe', color: '#1e40af' };
    case 'Rejected': return { bg: '#fee2e2', color: '#991b1b' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

export default function ExpenseDetailModal({
  isOpen,
  expense,
  resources,
  hasRole,
  canEditChargeable,
  canSubmitExpense,
  canValidateExpense,
  canEditExpense,
  canDeleteExpense,
  onClose,
  onSave,
  onSubmit,
  onValidate,
  onReject,
  onDelete,
  onDownloadFile
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (expense) {
      setEditForm({
        category: expense.category,
        resource_id: expense.resource_id,
        expense_date: expense.expense_date,
        reason: expense.reason,
        amount: expense.amount,
        notes: expense.notes || '',
        status: expense.status,
        chargeable_to_customer: expense.chargeable_to_customer !== false,
        procurement_method: expense.procurement_method || 'supplier'
      });
      setIsEditing(false);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const catColors = getCategoryColor(expense.category);
  const statusColors = getStatusColor(expense.status);
  const isChargeable = expense.chargeable_to_customer !== false;

  async function handleSave() {
    await onSave(expense.id, editForm);
    setIsEditing(false);
  }

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: catColors.bg,
              color: catColors.color
            }}>
              {getCategoryIcon(expense.category)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                {expense.expense_ref || 'Expense Details'}
              </h2>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {expense.category} Expense
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: statusColors.bg,
              color: statusColors.color
            }}>
              {STATUS_DISPLAY_NAMES[expense.status] || expense.status}
            </span>
            <button 
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: '#64748b'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {isEditing ? (
            /* Edit Form */
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Resource
                  </label>
                  <select
                    className="form-input"
                    value={editForm.resource_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.expense_date}
                    onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Amount (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Reason
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Notes
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {canEditChargeable() && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="chargeable"
                      checked={editForm.chargeable_to_customer}
                      onChange={(e) => setEditForm({ ...editForm, chargeable_to_customer: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="chargeable" style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      Chargeable to Customer
                    </label>
                  </div>
                )}
                {hasRole(['admin', 'supplier_pm']) && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Procurement Method
                    </label>
                    <select
                      className="form-input"
                      value={editForm.procurement_method}
                      onChange={(e) => setEditForm({ ...editForm, procurement_method: e.target.value })}
                    >
                      <option value="supplier">Supplier</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                )}
              </div>

              {canValidateExpense(expense) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Status
                  </label>
                  <select
                    className="form-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* View Mode */
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Key Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Resource</div>
                    <div style={{ fontWeight: '500' }}>{expense.resource_name || 'Unknown'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontWeight: '500' }}>{new Date(expense.expense_date).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <DollarSign size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Amount</div>
                    <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#0f172a' }}>£{parseFloat(expense.amount).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isChargeable ? <CheckCircle size={18} style={{ color: '#10b981' }} /> : <X size={18} style={{ color: '#f59e0b' }} />}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Chargeable</div>
                    <div style={{ fontWeight: '500', color: isChargeable ? '#10b981' : '#f59e0b' }}>
                      {isChargeable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                  Reason
                </div>
                <div style={{ fontSize: '0.9375rem' }}>{expense.reason || 'No reason provided'}</div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                    Notes
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: '#475569' }}>{expense.notes}</div>
                </div>
              )}

              {/* Procurement - only for certain roles */}
              {hasRole(['admin', 'supplier_pm']) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {(expense.procurement_method || 'supplier') === 'partner' ? (
                    <Building2 size={18} style={{ color: '#7c3aed' }} />
                  ) : (
                    <Briefcase size={18} style={{ color: '#4338ca' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Procured By</div>
                    <div style={{ fontWeight: '500' }}>
                      {(expense.procurement_method || 'supplier') === 'partner' ? 'Partner (Reimbursable)' : 'Supplier (JT Direct)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Receipts */}
              {expense.expense_files?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Receipts ({expense.expense_files.length})
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {expense.expense_files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => onDownloadFile(file.file_path, file.file_name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Download size={16} style={{ color: '#3b82f6' }} />
                        {file.file_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                fontSize: '0.8125rem', 
                color: '#64748b',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={14} />
                  Created: {expense.created_at ? new Date(expense.created_at).toLocaleString('en-GB') : 'Unknown'}
                </div>
                {expense.updated_at && expense.updated_at !== expense.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} />
                    Updated: {new Date(expense.updated_at).toLocaleString('en-GB')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            {canDeleteExpense(expense) && !isEditing && (
              <button
                onClick={() => { onDelete(expense); handleClose(); }}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Save size={16} /> Save Changes
                </button>
              </>
            ) : (
              <>
                {canSubmitExpense(expense) && (
                  <button 
                    onClick={() => { onSubmit(expense.id); handleClose(); }} 
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Send size={16} /> Submit for Validation
                  </button>
                )}
                {canValidateExpense(expense) && (
                  <>
                    <button 
                      onClick={() => { onReject(expense.id); handleClose(); }} 
                      className="btn btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => { onValidate(expense.id); handleClose(); }} 
                      className="btn btn-success"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <CheckCircle size={16} /> Validate
                    </button>
                  </>
                )}
                {canEditExpense(expense) && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
