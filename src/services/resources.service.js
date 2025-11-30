/**
 * Resources Service
 * 
 * Handles all resource-related database operations using the Services Layer pattern.
 * Extends BaseService for standard CRUD with resource-specific methods.
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class ResourcesService extends BaseService {
  constructor() {
    super('resources');
  }

  /**
   * Get all resources for a project with optional partner details
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Resources with partner info
   */
  async getAll(projectId, options = {}) {
    const { includePartner = true, activeOnly = false } = options;
    
    let select = '*';
    if (includePartner) {
      select = '*, partner:partners(id, name, is_active)';
    }

    let query = supabase
      .from(this.tableName)
      .select(select)
      .eq('project_id', projectId)
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('ResourcesService.getAll error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get a single resource by ID with full details
   * @param {string} id - Resource UUID
   * @returns {Promise<Object|null>} Resource with partner details
   */
  async getById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, partner:partners(id, name, contact_name, contact_email, is_active)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('ResourcesService.getById error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Get resources filtered by type
   * @param {string} projectId - Project UUID
   * @param {string} resourceType - 'internal' or 'third_party'
   * @returns {Promise<Array>} Filtered resources
   */
  async getByType(projectId, resourceType) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, partner:partners(id, name)')
      .eq('project_id', projectId)
      .eq('resource_type', resourceType)
      .order('name');

    if (error) {
      console.error('ResourcesService.getByType error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get resources for a specific partner
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Array>} Resources linked to the partner
   */
  async getByPartner(partnerId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('partner_id', partnerId)
      .order('name');

    if (error) {
      console.error('ResourcesService.getByPartner error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get resource with related timesheets summary
   * @param {string} id - Resource UUID
   * @returns {Promise<Object>} Resource with timesheet stats
   */
  async getWithTimesheetSummary(id) {
    // Get the resource
    const resource = await this.getById(id);
    if (!resource) return null;

    // Get timesheet summary
    const { data: timesheets, error } = await supabase
      .from('timesheets')
      .select('id, hours_worked, hours, status, was_rejected, date')
      .eq('resource_id', id);

    if (error) {
      console.error('ResourcesService.getWithTimesheetSummary timesheets error:', error);
    }

    // Calculate stats
    let totalHours = 0;
    let approvedHours = 0;
    let pendingHours = 0;

    if (timesheets) {
      timesheets.forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        totalHours += hours;
        
        if (ts.status === 'Approved') {
          approvedHours += hours;
        } else if (ts.status === 'Submitted' && !ts.was_rejected) {
          pendingHours += hours;
        }
      });
    }

    return {
      ...resource,
      timesheetSummary: {
        totalEntries: timesheets?.length || 0,
        totalHours,
        approvedHours,
        pendingHours,
        daysWorked: totalHours / 8
      }
    };
  }

  /**
   * Create a new resource with validation
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} Created resource
   */
  async create(resourceData) {
    // Validation
    if (!resourceData.name?.trim()) {
      throw new Error('Resource name is required');
    }
    if (!resourceData.project_id) {
      throw new Error('Project ID is required');
    }
    if (!resourceData.email?.trim()) {
      throw new Error('Email is required');
    }

    // If third_party type, partner_id should ideally be set (but not required)
    if (resourceData.resource_type === 'third_party' && !resourceData.partner_id) {
      console.warn('Creating third-party resource without partner_id');
    }

    // If internal type, clear partner_id
    if (resourceData.resource_type === 'internal') {
      resourceData.partner_id = null;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([resourceData])
      .select('*, partner:partners(id, name)')
      .single();

    if (error) {
      console.error('ResourcesService.create error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Update a resource
   * @param {string} id - Resource UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated resource
   */
  async update(id, updates) {
    // If changing to internal, clear partner_id
    if (updates.resource_type === 'internal') {
      updates.partner_id = null;
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select('*, partner:partners(id, name)')
      .single();

    if (error) {
      console.error('ResourcesService.update error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Link a resource to a partner
   * @param {string} resourceId - Resource UUID
   * @param {string} partnerId - Partner UUID (or null to unlink)
   * @returns {Promise<Object>} Updated resource
   */
  async linkToPartner(resourceId, partnerId) {
    const updates = {
      partner_id: partnerId,
      resource_type: partnerId ? 'third_party' : 'internal',
      updated_at: new Date().toISOString()
    };

    return this.update(resourceId, updates);
  }

  /**
   * Toggle resource type between internal and third_party
   * @param {string} id - Resource UUID
   * @param {string|null} partnerId - Partner ID if switching to third_party
   * @returns {Promise<Object>} Updated resource
   */
  async toggleType(id, partnerId = null) {
    // Get current resource
    const resource = await this.getById(id);
    if (!resource) throw new Error('Resource not found');

    const newType = resource.resource_type === 'third_party' ? 'internal' : 'third_party';
    
    return this.update(id, {
      resource_type: newType,
      partner_id: newType === 'third_party' ? partnerId : null
    });
  }

  /**
   * Get resources for select dropdown (minimal fields)
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Resources with id, name, resource_type
   */
  async getForSelect(projectId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id, name, resource_type, role')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      console.error('ResourcesService.getForSelect error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Calculate margin for a resource
   * @param {number} dailyRate - Customer daily rate
   * @param {number} costPrice - Internal cost price
   * @returns {Object} Margin details
   */
  calculateMargin(dailyRate, costPrice) {
    if (!dailyRate || dailyRate === 0 || !costPrice) {
      return { percent: null, amount: null, status: 'unknown' };
    }

    const percent = ((dailyRate - costPrice) / dailyRate) * 100;
    const amount = dailyRate - costPrice;
    
    let status = 'critical';
    if (percent >= 25) status = 'good';
    else if (percent >= 10) status = 'low';

    return { percent, amount, status };
  }

  /**
   * Get resource utilization stats
   * @param {string} id - Resource UUID
   * @returns {Promise<Object>} Utilization data
   */
  async getUtilization(id) {
    const resource = await this.getWithTimesheetSummary(id);
    if (!resource) return null;

    const daysAllocated = resource.days_allocated || 0;
    const daysUsed = resource.timesheetSummary.daysWorked;
    const remaining = Math.max(0, daysAllocated - daysUsed);
    const utilizationPercent = daysAllocated > 0 
      ? (daysUsed / daysAllocated) * 100 
      : 0;

    return {
      resourceId: id,
      resourceName: resource.name,
      daysAllocated,
      daysUsed,
      remaining,
      utilizationPercent,
      totalValue: (resource.daily_rate || 0) * daysAllocated,
      valueUsed: (resource.daily_rate || 0) * daysUsed
    };
  }
}

// Singleton instance for use throughout the app
export const resourcesService = new ResourcesService();
