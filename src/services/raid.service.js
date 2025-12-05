/**
 * RAID Items Service
 * 
 * Manages Risks, Assumptions, Issues, and Dependencies (RAID log).
 * Extends BaseService for standard CRUD operations.
 * 
 * Version 1.0 - Initial implementation
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

class RaidService extends BaseService {
  constructor() {
    super('raid_items', {
      supportsSoftDelete: true,
      sanitizeConfig: 'raid_items'
    });
  }

  /**
   * Get all RAID items with related data (owner, milestone)
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of RAID items
   */
  async getAllWithRelations(projectId, options = {}) {
    try {
      let query = supabase
        .from('raid_items')
        .select(`
          *,
          owner:resources!raid_items_owner_id_fkey(id, name, email),
          milestone:milestones!raid_items_milestone_id_fkey(id, name, milestone_ref)
        `)
        .eq('project_id', projectId);

      // Filter by category if specified
      if (options.category) {
        query = query.eq('category', options.category);
      }

      // Filter by status if specified
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Filter by severity if specified
      if (options.severity) {
        query = query.eq('severity', options.severity);
      }

      // Default ordering: by category then raid_ref
      const orderColumn = options.orderBy?.column || 'raid_ref';
      const orderAsc = options.orderBy?.ascending ?? true;
      query = query.order(orderColumn, { ascending: orderAsc });

      const { data, error } = await query;

      if (error) {
        console.error('RAID getAllWithRelations error:', error);
        throw error;
      }

      // Filter out soft-deleted records client-side
      let result = data || [];
      if (!options.includeDeleted) {
        result = result.filter(record => record.is_deleted !== true);
      }

      return result;
    } catch (error) {
      console.error('RAID getAllWithRelations failed:', error);
      throw error;
    }
  }

  /**
   * Get RAID items grouped by category
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Items grouped by category
   */
  async getGroupedByCategory(projectId) {
    try {
      const items = await this.getAllWithRelations(projectId);
      
      return {
        risks: items.filter(i => i.category === 'Risk'),
        assumptions: items.filter(i => i.category === 'Assumption'),
        issues: items.filter(i => i.category === 'Issue'),
        dependencies: items.filter(i => i.category === 'Dependency')
      };
    } catch (error) {
      console.error('RAID getGroupedByCategory failed:', error);
      throw error;
    }
  }

  /**
   * Get RAID summary statistics
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(projectId) {
    try {
      const items = await this.getAll(projectId);
      
      const summary = {
        total: items.length,
        byCategory: {
          Risk: { total: 0, open: 0, highSeverity: 0 },
          Assumption: { total: 0, open: 0, highSeverity: 0 },
          Issue: { total: 0, open: 0, highSeverity: 0 },
          Dependency: { total: 0, open: 0, highSeverity: 0 }
        },
        byStatus: {
          Open: 0,
          'In Progress': 0,
          Closed: 0,
          Accepted: 0,
          Mitigated: 0
        },
        bySeverity: {
          High: 0,
          Medium: 0,
          Low: 0
        },
        highPriorityItems: []
      };

      items.forEach(item => {
        // By category
        if (summary.byCategory[item.category]) {
          summary.byCategory[item.category].total++;
          if (item.status === 'Open' || item.status === 'In Progress') {
            summary.byCategory[item.category].open++;
          }
          if (item.severity === 'High') {
            summary.byCategory[item.category].highSeverity++;
          }
        }

        // By status
        if (summary.byStatus.hasOwnProperty(item.status)) {
          summary.byStatus[item.status]++;
        }

        // By severity
        if (item.severity && summary.bySeverity.hasOwnProperty(item.severity)) {
          summary.bySeverity[item.severity]++;
        }

        // Track high priority items (High severity AND Open/In Progress)
        if (item.severity === 'High' && 
            (item.status === 'Open' || item.status === 'In Progress')) {
          summary.highPriorityItems.push({
            id: item.id,
            raid_ref: item.raid_ref,
            category: item.category,
            title: item.title,
            description: item.description?.substring(0, 100) + '...'
          });
        }
      });

      return summary;
    } catch (error) {
      console.error('RAID getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get next available reference number for a category
   * @param {string} projectId - Project UUID
   * @param {string} category - RAID category
   * @returns {Promise<string>} Next reference (e.g., 'R003')
   */
  async getNextRef(projectId, category) {
    try {
      const prefix = this.getCategoryPrefix(category);
      
      const { data, error } = await supabase
        .from('raid_items')
        .select('raid_ref')
        .eq('project_id', projectId)
        .ilike('raid_ref', `${prefix}%`)
        .order('raid_ref', { ascending: false })
        .limit(1);

      if (error) {
        console.error('RAID getNextRef error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return `${prefix}001`;
      }

      // Extract number from last ref and increment
      const lastRef = data[0].raid_ref;
      const numPart = parseInt(lastRef.replace(prefix, ''), 10) || 0;
      const nextNum = (numPart + 1).toString().padStart(3, '0');
      
      return `${prefix}${nextNum}`;
    } catch (error) {
      console.error('RAID getNextRef failed:', error);
      throw error;
    }
  }

  /**
   * Get category prefix for reference generation
   * @param {string} category - RAID category
   * @returns {string} Prefix letter
   */
  getCategoryPrefix(category) {
    const prefixes = {
      'Risk': 'R',
      'Assumption': 'A',
      'Issue': 'I',
      'Dependency': 'D'
    };
    return prefixes[category] || 'X';
  }

  /**
   * Create a new RAID item with auto-generated reference
   * @param {Object} item - RAID item data
   * @returns {Promise<Object>} Created item
   */
  async createWithAutoRef(item) {
    try {
      // Generate reference if not provided
      if (!item.raid_ref) {
        item.raid_ref = await this.getNextRef(item.project_id, item.category);
      }

      return await this.create(item);
    } catch (error) {
      console.error('RAID createWithAutoRef failed:', error);
      throw error;
    }
  }

  /**
   * Update RAID item status with automatic date tracking
   * @param {string} id - Item UUID
   * @param {string} newStatus - New status
   * @param {string} resolution - Resolution notes (for closed items)
   * @returns {Promise<Object>} Updated item
   */
  async updateStatus(id, newStatus, resolution = null) {
    try {
      const updates = { status: newStatus };

      // Set closed_date when closing
      if (['Closed', 'Accepted', 'Mitigated'].includes(newStatus)) {
        updates.closed_date = new Date().toISOString().split('T')[0];
        if (resolution) {
          updates.resolution = resolution;
        }
      } else {
        // Clear closed_date if reopening
        updates.closed_date = null;
      }

      return await this.update(id, updates);
    } catch (error) {
      console.error('RAID updateStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get overdue RAID items (past due_date and still open)
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Overdue items
   */
  async getOverdue(projectId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('raid_items')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['Open', 'In Progress'])
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('RAID getOverdue error:', error);
        throw error;
      }

      // Filter out soft-deleted client-side
      return (data || []).filter(r => r.is_deleted !== true);
    } catch (error) {
      console.error('RAID getOverdue failed:', error);
      throw error;
    }
  }

  /**
   * Get RAID items linked to a specific milestone
   * @param {string} milestoneId - Milestone UUID
   * @returns {Promise<Array>} Linked items
   */
  async getByMilestone(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('raid_items')
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('raid_ref', { ascending: true });

      if (error) {
        console.error('RAID getByMilestone error:', error);
        throw error;
      }

      return (data || []).filter(r => r.is_deleted !== true);
    } catch (error) {
      console.error('RAID getByMilestone failed:', error);
      throw error;
    }
  }

  /**
   * Get RAID items assigned to a specific owner
   * @param {string} ownerId - Resource UUID
   * @returns {Promise<Array>} Owned items
   */
  async getByOwner(ownerId) {
    try {
      const { data, error } = await supabase
        .from('raid_items')
        .select('*')
        .eq('owner_id', ownerId)
        .order('raid_ref', { ascending: true });

      if (error) {
        console.error('RAID getByOwner error:', error);
        throw error;
      }

      return (data || []).filter(r => r.is_deleted !== true);
    } catch (error) {
      console.error('RAID getByOwner failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update status for multiple items
   * @param {string[]} ids - Array of item UUIDs
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Result with success/failure counts
   */
  async bulkUpdateStatus(ids, newStatus) {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        await this.updateStatus(id, newStatus);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    return results;
  }
}

// Export singleton instance
export const raidService = new RaidService();
export default raidService;
