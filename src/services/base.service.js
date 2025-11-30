/**
 * Base Service Class
 * 
 * Provides common CRUD operations for all services.
 * All queries are project-scoped for multi-tenancy support.
 * Version 2.0 - Added soft delete support
 * 
 * Usage:
 *   class PartnersService extends BaseService {
 *     constructor() {
 *       super('partners');
 *     }
 *   }
 *   
 *   const partnersService = new PartnersService();
 *   const partners = await partnersService.getAll(projectId);
 */

import { supabase } from '../lib/supabase';
import { sanitizeEntity } from '../lib/sanitize';

export class BaseService {
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.supportsSoftDelete = options.supportsSoftDelete !== false; // Default true
    this.sanitizeConfig = options.sanitizeConfig || null; // Entity type for sanitisation
  }

  /**
   * Get soft delete filter for queries
   * Returns filter that excludes deleted records
   */
  getSoftDeleteFilter() {
    if (!this.supportsSoftDelete) return null;
    return 'is_deleted.is.null,is_deleted.eq.false';
  }

  /**
   * Get all records for a project (excludes soft-deleted by default)
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @param {string} options.select - Columns to select (default: '*')
   * @param {Object} options.orderBy - { column: string, ascending: boolean }
   * @param {Object[]} options.filters - Array of { column, operator, value }
   * @param {boolean} options.includeDeleted - Include soft-deleted records
   * @returns {Promise<Array>} Array of records
   */
  async getAll(projectId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('project_id', projectId);

      // Apply soft delete filter unless explicitly including deleted
      if (this.supportsSoftDelete && !options.includeDeleted) {
        query = query.or(this.getSoftDeleteFilter());
      }

      // Apply additional filters
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          const { column, operator, value } = filter;
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'like':
              query = query.like(column, value);
              break;
            case 'ilike':
              query = query.ilike(column, value);
              break;
            case 'in':
              query = query.in(column, value);
              break;
            case 'is':
              query = query.is(column, value);
              break;
            default:
              query = query.eq(column, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error(`${this.tableName} getAll error:`, error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`${this.tableName} getAll failed:`, error);
      throw error;
    }
  }

  /**
   * Get soft-deleted records only (admin function)
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of deleted records
   */
  async getDeleted(projectId) {
    if (!this.supportsSoftDelete) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error(`${this.tableName} getDeleted error:`, error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`${this.tableName} getDeleted failed:`, error);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   * @param {string} id - Record UUID
   * @param {Object} options - Query options
   * @param {string} options.select - Columns to select (default: '*')
   * @param {boolean} options.includeDeleted - Include soft-deleted records
   * @returns {Promise<Object|null>} Record or null
   */
  async getById(id, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id);

      // Apply soft delete filter unless explicitly including deleted
      if (this.supportsSoftDelete && !options.includeDeleted) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error(`${this.tableName} getById error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`${this.tableName} getById failed:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param {Object} record - Record data (must include project_id)
   * @returns {Promise<Object>} Created record
   */
  async create(record) {
    try {
      if (!record.project_id) {
        throw new Error('project_id is required');
      }

      // Sanitise input if config is provided
      let sanitizedRecord = record;
      if (this.sanitizeConfig) {
        sanitizedRecord = sanitizeEntity(this.sanitizeConfig, record);
      }

      // Ensure soft delete fields are not set on create
      if (this.supportsSoftDelete) {
        delete sanitizedRecord.is_deleted;
        delete sanitizedRecord.deleted_at;
        delete sanitizedRecord.deleted_by;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(sanitizedRecord)
        .select()
        .single();

      if (error) {
        console.error(`${this.tableName} create error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`${this.tableName} create failed:`, error);
      throw error;
    }
  }

  /**
   * Update an existing record
   * @param {string} id - Record UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated record
   */
  async update(id, updates) {
    try {
      // Sanitise input if config is provided
      let sanitizedUpdates = updates;
      if (this.sanitizeConfig) {
        sanitizedUpdates = sanitizeEntity(this.sanitizeConfig, updates);
      }

      // Add updated_at timestamp
      const updateData = {
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      };

      // Don't allow updating soft delete fields through regular update
      delete updateData.is_deleted;
      delete updateData.deleted_at;
      delete updateData.deleted_by;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`${this.tableName} update error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`${this.tableName} update failed:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a record (marks as deleted, preserves data)
   * @param {string} id - Record UUID
   * @param {string} userId - ID of user performing the delete
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, userId = null) {
    try {
      if (this.supportsSoftDelete) {
        // Soft delete - mark as deleted
        const { error } = await supabase
          .from(this.tableName)
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId
          })
          .eq('id', id);

        if (error) {
          console.error(`${this.tableName} soft delete error:`, error);
          throw error;
        }
      } else {
        // Hard delete - permanently remove
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`${this.tableName} delete error:`, error);
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error(`${this.tableName} delete failed:`, error);
      throw error;
    }
  }

  /**
   * Hard delete a record (permanently removes - use with caution)
   * @param {string} id - Record UUID
   * @returns {Promise<boolean>} Success status
   */
  async hardDelete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`${this.tableName} hardDelete error:`, error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`${this.tableName} hardDelete failed:`, error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted record
   * @param {string} id - Record UUID
   * @returns {Promise<Object>} Restored record
   */
  async restore(id) {
    if (!this.supportsSoftDelete) {
      throw new Error('This entity does not support soft delete');
    }

    try {
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
        console.error(`${this.tableName} restore error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`${this.tableName} restore failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a record exists (excludes soft-deleted)
   * @param {string} id - Record UUID
   * @returns {Promise<boolean>} Exists status
   */
  async exists(id) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { count, error } = await query;

      if (error) {
        console.error(`${this.tableName} exists error:`, error);
        throw error;
      }

      return count > 0;
    } catch (error) {
      console.error(`${this.tableName} exists failed:`, error);
      throw error;
    }
  }

  /**
   * Count records for a project (excludes soft-deleted)
   * @param {string} projectId - Project UUID
   * @param {Object[]} filters - Optional filters
   * @returns {Promise<number>} Count
   */
  async count(projectId, filters = []) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      filters.forEach(filter => {
        const { column, operator, value } = filter;
        if (operator === 'eq') {
          query = query.eq(column, value);
        } else if (operator === 'in') {
          query = query.in(column, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        console.error(`${this.tableName} count error:`, error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error(`${this.tableName} count failed:`, error);
      throw error;
    }
  }
}

export default BaseService;
