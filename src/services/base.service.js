/**
 * Base Service Class
 * 
 * Provides common CRUD operations for all services.
 * All queries are project-scoped for multi-tenancy support.
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

export class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Get all records for a project
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @param {string} options.select - Columns to select (default: '*')
   * @param {Object} options.orderBy - { column: string, ascending: boolean }
   * @param {Object[]} options.filters - Array of { column, operator, value }
   * @returns {Promise<Array>} Array of records
   */
  async getAll(projectId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('project_id', projectId);

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
   * Get a single record by ID
   * @param {string} id - Record UUID
   * @param {Object} options - Query options
   * @param {string} options.select - Columns to select (default: '*')
   * @returns {Promise<Object|null>} Record or null
   */
  async getById(id, options = {}) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id)
        .single();

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

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(record)
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
      // Add updated_at timestamp if the table supports it
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

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
   * Delete a record
   * @param {string} id - Record UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`${this.tableName} delete error:`, error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`${this.tableName} delete failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a record exists
   * @param {string} id - Record UUID
   * @returns {Promise<boolean>} Exists status
   */
  async exists(id) {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

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
   * Count records for a project
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
