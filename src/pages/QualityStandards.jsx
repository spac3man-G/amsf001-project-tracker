import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Award, CheckCircle, AlertCircle, Clock, TrendingUp,
  AlertTriangle, Info, Plus, Edit2, Trash2, Save, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';

export default function QualityStandards() {
  // Use shared contexts instead of local state for auth and project
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;

  // Use the permissions hook - clean, pre-bound permission functions
  const { canManageQualityStandards } = usePermissions();

  // Permission check - Note: Customer PM should NOT edit QS per User Manual
  const canEdit = canManageQualityStandards;

  const [qualityStandards, setQualityStandards] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const [newQS, setNewQS] = useState({
    qs_ref: '',
    name: '',
    description: '',
    target: 100,
    current_value: 0
  });

  // Fetch data when projectId becomes available (from ProjectContext)
  useEffect(() => {
    if (projectId) {
      fetchQualityStandards(projectId);
    }
  }, [projectId]);

  async function fetchQualityStandards(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      const { data, error } = await supabase
        .from('quality_standards')
        .select('*')
        .eq('project_id', pid)
        .order('qs_ref');

      if (error) throw error;
      setQualityStandards(data || []);

      // Fetch assessment counts for each QS
      const counts = {};
      for (const qs of (data || [])) {
        const { data: assessments } = await supabase
          .from('deliverable_qs_assessments')
          .select('criteria_met')
          .eq('quality_standard_id', qs.id);

        const total = assessments?.filter(a => a.criteria_met !== null).length || 0;
        const met = assessments?.filter(a => a.criteria_met === true).length || 0;
        counts[qs.id] = { total, met };
      }
      setAssessmentCounts(counts);
    } catch (error) {
      console.error('Error fetching quality standards:', error);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newQS.qs_ref || !newQS.name) {
      alert('Please fill in Reference and Name');
      return;
    }

    try {
      const { error } = await supabase
        .from('quality_standards')
        .insert({
          project_id: projectId,
          qs_ref: newQS.qs_ref,
          name: newQS.name,
          description: newQS.description,
          target: parseInt(newQS.target) || 100,
          current_value: parseInt(newQS.current_value) || 0,
          created_by: currentUserId
        });

      if (error) throw error;

      await fetchQualityStandards();
      setShowAddForm(false);
      setNewQS({ qs_ref: '', name: '', description: '', target: 100, current_value: 0 });
      alert('Quality Standard added successfully!');
    } catch (error) {
      console.error('Error adding quality standard:', error);
      alert('Failed to add: ' + error.message);
    }
  }

  function handleEdit(qs) {
    setEditingId(qs.id);
    setEditForm({
      qs_ref: qs.qs_ref,
      name: qs.name,
      description: qs.description || '',
      target: qs.target || 100,
      current_value: qs.current_value || 0
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('quality_standards')
        .update({
          qs_ref: editForm.qs_ref,
          name: editForm.name,
          description: editForm.description,
          target: parseInt(editForm.target) || 100,
          current_value: parseInt(editForm.current_value) || 0
        })
        .eq('id', id);

      if (error) throw error;

      await fetchQualityStandards();
      setEditingId(null);
      alert('Quality Standard updated!');
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this Quality Standard? This will also remove all associated assessments.')) return;

    try {
      // First delete assessments
      await supabase
        .from('deliverable_qs_assessments')
        .delete()
        .eq('quality_standard_id', id);

      // Then delete the QS
      const { error } = await supabase
        .from('quality_standards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchQualityStandards();
      alert('Quality Standard deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  function getQSStatus(qs) {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    
    if (assessments.total === 0) {
      return { 
        label: 'Not Started', 
        color: '#64748b', 
        bg: '#f1f5f9',
        icon: Clock
      };
    }

    const percentage = (assessments.met / assessments.total) * 100;
    const target = qs.target || 100;

    if (percentage >= target) {
      return { 
        label: 'Achieved', 
        color: '#16a34a', 
        bg: '#dcfce7',
        icon: CheckCircle
      };
    } else if (percentage >= target * 0.8) {
      return { 
        label: 'On Track', 
        color: '#2563eb', 
        bg: '#dbeafe',
        icon: TrendingUp
      };
    } else if (percentage >= target * 0.6) {
      return { 
        label: 'At Risk', 
        color: '#ea580c', 
        bg: '#ffedd5',
        icon: AlertTriangle
      };
    } else {
      return { 
        label: 'Critical', 
        color: '#dc2626', 
        bg: '#fee2e2',
        icon: AlertCircle
      };
    }
  }

  // Calculate summary stats
  const totalQS = qualityStandards.length;
  const achievedQS = qualityStandards.filter(qs => {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    if (assessments.total === 0) return false;
    const percentage = (assessments.met / assessments.total) * 100;
    return percentage >= (qs.target || 100);
  }).length;
  const atRiskQS = qualityStandards.filter(qs => {
    const status = getQSStatus(qs);
    return status.label === 'At Risk' || status.label === 'Critical';
  }).length;
  const notStartedQS = qualityStandards.filter(qs => {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    return assessments.total === 0;
  }).length;

  if (loading && !projectId) return <div className="loading">Loading quality standards...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Award size={28} />
          <div>
            <h1>Quality Standards</h1>
            <p>Track quality compliance across deliverables</p>
          </div>
        </div>
        {canEdit && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Quality Standard
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Standards</div>
          <div className="stat-value">{totalQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#16a34a' }}>Achieved</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{achievedQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#ea580c' }}>At Risk</div>
          <div className="stat-value" style={{ color: '#ea580c' }}>{atRiskQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#64748b' }}>Not Started</div>
          <div className="stat-value" style={{ color: '#64748b' }}>{notStartedQS}</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && canEdit && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Quality Standard</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Reference *</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g., QS08"
                  value={newQS.qs_ref}
                  onChange={(e) => setNewQS({ ...newQS, qs_ref: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Name *</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g., Documentation Quality"
                  value={newQS.name}
                  onChange={(e) => setNewQS({ ...newQS, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Description</label>
              <textarea 
                className="form-input"
                rows={3}
                placeholder="Describe what this quality standard measures..."
                value={newQS.description}
                onChange={(e) => setNewQS({ ...newQS, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="form-label">Target (%)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="0"
                  max="100"
                  value={newQS.target}
                  onChange={(e) => setNewQS({ ...newQS, target: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Current Value (%)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="0"
                  max="100"
                  value={newQS.current_value}
                  onChange={(e) => setNewQS({ ...newQS, current_value: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Quality Standard
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quality Standards Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Target</th>
              <th>Current</th>
              <th>Assessments</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {qualityStandards.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No quality standards found. {canEdit && 'Click "Add Quality Standard" to create one.'}
                </td>
              </tr>
            ) : (
              qualityStandards.map(qs => {
                const status = getQSStatus(qs);
                const StatusIcon = status.icon;
                const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
                const isEditing = editingId === qs.id;

                return (
                  <tr key={qs.id}>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="form-input"
                          value={editForm.qs_ref}
                          onChange={(e) => setEditForm({ ...editForm, qs_ref: e.target.value })}
                          style={{ width: '80px' }}
                        />
                      ) : (
                        <Link 
                          to={`/quality-standards/${qs.id}`}
                          style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: '600',
                            color: '#8b5cf6',
                            textDecoration: 'none'
                          }}
                        >
                          {qs.qs_ref}
                        </Link>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="form-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <Link 
                          to={`/quality-standards/${qs.id}`}
                          style={{ 
                            fontWeight: '500',
                            color: '#3b82f6',
                            textDecoration: 'none'
                          }}
                        >
                          {qs.name}
                        </Link>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <input 
                          type="number"
                          className="form-input"
                          min="0"
                          max="100"
                          value={editForm.target}
                          onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                          style={{ width: '70px', textAlign: 'center' }}
                        />
                      ) : (
                        `${qs.target}%`
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <input 
                          type="number"
                          className="form-input"
                          min="0"
                          max="100"
                          value={editForm.current_value}
                          onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })}
                          style={{ width: '70px', textAlign: 'center' }}
                        />
                      ) : (
                        <span style={{ 
                          fontWeight: '600',
                          color: qs.current_value >= qs.target ? '#16a34a' : '#64748b'
                        }}>
                          {qs.current_value}%
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {assessments.total > 0 ? (
                        <span style={{ color: '#64748b' }}>
                          {assessments.met} of {assessments.total} passed
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          None yet
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        backgroundColor: status.bg,
                        color: status.color
                      }}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        {isEditing ? (
                          <div className="action-buttons">
                            <button 
                              className="btn-icon btn-success" 
                              onClick={() => handleSave(qs.id)}
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-secondary" 
                              onClick={() => setEditingId(null)}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button 
                              className="btn-icon" 
                              onClick={() => handleEdit(qs)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-danger" 
                              onClick={() => handleDelete(qs.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderLeft: '4px solid #16a34a',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#16a34a', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Quality Standards Overview</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.9rem' }}>
              <li><strong>Not Started:</strong> No deliverables have been assessed against this standard yet</li>
              <li><strong>Achieved:</strong> Current score meets or exceeds target</li>
              <li><strong>On Track:</strong> Within 80% of target</li>
              <li><strong>At Risk:</strong> 60-80% of target</li>
              <li><strong>Critical:</strong> Below 60% of target (only for assessed standards)</li>
              {canEdit && <li><strong>Permissions:</strong> Admin and Supplier PM can add/edit quality standards</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
