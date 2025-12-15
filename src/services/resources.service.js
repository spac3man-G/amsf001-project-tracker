/**
 * Resources Service
 * 
 * Handles all resource-related database operations using the Services Layer pattern.
 * Extends BaseService for standard CRUD with resource-specific methods.
 * Includes caching for frequently accessed data.
 * 
 * @version 2.1 - Added caching
 * @updated 6 December 2025
 * @phase Production Hardening - Soft Delete & Sanitisation
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { sanitizeSingleLine, sanitizeMultiLine, sanitizeEmail } from '../lib/sanitize';
import { hoursToDays } from '../config/metricsConfig';
import { getCacheKey, getFromCache, setInCache, invalidateNamespace, CACHE_TTL } from '../lib/cache';

const CACHE_NAMESPACE = 'resources';

export class ResourcesService extends BaseService {
  constructor() {
    super('resources', {
      sanitizeConfig: 'resource',
      supportsSoftDelete: true
    });
  }

  /**
   * Sanitise resource data
   */
  sanitizeData(data) {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeSingleLine(sanitized.name, 100);
    if (sanitized.role) sanitized.role = sanitizeSingleLine(sanitized.role, 100);
    if (sanitized.email) sanitized.email = sanitizeEmail(sanitized.email);
    if (sanitized.notes) sanitized.notes = sanitizeMultiLine(sanitized.notes, 5000);
    return sanitized;
  }

  /**
   * Get all resources for a project with soft delete filter
   */
  async getAll(projectId, options = {}) {
    const { includePartner = true, activeOnly = false, showTestUsers = true, includeDeleted = false } = options;
    
    let select = '*';
    if (includePartner) {
      select = '*, partner:partners(id, name, is_active)';
    }

    let query = supabase
      .from(this.tableName)
      .select(select)
      .eq('project_id', projectId)
      .order('name');

    // Soft delete filter
    if (!includeDeleted) {
      query = query.or('is_deleted.is.null,is_deleted.eq.false');
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Test content filter
    if (!showTestUsers) {
      query = query.or('is_test_content.is.null,is_test_content.eq.false');
    }

    const { data, error } = await query;
    if (error) {
      console.error('ResourcesService.getAll error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get all resources filtered (convenience method for pages)
   */
  async getAllFiltered(projectId, showTestUsers = true) {
    return this.getAll(projectId, { showTestUsers, includePartner: true });
  }

  /**
   * Get a single resource by ID with full details
   */
  async getById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, partner:partners(id, name, contact_name, contact_email, is_active)')
      .eq('id', id)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .single();

    if (error) {
      console.error('ResourcesService.getById error:', error);
      throw error;
    }
    return data;
  }

  /**
   * Get resources filtered by type
   */
  async getByType(projectId, resourceType) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, partner:partners(id, name)')
      .eq('project_id', projectId)
      .eq('resource_type', resourceType)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('name');

    if (error) {
      console.error('ResourcesService.getByType error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get resources for a specific partner
   */
  async getByPartner(partnerId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('partner_id', partnerId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('name');

    if (error) {
      console.error('ResourcesService.getByPartner error:', error);
      throw error;
    }
    return data || [];
  }

  /**
   * Get resource with related timesheets summary
   */
  async getWithTimesheetSummary(id) {
    const resource = await this.getById(id);
    if (!resource) return null;

    const { data: timesheets, error } = await supabase
      .from('timesheets')
      .select('id, hours_worked, hours, status, was_rejected, date')
      .eq('resource_id', id)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) {
      console.error('ResourcesService.getWithTimesheetSummary timesheets error:', error);
    }

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
        daysWorked: hoursToDays(totalHours)
      }
    };
  }

  /**
   * Create a new resource with validation and sanitisation
   */
  async create(resourceData) {
    // Sanitise input
    const sanitized = this.sanitizeData(resourceData);

    // Validation
    if (!sanitized.name?.trim()) {
      throw new Error('Resource name is required');
    }
    if (!sanitized.project_id) {
      throw new Error('Project ID is required');
    }
    if (!sanitized.email?.trim()) {
      throw new Error('Email is required');
    }

    // If internal type, clear partner_id
    if (sanitized.resource_type === 'internal') {
      sanitized.partner_id = null;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([sanitized])
      .select('*, partner:partners(id, name)')
      .single();

    if (error) {
      console.error('ResourcesService.create error:', error);
      throw error;
    }
    
    // Invalidate cache after create
    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Update a resource with sanitisation
   */
  async update(id, updates) {
    // Sanitise input
    const sanitized = this.sanitizeData(updates);

    // If changing to internal, clear partner_id
    if (sanitized.resource_type === 'internal') {
      sanitized.partner_id = null;
    }

    sanitized.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .update(sanitized)
      .eq('id', id)
      .select('*, partner:partners(id, name)')
      .single();

    if (error) {
      console.error('ResourcesService.update error:', error);
      throw error;
    }
    
    // Invalidate cache after update
    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Soft delete a resource
   */
  async delete(id, userId = null) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('ResourcesService.delete error:', error);
      throw error;
    }
    
    // Invalidate cache after delete
    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Restore a soft-deleted resource
   */
  async restore(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('ResourcesService.restore error:', error);
      throw error;
    }
    
    // Invalidate cache after restore
    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Link a resource to a partner
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
   * Toggle resource active status
   */
  async toggleActive(id) {
    const resource = await this.getById(id);
    if (!resource) throw new Error('Resource not found');

    return this.update(id, { is_active: !resource.is_active });
  }

  /**
   * Get resources for select dropdown (minimal fields, with caching)
   */
  async getForSelect(projectId) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, projectId, 'select');
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id, name, resource_type, role')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('name');

    if (error) {
      console.error('ResourcesService.getForSelect error:', error);
      throw error;
    }
    
    const result = data || [];
    setInCache(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  /**
   * Calculate margin for a resource
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
      totalValue: (resource.sell_price || 0) * daysAllocated,
      valueUsed: (resource.sell_price || 0) * daysUsed
    };
  }

  /**
   * Get summary stats for dashboard
   */
  async getSummary(projectId) {
    const resources = await this.getAll(projectId, { includePartner: false });
    
    return {
      total: resources.length,
      internal: resources.filter(r => r.resource_type === 'internal').length,
      thirdParty: resources.filter(r => r.resource_type === 'third_party').length,
      active: resources.filter(r => r.is_active).length,
      totalBudget: resources.reduce((sum, r) => sum + ((r.sell_price || 0) * (r.days_allocated || 0)), 0)
    };
  }

  /**
   * Check if a profile exists by email
   * Used before adding new resources to verify user exists
   */
  async getProfileByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('ResourcesService getProfileByEmail error:', error);
      throw error;
    }
  }

  /**
   * Get all resources with optional test user filtering
   * Used by Timesheets page to populate resource dropdown
   */
  async getAllWithTestFilter(projectId, testUserIds = []) {
    try {
      const resources = await this.getAll(projectId, {
        orderBy: { column: 'name', ascending: true }
      });

      // Filter out test users if provided
      if (testUserIds && testUserIds.length > 0) {
        return resources.filter(r => !r.user_id || !testUserIds.includes(r.user_id));
      }

      return resources;
    } catch (error) {
      console.error('ResourcesService getAllWithTestFilter error:', error);
      throw error;
    }
  }

  /**
   * Check dependencies before deleting a resource
   * Returns counts of timesheets and expenses linked to this resource
   */
  async getDependencyCounts(resourceId) {
    try {
      const [timesheetResult, expenseResult] = await Promise.all([
        this.supabase
          .from('timesheets')
          .select('id', { count: 'exact', head: true })
          .eq('resource_id', resourceId)
          .or('is_deleted.is.null,is_deleted.eq.false'),
        this.supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('resource_id', resourceId)
          .or('is_deleted.is.null,is_deleted.eq.false')
      ]);

      return {
        timesheetCount: timesheetResult.count || 0,
        expenseCount: expenseResult.count || 0,
        canDelete: (timesheetResult.count || 0) === 0 && (expenseResult.count || 0) === 0
      };
    } catch (error) {
      console.error('ResourcesService getDependencyCounts error:', error);
      throw error;
    }
  }

  /**
   * Get project users who don't have resource records yet
   * These are candidates for resource creation (users who need to log time)
   * Only returns users with roles: contributor, supplier_pm
   */
  async getProjectUsersWithoutResources(projectId) {
    try {
      // Get all user_projects for this project with eligible roles
      const { data: userProjects, error: upError } = await supabase
        .from('user_projects')
        .select('user_id, role')
        .eq('project_id', projectId)
        .in('role', ['contributor', 'supplier_pm']);

      if (upError) {
        console.error('Error fetching user_projects:', upError);
        throw upError;
      }

      if (!userProjects || userProjects.length === 0) {
        return [];
      }

      // Get profiles for these users
      const userIds = userProjects.map(up => up.user_id);
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (pError) {
        console.error('Error fetching profiles:', pError);
        throw pError;
      }

      // Create a map of profiles by id
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Get existing resource user_ids for this project
      const { data: existingResources, error: rError } = await supabase
        .from('resources')
        .select('user_id')
        .eq('project_id', projectId)
        .not('user_id', 'is', null)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (rError) {
        console.error('Error fetching existing resources:', rError);
        throw rError;
      }

      const existingUserIds = new Set(existingResources?.map(r => r.user_id) || []);

      // Filter to users without resource records and merge with profile data
      return userProjects
        .filter(up => !existingUserIds.has(up.user_id))
        .map(up => {
          const profile = profileMap.get(up.user_id);
          return {
            user_id: up.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            project_role: up.role
          };
        })
        .filter(u => u.email); // Only return users with email addresses
    } catch (error) {
      console.error('ResourcesService getProjectUsersWithoutResources error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const resourcesService = new ResourcesService();
