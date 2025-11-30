import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Upload, Download,
  Car, Home, Utensils, AlertCircle, FileText, Check, User, Send, CheckCircle,
  Building2, Briefcase
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';

export default function Expenses() {
  // Use shared contexts
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;

  // Use the permissions hook - clean, pre-bound permission functions
  const {
    canAddExpense,
    canSubmitExpense,
    canValidateExpense,
    canEditExpense,
    canDeleteExpense,
    getAvailableResources,
    hasRole
  } = usePermissions();

  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChargeable, setFilterChargeable] = useState('all');
  const [filterProcurement, setFilterProcurement] = useState('all');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Test user context for filtering
  const { showTestUsers, testUserIds } = useTestUsers();

  const BUDGET = 20520;

  const [newExpense, setNewExpense] = useState({
    resource_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    travel_amount: '',
    travel_reason: '',
    accommodation_amount: '',
    accommodation_reason: '',
    sustenance_amount: '',
    sustenance_reason: '',
    notes: '',
    files: [],
    chargeable_to_customer: true,
    procurement_method: 'supplier'
  });

  // Database uses 'Approved' but we display 'Validated'
  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];
  const statusDisplayNames = {
    'Draft': 'Draft',
    'Submitted': 'Submitted',
    'Approved': 'Validated',
    'Rejected': 'Rejected',
    'Paid': 'Paid'
  };

  // Fetch data when projectId becomes available (from ProjectContext)
  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [projectId]);

  // Re-fetch when showTestUsers changes
  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [showTestUsers]);

  async function fetchData(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      // Build expenses query with test content filter
      let expenseQuery = supabase
        .from('expenses')
        .select('*, expense_files(*)')
        .eq('project_id', pid)
        .order('expense_date', { ascending: false });

      // Filter out test content unless admin/supplier_pm has enabled it
      if (!showTestUsers) {
        expenseQuery = expenseQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: expensesData } = await expenseQuery;
      setExpenses(expensesData || []);

      // Fetch resources - filter out resources linked to test users
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');
      
      // Filter out resources linked to test users if not showing test users
      let filteredResources = resourcesData || [];
      if (!showTestUsers && testUserIds && testUserIds.length > 0) {
        filteredResources = filteredResources.filter(r => 
          !r.user_id || !testUserIds.includes(r.user_id)
        );
      }
      setResources(filteredResources);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleAdd() {
    if (!newExpense.resource_id) {
      alert('Please select a resource');
      return;
    }

    const hasTravel = parseFloat(newExpense.travel_amount) > 0;
    const hasAccommodation = parseFloat(newExpense.accommodation_amount) > 0;
    const hasSustenance = parseFloat(newExpense.sustenance_amount) > 0;

    if (!hasTravel && !hasAccommodation && !hasSustenance) {
      alert('Please enter at least one expense amount');
      return;
    }

    if (hasTravel && !newExpense.travel_reason) {
      alert('Please enter a reason for the travel expense');
      return;
    }
    if (hasAccommodation && !newExpense.accommodation_reason) {
      alert('Please enter a reason for the accommodation expense');
      return;
    }
    if (hasSustenance && !newExpense.sustenance_reason) {
      alert('Please enter a reason for the sustenance expense');
      return;
    }

    try {
      const expensesToInsert = [];
      const resourceName = resources.find(r => r.id === newExpense.resource_id)?.name;

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
          status: 'Draft',
          created_by: currentUserId,
          chargeable_to_customer: newExpense.chargeable_to_customer,
          procurement_method: newExpense.procurement_method
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
          status: 'Draft',
          created_by: currentUserId,
          chargeable_to_customer: newExpense.chargeable_to_customer,
          procurement_method: newExpense.procurement_method
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
          status: 'Draft',
          created_by: currentUserId,
          chargeable_to_customer: newExpense.chargeable_to_customer,
          procurement_method: newExpense.procurement_method
        });
      }

      const { data: insertedExpenses, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;

      if (newExpense.files.length > 0 && insertedExpenses) {
        setUploadingFiles(true);
        for (const expense of insertedExpenses) {
          for (const file of newExpense.files) {
            const filePath = `${expense.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('receipts')
              .upload(filePath, file);

            if (!uploadError) {
              await supabase.from('expense_files').insert({
                expense_id: expense.id,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type,
                uploaded_by: currentUserId
              });
            }
          }
        }
        setUploadingFiles(false);
      }

      await fetchData();
      setShowAddForm(false);
      setNewExpense({
        resource_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        travel_amount: '',
        travel_reason: '',
        accommodation_amount: '',
        accommodation_reason: '',
        sustenance_amount: '',
        sustenance_reason: '',
        notes: '',
        files: [],
        chargeable_to_customer: true
      });
      alert('Expenses added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expenses: ' + error.message);
    }
  }

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

  async function handleSave(id) {
    try {
      // Look up resource name from ID if resource was changed
      const resourceName = resources.find(r => r.id === editForm.resource_id)?.name || editForm.resource_name;
      
      const { error } = await supabase
        .from('expenses')
        .update({
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
        })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setEditingId(null);
      alert('Expense updated!');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  // Submit expense for validation
  async function handleSubmit(id) {
    if (!confirm('Submit this expense for validation?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Submitted' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Expense submitted for validation!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Failed to submit: ' + error.message);
    }
  }

  // Validate (approve) expense
  async function handleApprove(id) {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Expense validated!');
    } catch (error) {
      console.error('Error validating expense:', error);
      alert('Failed to validate: ' + error.message);
    }
  }

  // Reject expense
  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const updateData = { status: 'Rejected' };
      if (reason) {
        updateData.rejection_reason = reason;
      }
      
      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Expense rejected.');
    } catch (error) {
      console.error('Error rejecting expense:', error);
      alert('Failed to reject: ' + error.message);
    }
  }

  // NOTE: All permission functions now come from usePermissions hook!
  // No more local wrapper functions needed.
  // Just call canEditExpense(expense), canDeleteExpense(expense), etc.

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
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  }

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
  const chargeableTotal = expenses
    .filter(e => e.chargeable_to_customer !== false)
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const nonChargeableTotal = expenses
    .filter(e => e.chargeable_to_customer === false)
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const approvedSpent = expenses.filter(e => ['Approved', 'Paid'].includes(e.status))
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const remaining = BUDGET - approvedSpent;
  const pendingCount = expenses.filter(e => e.status === 'Submitted').length;

  // Procurement method totals
  const supplierProcuredTotal = expenses
    .filter(e => (e.procurement_method || 'supplier') === 'supplier')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const partnerProcuredTotal = expenses
    .filter(e => e.procurement_method === 'partner')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

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

  // Get available resources for the current user (using hook)
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
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Expenses
          </button>
        )}
      </PageHeader>

      {/* Budget Overview */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={Receipt}
          label="Total Budget"
          value={`£${BUDGET.toLocaleString()}`}
          color="#3b82f6"
        />
        <StatCard
          label="Total Claimed"
          value={`£${totalSpent.toLocaleString()}`}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Chargeable"
          value={`£${chargeableTotal.toLocaleString()}`}
          color="#10b981"
        />
        <StatCard
          icon={AlertCircle}
          label="Non-Chargeable"
          value={`£${nonChargeableTotal.toLocaleString()}`}
          color="#f59e0b"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard
          label="Validated/Paid"
          value={`£${approvedSpent.toLocaleString()}`}
          color="#10b981"
        />
        <StatCard
          label="Remaining Budget"
          value={`£${remaining.toLocaleString()}`}
          color={remaining < BUDGET * 0.2 ? '#ef4444' : '#10b981'}
        />
        <StatCard
          label="Pending Validation"
          value={pendingCount}
          color="#f59e0b"
        />
      </div>

      {/* Procurement Breakdown - visible to Supplier PM and Admin */}
      {hasRole(['admin', 'supplier_pm']) && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard
            icon={Briefcase}
            label="Supplier Procured"
            value={`£${supplierProcuredTotal.toLocaleString()}`}
            subtext="Paid directly by JT"
            color="#6366f1"
          />
          <StatCard
            icon={Building2}
            label="Partner Procured"
            value={`£${partnerProcuredTotal.toLocaleString()}`}
            subtext="Reimbursable to partners"
            color="#8b5cf6"
          />
        </div>
      )}

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Breakdown by Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {['Travel', 'Accommodation', 'Sustenance'].map(cat => {
            const colors = getCategoryColor(cat);
            const count = expenses.filter(e => e.category === cat).length;
            const chargeableAmt = expenses
              .filter(e => e.category === cat && e.chargeable_to_customer !== false)
              .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            return (
              <div key={cat} style={{ padding: '1rem', backgroundColor: colors.bg, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.color, marginBottom: '0.5rem' }}>
                  {getCategoryIcon(cat)}
                  <span style={{ fontWeight: '600' }}>{cat}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.color }}>
                  £{categoryTotals[cat].toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} expense(s)</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                  £{chargeableAmt.toFixed(2)} chargeable
                </div>
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
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                  £{totals.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                  £{totals.chargeable.toFixed(2)} chargeable
                </div>
                {totals.nonChargeable > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                    £{totals.nonChargeable.toFixed(2)} non-chargeable
                  </div>
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
            <option value="Travel">Travel</option>
            <option value="Accommodation">Accommodation</option>
            <option value="Sustenance">Sustenance</option>
          </select>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {[...new Set(expenses.map(e => e.resource_name))].map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{statusDisplayNames[s] || s}</option>)}
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

      {/* Add Multi-Category Form */}
      {showAddForm && (
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

          {/* Chargeable to Customer Checkbox */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={newExpense.chargeable_to_customer}
                onChange={(e) => setNewExpense({ ...newExpense, chargeable_to_customer: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
              />
              <div>
                <span style={{ fontWeight: '600', color: '#166534' }}>Chargeable to Customer</span>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Uncheck if this expense should not be charged to the customer (validated by Supplier PM instead of Customer PM)
                </div>
              </div>
            </label>
          </div>

          {/* Procurement Method - visible to Supplier PM and Admin */}
          {hasRole(['admin', 'supplier_pm']) && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #c4b5fd' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} />
                  Procurement Method
                </span>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  How was this expense paid? Partner-procured expenses are included in partner invoices.
                </div>
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.75rem 1rem',
                  backgroundColor: newExpense.procurement_method === 'supplier' ? '#6366f1' : '#fff',
                  color: newExpense.procurement_method === 'supplier' ? '#fff' : '#374151',
                  borderRadius: '6px',
                  border: '1px solid #c4b5fd',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="procurement_method"
                    value="supplier"
                    checked={newExpense.procurement_method === 'supplier'}
                    onChange={(e) => setNewExpense({ ...newExpense, procurement_method: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <Briefcase size={16} />
                  <span style={{ fontWeight: '500' }}>Supplier (JT)</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.75rem 1rem',
                  backgroundColor: newExpense.procurement_method === 'partner' ? '#8b5cf6' : '#fff',
                  color: newExpense.procurement_method === 'partner' ? '#fff' : '#374151',
                  borderRadius: '6px',
                  border: '1px solid #c4b5fd',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="procurement_method"
                    value="partner"
                    checked={newExpense.procurement_method === 'partner'}
                    onChange={(e) => setNewExpense({ ...newExpense, procurement_method: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <Building2 size={16} />
                  <span style={{ fontWeight: '500' }}>Partner</span>
                </label>
              </div>
            </div>
          )}

          {/* Travel */}
          <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', marginBottom: '0.75rem' }}>
              <Car size={20} />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>Travel</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Amount (£)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="0.00"
                  value={newExpense.travel_amount} 
                  onChange={(e) => setNewExpense({ ...newExpense, travel_amount: e.target.value })} 
                />
              </div>
              <div>
                <label className="form-label">Reason / Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Train fare Jersey to London"
                  value={newExpense.travel_reason} 
                  onChange={(e) => setNewExpense({ ...newExpense, travel_reason: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', marginBottom: '0.75rem' }}>
              <Home size={20} />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>Accommodation</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Amount (£)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="0.00"
                  value={newExpense.accommodation_amount} 
                  onChange={(e) => setNewExpense({ ...newExpense, accommodation_amount: e.target.value })} 
                />
              </div>
              <div>
                <label className="form-label">Reason / Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Hotel stay 2 nights London"
                  value={newExpense.accommodation_reason} 
                  onChange={(e) => setNewExpense({ ...newExpense, accommodation_reason: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Sustenance */}
          <div style={{ padding: '1rem', backgroundColor: '#ffedd5', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ea580c', marginBottom: '0.75rem' }}>
              <Utensils size={20} />
              <span style={{ fontWeight: '600', fontSize: '1rem' }}>Sustenance</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Amount (£)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="0.00"
                  value={newExpense.sustenance_amount} 
                  onChange={(e) => setNewExpense({ ...newExpense, sustenance_amount: e.target.value })} 
                />
              </div>
              <div>
                <label className="form-label">Reason / Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Lunch during site visit"
                  value={newExpense.sustenance_reason} 
                  onChange={(e) => setNewExpense({ ...newExpense, sustenance_reason: e.target.value })} 
                />
              </div>
            </div>
          </div>

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
              style={{ 
                border: '2px dashed #d1d5db', 
                borderRadius: '8px', 
                padding: '1.5rem', 
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9fafb'
              }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <Upload size={24} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Click to upload receipts</div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>PDF, JPG, PNG, ZIP</div>
              <input 
                id="file-upload"
                type="file" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png,.zip"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
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

          {/* Summary */}
          {(parseFloat(newExpense.travel_amount) > 0 || parseFloat(newExpense.accommodation_amount) > 0 || parseFloat(newExpense.sustenance_amount) > 0) && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>Summary</div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {parseFloat(newExpense.travel_amount) > 0 && (
                  <div><span style={{ color: '#64748b' }}>Travel:</span> £{parseFloat(newExpense.travel_amount).toFixed(2)}</div>
                )}
                {parseFloat(newExpense.accommodation_amount) > 0 && (
                  <div><span style={{ color: '#64748b' }}>Accommodation:</span> £{parseFloat(newExpense.accommodation_amount).toFixed(2)}</div>
                )}
                {parseFloat(newExpense.sustenance_amount) > 0 && (
                  <div><span style={{ color: '#64748b' }}>Sustenance:</span> £{parseFloat(newExpense.sustenance_amount).toFixed(2)}</div>
                )}
                <div style={{ fontWeight: '700', color: '#166534' }}>
                  Total: £{(
                    (parseFloat(newExpense.travel_amount) || 0) + 
                    (parseFloat(newExpense.accommodation_amount) || 0) + 
                    (parseFloat(newExpense.sustenance_amount) || 0)
                  ).toFixed(2)}
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {newExpense.chargeable_to_customer ? (
                  <span style={{ color: '#10b981' }}>✓ Chargeable to customer (validated by Customer PM)</span>
                ) : (
                  <span style={{ color: '#f59e0b' }}>✗ Non-chargeable (validated by Supplier PM)</span>
                )}
              </div>
              {hasRole(['admin', 'supplier_pm']) && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  {newExpense.procurement_method === 'partner' ? (
                    <span style={{ color: '#8b5cf6' }}>◆ Partner procured (included in partner invoice)</span>
                  ) : (
                    <span style={{ color: '#6366f1' }}>◆ Supplier procured (paid by JT)</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={uploadingFiles}>
              <Save size={16} /> {uploadingFiles ? 'Uploading...' : 'Save Expenses'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
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
              filteredExpenses.map(exp => {
                const catColors = getCategoryColor(exp.category);
                const isChargeable = exp.chargeable_to_customer !== false;
                return (
                  <tr key={exp.id} style={{ backgroundColor: !isChargeable ? '#fffbeb' : 'inherit' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{exp.expense_ref || '-'}</td>
                    <td>
                      {editingId === exp.id ? (
                        <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                          <option value="Travel">Travel</option>
                          <option value="Accommodation">Accommodation</option>
                          <option value="Sustenance">Sustenance</option>
                        </select>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          backgroundColor: catColors.bg,
                          color: catColors.color
                        }}>
                          {getCategoryIcon(exp.category)}
                          {exp.category}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === exp.id ? (
                        <select className="form-input" value={editForm.resource_id || ''} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })}>
                          <option value="">-- Select --</option>
                          {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        exp.resource_name
                      )}
                    </td>
                    <td>
                      {editingId === exp.id ? (
                        <input type="date" className="form-input" value={editForm.expense_date} onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })} />
                      ) : (
                        new Date(exp.expense_date).toLocaleDateString('en-GB')
                      )}
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      {editingId === exp.id ? (
                        <input type="text" className="form-input" value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} />
                      ) : (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.reason}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      {editingId === exp.id ? (
                        <input type="number" step="0.01" className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                      ) : (
                        `£${parseFloat(exp.amount).toFixed(2)}`
                      )}
                    </td>
                    <td>
                      {editingId === exp.id && canEditChargeable() ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={editForm.chargeable_to_customer}
                            onChange={(e) => setEditForm({ ...editForm, chargeable_to_customer: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                          />
                        </label>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isChargeable ? '#dcfce7' : '#fef3c7',
                          color: isChargeable ? '#166534' : '#92400e'
                        }}>
                          {isChargeable ? <Check size={12} /> : <X size={12} />}
                          {isChargeable ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    {hasRole(['admin', 'supplier_pm']) && (
                      <td>
                        {editingId === exp.id ? (
                          <select 
                            className="form-input" 
                            value={editForm.procurement_method || 'supplier'} 
                            onChange={(e) => setEditForm({ ...editForm, procurement_method: e.target.value })}
                            style={{ fontSize: '0.85rem', padding: '0.25rem' }}
                          >
                            <option value="supplier">Supplier</option>
                            <option value="partner">Partner</option>
                          </select>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: (exp.procurement_method || 'supplier') === 'partner' ? '#f3e8ff' : '#e0e7ff',
                            color: (exp.procurement_method || 'supplier') === 'partner' ? '#7c3aed' : '#4338ca'
                          }}>
                            {(exp.procurement_method || 'supplier') === 'partner' ? <Building2 size={12} /> : <Briefcase size={12} />}
                            {(exp.procurement_method || 'supplier') === 'partner' ? 'Partner' : 'Supplier'}
                          </span>
                        )}
                      </td>
                    )}
                    <td>
                      {editingId === exp.id && canValidateExpense(exp) ? (
                        <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          {statuses.map(s => <option key={s} value={s}>{statusDisplayNames[s] || s}</option>)}
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusColor(exp.status)}`}>{statusDisplayNames[exp.status] || exp.status}</span>
                      )}
                    </td>
                    <td>
                      {exp.expense_files?.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {exp.expense_files.map((file, idx) => (
                            <button 
                              key={idx}
                              onClick={() => downloadFile(file.file_path, file.file_name)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                              title={file.file_name}
                            >
                              <Download size={16} />
                            </button>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {editingId === exp.id ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(exp.id)}><Save size={16} /></button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingId(null)}><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          {/* Submit button for Draft/Rejected expenses */}
                          {canSubmitExpense(exp) && (
                            <button 
                              className="btn-icon" 
                              onClick={() => handleSubmit(exp.id)} 
                              title="Submit for Validation"
                              style={{ color: '#3b82f6' }}
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {/* Validate/Reject buttons - shows for appropriate role based on chargeable status */}
                          {canValidateExpense(exp) && (
                            <>
                              <button 
                                className="btn-icon btn-success" 
                                onClick={() => handleApprove(exp.id)} 
                                title="Validate"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                className="btn-icon btn-danger" 
                                onClick={() => handleReject(exp.id)} 
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {canEditExpense(exp) && (
                            <button className="btn-icon" onClick={() => handleEdit(exp)} title="Edit"><Edit2 size={16} /></button>
                          )}
                          {canDeleteExpense(exp) && (
                            <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)} title="Delete"><Trash2 size={16} /></button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
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
          <li><strong>Submit:</strong> Click the send icon (→) to submit for validation</li>
          <li><strong>Chargeable expenses:</strong> Validated by Customer PM</li>
          <li><strong>Non-chargeable expenses:</strong> Validated by Supplier PM</li>
          {userRole === 'customer_pm' && (
            <li><strong>As Customer PM:</strong> You can validate (✓) or reject (✗) chargeable expenses</li>
          )}
          {userRole === 'supplier_pm' && (
            <li><strong>As Supplier PM:</strong> You can validate (✓) or reject (✗) non-chargeable expenses</li>
          )}
        </ul>
      </div>
    </div>
  );
}
