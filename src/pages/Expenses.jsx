/**
 * Expenses Page - Apple Design System
 * 
 * Track project expenses with category breakdown, validation workflow,
 * and procurement method tracking. Includes Smart Receipt Scanner.
 * 
 * Features:
 * - Clean table with click-to-navigate pattern
 * - Detail modal shows receipt images
 * - All actions moved to modal (no action buttons in table)
 * 
 * @version 5.1 - Added data-testid attributes for E2E testing
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { expensesService, resourcesService } from '../services';
import { supabase } from '../lib/supabase';
import { Receipt, Plus, Camera, Sparkles, RefreshCw } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog, PromptDialog } from '../components/common';
import {
  ReceiptScanner,
  ExpenseFilters,
  ExpenseAddForm,
  ExpenseTable,
  ExpenseDetailModal
} from '../components/expenses';
import './Expenses.css';

const BUDGET = 20520;

const INITIAL_EXPENSE_FORM = {
  resource_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  travel_amount: '', travel_reason: '', travel_chargeable: true, travel_procurement: 'supplier',
  accommodation_amount: '', accommodation_reason: '', accommodation_chargeable: true, accommodation_procurement: 'supplier',
  sustenance_amount: '', sustenance_reason: '', sustenance_chargeable: true, sustenance_procurement: 'supplier',
  notes: '',
  files: []
};

export default function Expenses() {
  const { user } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const currentUserId = user?.id || null;

  // Note: canSubmitExpense, canValidateExpense, canEditExpense, canDeleteExpense removed
  // as ExpenseDetailModal now uses useExpensePermissions hook internally (TD-001)
  const { canAddExpense, getAvailableResources, hasRole } = usePermissions();

  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [entryMode, setEntryMode] = useState('form');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE_FORM);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChargeable, setFilterChargeable] = useState('all');
  const [filterProcurement, setFilterProcurement] = useState('all');

  // New multi-select and date range filters
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, expenseId: null, expenseData: null });
  const [submitDialog, setSubmitDialog] = useState({ isOpen: false, expense: null });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, expenseId: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, expense: null });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const expensesData = await expensesService.getAllFiltered(projectId, showTestUsers);
      setExpenses(expensesData);

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email, user_id, partner_id, partner:partners(id, name)')
        .order('name');
      
      let filteredResources = resourcesData || [];
      if (!showTestUsers && testUserIds?.length > 0) {
        filteredResources = filteredResources.filter(r => !r.user_id || !testUserIds.includes(r.user_id));
      }
      setResources(filteredResources);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, showTestUsers, testUserIds, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  async function handleAdd() {
    if (!newExpense.resource_id) { showWarning('Please select a resource'); return; }

    const hasTravel = parseFloat(newExpense.travel_amount) > 0;
    const hasAccommodation = parseFloat(newExpense.accommodation_amount) > 0;
    const hasSustenance = parseFloat(newExpense.sustenance_amount) > 0;

    if (!hasTravel && !hasAccommodation && !hasSustenance) { showWarning('Please enter at least one expense amount'); return; }
    if (hasTravel && !newExpense.travel_reason) { showWarning('Please enter a reason for the travel expense'); return; }
    if (hasAccommodation && !newExpense.accommodation_reason) { showWarning('Please enter a reason for the accommodation expense'); return; }
    if (hasSustenance && !newExpense.sustenance_reason) { showWarning('Please enter a reason for the sustenance expense'); return; }

    try {
      const resourceName = resources.find(r => r.id === newExpense.resource_id)?.name;
      const expensesToInsert = [];

      if (hasTravel) {
        expensesToInsert.push({
          project_id: projectId, category: 'Travel', resource_id: newExpense.resource_id, resource_name: resourceName,
          expense_date: newExpense.expense_date, reason: newExpense.travel_reason, amount: parseFloat(newExpense.travel_amount),
          notes: newExpense.notes, created_by: currentUserId, chargeable_to_customer: newExpense.travel_chargeable, procurement_method: newExpense.travel_procurement
        });
      }
      if (hasAccommodation) {
        expensesToInsert.push({
          project_id: projectId, category: 'Accommodation', resource_id: newExpense.resource_id, resource_name: resourceName,
          expense_date: newExpense.expense_date, reason: newExpense.accommodation_reason, amount: parseFloat(newExpense.accommodation_amount),
          notes: newExpense.notes, created_by: currentUserId, chargeable_to_customer: newExpense.accommodation_chargeable, procurement_method: newExpense.accommodation_procurement
        });
      }
      if (hasSustenance) {
        expensesToInsert.push({
          project_id: projectId, category: 'Sustenance', resource_id: newExpense.resource_id, resource_name: resourceName,
          expense_date: newExpense.expense_date, reason: newExpense.sustenance_reason, amount: parseFloat(newExpense.sustenance_amount),
          notes: newExpense.notes, created_by: currentUserId, chargeable_to_customer: newExpense.sustenance_chargeable, procurement_method: newExpense.sustenance_procurement
        });
      }

      const insertedExpenses = await expensesService.createMany(expensesToInsert);

      if (newExpense.files.length > 0 && insertedExpenses) {
        setUploadingFiles(true);
        for (const expense of insertedExpenses) {
          for (const file of newExpense.files) {
            try { await expensesService.uploadReceipt(expense.id, file, currentUserId); } catch (err) { console.error('File upload error:', err); }
          }
        }
        setUploadingFiles(false);
      }

      await fetchData();
      setShowAddForm(false);
      setNewExpense(INITIAL_EXPENSE_FORM);
      showSuccess('Expenses added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      showError('Failed to add expenses: ' + error.message);
    }
  }

  async function handleScannedExpense(expenseData) {
    try {
      // Create the expense
      const newExpense = await expensesService.create({
        project_id: projectId, 
        category: expenseData.category, 
        resource_id: expenseData.resource_id, 
        resource_name: expenseData.resource_name,
        expense_date: expenseData.expense_date, 
        reason: expenseData.reason, 
        amount: expenseData.amount, 
        notes: expenseData.notes,
        created_by: currentUserId, 
        chargeable_to_customer: expenseData.chargeable_to_customer, 
        procurement_method: expenseData.procurement_method
      });

      // Link the scanned receipt image to the expense
      if (newExpense && expenseData.receipt_image_url && expenseData.receipt_scan_id) {
        // Extract the file path from the full URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/receipt-scans/user-id/timestamp.jpg
        const urlParts = expenseData.receipt_image_url.split('/receipt-scans/');
        const filePath = urlParts.length > 1 ? urlParts[1] : expenseData.receipt_image_url;
        
        // Create an expense_files record linking to the receipt image
        const { error: fileError } = await supabase
          .from('expense_files')
          .insert({
            expense_id: newExpense.id,
            file_path: filePath,
            file_name: `scanned_receipt_${Date.now()}.jpg`,
            file_type: 'image/jpeg',
            file_size: 0, // Size not tracked for scanned receipts
            uploaded_by: currentUserId,
            bucket: 'receipt-scans' // Track which bucket the file is in
          });

        if (fileError) {
          console.error('Error linking receipt to expense:', fileError);
        }

        // Also update the receipt_scans record with the expense_id
        await supabase
          .from('receipt_scans')
          .update({ expense_id: newExpense.id, status: 'linked' })
          .eq('id', expenseData.receipt_scan_id);
      }

      await fetchData();
    } catch (error) {
      console.error('Error creating scanned expense:', error);
      showError('Failed to create expense: ' + error.message);
    }
  }

  function handleDeleteClick(expense) {
    setDeleteDialog({
      isOpen: true, expenseId: expense.id,
      expenseData: { resourceName: expense.resource_name, date: expense.expense_date, totalAmount: parseFloat(expense.amount || 0), category: expense.category, chargeable: expense.chargeable_to_customer, procurement: expense.procurement_method, status: expense.status }
    });
  }

  async function confirmDelete() {
    if (!deleteDialog.expenseId) return;
    try {
      await expensesService.delete(deleteDialog.expenseId, currentUserId);
      await fetchData();
      setDeleteDialog({ isOpen: false, expenseId: null, expenseData: null });
      showSuccess('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showError('Failed to delete: ' + error.message);
    }
  }

  function handleSubmitClick(expense) {
    setSubmitDialog({ isOpen: true, expense });
  }

  async function confirmSubmit() {
    if (!submitDialog.expense) return;
    try {
      await expensesService.submit(submitDialog.expense.id);
      setSubmitDialog({ isOpen: false, expense: null });
      await fetchData();
      showSuccess('Expense submitted for validation!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      showError('Failed to submit: ' + error.message);
    }
  }

  async function handleValidate(id) {
    try { await expensesService.validate(id); await fetchData(); showSuccess('Expense validated!'); } catch (error) { console.error('Error validating expense:', error); showError('Failed to validate: ' + error.message); }
  }

  function handleRejectClick(id) {
    setRejectDialog({ isOpen: true, expenseId: id });
  }

  async function confirmReject(reason) {
    if (!rejectDialog.expenseId) return;
    try {
      await expensesService.reject(rejectDialog.expenseId, reason);
      setRejectDialog({ isOpen: false, expenseId: null });
      await fetchData();
      showWarning('Expense rejected');
    } catch (error) {
      console.error('Error rejecting expense:', error);
      showError('Failed to reject: ' + error.message);
    }
  }

  function handleFileSelect(e) { const files = Array.from(e.target.files); setNewExpense({ ...newExpense, files: [...newExpense.files, ...files] }); }
  function removeFile(index) { setNewExpense({ ...newExpense, files: newExpense.files.filter((_, i) => i !== index) }); }

  async function downloadFile(filePath, fileName) {
    try {
      const blob = await expensesService.downloadReceipt(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (error) { console.error('Error downloading file:', error); showError('Failed to download file'); }
  }

  const filteredExpenses = expenses.filter(e => {
    // Date range filter
    if (filterDateStart && e.expense_date < filterDateStart) return false;
    if (filterDateEnd && e.expense_date > filterDateEnd) return false;
    // Multi-select category filter (use array if populated, else fall back to single select)
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(e.category)) return false;
    } else if (filterCategory !== 'all' && e.category !== filterCategory) {
      return false;
    }
    // Multi-select resource filter
    if (selectedResources.length > 0) {
      if (!selectedResources.includes(e.resource_name)) return false;
    } else if (filterResource !== 'all' && e.resource_name !== filterResource) {
      return false;
    }
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterChargeable === 'chargeable' && e.chargeable_to_customer === false) return false;
    if (filterChargeable === 'non-chargeable' && e.chargeable_to_customer !== false) return false;
    if (filterProcurement !== 'all' && (e.procurement_method || 'supplier') !== filterProcurement) return false;
    return true;
  });

  const availableResources = getAvailableResources(resources);
  const resourceNames = [...new Set(expenses.map(e => e.resource_name))];

  if (loading && !projectId) return <LoadingSpinner message="Loading expenses..." size="large" fullPage />;

  return (
    <div className="expenses-page" data-testid="expenses-page">
      <header className="exp-header" data-testid="expenses-header">
        <div className="exp-header-content">
          <div className="exp-header-left">
            <div className="exp-header-icon">
              <Receipt size={24} />
            </div>
            <div>
              <h1 data-testid="expenses-title">Expenses</h1>
              <p>Track project expenses against £{BUDGET.toLocaleString()} budget</p>
            </div>
          </div>
          <div className="exp-header-actions">
            <button 
              className="exp-btn exp-btn-secondary" 
              onClick={handleRefresh} 
              disabled={refreshing}
              data-testid="expenses-refresh-button"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {canAddExpense && !showAddForm && (
              <>
                <button 
                  className="exp-btn exp-btn-primary" 
                  onClick={() => { setEntryMode('form'); setShowAddForm(true); }}
                  data-testid="add-expense-button"
                >
                  <Plus size={16} /> Add Expenses
                </button>
                <button 
                  className="exp-btn exp-btn-scanner" 
                  onClick={() => { setEntryMode('scanner'); setShowAddForm(true); }} 
                  title="Scan a receipt with AI"
                  data-testid="scan-receipt-button"
                >
                  <Camera size={16} /> <Sparkles size={12} /> Scan Receipt
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="exp-content" data-testid="expenses-content">
        <div data-testid="expenses-filters">
          <ExpenseFilters
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            filterResource={filterResource} setFilterResource={setFilterResource}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterChargeable={filterChargeable} setFilterChargeable={setFilterChargeable}
            filterProcurement={filterProcurement} setFilterProcurement={setFilterProcurement}
            filterDateStart={filterDateStart} setFilterDateStart={setFilterDateStart}
            filterDateEnd={filterDateEnd} setFilterDateEnd={setFilterDateEnd}
            selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
            selectedResources={selectedResources} setSelectedResources={setSelectedResources}
            resourceNames={resourceNames} hasRole={hasRole}
            expenses={expenses}
          />
        </div>

        {showAddForm && entryMode === 'form' && (
          <div data-testid="expenses-add-form">
            <ExpenseAddForm
              newExpense={newExpense} setNewExpense={setNewExpense} availableResources={availableResources}
              hasRole={hasRole} handleAdd={handleAdd} handleFileSelect={handleFileSelect}
              removeFile={removeFile} uploadingFiles={uploadingFiles} onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {showAddForm && entryMode === 'scanner' && (
          <div className="exp-scanner-wrapper" data-testid="expenses-scanner">
            <ReceiptScanner
              resources={availableResources}
              defaultResourceId={availableResources.length === 1 ? availableResources[0].id : null}
              onExpenseCreated={handleScannedExpense}
              onCancel={() => { setShowAddForm(false); setEntryMode('form'); }}
            />
          </div>
        )}

        <div className="exp-table-card" data-testid="expenses-table-card">
          <div className="exp-table-header">
            <h2 className="exp-table-title">Expense Entries</h2>
            <span className="exp-table-count" data-testid="expenses-count">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div data-testid="expenses-table">
            <ExpenseTable
              expenses={filteredExpenses}
              hasRole={hasRole}
              setDetailModal={setDetailModal}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, expenseId: null, expenseData: null })}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={deleteDialog.expenseData ? (
          <div>
            <p>Are you sure you want to delete this expense?</p>
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
              <p style={{ fontWeight: '600', color: '#92400e', margin: '0 0 8px 0', fontSize: '14px' }}>Details:</p>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#92400e', fontSize: '13px', lineHeight: '1.6' }}>
                <li><strong>Resource:</strong> {deleteDialog.expenseData.resourceName}</li>
                <li><strong>Category:</strong> {deleteDialog.expenseData.category}</li>
                <li><strong>Amount:</strong> £{deleteDialog.expenseData.totalAmount?.toFixed(2)}</li>
                <li><strong>Status:</strong> {deleteDialog.expenseData.status}</li>
              </ul>
            </div>
          </div>
        ) : 'Are you sure you want to delete this expense?'}
        confirmText="Delete" cancelText="Cancel" type="danger"
      />

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={submitDialog.isOpen}
        onClose={() => setSubmitDialog({ isOpen: false, expense: null })}
        onConfirm={confirmSubmit}
        title="Submit for Validation"
        message={submitDialog.expense ? (
          <>
            Submit this expense for validation?
            <br /><br />
            <strong>{submitDialog.expense.category}</strong> - £{parseFloat(submitDialog.expense.amount || 0).toFixed(2)}
            <br />
            {submitDialog.expense.resource_name}
          </>
        ) : ''}
        confirmText="Submit"
        cancelText="Cancel"
        type="info"
      />

      {/* TD-001: ExpenseDetailModal now uses useExpensePermissions hook internally */}
      <ExpenseDetailModal
        isOpen={detailModal.isOpen}
        expense={detailModal.expense}
        resources={resources}
        onClose={() => setDetailModal({ isOpen: false, expense: null })}
        onSave={async (id, formData) => {
          const resourceName = resources.find(r => r.id === formData.resource_id)?.name || formData.resource_name;
          await expensesService.update(id, {
            category: formData.category, resource_id: formData.resource_id, resource_name: resourceName,
            expense_date: formData.expense_date, reason: formData.reason, amount: parseFloat(formData.amount),
            notes: formData.notes, status: formData.status, chargeable_to_customer: formData.chargeable_to_customer,
            procurement_method: formData.procurement_method
          });
          await fetchData();
          showSuccess('Expense updated!');
        }}
        onSubmit={handleSubmitClick}
        onValidate={handleValidate}
        onReject={handleRejectClick}
        onDelete={handleDeleteClick}
        onDownloadFile={downloadFile}
      />

      <PromptDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, expenseId: null })}
        onConfirm={confirmReject}
        title="Reject Expense"
        message="Please provide a reason for rejecting this expense."
        inputLabel="Rejection Reason"
        inputPlaceholder="Enter reason (optional)"
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
