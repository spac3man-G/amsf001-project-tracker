import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Calendar,
  DollarSign, FileText, CheckCircle, Send, User
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import { useAuth, useProject, useCurrentResource } from '../hooks';
import { getStatusColor, formatCurrency } from '../utils/statusHelpers';
import {
  canAddExpense,
  canAddExpenseForOthers,
  canEditExpense as canEditExpensePerm,
  canDeleteExpense as canDeleteExpensePerm,
  canSubmitExpense as canSubmitExpensePerm,
  canApproveExpense,
  getAvailableResourcesForEntry
} from '../utils/permissions';

export default function Expenses() {
  // ============================================
  // HOOKS - Replace ~50 lines of boilerplate
  // ============================================
  const { userId, userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const { resourceId: currentUserResourceId, loading: resourceLoading } = useCurrentResource(userId);
  
  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const [newExpense, setNewExpense] = useState({
    resource_id: '',
    milestone_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Travel',
    description: '',
    amount: '',
    receipt_url: '',
    status: 'Draft'
  });

  const categories = ['Travel', 'Accommodation', 'Meals', 'Equipment', 'Software', 'Training', 'Other'];
  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];

  // ============================================
  // DATA FETCHING
  // ============================================

  // Set default resource when user's resource is loaded
  useEffect(() => {
    if (currentUserResourceId) {
      setNewExpense(prev => ({ ...prev, resource_id: currentUserResourceId }));
    }
  }, [currentUserResourceId]);

  // Fetch data when project is ready
  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchData();
    }
  }, [projectId, authLoading, projectLoading, showTestUsers]);

  async function fetchData() {
    if (!projectId) return;

    try {
      setLoading(true);

      // Fetch expenses
      let expenseQuery = supabase
        .from('expenses')
        .select(`
          *,
          resources (id, name, email),
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });

      if (!showTestUsers) {
        expenseQuery = expenseQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: expensesData, error: expError } = await expenseQuery;
      if (expError) console.error('Expenses error:', expError);
      else setExpenses(expensesData || []);

      // Fetch resources
      const { data: resourcesData, error: resError } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');
      
      if (resError) {
        console.error('Resources error:', resError);
      } else {
        let filteredResources = resourcesData || [];
        if (!showTestUsers && testUserIds && testUserIds.length > 0) {
          filteredResources = filteredResources.filter(r => 
            !r.user_id || !testUserIds.includes(r.user_id)
          );
        }
        setResources(filteredResources);
      }

      // Fetch milestones
      const { data: milestonesData, error: msError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', projectId)
        .order('milestone_ref');
      
      if (msError) console.error('Milestones error:', msError);
      else setMilestones(milestonesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async function handleAdd() {
    if (!newExpense.resource_id || !newExpense.amount || !newExpense.description) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setSaving(true);
    try {
      const resource = resources.find(r => r.id === newExpense.resource_id);

      const insertData = {
        project_id: projectId,
        resource_id: newExpense.resource_id,
        milestone_id: newExpense.milestone_id || null,
        user_id: resource?.user_id || userId,
        expense_date: newExpense.expense_date,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        receipt_url: newExpense.receipt_url || null,
        status: newExpense.status
      };

      const { error } = await supabase
        .from('expenses')
        .insert([insertData]);

      if (error) throw error;

      await fetchData();
      setShowAddForm(false);
      setNewExpense({
        resource_id: currentUserResourceId || '',
        milestone_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Travel',
        description: '',
        amount: '',
        receipt_url: '',
        status: 'Draft'
      });
      toast.success('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(expense) {
    setEditingId(expense.id);
    setEditForm({
      resource_id: expense.resource_id,
      milestone_id: expense.milestone_id || '',
      expense_date: expense.expense_date || '',
      category: expense.category || 'Other',
      description: expense.description || '',
      amount: expense.amount || 0,
      receipt_url: expense.receipt_url || '',
      status: expense.status
    });
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          resource_id: editForm.resource_id,
          milestone_id: editForm.milestone_id || null,
          expense_date: editForm.expense_date,
          category: editForm.category,
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          receipt_url: editForm.receipt_url || null,
          status: editForm.status
        })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setEditingId(null);
      toast.success('Expense updated!');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update', error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense entry?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  async function handleSubmit(id) {
    if (!confirm('Submit this expense for approval?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Submitted' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Expense submitted for approval!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error('Failed to submit', error.message);
    }
  }

  async function handleApprove(id) {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Expense approved!');
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve', error.message);
    }
  }

  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'Rejected' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.warning('Expense rejected');
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject', error.message);
    }
  }

  // ============================================
  // PERMISSION HELPERS
  // ============================================

  function canEditExpenseLocal(expense) {
    return canEditExpensePerm(userRole, expense, userId);
  }

  function canDeleteExpenseLocal(expense) {
    return canDeleteExpensePerm(userRole, expense, userId);
  }

  function canSubmitExpenseLocal(expense) {
    return canSubmitExpensePerm(userRole, expense, userId);
  }

  function canValidateExpenseLocal(expense) {
    if (expense.status !== 'Submitted') return false;
    return canApproveExpense(userRole);
  }

  // ============================================
  // FILTERING & CALCULATIONS
  // ============================================

  const filteredExpenses = expenses.filter(exp => {
    if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
    if (filterStatus !== 'all' && exp.status !== filterStatus) return false;
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const approvedAmount = filteredExpenses
    .filter(exp => exp.status === 'Approved' || exp.status === 'Paid')
    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const pendingCount = filteredExpenses.filter(exp => exp.status === 'Submitted').length;

  const expensesByCategory = categories.map(cat => ({
    category: cat,
    amount: filteredExpenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  })).filter(c => c.amount > 0);

  const availableResources = getAvailableResourcesForEntry(userRole, resources, userId);

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading || projectLoading || loading) {
    return <TablePageSkeleton />;
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Receipt size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Expenses</h1>
          <p className="subtitle">Track and manage project expenses</p>
        </div>
        {canAddExpense(userRole) && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={20} /> Add Expense
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}><DollarSign size={24} color="#2563eb" /></div>
          <div className="stat-content"><div className="stat-value">{formatCurrency(totalAmount)}</div><div className="stat-label">Total Expenses (Filtered)</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}><CheckCircle size={24} color="#16a34a" /></div>
          <div className="stat-content"><div className="stat-value">{formatCurrency(approvedAmount)}</div><div className="stat-label">Approved/Paid</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}><Send size={24} color="#d97706" /></div>
          <div className="stat-content"><div className="stat-value">{pendingCount}</div><div className="stat-label">Pending Approval</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f1f5f9' }}><FileText size={24} color="#64748b" /></div>
          <div className="stat-content"><div className="stat-value">{filteredExpenses.length}</div><div className="stat-label">Total Entries</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label">Filter by Category</label>
            <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Status</label>
            <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {expensesByCategory.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Expenses by Category</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {expensesByCategory.map(c => (
              <div key={c.category} style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.category}</div>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{formatCurrency(c.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Expense Entry</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource *</label>
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
            
            <div>
              <label className="form-label">Category *</label>
              <select 
                className="form-input" 
                value={newExpense.category} 
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div>
              <label className="form-label">Amount (£) *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="form-input" 
                placeholder="e.g., 150.00" 
                value={newExpense.amount} 
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="form-label">Milestone (Optional)</label>
              <select 
                className="form-input" 
                value={newExpense.milestone_id} 
                onChange={(e) => setNewExpense({ ...newExpense, milestone_id: e.target.value })}
              >
                <option value="">-- No specific milestone --</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="form-label">Receipt URL (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Link to receipt" 
                value={newExpense.receipt_url} 
                onChange={(e) => setNewExpense({ ...newExpense, receipt_url: e.target.value })} 
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description *</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="Describe the expense..." 
                value={newExpense.description} 
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Expense'}
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
              <th>Resource</th>
              <th>Date</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No expenses found.</td></tr>
            ) : (
              filteredExpenses.map(exp => (
                <tr key={exp.id} style={{ backgroundColor: exp.is_test_content ? '#fffbeb' : 'transparent' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: '#64748b' }} />
                      {editingId === exp.id ? (
                        <select className="form-input" value={editForm.resource_id} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })} disabled={!canAddExpenseForOthers(userRole)}>
                          {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: '500' }}>{exp.resources?.name || 'Unknown'}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {editingId === exp.id ? (
                      <input type="date" className="form-input" value={editForm.expense_date} onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-GB') : '-'}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === exp.id ? (
                      <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Receipt size={14} style={{ color: '#64748b' }} />
                        {exp.category || 'Other'}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {editingId === exp.id ? (
                      <input type="number" step="0.01" className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                    ) : (
                      formatCurrency(exp.amount)
                    )}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {editingId === exp.id ? (
                      <input type="text" className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    ) : (
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description || 'No description'}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === exp.id && userRole === 'admin' ? (
                      <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(exp.status)}`}>{exp.status}</span>
                    )}
                  </td>
                  <td>
                    {editingId === exp.id ? (
                      <div className="action-buttons">
                        <button className="btn-icon btn-success" onClick={() => handleSave(exp.id)} title="Save" disabled={saving}><Save size={16} /></button>
                        <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        {canSubmitExpenseLocal(exp) && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleSubmit(exp.id)} 
                            title="Submit for Approval"
                            style={{ color: '#3b82f6' }}
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {canValidateExpenseLocal(exp) && (
                          <>
                            <button 
                              className="btn-icon btn-success" 
                              onClick={() => handleApprove(exp.id)} 
                              title="Approve"
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
                        {canEditExpenseLocal(exp) && <button className="btn-icon" onClick={() => handleEdit(exp)} title="Edit"><Edit2 size={16} /></button>}
                        {canDeleteExpenseLocal(exp) && <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)} title="Delete"><Trash2 size={16} /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Expense Tips</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Always include a description of what the expense was for</li>
          <li>Link expenses to milestones for better cost tracking</li>
          <li>Upload receipt URLs when available for audit purposes</li>
          <li><strong>Submit:</strong> Click the send icon (→) to submit for approval</li>
          {canApproveExpense(userRole) && (
            <li><strong>As an approver:</strong> You can approve (✓) or reject (✗) submitted expenses</li>
          )}
        </ul>
      </div>
    </div>
  );
}
