/**
 * Expense Detail Modal - Apple Design System
 * 
 * Full-screen modal for viewing, editing, and validating individual expenses.
 * Includes:
 * - Clean Apple-style design
 * - Receipt image previews with full-size view on click
 * - Full edit form with all fields
 * - Action buttons for workflow (Submit, Validate, Reject)
 * 
 * @version 3.0 - TD-001: Uses useExpensePermissions hook internally
 * @updated 28 December 2025
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2, ExternalLink, ZoomIn,
  Car, Home, Utensils, Receipt, Building2, Briefcase, Calendar,
  User, DollarSign, Clock, Paperclip, Image
} from 'lucide-react';
import { useExpensePermissions } from '../../hooks';
import './ExpenseDetailModal.css';

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

function getCategoryClass(category) {
  switch (category) {
    case 'Travel': return 'cat-travel';
    case 'Accommodation': return 'cat-accommodation';
    case 'Sustenance': return 'cat-sustenance';
    default: return 'cat-default';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Approved': case 'Paid': return 'stat-validated';
    case 'Submitted': return 'stat-submitted';
    case 'Rejected': return 'stat-rejected';
    default: return 'stat-draft';
  }
}

/**
 * Get public URL for a receipt file from Supabase storage
 * Supports both 'receipts' bucket (manual uploads) and 'receipt-scans' bucket (scanner uploads)
 */
function getReceiptUrl(file) {
  const filePath = file.file_path;
  const bucket = file.bucket || 'receipts';
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

/**
 * Check if file is an image based on extension
 */
function isImageFile(fileName) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
}

/**
 * Receipt Gallery Component - Shows receipt images with preview
 */
function ReceiptGallery({ files, onDownload }) {
  const [expandedImage, setExpandedImage] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    // Get URLs for all image files
    const urls = {};
    files.forEach(file => {
      if (isImageFile(file.file_name)) {
        urls[file.id || file.file_path] = getReceiptUrl(file);
      }
    });
    setImageUrls(urls);
  }, [files]);

  if (!files || files.length === 0) return null;

  return (
    <>
      <div className="receipts-section">
        <div className="section-label">
          <Paperclip size={16} />
          <span>Receipts ({files.length})</span>
        </div>
        <div className="receipts-grid">
          {files.map((file, idx) => {
            const fileKey = file.id || file.file_path;
            const imageUrl = imageUrls[fileKey];
            const isImage = isImageFile(file.file_name);

            return (
              <div key={idx} className="receipt-item">
                {isImage && imageUrl ? (
                  <div 
                    className="receipt-image-container"
                    onClick={() => setExpandedImage({ url: imageUrl, name: file.file_name })}
                  >
                    <img 
                      src={imageUrl} 
                      alt={file.file_name}
                      className="receipt-thumbnail"
                    />
                    <div className="receipt-overlay">
                      <ZoomIn size={20} />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="receipt-file-icon"
                    onClick={() => onDownload(file.file_path, file.file_name)}
                  >
                    <Receipt size={24} />
                  </div>
                )}
                <div className="receipt-info">
                  <span className="receipt-name" title={file.file_name}>
                    {file.file_name.length > 20 
                      ? file.file_name.substring(0, 17) + '...' 
                      : file.file_name}
                  </span>
                  <button 
                    className="receipt-download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(file.file_path, file.file_name);
                    }}
                    title="Download"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-size Image Modal */}
      {expandedImage && (
        <div 
          className="image-modal-overlay"
          onClick={() => setExpandedImage(null)}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setExpandedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={expandedImage.url} 
              alt={expandedImage.name}
              className="image-modal-img"
            />
            <div className="image-modal-caption">{expandedImage.name}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ExpenseDetailModal({
  isOpen,
  expense,
  resources,
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

  // Get permissions from hook - centralised permission logic
  const permissions = useExpensePermissions(expense);

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} data-testid="expense-detail-modal">
        {/* Header */}
        <header className="modal-header">
          <div className="modal-header-left">
            <div className={`modal-icon ${getCategoryClass(expense.category)}`}>
              {getCategoryIcon(expense.category)}
            </div>
            <div className="modal-title-group">
              <h2>{expense.expense_ref || 'Expense Details'}</h2>
              <span>{expense.category} Expense</span>
            </div>
          </div>
          <div className="modal-header-right">
            <span className={`modal-status ${getStatusClass(expense.status)}`} data-testid="expense-modal-status">
              {STATUS_DISPLAY_NAMES[expense.status] || expense.status}
            </span>
            <button className="modal-close" onClick={handleClose} data-testid="expense-modal-close">
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="modal-body">
          {isEditing ? (
            /* Edit Form */
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Resource</label>
                  <select
                    value={editForm.resource_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={editForm.expense_date}
                    onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Reason</label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div className="form-row">
                {permissions.canEditChargeable && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.chargeable_to_customer}
                      onChange={(e) => setEditForm({ ...editForm, chargeable_to_customer: e.target.checked })}
                    />
                    <span>Chargeable to Customer</span>
                  </label>
                )}
                {permissions.canEditProcurement && (
                  <div className="form-group">
                    <label>Procurement</label>
                    <select
                      value={editForm.procurement_method}
                      onChange={(e) => setEditForm({ ...editForm, procurement_method: e.target.value })}
                    >
                      <option value="supplier">Supplier</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                )}
              </div>

              {permissions.canValidate && (
                <div className="form-group">
                  <label>Status</label>
                  <select
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
            <div className="view-content">
              {/* Key Details Grid */}
              <div className="details-grid">
                <div className="detail-item">
                  <User size={18} />
                  <div>
                    <span className="detail-label">Resource</span>
                    <span className="detail-value">{expense.resource_name || 'Unknown'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar size={18} />
                  <div>
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{new Date(expense.expense_date).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <DollarSign size={18} />
                  <div>
                    <span className="detail-label">Amount</span>
                    <span className="detail-value amount">£{parseFloat(expense.amount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  {isChargeable ? <CheckCircle size={18} className="icon-success" /> : <X size={18} className="icon-warning" />}
                  <div>
                    <span className="detail-label">Chargeable</span>
                    <span className={`detail-value ${isChargeable ? 'text-success' : 'text-warning'}`}>
                      {isChargeable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="info-section">
                <span className="section-label">Reason</span>
                <p className="section-content">{expense.reason || 'No reason provided'}</p>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div className="info-section">
                  <span className="section-label">Notes</span>
                  <p className="section-content secondary">{expense.notes}</p>
                </div>
              )}

              {/* Procurement - only for certain roles */}
              {permissions.canSeeProcurement && (
                <div className="info-section inline">
                  {(expense.procurement_method || 'supplier') === 'partner' ? (
                    <Building2 size={18} className="icon-purple" />
                  ) : (
                    <Briefcase size={18} className="icon-blue" />
                  )}
                  <div>
                    <span className="section-label">Procured By</span>
                    <span className="section-content">
                      {(expense.procurement_method || 'supplier') === 'partner' ? 'Partner (Reimbursable)' : 'Supplier (JT Direct)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Receipts Gallery */}
              <ReceiptGallery 
                files={expense.expense_files || []} 
                onDownload={onDownloadFile}
              />

              {/* Timestamps */}
              <div className="timestamps">
                <span><Clock size={14} /> Created: {expense.created_at ? new Date(expense.created_at).toLocaleString('en-GB') : 'Unknown'}</span>
                {expense.updated_at && expense.updated_at !== expense.created_at && (
                  <span><Clock size={14} /> Updated: {new Date(expense.updated_at).toLocaleString('en-GB')}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="modal-footer">
          <div className="footer-left">
            {permissions.canDelete && !isEditing && (
              <button
                onClick={() => { onDelete(expense); handleClose(); }}
                className="btn btn-danger"
                data-testid="expense-delete-button"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div className="footer-right">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary" data-testid="expense-edit-cancel">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" data-testid="expense-edit-save">
                  <Save size={16} /> Save Changes
                </button>
              </>
            ) : (
              <>
                {permissions.canSubmit && (
                  <button 
                    onClick={() => { onSubmit(expense); handleClose(); }} 
                    className="btn btn-secondary"
                    data-testid="expense-submit-button"
                  >
                    <Send size={16} /> Submit
                  </button>
                )}
                {permissions.canValidate && (
                  <>
                    <button 
                      onClick={() => { onReject(expense.id); handleClose(); }} 
                      className="btn btn-danger"
                      data-testid="expense-reject-button"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => { onValidate(expense.id); handleClose(); }} 
                      className="btn btn-success"
                      data-testid="expense-validate-button"
                    >
                      <CheckCircle size={16} /> Validate
                    </button>
                  </>
                )}
                {permissions.canEdit && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="btn btn-primary"
                    data-testid="expense-edit-button"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
