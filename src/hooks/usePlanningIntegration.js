/**
 * usePlanningIntegration Hook
 * 
 * Provides all the integration logic between Planner and Tracker including:
 * - Baseline protection checking
 * - Commit to Tracker functionality
 * - Visual indicator data enrichment
 * - Variation creation from changes
 * 
 * @module hooks/usePlanningIntegration
 * @version 1.0.0
 * @created 2026-01-05
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { planCommitService, mapPlanStatusToTracker } from '../services/planCommitService';

// Fields that are protected by baseline locking
const BASELINE_FIELDS = ['start_date', 'end_date', 'duration', 'cost', 'billable'];

/**
 * Check if a field is baseline-protected
 * @param {string} field - Field name to check
 * @returns {boolean}
 */
export function isBaselineField(field) {
  return BASELINE_FIELDS.includes(field);
}

/**
 * Hook for Planner-Tracker integration
 * 
 * @param {Object} options
 * @param {string} options.projectId - Current project ID
 * @param {Object} options.user - Current user object
 * @param {string} options.userRole - Current user's role
 * @param {Array} options.items - Current plan items
 * @param {Function} options.setItems - Setter for plan items
 * @param {Function} options.fetchItems - Function to refresh items
 * @param {Function} options.showSuccess - Toast function for success
 * @param {Function} options.showError - Toast function for errors
 * @param {Function} options.showWarning - Toast function for warnings
 * @param {Function} options.showInfo - Toast function for info
 * 
 * @returns {Object} Integration functions and state
 */
export function usePlanningIntegration({
  projectId,
  user,
  userRole,
  items,
  setItems,
  fetchItems,
  showSuccess,
  showError,
  showWarning,
  showInfo
}) {
  const navigate = useNavigate();
  
  // =========================================================================
  // STATE
  // =========================================================================
  
  // Baseline modal state
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [baselineMilestone, setBaselineMilestone] = useState(null);
  
  // Pending changes for batch variation creation
  const [pendingChanges, setPendingChanges] = useState([]);
  
  // Commit state
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSummary, setCommitSummary] = useState({
    committed: 0,
    uncommitted: 0,
    baselineLocked: 0
  });
  
  // Baseline status cache (milestone ID -> baseline data)
  const [baselineStatusCache, setBaselineStatusCache] = useState(new Map());
  
  // =========================================================================
  // PERMISSIONS
  // =========================================================================
  
  const canCommitPlan = useMemo(() => {
    return ['admin', 'supplier_pm'].includes(userRole);
  }, [userRole]);
  
  const canCreateVariation = useMemo(() => {
    return ['admin', 'supplier_pm'].includes(userRole);
  }, [userRole]);
  
  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================
  
  // Count of uncommitted items (milestones + deliverables only)
  const uncommittedCount = useMemo(() => {
    return items.filter(i => 
      !i.is_published && 
      (i.item_type === 'milestone' || i.item_type === 'deliverable')
    ).length;
  }, [items]);
  
  // Items enriched with baseline status
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const milestoneId = item.published_milestone_id;
      const baselineData = milestoneId ? baselineStatusCache.get(milestoneId) : null;
      
      return {
        ...item,
        _baselineLocked: baselineData?.baseline_locked || false,
        _baselineSignedAt: baselineData?.signed_at || null
      };
    });
  }, [items, baselineStatusCache]);
  
  // =========================================================================
  // BASELINE STATUS FETCHING
  // =========================================================================
  
  /**
   * Fetch baseline status for all published items
   */
  const fetchBaselineStatus = useCallback(async () => {
    const milestoneIds = [...new Set(
      items
        .filter(i => i.is_published && i.published_milestone_id)
        .map(i => i.published_milestone_id)
    )];
    
    if (milestoneIds.length === 0) {
      setBaselineStatusCache(new Map());
      return;
    }
    
    try {
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('id, baseline_locked, baseline_supplier_pm_signed_at, baseline_customer_pm_signed_at')
        .in('id', milestoneIds);
      
      if (error) throw error;
      
      const cache = new Map();
      for (const m of milestones || []) {
        const signedAt = m.baseline_supplier_pm_signed_at && m.baseline_customer_pm_signed_at
          ? new Date(Math.max(
              new Date(m.baseline_supplier_pm_signed_at),
              new Date(m.baseline_customer_pm_signed_at)
            ))
          : null;
        
        cache.set(m.id, {
          baseline_locked: m.baseline_locked,
          signed_at: signedAt
        });
      }
      
      setBaselineStatusCache(cache);
    } catch (error) {
      console.error('[usePlanningIntegration] Error fetching baseline status:', error);
    }
  }, [items]);
  
  // Fetch baseline status when items change
  useEffect(() => {
    fetchBaselineStatus();
  }, [fetchBaselineStatus]);
  
  /**
   * Fetch commit summary
   */
  const fetchCommitSummary = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const summary = await planCommitService.getCommitSummary(projectId);
      setCommitSummary(summary);
    } catch (error) {
      console.error('[usePlanningIntegration] Error fetching commit summary:', error);
    }
  }, [projectId]);
  
  // Fetch commit summary on mount and when items change
  useEffect(() => {
    fetchCommitSummary();
  }, [fetchCommitSummary, items.length]);
  
  // =========================================================================
  // BASELINE PROTECTION CHECK
  // =========================================================================
  
  /**
   * Get the milestone linked to a plan item (handles direct and indirect links)
   * 
   * @param {Object} item - Plan item
   * @returns {Promise<Object|null>} Milestone or null
   */
  const getMilestoneForItem = useCallback(async (item) => {
    if (!item.is_published) return null;
    
    let milestoneId = item.published_milestone_id;
    
    // If it's a deliverable/task, get milestone via the deliverable
    if (!milestoneId && item.published_deliverable_id) {
      const { data: deliverable } = await supabase
        .from('deliverables')
        .select('milestone_id')
        .eq('id', item.published_deliverable_id)
        .single();
      
      milestoneId = deliverable?.milestone_id;
    }
    
    if (!milestoneId) return null;
    
    const { data: milestone, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();
    
    if (error) {
      console.error('[usePlanningIntegration] Error fetching milestone:', error);
      return null;
    }
    
    return milestone;
  }, []);
  
  /**
   * Check if an update should be blocked due to baseline protection
   * Returns the milestone if blocked, null if allowed
   * 
   * @param {Object} item - Item being edited
   * @param {string} field - Field being changed
   * @returns {Promise<Object|null>} Milestone if blocked, null if allowed
   */
  const checkBaselineProtection = useCallback(async (item, field) => {
    // Not a baseline field - allow
    if (!isBaselineField(field)) return null;
    
    // Not published - allow
    if (!item.is_published) return null;
    
    // Get linked milestone
    const milestone = await getMilestoneForItem(item);
    
    // No milestone or not locked - allow
    if (!milestone || !milestone.baseline_locked) return null;
    
    // Baseline is locked - block
    return milestone;
  }, [getMilestoneForItem]);
  
  // =========================================================================
  // UPDATE HANDLER WRAPPER
  // =========================================================================
  
  /**
   * Wrapper for item updates that checks baseline protection
   * Call this BEFORE the actual update in Planning.jsx
   * 
   * @param {string} id - Item ID
   * @param {string} field - Field being changed
   * @param {*} value - New value
   * @param {Function} actualUpdate - The actual update function to call if allowed
   * @returns {Promise<boolean>} True if update was allowed/handled, false if blocked
   */
  const handleUpdateWithBaselineCheck = useCallback(async (id, field, value, actualUpdate) => {
    const item = items.find(i => i.id === id);
    if (!item) {
      console.error('[usePlanningIntegration] Item not found:', id);
      return false;
    }
    
    const previousValue = item[field];
    
    // If value hasn't changed, just proceed
    if (previousValue === value) {
      await actualUpdate();
      return true;
    }
    
    try {
      // Check baseline protection
      const milestone = await checkBaselineProtection(item, field);
      
      if (milestone) {
        // Block the update - show modal instead
        setPendingChange({ id, field, value, previousValue });
        setBaselineMilestone(milestone);
        setShowBaselineModal(true);
        return false; // Update was blocked
      }
      
      // Not blocked - proceed with update
      await actualUpdate();
      return true;
      
    } catch (error) {
      console.error('[usePlanningIntegration] Error checking baseline:', error);
      // On error, allow the update (fail open for UX)
      await actualUpdate();
      return true;
    }
  }, [items, checkBaselineProtection]);
  
  // =========================================================================
  // MODAL HANDLERS
  // =========================================================================
  
  /**
   * Close the baseline protection modal
   */
  const handleCloseBaselineModal = useCallback(() => {
    setShowBaselineModal(false);
    setPendingChange(null);
    setBaselineMilestone(null);
  }, []);
  
  /**
   * Discard the pending changes
   */
  const handleDiscardChanges = useCallback(() => {
    handleCloseBaselineModal();
    if (showInfo) showInfo('Changes discarded');
  }, [handleCloseBaselineModal, showInfo]);
  
  /**
   * Add current pending change to batch (for multiple changes to same variation)
   */
  const handleAddToPendingChanges = useCallback(() => {
    if (!pendingChange || !baselineMilestone) return;
    
    setPendingChanges(prev => [...prev, { 
      ...pendingChange, 
      milestone: baselineMilestone 
    }]);
    setShowBaselineModal(false);
    setPendingChange(null);
    setBaselineMilestone(null);
    
    if (showInfo) {
      showInfo('Change added to pending variation. Continue editing or create variation when ready.');
    }
  }, [pendingChange, baselineMilestone, showInfo]);
  
  /**
   * Clear all pending changes
   */
  const handleClearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    if (showInfo) showInfo('Pending changes cleared');
  }, [showInfo]);
  
  // =========================================================================
  // VARIATION CREATION
  // =========================================================================
  
  /**
   * Create a variation from the current pending change
   */
  const handleCreateVariationFromChange = useCallback(async () => {
    if (!pendingChange || !baselineMilestone) return;
    
    try {
      const item = items.find(i => i.id === pendingChange.id);
      
      // Determine variation type based on field changed
      let variationType = 'combined';
      if (pendingChange.field === 'start_date' || pendingChange.field === 'end_date') {
        variationType = 'time_extension';
      } else if (pendingChange.field === 'billable' || pendingChange.field === 'cost') {
        variationType = 'cost_adjustment';
      }
      
      // Generate variation reference
      const { data: refData } = await supabase
        .rpc('generate_variation_ref', { p_project_id: projectId });
      
      const variationRef = refData || `VAR-${Date.now()}`;
      
      // Create draft variation
      const { data: variation, error: createError } = await supabase
        .from('variations')
        .insert({
          project_id: projectId,
          variation_ref: variationRef,
          title: `Schedule Change: ${item?.name || 'Plan Item'}`,
          variation_type: variationType,
          description: `Change proposed via Planning Tool.\n\nItem: ${item?.wbs || ''} ${item?.name || ''}\nField: ${pendingChange.field}\nFrom: ${pendingChange.previousValue}\nTo: ${pendingChange.value}`,
          status: 'draft',
          priority: 'M',
          form_data: {
            source: 'planning_tool',
            plan_item_id: item?.id,
            change: pendingChange
          },
          created_by: user?.id
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Add affected milestone with before/after values
      const milestoneImpact = {
        variation_id: variation.id,
        milestone_id: baselineMilestone.id,
        original_baseline_start: baselineMilestone.baseline_start_date,
        original_baseline_end: baselineMilestone.baseline_end_date,
        original_baseline_cost: baselineMilestone.baseline_billable,
        new_baseline_start: baselineMilestone.baseline_start_date,
        new_baseline_end: baselineMilestone.baseline_end_date,
        new_baseline_cost: baselineMilestone.baseline_billable,
        change_rationale: `Changed ${pendingChange.field} from ${pendingChange.previousValue} to ${pendingChange.value}`
      };
      
      // Apply the proposed change to the new baseline values
      if (pendingChange.field === 'start_date') {
        milestoneImpact.new_baseline_start = pendingChange.value;
      } else if (pendingChange.field === 'end_date') {
        milestoneImpact.new_baseline_end = pendingChange.value;
      } else if (pendingChange.field === 'billable' || pendingChange.field === 'cost') {
        milestoneImpact.new_baseline_cost = pendingChange.value;
      }
      
      const { error: impactError } = await supabase
        .from('variation_milestones')
        .insert(milestoneImpact);
      
      if (impactError) throw impactError;
      
      // Close modal and navigate to variation form
      handleCloseBaselineModal();
      if (showSuccess) showSuccess('Variation created. Complete the form to submit for approval.');
      navigate(`/variations/${variation.id}/edit`);
      
    } catch (error) {
      console.error('[usePlanningIntegration] Error creating variation:', error);
      if (showError) showError('Failed to create variation: ' + error.message);
    }
  }, [
    pendingChange, 
    baselineMilestone, 
    items, 
    projectId, 
    user, 
    handleCloseBaselineModal, 
    showSuccess, 
    showError, 
    navigate
  ]);
  
  /**
   * Create a variation from all pending changes (batch)
   */
  const handleCreateVariationFromAllChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;
    
    try {
      // Group changes by milestone
      const byMilestone = pendingChanges.reduce((acc, change) => {
        const msId = change.milestone.id;
        if (!acc[msId]) {
          acc[msId] = { 
            milestone: change.milestone, 
            changes: [] 
          };
        }
        acc[msId].changes.push(change);
        return acc;
      }, {});
      
      const milestoneCount = Object.keys(byMilestone).length;
      
      // Determine variation type
      const hasDateChanges = pendingChanges.some(c => 
        c.field === 'start_date' || c.field === 'end_date'
      );
      const hasCostChanges = pendingChanges.some(c => 
        c.field === 'billable' || c.field === 'cost'
      );
      
      let variationType = 'combined';
      if (hasDateChanges && !hasCostChanges) variationType = 'time_extension';
      if (hasCostChanges && !hasDateChanges) variationType = 'cost_adjustment';
      
      // Generate variation reference
      const { data: refData } = await supabase
        .rpc('generate_variation_ref', { p_project_id: projectId });
      
      const variationRef = refData || `VAR-${Date.now()}`;
      
      // Create draft variation
      const { data: variation, error: createError } = await supabase
        .from('variations')
        .insert({
          project_id: projectId,
          variation_ref: variationRef,
          title: `Plan Update: ${milestoneCount} milestone${milestoneCount !== 1 ? 's' : ''} affected`,
          variation_type: variationType,
          description: `Changes proposed via Planning Tool.\n\n${pendingChanges.length} change(s) across ${milestoneCount} milestone(s).`,
          status: 'draft',
          priority: 'M',
          form_data: {
            source: 'planning_tool',
            changes: pendingChanges.map(c => ({
              plan_item_id: c.id,
              field: c.field,
              from: c.previousValue,
              to: c.value
            }))
          },
          created_by: user?.id
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Add affected milestones
      for (const [msId, { milestone, changes }] of Object.entries(byMilestone)) {
        const milestoneImpact = {
          variation_id: variation.id,
          milestone_id: msId,
          original_baseline_start: milestone.baseline_start_date,
          original_baseline_end: milestone.baseline_end_date,
          original_baseline_cost: milestone.baseline_billable,
          new_baseline_start: milestone.baseline_start_date,
          new_baseline_end: milestone.baseline_end_date,
          new_baseline_cost: milestone.baseline_billable,
          change_rationale: changes.map(c => 
            `${c.field}: ${c.previousValue} → ${c.value}`
          ).join('; ')
        };
        
        // Apply all changes for this milestone
        for (const change of changes) {
          if (change.field === 'start_date') {
            milestoneImpact.new_baseline_start = change.value;
          } else if (change.field === 'end_date') {
            milestoneImpact.new_baseline_end = change.value;
          } else if (change.field === 'billable' || change.field === 'cost') {
            milestoneImpact.new_baseline_cost = change.value;
          }
        }
        
        await supabase
          .from('variation_milestones')
          .insert(milestoneImpact);
      }
      
      // Clear pending changes and navigate
      setPendingChanges([]);
      if (showSuccess) showSuccess('Variation created with all pending changes.');
      navigate(`/variations/${variation.id}/edit`);
      
    } catch (error) {
      console.error('[usePlanningIntegration] Error creating batch variation:', error);
      if (showError) showError('Failed to create variation: ' + error.message);
    }
  }, [pendingChanges, projectId, user, showSuccess, showError, navigate]);
  
  // =========================================================================
  // COMMIT TO TRACKER
  // =========================================================================
  
  /**
   * Commit the plan to the Tracker
   */
  const handleCommitToTracker = useCallback(async () => {
    if (uncommittedCount === 0) {
      if (showWarning) showWarning('No items to commit');
      return;
    }
    
    if (!canCommitPlan) {
      if (showError) showError('You do not have permission to commit the plan');
      return;
    }
    
    // Confirm before committing
    const confirmed = window.confirm(
      `Commit ${uncommittedCount} item${uncommittedCount !== 1 ? 's' : ''} to Tracker?\n\n` +
      `This will create milestones and deliverables in the Tracker.`
    );
    
    if (!confirmed) return;
    
    setIsCommitting(true);
    
    try {
      const result = await planCommitService.commitPlan(projectId, user?.id);
      
      // Build message parts
      let message = '';
      const skippedCount = result.skipped?.length || 0;
      
      if (result.errors.length > 0) {
        if (showWarning) {
          message = `Committed ${result.count} items. ${result.errors.length} failed: ${result.errors.map(e => e.item).join(', ')}`;
          if (skippedCount > 0) {
            message += `. ${skippedCount} invalid items skipped.`;
          }
          showWarning(message);
        }
      } else if (result.count === 0 && skippedCount > 0) {
        if (showWarning) {
          showWarning(
            `No valid items to commit. ${skippedCount} items skipped due to missing data (name, dates, or parent).`
          );
        }
      } else {
        if (showSuccess) {
          message = `Successfully committed ${result.count} items to Tracker (${result.milestones.length} milestones, ${result.deliverables.length} deliverables)`;
          if (skippedCount > 0) {
            message += `. ${skippedCount} invalid items skipped.`;
          }
          showSuccess(message);
        }
      }
      
      // Log skipped items to console for debugging
      if (skippedCount > 0) {
        console.log('[usePlanningIntegration] Skipped items:', result.skipped);
      }
      
      // Refresh items to show new published status
      if (fetchItems) await fetchItems();
      await fetchCommitSummary();
      await fetchBaselineStatus();
      
    } catch (error) {
      console.error('[usePlanningIntegration] Commit error:', error);
      if (showError) showError('Failed to commit plan: ' + error.message);
    } finally {
      setIsCommitting(false);
    }
  }, [
    uncommittedCount, 
    canCommitPlan, 
    projectId, 
    user, 
    fetchItems, 
    fetchCommitSummary,
    fetchBaselineStatus,
    showSuccess, 
    showWarning, 
    showError
  ]);
  
  // =========================================================================
  // RETURN
  // =========================================================================
  
  return {
    // State
    showBaselineModal,
    pendingChange,
    baselineMilestone,
    pendingChanges,
    isCommitting,
    commitSummary,
    
    // Computed
    canCommitPlan,
    canCreateVariation,
    uncommittedCount,
    enrichedItems,
    
    // Handlers - Baseline Modal
    handleCloseBaselineModal,
    handleDiscardChanges,
    handleAddToPendingChanges,
    handleClearPendingChanges,
    handleCreateVariationFromChange,
    handleCreateVariationFromAllChanges,
    
    // Handlers - Updates
    handleUpdateWithBaselineCheck,
    checkBaselineProtection,
    getMilestoneForItem,
    
    // Handlers - Commit
    handleCommitToTracker,
    
    // Refresh functions
    fetchBaselineStatus,
    fetchCommitSummary,
    
    // Utilities
    isBaselineField
  };
}

export default usePlanningIntegration;
