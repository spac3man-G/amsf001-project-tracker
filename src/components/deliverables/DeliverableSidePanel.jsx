/**
 * DeliverableSidePanel - Microsoft Planner-style slide-out panel
 *
 * A side panel that slides in from the right, allowing inline editing
 * of deliverable details without leaving the list view. Key features:
 *
 * - Inline editing of all fields (click to edit, auto-save)
 * - Always-visible task checklist with progress tracking
 * - Auto-calculated progress from task completion
 * - Quick actions for workflow transitions
 * - Keeps list view visible for easy navigation
 *
 * @version 1.0 - Prototype for UX testing
 * @created 16 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Package, Calendar, FileText, Clock, Target, Award,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle,
  Send, ThumbsUp, RotateCcw, Trash2, ExternalLink
} from 'lucide-react';

import InlineEditField from '../common/InlineEditField';
import InlineChecklist from '../common/InlineChecklist';
import { DualSignature, SignatureComplete } from '../common/SignatureBox';

import {
  DELIVERABLE_STATUS,
  SIGN_OFF_STATUS,
  getStatusConfig,
  isDeliverableComplete,
  calculateSignOffStatus
} from '../../lib/deliverableCalculations';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { useDeliverablePermissions } from '../../hooks/useDeliverablePermissions';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { deliverablesService, planItemsService } from '../../services';

import './DeliverableSidePanel.css';

export default function DeliverableSidePanel({
  isOpen,
  deliverable,
  milestones = [],
  kpis = [],
  qualityStandards = [],
  onClose,
  onUpdate,
  onStatusChange,
  onDelete,
  onSign,
  onOpenModal, // Opens the full modal view
}) {
  const { projectId } = useProject();
  const { user } = useAuth();
  const permissions = useDeliverablePermissions(deliverable);

  // Local state for tasks (unified - from plan_items)
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'

  // Collapsible sections
  const [sectionsExpanded, setSectionsExpanded] = useState({
    details: true,
    tasks: true, // Unified tasks section
    kpis: false,
    qualityStandards: false,
    signOff: true,
  });

  // Fetch tasks from plan_items (unified source)
  useEffect(() => {
    if (deliverable?.id && projectId) {
      console.log('[DeliverableSidePanel] Fetching unified tasks for:', deliverable.deliverable_ref, deliverable.name);
      planItemsService.getTasksForDeliverable(deliverable.id, projectId, deliverable.name)
        .then(fetchedTasks => {
          console.log('[DeliverableSidePanel] Tasks found:', fetchedTasks?.length || 0);
          // Transform plan_items tasks to checklist format
          const transformedTasks = (fetchedTasks || []).map(t => {
            const { owner, comment } = planItemsService.parseTaskDescription(t.description);
            return {
              id: t.id,
              name: t.name,
              owner: owner,
              comment: comment,
              status: t.status,
              is_complete: t.status === 'completed',
              wbs: t.wbs,
              progress: t.progress
            };
          });
          setTasks(transformedTasks);
        })
        .catch(err => {
          console.error('[DeliverableSidePanel] Error fetching tasks:', err);
          setTasks([]);
        });
    }
  }, [deliverable?.id, projectId, deliverable?.name]);

  // Calculate progress from tasks
  const sortedTasks = tasks.filter(t => !t.is_deleted).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const completedTaskCount = sortedTasks.filter(t => t.is_complete).length;
  const calculatedProgress = sortedTasks.length > 0
    ? Math.round((completedTaskCount / sortedTasks.length) * 100)
    : deliverable?.progress || 0;

  // Show save indicator
  const showSaveStatus = useCallback((status) => {
    setSaveStatus(status);
    if (status === 'saved') {
      setTimeout(() => setSaveStatus(null), 2000);
    }
  }, []);

  // Handle field updates
  const handleFieldUpdate = async (field, value) => {
    if (!deliverable?.id) return;

    setSaving(true);
    showSaveStatus('saving');

    try {
      await deliverablesService.update(deliverable.id, { [field]: value });
      showSaveStatus('saved');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating field:', error);
      showSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Task handlers (unified - using plan_items)
  const handleTaskToggle = async (taskId, isComplete) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_complete: isComplete, status: isComplete ? 'completed' : 'not_started' } : t));

    try {
      await planItemsService.toggleTaskComplete(taskId, isComplete);
      // Update progress if auto-calculate enabled
      const newTasks = tasks.map(t => t.id === taskId ? { ...t, is_complete: isComplete } : t);
      const completed = newTasks.filter(t => t.is_complete && !t.is_deleted).length;
      const total = newTasks.filter(t => !t.is_deleted).length;
      const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Auto-update progress on parent deliverable
      if (newProgress !== deliverable?.progress) {
        await deliverablesService.update(deliverable.id, { progress: newProgress });
        onUpdate?.();
      }
    } catch (error) {
      console.error('[DeliverableSidePanel] Error toggling task:', error);
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_complete: !isComplete, status: !isComplete ? 'completed' : 'not_started' } : t));
    }
  };

  const handleTaskCreate = async (taskData) => {
    try {
      // Create task in plan_items (auto-creates structure if needed)
      await planItemsService.createTaskForDeliverable(projectId, deliverable.id, {
        name: taskData.name,
        owner: taskData.owner || '',
        comment: taskData.comment || '',
        status: taskData.status || 'not_started'
      });
      // Refresh tasks from plan_items
      const fetchedTasks = await planItemsService.getTasksForDeliverable(deliverable.id, projectId, deliverable.name);
      const transformedTasks = (fetchedTasks || []).map(t => {
        const { owner, comment } = planItemsService.parseTaskDescription(t.description);
        return {
          id: t.id,
          name: t.name,
          owner: owner,
          comment: comment,
          status: t.status,
          is_complete: t.status === 'completed',
          wbs: t.wbs,
          progress: t.progress
        };
      });
      setTasks(transformedTasks);
      onUpdate?.();
    } catch (error) {
      console.error('[DeliverableSidePanel] Error creating task:', error);
      throw error;
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await planItemsService.updateTaskSimple(taskId, {
        name: updates.name,
        owner: updates.owner,
        comment: updates.comment,
        status: updates.status
      });
      // Update local state
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            ...updates,
            is_complete: updates.status === 'completed' ? true : (updates.status === 'not_started' ? false : t.is_complete)
          };
        }
        return t;
      }));
    } catch (error) {
      console.error('[DeliverableSidePanel] Error updating task:', error);
      throw error;
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await planItemsService.deleteTaskSimple(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      onUpdate?.();
    } catch (error) {
      console.error('[DeliverableSidePanel] Error deleting task:', error);
      throw error;
    }
  };

  // Sign-off handler
  const handleSign = async (signerRole) => {
    if (!onSign) return;
    setSaving(true);
    try {
      await onSign(deliverable.id, signerRole);
    } finally {
      setSaving(false);
    }
  };

  // Toggle section
  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  console.log('DeliverableSidePanel render:', { isOpen, deliverable: deliverable?.deliverable_ref });
  if (!isOpen || !deliverable) return null;
  console.log('DeliverableSidePanel - showing panel');

  // Status and permissions
  const statusConfig = getStatusConfig(deliverable.status);
  const StatusIcon = statusConfig.icon;
  const isComplete = isDeliverableComplete(deliverable);
  const signOffStatus = calculateSignOffStatus(deliverable);
  const hasAnySignature = deliverable.supplier_pm_signed_at || deliverable.customer_pm_signed_at;

  // Related data
  const milestone = milestones.find(m => m.id === deliverable.milestone_id);
  const dueDate = milestone?.forecast_end_date || milestone?.end_date;
  const linkedKPIs = deliverable.deliverable_kpis || [];
  const linkedQS = deliverable.deliverable_quality_standards || [];

  // Permission checks - Contributor, Supplier PM, Customer PM can edit; Viewers are read-only
  const canEdit = permissions.isSupplierPM || permissions.isAdmin || permissions.isContributor || permissions.isCustomerPM;
  const canEditName = canEdit;
  const canEditDescription = canEdit;
  const canEditMilestone = canEdit;
  const canEditProgress = canEdit;
  const canEditTasks = canEdit;

  // Workflow actions
  const showSubmitForReview = permissions.canSubmit;
  const showReviewActions = permissions.canReview;
  const showSignOffSection = deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE || hasAnySignature || isComplete;

  // Milestone options for select
  const milestoneOptions = milestones.map(m => ({
    value: m.id,
    label: `${m.milestone_ref} - ${m.name}`
  }));

  return (
    <div className={`deliverable-side-panel ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="side-panel-header">
        <div className="side-panel-header-content">
          <div
            className="side-panel-status-icon"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
          >
            <Package size={18} />
          </div>
          <div className="side-panel-titles">
            <span className="side-panel-ref">{deliverable.deliverable_ref}</span>
            <InlineEditField
              value={deliverable.name}
              onSave={(value) => handleFieldUpdate('name', value)}
              placeholder="Deliverable name..."
              disabled={!canEditName || isComplete}
              className="side-panel-name-field"
            />
          </div>
        </div>

        <div className="side-panel-header-actions">
          {/* Save status indicator */}
          {saveStatus && (
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && <><CheckCircle size={14} /> Saved</>}
              {saveStatus === 'error' && <><AlertCircle size={14} /> Error</>}
            </span>
          )}

          {/* Status badge */}
          <span
            className="side-panel-status-badge"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
          >
            <StatusIcon size={14} />
            {deliverable.status}
          </span>

          {/* Open in modal link */}
          <button
            type="button"
            className="side-panel-expand-btn"
            onClick={() => {
              if (onOpenModal) {
                onOpenModal(deliverable);
                onClose();
              }
            }}
            title="Open full view"
          >
            <ExternalLink size={16} />
          </button>

          <button
            type="button"
            className="side-panel-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="side-panel-content">
        {/* Key Details Section */}
        <div className="side-panel-section">
          <button
            type="button"
            className="side-panel-section-header"
            onClick={() => toggleSection('details')}
          >
            {sectionsExpanded.details ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Details</span>
          </button>

          {sectionsExpanded.details && (
            <div className="side-panel-section-content">
              {/* Milestone */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <FileText size={16} />
                </div>
                <InlineEditField
                  value={deliverable.milestone_id}
                  onSave={(value) => handleFieldUpdate('milestone_id', value || null)}
                  type="select"
                  options={milestoneOptions}
                  placeholder="Select milestone..."
                  disabled={!canEditMilestone || isComplete}
                  label="Milestone"
                />
              </div>

              {/* Due Date (read-only, from milestone) */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <Calendar size={16} />
                </div>
                <div className="side-panel-field-readonly">
                  <label>Due Date</label>
                  <span>{dueDate ? formatDate(dueDate) : 'Set by milestone'}</span>
                </div>
              </div>

              {/* Progress - Editable slider */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <Clock size={16} />
                </div>
                <div className="side-panel-progress">
                  <label>Progress</label>
                  <div className="side-panel-progress-display">
                    {canEditProgress && !isComplete ? (
                      <>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={deliverable.progress || 0}
                          onChange={(e) => handleFieldUpdate('progress', parseInt(e.target.value))}
                          className="side-panel-progress-slider"
                        />
                        <span className="side-panel-progress-value">{deliverable.progress || 0}%</span>
                      </>
                    ) : (
                      <>
                        <div className="side-panel-progress-bar">
                          <div
                            className={`side-panel-progress-fill ${isComplete ? 'complete' : ''}`}
                            style={{ width: `${deliverable.progress || 0}%` }}
                          />
                        </div>
                        <span className="side-panel-progress-value">{deliverable.progress || 0}%</span>
                      </>
                    )}
                  </div>
                  {sortedTasks.length > 0 && (
                    <span className="side-panel-progress-hint">
                      {completedTaskCount}/{sortedTasks.length} checklist items complete
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="side-panel-field side-panel-field-full">
                <InlineEditField
                  value={deliverable.description}
                  onSave={(value) => handleFieldUpdate('description', value)}
                  type="textarea"
                  placeholder="Add a description..."
                  disabled={!canEditDescription || isComplete}
                  label="Description"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tasks Section (unified - from plan_items) */}
        <div className="side-panel-section">
          <button
            type="button"
            className="side-panel-section-header"
            onClick={() => toggleSection('tasks')}
          >
            {sectionsExpanded.tasks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Tasks</span>
            {sortedTasks.length > 0 && (
              <span className="side-panel-section-count">
                {completedTaskCount}/{sortedTasks.length}
              </span>
            )}
          </button>

          {sectionsExpanded.tasks && (
            <div className="side-panel-section-content">
              <InlineChecklist
                items={tasks}
                onToggle={handleTaskToggle}
                onCreate={handleTaskCreate}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                disabled={!canEditTasks || isComplete}
                title=""
                showProgress={false}
                showDetails={true}
                placeholder="Add a task..."
              />
              {tasks.length > 0 && (
                <Link to="/planner" className="side-panel-planner-link">
                  View in Planner <ExternalLink size={12} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Linked KPIs */}
        {linkedKPIs.length > 0 && (
          <div className="side-panel-section">
            <button
              type="button"
              className="side-panel-section-header"
              onClick={() => toggleSection('kpis')}
            >
              {sectionsExpanded.kpis ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Target size={14} />
              <span>Linked KPIs</span>
              <span className="side-panel-section-count">{linkedKPIs.length}</span>
            </button>

            {sectionsExpanded.kpis && (
              <div className="side-panel-section-content">
                <div className="side-panel-linked-items">
                  {linkedKPIs.map(dk => (
                    <span key={dk.kpi_id} className="side-panel-linked-badge kpi">
                      {dk.kpis?.kpi_ref} - {dk.kpis?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Linked Quality Standards */}
        {linkedQS.length > 0 && (
          <div className="side-panel-section">
            <button
              type="button"
              className="side-panel-section-header"
              onClick={() => toggleSection('qualityStandards')}
            >
              {sectionsExpanded.qualityStandards ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Award size={14} />
              <span>Quality Standards</span>
              <span className="side-panel-section-count">{linkedQS.length}</span>
            </button>

            {sectionsExpanded.qualityStandards && (
              <div className="side-panel-section-content">
                <div className="side-panel-linked-items">
                  {linkedQS.map(dqs => (
                    <span key={dqs.quality_standard_id} className="side-panel-linked-badge qs">
                      {dqs.quality_standards?.qs_ref} - {dqs.quality_standards?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign-off Section */}
        {showSignOffSection && (
          <div className="side-panel-section">
            <button
              type="button"
              className="side-panel-section-header"
              onClick={() => toggleSection('signOff')}
            >
              {sectionsExpanded.signOff ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Sign-off</span>
              {isComplete && signOffStatus === SIGN_OFF_STATUS.SIGNED && (
                <CheckCircle size={14} className="section-complete-icon" />
              )}
            </button>

            {sectionsExpanded.signOff && (
              <div className="side-panel-section-content">
                {isComplete && signOffStatus === SIGN_OFF_STATUS.SIGNED ? (
                  <SignatureComplete message="Deliverable accepted and delivered" />
                ) : (
                  <DualSignature
                    supplier={{
                      signedBy: deliverable.supplier_pm_name,
                      signedAt: deliverable.supplier_pm_signed_at,
                      canSign: permissions.canSignAsSupplier && onSign,
                      onSign: () => handleSign('supplier')
                    }}
                    customer={{
                      signedBy: deliverable.customer_pm_name,
                      signedAt: deliverable.customer_pm_signed_at,
                      canSign: permissions.canSignAsCustomer && onSign,
                      onSign: () => handleSign('customer')
                    }}
                    saving={saving}
                    supplierButtonText="Sign as Supplier PM"
                    customerButtonText="Sign as Customer PM"
                    compact={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="side-panel-timestamps">
          <span>Created: {formatDateTime(deliverable.created_at)}</span>
          {deliverable.updated_at && deliverable.updated_at !== deliverable.created_at && (
            <span>Updated: {formatDateTime(deliverable.updated_at)}</span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="side-panel-footer">
        {/* Delete button */}
        {permissions.canDelete && !isComplete && (
          <button
            type="button"
            className="side-panel-btn danger"
            onClick={() => {
              onDelete?.(deliverable);
              onClose();
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        )}

        <div className="side-panel-footer-right">
          {/* Workflow actions */}
          {showSubmitForReview && (
            <button
              type="button"
              className="side-panel-btn secondary"
              onClick={() => {
                onStatusChange?.(deliverable, DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW);
              }}
            >
              <Send size={16} /> Submit for Review
            </button>
          )}

          {showReviewActions && (
            <>
              <button
                type="button"
                className="side-panel-btn danger"
                onClick={() => {
                  onStatusChange?.(deliverable, DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK);
                }}
              >
                <RotateCcw size={16} /> Return
              </button>
              <button
                type="button"
                className="side-panel-btn success"
                onClick={() => {
                  onStatusChange?.(deliverable, DELIVERABLE_STATUS.REVIEW_COMPLETE);
                }}
              >
                <ThumbsUp size={16} /> Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
