import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Calendar,
  DollarSign, FileText, CheckCircle, Send, User
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
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
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserResourceId, setCurrentUserResourceId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [showTestUsers]);

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) setUserRole(profile.role);

        const { data: resource } = await supabase
          .from('resources')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (resource) {
          setCurrentUserResourceId(resource.id);
          setNewExpense(prev => ({ ...prev, resource_id: resource.id }));
        }
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();
      
      if (project) {
        setProjectId(project.id);
        await fetchData(project.id);
      } else {
        console.error('Project AMSF001 not found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      toast.error('Failed to load initial data');
      setLoading(false);
    }
  }

  async function fetchData(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      let expenseQuery = supabase
        .from('expenses')
        .select(`
          *,
          resources (id, name, email),
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', pid)
        .order('expense_date', { ascending: false });

      if (!showTestUsers) {
        expenseQuery = expenseQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: expensesData, error: expError } = await expenseQuery;

      if (expError) {
        console.error('Expenses error:', expError);
      } else {
        setExpenses(expensesData || []);
      }

      let resourceQuery = supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');

      const { data: resourcesData, error: resError } = await resourceQuery;
      
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

      const { data: milestonesData, error: msError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', pid)
        .order('milestone_ref');
      
      if (msError) {
        console.error('Milestones error:', msError);
      } else {
        setMilestones(milestonesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

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
        user_id: resource?.user_id || currentUserId,
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

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Paid': return 'status-approved';
      case 'Submitted': return 'status-submitted';
      case 'Rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  function getCategoryIcon(category) {
    return <Receipt size={14} style={{ color: '#64748b' }} />;
  }

  function canEditExpenseLocal(expense) {
    return canEditExpensePerm(userRole, expense, currentUserId);
  }

  function canDeleteExpenseLocal(expense) {
    return canDeleteExpensePerm(userRole, expense, currentUserId);
  }

  function canSubmitExpenseLocal(expense) {
    return canSubmitExpensePerm(userRole, expense, currentUserId);
  }

  function canValidateExpenseLocal(expense) {
    if (expense.status !== 'Submitted') return false;
    return canApproveExpense(userRole);
  }

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

  const availableResources = getAvailableResourcesForEntry(userRole, resources, currentUserId);

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Receipt size={28} />
          <div>
            <h1>Expenses</h1>
            <p>Track and manage project expenses</p>
          </div>
        </div>
        {!showAddForm && canAddExpense(userRole) && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Expense
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL ENTRIES</div>
          <div className="stat-value">{filteredExpenses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL AMOUNT</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>£{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">APPROVED</div>
          <div className="stat-value" style={{ color: '#10b981' }}>£{approvedAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PENDING APPROVAL</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
        </div>
      </div>

      {/* Expenses by Category Summary */}
      {expensesByCategory.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Expenses by Category</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {expensesByCategory.map(c => (
              <div key={c.category} style={{ padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', minWidth: '120px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.category}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>£{c.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
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
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && canAddExpense(userRole) && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Expense</h3>
          
          {availableResources.length === 0 && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
              ⚠️ Your account is not linked to a resource. Contact an admin to be added.
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              {!canAddExpenseForOthers(userRole) && availableResources.length === 1 && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  You can only add expenses for yourself
                </span>
              )}
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
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
              <label className="form-label">Amount (£) *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="form-input" 
                placeholder="0.00" 
                value={newExpense.amount} 
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="form-label">Receipt URL</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://..." 
                value={newExpense.receipt_url} 
                onChange={(e) => setNewExpense({ ...newExpense, receipt_url: e.target.value })} 
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description *</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="What was this expense for?" 
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
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Milestone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No expenses found.</td></tr>
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
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getCategoryIcon(exp.category)}
                        {exp.category}
                      </div>
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
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {editingId === exp.id ? (
                      <input type="number" step="0.01" className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                    ) : (
                      `£${parseFloat(exp.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td>
                    {editingId === exp.id ? (
                      <select className="form-input" value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}>
                        <option value="">None</option>
                        {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}
                      </select>
                    ) : (
                      exp.milestones?.milestone_ref || '-'
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
                        {exp.receipt_url && (
                          <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="View Receipt">
                            <FileText size={16} />
                          </a>
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
          <li>Always attach receipts when possible for audit purposes</li>
          <li>Link expenses to milestones for better budget tracking</li>
          <li><strong>Submit:</strong> Click the send icon (→) to submit for approval</li>
          {canApproveExpense(userRole) && (
            <li><strong>As an approver:</strong> You can approve (✓) or reject (✗) submitted expenses</li>
          )}
        </ul>
      </div>
    </div>
  );
}
