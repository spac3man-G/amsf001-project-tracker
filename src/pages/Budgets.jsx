import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  PiggyBank, Plus, Edit2, Save, X, Trash2,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import { useAuth, useProject } from '../hooks';

export default function Budgets() {
  // ============================================
  // HOOKS - Replace boilerplate
  // ============================================
  const { userRole, loading: authLoading } = useAuth();
  const { projectId, project, loading: projectLoading } = useProject();
  const toast = useToast();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [budgets, setBudgets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [newBudget, setNewBudget] = useState({
    milestone_id: '',
    category: 'Labour',
    allocated_amount: '',
    spent_amount: 0,
    notes: ''
  });

  const categories = ['Labour', 'Materials', 'Equipment', 'Travel', 'Software', 'Training', 'Contingency', 'Other'];
  
  // Get project budget from hook
  const projectBudget = project?.budget || 0;

  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchData();
    }
  }, [projectId, authLoading, projectLoading]);

  async function fetchData() {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data: budgetsData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          *,
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', projectId)
        .order('category');

      if (budgetError) throw budgetError;
      setBudgets(budgetsData || []);

      const { data: milestonesData, error: msError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', projectId)
        .order('milestone_ref');
      
      if (msError) throw msError;
      setMilestones(milestonesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function canEdit() {
    return userRole === 'admin' || userRole === 'project_manager';
  }

  async function handleAdd() {
    if (!newBudget.category || !newBudget.allocated_amount) {
      toast.warning('Please fill in category and allocated amount');
      return;
    }

    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setSaving(true);
    try {
      const insertData = {
        project_id: projectId,
        milestone_id: newBudget.milestone_id || null,
        category: newBudget.category,
        allocated_amount: parseFloat(newBudget.allocated_amount),
        spent_amount: parseFloat(newBudget.spent_amount) || 0,
        notes: newBudget.notes || null
      };

      const { error } = await supabase
        .from('budgets')
        .insert([insertData]);

      if (error) throw error;

      await fetchData();
      setShowAddForm(false);
      setNewBudget({
        milestone_id: '',
        category: 'Labour',
        allocated_amount: '',
        spent_amount: 0,
        notes: ''
      });
      toast.success('Budget item added!');
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(budget) {
    setEditingId(budget.id);
    setEditForm({
      milestone_id: budget.milestone_id || '',
      category: budget.category || 'Other',
      allocated_amount: budget.allocated_amount || 0,
      spent_amount: budget.spent_amount || 0,
      notes: budget.notes || ''
    });
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          milestone_id: editForm.milestone_id || null,
          category: editForm.category,
          allocated_amount: parseFloat(editForm.allocated_amount),
          spent_amount: parseFloat(editForm.spent_amount) || 0,
          notes: editForm.notes || null
        })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setEditingId(null);
      toast.success('Budget updated!');
    } catch (error) {
      console.error('Error updating budget:', error);
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
    if (!confirm('Delete this budget item?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Budget item deleted');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  function getUtilizationColor(percentage) {
    if (percentage > 100) return '#ef4444';
    if (percentage > 80) return '#f59e0b';
    if (percentage > 50) return '#3b82f6';
    return '#10b981';
  }

  function getUtilizationIcon(percentage) {
    if (percentage > 100) return <AlertTriangle size={16} style={{ color: '#ef4444' }} />;
    if (percentage > 80) return <TrendingUp size={16} style={{ color: '#f59e0b' }} />;
    return <CheckCircle size={16} style={{ color: '#10b981' }} />;
  }

  const totalAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.allocated_amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const budgetsByCategory = categories.map(cat => {
    const catBudgets = budgets.filter(b => b.category === cat);
    return {
      category: cat,
      allocated: catBudgets.reduce((sum, b) => sum + parseFloat(b.allocated_amount || 0), 0),
      spent: catBudgets.reduce((sum, b) => sum + parseFloat(b.spent_amount || 0), 0)
    };
  }).filter(c => c.allocated > 0);

  if (authLoading || projectLoading || loading) return <TablePageSkeleton />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <PiggyBank size={28} />
          <div>
            <h1>Budgets</h1>
            <p>Manage project budget allocation and tracking</p>
          </div>
        </div>
        {!showAddForm && canEdit() && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Budget Item
          </button>
        )}
      </div>

      {/* Overall Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">PROJECT BUDGET</div>
          <div className="stat-value">£{projectBudget.toLocaleString('en-GB')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL ALLOCATED</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>£{totalAllocated.toLocaleString('en-GB')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL SPENT</div>
          <div className="stat-value" style={{ color: totalSpent > totalAllocated ? '#ef4444' : '#10b981' }}>
            £{totalSpent.toLocaleString('en-GB')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">REMAINING</div>
          <div className="stat-value" style={{ color: totalRemaining < 0 ? '#ef4444' : '#10b981' }}>
            £{totalRemaining.toLocaleString('en-GB')}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0 }}>Overall Budget Utilization</h4>
          <span style={{ fontWeight: '600', color: getUtilizationColor(overallUtilization) }}>
            {overallUtilization.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(overallUtilization, 100)}%`, 
            height: '100%', 
            backgroundColor: getUtilizationColor(overallUtilization),
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          <span>£{totalSpent.toLocaleString('en-GB')} spent</span>
          <span>£{totalAllocated.toLocaleString('en-GB')} allocated</span>
        </div>
      </div>

      {/* Budget by Category */}
      {budgetsByCategory.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Budget by Category</h4>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {budgetsByCategory.map(cat => {
              const utilization = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '500' }}>{cat.category}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      £{cat.spent.toLocaleString('en-GB')} / £{cat.allocated.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(utilization, 100)}%`, 
                      height: '100%', 
                      backgroundColor: getUtilizationColor(utilization),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Budget Form */}
      {showAddForm && canEdit() && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Budget Item</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Category *</label>
              <select 
                className="form-input" 
                value={newBudget.category} 
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="form-label">Milestone (Optional)</label>
              <select 
                className="form-input" 
                value={newBudget.milestone_id} 
                onChange={(e) => setNewBudget({ ...newBudget, milestone_id: e.target.value })}
              >
                <option value="">-- Project-wide --</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="form-label">Allocated Amount (£) *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="form-input" 
                placeholder="0.00"
                value={newBudget.allocated_amount} 
                onChange={(e) => setNewBudget({ ...newBudget, allocated_amount: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="form-label">Already Spent (£)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="form-input" 
                placeholder="0.00"
                value={newBudget.spent_amount} 
                onChange={(e) => setNewBudget({ ...newBudget, spent_amount: e.target.value })} 
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="Additional notes"
                value={newBudget.notes} 
                onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Budget Item'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Budget Items Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Milestone</th>
              <th style={{ textAlign: 'right' }}>Allocated</th>
              <th style={{ textAlign: 'right' }}>Spent</th>
              <th style={{ textAlign: 'right' }}>Remaining</th>
              <th>Utilization</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No budget items found.</td></tr>
            ) : (
              budgets.map(budget => {
                const remaining = (budget.allocated_amount || 0) - (budget.spent_amount || 0);
                const utilization = budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0;
                
                return (
                  <tr key={budget.id}>
                    <td>
                      {editingId === budget.id ? (
                        <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: '500' }}>{budget.category}</span>
                      )}
                    </td>
                    <td>
                      {editingId === budget.id ? (
                        <select className="form-input" value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}>
                          <option value="">Project-wide</option>
                          {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}
                        </select>
                      ) : (
                        budget.milestones?.milestone_ref || 'Project-wide'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === budget.id ? (
                        <input type="number" step="0.01" className="form-input" value={editForm.allocated_amount} onChange={(e) => setEditForm({ ...editForm, allocated_amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                      ) : (
                        `£${parseFloat(budget.allocated_amount || 0).toLocaleString('en-GB')}`
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === budget.id ? (
                        <input type="number" step="0.01" className="form-input" value={editForm.spent_amount} onChange={(e) => setEditForm({ ...editForm, spent_amount: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                      ) : (
                        `£${parseFloat(budget.spent_amount || 0).toLocaleString('en-GB')}`
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: remaining < 0 ? '#ef4444' : '#10b981' }}>
                      £{remaining.toLocaleString('en-GB')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getUtilizationIcon(utilization)}
                        <div style={{ flex: 1, maxWidth: '80px' }}>
                          <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(utilization, 100)}%`, 
                              height: '100%', 
                              backgroundColor: getUtilizationColor(utilization)
                            }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: getUtilizationColor(utilization), fontWeight: '500' }}>
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '150px' }}>
                      {editingId === budget.id ? (
                        <input type="text" className="form-input" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                      ) : (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: budget.notes ? 'inherit' : '#9ca3af' }}>
                          {budget.notes || '-'}
                        </div>
                      )}
                    </td>
                    <td>
                      {!canEdit() ? (
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>View only</span>
                      ) : editingId === budget.id ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(budget.id)} title="Save" disabled={saving}><Save size={16} /></button>
                          <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleEdit(budget)} title="Edit"><Edit2 size={16} /></button>
                          <button className="btn-icon btn-danger" onClick={() => handleDelete(budget.id)} title="Delete"><Trash2 size={16} /></button>
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

      {/* Warning if over budget */}
      {totalSpent > totalAllocated && (
        <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
            <AlertTriangle size={20} />
            <strong>Budget Warning</strong>
          </div>
          <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
            Spending (£{totalSpent.toLocaleString('en-GB')}) has exceeded the allocated budget (£{totalAllocated.toLocaleString('en-GB')}) 
            by £{(totalSpent - totalAllocated).toLocaleString('en-GB')}.
          </p>
        </div>
      )}
    </div>
  );
}
