/**
 * Expense Table Component
 * 
 * Data table for expenses with:
 * - Inline editing
 * - Action buttons (submit, approve, reject, edit, delete)
 * - Status and category badges
 * - Receipt downloads
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Expenses.jsx
 */

import React from 'react';
import { 
  Car, Home, Utensils, Receipt, Building2, Briefcase,
  Edit2, Save, X, Trash2, Download, Send, CheckCircle, Check
} from 'lucide-react';

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
    case 'Travel': return <Car size={16} />;
    case 'Accommodation': return <Home size={16} />;
    case 'Sustenance': return <Utensils size={16} />;
    default: return <Receipt size={16} />;
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
    case 'Approved': case 'Paid': return 'status-completed';
    case 'Submitted': return 'status-in-progress';
    case 'Rejected': return 'status-at-risk';
    default: return 'status-not-started';
  }
}

/**
 * Single Expense Row Component
 */
function ExpenseRow({ 
  expense, 
  editingId, 
  editForm, 
  setEditForm, 
  resources, 
  hasRole, 
  canEditChargeable, 
  canSubmitExpense, 
  canValidateExpense, 
  canEditExpense, 
  canDeleteExpense, 
  handleEdit, 
  handleSave, 
  handleSubmit, 
  handleValidate, 
  handleReject, 
  handleDeleteClick, 
  downloadFile, 
  setEditingId, 
  setDetailModal 
}) {
  const catColors = getCategoryColor(expense.category);
  const isChargeable = expense.chargeable_to_customer !== false;
  const isEditing = editingId === expense.id;

  return (
    <tr 
      style={{ backgroundColor: !isChargeable ? '#fffbeb' : 'inherit', cursor: isEditing ? 'default' : 'pointer' }} 
      onClick={() => !isEditing && setDetailModal({ isOpen: true, expense })}
    >
      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{expense.expense_ref || '-'}</td>
      <td>
        {isEditing ? (
          <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
            <option value="Travel">Travel</option>
            <option value="Accommodation">Accommodation</option>
            <option value="Sustenance">Sustenance</option>
          </select>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: catColors.bg, color: catColors.color }}>
            {getCategoryIcon(expense.category)}
            {expense.category}
          </span>
        )}
      </td>
      <td>
        {isEditing ? (
          <select className="form-input" value={editForm.resource_id || ''} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })}>
            <option value="">-- Select --</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : expense.resource_name}
      </td>
      <td>
        {isEditing ? (
          <input type="date" className="form-input" value={editForm.expense_date} onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })} />
        ) : new Date(expense.expense_date).toLocaleDateString('en-GB')}
      </td>
      <td style={{ maxWidth: '200px' }}>
        {isEditing ? (
          <input type="text" className="form-input" value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} />
        ) : (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.reason}</div>
        )}
      </td>
      <td style={{ textAlign: 'right', fontWeight: '600' }}>
        {isEditing ? (
          <input type="number" step="0.01" className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
        ) : `£${parseFloat(expense.amount).toFixed(2)}`}
      </td>
      <td>
        {isEditing && canEditChargeable() ? (
          <input type="checkbox" checked={editForm.chargeable_to_customer} onChange={(e) => setEditForm({ ...editForm, chargeable_to_customer: e.target.checked })} style={{ width: '18px', height: '18px' }} />
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: isChargeable ? '#dcfce7' : '#fef3c7', color: isChargeable ? '#166534' : '#92400e' }}>
            {isChargeable ? <Check size={12} /> : <X size={12} />}
            {isChargeable ? 'Yes' : 'No'}
          </span>
        )}
      </td>
      {hasRole(['admin', 'supplier_pm']) && (
        <td>
          {isEditing ? (
            <select className="form-input" value={editForm.procurement_method || 'supplier'} onChange={(e) => setEditForm({ ...editForm, procurement_method: e.target.value })} style={{ fontSize: '0.85rem', padding: '0.25rem' }}>
              <option value="supplier">Supplier</option>
              <option value="partner">Partner</option>
            </select>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: (expense.procurement_method || 'supplier') === 'partner' ? '#f3e8ff' : '#e0e7ff', color: (expense.procurement_method || 'supplier') === 'partner' ? '#7c3aed' : '#4338ca' }}>
              {(expense.procurement_method || 'supplier') === 'partner' ? <Building2 size={12} /> : <Briefcase size={12} />}
              {(expense.procurement_method || 'supplier') === 'partner' ? 'Partner' : 'Supplier'}
            </span>
          )}
        </td>
      )}
      <td>
        {isEditing && canValidateExpense(expense) ? (
          <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
          </select>
        ) : (
          <span className={`status-badge ${getStatusColor(expense.status)}`}>
            {STATUS_DISPLAY_NAMES[expense.status] || expense.status}
          </span>
        )}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        {expense.expense_files?.length > 0 ? (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {expense.expense_files.map((file, idx) => (
              <button key={idx} onClick={() => downloadFile(file.file_path, file.file_name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title={file.file_name}>
                <Download size={16} />
              </button>
            ))}
          </div>
        ) : '-'}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <div className="action-buttons">
            <button className="btn-icon btn-success" onClick={() => handleSave(expense.id)}><Save size={16} /></button>
            <button className="btn-icon btn-secondary" onClick={() => setEditingId(null)}><X size={16} /></button>
          </div>
        ) : (
          <div className="action-buttons">
            {canSubmitExpense(expense) && <button className="btn-icon" onClick={() => handleSubmit(expense.id)} title="Submit for Validation" style={{ color: '#3b82f6' }}><Send size={16} /></button>}
            {canValidateExpense(expense) && (
              <>
                <button className="btn-icon btn-success" onClick={() => handleValidate(expense.id)} title="Validate"><CheckCircle size={16} /></button>
                <button className="btn-icon btn-danger" onClick={() => handleReject(expense.id)} title="Reject"><X size={16} /></button>
              </>
            )}
            {canEditExpense(expense) && <button className="btn-icon" onClick={() => handleEdit(expense)} title="Edit"><Edit2 size={16} /></button>}
            {canDeleteExpense(expense) && <button className="btn-icon btn-danger" onClick={() => handleDeleteClick(expense)} title="Delete"><Trash2 size={16} /></button>}
          </div>
        )}
      </td>
    </tr>
  );
}

/**
 * Main Expense Table Component
 */
export default function ExpenseTable({
  expenses,
  editingId,
  editForm,
  setEditForm,
  resources,
  hasRole,
  canEditChargeable,
  canSubmitExpense,
  canValidateExpense,
  canEditExpense,
  canDeleteExpense,
  handleEdit,
  handleSave,
  handleSubmit,
  handleValidate,
  handleReject,
  handleDeleteClick,
  downloadFile,
  setEditingId,
  setDetailModal
}) {
  const showProcurement = hasRole(['admin', 'supplier_pm']);

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Type</th>
            <th>Resource</th>
            <th>Date</th>
            <th>Reason</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th>Chargeable</th>
            {showProcurement && <th>Procured By</th>}
            <th>Status</th>
            <th>Receipts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={showProcurement ? 11 : 10} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No expenses found.
              </td>
            </tr>
          ) : (
            expenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                resources={resources}
                hasRole={hasRole}
                canEditChargeable={canEditChargeable}
                canSubmitExpense={canSubmitExpense}
                canValidateExpense={canValidateExpense}
                canEditExpense={canEditExpense}
                canDeleteExpense={canDeleteExpense}
                handleEdit={handleEdit}
                handleSave={handleSave}
                handleSubmit={handleSubmit}
                handleValidate={handleValidate}
                handleReject={handleReject}
                handleDeleteClick={handleDeleteClick}
                downloadFile={downloadFile}
                setEditingId={setEditingId}
                setDetailModal={setDetailModal}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
