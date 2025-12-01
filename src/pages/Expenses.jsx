/**
 * Expenses Page
 * 
 * Track project expenses with category breakdown, validation workflow,
 * and procurement method tracking. Includes Smart Receipt Scanner
 * for AI-powered expense entry from receipt photos.
 * 
 * @version 4.0
 * @refactored 1 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { expensesService, resourcesService } from '../services';
import { supabase } from '../lib/supabase';
import { Receipt, Plus, Camera, Sparkles, CheckCircle, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';

// Extracted components
import {
  ReceiptScanner,
  ExpenseFilters,
  CategoryBreakdown,
  ResourceBreakdown,
  ExpenseGuidelines,
  ExpenseAddForm,
  ExpenseTable
} from '../components/expenses';

// Constants
const BUDGET = 20520;

// Initial form state
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
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const currentUserId = user?.id || null;

  const { canAddExpense, canSubmitExpense, canValidateExpense, canEditExpense, canDeleteExpense, getAvailableResources, hasRole } = usePermissions();

  // State
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [entryMode, setEntryMode] = useState('form');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newExpense, setNewExpense] = useState(INITIAL_EXPENSE_FORM);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChargeable, setFilterChargeable] = useState('all');
  const [filterProcurement, setFilterProcurement] = useState('all');

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, expenseId: null, expenseData: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, expense: null, editMode: false, editData: null });

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
    }
  }, [projectId, showTestUsers, testUserIds, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Add new expenses
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
      await expensesService.create({
        project_id: projectId, category: expenseData.category, resource_id: expenseData.resource_id, resource_name: expenseData.resource_name,
        expense_date: expenseData.expense_date, reason: expenseData.reason, amount: expenseData.amount, notes: expenseData.notes,
        created_by: currentUserId, chargeable_to_customer: expenseData.chargeable_to_customer, procurement_method: expenseData.procurement_method
      });
      await fetchData();
    } catch (error) {
      console.error('Error creating scanned expense:', error);
      showError('Failed to create expense: ' + error.message);
    }
  }

  function handleEdit(expense) {
    setEditingId(expense.id);
    setEditForm({
      category: expense.category, resource_id: expense.resource_id, resource_name: expense.resource_name,
      expense_date: expense.expense_date, reason: expense.reason, amount: expense.amount, notes: expense.notes, status: expense.status,
      chargeable_to_customer: expense.chargeable_to_customer !== false, procurement_method: expense.procurement_method || 'supplier'
    });
  }

  async function handleSave(id) {
    try {
      const resourceName = resources.find(r => r.id === editForm.resource_id)?.name || editForm.resource_name;
      await expensesService.update(id, {
        category: editForm.category, resource_id: editForm.resource_id, resource_name: resourceName,
        expense_date: editForm.expense_date, reason: editForm.reason, amount: parseFloat(editForm.amount), notes: editForm.notes,
        status: editForm.status, chargeable_to_customer: editForm.chargeable_to_customer, procurement_method: editForm.procurement_method
      });
      await fetchData();
      setEditingId(null);
      showSuccess('Expense updated!');
    } catch (error) {
      console.error('Error updating expense:', error);
      showError('Failed to update: ' + error.message);
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

  async function handleSubmit(id) {
    if (!confirm('Submit this expense for validation?')) return;
    try { await expensesService.submit(id); await fetchData(); showSuccess('Expense submitted for validation!'); } catch (error) { console.error('Error submitting expense:', error); showError('Failed to submit: ' + error.message); }
  }

  async function handleApprove(id) {
    try { await expensesService.approve(id); await fetchData(); showSuccess('Expense validated!'); } catch (error) { console.error('Error validating expense:', error); showError('Failed to validate: ' + error.message); }
  }

  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try { await expensesService.reject(id, reason); await fetchData(); showWarning('Expense rejected'); } catch (error) { console.error('Error rejecting expense:', error); showError('Failed to reject: ' + error.message); }
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

  function canEditChargeable() { return hasRole(['admin', 'supplier_pm', 'customer_pm']); }

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterResource !== 'all' && e.resource_name !== filterResource) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterChargeable === 'chargeable' && e.chargeable_to_customer === false) return false;
    if (filterChargeable === 'non-chargeable' && e.chargeable_to_customer !== false) return false;
    if (filterProcurement !== 'all' && (e.procurement_method || 'supplier') !== filterProcurement) return false;
    return true;
  });

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const chargeableTotal = expenses.filter(e => e.chargeable_to_customer !== false).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const nonChargeableTotal = expenses.filter(e => e.chargeable_to_customer === false).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const approvedSpent = expenses.filter(e => ['Approved', 'Paid'].includes(e.status)).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const remaining = BUDGET - approvedSpent;
  const pendingCount = expenses.filter(e => e.status === 'Submitted').length;
  const supplierProcuredTotal = expenses.filter(e => (e.procurement_method || 'supplier') === 'supplier').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const partnerProcuredTotal = expenses.filter(e => e.procurement_method === 'partner').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const categoryTotals = {
    Travel: expenses.filter(e => e.category === 'Travel').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Accommodation: expenses.filter(e => e.category === 'Accommodation').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Sustenance: expenses.filter(e => e.category === 'Sustenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  };

  const resourceTotals = {};
  expenses.forEach(e => {
    if (!resourceTotals[e.resource_name]) resourceTotals[e.resource_name] = { total: 0, chargeable: 0, nonChargeable: 0 };
    const amount = parseFloat(e.amount || 0);
    resourceTotals[e.resource_name].total += amount;
    if (e.chargeable_to_customer !== false) resourceTotals[e.resource_name].chargeable += amount;
    else resourceTotals[e.resource_name].nonChargeable += amount;
  });

  const availableResources = getAvailableResources(resources);
  const resourceNames = [...new Set(expenses.map(e => e.resource_name))];

  if (loading && !projectId) return <LoadingSpinner message="Loading expenses..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader icon={Receipt} title="Expenses" subtitle={`Track project expenses against £${BUDGET.toLocaleString()} budget`}>
        {canAddExpense && !showAddForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => { setEntryMode('form'); setShowAddForm(true); }}>
              <Plus size={18} /> Add Expenses
            </button>
            <button className="btn btn-secondary" onClick={() => { setEntryMode('scanner'); setShowAddForm(true); }} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', border: 'none' }} title="Scan a receipt with AI">
              <Camera size={18} /> <Sparkles size={14} /> Scan Receipt
            </button>
          </div>
        )}
      </PageHeader>

      {/* Budget Overview */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={Receipt} label="Total Budget" value={`£${BUDGET.toLocaleString()}`} color="#3b82f6" />
        <StatCard label="Total Claimed" value={`£${totalSpent.toLocaleString()}`} color="#3b82f6" />
        <StatCard icon={CheckCircle} label="Chargeable" value={`£${chargeableTotal.toLocaleString()}`} color="#10b981" />
        <StatCard icon={AlertCircle} label="Non-Chargeable" value={`£${nonChargeableTotal.toLocaleString()}`} color="#f59e0b" />
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard label="Validated/Paid" value={`£${approvedSpent.toLocaleString()}`} color="#10b981" />
        <StatCard label="Remaining Budget" value={`£${remaining.toLocaleString()}`} color={remaining < BUDGET * 0.2 ? '#ef4444' : '#10b981'} />
        <StatCard label="Pending Validation" value={pendingCount} color="#f59e0b" />
      </div>

      {hasRole(['admin', 'supplier_pm']) && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard icon={Briefcase} label="Supplier Procured" value={`£${supplierProcuredTotal.toLocaleString()}`} subtext="Paid directly by JT" color="#6366f1" />
          <StatCard icon={Building2} label="Partner Procured" value={`£${partnerProcuredTotal.toLocaleString()}`} subtext="Reimbursable to partners" color="#8b5cf6" />
        </div>
      )}

      <CategoryBreakdown expenses={expenses} categoryTotals={categoryTotals} />
      <ResourceBreakdown resourceTotals={resourceTotals} />

      <ExpenseFilters
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        filterResource={filterResource} setFilterResource={setFilterResource}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterChargeable={filterChargeable} setFilterChargeable={setFilterChargeable}
        filterProcurement={filterProcurement} setFilterProcurement={setFilterProcurement}
        resourceNames={resourceNames} hasRole={hasRole}
      />

      {showAddForm && entryMode === 'form' && (
        <ExpenseAddForm
          newExpense={newExpense} setNewExpense={setNewExpense} availableResources={availableResources}
          hasRole={hasRole} handleAdd={handleAdd} handleFileSelect={handleFileSelect}
          removeFile={removeFile} uploadingFiles={uploadingFiles} onCancel={() => setShowAddForm(false)}
        />
      )}

      {showAddForm && entryMode === 'scanner' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ReceiptScanner
            resources={availableResources}
            defaultResourceId={availableResources.length === 1 ? availableResources[0].id : null}
            onExpenseCreated={handleScannedExpense}
            onCancel={() => { setShowAddForm(false); setEntryMode('form'); }}
          />
        </div>
      )}

      <ExpenseTable
        expenses={filteredExpenses} editingId={editingId} editForm={editForm} setEditForm={setEditForm}
        resources={resources} hasRole={hasRole} canEditChargeable={canEditChargeable}
        canSubmitExpense={canSubmitExpense} canValidateExpense={canValidateExpense}
        canEditExpense={canEditExpense} canDeleteExpense={canDeleteExpense}
        handleEdit={handleEdit} handleSave={handleSave} handleSubmit={handleSubmit}
        handleApprove={handleApprove} handleReject={handleReject} handleDeleteClick={handleDeleteClick}
        downloadFile={downloadFile} setEditingId={setEditingId} setDetailModal={setDetailModal}
      />

      <ExpenseGuidelines />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, expenseId: null, expenseData: null })}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={deleteDialog.expenseData ? (
          <div>
            <p>Are you sure you want to delete this expense?</p>
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '0.75rem', marginTop: '0.75rem' }}>
              <p style={{ fontWeight: '600', color: '#92400e', margin: '0 0 0.5rem 0' }}>Details:</p>
              <ul style={{ margin: '0', paddingLeft: '1.25rem', color: '#92400e', fontSize: '0.9rem' }}>
                <li><strong>Resource:</strong> {deleteDialog.expenseData.resourceName}</li>
                <li><strong>Category:</strong> {deleteDialog.expenseData.category}</li>
                <li><strong>Amount:</strong> £{deleteDialog.expenseData.totalAmount?.toFixed(2)}</li>
                <li><strong>Status:</strong> {deleteDialog.expenseData.status}</li>
              </ul>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>This expense can be restored from the audit log if needed.</p>
          </div>
        ) : 'Are you sure you want to delete this expense?'}
        confirmText="Delete" cancelText="Cancel" variant="danger"
      />
    </div>
  );
}
