/**
 * Partners Service
 * 
 * Handles all partner-related data operations.
 * Partners are third-party companies that provide resources to the project.
 * 
 * Usage:
 *   import { partnersService } from '../services';
 *   
 *   const partners = await partnersService.getAll(projectId);
 *   const partner = await partnersService.create({ project_id, name: 'Acme Corp', ... });
 *   const activePartners = await partnersService.getActive(projectId);
 */

import { supabase } from '../lib/supabase';
import { BaseService } from './base.service';

class PartnersService extends BaseService {
  constructor() {
    super('partners');
  }

  /**
   * Get all partners for a project, ordered by name
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of partners
   */
  async getAll(projectId) {
    return super.getAll(projectId, {
      orderBy: { column: 'name', ascending: true }
    });
  }

  /**
   * Get only active partners
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of active partners
   */
  async getActive(projectId) {
    return super.getAll(projectId, {
      filters: [{ column: 'is_active', operator: 'eq', value: true }],
      orderBy: { column: 'name', ascending: true }
    });
  }

  /**
   * Get partner with their associated resources
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object|null>} Partner with resources
   */
  async getWithResources(partnerId) {
    try {
      // Use .limit(1) instead of .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from('partners')
        .select(`
          *,
          resources (
            id,
            name,
            daily_rate,
            cost_price,
            is_active
          )
        `)
        .eq('id', partnerId)
        .limit(1);

      if (error) {
        console.error('Partners getWithResources error:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Partners getWithResources failed:', error);
      throw error;
    }
  }

  /**
   * Get partner summary with resource and expense counts
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Partners with counts
   */
  async getSummary(projectId) {
    try {
      // Get partners with resource count
      const { data: partners, error } = await supabase
        .from('partners')
        .select(`
          id,
          name,
          contact_name,
          contact_email,
          payment_terms,
          is_active,
          created_at
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Partners getSummary error:', error);
        throw error;
      }

      // For each partner, we'd ideally get resource counts
      // This will be enhanced once the resources table has partner_id
      return partners || [];
    } catch (error) {
      console.error('Partners getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Create a new partner with validation
   * @param {Object} partner - Partner data
   * @param {string} partner.project_id - Project UUID
   * @param {string} partner.name - Partner company name
   * @param {string} [partner.contact_name] - Primary contact name
   * @param {string} [partner.contact_email] - Primary contact email
   * @param {string} [partner.payment_terms] - Payment terms (default: 'Net 30')
   * @param {string} [partner.notes] - Additional notes
   * @returns {Promise<Object>} Created partner
   */
  async create(partner) {
    // Validate required fields
    if (!partner.name?.trim()) {
      throw new Error('Partner name is required');
    }

    // Check for duplicate name within project
    const existing = await this.findByName(partner.project_id, partner.name);
    if (existing) {
      throw new Error(`Partner "${partner.name}" already exists`);
    }

    return super.create({
      ...partner,
      name: partner.name.trim(),
      is_active: partner.is_active ?? true,
      payment_terms: partner.payment_terms || 'Net 30'
    });
  }

  /**
   * Find a partner by name within a project
   * @param {string} projectId - Project UUID
   * @param {string} name - Partner name
   * @returns {Promise<Object|null>} Partner or null
   */
  async findByName(projectId, name) {
    try {
      // Use .limit(1) instead of .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('project_id', projectId)
        .ilike('name', name.trim())
        .limit(1);

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Partners findByName failed:', error);
      throw error;
    }
  }

  /**
   * Toggle partner active status
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object>} Updated partner
   */
  async toggleActive(partnerId) {
    const partner = await this.getById(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    return this.update(partnerId, {
      is_active: !partner.is_active
    });
  }

  /**
   * Get partners for dropdown/select components
   * @param {string} projectId - Project UUID
   * @param {boolean} activeOnly - Only return active partners
   * @returns {Promise<Array>} Array of { value, label } objects
   */
  async getForSelect(projectId, activeOnly = true) {
    const partners = activeOnly 
      ? await this.getActive(projectId)
      : await this.getAll(projectId);

    return partners.map(p => ({
      value: p.id,
      label: p.name
    }));
  }

  /**
   * Get dependency counts before deleting a partner
   * Returns counts of resources, timesheets, expenses, and invoices
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object>} Dependency counts and canDelete flag
   */
  async getDependencyCounts(partnerId) {
    try {
      // Get linked resources
      const { data: resources, error: resError } = await supabase
        .from('resources')
        .select('id')
        .eq('partner_id', partnerId)
        .or('is_deleted.is.null,is_deleted.eq.false');
      
      if (resError) throw resError;
      
      const resourceIds = resources?.map(r => r.id) || [];
      let timesheetCount = 0;
      let expenseCount = 0;
      
      // Count timesheets and expenses if resources exist
      if (resourceIds.length > 0) {
        const { count: tsCount, error: tsError } = await supabase
          .from('timesheets')
          .select('*', { count: 'exact', head: true })
          .in('resource_id', resourceIds)
          .or('is_deleted.is.null,is_deleted.eq.false');
        
        if (tsError) throw tsError;
        timesheetCount = tsCount || 0;
        
        const { count: expCount, error: expError } = await supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .in('resource_id', resourceIds)
          .or('is_deleted.is.null,is_deleted.eq.false');
        
        if (expError) throw expError;
        expenseCount = expCount || 0;
      }
      
      // Count invoices
      const { count: invoiceCount, error: invError } = await supabase
        .from('partner_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .or('is_deleted.is.null,is_deleted.eq.false');
      
      if (invError) throw invError;
      
      return {
        resourceCount: resources?.length || 0,
        timesheetCount,
        expenseCount,
        invoiceCount: invoiceCount || 0,
        canDelete: !resources?.length && !invoiceCount
      };
    } catch (error) {
      console.error('PartnersService getDependencyCounts error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const partnersService = new PartnersService();

// Also export the class for testing
export { PartnersService };
