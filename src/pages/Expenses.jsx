import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Upload, Download,
  Car, Home, Utensils, AlertCircle, FileText
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const BUDGET = 20520;

  // Multi-category form
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
    files: []
  });

  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();
      
      if (project) {
        setProjectId(project.id);
        await fetchData(project.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*, expense_files(*)')
        .eq('project_id', pid)
        .order('expense_date', { ascending: false });
      setExpenses(expensesData || []);

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email')
        .order('name');
      setResources(resourcesData || []);
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

      if (hasTravel) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Travel',
          resource_name: resources.find(r => r.id === newExpense.resource_id)?.name,
          expense_date: newExpense.expense_date,
          reason: newExpense.travel_reason,
          amount: parseFloat(newExpense.travel_amount),
          notes: newExpense.notes,
          status: 'Draft',
          created_by: currentUserId
        });
      }

      if (hasAccommodation) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Accommodation',
          resource_name: resources.find(r => r.id === newExpense.resource_id)?.name,
          expense_date: newExpense.expense_date,
          reason: newExpense.accommodation_reason,
          amount: parseFloat(newExpense.accommodation_amount),
          notes: newExpense.notes,
          status: 'Draft',
          created_by: currentUserId
        });
      }

      if (hasSustenance) {
        expensesToInsert.push({
          project_id: projectId,
          category: 'Sustenance',
          resource_name: resources.find(r => r.id === newExpense.resource_id)?.name,
          expense_date: newExpense.expense_date,
          reason: newExpense.sustenance_reason,
          amount: parseFloat(newExpense.sustenance_amount),
          notes: newExpense.notes,
          status: 'Draft',
          created_by: currentUserId
        });
      }

      const { data: insertedExpenses, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;

      // Handle file uploads for all inserted expenses
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
        files: []
      });

      const count = expensesToInsert.length;
      alert(`${count} expense${count > 1 ? 's' : ''} added successfully!`);
    } catch (error) {
      console.error('Error adding expenses:', error);
      alert('Failed to add expenses: ' + error.message);
    }
  }

  async function handleEdit(expense) {
    setEditingId(expense.id);
    setEditForm({
      category: expense.category,
      resource_name: expense.resource_name,
      expense_date: expense.expense_date,
      reason: expense.reason,
      amount: expense.amount,
      notes: expense.notes || '',
      status: expense.status
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          category: editForm.category,
          resource_name: editForm.resource_name,
          expense_date: editForm.expense_date,
          reason: editForm.reason,
          amount: parseFloat(editForm.amount),
          notes: editForm.notes,
          status: editForm.status
        })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    setNewExpense({ ...newExpense, files: [...newExpense.files, ...files] });
  }

  function removeFile(index) {
    const updated = [...newExpense.files];
    updated.splice(index, 1);
    setNewExpense({ ...newExpense, files: updated });
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
      a.click();
    } catch (error) {
      console.error('Download error:', error);
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

  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterResource !== 'all' && e.resource_name !== filterResource) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const approvedSpent = expenses.filter(e => ['Approved', 'Paid'].includes(e.status))
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const remaining = BUDGET - approvedSpent;

  const categoryTotals = {
    Travel: expenses.filter(e => e.category === 'Travel').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Accommodation: expenses.filter(e => e.category === 'Accommodation').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    Sustenance: expenses.filter(e => e.category === 'Sustenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  };

  if (loading) return <div className="loading">Loading expenses...</div>;

  const canAdd = userRole === 'admin' || userRole === 'contributor';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Receipt size={28} />
          <div>
            <h1>Expenses</h1>
            <p>Track project expenses against £{BUDGET.toLocaleString()} budget</p>
          </div>
        </div>
        {canAdd && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Expenses
          </button>
        )}
      </div>

      {/* Budget Overview */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value">£{BUDGET.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Claimed</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>£{totalSpent.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved/Paid</div>
          <div className="stat-value" style={{ color: '#10b981' }}>£{approvedSpent.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: remaining < BUDGET * 0.2 ? '#ef4444' : '#10b981' }}>
            £{remaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Category Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {['Travel', 'Accommodation', 'Sustenance'].map(cat => {
            const colors = getCategoryColor(cat);
            const count = expenses.filter(e => e.category === cat).length;
            return (
              <div key={cat} style={{ padding: '1rem', backgroundColor: colors.bg, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.color, marginBottom: '0.5rem' }}>
                  {getCategoryIcon(cat)}
                  <span style={{ fontWeight: '600' }}>{cat}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.color }}>
                  £{categoryTotals[cat].toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: colors.color }}>{count} entries</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Categories</option>
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
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
                {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
                  placeholder="e.g., Meals during site visit"
                  value={newExpense.sustenance_reason} 
                  onChange={(e) => setNewExpense({ ...newExpense, sustenance_reason: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Notes & Receipts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea 
                className="form-input" 
                rows={2}
                placeholder="Additional notes for all expenses"
                value={newExpense.notes} 
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} 
              />
            </div>
            <div>
              <label className="form-label">Receipt(s)</label>
              <div 
                style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem', 
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
              <th>Category</th>
              <th>Resource</th>
              <th>Date</th>
              <th>Reason</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Receipts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No expenses found.</td></tr>
            ) : (
              filteredExpenses.map(exp => {
                const catColors = getCategoryColor(exp.category);
                return (
                  <tr key={exp.id}>
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
                        <select className="form-input" value={editForm.resource_name} onChange={(e) => setEditForm({ ...editForm, resource_name: e.target.value })}>
                          {resources.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
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
                      {editingId === exp.id && userRole === 'admin' ? (
                        <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusColor(exp.status)}`}>{exp.status}</span>
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
                          {(userRole === 'admin' || userRole === 'contributor') && (
                            <button className="btn-icon" onClick={() => handleEdit(exp)}><Edit2 size={16} /></button>
                          )}
                          {userRole === 'admin' && (
                            <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)}><Trash2 size={16} /></button>
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
        </ul>
      </div>
    </div>
  );
}
