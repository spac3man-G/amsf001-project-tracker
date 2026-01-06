/**
 * Sync Service
 * 
 * Handles bi-directional synchronization between Planner and Tracker.
 * Enforces baseline protection rules.
 * 
 * @version 1.0.0
 * @created 2026-01-06
 * 
 * RULES:
 * - Baselined milestones cannot be deleted from either side
 * - Non-baselined items sync deletions bi-directionally
 * - Only applies to committed (published) items
 */

import { supabase } from '../lib/supabase';

export const syncService = {

  // ===========================================================================
  // BASELINE CHECKS
  // ===========================================================================

  /**
   * Check if a milestone is baseline-locked
   * @param {string} milestoneId - Milestone UUID
   * @returns {Promise<{locked: boolean, milestone: Object|null}>}
   */
  async isMilestoneBaselineLocked(milestoneId) {
    if (!milestoneId) return { locked: false, milestone: null };
    
    const { data, error } = await supabase
      .from('milestones')
      .select('id, name, baseline_locked')
      .eq('id', milestoneId)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return { locked: false, milestone: null };
    }
    
    return {
      locked: data[0].baseline_locked === true,
      milestone: data[0]
    };
  },

  /**
   * Check if a plan item is linked to a baselined milestone
   * @param {string} planItemId - Plan item UUID
   * @returns {Promise<{locked: boolean, milestone: Object|null, planItem: Object|null}>}
   */
  async isPlanItemBaselineLocked(planItemId) {
    const { data: planItem, error } = await supabase
      .from('plan_items')
      .select('id, name, is_published, published_milestone_id, published_deliverable_id')
      .eq('id', planItemId)
      .limit(1);
    
    if (error || !planItem || planItem.length === 0) {
      return { locked: false, milestone: null, planItem: null };
    }
    
    const item = planItem[0];
    
    // Not published = not linked = can delete freely
    if (!item.is_published) {
      return { locked: false, milestone: null, planItem: item };
    }
    
    // Check direct milestone link
    if (item.published_milestone_id) {
      const result = await this.isMilestoneBaselineLocked(item.published_milestone_id);
      return { ...result, planItem: item };
    }
    
    // Check via deliverable link
    if (item.published_deliverable_id) {
      const { data: deliverable } = await supabase
        .from('deliverables')
        .select('milestone_id')
        .eq('id', item.published_deliverable_id)
        .limit(1);
      
      if (deliverable && deliverable[0]?.milestone_id) {
        const result = await this.isMilestoneBaselineLocked(deliverable[0].milestone_id);
        return { ...result, planItem: item };
      }
    }
    
    return { locked: false, milestone: null, planItem: item };
  },

  /**
   * Check if a deliverable's parent milestone is baselined
   * @param {string} deliverableId - Deliverable UUID
   * @returns {Promise<{locked: boolean, milestone: Object|null}>}
   */
  async isDeliverableBaselineLocked(deliverableId) {
    const { data: deliverable, error } = await supabase
      .from('deliverables')
      .select('id, name, milestone_id')
      .eq('id', deliverableId)
      .limit(1);
    
    if (error || !deliverable || deliverable.length === 0) {
      return { locked: false, milestone: null };
    }
    
    return this.isMilestoneBaselineLocked(deliverable[0].milestone_id);
  },


  // ===========================================================================
  // SYNC DELETIONS: PLANNER → TRACKER
  // ===========================================================================

  /**
   * When deleting from Planner, sync to Tracker if published
   * @param {string} planItemId - Plan item UUID
   * @param {string} userId - User performing the action
   * @returns {Promise<{allowed: boolean, reason?: string, synced?: boolean}>}
   */
  async syncPlannerDeleteToTracker(planItemId, userId) {
    const { locked, milestone, planItem } = await this.isPlanItemBaselineLocked(planItemId);
    
    if (locked) {
      return {
        allowed: false,
        reason: `Cannot delete: linked to baselined milestone "${milestone.name}". Remove baseline lock first.`
      };
    }
    
    if (!planItem) {
      return { allowed: true, synced: false };
    }
    
    // Not published = nothing to sync
    if (!planItem.is_published) {
      return { allowed: true, synced: false };
    }
    
    let synced = false;
    
    // Soft-delete linked milestone
    if (planItem.published_milestone_id) {
      const { error } = await supabase
        .from('milestones')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', planItem.published_milestone_id);
      
      if (!error) {
        synced = true;
        console.log(`[SyncService] Soft-deleted milestone ${planItem.published_milestone_id} (synced from planner)`);
      }
    }
    
    // Soft-delete linked deliverable
    if (planItem.published_deliverable_id) {
      const { error } = await supabase
        .from('deliverables')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', planItem.published_deliverable_id);
      
      if (!error) {
        synced = true;
        console.log(`[SyncService] Soft-deleted deliverable ${planItem.published_deliverable_id} (synced from planner)`);
      }
    }
    
    return { allowed: true, synced };
  },


  // ===========================================================================
  // SYNC DELETIONS: TRACKER → PLANNER
  // ===========================================================================

  /**
   * When deleting a milestone from Tracker, sync to Planner
   * @param {string} milestoneId - Milestone UUID
   * @param {string} userId - User performing the action
   * @returns {Promise<{allowed: boolean, reason?: string, synced?: boolean}>}
   */
  async syncMilestoneDeleteToPlanner(milestoneId, userId) {
    const { locked, milestone } = await this.isMilestoneBaselineLocked(milestoneId);
    
    if (locked) {
      return {
        allowed: false,
        reason: `Cannot delete: milestone "${milestone?.name}" has a locked baseline. Remove baseline lock first.`
      };
    }
    
    // Find linked plan items
    const { data: planItems, error } = await supabase
      .from('plan_items')
      .select('id')
      .eq('published_milestone_id', milestoneId)
      .eq('is_deleted', false);
    
    if (error || !planItems || planItems.length === 0) {
      return { allowed: true, synced: false };
    }
    
    // Soft-delete linked plan items
    const ids = planItems.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('plan_items')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .in('id', ids);
    
    if (deleteError) {
      console.error('[SyncService] Error syncing milestone delete to planner:', deleteError);
      return { allowed: true, synced: false };
    }
    
    console.log(`[SyncService] Soft-deleted ${ids.length} plan items (synced from tracker milestone)`);
    return { allowed: true, synced: true, count: ids.length };
  },

  /**
   * When deleting a deliverable from Tracker, sync to Planner
   * @param {string} deliverableId - Deliverable UUID
   * @param {string} userId - User performing the action
   * @returns {Promise<{allowed: boolean, reason?: string, synced?: boolean}>}
   */
  async syncDeliverableDeleteToPlanner(deliverableId, userId) {
    const { locked, milestone } = await this.isDeliverableBaselineLocked(deliverableId);
    
    if (locked) {
      return {
        allowed: false,
        reason: `Cannot delete: deliverable belongs to baselined milestone "${milestone?.name}". Remove baseline lock first.`
      };
    }
    
    // Find linked plan items
    const { data: planItems, error } = await supabase
      .from('plan_items')
      .select('id')
      .eq('published_deliverable_id', deliverableId)
      .eq('is_deleted', false);
    
    if (error || !planItems || planItems.length === 0) {
      return { allowed: true, synced: false };
    }
    
    // Soft-delete linked plan items
    const ids = planItems.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('plan_items')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .in('id', ids);
    
    if (deleteError) {
      console.error('[SyncService] Error syncing deliverable delete to planner:', deleteError);
      return { allowed: true, synced: false };
    }
    
    console.log(`[SyncService] Soft-deleted ${ids.length} plan items (synced from tracker deliverable)`);
    return { allowed: true, synced: true, count: ids.length };
  }
};

export default syncService;
