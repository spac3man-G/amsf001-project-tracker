/**
 * Workflow Service
 * 
 * Centralised service for fetching all pending workflow items across entity types.
 * Provides role-based filtering and accurate timestamps for notifications.
 * 
 * Workflow Categories (13 total):
 * - Timesheets: Submitted for approval
 * - Expenses: Chargeable (customer validates) and non-chargeable (supplier validates)
 * - Deliverables: Review, supplier sign-off, customer sign-off
 * - Variations: Submitted, awaiting supplier, awaiting customer
 * - Certificates: Pending supplier signature, pending customer signature
 * - Baselines: Awaiting supplier signature, awaiting customer signature
 * 
 * @version 1.0
 * @created 16 December 2025
 * @phase Workflow System Enhancement
 */

import { supabase } from '../lib/supabase';

// Role constants
export const ROLES = {
  SUPPLIER_PM: 'Supplier PM',
  CUSTOMER_PM: 'Customer PM',
  ADMIN: 'Admin'
};

// Workflow category definitions
export const WORKFLOW_CATEGORIES = {
  // Timesheets
  TIMESHEET: {
    id: 'timesheet',
    label: 'Timesheet Approval',
    entity: 'timesheets',
    group: 'timesheets',
    icon: 'Clock',
    color: '#3b82f6',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },

  // Expenses
  EXPENSE_CHARGEABLE: {
    id: 'expense_chargeable',
    label: 'Expense Validation (Chargeable)',
    entity: 'expenses',
    group: 'expenses',
    icon: 'Receipt',
    color: '#10b981',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },
  EXPENSE_NON_CHARGEABLE: {
    id: 'expense_non_chargeable',
    label: 'Expense Validation (Non-Chargeable)',
    entity: 'expenses',
    group: 'expenses',
    icon: 'Receipt',
    color: '#10b981',
    actionableBy: [ROLES.SUPPLIER_PM, ROLES.ADMIN]
  },

  // Deliverables
  DELIVERABLE_REVIEW: {
    id: 'deliverable_review',
    label: 'Deliverable Review',
    entity: 'deliverables',
    group: 'deliverables',
    icon: 'FileText',
    color: '#f59e0b',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },
  DELIVERABLE_SIGN_SUPPLIER: {
    id: 'deliverable_sign_supplier',
    label: 'Deliverable Sign-off (Supplier)',
    entity: 'deliverables',
    group: 'deliverables',
    icon: 'FileText',
    color: '#f59e0b',
    actionableBy: [ROLES.SUPPLIER_PM, ROLES.ADMIN]
  },
  DELIVERABLE_SIGN_CUSTOMER: {
    id: 'deliverable_sign_customer',
    label: 'Deliverable Sign-off (Customer)',
    entity: 'deliverables',
    group: 'deliverables',
    icon: 'FileText',
    color: '#f59e0b',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },

  // Variations
  VARIATION_SUBMITTED: {
    id: 'variation_submitted',
    label: 'Variation Review',
    entity: 'variations',
    group: 'variations',
    icon: 'GitBranch',
    color: '#8b5cf6',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },
  VARIATION_AWAITING_SUPPLIER: {
    id: 'variation_awaiting_supplier',
    label: 'Variation Signature (Supplier)',
    entity: 'variations',
    group: 'variations',
    icon: 'GitBranch',
    color: '#8b5cf6',
    actionableBy: [ROLES.SUPPLIER_PM, ROLES.ADMIN]
  },
  VARIATION_AWAITING_CUSTOMER: {
    id: 'variation_awaiting_customer',
    label: 'Variation Signature (Customer)',
    entity: 'variations',
    group: 'variations',
    icon: 'GitBranch',
    color: '#8b5cf6',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },

  // Certificates
  CERTIFICATE_PENDING_SUPPLIER: {
    id: 'certificate_pending_supplier',
    label: 'Certificate Signature (Supplier)',
    entity: 'milestone_certificates',
    group: 'certificates',
    icon: 'Award',
    color: '#ec4899',
    actionableBy: [ROLES.SUPPLIER_PM, ROLES.ADMIN]
  },
  CERTIFICATE_PENDING_CUSTOMER: {
    id: 'certificate_pending_customer',
    label: 'Certificate Signature (Customer)',
    entity: 'milestone_certificates',
    group: 'certificates',
    icon: 'Award',
    color: '#ec4899',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  },

  // Baselines
  BASELINE_AWAITING_SUPPLIER: {
    id: 'baseline_awaiting_supplier',
    label: 'Baseline Signature (Supplier)',
    entity: 'milestones',
    group: 'baselines',
    icon: 'Lock',
    color: '#06b6d4',
    actionableBy: [ROLES.SUPPLIER_PM, ROLES.ADMIN]
  },
  BASELINE_AWAITING_CUSTOMER: {
    id: 'baseline_awaiting_customer',
    label: 'Baseline Signature (Customer)',
    entity: 'milestones',
    group: 'baselines',
    icon: 'Lock',
    color: '#06b6d4',
    actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
  }
};

/**
 * Calculate days pending from a timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {number} Number of days since timestamp
 */
function calculateDaysPending(timestamp) {
  if (!timestamp) return 0;
  const submitDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now - submitDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine urgency level based on days pending
 * @param {number} days - Days pending
 * @returns {'low' | 'medium' | 'high' | 'critical'} Urgency level
 */
function getUrgencyLevel(days) {
  if (days >= 7) return 'critical';
  if (days >= 5) return 'high';
  if (days >= 3) return 'medium';
  return 'low';
}

export class WorkflowService {
  constructor() {
    this.categories = WORKFLOW_CATEGORIES;
  }

  /**
   * Get all pending workflow items for a project
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @param {string[]} options.categories - Filter to specific categories
   * @param {boolean} options.includeUrgentOnly - Only include items pending 5+ days
   * @returns {Promise<Array>} Array of workflow items
   */
  async getAllPendingItems(projectId, options = {}) {
    try {
      const results = await Promise.all([
        this.fetchTimesheets(projectId),
        this.fetchExpenses(projectId),
        this.fetchDeliverables(projectId),
        this.fetchVariations(projectId),
        this.fetchCertificates(projectId),
        this.fetchBaselines(projectId)
      ]);

      // Flatten all results
      let items = results.flat();

      // Filter by categories if specified
      if (options.categories && options.categories.length > 0) {
        items = items.filter(item => options.categories.includes(item.category));
      }

      // Filter by urgency if specified
      if (options.includeUrgentOnly) {
        items = items.filter(item => item.daysPending >= 5);
      }

      // Sort by timestamp (oldest first - most urgent)
      items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return items;
    } catch (error) {
      console.error('WorkflowService getAllPendingItems error:', error);
      throw error;
    }
  }

  /**
   * Get workflow items that a specific role can act on
   * @param {string} projectId - Project UUID
   * @param {string} role - User role (Supplier PM, Customer PM, Admin)
   * @returns {Promise<Array>} Array of actionable workflow items
   */
  async getItemsForRole(projectId, role) {
    try {
      const allItems = await this.getAllPendingItems(projectId);
      return allItems.filter(item => {
        const category = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === item.category);
        return category?.actionableBy.includes(role);
      });
    } catch (error) {
      console.error('WorkflowService getItemsForRole error:', error);
      throw error;
    }
  }

  /**
   * Get workflow items visible to a role (all items, but marked if actionable)
   * @param {string} projectId - Project UUID
   * @param {string} role - User role
   * @returns {Promise<Array>} Array of workflow items with canAct flag
   */
  async getItemsVisibleToRole(projectId, role) {
    try {
      const allItems = await this.getAllPendingItems(projectId);
      return allItems.map(item => {
        const category = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === item.category);
        const canAct = category?.actionableBy.includes(role) || false;
        return { ...item, canAct };
      });
    } catch (error) {
      console.error('WorkflowService getItemsVisibleToRole error:', error);
      throw error;
    }
  }

  /**
   * Get counts of pending items by category
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Counts by category and group
   */
  async getCountsByCategory(projectId) {
    try {
      const allItems = await this.getAllPendingItems(projectId);

      const counts = {
        total: allItems.length,
        urgent: allItems.filter(i => i.daysPending >= 5).length,
        byCategory: {},
        byGroup: {
          timesheets: 0,
          expenses: 0,
          deliverables: 0,
          variations: 0,
          certificates: 0,
          baselines: 0
        }
      };

      // Count by category
      Object.values(WORKFLOW_CATEGORIES).forEach(cat => {
        counts.byCategory[cat.id] = allItems.filter(i => i.category === cat.id).length;
      });

      // Count by group
      allItems.forEach(item => {
        const category = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === item.category);
        if (category?.group) {
          counts.byGroup[category.group]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('WorkflowService getCountsByCategory error:', error);
      throw error;
    }
  }

  /**
   * Get urgent items (pending 5+ days)
   * @param {string} projectId - Project UUID
   * @param {number} daysThreshold - Days threshold for urgency (default: 5)
   * @returns {Promise<Array>} Array of urgent workflow items
   */
  async getUrgentItems(projectId, daysThreshold = 5) {
    try {
      const allItems = await this.getAllPendingItems(projectId);
      return allItems.filter(item => item.daysPending >= daysThreshold);
    } catch (error) {
      console.error('WorkflowService getUrgentItems error:', error);
      throw error;
    }
  }

  // ==================== Entity Fetch Methods ====================

  /**
   * Fetch submitted timesheets
   */
  async fetchTimesheets(projectId) {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          id,
          submitted_date,
          hours_worked,
          date,
          status,
          resource_id,
          user_id,
          resources(id, name)
        `)
        .eq('project_id', projectId)
        .eq('status', 'Submitted')
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      return (data || []).map(ts => {
        const timestamp = ts.submitted_date || ts.date;
        const daysPending = calculateDaysPending(timestamp);
        return {
          id: ts.id,
          category: WORKFLOW_CATEGORIES.TIMESHEET.id,
          type: 'timesheet',
          title: `Timesheet: ${ts.resources?.name || 'Unknown Resource'}`,
          description: `${ts.hours_worked} hours on ${ts.date}`,
          status: ts.status,
          timestamp,
          daysPending,
          urgency: getUrgencyLevel(daysPending),
          resourceName: ts.resources?.name,
          resourceId: ts.resource_id,
          userId: ts.user_id,
          actionUrl: `/timesheets?highlight=${ts.id}`,
          icon: WORKFLOW_CATEGORIES.TIMESHEET.icon,
          color: WORKFLOW_CATEGORIES.TIMESHEET.color
        };
      });
    } catch (error) {
      console.error('WorkflowService fetchTimesheets error:', error);
      return [];
    }
  }

  /**
   * Fetch submitted expenses (both chargeable and non-chargeable)
   */
  async fetchExpenses(projectId) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          submitted_date,
          expense_date,
          reason,
          amount,
          status,
          chargeable_to_customer,
          resource_name,
          created_by
        `)
        .eq('project_id', projectId)
        .eq('status', 'Submitted')
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      return (data || []).map(exp => {
        const isChargeable = exp.chargeable_to_customer === true;
        const category = isChargeable 
          ? WORKFLOW_CATEGORIES.EXPENSE_CHARGEABLE 
          : WORKFLOW_CATEGORIES.EXPENSE_NON_CHARGEABLE;
        const timestamp = exp.submitted_date || exp.expense_date;
        const daysPending = calculateDaysPending(timestamp);

        return {
          id: exp.id,
          category: category.id,
          type: 'expense',
          title: `Expense: ${exp.reason || 'No description'}`,
          description: `£${parseFloat(exp.amount || 0).toFixed(2)} - ${exp.resource_name || 'Unknown'}`,
          status: exp.status,
          timestamp,
          daysPending,
          urgency: getUrgencyLevel(daysPending),
          resourceName: exp.resource_name,
          isChargeable,
          amount: exp.amount,
          userId: exp.created_by,
          actionUrl: `/expenses?highlight=${exp.id}`,
          icon: category.icon,
          color: category.color
        };
      });
    } catch (error) {
      console.error('WorkflowService fetchExpenses error:', error);
      return [];
    }
  }

  /**
   * Fetch deliverables awaiting review or sign-off
   */
  async fetchDeliverables(projectId) {
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .select(`
          id,
          deliverable_ref,
          name,
          status,
          sign_off_status,
          updated_at,
          supplier_pm_signed_at,
          customer_pm_signed_at
        `)
        .eq('project_id', projectId)
        .in('status', ['Submitted for Review', 'Review Complete'])
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      const items = [];

      (data || []).forEach(del => {
        const timestamp = del.updated_at;
        const daysPending = calculateDaysPending(timestamp);

        // Submitted for Review - Customer PM needs to review
        if (del.status === 'Submitted for Review') {
          items.push({
            id: del.id,
            category: WORKFLOW_CATEGORIES.DELIVERABLE_REVIEW.id,
            type: 'deliverable',
            title: `Review: ${del.deliverable_ref || del.name}`,
            description: del.name,
            status: del.status,
            timestamp,
            daysPending,
            urgency: getUrgencyLevel(daysPending),
            deliverableRef: del.deliverable_ref,
            actionUrl: `/deliverables?highlight=${del.id}`,
            icon: WORKFLOW_CATEGORIES.DELIVERABLE_REVIEW.icon,
            color: WORKFLOW_CATEGORIES.DELIVERABLE_REVIEW.color
          });
        }

        // Review Complete - may need sign-offs
        if (del.status === 'Review Complete') {
          // Supplier sign-off needed
          if (!del.supplier_pm_signed_at) {
            items.push({
              id: `${del.id}_supplier_sign`,
              entityId: del.id,
              category: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_SUPPLIER.id,
              type: 'deliverable_signoff',
              title: `Sign-off: ${del.deliverable_ref || del.name}`,
              description: `${del.name} - Awaiting Supplier PM signature`,
              status: del.sign_off_status || 'Awaiting Supplier',
              timestamp,
              daysPending,
              urgency: getUrgencyLevel(daysPending),
              deliverableRef: del.deliverable_ref,
              actionUrl: `/deliverables?highlight=${del.id}`,
              icon: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_SUPPLIER.icon,
              color: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_SUPPLIER.color
            });
          }

          // Customer sign-off needed
          if (!del.customer_pm_signed_at) {
            items.push({
              id: `${del.id}_customer_sign`,
              entityId: del.id,
              category: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_CUSTOMER.id,
              type: 'deliverable_signoff',
              title: `Sign-off: ${del.deliverable_ref || del.name}`,
              description: `${del.name} - Awaiting Customer PM signature`,
              status: del.sign_off_status || 'Awaiting Customer',
              timestamp,
              daysPending,
              urgency: getUrgencyLevel(daysPending),
              deliverableRef: del.deliverable_ref,
              actionUrl: `/deliverables?highlight=${del.id}`,
              icon: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_CUSTOMER.icon,
              color: WORKFLOW_CATEGORIES.DELIVERABLE_SIGN_CUSTOMER.color
            });
          }
        }
      });

      return items;
    } catch (error) {
      console.error('WorkflowService fetchDeliverables error:', error);
      return [];
    }
  }

  /**
   * Fetch variations awaiting action
   */
  async fetchVariations(projectId) {
    try {
      const { data, error } = await supabase
        .from('variations')
        .select(`
          id,
          variation_ref,
          title,
          status,
          variation_type,
          created_at,
          total_cost_impact,
          total_days_impact
        `)
        .eq('project_id', projectId)
        .in('status', ['submitted', 'awaiting_supplier', 'awaiting_customer'])
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      return (data || []).map(v => {
        const timestamp = v.created_at;
        const daysPending = calculateDaysPending(timestamp);

        // Determine category based on status
        let category;
        switch (v.status) {
          case 'submitted':
            category = WORKFLOW_CATEGORIES.VARIATION_SUBMITTED;
            break;
          case 'awaiting_supplier':
            category = WORKFLOW_CATEGORIES.VARIATION_AWAITING_SUPPLIER;
            break;
          case 'awaiting_customer':
            category = WORKFLOW_CATEGORIES.VARIATION_AWAITING_CUSTOMER;
            break;
          default:
            category = WORKFLOW_CATEGORIES.VARIATION_SUBMITTED;
        }

        // Build description with impact info
        let description = v.title || 'No title';
        if (v.total_cost_impact || v.total_days_impact) {
          const impacts = [];
          if (v.total_cost_impact) impacts.push(`£${v.total_cost_impact.toLocaleString()}`);
          if (v.total_days_impact) impacts.push(`${v.total_days_impact} days`);
          description += ` (${impacts.join(', ')})`;
        }

        return {
          id: v.id,
          category: category.id,
          type: 'variation',
          title: `Variation: ${v.variation_ref || 'Draft'}`,
          description,
          status: v.status,
          timestamp,
          daysPending,
          urgency: getUrgencyLevel(daysPending),
          variationRef: v.variation_ref,
          variationType: v.variation_type,
          costImpact: v.total_cost_impact,
          daysImpact: v.total_days_impact,
          actionUrl: `/variations?highlight=${v.id}`,
          icon: category.icon,
          color: category.color
        };
      });
    } catch (error) {
      console.error('WorkflowService fetchVariations error:', error);
      return [];
    }
  }

  /**
   * Fetch milestone certificates awaiting signatures
   */
  async fetchCertificates(projectId) {
    try {
      const { data, error } = await supabase
        .from('milestone_certificates')
        .select(`
          id,
          milestone_id,
          certificate_number,
          status,
          created_at,
          supplier_pm_signed_at,
          customer_pm_signed_at,
          milestones(id, milestone_ref, name)
        `)
        .eq('project_id', projectId)
        .in('status', ['Draft', 'Submitted', 'Pending Supplier Signature', 'Pending Customer Signature']);

      if (error) throw error;

      const items = [];

      (data || []).forEach(cert => {
        const timestamp = cert.created_at;
        const daysPending = calculateDaysPending(timestamp);
        const milestoneName = cert.milestones?.name || cert.milestones?.milestone_ref || 'Unknown Milestone';

        // Pending Supplier Signature
        if (cert.status === 'Pending Supplier Signature') {
          items.push({
            id: cert.id,
            category: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_SUPPLIER.id,
            type: 'certificate',
            title: `Certificate: ${milestoneName}`,
            description: `${cert.certificate_number || 'Draft'} - Awaiting Supplier PM signature`,
            status: cert.status,
            timestamp,
            daysPending,
            urgency: getUrgencyLevel(daysPending),
            milestoneId: cert.milestone_id,
            milestoneName,
            certificateNumber: cert.certificate_number,
            actionUrl: `/milestones/${cert.milestone_id}`,
            icon: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_SUPPLIER.icon,
            color: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_SUPPLIER.color
          });
        }

        // Pending Customer Signature (includes Submitted status)
        if (cert.status === 'Pending Customer Signature' || cert.status === 'Submitted') {
          items.push({
            id: cert.id,
            category: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_CUSTOMER.id,
            type: 'certificate',
            title: `Certificate: ${milestoneName}`,
            description: `${cert.certificate_number || 'Draft'} - Awaiting Customer PM signature`,
            status: cert.status,
            timestamp,
            daysPending,
            urgency: getUrgencyLevel(daysPending),
            milestoneId: cert.milestone_id,
            milestoneName,
            certificateNumber: cert.certificate_number,
            actionUrl: `/milestones/${cert.milestone_id}`,
            icon: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_CUSTOMER.icon,
            color: WORKFLOW_CATEGORIES.CERTIFICATE_PENDING_CUSTOMER.color
          });
        }
      });

      return items;
    } catch (error) {
      console.error('WorkflowService fetchCertificates error:', error);
      return [];
    }
  }

  /**
   * Fetch milestone baselines awaiting signatures
   */
  async fetchBaselines(projectId) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select(`
          id,
          milestone_ref,
          name,
          baseline_locked,
          baseline_supplier_pm_signed_at,
          baseline_customer_pm_signed_at,
          baseline_start_date,
          baseline_end_date,
          updated_at,
          created_at
        `)
        .eq('project_id', projectId)
        .or('baseline_locked.is.null,baseline_locked.eq.false')
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      const items = [];

      (data || []).forEach(m => {
        // Skip if baseline is locked (fully signed)
        if (m.baseline_locked === true) return;

        // Skip if no baseline dates set (no baseline to sign)
        if (!m.baseline_start_date && !m.baseline_end_date) return;

        const timestamp = m.updated_at || m.created_at;
        const daysPending = calculateDaysPending(timestamp);

        // Supplier needs to sign
        if (!m.baseline_supplier_pm_signed_at) {
          items.push({
            id: `${m.id}_baseline_supplier`,
            entityId: m.id,
            category: WORKFLOW_CATEGORIES.BASELINE_AWAITING_SUPPLIER.id,
            type: 'baseline',
            title: `Baseline: ${m.milestone_ref || m.name}`,
            description: `${m.name} - Awaiting Supplier PM signature`,
            status: 'Awaiting Supplier',
            timestamp,
            daysPending,
            urgency: getUrgencyLevel(daysPending),
            milestoneId: m.id,
            milestoneRef: m.milestone_ref,
            milestoneName: m.name,
            actionUrl: `/milestones/${m.id}`,
            icon: WORKFLOW_CATEGORIES.BASELINE_AWAITING_SUPPLIER.icon,
            color: WORKFLOW_CATEGORIES.BASELINE_AWAITING_SUPPLIER.color
          });
        }

        // Customer needs to sign (only if supplier has signed)
        if (m.baseline_supplier_pm_signed_at && !m.baseline_customer_pm_signed_at) {
          items.push({
            id: `${m.id}_baseline_customer`,
            entityId: m.id,
            category: WORKFLOW_CATEGORIES.BASELINE_AWAITING_CUSTOMER.id,
            type: 'baseline',
            title: `Baseline: ${m.milestone_ref || m.name}`,
            description: `${m.name} - Awaiting Customer PM signature`,
            status: 'Awaiting Customer',
            timestamp,
            daysPending,
            urgency: getUrgencyLevel(daysPending),
            milestoneId: m.id,
            milestoneRef: m.milestone_ref,
            milestoneName: m.name,
            actionUrl: `/milestones/${m.id}`,
            icon: WORKFLOW_CATEGORIES.BASELINE_AWAITING_CUSTOMER.icon,
            color: WORKFLOW_CATEGORIES.BASELINE_AWAITING_CUSTOMER.color
          });
        }
      });

      return items;
    } catch (error) {
      console.error('WorkflowService fetchBaselines error:', error);
      return [];
    }
  }

  /**
   * Get category configuration by ID
   * @param {string} categoryId - Category ID
   * @returns {Object|null} Category configuration
   */
  getCategoryConfig(categoryId) {
    return Object.values(WORKFLOW_CATEGORIES).find(c => c.id === categoryId) || null;
  }

  /**
   * Get all categories grouped by entity type
   * @returns {Object} Categories grouped by group name
   */
  getCategoriesByGroup() {
    const groups = {};
    Object.values(WORKFLOW_CATEGORIES).forEach(cat => {
      if (!groups[cat.group]) {
        groups[cat.group] = [];
      }
      groups[cat.group].push(cat);
    });
    return groups;
  }

  /**
   * Check if a role can act on a category
   * @param {string} categoryId - Category ID
   * @param {string} role - User role
   * @returns {boolean} Whether role can act
   */
  canRoleActOnCategory(categoryId, role) {
    const category = this.getCategoryConfig(categoryId);
    return category?.actionableBy.includes(role) || false;
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;
