import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common';
import { FileText, Edit2, Save, X, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function NetworkStandards() {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = [
    'Core Networks Infrastructure',
    'Connectivity Networks',
    'Security Networks',
    'Operations & Management'
  ];

  const statuses = [
    'Not Started',
    'In Progress',
    'Draft Complete',
    'Under Review',
    'Approved',
    'Published'
  ];

  useEffect(() => {
    fetchStandards();
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

  async function fetchStandards() {
    try {
      const { data, error } = await supabase
        .from('network_standards')
        .select('*')
        .order('standard_ref');
      
      if (error) throw error;
      setStandards(data || []);
    } catch (error) {
      console.error('Error fetching network standards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(standard) {
    setEditingId(standard.id);
    setEditForm({
      status: standard.status,
      percent_complete: standard.percent_complete,
      assigned_to: standard.assigned_to || '',
      draft_date: standard.draft_date || '',
      review_date: standard.review_date || '',
      approval_date: standard.approval_date || '',
      document_url: standard.document_url || '',
      comments: standard.comments || ''
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('network_standards')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;
      
      await fetchStandards();
      setEditingId(null);
      alert('Standard updated successfully!');
    } catch (error) {
      console.error('Error updating standard:', error);
      alert('Failed to update standard');
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Published': return 'status-completed';
      case 'Approved': return 'status-completed';
      case 'Under Review': return 'status-in-progress';
      case 'Draft Complete': return 'status-in-progress';
      case 'In Progress': return 'status-at-risk';
      default: return 'status-not-started';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Published':
      case 'Approved':
        return <CheckCircle size={14} />;
      case 'Under Review':
      case 'Draft Complete':
      case 'In Progress':
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Core Networks Infrastructure': return '#3b82f6';
      case 'Connectivity Networks': return '#10b981';
      case 'Security Networks': return '#ef4444';
      case 'Operations & Management': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  // Filter standards
  const filteredStandards = standards.filter(s => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  // Calculate summary stats
  const summary = {
    total: standards.length,
    notStarted: standards.filter(s => s.status === 'Not Started').length,
    inProgress: standards.filter(s => ['In Progress', 'Draft Complete', 'Under Review'].includes(s.status)).length,
    completed: standards.filter(s => ['Approved', 'Published'].includes(s.status)).length,
    avgProgress: standards.length > 0 
      ? Math.round(standards.reduce((sum, s) => sum + (s.percent_complete || 0), 0) / standards.length)
      : 0
  };

  // Group by category for summary cards
  const categoryStats = categories.map(cat => {
    const catStandards = standards.filter(s => s.category === cat);
    return {
      category: cat,
      total: catStandards.length,
      completed: catStandards.filter(s => ['Approved', 'Published'].includes(s.status)).length,
      progress: catStandards.length > 0
        ? Math.round(catStandards.reduce((sum, s) => sum + (s.percent_complete || 0), 0) / catStandards.length)
        : 0
    };
  });

  if (loading) {
    return <LoadingSpinner message="Loading network standards..." size="large" fullPage />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <FileText size={28} />
          <div>
            <h1>Network Standards</h1>
            <p>Track progress on {summary.total} network standards documentation</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Standards</div>
          <div className="stat-value">{summary.total}</div>
          <div className="stat-sublabel">Across 4 categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Started</div>
          <div className="stat-value" style={{ color: '#6b7280' }}>{summary.notStarted}</div>
          <div className="stat-sublabel">{Math.round(summary.notStarted / summary.total * 100)}% of total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{summary.inProgress}</div>
          <div className="stat-sublabel">{Math.round(summary.inProgress / summary.total * 100)}% of total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{summary.completed}</div>
          <div className="stat-sublabel">{Math.round(summary.completed / summary.total * 100)}% of total</div>
        </div>
      </div>

      {/* Category Progress Cards */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Progress by Category</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {categoryStats.map(cat => (
            <div key={cat.category} style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              backgroundColor: '#f8fafc',
              borderLeft: `4px solid ${getCategoryColor(cat.category)}`
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{cat.category}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{cat.completed}/{cat.total} complete</span>
                <span style={{ fontWeight: '600', color: getCategoryColor(cat.category) }}>{cat.progress}%</span>
              </div>
              <div style={{ 
                marginTop: '0.5rem', 
                height: '6px', 
                backgroundColor: '#e2e8f0', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${cat.progress}%`, 
                  height: '100%', 
                  backgroundColor: getCategoryColor(cat.category),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} />
            <span style={{ fontWeight: '500' }}>Filters:</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Showing {filteredStandards.length} of {standards.length} standards
          </span>
        </div>
      </div>

      {/* Standards Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Category</th>
                <th>Standard Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Assigned To</th>
                <th>Target</th>
                {(userRole === 'admin' || userRole === 'contributor') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStandards.map(standard => (
                <tr key={standard.id}>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{standard.standard_ref}</td>
                  <td>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: `${getCategoryColor(standard.category)}20`,
                      color: getCategoryColor(standard.category)
                    }}>
                      {standard.category.split(' ')[0]}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{standard.name}</div>
                    {standard.description && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {standard.description.substring(0, 80)}...
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === standard.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="form-input"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(standard.status)}`}>
                        {getStatusIcon(standard.status)}
                        {standard.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === standard.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.percent_complete}
                        onChange={(e) => setEditForm({ ...editForm, percent_complete: parseInt(e.target.value) || 0 })}
                        className="form-input"
                        style={{ width: '70px' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '8px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${standard.percent_complete || 0}%`, 
                            height: '100%', 
                            backgroundColor: standard.percent_complete >= 100 ? '#10b981' : '#3b82f6'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{standard.percent_complete || 0}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === standard.id ? (
                      <input
                        type="text"
                        value={editForm.assigned_to}
                        onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                        className="form-input"
                        placeholder="Name"
                      />
                    ) : (
                      <span style={{ color: standard.assigned_to ? 'inherit' : '#9ca3af' }}>
                        {standard.assigned_to || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {standard.target_milestone}
                  </td>
                  {(userRole === 'admin' || userRole === 'contributor') && (
                    <td>
                      {editingId === standard.id ? (
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleSave(standard.id)}
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            className="btn-icon btn-secondary"
                            onClick={handleCancel}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(standard)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Status Legend</h4>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {statuses.map(status => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status-badge ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
