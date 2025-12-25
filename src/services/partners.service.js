/**
 * Partners Service
 * 
 * Handles all partner-related data operations.
 * Partners are third-party companies at the ORGANISATION level.
 * They can be assigned to resources across any project in the organisation.
 * 
 * VERSION 2.0 - Migrated from project-level to organisation-level
 * 
 * Usage:
 *   import { partnersService } from '../services';
 *   
 *   const partners = await partnersService.getAllByOrganisation(organisationId);
 *   const partner = await partnersService.create({ organisation_id, name: 'Acme Corp', ... });
 *   const activePartners = await partnersService.getActiveByOrganisation(organisationId);
 */

import { supabase } from '../lib/supabase';
import { getCacheKey, getFromCache, setInCache, invalidateNamespace, CACHE_TTL } from '../lib/cache';

const CACHE_NAMESPACE = 'partners';

class PartnersService {
  constructor() {
    this.tableName = 'partners';
  }

  /**
   * Get all partners for an organisation, ordered by name (with caching)
   * @param {string} organisationId - Organisation UUID
   * @param {boolean} bypassCache - Skip cache and fetch fresh data
   * @returns {Promise<Array>} Array of partners
   */
  async getAllByOrganisation(organisationId, bypassCache = false) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, organisationId, 'all');
    
    if (!bypassCache) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('organisation_id', organisationId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('name', { ascending: true });

    if (error) {
      console.error('Partners getAllByOrganisation error:', error);
      throw error;
    }
    
    setInCache(cacheKey, data || [], CACHE_TTL.LONG);
    return data || [];
  }

  /**
   * Get only active partners for an organisation (with caching)
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Array of active partners
   */
  async getActiveByOrganisation(organisationId) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, organisationId, 'active');
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('is_active', true)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('name', { ascending: true });

    if (error) {
      console.error('Partners getActiveByOrganisation error:', error);
      throw error;
    }
    
    setInCache(cacheKey, data || [], CACHE_TTL.LONG);
    return data || [];
  }

  /**
   * LEGACY: Get all partners for a project (looks up org from project)
   * @deprecated Use getAllByOrganisation instead
   * @param {string} projectId - Project UUID
   * @param {boolean} bypassCache - Skip cache
   * @returns {Promise<Array>} Array of partners
   */
  async getAll(projectId, bypassCache = false) {
    // Look up organisation from project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('organisation_id')
      .eq('id', projectId)
      .limit(1);

    if (projError || !project?.[0]?.organisation_id) {
      console.error('Partners getAll: Could not find project organisation', projError);
      return [];
    }

    return this.getAllByOrganisation(project[0].organisation_id, bypassCache);
  }

  /**
   * LEGACY: Get active partners for a project (looks up org from project)
   * @deprecated Use getActiveByOrganisation instead
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of active partners
   */
  async getActive(projectId) {
    // Look up organisation from project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('organisation_id')
      .eq('id', projectId)
      .limit(1);

    if (projError || !project?.[0]?.organisation_id) {
      console.error('Partners getActive: Could not find project organisation', projError);
      return [];
    }

    return this.getActiveByOrganisation(project[0].organisation_id);
  }

  /**
   * Get a partner by ID
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object|null>} Partner or null
   */
  async getById(partnerId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', partnerId)
        .limit(1);

      if (error) {
        console.error('Partners getById error:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Partners getById failed:', error);
      throw error;
    }
  }

  /**
   * Get partner with their associated resources
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object|null>} Partner with resources
   */
  async getWithResources(partnerId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          resources (
            id,
            name,
            sell_price,
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
   * Get partner summary with resource counts for an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Partners with counts
   */
  async getSummary(organisationId) {
    try {
      const { data: partners, error } = await supabase
        .from(this.tableName)
        .select(`
          id,
          name,
          contact_name,
          contact_email,
          payment_terms,
          is_active,
          created_at,
          resources (id)
        `)
        .eq('organisation_id', organisationId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('name', { ascending: true });

      if (error) {
        console.error('Partners getSummary error:', error);
        throw error;
      }

      // Add resource count
      return (partners || []).map(p => ({
        ...p,
        resource_count: p.resources?.length || 0,
        resources: undefined // Remove nested array
      }));
    } catch (error) {
      console.error('Partners getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Create a new partner with validation
   * @param {Object} partner - Partner data
   * @param {string} partner.organisation_id - Organisation UUID
   * @param {string} partner.name - Partner company name
   * @param {string} [partner.contact_name] - Primary contact name
   * @param {string} [partner.contact_email] - Primary contact email
   * @param {string} [partner.payment_terms] - Payment terms (default: 'Net 30')
   * @param {string} [partner.notes] - Additional notes
   * @returns {Promise<Object>} Created partner
   */
  async create(partner) {
    // Validate required fields
    if (!partner.organisation_id) {
      throw new Error('Organisation ID is required');
    }
    if (!partner.name?.trim()) {
      throw new Error('Partner name is required');
    }

    // Check for duplicate name within organisation
    const existing = await this.findByName(partner.organisation_id, partner.name);
    if (existing) {
      throw new Error(`Partner "${partner.name}" already exists in this organisation`);
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        organisation_id: partner.organisation_id,
        name: partner.name.trim(),
        contact_name: partner.contact_name || null,
        contact_email: partner.contact_email || null,
        payment_terms: partner.payment_terms || 'Net 30',
        notes: partner.notes || null,
        is_active: partner.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Partners create error:', error);
      throw error;
    }
    
    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }
  
  /**
   * Update a partner
   * @param {string} id - Partner UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated partner
   */
  async update(id, updates) {
    // Remove fields that shouldn't be updated directly
    const { id: _id, organisation_id: _org, created_at: _created, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Partners update error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }
  
  /**
   * Soft delete a partner
   * @param {string} id - Partner UUID
   * @param {string} userId - User performing delete
   * @returns {Promise<boolean>} Success
   */
  async delete(id, userId = null) {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', id);

    if (error) {
      console.error('Partners delete error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return true;
  }

  /**
   * Find a partner by name within an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {string} name - Partner name
   * @returns {Promise<Object|null>} Partner or null
   */
  async findByName(organisationId, name) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('organisation_id', organisationId)
        .ilike('name', name.trim())
        .or('is_deleted.is.null,is_deleted.eq.false')
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
   * Get partners for dropdown/select components (organisation-level, with caching)
   * @param {string} organisationId - Organisation UUID
   * @param {boolean} activeOnly - Only return active partners
   * @returns {Promise<Array>} Array of { value, label } objects
   */
  async getForSelectByOrganisation(organisationId, activeOnly = true) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, organisationId, `select-${activeOnly}`);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    const partners = activeOnly 
      ? await this.getActiveByOrganisation(organisationId)
      : await this.getAllByOrganisation(organisationId);

    const result = partners.map(p => ({
      value: p.id,
      label: p.name
    }));
    
    setInCache(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  /**
   * LEGACY: Get partners for dropdown (looks up org from project)
   * @deprecated Use getForSelectByOrganisation instead
   */
  async getForSelect(projectId, activeOnly = true) {
    const { data: project } = await supabase
      .from('projects')
      .select('organisation_id')
      .eq('id', projectId)
      .limit(1);

    if (!project?.[0]?.organisation_id) {
      return [];
    }

    return this.getForSelectByOrganisation(project[0].organisation_id, activeOnly);
  }

  /**
   * Get dependency counts before deleting a partner
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
