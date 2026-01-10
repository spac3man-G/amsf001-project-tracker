/**
 * Workflow Dashboard
 *
 * Manages post-evaluation procurement workflows from vendor selection to contract.
 * Part of Evaluator Product Roadmap v1.0.x - Feature 0.10
 *
 * @version 1.0
 * @created 09 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  FileText,
  Target,
  ArrowRight,
  Circle,
  SkipForward,
  X,
  Save,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  procurementWorkflowService,
  WORKFLOW_STATUS,
  WORKFLOW_STATUS_CONFIG,
  STAGE_STATUS,
  STAGE_STATUS_CONFIG,
  MILESTONE_STATUS,
  PROCUREMENT_TYPES,
  PROCUREMENT_TYPE_CONFIG,
} from '../../../services/evaluator/procurementWorkflow.service';
import { supabase } from '../../../lib/supabase';
import './WorkflowDashboard.css';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
};

const getStatusIcon = (status, config) => {
  const icons = {
    'circle': Circle,
    'play': Play,
    'pause': Pause,
    'alert-circle': AlertCircle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'loader': RefreshCw,
    'skip-forward': SkipForward,
  };
  return icons[config?.icon] || Circle;
};

// ============================================================================
// STAT CARD
// ============================================================================

const StatCard = ({ icon: Icon, label, value, subValue, color = 'primary' }) => (
  <div className={`workflow-stat-card workflow-stat-card--${color}`}>
    <div className="workflow-stat-card__icon">
      <Icon size={20} />
    </div>
    <div className="workflow-stat-card__content">
      <span className="workflow-stat-card__label">{label}</span>
      <span className="workflow-stat-card__value">{value}</span>
      {subValue && <span className="workflow-stat-card__subvalue">{subValue}</span>}
    </div>
  </div>
);

// ============================================================================
// WORKFLOW CARD
// ============================================================================

const WorkflowCard = ({ workflow, onSelect, onStart, onComplete, onCancel }) => {
  const statusConfig = WORKFLOW_STATUS_CONFIG[workflow.status];
  const StatusIcon = getStatusIcon(workflow.status, statusConfig);
  const daysRemaining = getDaysRemaining(workflow.planned_end_date);

  const isOverdue = daysRemaining !== null && daysRemaining < 0 &&
    workflow.status !== WORKFLOW_STATUS.COMPLETED &&
    workflow.status !== WORKFLOW_STATUS.CANCELLED;

  const isAtRisk = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 &&
    workflow.progress_percent < 80 &&
    workflow.status === WORKFLOW_STATUS.IN_PROGRESS;

  return (
    <div
      className={`workflow-card workflow-card--${workflow.status} ${isOverdue ? 'workflow-card--overdue' : ''} ${isAtRisk ? 'workflow-card--at-risk' : ''}`}
      onClick={() => onSelect(workflow)}
    >
      <div className="workflow-card__header">
        <div className="workflow-card__status">
          <StatusIcon
            size={16}
            style={{ color: statusConfig?.color }}
          />
          <span style={{ color: statusConfig?.color }}>{statusConfig?.label}</span>
        </div>
        {isOverdue && (
          <span className="workflow-card__alert workflow-card__alert--overdue">
            <AlertTriangle size={14} />
            Overdue
          </span>
        )}
        {isAtRisk && !isOverdue && (
          <span className="workflow-card__alert workflow-card__alert--at-risk">
            <AlertCircle size={14} />
            At Risk
          </span>
        )}
      </div>

      <div className="workflow-card__body">
        <h3>{workflow.workflow_name}</h3>
        <p className="workflow-card__vendor">{workflow.vendor?.vendor_name}</p>

        <div className="workflow-card__progress">
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${workflow.progress_percent || 0}%` }}
            />
          </div>
          <span className="progress-text">
            {workflow.completed_stages || 0}/{workflow.total_stages || 0} stages ({Math.round(workflow.progress_percent || 0)}%)
          </span>
        </div>

        <div className="workflow-card__meta">
          {workflow.planned_end_date && (
            <span className="meta-item">
              <Calendar size={14} />
              {formatDateShort(workflow.planned_end_date)}
              {daysRemaining !== null && (
                <span className={`days-remaining ${daysRemaining < 0 ? 'overdue' : daysRemaining <= 7 ? 'warning' : ''}`}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)}d overdue`
                    : daysRemaining === 0
                      ? 'Due today'
                      : `${daysRemaining}d left`
                  }
                </span>
              )}
            </span>
          )}
          {workflow.workflow_owner_name && (
            <span className="meta-item">
              <Users size={14} />
              {workflow.workflow_owner_name}
            </span>
          )}
        </div>
      </div>

      <div className="workflow-card__actions" onClick={e => e.stopPropagation()}>
        {workflow.status === WORKFLOW_STATUS.NOT_STARTED && (
          <button className="btn btn--sm btn--primary" onClick={() => onStart(workflow.id)}>
            <Play size={14} />
            Start
          </button>
        )}
        {workflow.status === WORKFLOW_STATUS.IN_PROGRESS && workflow.progress_percent >= 100 && (
          <button className="btn btn--sm btn--success" onClick={() => onComplete(workflow.id)}>
            <CheckCircle size={14} />
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// WORKFLOW DETAIL VIEW
// ============================================================================

const WorkflowDetailView = ({ workflow, onClose, onRefresh }) => {
  const [activeLog, setActiveLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivityLog();
  }, [workflow.id]);

  const loadActivityLog = async () => {
    try {
      const log = await procurementWorkflowService.getActivityLog(workflow.id);
      setActiveLog(log);
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const handleStageAction = async (stageId, action) => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      switch (action) {
        case 'start':
          await procurementWorkflowService.startStage(stageId, userId);
          break;
        case 'complete':
          await procurementWorkflowService.completeStage(stageId, userId);
          break;
        case 'skip':
          await procurementWorkflowService.skipStage(stageId, userId);
          break;
        case 'block':
          const reason = window.prompt('Enter blocking reason:');
          if (reason) {
            await procurementWorkflowService.blockStage(stageId, reason, userId);
          }
          break;
        case 'unblock':
          await procurementWorkflowService.unblockStage(stageId, userId);
          break;
      }
      onRefresh();
      loadActivityLog();
    } catch (error) {
      console.error('Error updating stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneAction = async (milestoneId, action) => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      switch (action) {
        case 'complete':
          await procurementWorkflowService.completeMilestone(milestoneId, userId);
          break;
        case 'skip':
          await procurementWorkflowService.skipMilestone(milestoneId, userId);
          break;
      }
      onRefresh();
      loadActivityLog();
    } catch (error) {
      console.error('Error updating milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = WORKFLOW_STATUS_CONFIG[workflow.status];

  return (
    <div className="workflow-detail">
      <div className="workflow-detail__header">
        <button className="btn-back" onClick={onClose}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          Back
        </button>
        <div className="workflow-detail__title">
          <h2>{workflow.workflow_name}</h2>
          <span className="vendor-name">{workflow.vendor?.vendor_name}</span>
        </div>
        <div
          className="workflow-detail__status"
          style={{ backgroundColor: statusConfig?.color + '20', color: statusConfig?.color }}
        >
          {statusConfig?.label}
        </div>
      </div>

      <div className="workflow-detail__summary">
        <div className="summary-item">
          <span className="label">Progress</span>
          <div className="progress-bar progress-bar--large">
            <div
              className="progress-bar__fill"
              style={{ width: `${workflow.progress_percent || 0}%` }}
            />
          </div>
          <span className="value">{Math.round(workflow.progress_percent || 0)}%</span>
        </div>
        <div className="summary-item">
          <span className="label">Planned</span>
          <span className="value">{formatDate(workflow.planned_start_date)} - {formatDate(workflow.planned_end_date)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Owner</span>
          <span className="value">{workflow.workflow_owner_name || 'Unassigned'}</span>
        </div>
      </div>

      <div className="workflow-detail__content">
        <div className="workflow-timeline">
          <h3>Workflow Stages</h3>
          <div className="stages-list">
            {workflow.stages?.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={index}
                isLast={index === workflow.stages.length - 1}
                onAction={handleStageAction}
                onMilestoneAction={handleMilestoneAction}
                loading={loading}
              />
            ))}
          </div>
        </div>

        <div className="workflow-activity">
          <h3>Activity Log</h3>
          <div className="activity-list">
            {activeLog.length === 0 ? (
              <p className="no-activity">No activity yet</p>
            ) : (
              activeLog.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-item__icon">
                    <Circle size={8} />
                  </div>
                  <div className="activity-item__content">
                    <p>{activity.activity_description}</p>
                    <span className="activity-time">
                      {new Date(activity.performed_at).toLocaleString()}
                      {activity.performed_by_name && ` by ${activity.performed_by_name}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STAGE CARD
// ============================================================================

const StageCard = ({ stage, index, isLast, onAction, onMilestoneAction, loading }) => {
  const [expanded, setExpanded] = useState(stage.status === STAGE_STATUS.IN_PROGRESS);
  const statusConfig = STAGE_STATUS_CONFIG[stage.status];
  const StatusIcon = getStatusIcon(stage.status, statusConfig);

  const completedMilestones = stage.milestones?.filter(m => m.status === MILESTONE_STATUS.COMPLETED).length || 0;
  const totalMilestones = stage.milestones?.filter(m => m.status !== MILESTONE_STATUS.SKIPPED).length || 0;

  return (
    <div className={`stage-card stage-card--${stage.status}`}>
      <div className="stage-card__connector">
        <div className={`connector-dot connector-dot--${stage.status}`}>
          <StatusIcon size={14} />
        </div>
        {!isLast && <div className="connector-line" />}
      </div>

      <div className="stage-card__content">
        <div
          className="stage-card__header"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="stage-header__left">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="stage-order">Stage {index + 1}</span>
            <h4>{stage.stage_name}</h4>
          </div>
          <div className="stage-header__right">
            {stage.target_days && (
              <span className="target-days">{stage.target_days} days</span>
            )}
            <span
              className="stage-status"
              style={{ backgroundColor: statusConfig?.color + '20', color: statusConfig?.color }}
            >
              {statusConfig?.label}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="stage-card__body">
            {stage.stage_description && (
              <p className="stage-description">{stage.stage_description}</p>
            )}

            <div className="stage-dates">
              {stage.planned_start_date && (
                <span>
                  <Calendar size={12} />
                  {formatDateShort(stage.planned_start_date)} - {formatDateShort(stage.planned_end_date)}
                </span>
              )}
              {stage.owner_name && (
                <span>
                  <Users size={12} />
                  {stage.owner_name}
                </span>
              )}
            </div>

            <div className="milestones-section">
              <div className="milestones-header">
                <span>Milestones ({completedMilestones}/{totalMilestones})</span>
              </div>
              <div className="milestones-list">
                {stage.milestones?.map(milestone => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    stageStatus={stage.status}
                    onAction={onMilestoneAction}
                    loading={loading}
                  />
                ))}
              </div>
            </div>

            <div className="stage-actions">
              {stage.status === STAGE_STATUS.PENDING && (
                <>
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => onAction(stage.id, 'start')}
                    disabled={loading}
                  >
                    <Play size={14} />
                    Start Stage
                  </button>
                  <button
                    className="btn btn--sm btn--secondary"
                    onClick={() => onAction(stage.id, 'skip')}
                    disabled={loading}
                  >
                    <SkipForward size={14} />
                    Skip
                  </button>
                </>
              )}
              {stage.status === STAGE_STATUS.IN_PROGRESS && (
                <>
                  <button
                    className="btn btn--sm btn--success"
                    onClick={() => onAction(stage.id, 'complete')}
                    disabled={loading}
                  >
                    <CheckCircle size={14} />
                    Complete Stage
                  </button>
                  <button
                    className="btn btn--sm btn--warning"
                    onClick={() => onAction(stage.id, 'block')}
                    disabled={loading}
                  >
                    <AlertCircle size={14} />
                    Block
                  </button>
                </>
              )}
              {stage.status === STAGE_STATUS.BLOCKED && (
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => onAction(stage.id, 'unblock')}
                  disabled={loading}
                >
                  <Play size={14} />
                  Unblock
                </button>
              )}
            </div>

            {stage.blocked_reason && (
              <div className="stage-blocked-reason">
                <AlertCircle size={14} />
                <span>Blocked: {stage.blocked_reason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MILESTONE ITEM
// ============================================================================

const MilestoneItem = ({ milestone, stageStatus, onAction, loading }) => {
  const isCompletable = stageStatus === STAGE_STATUS.IN_PROGRESS &&
    milestone.status !== MILESTONE_STATUS.COMPLETED &&
    milestone.status !== MILESTONE_STATUS.SKIPPED;

  return (
    <div className={`milestone-item milestone-item--${milestone.status}`}>
      <div className="milestone-item__checkbox">
        {milestone.status === MILESTONE_STATUS.COMPLETED ? (
          <CheckCircle size={16} className="text-success" />
        ) : milestone.status === MILESTONE_STATUS.SKIPPED ? (
          <SkipForward size={16} className="text-muted" />
        ) : (
          <Circle size={16} />
        )}
      </div>
      <span className="milestone-item__name">{milestone.milestone_name}</span>
      {isCompletable && (
        <div className="milestone-item__actions">
          <button
            className="btn-icon btn-icon--sm"
            onClick={() => onAction(milestone.id, 'complete')}
            disabled={loading}
            title="Complete"
          >
            <CheckCircle size={14} />
          </button>
          <button
            className="btn-icon btn-icon--sm"
            onClick={() => onAction(milestone.id, 'skip')}
            disabled={loading}
            title="Skip"
          >
            <SkipForward size={14} />
          </button>
        </div>
      )}
      {milestone.completed_at && (
        <span className="milestone-item__date">
          {formatDateShort(milestone.completed_at)}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// CREATE WORKFLOW MODAL
// ============================================================================

const CreateWorkflowModal = ({ evaluationProjectId, vendors, onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    vendorId: '',
    workflowName: '',
    workflowDescription: '',
    plannedStartDate: new Date().toISOString().split('T')[0],
    ownerName: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await procurementWorkflowService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      workflowName: template.template_name,
      workflowDescription: template.template_description,
    }));
    setStep(2);
  };

  const handleCreate = async () => {
    if (!formData.vendorId) {
      alert('Please select a vendor');
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      await procurementWorkflowService.createWorkflowFromTemplate({
        evaluationProjectId,
        vendorId: formData.vendorId,
        templateId: selectedTemplate.id,
        workflowName: formData.workflowName,
        workflowDescription: formData.workflowDescription,
        plannedStartDate: formData.plannedStartDate,
        ownerName: formData.ownerName,
        createdBy: user?.user?.id,
      });

      onCreated();
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Error creating workflow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal workflow-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{step === 1 ? 'Select Workflow Template' : 'Configure Workflow'}</h3>
          <button className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          {step === 1 ? (
            <div className="template-selection">
              <p className="template-hint">Choose a template to get started quickly</p>
              <div className="templates-grid">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'template-card--selected' : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="template-card__header">
                      <span
                        className="template-type"
                        style={{ backgroundColor: PROCUREMENT_TYPE_CONFIG[template.procurement_type]?.color + '20' }}
                      >
                        {PROCUREMENT_TYPE_CONFIG[template.procurement_type]?.label}
                      </span>
                      {template.is_default && <span className="default-badge">Default</span>}
                    </div>
                    <h4>{template.template_name}</h4>
                    <p>{template.template_description}</p>
                    <div className="template-stages">
                      {(template.stages || []).length} stages
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="workflow-config">
              <div className="form-group">
                <label>Vendor *</label>
                <select
                  value={formData.vendorId}
                  onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendor_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Workflow Name</label>
                <input
                  type="text"
                  value={formData.workflowName}
                  onChange={e => setFormData({ ...formData, workflowName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.workflowDescription}
                  onChange={e => setFormData({ ...formData, workflowDescription: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Planned Start Date</label>
                  <input
                    type="date"
                    value={formData.plannedStartDate}
                    onChange={e => setFormData({ ...formData, plannedStartDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Owner</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Owner name"
                  />
                </div>
              </div>

              <div className="template-preview">
                <h4>Stages from template:</h4>
                <div className="preview-stages">
                  {(selectedTemplate?.stages || []).map((stage, i) => (
                    <div key={i} className="preview-stage">
                      <span className="stage-num">{i + 1}</span>
                      <span className="stage-name">{stage.name}</span>
                      <span className="stage-days">{stage.target_days}d</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          {step === 2 && (
            <button className="btn btn--secondary" onClick={() => setStep(1)}>
              Back
            </button>
          )}
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          {step === 2 && (
            <button className="btn btn--primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Workflow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const WorkflowDashboard = ({ evaluationProjectId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, vendorsResult] = await Promise.all([
        procurementWorkflowService.getDashboardData(evaluationProjectId),
        supabase
          .from('vendors')
          .select('id, vendor_name')
          .eq('evaluation_project_id', evaluationProjectId)
          .order('vendor_name'),
      ]);

      setDashboardData(data);
      setVendors(vendorsResult.data || []);
      setError(null);

      // Refresh selected workflow if exists
      if (selectedWorkflow) {
        const updated = data.workflows.find(w => w.id === selectedWorkflow.id);
        if (updated) {
          setSelectedWorkflow(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId, selectedWorkflow?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartWorkflow = async (workflowId) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      await procurementWorkflowService.startWorkflow(workflowId, user?.user?.id);
      fetchData();
    } catch (error) {
      console.error('Error starting workflow:', error);
    }
  };

  const handleCompleteWorkflow = async (workflowId) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      await procurementWorkflowService.completeWorkflow(workflowId, user?.user?.id);
      fetchData();
    } catch (error) {
      console.error('Error completing workflow:', error);
    }
  };

  const handleCancelWorkflow = async (workflowId) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason === null) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      await procurementWorkflowService.cancelWorkflow(workflowId, user?.user?.id, reason);
      fetchData();
    } catch (error) {
      console.error('Error cancelling workflow:', error);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="workflow-dashboard workflow-dashboard--loading">
        <RefreshCw className="spin" size={24} />
        <span>Loading workflows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflow-dashboard workflow-dashboard--error">
        <AlertTriangle size={24} />
        <span>Error loading data: {error}</span>
        <button className="btn btn--secondary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (selectedWorkflow) {
    return (
      <div className="workflow-dashboard">
        <WorkflowDetailView
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onRefresh={fetchData}
        />
      </div>
    );
  }

  const { workflows, stats, upcomingMilestones } = dashboardData || {};

  return (
    <div className="workflow-dashboard">
      <div className="workflow-dashboard__header">
        <div className="header-content">
          <h2>
            <GitBranch size={24} />
            Procurement Workflows
          </h2>
          <p>Track post-evaluation progress from vendor selection to contract</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      <div className="workflow-dashboard__stats">
        <StatCard
          icon={GitBranch}
          label="Active Workflows"
          value={stats?.byStatus?.[WORKFLOW_STATUS.IN_PROGRESS] || 0}
          subValue={`${stats?.total || 0} total`}
          color="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats?.overdue || 0}
          color={stats?.overdue > 0 ? 'danger' : 'success'}
        />
        <StatCard
          icon={AlertCircle}
          label="At Risk"
          value={stats?.atRisk || 0}
          color={stats?.atRisk > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed This Week"
          value={stats?.completedThisWeek || 0}
          color="success"
        />
      </div>

      <div className="workflow-dashboard__content">
        <div className="workflows-section">
          <h3>All Workflows</h3>
          {workflows?.length === 0 ? (
            <div className="empty-state">
              <GitBranch size={48} />
              <h4>No workflows yet</h4>
              <p>Create a workflow to track post-selection procurement progress</p>
              <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Create Workflow
              </button>
            </div>
          ) : (
            <div className="workflows-grid">
              {workflows?.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onSelect={setSelectedWorkflow}
                  onStart={handleStartWorkflow}
                  onComplete={handleCompleteWorkflow}
                  onCancel={handleCancelWorkflow}
                />
              ))}
            </div>
          )}
        </div>

        {upcomingMilestones?.length > 0 && (
          <div className="milestones-section">
            <h3>Upcoming Milestones</h3>
            <div className="upcoming-milestones">
              {upcomingMilestones.map((milestone, i) => (
                <div key={i} className="upcoming-milestone">
                  <Circle size={8} />
                  <div className="milestone-info">
                    <span className="milestone-name">{milestone.milestone_name}</span>
                    <span className="milestone-context">
                      {milestone.stageName} - {milestone.vendorName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWorkflowModal
          evaluationProjectId={evaluationProjectId}
          vendors={vendors}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default WorkflowDashboard;
