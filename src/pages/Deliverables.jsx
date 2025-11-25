import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Plus, Edit2, Save, X, Trash2, CheckCircle, 
  Clock, Send, AlertCircle, RotateCcw, ThumbsUp
} from 'lucide-react';

export default function Deliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterMilestone, setFilterMilestone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingDeliverable, setCompletingDeliverable] = useState(null);
  const [kpiAssessments, setKpiAssessments] = useState({});
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_ref: '',
    name: '',
    description: '',
    milestone_id: '',
    assigned_to: '',
    due_date: '',
    status: 'Not Started',
    progress: 0,
    kpi_ids: []
  });

  const statuses = [
    'Not Started', 
    'In Progress', 
    'Submitted for Review', 
    'Returned for More Work',
    'Review Complete', 
    'Delivered'
  ];

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

    try {
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*, deliverable_kpis(kpi_id)')
        .eq('project_id', pid)
        .order('deliverable_ref');
      
      setDeliverables(deliverablesData || []);

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name, progress')
        .eq('project_id', pid)
        .order('milestone_ref');
      
      setMilestones(milestonesData || []);

      const { data: kpisData } = await supabase
        .from('kpis')
        .select('id, kpi_ref, name, description, measurement_method, target')
        .eq('project_id', pid)
        .order('kpi_ref');
      
      setKpis(kpisData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleAdd() {
    if (!newDeliverable.deliverable_ref || !newDeliverable.name || !newDeliverable.milestone_id) {
      alert('Please fill in Reference, Name, and select a Milestone');
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('deliverables')
        .insert({
          project_id: projectId,
          deliverable_ref: newDeliverable.deliverable_ref,
          name: newDeliverable.name,
          description: newDeliverable.description,
          milestone_id: newDeliverable.milestone_id,
          assigned_to: newDeliverable.assigned_to,
          due_date: newDeliverable.due_date || null,
          status: newDeliverable.status,
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      if (newDeliverable.kpi_ids.length > 0) {
        const kpiLinks = newDeliverable.kpi_ids.map(kpiId => ({
          deliverable_id: inserted.id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
      setShowAddForm(false);
      setNewDeliverable({
        deliverable_ref: '',
        name: '',
        description: '',
        milestone_id: '',
        assigned_to: '',
        due_date: '',
        status: 'Not Started',
        progress: 0,
        kpi_ids: []
      });
    } catch (error) {
      console.error('Error adding deliverable:', error);
      alert('Failed to add deliverable: ' + error.message);
    }
  }

  function openEditModal(deliverable) {
    setEditForm({
      id: deliverable.id,
      deliverable_ref: deliverable.deliverable_ref,
      name: deliverable.name,
      description: deliverable.description || '',
      milestone_id: deliverable.milestone_id,
      status: deliverable.status || 'Not Started',
      progress: deliverable.progress || 0,
      assigned_to: deliverable.assigned_to || '',
      due_date: deliverable.due_date || '',
      kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || []
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({
          name: editForm.name,
          description: editForm.description,
          milestone_id: editForm.milestone_id,
          status: editForm.status,
          progress: parseInt(editForm.progress) || 0,
          assigned_to: editForm.assigned_to,
          due_date: editForm.due_date || null
        })
        .eq('id', editForm.id);

      if (error) throw error;

      await supabase.from('deliverable_kpis').delete().eq('deliverable_id', editForm.id);
      if (editForm.kpi_ids && editForm.kpi_ids.length > 0) {
        const kpiLinks = editForm.kpi_ids.map(kpiId => ({
          deliverable_id: editForm.id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
      setShowEditModal(false);
      setEditForm({});
      alert('Deliverable updated successfully!');
    } catch (error) {
      console.error('Error updating deliverable:', error);
      alert('Failed to update deliverable: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try {
      await supabase.from('deliverables').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  async function handleStatusChange(deliverableId, newStatus, newProgress = null) {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'Not Started') {
        updateData.progress = 0;
      } else if (newStatus === 'Submitted for Review' || newStatus === 'Review Complete' || newStatus === 'Delivered') {
        updateData.progress = 100;
      } else if (newProgress !== null) {
        updateData.progress = newProgress;
      }

      const { error } = await supabase
        .from('deliverables')
        .update(updateData)
        .eq('id', deliverableId);

      if (error) throw error;
      await fetchData();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update status');
    }
  }

  function openCompletionModal(deliverable) {
    const linkedKpiIds = deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [];
    
    if (linkedKpiIds.length === 0) {
      markDeliveredWithoutKPIs(deliverable);
      return;
    }

    setCompletingDeliverable(deliverable);
    setKpiAssessments({});
    setShowCompletionModal(true);
  }

  async function markDeliveredWithoutKPIs(deliverable) {
    try {
      await supabase
        .from('deliverables')
        .update({ status: 'Delivered', progress: 100 })
        .eq('id', deliverable.id);

      await fetchData();
      alert('Deliverable marked as delivered!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mark as delivered');
    }
  }

  async function handleCompleteWithAssessments() {
    if (!completingDeliverable) return;

    const linkedKpiIds = completingDeliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [];
    
    const allAssessed = linkedKpiIds.every(kpiId => kpiAssessments[kpiId] !== undefined);
    if (!allAssessed) {
      alert('Please assess all KPI criteria (Yes or No) before completing.');
      return;
    }

    try {
      await supabase
        .from('deliverables')
        .update({ status: 'Delivered', progress: 100 })
        .eq('id', completingDeliverable.id);

      for (const kpiId of linkedKpiIds) {
        const criteriaMet = kpiAssessments[kpiId];
        
        await supabase
          .from('deliverable_kpi_assessments')
          .upsert({
            deliverable_id: completingDeliverable.id,
            kpi_id: kpiId,
            criteria_met: criteriaMet,
            assessed_by: currentUserId,
            assessed_at: new Date().toISOString()
          }, {
            onConflict: 'deliverable_id,kpi_id'
          });
      }

      await updateKPIScores(linkedKpiIds);
      await fetchData();
      
      setShowCompletionModal(false);
      setCompletingDeliverable(null);
      setKpiAssessments({});
      alert('Deliverable marked as delivered and KPI assessments saved!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to complete deliverable: ' + error.message);
    }
  }

  async function updateKPIScores(kpiIds) {
    for (const kpiId of kpiIds) {
      try {
        const { data: assessments } = await supabase
          .from('deliverable_kpi_assessments')
          .select('criteria_met')
          .eq('kpi_id', kpiId)
          .not('criteria_met', 'is', null);

        if (assessments && assessments.length > 0) {
          const total = assessments.length;
          const met = assessments.filter(a => a.criteria_met === true).length;
          const score = Math.round((met / total) * 100);

          await supabase
            .from('kpis')
            .update({ 
              current_value: score,
              last_measured: new Date().toISOString()
            })
            .eq('id', kpiId);
        }
      } catch (error) {
        console.error('Error updating KPI score:', error);
      }
    }
  }

  function toggleKpiSelection(kpiId, isEdit = false) {
    if (isEdit) {
      const current = editForm.kpi_ids || [];
      if (current.includes(kpiId)) {
        setEditForm({ ...editForm, kpi_ids: current.filter(id => id !== kpiId) });
      } else {
        setEditForm({ ...editForm, kpi_ids: [...current, kpiId] });
      }
    } else {
      const current = newDeliverable.kpi_ids;
      if (current.includes(kpiId)) {
        setNewDeliverable({ ...newDeliverable, kpi_ids: current.filter(id => id !== kpiId) });
      } else {
        setNewDeliverable({ ...newDeliverable, kpi_ids: [...current, kpiId] });
      }
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Delivered': return { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle };
      case 'Review Complete': return { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp };
      case 'Submitted for Review': return { bg: '#fef3c7', color: '#d97706', icon: Send };
      case 'In Progress': return { bg: '#e0e7ff', color: '#6366f1', icon: Clock };
      case 'Returned for More Work': return { bg: '#fee2e2', color: '#dc2626', icon: RotateCcw };
      default: return { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle };
    }
  }

  const filteredDeliverables = deliverables.filter(d => {
    if (filterMilestone !== 'all' && d.milestone_id !== filterMilestone) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const canEdit = userRole === 'admin' || userRole === 'contributor' || userRole === 'customer_pm';
  const canReview = userRole === 'admin' || userRole === 'customer_pm';

  const KPISelector = ({ selectedIds, onToggle, isEdit = false }) => (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: '8px', 
      padding: '0.75rem',
      maxHeight: '300px',
      overflowY: 'auto',
      backgroundColor: '#f8fafc'
    }}>
      {kpis.map(kpi => (
        <label 
          key={kpi.id} 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.75rem',
            padding: '0.75rem',
            marginBottom: '0.5rem',
            backgroundColor: selectedIds.includes(kpi.id) ? '#dbeafe' : 'white',
            border: selectedIds.includes(kpi.id) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <input 
            type="checkbox"
            checked={selectedIds.includes(kpi.id)}
            onChange={() => onToggle(kpi.id, isEdit)}
            style={{ marginTop: '4px', width: '18px', height: '18px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ 
                fontWeight: '700', 
                color: '#1e40af',
                backgroundColor: '#eff6ff',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}>
                {kpi.kpi_ref}
              </span>
              <span style={{ fontWeight: '600', color: '#374151' }}>{kpi.name}</span>
            </div>
            {kpi.description && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                {kpi.description.length > 150 ? kpi.description.substring(0, 150) + '...' : kpi.description}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem', fontWeight: '500' }}>
              Target: {kpi.target}%
            </div>
          </div>
        </label>
      ))}
    </div>
  );

  if (loading) return <div className="loading">Loading deliverables...</div>;

  const submittedForReviewCount = deliverables.filter(d => d.status === 'Submitted for Review').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Package size={28} />
          <div>
            <h1>Deliverables</h1>
            <p>Track project deliverables with review workflow</p>
          </div>
        </div>
        {canEdit && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Deliverable
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Deliverables</div>
          <div className="stat-value">{deliverables.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Submitted for Review</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{submittedForReviewCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#6366f1' }}>
            {deliverables.filter(d => d.status === 'In Progress' || d.status === 'Returned for More Work').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {deliverables.filter(d => d.status === 'Delivered').length}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter by:</span>
          <select 
            value={filterMilestone} 
            onChange={(e) => setFilterMilestone(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Milestones</option>
            {milestones.map(m => (
              <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {submittedForReviewCount > 0 && (
            <button
              onClick={() => setFilterStatus('Submitted for Review')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                border: '2px solid #d97706',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={16} /> {submittedForReviewCount} Awaiting Review
            </button>
          )}
          <span style={{ color: '#64748b' }}>Showing {filteredDeliverables.length} of {deliverables.length}</span>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #10b981' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Deliverable</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Reference *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="DEL001"
                value={newDeliverable.deliverable_ref}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, deliverable_ref: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Deliverable name"
                value={newDeliverable.name}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={2}
              placeholder="Description"
              value={newDeliverable.description}
              onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Milestone *</label>
              <select 
                className="form-input"
                value={newDeliverable.milestone_id}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, milestone_id: e.target.value })}
              >
                <option value="">Select Milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Assigned To</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Person"
                value={newDeliverable.assigned_to}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, assigned_to: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input 
                type="date" 
                className="form-input"
                value={newDeliverable.due_date}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Link to KPIs (select all that apply)</label>
            <KPISelector 
              selectedIds={newDeliverable.kpi_ids} 
              onToggle={toggleKpiSelection}
              isEdit={false}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} /> Save Deliverable
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Milestone</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Linked KPIs</th>
              <th>Due Date</th>
              <th style={{ width: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No deliverables found.
                </td>
              </tr>
            ) : (
              filteredDeliverables.map(del => {
                const milestone = milestones.find(m => m.id === del.milestone_id);
                const linkedKpiIds = del.deliverable_kpis?.map(dk => dk.kpi_id) || [];
                const statusConfig = getStatusColor(del.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={del.id} style={{
                    backgroundColor: del.status === 'Submitted for Review' ? '#fffbeb' : 'transparent'
                  }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{del.deliverable_ref}</td>
                    <td style={{ fontWeight: '500' }}>{del.name}</td>
                    <td>
                      <span style={{ 
                        padding: '0.125rem 0.375rem', 
                        backgroundColor: '#f0fdf4', 
                        color: '#16a34a',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        {milestone?.milestone_ref || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: '500'
                      }}>
                        <StatusIcon size={14} />
                        {del.status || 'Not Started'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '8px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${del.progress || 0}%`, 
                            height: '100%', 
                            backgroundColor: del.status === 'Delivered' ? '#10b981' : '#6366f1',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{del.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {linkedKpiIds.map(kpiId => {
                          const kpi = kpis.find(k => k.id === kpiId);
                          return kpi ? (
                            <span 
                              key={kpiId} 
                              title={kpi.name}
                              style={{ 
                                padding: '0.125rem 0.375rem', 
                                backgroundColor: '#dbeafe', 
                                color: '#2563eb',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'help'
                              }}
                            >
                              {kpi.kpi_ref}
                            </span>
                          ) : null;
                        })}
                        {linkedKpiIds.length === 0 && (
                          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {del.due_date ? new Date(del.due_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {canEdit && (
                          <button 
                            onClick={() => openEditModal(del)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#f1f5f9',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        
                        {canEdit && (del.status === 'In Progress' || del.status === 'Returned for More Work') && (
                          <button 
                            onClick={() => handleStatusChange(del.id, 'Submitted for Review', 100)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fef3c7',
                              color: '#d97706',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Submit for Review"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        
                        {canReview && del.status === 'Submitted for Review' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(del.id, 'Review Complete')}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#dbeafe',
                                color: '#2563eb',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Approve Review"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(del.id, 'Returned for More Work', 50)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Return for More Work"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </>
                        )}
                        
                        {canReview && del.status === 'Review Complete' && (
                          <button 
                            onClick={() => openCompletionModal(del)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Mark as Delivered (with KPI Assessment)"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        
                        {canEdit && (
                          <button 
                            onClick={() => handleDelete(del.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showEditModal && editForm.id && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={24} style={{ color: '#3b82f6' }} />
              Edit Deliverable - {editForm.deliverable_ref}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Reference</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editForm.deliverable_ref}
                  disabled
                  style={{ backgroundColor: '#f1f5f9' }}
                />
              </div>
              <div>
                <label className="form-label">Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Description</label>
              <textarea 
                className="form-input" 
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Milestone *</label>
                <select 
                  className="form-input"
                  value={editForm.milestone_id}
                  onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}
                >
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Assigned To</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Status</label>
                <select 
                  className="form-input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Progress: {editForm.progress}%</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Link to KPIs (select all that apply)</label>
              <KPISelector 
                selectedIds={editForm.kpi_ids || []} 
                onToggle={toggleKpiSelection}
                isEdit={true}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowEditModal(false); setEditForm({}); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompletionModal && completingDeliverable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              Mark as Delivered
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              <strong>{completingDeliverable.deliverable_ref}</strong> - {completingDeliverable.name}
            </p>

            <div style={{ 
              backgroundColor: '#fffbeb', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              borderLeft: '4px solid #f59e0b'
            }}>
              <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>⚠️ KPI Assessment Required</h4>
              <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                For each KPI linked to this deliverable, assess whether the criteria was met.
              </p>
            </div>

            {kpis
              .filter(k => completingDeliverable.deliverable_kpis?.some(dk => dk.kpi_id === k.id))
              .map(kpi => (
                <div key={kpi.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: kpiAssessments[kpi.id] !== undefined ? 
                    (kpiAssessments[kpi.id] ? '#f0fdf4' : '#fef2f2') : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          color: '#1e40af',
                          backgroundColor: '#eff6ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {kpi.kpi_ref}
                        </span>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{kpi.name}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '500' }}>
                        Target: {kpi.target}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: true })}
                        style={{
                          padding: '0.5rem 1.25rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === true ? '#10b981' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === true ? '#dcfce7' : 'white',
                          color: kpiAssessments[kpi.id] === true ? '#16a34a' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✓ Yes
                      </button>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: false })}
                        style={{
                          padding: '0.5rem 1.25rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === false ? '#ef4444' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === false ? '#fef2f2' : 'white',
                          color: kpiAssessments[kpi.id] === false ? '#dc2626' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✗ No
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#64748b', 
                    backgroundColor: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: '6px',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <strong style={{ color: '#1e40af' }}>Criteria:</strong> {kpi.description || kpi.measurement_method || 'No criteria specified'}
                  </div>
                </div>
              ))}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletingDeliverable(null);
                  setKpiAssessments({});
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCompleteWithAssessments}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle size={18} /> Mark as Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Deliverable Workflow</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li><strong>In Progress</strong>: Contributor working on deliverable (can update progress %)</li>
          <li><strong>Submit for Review</strong>: Contributor completes work and submits (sets progress to 100%)</li>
          <li><strong>Review</strong>: Admin/Customer PM approves or returns for more work</li>
          <li><strong>Mark as Delivered</strong>: After approval, assess KPIs and mark as delivered</li>
          <li><strong>Milestone Progress</strong>: Automatically calculated from average deliverable progress</li>
        </ul>
      </div>
    </div>
  );
}
