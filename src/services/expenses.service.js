/**
 * Expenses Service
 * 
 * Handles all expense-related data operations.
 * Extends BaseService with expense-specific methods.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase P4 - Expenses Enhancement
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class ExpensesService extends BaseService {
  constructor() {
    super('expenses');
  }

  /**
   * Get all expenses with related data
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   */
  async getAll(projectId, options = {}) {
    const defaultSelect = '*, expense_files(*), resources(name, resource_type, partner_id)';
    return super.getAll(projectId, {
      ...options,
      select: options.select || defaultSelect,
      orderBy: options.orderBy || { column: 'expense_date', ascending: false }
    });
  }

  /**
   * Get expenses by resource
   * @param {string} resourceId - Resource UUID
   * @param {Object} options - Optional date range { start, end }
   */
  async getByResource(resourceId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*, expense_files(*)')
        .eq('resource_id', resourceId)
        .order('expense_date', { ascending: false });

      if (options.start) {
        query = query.gte('expense_date', options.start);
      }
      if (options.end) {
        query = query.lte('expense_date', options.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ExpensesService getByResource error:', error);
      throw error;
    }
  }

  /**
   * Get expenses by partner (via linked resources)
   * @param {string} partnerId - Partner UUID
   * @param {Object} options - Optional filters { start, end, procurementMethod }
   */
  async getByPartner(partnerId, options = {}) {
    try {
      // First get resource IDs for this partner
      const { data: resources } = await supabase
        .from('resources')
        .select('id')
        .eq('partner_id', partnerId);

      if (!resources || resources.length === 0) {
        return [];
      }

      const resourceIds = resources.map(r => r.id);

      let query = supabase
        .from(this.tableName)
        .select('*, expense_files(*)')
        .in('resource_id', resourceIds)
        .order('expense_date', { ascending: false });

      if (options.start) {
        query = query.gte('expense_date', options.start);
      }
      if (options.end) {
        query = query.lte('expense_date', options.end);
      }
      if (options.procurementMethod) {
        query = query.eq('procurement_method', options.procurementMethod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ExpensesService getByPartner error:', error);
      throw error;
    }
  }


  /**
   * Get partner-procured expenses for invoicing
   * @param {string} partnerId - Partner UUID
   * @param {Object} dateRange - { start, end } required for invoicing
   */
  async getPartnerProcuredForInvoice(partnerId, dateRange) {
    if (!dateRange.start || !dateRange.end) {
      throw new Error('Date range (start and end) is required for invoice queries');
    }
    
    return this.getByPartner(partnerId, {
      ...dateRange,
      procurementMethod: 'partner'
    });
  }

  /**
   * Get expense summary statistics
   * @param {string} projectId - Project UUID
   * @param {Object} options - Optional filters
   */
  async getSummary(projectId, options = {}) {
    try {
      const expenses = await this.getAll(projectId, options);
      
      const summary = {
        total: 0,
        chargeable: 0,
        nonChargeable: 0,
        supplierProcured: 0,
        partnerProcured: 0,
        byCategory: {
          Travel: 0,
          Accommodation: 0,
          Sustenance: 0
        },
        byStatus: {
          Draft: 0,
          Submitted: 0,
          Approved: 0,
          Rejected: 0,
          Paid: 0
        },
        count: expenses.length
      };

      expenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);
        summary.total += amount;
        
        // Chargeable breakdown
        if (exp.chargeable_to_customer !== false) {
          summary.chargeable += amount;
        } else {
          summary.nonChargeable += amount;
        }
        
        // Procurement breakdown
        if (exp.procurement_method === 'partner') {
          summary.partnerProcured += amount;
        } else {
          summary.supplierProcured += amount;
        }
        
        // Category breakdown
        if (summary.byCategory[exp.category] !== undefined) {
          summary.byCategory[exp.category] += amount;
        }
        
        // Status breakdown
        if (summary.byStatus[exp.status] !== undefined) {
          summary.byStatus[exp.status] += amount;
        }
      });

      return summary;
    } catch (error) {
      console.error('ExpensesService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Create expense with validation
   * @param {Object} expense - Expense data
   */
  async create(expense) {
    // Validate required fields
    if (!expense.resource_id) {
      throw new Error('resource_id is required');
    }
    if (!expense.category) {
      throw new Error('category is required');
    }
    if (!expense.amount || expense.amount <= 0) {
      throw new Error('amount must be greater than 0');
    }

    // Set defaults
    const expenseData = {
      ...expense,
      status: expense.status || 'Draft',
      chargeable_to_customer: expense.chargeable_to_customer ?? true,
      procurement_method: expense.procurement_method || 'supplier'
    };

    return super.create(expenseData);
  }


  /**
   * Submit expense for validation
   * @param {string} id - Expense UUID
   */
  async submit(id) {
    return this.update(id, { status: 'Submitted' });
  }

  /**
   * Approve/validate expense
   * @param {string} id - Expense UUID
   */
  async approve(id) {
    return this.update(id, { status: 'Approved' });
  }

  /**
   * Reject expense
   * @param {string} id - Expense UUID
   * @param {string} reason - Optional rejection reason
   */
  async reject(id, reason = null) {
    const updates = { status: 'Rejected' };
    if (reason) {
      updates.rejection_reason = reason;
    }
    return this.update(id, updates);
  }

  /**
   * Mark expense as paid
   * @param {string} id - Expense UUID
   */
  async markPaid(id) {
    return this.update(id, { status: 'Paid' });
  }
}

// Export singleton instance
export const expensesService = new ExpensesService();

export default expensesService;
