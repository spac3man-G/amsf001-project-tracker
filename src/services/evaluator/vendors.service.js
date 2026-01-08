/**
 * Vendors Service
 * 
 * Handles all vendor-related data operations for the Evaluator tool.
 * Vendors are the organizations being evaluated in the procurement process.
 * This supports the full vendor pipeline from identification through selection.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 5 - Vendor Management (Task 5A.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Vendor status workflow (pipeline stages):
 * identified -> long_list -> short_list -> rfp_issued -> response_received 
 *            -> under_evaluation -> selected/rejected
 */
export const VENDOR_STATUSES = {
  IDENTIFIED: 'identified',
  LONG_LIST: 'long_list',
  SHORT_LIST: 'short_list',
  RFP_ISSUED: 'rfp_issued',
  RESPONSE_RECEIVED: 'response_received',
  UNDER_EVALUATION: 'under_evaluation',
  SELECTED: 'selected',
  REJECTED: 'rejected'
};

export const VENDOR_STATUS_CONFIG = {
  [VENDOR_STATUSES.IDENTIFIED]: {
    label: 'Identified',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Initial vendor identification',
    order: 1
  },
  [VENDOR_STATUSES.LONG_LIST]: {
    label: 'Long List',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    description: 'Added to long list for consideration',
    order: 2
  },
  [VENDOR_STATUSES.SHORT_LIST]: {
    label: 'Short List',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Shortlisted for RFP',
    order: 3
  },
  [VENDOR_STATUSES.RFP_ISSUED]: {
    label: 'RFP Issued',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'RFP sent to vendor',
    order: 4
  },
  [VENDOR_STATUSES.RESPONSE_RECEIVED]: {
    label: 'Response Received',
    color: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Vendor has submitted response',
    order: 5
  },
  [VENDOR_STATUSES.UNDER_EVALUATION]: {
    label: 'Under Evaluation',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    description: 'Currently being evaluated',
    order: 6
  },
  [VENDOR_STATUSES.SELECTED]: {
    label: 'Selected',
    color: '#059669',
    bgColor: '#D1FAE5',
    description: 'Selected as preferred vendor',
    order: 7
  },
  [VENDOR_STATUSES.REJECTED]: {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    description: 'Not proceeding with this vendor',
    order: 8
  }
};

/**
 * Pipeline stages - ordered subset of statuses for Kanban view
 */
export const PIPELINE_STAGES = [
  VENDOR_STATUSES.IDENTIFIED,
  VENDOR_STATUSES.LONG_LIST,
  VENDOR_STATUSES.SHORT_LIST,
  VENDOR_STATUSES.RFP_ISSUED,
  VENDOR_STATUSES.RESPONSE_RECEIVED,
  VENDOR_STATUSES.UNDER_EVALUATION
];

/**
 * Terminal stages (not shown in main pipeline)
 */
export const TERMINAL_STAGES = [
  VENDOR_STATUSES.SELECTED,
  VENDOR_STATUSES.REJECTED
];

export class VendorsService extends EvaluatorBaseService {
  constructor() {
    super('vendors', {
      supportsSoftDelete: true,
      sanitizeConfig: 'vendor'
    });
  }

  // ============================================================================
  // VENDOR CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all vendors with contacts and status info
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of vendors with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('vendors')
        .select(`
          *,
          contacts:vendor_contacts(
            id, user_id, name, email, phone, job_title, is_primary
          ),
          status_changed_by_profile:profiles!status_changed_by(id, full_name, email)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply status filter if provided
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Apply search filter
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply portal filter
      if (options.portalEnabled !== undefined) {
        query = query.eq('portal_enabled', options.portalEnabled);
      }

      // Apply ordering (default by name)
      const orderColumn = options.orderBy?.column || 'name';
      const orderAscending = options.orderBy?.ascending ?? true;
      query = query.order(orderColumn, { ascending: orderAscending });

      const { data, error } = await query;

      if (error) {
        console.error('VendorsService getAllWithDetails error:', error);
        throw error;
      }

      // Compute additional fields
      const vendors = (data || []).map(vendor => ({
        ...vendor,
        contactCount: vendor.contacts?.length || 0,
        primaryContact: vendor.contacts?.find(c => c.is_primary) || null,
        statusConfig: VENDOR_STATUS_CONFIG[vendor.status] || {}
      }));

      return vendors;
    } catch (error) {
      console.error('VendorsService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get a single vendor by ID with full details
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object|null>} Vendor with full details
   */
  async getByIdWithDetails(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          contacts:vendor_contacts(
            id, user_id, name, email, phone, job_title, is_primary, created_at
          ),
          status_changed_by_profile:profiles!status_changed_by(id, full_name, email),
          documents:vendor_documents(
            id, name, document_type, file_url, file_size, mime_type, uploaded_at
          )
        `)
        .eq('id', vendorId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) {
        console.error('VendorsService getByIdWithDetails error:', error);
        throw error;
      }

      if (!data?.[0]) return null;

      const vendor = data[0];
      return {
        ...vendor,
        contactCount: vendor.contacts?.length || 0,
        primaryContact: vendor.contacts?.find(c => c.is_primary) || null,
        documentCount: vendor.documents?.length || 0,
        statusConfig: VENDOR_STATUS_CONFIG[vendor.status] || {}
      };
    } catch (error) {
      console.error('VendorsService getByIdWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create a new vendor
   * @param {Object} vendorData - Vendor data
   * @returns {Promise<Object>} Created vendor
   */
  async createVendor(vendorData) {
    try {
      if (!vendorData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }
      if (!vendorData.name) {
        throw new Error('name is required');
      }

      const dataToCreate = {
        evaluation_project_id: vendorData.evaluation_project_id,
        name: vendorData.name,
        description: vendorData.description || null,
        website: vendorData.website || null,
        status: vendorData.status || VENDOR_STATUSES.IDENTIFIED,
        status_changed_at: new Date().toISOString(),
        status_changed_by: vendorData.created_by || null,
        portal_enabled: false,
        notes: vendorData.notes || null
      };

      return this.create(dataToCreate);
    } catch (error) {
      console.error('VendorsService createVendor failed:', error);
      throw error;
    }
  }

  /**
   * Update a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated vendor
   */
  async updateVendor(vendorId, updates) {
    try {
      const allowedFields = [
        'name', 'description', 'website', 'notes',
        'portal_enabled', 'portal_access_expires_at'
      ];

      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      return this.update(vendorId, filteredUpdates);
    } catch (error) {
      console.error('VendorsService updateVendor failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT & PIPELINE
  // ============================================================================

  /**
   * Get valid status transitions from current status
   * @param {string} currentStatus - Current vendor status
   * @returns {Array<string>} Array of valid next statuses
   */
  getValidTransitions(currentStatus) {
    const transitions = {
      [VENDOR_STATUSES.IDENTIFIED]: [VENDOR_STATUSES.LONG_LIST, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.LONG_LIST]: [VENDOR_STATUSES.SHORT_LIST, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.SHORT_LIST]: [VENDOR_STATUSES.RFP_ISSUED, VENDOR_STATUSES.LONG_LIST, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.RFP_ISSUED]: [VENDOR_STATUSES.RESPONSE_RECEIVED, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.RESPONSE_RECEIVED]: [VENDOR_STATUSES.UNDER_EVALUATION, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.UNDER_EVALUATION]: [VENDOR_STATUSES.SELECTED, VENDOR_STATUSES.REJECTED],
      [VENDOR_STATUSES.SELECTED]: [], // Terminal state
      [VENDOR_STATUSES.REJECTED]: [VENDOR_STATUSES.IDENTIFIED] // Can reactivate
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Check if status transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} True if transition is valid
   */
  isValidStatusTransition(fromStatus, toStatus) {
    return this.getValidTransitions(fromStatus).includes(toStatus);
  }

  /**
   * Update vendor status with history tracking
   * @param {string} vendorId - Vendor UUID
   * @param {string} newStatus - Target status
   * @param {string} userId - User making the change
   * @param {string} notes - Optional notes about the transition
   * @returns {Promise<Object>} Updated vendor
   */
  async updateStatus(vendorId, newStatus, userId, notes = null) {
    try {
      const current = await this.getById(vendorId);
      if (!current) {
        throw new Error('Vendor not found');
      }

      if (!this.isValidStatusTransition(current.status, newStatus)) {
        throw new Error(`Cannot transition from ${current.status} to ${newStatus}`);
      }

      // Update vendor status
      const updates = {
        status: newStatus,
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId
      };

      // Append transition note if provided
      if (notes) {
        const existingNotes = current.notes || '';
        const timestamp = new Date().toLocaleDateString();
        const statusLabel = VENDOR_STATUS_CONFIG[newStatus]?.label || newStatus;
        updates.notes = existingNotes 
          ? `${existingNotes}\n\n[${timestamp}] Status changed to ${statusLabel}: ${notes}`
          : `[${timestamp}] Status changed to ${statusLabel}: ${notes}`;
      }

      const { data, error } = await supabase
        .from('vendors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select();

      if (error) throw error;

      return data?.[0];
    } catch (error) {
      console.error('VendorsService updateStatus failed:', error);
      throw error;
    }
  }

  /**
   * Move vendor to long list
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated vendor
   */
  async addToLongList(vendorId, userId) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.LONG_LIST, userId);
  }

  /**
   * Move vendor to short list
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated vendor
   */
  async addToShortList(vendorId, userId) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.SHORT_LIST, userId);
  }

  /**
   * Mark RFP as issued to vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated vendor
   */
  async markRfpIssued(vendorId, userId) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.RFP_ISSUED, userId);
  }

  /**
   * Mark response as received from vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated vendor
   */
  async markResponseReceived(vendorId, userId) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.RESPONSE_RECEIVED, userId);
  }

  /**
   * Begin evaluation of vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated vendor
   */
  async startEvaluation(vendorId, userId) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.UNDER_EVALUATION, userId);
  }

  /**
   * Select vendor as preferred
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @param {string} notes - Selection notes
   * @returns {Promise<Object>} Updated vendor
   */
  async selectVendor(vendorId, userId, notes = null) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.SELECTED, userId, notes);
  }

  /**
   * Reject vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User making the change
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated vendor
   */
  async rejectVendor(vendorId, userId, reason = null) {
    return this.updateStatus(vendorId, VENDOR_STATUSES.REJECTED, userId, reason);
  }

  // ============================================================================
  // CONTACT MANAGEMENT
  // ============================================================================

  /**
   * Get contacts for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Array>} Array of contacts
   */
  async getContacts(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_contacts')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('VendorsService getContacts error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('VendorsService getContacts failed:', error);
      throw error;
    }
  }

  /**
   * Add a contact to a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} contactData - Contact details
   * @returns {Promise<Object>} Created contact
   */
  async addContact(vendorId, contactData) {
    try {
      if (!contactData.name && !contactData.email) {
        throw new Error('At least name or email is required');
      }

      // If this is primary, unset other primaries first
      if (contactData.is_primary) {
        await supabase
          .from('vendor_contacts')
          .update({ is_primary: false })
          .eq('vendor_id', vendorId);
      }

      const dataToInsert = {
        vendor_id: vendorId,
        user_id: contactData.user_id || null,
        name: contactData.name || null,
        email: contactData.email || null,
        phone: contactData.phone || null,
        job_title: contactData.job_title || contactData.role || null,
        is_primary: contactData.is_primary || false
      };

      const { data, error } = await supabase
        .from('vendor_contacts')
        .insert(dataToInsert)
        .select();

      if (error) {
        console.error('VendorsService addContact error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('VendorsService addContact failed:', error);
      throw error;
    }
  }

  /**
   * Update a contact
   * @param {string} contactId - Contact UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated contact
   */
  async updateContact(contactId, updates) {
    try {
      // If setting as primary, unset others first
      if (updates.is_primary) {
        const { data: current } = await supabase
          .from('vendor_contacts')
          .select('vendor_id')
          .eq('id', contactId)
          .limit(1);

        if (current?.[0]?.vendor_id) {
          await supabase
            .from('vendor_contacts')
            .update({ is_primary: false })
            .eq('vendor_id', current[0].vendor_id);
        }
      }

      const allowedFields = ['name', 'email', 'phone', 'job_title', 'is_primary'];
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const { data, error } = await supabase
        .from('vendor_contacts')
        .update(filteredUpdates)
        .eq('id', contactId)
        .select();

      if (error) {
        console.error('VendorsService updateContact error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('VendorsService updateContact failed:', error);
      throw error;
    }
  }

  /**
   * Remove a contact
   * @param {string} contactId - Contact UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeContact(contactId) {
    try {
      const { error } = await supabase
        .from('vendor_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('VendorsService removeContact error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('VendorsService removeContact failed:', error);
      throw error;
    }
  }

  /**
   * Set primary contact for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} contactId - Contact UUID to make primary
   * @returns {Promise<Object>} Updated contact
   */
  async setPrimaryContact(vendorId, contactId) {
    try {
      // Unset all primaries for this vendor
      await supabase
        .from('vendor_contacts')
        .update({ is_primary: false })
        .eq('vendor_id', vendorId);

      // Set the new primary
      const { data, error } = await supabase
        .from('vendor_contacts')
        .update({ is_primary: true })
        .eq('id', contactId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VendorsService setPrimaryContact failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PORTAL ACCESS MANAGEMENT
  // ============================================================================

  /**
   * Generate portal access code for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {number} expiresInDays - Days until code expires (default 30)
   * @returns {Promise<Object>} Updated vendor with access code
   */
  async generatePortalAccessCode(vendorId, expiresInDays = 30) {
    try {
      // Generate a random access code
      const accessCode = this.generateAccessCode();
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from('vendors')
        .update({
          portal_enabled: true,
          portal_access_code: accessCode,
          portal_access_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VendorsService generatePortalAccessCode failed:', error);
      throw error;
    }
  }

  /**
   * Generate a random access code
   * @returns {string} Access code
   */
  generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding easily confused chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Revoke portal access for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Updated vendor
   */
  async revokePortalAccess(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          portal_enabled: false,
          portal_access_code: null,
          portal_access_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VendorsService revokePortalAccess failed:', error);
      throw error;
    }
  }

  /**
   * Verify portal access code
   * @param {string} accessCode - Access code to verify
   * @returns {Promise<Object|null>} Vendor if code is valid, null otherwise
   */
  async verifyPortalAccess(accessCode) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('portal_access_code', accessCode)
        .eq('portal_enabled', true)
        .gte('portal_access_expires_at', new Date().toISOString())
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('VendorsService verifyPortalAccess failed:', error);
      throw error;
    }
  }

  /**
   * Extend portal access expiration
   * @param {string} vendorId - Vendor UUID
   * @param {number} additionalDays - Days to add
   * @returns {Promise<Object>} Updated vendor
   */
  async extendPortalAccess(vendorId, additionalDays = 14) {
    try {
      const vendor = await this.getById(vendorId);
      if (!vendor) throw new Error('Vendor not found');

      let newExpiry;
      if (vendor.portal_access_expires_at) {
        newExpiry = new Date(vendor.portal_access_expires_at);
      } else {
        newExpiry = new Date();
      }
      newExpiry.setDate(newExpiry.getDate() + additionalDays);

      const { data, error } = await supabase
        .from('vendors')
        .update({
          portal_access_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VendorsService extendPortalAccess failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PIPELINE & STATISTICS
  // ============================================================================

  /**
   * Get vendors grouped by pipeline stage
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Vendors grouped by status
   */
  async getByPipeline(evaluationProjectId) {
    try {
      const vendors = await this.getAllWithDetails(evaluationProjectId);

      // Initialize all stages with empty arrays
      const pipeline = {};
      Object.values(VENDOR_STATUSES).forEach(status => {
        pipeline[status] = [];
      });

      // Group vendors by status
      vendors.forEach(vendor => {
        if (pipeline[vendor.status]) {
          pipeline[vendor.status].push(vendor);
        }
      });

      return pipeline;
    } catch (error) {
      console.error('VendorsService getByPipeline failed:', error);
      throw error;
    }
  }

  /**
   * Get vendor summary statistics for dashboard
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(evaluationProjectId) {
    try {
      const vendors = await this.getAllWithDetails(evaluationProjectId);

      const byStatus = {};
      Object.values(VENDOR_STATUSES).forEach(status => {
        byStatus[status] = 0;
      });

      let totalContacts = 0;
      let portalEnabled = 0;

      vendors.forEach(vendor => {
        if (byStatus[vendor.status] !== undefined) {
          byStatus[vendor.status]++;
        }
        totalContacts += vendor.contactCount || 0;
        if (vendor.portal_enabled) portalEnabled++;
      });

      return {
        total: vendors.length,
        byStatus,
        inPipeline: PIPELINE_STAGES.reduce((sum, status) => sum + (byStatus[status] || 0), 0),
        shortlisted: byStatus[VENDOR_STATUSES.SHORT_LIST] || 0,
        awaitingResponse: byStatus[VENDOR_STATUSES.RFP_ISSUED] || 0,
        underEvaluation: byStatus[VENDOR_STATUSES.UNDER_EVALUATION] || 0,
        selected: byStatus[VENDOR_STATUSES.SELECTED] || 0,
        rejected: byStatus[VENDOR_STATUSES.REJECTED] || 0,
        totalContacts,
        portalEnabled
      };
    } catch (error) {
      console.error('VendorsService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get recently updated vendors
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array>} Array of recent vendors
   */
  async getRecent(evaluationProjectId, limit = 5) {
    return this.getAllWithDetails(evaluationProjectId, {
      orderBy: { column: 'updated_at', ascending: false }
    }).then(vendors => vendors.slice(0, limit));
  }

  /**
   * Search vendors by name or description
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching vendors
   */
  async search(evaluationProjectId, searchTerm) {
    return this.getAllWithDetails(evaluationProjectId, {
      search: searchTerm
    });
  }

  /**
   * Export vendors data for report
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Flat array suitable for export
   */
  async exportForReport(evaluationProjectId) {
    try {
      const vendors = await this.getAllWithDetails(evaluationProjectId);

      return vendors.map(vendor => ({
        name: vendor.name,
        description: vendor.description || '',
        website: vendor.website || '',
        status: vendor.status,
        status_label: VENDOR_STATUS_CONFIG[vendor.status]?.label || vendor.status,
        primary_contact_name: vendor.primaryContact?.name || '',
        primary_contact_email: vendor.primaryContact?.email || '',
        contact_count: vendor.contactCount,
        portal_enabled: vendor.portal_enabled ? 'Yes' : 'No',
        created_at: vendor.created_at,
        updated_at: vendor.updated_at
      }));
    } catch (error) {
      console.error('VendorsService exportForReport failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vendorsService = new VendorsService();
export default vendorsService;
