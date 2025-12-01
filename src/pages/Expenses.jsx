/**
 * Expenses Page
 * 
 * Track project expenses with category breakdown, validation workflow,
 * and procurement method tracking. Now includes Smart Receipt Scanner
 * for AI-powered expense entry from receipt photos.
 * 
 * @version 3.0
 * @updated 2 December 2025
 * @phase Phase 2 - Smart Receipt Scanner
 */

import React, { useState, useEffect, useCallback } from 'react';
import { expensesService, resourcesService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Upload, Download,
  Car, Home, Utensils, AlertCircle, FileText, Check, User, Send, CheckCircle,
  Building2, Briefcase, Camera, Sparkles
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';
import { ReceiptScanner } from '../components/expenses';

// Constants
const BUDGET = 20520;
const CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];
const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected',
  'Paid': 'Paid'
};

// Initial form state
const INITIAL_EXPENSE_FORM = {
  resource_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  travel_amount: '',
  travel_reason: '',
  travel_chargeable: true,
  travel_procurement: 'supplier',
  accommodation_amount: '',
  accommodation_reason: '',
  accommodation_chargeable: true,
  accommodation_procurement: 'supplier',
  sustenance_amount: '',
  sustenance_reason: '',
  sustenance_chargeable: true,
  sustenance_procurement: 'supplier',
  notes: '',
  files: []
};

export default function Expenses() {
  // Contexts
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const currentUserId = user?.id || null;

  // Permissions
  const {
    canAddExpense,
    canSubmitExpense,
    canValidateExpense,
    canEditExpense,
    canDeleteExpense,
    getAvailableResources,
    hasRole
  } = usePermissions();

  // State
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [entryMode, setEntryMode] = useState('form'); // 'form' or 'scanner'
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

  // Fetch data using service layer
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Fetch expenses using service
      const expensesData = await expensesService.getAllFiltered(projectId, showTestUsers);
      setExpenses(expensesData);

      // Fetch resources with partner info
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email, user_id, partner_id, partner:partners(id, name)')
        .order('name');
      
      // Filter out resources linked to test users if not showing test users
      let filteredResources = resourcesData || [];
      if (!showTestUsers && testUserIds?.length > 0) {
        filteredResources = filteredResources.filter(r => 
          !r.user_id || !testUserIds.includes(r.user_id)
        );
      }
      setResources(filteredResources);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers, testUserIds, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add new expenses
  async function handleAdd() {
    if (!newExpense.resource_id) {
      showWarning('Please select a resource');
      return;
    }

    const hasTravel = parseFloat(newExpense.travel_amount) > 0;
    const hasAccommodation = parseFloat(newExpense.accommodation_amount) > 0;
    const hasSustenance = parseFloat(newExpense.sustenance_amount) > 0;

    if (!hasTravel && !hasAccommodation && !hasSustenance) {
      showWarning('Please enter at least one expense amount');
      return;
    }

    // Validation
    if (hasTravel && !newExpense.travel_reason) {
      showWarning('Please enter a reason for the travel expense');
      return;
    }
    if (hasAccommodation && !newExpense.accommodation_reason) {
      showWarning('Please enter a reason for the accommodation expense');
      return;
    }
    if (hasSustenance && !newExpense.sustenance_reason) {
      showWarning('Please enter a reason for the sustenance expense');
      return;
    }

    try {
      const resourceName = resources.find(r => r.id === newExpense.resource_id)?.name;
      const expensesToInsert = [];

      if (hasTravel) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Travel',
          resource_id: newExpense.resource_id,
          resource_name: resourceName,
          expense_date: newExpense.expense_date,
          reason: newExpense.travel_reason,
          amount: parseFloat(newExpense.travel_amount),
          notes: newExpense.notes,
          created_by: currentUserId,
          chargeable_to_customer: newExpense.travel_chargeable,
          procurement_method: newExpense.travel_procurement
        });
      }

      if (hasAccommodation) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Accommodation',
          resource_id: newExpense.resource_id,
          resource_name: resourceName,
          expense_date: newExpense.expense_date,
          reason: newExpense.accommodation_reason,
          amount: parseFloat(newExpense.accommodation_amount),
          notes: newExpense.notes,
          created_by: currentUserId,
          chargeable_to_customer: newExpense.accommodation_chargeable,
          procurement_method: newExpense.accommodation_procurement
        });
      }

      if (hasSustenance) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Sustenance',
          resource_id: newExpense.resource_id,
          resource_name: resourceName,
          expense_date: newExpense.expense_date,
          reason: newExpense.sustenance_reason,
          amount: parseFloat(newExpense.sustenance_amount),
          notes: newExpense.notes,
          created_by: currentUserId,
          chargeable_to_customer: newExpense.sustenance_chargeable,
          procurement_method: newExpense.sustenance_procurement
        });
      }

      // Use service to create expenses
      const insertedExpenses = await expensesService.createMany(expensesToInsert);

      // Handle file uploads
      if (newExpense.files.length > 0 && insertedExpenses) {
        setUploadingFiles(true);
        for (const expense of insertedExpenses) {
          for (const file of newExpense.files) {
            try {
              await expensesService.uploadReceipt(expense.id, file, currentUserId);
            } catch (uploadError) {
              console.error('File upload error:', uploadError);
            }
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

  // Handle expense created from receipt scanner
  async function handleScannedExpense(expenseData) {
    try {
      // Create expense using service
      const expense = await expensesService.create({
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

      await fetchData();
      // Don't close form - let scanner handle completion
    } catch (error) {
      console.error('Error creating scanned expense:', error);
      showError('Failed to create expense: ' + error.message);
    }
  }

  // Edit expense inline
  function handleEdit(expense) {
    setEditingId(expense.id);
    setEditForm({
      category: expense.category,
      resource_id: expense.resource_id,
      resource_name: expense.resource_name,
      expense_date: expense.expense_date,
      reason: expense.reason,
      amount: expense.amount,
      notes: expense.notes,
      status: expense.status,
      chargeable_to_customer: expense.chargeable_to_customer !== false,
      procurement_method: expense.procurement_method || 'supplier'
    });
  }

  // Save edit
  async function handleSave(id) {
    try {
      const resourceName = resources.find(r => r.id === editForm.resource_id)?.name || editForm.resource_name;
      
      await expensesService.update(id, {
        category: editForm.category,
        resource_id: editForm.resource_id,
        resource_name: resourceName,
        expense_date: editForm.expense_date,
        reason: editForm.reason,
        amount: parseFloat(editForm.amount),
        notes: editForm.notes,
        status: editForm.status,
        chargeable_to_customer: editForm.chargeable_to_customer,
        procurement_method: editForm.procurement_method
      });

      await fetchData();
      setEditingId(null);
      showSuccess('Expense updated!');
    } catch (error) {
      console.error('Error updating expense:', error);
      showError('Failed to update: ' + error.message);
    }
  }

  // Delete confirmation
  function handleDeleteClick(expense) {
    setDeleteDialog({
      isOpen: true,
      expenseId: expense.id,
      expenseData: {
        resourceName: expense.resource_name,
        date: expense.expense_date,
        totalAmount: parseFloat(expense.amount || 0),
        category: expense.category,
        chargeable: expense.chargeable_to_customer,
        procurement: expense.procurement_method,
        status: expense.status
      }
    });
  }

  // Confirm delete (soft delete via service)
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

  // Submit for validation
  async function handleSubmit(id) {
    if (!confirm('Submit this expense for validation?')) return;

    try {
      await expensesService.submit(id);
      await fetchData();
      showSuccess('Expense submitted for validation!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      showError('Failed to submit: ' + error.message);
    }
  }

  // Approve/validate
  async function handleApprove(id) {
    try {
      await expensesService.approve(id);
      await fetchData();
      showSuccess('Expense validated!');
    } catch (error) {
      console.error('Error validating expense:', error);
      showError('Failed to validate: ' + error.message);
    }
  }

  // Reject
  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      await expensesService.reject(id, reason);
      await fetchData();
      showWarning('Expense rejected');
    } catch (error) {
      console.error('Error rejecting expense:', error);
      showError('Failed to reject: ' + error.message);
    }
  }

  // File handling
  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    setNewExpense({ ...newExpense, files: [...newExpense.files, ...files] });
  }

  function removeFile(index) {
    setNewExpense({
      ...newExpense,
      files: newExpense.files.filter((_, i) => i !== index)
    });
  }

  async function downloadFile(filePath, fileName) {
    try {
      const blob = await expensesService.downloadReceipt(filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showError('Failed to download file');
    }
  }

  // Helper functions
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

  function canEditChargeable() {
    return hasRole(['admin', 'supplier_pm', 'customer_pm']);
  }

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

  // Category totals
  const categoryTotals = {
    Travel: expenses.filter(e => e.category === 'Travel').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Accommodation: expenses.filter(e => e.category === 'Accommodation').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Sustenance: expenses.filter(e => e.category === 'Sustenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  };

  // Resource totals
  const resourceTotals = {};
  expenses.forEach(e => {
    if (!resourceTotals[e.resource_name]) {
      resourceTotals[e.resource_name] = { total: 0, chargeable: 0, nonChargeable: 0 };
    }
    const amount = parseFloat(e.amount || 0);
    resourceTotals[e.resource_name].total += amount;
    if (e.chargeable_to_customer !== false) {
      resourceTotals[e.resource_name].chargeable += amount;
    } else {
      resourceTotals[e.resource_name].nonChargeable += amount;
    }
  });

  const availableResources = getAvailableResources(resources);

  if (loading && !projectId) return <LoadingSpinner message="Loading expenses..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader
        icon={Receipt}
        title="Expenses"
        subtitle={`Track project expenses against £${BUDGET.toLocaleString()} budget`}
      >
        {canAddExpense && !showAddForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => { setEntryMode('form'); setShowAddForm(true); }}
            >
              <Plus size={18} /> Add Expenses
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => { setEntryMode('scanner'); setShowAddForm(true); }}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', border: 'none' }}
              title="Scan a receipt with AI"
            >
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

      {/* Additional Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard label="Validated/Paid" value={`£${approvedSpent.toLocaleString()}`} color="#10b981" />
        <StatCard label="Remaining Budget" value={`£${remaining.toLocaleString()}`} color={remaining < BUDGET * 0.2 ? '#ef4444' : '#10b981'} />
        <StatCard label="Pending Validation" value={pendingCount} color="#f59e0b" />
      </div>

      {/* Procurement Breakdown */}
      {hasRole(['admin', 'supplier_pm']) && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard icon={Briefcase} label="Supplier Procured" value={`£${supplierProcuredTotal.toLocaleString()}`} subtext="Paid directly by JT" color="#6366f1" />
          <StatCard icon={Building2} label="Partner Procured" value={`£${partnerProcuredTotal.toLocaleString()}`} subtext="Reimbursable to partners" color="#8b5cf6" />
        </div>
      )}

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Breakdown by Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {CATEGORIES.map(cat => {
            const colors = getCategoryColor(cat);
            const count = expenses.filter(e => e.category === cat).length;
            const chargeableAmt = expenses.filter(e => e.category === cat && e.chargeable_to_customer !== false).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            return (
              <div key={cat} style={{ padding: '1rem', backgroundColor: colors.bg, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.color, marginBottom: '0.5rem' }}>
                  {getCategoryIcon(cat)}
                  <span style={{ fontWeight: '600' }}>{cat}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.color }}>£{categoryTotals[cat].toFixed(2)}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} expense(s)</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>£{chargeableAmt.toFixed(2)} chargeable</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Breakdown */}
      {Object.keys(resourceTotals).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Breakdown by Resource</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {Object.entries(resourceTotals).map(([name, totals]) => (
              <div key={name} style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User size={16} style={{ color: '#64748b' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{name}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>£{totals.total.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>£{totals.chargeable.toFixed(2)} chargeable</div>
                {totals.nonChargeable > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>£{totals.nonChargeable.toFixed(2)} non-chargeable</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Types</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {[...new Set(expenses.map(e => e.resource_name))].map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
          </select>
          <select value={filterChargeable} onChange={(e) => setFilterChargeable(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Expenses</option>
            <option value="chargeable">Chargeable Only</option>
            <option value="non-chargeable">Non-Chargeable Only</option>
          </select>
          {hasRole(['admin', 'supplier_pm']) && (
            <select value={filterProcurement} onChange={(e) => setFilterProcurement(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
              <option value="all">All Procurement</option>
              <option value="supplier">Supplier Procured</option>
              <option value="partner">Partner Procured</option>
            </select>
          )}
        </div>
      </div>

      {/* Add Form or Receipt Scanner */}
      {showAddForm && entryMode === 'form' && (
        <AddExpenseForm
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          availableResources={availableResources}
          hasRole={hasRole}
          handleAdd={handleAdd}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          uploadingFiles={uploadingFiles}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Receipt Scanner */}
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

      {/* Expenses Table */}
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
              {hasRole(['admin', 'supplier_pm']) && <th>Procured By</th>}
              <th>Status</th>
              <th>Receipts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan={hasRole(['admin', 'supplier_pm']) ? 11 : 10} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No expenses found.</td></tr>
            ) : (
              filteredExpenses.map(exp => (
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
                  getCategoryIcon={getCategoryIcon}
                  getCategoryColor={getCategoryColor}
                  getStatusColor={getStatusColor}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleSubmit={handleSubmit}
                  handleApprove={handleApprove}
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

      {/* Guidelines */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#92400e' }}>📋 Expense Guidelines</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
          <li>PMO travel/accommodation requires advance approval from Authority Project Manager</li>
          <li>Attach receipts for all expenses over £25</li>
          <li>Submit expenses within 30 days of incurring them</li>
          <li><strong>Submit:</strong> Click the send icon to submit for validation</li>
          <li><strong>Chargeable expenses:</strong> Validated by Customer PM</li>
          <li><strong>Non-chargeable expenses:</strong> Validated by Supplier PM</li>
        </ul>
      </div>

      {/* Delete Confirmation */}
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
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
              This expense can be restored from the audit log if needed.
            </p>
          </div>
        ) : 'Are you sure you want to delete this expense?'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

// Sub-components for cleaner code

function AddExpenseForm({ newExpense, setNewExpense, availableResources, hasRole, handleAdd, handleFileSelect, removeFile, uploadingFiles, onCancel }) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
      <h3 style={{ marginBottom: '1rem' }}>Add New Expenses</h3>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Enter amounts for any categories that apply. Leave blank to skip a category.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="form-label">Resource Name *</label>
          <select className="form-input" value={newExpense.resource_id} onChange={(e) => setNewExpense({ ...newExpense, resource_id: e.target.value })}>
            <option value="">Select Resource</option>
            {availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Date *</label>
          <input type="date" className="form-input" value={newExpense.expense_date} onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })} />
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
        <textarea className="form-input" rows={2} placeholder="Any additional information..." value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Attach Receipts</label>
        <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb' }} onClick={() => document.getElementById('file-upload').click()}>
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
                <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={handleAdd} disabled={uploadingFiles}>
          <Save size={16} /> {uploadingFiles ? 'Uploading...' : 'Save Expenses'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>
    </div>
  );
}

function CategoryInput({ category, icon, bgColor, textColor, borderColor, amount, reason, chargeable, procurement, onAmountChange, onReasonChange, onChargeableChange, onProcurementChange, hasRole }) {
  return (
    <div style={{ padding: '1rem', backgroundColor: bgColor, borderRadius: '8px', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: textColor, marginBottom: '0.75rem' }}>
        {icon}
        <span style={{ fontWeight: '600', fontSize: '1rem' }}>{category}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
        <div>
          <label className="form-label">Amount (£)</label>
          <input type="number" step="0.01" className="form-input" placeholder="0.00" value={amount} onChange={(e) => onAmountChange(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Reason / Description</label>
          <input type="text" className="form-input" placeholder={`e.g., ${category} expense description`} value={reason} onChange={(e) => onReasonChange(e.target.value)} />
        </div>
      </div>
      {parseFloat(amount) > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: `1px solid ${borderColor}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={chargeable} onChange={(e) => onChargeableChange(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: textColor }} />
            <span style={{ fontSize: '0.85rem', color: textColor }}>Chargeable to Customer</span>
          </label>
          {hasRole(['admin', 'supplier_pm']) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: textColor }}>Paid by:</span>
              <select value={procurement} onChange={(e) => onProcurementChange(e.target.value)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: `1px solid ${borderColor}`, fontSize: '0.85rem', backgroundColor: '#fff' }}>
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

function ExpenseRow({ expense, editingId, editForm, setEditForm, resources, hasRole, canEditChargeable, canSubmitExpense, canValidateExpense, canEditExpense, canDeleteExpense, getCategoryIcon, getCategoryColor, getStatusColor, handleEdit, handleSave, handleSubmit, handleApprove, handleReject, handleDeleteClick, downloadFile, setEditingId, setDetailModal }) {
  const catColors = getCategoryColor(expense.category);
  const isChargeable = expense.chargeable_to_customer !== false;
  const isEditing = editingId === expense.id;

  return (
    <tr style={{ backgroundColor: !isChargeable ? '#fffbeb' : 'inherit', cursor: isEditing ? 'default' : 'pointer' }} onClick={() => !isEditing && setDetailModal({ isOpen: true, expense })}>
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
          <span className={`status-badge ${getStatusColor(expense.status)}`}>{STATUS_DISPLAY_NAMES[expense.status] || expense.status}</span>
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
                <button className="btn-icon btn-success" onClick={() => handleApprove(expense.id)} title="Validate"><CheckCircle size={16} /></button>
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
