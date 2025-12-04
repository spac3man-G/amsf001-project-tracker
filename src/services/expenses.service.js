/**
 * Expenses Service
 * 
 * Handles all expense-related data operations.
 * Extends BaseService with expense-specific methods.
 * 
 * @version 2.0
 * @updated 30 November 2025
 * @phase Production Hardening
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class ExpensesService extends BaseService {
  constructor() {
    super('expenses', {
      supportsSoftDelete: true,
      sanitizeConfig: 'expense'
    });
  }

  /**
   * Get all expenses with related data
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   */
  async getAll(projectId, options = {}) {
    const defaultSelect = '*, expense_files(*)';
    return super.getAll(projectId, {
      ...options,
      select: options.select || defaultSelect,
      orderBy: options.orderBy || { column: 'expense_date', ascending: false }
    });
  }

  /**
   * Get expenses filtered by test content setting
   * @param {string} projectId - Project UUID  
   * @param {boolean} showTestContent - Whether to include test content
   */
  async getAllFiltered(projectId, showTestContent = false) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*, expense_files(*), is_deleted, is_test_content')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });

      // Note: Filtering is now done client-side to avoid PostgREST .or() issues

      const { data, error } = await query;
      if (error) throw error;
      
      // Apply filters client-side
      let result = data || [];
      
      // Soft delete filter
      if (this.supportsSoftDelete) {
        result = result.filter(r => r.is_deleted !== true);
      }
      
      // Test content filter
      if (!showTestContent) {
        result = result.filter(r => r.is_test_content !== true);
      }
      
      return result;
    } catch (error) {
      console.error('ExpensesService getAllFiltered error:', error);
      throw error;
    }
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
        .select('*, expense_files(*), is_deleted')
        .eq('resource_id', resourceId)
        .order('expense_date', { ascending: false });

      // Note: Soft delete filtering is done client-side

      if (options.start) {
        query = query.gte('expense_date', options.start);
      }
      if (options.end) {
        query = query.lte('expense_date', options.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Apply soft delete filter client-side
      let result = data || [];
      if (this.supportsSoftDelete) {
        result = result.filter(r => r.is_deleted !== true);
      }
      
      return result;
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
        .select('*, expense_files(*), is_deleted')
        .in('resource_id', resourceIds)
        .order('expense_date', { ascending: false });

      // Note: Soft delete filtering is done client-side

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
      
      // Apply soft delete filter client-side
      let result = data || [];
      if (this.supportsSoftDelete) {
        result = result.filter(r => r.is_deleted !== true);
      }
      
      return result;
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
   * Create multiple expenses at once (batch insert)
   * @param {Object[]} expenses - Array of expense data
   * @returns {Promise<Object[]>} Created expenses
   */
  async createMany(expenses) {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    try {
      // Validate and set defaults for each expense
      const expensesToInsert = expenses.map(expense => {
        if (!expense.resource_id) {
          throw new Error('resource_id is required for all expenses');
        }
        if (!expense.category) {
          throw new Error('category is required for all expenses');
        }
        if (!expense.amount || expense.amount <= 0) {
          throw new Error('amount must be greater than 0 for all expenses');
        }

        return {
          ...expense,
          status: expense.status || 'Draft',
          chargeable_to_customer: expense.chargeable_to_customer ?? true,
          procurement_method: expense.procurement_method || 'supplier'
        };
      });

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(expensesToInsert)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ExpensesService createMany error:', error);
      throw error;
    }
  }

  /**
   * Submit expense for validation
   * @param {string} id - Expense UUID
   */
  async submit(id) {
    return this.update(id, { status: 'Submitted' });
  }

  /**
   * Validate expense
   * @param {string} id - Expense UUID
   */
  async validate(id) {
    return this.update(id, { status: 'Approved' });
  }

  /**
   * @deprecated Use validate() instead
   */
  async approve(id) {
    return this.validate(id);
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

  /**
   * Upload a receipt file for an expense
   * @param {string} expenseId - Expense UUID
   * @param {File} file - File to upload
   * @param {string} userId - User uploading the file
   */
  async uploadReceipt(expenseId, file, userId) {
    try {
      const filePath = `${expenseId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Use .select() without .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from('expense_files')
        .insert({
          expense_id: expenseId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: userId
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('ExpensesService uploadReceipt error:', error);
      throw error;
    }
  }

  /**
   * Download a receipt file
   * @param {string} filePath - Storage path of the file
   */
  async downloadReceipt(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ExpensesService downloadReceipt error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const expensesService = new ExpensesService();

export default expensesService;
