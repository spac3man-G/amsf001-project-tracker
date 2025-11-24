import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Receipt, Plus, Edit2, Save, X, Trash2, Upload, FileText, 
  CheckCircle, Clock, AlertCircle, Car, Home, Utensils,
  Download, Eye
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expensesBudget, setExpensesBudget] = useState(20520);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const categories = ['Travel', 'Accommodation', 'Sustenance'];
  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];

  const [newExpense, setNewExpense] = useState({
    category: 'Travel',
    resource_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    reason: '',
    amount: '',
    notes: '',
    files: []
  });

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchData() {
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('expenses_budget')
        .eq('reference', 'AMSF001')
        .single();
      
      if (projectData?.expenses_budget) {
        setExpensesBudget(parseFloat(projectData.expenses_budget));
      }

      const { data: expensesData, error } = await supabase
        .from('expenses')
        .select(`*, expense_files (id, file_name, file_path, file_size, file_type)`)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(expensesData || []);

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('name')
        .order('name');
      setResources(resourcesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateExpenseRef() {
    const { data } = await supabase.rpc('generate_expense_ref');
    return data || `EXP-${String(expenses.length + 1).padStart(4, '0')}`;
  }

  async function handleAdd() {
    if (!newExpense.resource_name || !newExpense.reason || !newExpense.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();

      if (!project) {
        alert('Project not found');
        return;
      }

      const expenseRef = await generateExpenseRef();

      const { data: newExp, error: insertError } = await supabase
        .from('expenses')
        .insert([{
          project_id: project.id,
          expense_ref: expenseRef,
          category: newExpense.category,
          resource_name: newExpense.resource_name,
          expense_date: newExpense.expense_date,
          reason: newExpense.reason,
          amount: parseFloat(newExpense.amount),
          status: 'Draft',
          notes: newExpense.notes
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (newExpense.files.length > 0) {
        await uploadFiles(newExp.id, newExpense.files);
      }

      await fetchData();
      setShowAddForm(false);
      setNewExpense({
        category: 'Travel',
        resource_name: '',
        expense_date: new Date().toISOString().split('T')[0],
        reason: '',
        amount: '',
        notes: '',
        files: []
      });
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + error.message);
    }
  }

  async function uploadFiles(expenseId, files) {
    setUploadingFiles(true);
    try {
      for (const file of files) {
        const filePath = `${expenseId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        await supabase
          .from('expense_files')
          .insert([{
            expense_id: expenseId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type
          }]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploadingFiles(false);
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
      status: expense.status,
      notes: expense.notes || ''
    });
  }

  async function handleSave(id) {
    try {
      const updateData = {
        category: editForm.category,
        resource_name: editForm.resource_name,
        expense_date: editForm.expense_date,
        reason: editForm.reason,
        amount: parseFloat(editForm.amount),
        status: editForm.status,
        notes: editForm.notes
      };

      if (editForm.status === 'Submitted') {
        updateData.submitted_date = new Date().toISOString().split('T')[0];
      }
      if (editForm.status === 'Approved') {
        updateData.approved_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchData();
      setEditingId(null);
      alert('Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const expense = expenses.find(e => e.id === id);
      if (expense?.expense_files?.length > 0) {
        for (const file of expense.expense_files) {
          await supabase.storage.from('receipts').remove([file.file_path]);
        }
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  }

  async function handleDownloadFile(filePath, fileName) {
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
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    setNewExpense({ ...newExpense, files: [...newExpense.files, ...files] });
  }

  function removeFile(index) {
    const newFiles = [...newExpense.files];
    newFiles.splice(index, 1);
    setNewExpense({ ...newExpense, files: newFiles });
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
      case 'Travel': return '#3b82f6';
      case 'Accommodation': return '#8b5cf6';
      case 'Sustenance': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Paid': return 'status-completed';
      case 'Approved': return 'status-completed';
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
  const remaining = expensesBudget - approvedSpent;

  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat).length
  }));

  const resourceTotals = [...new Set(expenses.map(e => e.resource_name))].map(name => ({
    name,
    total: expenses.filter(e => e.resource_name === name).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    travel: expenses.filter(e => e.resource_name === name && e.category === 'Travel').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    accommodation: expenses.filter(e => e.resource_name === name && e.category === 'Accommodation').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    sustenance: expenses.filter(e => e.resource_name === name && e.category === 'Sustenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  })).sort((a, b) => b.total - a.total);

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  const canEdit = userRole === 'admin' || userRole === 'contributor';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Receipt size={28} />
          <div>
            <h1>Expenses</h1>
            <p>Track travel, accommodation, and sustenance expenses</p>
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} />
            Add Expense
          </button>
        )}
      </div>

      {/* Budget Overview */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Expenses Budget</div>
          <div className="stat-value">£{expensesBudget.toLocaleString()}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>SOW Allowance</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Claimed</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>£{totalSpent.toLocaleString()}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{expenses.length} entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved/Paid</div>
          <div className="stat-value" style={{ color: '#10b981' }}>£{approvedSpent.toLocaleString()}</div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div className="progress-fill" style={{ width: `${(approvedSpent / expensesBudget) * 100}%`, background: approvedSpent > expensesBudget * 0.8 ? '#ef4444' : '#10b981' }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining Budget</div>
          <div className="stat-value" style={{ color: remaining < 0 ? '#ef4444' : '#10b981' }}>£{remaining.toLocaleString()}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{Math.round((remaining / expensesBudget) * 100)}% available</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Expenses by Category</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {categoryTotals.map(cat => (
            <div key={cat.category} style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc', borderLeft: `4px solid ${getCategoryColor(cat.category)}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {getCategoryIcon(cat.category)}
                <span style={{ fontWeight: '600' }}>{cat.category}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: getCategoryColor(cat.category) }}>£{cat.total.toLocaleString()}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{cat.count} entries</div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Breakdown */}
      {resourceTotals.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Expenses by Resource</h3>
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th style={{ textAlign: 'right' }}>Travel</th>
                <th style={{ textAlign: 'right' }}>Accommodation</th>
                <th style={{ textAlign: 'right' }}>Sustenance</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {resourceTotals.map(res => (
                <tr key={res.name}>
                  <td style={{ fontWeight: '500' }}>{res.name}</td>
                  <td style={{ textAlign: 'right', color: '#3b82f6' }}>£{res.travel.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#8b5cf6' }}>£{res.accommodation.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#f59e0b' }}>£{res.sustenance.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>£{res.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {[...new Set(expenses.map(e => e.resource_name))].sort().map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Expense</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Category *</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setNewExpense({ ...newExpense, category: cat })}
                  style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: `2px solid ${newExpense.category === cat ? getCategoryColor(cat) : '#e2e8f0'}`, backgroundColor: newExpense.category === cat ? `${getCategoryColor(cat)}15` : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: getCategoryColor(cat) }}>
                    {cat === 'Travel' && <Car size={24} />}
                    {cat === 'Accommodation' && <Home size={24} />}
                    {cat === 'Sustenance' && <Utensils size={24} />}
                  </div>
                  <span style={{ fontWeight: '500', color: newExpense.category === cat ? getCategoryColor(cat) : '#64748b' }}>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource Name *</label>
              <select className="form-input" value={newExpense.resource_name} onChange={(e) => setNewExpense({ ...newExpense, resource_name: e.target.value })}>
                <option value="">Select Resource</option>
                {resources.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={newExpense.expense_date} onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Reason / Description *</label>
              <input type="text" className="form-input" placeholder="e.g., Train fare Jersey to London" value={newExpense.reason} onChange={(e) => setNewExpense({ ...newExpense, reason: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Amount (£) *</label>
              <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" placeholder="Additional notes" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Receipt(s)</label>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                <input type="file" id="file-upload" multiple accept=".pdf,.jpg,.jpeg,.png,.zip" onChange={handleFileChange} style={{ display: 'none' }} />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Upload size={32} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
                  <div style={{ color: '#64748b' }}>Click to upload receipts (PDF, JPG, PNG, ZIP)</div>
                </label>
              </div>
              
              {newExpense.files.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  {newExpense.files.map((file, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '4px', marginBottom: '0.25rem' }}>
                      <FileText size={16} />
                      <span style={{ flex: 1 }}>{file.name}</span>
                      <button type="button" onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={uploadingFiles}>
              <Save size={16} /> {uploadingFiles ? 'Uploading...' : 'Save Expense'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
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
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No expenses found.</td></tr>
            ) : (
              filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{exp.expense_ref}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: `${getCategoryColor(exp.category)}20`, color: getCategoryColor(exp.category) }}>
                      {getCategoryIcon(exp.category)} {exp.category}
                    </span>
                  </td>
                  <td>{editingId === exp.id ? <select className="form-input" value={editForm.resource_name} onChange={(e) => setEditForm({ ...editForm, resource_name: e.target.value })}>{resources.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}</select> : exp.resource_name}</td>
                  <td>{editingId === exp.id ? <input type="date" className="form-input" value={editForm.expense_date} onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })} /> : new Date(exp.expense_date).toLocaleDateString('en-GB')}</td>
                  <td>{editingId === exp.id ? <input type="text" className="form-input" value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} /> : exp.reason}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{editingId === exp.id ? <input type="number" step="0.01" className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} style={{ width: '100px' }} /> : `£${parseFloat(exp.amount).toLocaleString()}`}</td>
                  <td>{editingId === exp.id ? <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select> : <span className={`status-badge ${getStatusColor(exp.status)}`}>{exp.status}</span>}</td>
                  <td>
                    {exp.expense_files?.length > 0 ? (
                      exp.expense_files.map(file => (
                        <button key={file.id} onClick={() => handleDownloadFile(file.file_path, file.file_name)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', marginRight: '0.25rem' }}>
                          <Download size={12} /> {file.file_name.substring(0, 8)}...
                        </button>
                      ))
                    ) : <span style={{ color: '#9ca3af' }}>None</span>}
                  </td>
                  {canEdit && (
                    <td>
                      {editingId === exp.id ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(exp.id)}><Save size={16} /></button>
                          <button className="btn-icon btn-secondary" onClick={handleCancel}><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleEdit(exp)}><Edit2 size={16} /></button>
                          {userRole === 'admin' && <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)}><Trash2 size={16} /></button>}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
