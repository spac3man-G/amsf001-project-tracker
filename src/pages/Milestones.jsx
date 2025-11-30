import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Milestone as MilestoneIcon, Plus, Trash2, RefreshCw, Edit2, Save, X, FileCheck, Award, CheckCircle, PenTool } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';

export default function Milestones() {
  // Use shared contexts instead of local state for auth and project
  const { user, role: userRole, profile } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';

  // Use the permissions hook
  const {
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,
    canSignAsSupplier,
    canSignAsCustomer
  } = usePermissions();

  const [milestones, setMilestones] = useState([]);
  const [milestoneDeliverables, setMilestoneDeliverables] = useState({});
  const [certificates, setCertificates] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, milestone: null });
  const [saving, setSaving] = useState(false);

  const [newMilestone, setNewMilestone] = useState({
    milestone_ref: '',
    name: '',
    description: '',
    baseline_start_date: '',
    baseline_end_date: '',
    actual_start_date: '',
    forecast_end_date: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    milestone_ref: '',
    name: '',
    description: '',
    baseline_start_date: '',
    baseline_end_date: '',
    actual_start_date: '',
    forecast_end_date: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

  // Fetch data when projectId becomes available (from ProjectContext)
  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      fetchCertificates(projectId);
    }
  }, [projectId]);

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }

    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    
    if (allDelivered) {
      return 'Completed';
    }
    
    if (allNotStarted) {
      return 'Not Started';
    }
    
    // Any other combination means work is in progress
    return 'In Progress';
  }

  // Calculate milestone progress from deliverables
  function calculateMilestoneProgress(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 0;
    }
    
    const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
    return Math.round(totalProgress / deliverables.length);
  }

  async function fetchCertificates(projId) {
    const pid = projId || projectId;
    try {
      const { data, error } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('project_id', pid);

      if (!error && data) {
        // Index by milestone_id for easy lookup
        const certsMap = {};
        data.forEach(cert => {
          certsMap[cert.milestone_id] = cert;
        });
        setCertificates(certsMap);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  }

  async function fetchMilestones(projId) {
    const pid = projId || projectId;
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', pid)
        .order('milestone_ref');

      if (error) throw error;
      setMilestones(data || []);

      // Fetch deliverables for all milestones to calculate status
      if (data && data.length > 0) {
        const milestoneIds = data.map(m => m.id);
        const { data: deliverables, error: delError } = await supabase
          .from('deliverables')
          .select('id, milestone_id, status, progress')
          .in('milestone_id', milestoneIds);

        if (!delError && deliverables) {
          // Group deliverables by milestone_id
          const grouped = {};
          deliverables.forEach(d => {
            if (!grouped[d.milestone_id]) {
              grouped[d.milestone_id] = [];
            }
            grouped[d.milestone_id].push(d);
          });
          setMilestoneDeliverables(grouped);
        }
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newMilestone.milestone_ref || !newMilestone.name) {
      alert('Please fill in at least Milestone Reference and Name');
      return;
    }

    try {
      const { error } = await supabase
        .from('milestones')
        .insert({
          project_id: projectId,
          milestone_ref: newMilestone.milestone_ref,
          name: newMilestone.name,
          description: newMilestone.description,
          start_date: newMilestone.start_date || newMilestone.baseline_start_date || null,
          end_date: newMilestone.end_date || newMilestone.baseline_end_date || null,
          baseline_start_date: newMilestone.baseline_start_date || newMilestone.start_date || null,
          baseline_end_date: newMilestone.baseline_end_date || newMilestone.end_date || null,
          actual_start_date: newMilestone.actual_start_date || newMilestone.start_date || null,
          forecast_end_date: newMilestone.forecast_end_date || newMilestone.end_date || null,
          budget: parseFloat(newMilestone.budget) || 0,
          progress: 0,
          status: 'Not Started',
          created_by: currentUserId
        });

      if (error) throw error;

      await fetchMilestones();
      setShowAddForm(false);
      setNewMilestone({
        milestone_ref: '',
        name: '',
        description: '',
        baseline_start_date: '',
        baseline_end_date: '',
        actual_start_date: '',
        forecast_end_date: '',
        start_date: '',
        end_date: '',
        budget: ''
      });
      alert('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to add milestone: ' + error.message);
    }
  }

  function handleDeleteClick(milestone) {
    setDeleteDialog({ isOpen: true, milestone });
  }

  async function handleConfirmDelete() {
    const milestone = deleteDialog.milestone;
    if (!milestone) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestone.id);

      if (error) throw error;
      await fetchMilestones();
      setDeleteDialog({ isOpen: false, milestone: null });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Failed to delete milestone: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(milestone) {
    setEditForm({
      id: milestone.id,
      milestone_ref: milestone.milestone_ref || '',
      name: milestone.name || '',
      description: milestone.description || '',
      baseline_start_date: milestone.baseline_start_date || milestone.start_date || '',
      baseline_end_date: milestone.baseline_end_date || milestone.end_date || '',
      actual_start_date: milestone.actual_start_date || milestone.start_date || '',
      forecast_end_date: milestone.forecast_end_date || milestone.end_date || '',
      start_date: milestone.start_date || '',
      end_date: milestone.end_date || '',
      budget: milestone.budget || ''
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.milestone_ref || !editForm.name) {
      alert('Please fill in at least Milestone Reference and Name');
      return;
    }

    try {
      // Note: We don't update status here - it's calculated from deliverables
      const { error } = await supabase
        .from('milestones')
        .update({
          milestone_ref: editForm.milestone_ref,
          name: editForm.name,
          description: editForm.description,
          start_date: editForm.start_date || editForm.baseline_start_date || null,
          end_date: editForm.end_date || editForm.baseline_end_date || null,
          baseline_start_date: editForm.baseline_start_date || null,
          baseline_end_date: editForm.baseline_end_date || null,
          actual_start_date: editForm.actual_start_date || null,
          forecast_end_date: editForm.forecast_end_date || null,
          budget: parseFloat(editForm.budget) || 0
        })
        .eq('id', editForm.id);

      if (error) throw error;

      await fetchMilestones();
      setShowEditModal(false);
      alert('Milestone updated successfully!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone: ' + error.message);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return { bg: '#dcfce7', color: '#16a34a' };
      case 'In Progress': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  function getCertificateStatusColor(status) {
    switch (status) {
      case 'Signed': return { bg: '#dcfce7', color: '#16a34a' };
      case 'Pending Supplier Signature': return { bg: '#fef3c7', color: '#d97706' };
      case 'Pending Customer Signature': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Draft': return { bg: '#f1f5f9', color: '#64748b' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  async function generateCertificate(milestone) {
    const deliverables = milestoneDeliverables[milestone.id] || [];
    
    // Verify all deliverables are delivered
    const allDelivered = deliverables.length > 0 && deliverables.every(d => d.status === 'Delivered');
    if (!allDelivered) {
      alert('Cannot generate certificate: All deliverables must be delivered first.');
      return;
    }

    // Check if certificate already exists
    if (certificates[milestone.id]) {
      openCertificateModal(milestone);
      return;
    }

    try {
      // Fetch full deliverable details for the snapshot
      const { data: fullDeliverables } = await supabase
        .from('deliverables')
        .select('deliverable_ref, name, status, progress')
        .eq('milestone_id', milestone.id)
        .eq('status', 'Delivered');

      const certificateNumber = `CERT-${milestone.milestone_ref}-${Date.now().toString(36).toUpperCase()}`;

      const { data: cert, error } = await supabase
        .from('milestone_certificates')
        .insert({
          project_id: projectId,
          milestone_id: milestone.id,
          certificate_number: certificateNumber,
          milestone_ref: milestone.milestone_ref,
          milestone_name: milestone.name,
          payment_milestone_value: milestone.budget || 0,
          status: 'Draft',
          deliverables_snapshot: fullDeliverables || [],
          generated_by: currentUserId
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCertificates();
      openCertificateModal(milestone);
      alert('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate: ' + error.message);
    }
  }

  function openCertificateModal(milestone) {
    const cert = certificates[milestone.id];
    setSelectedCertificate({
      ...cert,
      milestone,
      deliverables: milestoneDeliverables[milestone.id] || []
    });
    setShowCertificateModal(true);
  }

  async function signCertificate(signatureType) {
    if (!selectedCertificate) return;

    const isSupplier = signatureType === 'supplier';
    const isCustomer = signatureType === 'customer';

    // Check role permissions
    if (isSupplier && !['admin', 'supplier_pm'].includes(userRole)) {
      alert('Only Admin or Supplier PM can sign as supplier.');
      return;
    }
    if (isCustomer && userRole !== 'customer_pm') {
      alert('Only Customer PM can sign as customer.');
      return;
    }

    try {
      const updates = {};
      let newStatus = selectedCertificate.status;

      if (isSupplier) {
        updates.supplier_pm_id = currentUserId;
        updates.supplier_pm_name = currentUserName;
        updates.supplier_pm_signed_at = new Date().toISOString();
        
        if (selectedCertificate.customer_pm_signed_at) {
          newStatus = 'Signed';
        } else {
          newStatus = 'Pending Customer Signature';
        }
      }

      if (isCustomer) {
        updates.customer_pm_id = currentUserId;
        updates.customer_pm_name = currentUserName;
        updates.customer_pm_signed_at = new Date().toISOString();
        
        if (selectedCertificate.supplier_pm_signed_at) {
          newStatus = 'Signed';
        } else {
          newStatus = 'Pending Supplier Signature';
        }
      }

      updates.status = newStatus;

      const { error } = await supabase
        .from('milestone_certificates')
        .update(updates)
        .eq('id', selectedCertificate.id);

      if (error) throw error;

      await fetchCertificates();
      
      // Refresh modal data
      const updatedCert = { ...selectedCertificate, ...updates };
      setSelectedCertificate(updatedCert);
      
      alert('Certificate signed successfully!');
    } catch (error) {
      console.error('Error signing certificate:', error);
      alert('Failed to sign certificate: ' + error.message);
    }
  }

  // Use centralized permission functions - these are already booleans from usePermissions
  const canEdit = canEditMilestone;
  const canSignSupplier = canSignAsSupplier;
  const canSignCustomer = canSignAsCustomer;

  if (loading) return <LoadingSpinner message="Loading milestones..." size="large" fullPage />;

  // Calculate stats using computed status
  const totalBudget = milestones.reduce((sum, m) => sum + (m.budget || 0), 0);
  const milestonesWithStatus = milestones.map(m => ({
    ...m,
    computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
    computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
  }));
  const avgProgress = milestones.length > 0 
    ? Math.round(milestonesWithStatus.reduce((sum, m) => sum + m.computedProgress, 0) / milestones.length)
    : 0;
  const completedCount = milestonesWithStatus.filter(m => m.computedStatus === 'Completed').length;
  
  // Certificate stats
  const signedCertificates = Object.values(certificates).filter(c => c.status === 'Signed').length;
  const pendingCertificates = Object.values(certificates).filter(c => 
    c.status === 'Pending Customer Signature' || c.status === 'Pending Supplier Signature'
  ).length;
  const certificatesNeeded = completedCount - Object.keys(certificates).length;

  return (
    <div className="page-container">
      <PageHeader
        icon={MilestoneIcon}
        title="Milestones"
        subtitle="Track project milestones and deliverables"
      >
        <button className="btn btn-secondary" onClick={() => fetchMilestones()}>
          <RefreshCw size={18} /> Refresh
        </button>
        {canEdit && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Milestone
          </button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={MilestoneIcon}
          label="Total Milestones"
          value={milestones.length}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          color="#10b981"
        />
        <StatCard
          label="Average Progress"
          value={`${avgProgress}%`}
          color="#3b82f6"
        />
        <StatCard
          label="Total Billable"
          value={`£${totalBudget.toLocaleString()}`}
          subtext="on completion"
          color="#10b981"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Link to="/gantt" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 View Gantt Chart
        </Link>
      </div>

      {/* Certificate Stats */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fefce8', borderLeft: '4px solid #eab308' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Award size={24} style={{ color: '#ca8a04' }} />
          <h4 style={{ margin: 0, color: '#854d0e' }}>Milestone Acceptance Certificates</h4>
          <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{signedCertificates}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>Signed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{pendingCertificates}</div>
              <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: certificatesNeeded > 0 ? '#dc2626' : '#64748b' }}>{certificatesNeeded > 0 ? certificatesNeeded : 0}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Awaiting Generation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && canEdit && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #10b981' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Milestone</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Milestone Reference *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="M01"
                value={newMilestone.milestone_ref}
                onChange={(e) => setNewMilestone({ ...newMilestone, milestone_ref: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Milestone name"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={2}
              placeholder="Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
          </div>
          
          {/* Baseline Dates */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>Baseline Schedule (Original Plan)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Baseline Start Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newMilestone.baseline_start_date || newMilestone.start_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, baseline_start_date: e.target.value, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Baseline End Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newMilestone.baseline_end_date || newMilestone.end_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, baseline_end_date: e.target.value, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          {/* Actual/Forecast Dates */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>Current Schedule</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Actual Start Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newMilestone.actual_start_date || newMilestone.start_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, actual_start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Forecast End Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newMilestone.forecast_end_date || newMilestone.end_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, forecast_end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          {/* Billable Amount */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Billable Amount (£)</label>
            <input 
              type="number" 
              className="form-input"
              placeholder="0"
              style={{ maxWidth: '200px' }}
              value={newMilestone.budget}
              onChange={(e) => setNewMilestone({ ...newMilestone, budget: e.target.value })}
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              The amount that can be invoiced when this milestone is completed (not a budget for doing the work)
            </p>
          </div>
          
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#eff6ff', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#1e40af'
          }}>
            <strong>Note:</strong> Milestone status and progress will be automatically calculated from associated deliverables.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} /> Add Milestone
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Project Milestones</h3>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actual Start</th>
              <th>Forecast End</th>
              <th title="Amount invoiced on completion">Billable</th>
              <th>Certificate</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No milestones found. Click "Add Milestone" to create one.
                </td>
              </tr>
            ) : (
              milestonesWithStatus.map(milestone => {
                const statusColors = getStatusColor(milestone.computedStatus);
                const cert = certificates[milestone.id];
                const deliverableCount = milestoneDeliverables[milestone.id]?.length || 0;
                
                return (
                  <tr key={milestone.id}>
                    <td>
                      <Link 
                        to={`/milestones/${milestone.id}`}
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '600',
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {milestone.milestone_ref}
                      </Link>
                    </td>
                    <td style={{ fontWeight: '500' }}>{milestone.name}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        fontWeight: '500'
                      }}>
                        {milestone.computedStatus}
                      </span>
                      {deliverableCount > 0 && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#64748b'
                        }}>
                          ({deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '80px', 
                          height: '8px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${milestone.computedProgress}%`, 
                            height: '100%', 
                            backgroundColor: milestone.computedStatus === 'Completed' ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          minWidth: '40px'
                        }}>
                          {milestone.computedProgress}%
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontStyle: 'italic'
                        }}>
                          (auto)
                        </span>
                      </div>
                    </td>
                    <td>
                      {(milestone.actual_start_date || milestone.start_date) 
                        ? new Date(milestone.actual_start_date || milestone.start_date).toLocaleDateString('en-GB') 
                        : '-'}
                    </td>
                    <td>
                      {(milestone.forecast_end_date || milestone.end_date) 
                        ? new Date(milestone.forecast_end_date || milestone.end_date).toLocaleDateString('en-GB') 
                        : '-'}
                    </td>
                    <td title="Invoiced on completion">£{(milestone.budget || 0).toLocaleString()}</td>
                    <td>
                      {milestone.computedStatus === 'Completed' ? (
                        cert ? (
                          <button
                            onClick={() => openCertificateModal(milestone)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: getCertificateStatusColor(cert.status).bg,
                              color: getCertificateStatusColor(cert.status).color,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            <FileCheck size={14} />
                            {cert.status === 'Signed' ? 'Signed' : 
                             cert.status === 'Pending Customer Signature' ? 'Awaiting Customer' :
                             cert.status === 'Pending Supplier Signature' ? 'Awaiting Supplier' : 'View'}
                          </button>
                        ) : (
                          canEdit && (
                            <button
                              onClick={() => generateCertificate(milestone)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#fef3c7',
                                color: '#d97706',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                              }}
                            >
                              <Award size={14} />
                              Generate
                            </button>
                          )
                        )
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Not ready
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            onClick={() => openEditModal(milestone)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#eff6ff',
                              color: '#3b82f6',
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
                          <button 
                            onClick={() => handleDeleteClick(milestone)}
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
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
              <Edit2 size={20} />
              Edit Milestone - {editForm.milestone_ref}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Reference *</label>
                <input
                  type="text"
                  value={editForm.milestone_ref}
                  onChange={(e) => setEditForm({ ...editForm, milestone_ref: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>

            {/* Baseline Dates */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Baseline Schedule (Original Plan)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Baseline Start</label>
                  <input
                    type="date"
                    value={editForm.baseline_start_date}
                    onChange={(e) => setEditForm({ ...editForm, baseline_start_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Baseline End</label>
                  <input
                    type="date"
                    value={editForm.baseline_end_date}
                    onChange={(e) => setEditForm({ ...editForm, baseline_end_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  />
                </div>
              </div>
            </div>

            {/* Actual/Forecast Dates */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Current Schedule</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Actual Start</label>
                  <input
                    type="date"
                    value={editForm.actual_start_date}
                    onChange={(e) => setEditForm({ ...editForm, actual_start_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Forecast End</label>
                  <input
                    type="date"
                    value={editForm.forecast_end_date}
                    onChange={(e) => setEditForm({ ...editForm, forecast_end_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Billable Amount (£)</label>
              <input
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                style={{ width: '200px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Amount invoiced when milestone is completed (not a budget for doing the work)
              </p>
            </div>

            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#eff6ff', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#1e40af'
            }}>
              <strong>💡 Note:</strong> Status and progress are <strong>automatically calculated</strong> from associated deliverables and cannot be manually edited.
              <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0.5rem' }}>
                <li><strong>Not Started</strong> — No deliverables have begun</li>
                <li><strong>In Progress</strong> — At least one deliverable is in progress</li>
                <li><strong>Completed</strong> — All deliverables are delivered</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Certificate Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #10b981', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={32} style={{ color: '#10b981' }} />
                <h2 style={{ margin: 0, color: '#166534' }}>Milestone Acceptance Certificate</h2>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Certificate No: <strong>{selectedCertificate.certificate_number}</strong>
              </div>
              <div style={{ 
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: getCertificateStatusColor(selectedCertificate.status).bg,
                color: getCertificateStatusColor(selectedCertificate.status).color
              }}>
                {selectedCertificate.status}
              </div>
            </div>

            {/* Milestone Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Milestone Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reference</div>
                  <div style={{ fontWeight: '600' }}>{selectedCertificate.milestone_ref}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Name</div>
                  <div style={{ fontWeight: '600' }}>{selectedCertificate.milestone_name}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Payment Milestone Associated</div>
                  <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#10b981' }}>
                    £{(selectedCertificate.payment_milestone_value || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivered Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Deliverables Accepted</h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ref</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCertificate.deliverables_snapshot || []).map((d, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: '600' }}>{d.deliverable_ref}</td>
                        <td style={{ padding: '0.5rem' }}>{d.name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a' }}>
                            <CheckCircle size={14} /> Accepted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Signatures</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Supplier PM Signature */}
                <div style={{ 
                  padding: '1rem', 
                  border: '2px solid', 
                  borderColor: selectedCertificate.supplier_pm_signed_at ? '#10b981' : '#e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: selectedCertificate.supplier_pm_signed_at ? '#f0fdf4' : '#f8fafc'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Supplier PM</div>
                  {selectedCertificate.supplier_pm_signed_at ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#166534' }}>
                        <PenTool size={16} />
                        {selectedCertificate.supplier_pm_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {new Date(selectedCertificate.supplier_pm_signed_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                  ) : (
                    canSignSupplier && selectedCertificate.status !== 'Signed' ? (
                      <button
                        onClick={() => signCertificate('supplier')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '500'
                        }}
                      >
                        <PenTool size={16} /> Sign as Supplier PM
                      </button>
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Awaiting signature</div>
                    )
                  )}
                </div>

                {/* Customer PM Signature */}
                <div style={{ 
                  padding: '1rem', 
                  border: '2px solid', 
                  borderColor: selectedCertificate.customer_pm_signed_at ? '#10b981' : '#e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: selectedCertificate.customer_pm_signed_at ? '#f0fdf4' : '#f8fafc'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Customer PM</div>
                  {selectedCertificate.customer_pm_signed_at ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#166534' }}>
                        <PenTool size={16} />
                        {selectedCertificate.customer_pm_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {new Date(selectedCertificate.customer_pm_signed_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                  ) : (
                    canSignCustomer && selectedCertificate.status !== 'Signed' ? (
                      <button
                        onClick={() => signCertificate('customer')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '500'
                        }}
                      >
                        <PenTool size={16} /> Sign as Customer PM
                      </button>
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Awaiting signature</div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Generated Info */}
            <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' }}>
              Generated: {new Date(selectedCertificate.generated_at).toLocaleString('en-GB')}
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCertificateModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 How Milestone Status & Progress Work</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>Milestone <strong>status</strong> and <strong>progress</strong> are automatically calculated from deliverables</li>
          <li><strong>Not Started:</strong> All deliverables are "Not Started" (or no deliverables exist)</li>
          <li><strong>In Progress:</strong> At least one deliverable has begun work</li>
          <li><strong>Completed:</strong> All deliverables have been delivered</li>
          <li>Click milestone reference to view and manage deliverables</li>
          <li>Progress = average of all deliverable progress percentages</li>
          <li>Timesheets continue to be logged against milestones (not individual deliverables)</li>
          <li>Payment aligned to milestone completion per SOW requirements</li>
        </ul>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, milestone: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Milestone?"
        message={deleteDialog.milestone ? `This will permanently delete "${deleteDialog.milestone.milestone_ref}: ${deleteDialog.milestone.name}" and all associated deliverables. This action cannot be undone.` : ''}
        confirmText="Delete Milestone"
        cancelText="Cancel"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
