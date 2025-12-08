/**
 * Invoicing Service
 * 
 * Handles partner invoice generation, management, and retrieval.
 * 
 * @version 2.0
 * @created 30 November 2025
 * @updated 30 November 2025
 * @phase P5/P6 - Partner Invoicing (Enhanced)
 * 
 * Invoice Structure:
 * - Section 1: Timesheets by Resource (hours × cost price)
 * - Section 2: Supplier-Procured Expenses (not billed to partner, tracked for customer billing)
 * - Section 3: Partner-Procured Expenses (billed to partner)
 * - Totals include chargeable/non-chargeable breakdown for customer pass-through
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { hoursToDays } from '../config/metricsConfig';

export class InvoicingService extends BaseService {
  constructor() {
    super('partner_invoices');
  }

  /**
   * Get all invoices for a project with partner details
   */
  async getAll(projectId, options = {}) {
    return super.getAll(projectId, {
      ...options,
      select: options.select || '*, partners(name)',
      orderBy: options.orderBy || { column: 'invoice_date', ascending: false }
    });
  }

  /**
   * Get invoices for a specific partner
   */
  async getByPartner(partnerId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('partner_id', partnerId)
        .order('invoice_date', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('InvoicingService getByPartner error:', error);
      throw error;
    }
  }

  /**
   * Get invoice with all line items, grouped by type
   */
  async getWithLines(invoiceId) {
    try {
      // Use .limit(1) instead of .single() to avoid "Cannot coerce" errors
      const { data: invoiceData, error: invError } = await supabase
        .from(this.tableName)
        .select('*, partners(name, contact_name, contact_email, payment_terms)')
        .eq('id', invoiceId)
        .limit(1);

      if (invError) throw invError;
      const invoice = invoiceData?.[0];
      if (!invoice) return null;

      const { data: lines, error: linesError } = await supabase
        .from('partner_invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('line_type', { ascending: true })
        .order('resource_name', { ascending: true })
        .order('line_date', { ascending: true });

      if (linesError) throw linesError;

      // Group lines by type for easier display
      const groupedLines = {
        timesheets: (lines || []).filter(l => l.line_type === 'timesheet'),
        supplierExpenses: (lines || []).filter(l => l.line_type === 'supplier_expense'),
        partnerExpenses: (lines || []).filter(l => l.line_type === 'expense')
      };

      return {
        ...invoice,
        lines: lines || [],
        groupedLines
      };
    } catch (error) {
      console.error('InvoicingService getWithLines error:', error);
      throw error;
    }
  }

  /**
   * Generate next invoice number for a project
   * Format: INV-YYYY-NNN (e.g., INV-2025-001)
   */
  async generateInvoiceNumber(projectId) {
    try {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;

      const { data, error } = await supabase
        .from(this.tableName)
        .select('invoice_number')
        .eq('project_id', projectId)
        .like('invoice_number', `${prefix}%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const lastSeq = parseInt(lastNumber.replace(prefix, ''), 10);
        if (!isNaN(lastSeq)) {
          nextNumber = lastSeq + 1;
        }
      }

      return `${prefix}${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('InvoicingService generateInvoiceNumber error:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive invoice for a partner
   * 
   * @param {Object} params - Invoice parameters
   * @param {string} params.projectId - Project UUID
   * @param {string} params.partnerId - Partner UUID
   * @param {string} params.periodStart - Start date (YYYY-MM-DD)
   * @param {string} params.periodEnd - End date (YYYY-MM-DD)
   * @param {string} params.createdBy - User UUID
   * @param {string} params.notes - Optional notes
   * @param {boolean} params.includeSubmitted - Include submitted (not just approved) timesheets
   * @param {string} params.invoiceType - Type of invoice: 'combined', 'timesheets', or 'expenses'
   */
  async generateInvoice(params) {
    const { 
      projectId, 
      partnerId, 
      periodStart, 
      periodEnd, 
      createdBy, 
      notes,
      includeSubmitted = true,  // Default to including submitted timesheets
      invoiceType = 'combined'  // Default to combined invoice
    } = params;
    
    const includeTimesheets = invoiceType === 'combined' || invoiceType === 'timesheets';
    const includeExpenses = invoiceType === 'combined' || invoiceType === 'expenses';

    try {
      // 1. Get resources linked to this partner
      const { data: resources, error: resError } = await supabase
        .from('resources')
        .select('id, name, cost_price')
        .eq('partner_id', partnerId);

      if (resError) throw resError;
      if (!resources || resources.length === 0) {
        throw new Error('No resources linked to this partner');
      }

      const resourceIds = resources.map(r => r.id);
      const resourceMap = {};
      resources.forEach(r => { resourceMap[r.id] = r; });

      // 2. Get timesheets for period (approved or submitted based on option)
      let timesheets = [];
      if (includeTimesheets) {
        const validStatuses = includeSubmitted ? ['Approved', 'Submitted'] : ['Approved'];
        
        const { data: tsData, error: tsError } = await supabase
          .from('timesheets')
          .select('id, date, hours_worked, hours, status, resource_id')
          .in('resource_id', resourceIds)
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .in('status', validStatuses);

        if (tsError) throw tsError;
        timesheets = tsData || [];
      }

      // 3. Get ALL expenses for period (both supplier and partner procured)
      let allExpenses = [];
      if (includeExpenses) {
        const { data: expData, error: expError } = await supabase
          .from('expenses')
          .select('id, expense_date, category, reason, amount, resource_id, resource_name, procurement_method, chargeable_to_customer, status')
          .in('resource_id', resourceIds)
          .gte('expense_date', periodStart)
          .lte('expense_date', periodEnd)
          .in('status', ['Approved', 'Submitted', 'Paid']);

        if (expError) throw expError;
        allExpenses = expData || [];
      }

      // Separate expenses by procurement method
      // Default to 'partner' if procurement_method is null (backward compatibility)
      const partnerExpenses = (allExpenses || []).filter(e => 
        e.procurement_method === 'partner' || !e.procurement_method
      );
      const supplierExpenses = (allExpenses || []).filter(e => 
        e.procurement_method === 'supplier'
      );

      // 4. Build timesheet lines (grouped by resource for clarity)
      let timesheetTotal = 0;
      let timesheetChargeable = 0; // All timesheets are typically chargeable
      const timesheetLines = [];

      // Group timesheets by resource
      const timesheetsByResource = {};
      (timesheets || []).forEach(ts => {
        if (!timesheetsByResource[ts.resource_id]) {
          timesheetsByResource[ts.resource_id] = [];
        }
        timesheetsByResource[ts.resource_id].push(ts);
      });

      // Create lines for each timesheet
      Object.keys(timesheetsByResource).forEach(resourceId => {
        const resource = resourceMap[resourceId];
        const resourceTimesheets = timesheetsByResource[resourceId];
        
        resourceTimesheets.forEach(ts => {
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          const costPrice = resource?.cost_price || 0;
          const days = hoursToDays(hours);
          const lineTotal = days * costPrice;
          
          timesheetTotal += lineTotal;
          timesheetChargeable += lineTotal; // All timesheets chargeable

          timesheetLines.push({
            line_type: 'timesheet',
            timesheet_id: ts.id,
            expense_id: null,
            description: `${resource?.name || 'Unknown'} - ${hours}h (${days.toFixed(2)} days)`,
            quantity: hours,
            unit_price: costPrice,
            line_total: lineTotal,
            resource_name: resource?.name,
            line_date: ts.date,
            hours: hours,
            cost_price: costPrice,
            source_status: ts.status,
            chargeable_to_customer: true,
            procurement_method: null,
            expense_category: null
          });
        });
      });

      // 5. Build partner expense lines (these go ON the invoice)
      let partnerExpenseTotal = 0;
      let partnerExpenseChargeable = 0;
      let partnerExpenseNonChargeable = 0;
      const partnerExpenseLines = [];

      partnerExpenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);
        partnerExpenseTotal += amount;
        
        if (exp.chargeable_to_customer) {
          partnerExpenseChargeable += amount;
        } else {
          partnerExpenseNonChargeable += amount;
        }

        partnerExpenseLines.push({
          line_type: 'expense',
          timesheet_id: null,
          expense_id: exp.id,
          description: `${exp.resource_name} - ${exp.category}: ${exp.reason}`,
          quantity: 1,
          unit_price: amount,
          line_total: amount,
          resource_name: exp.resource_name,
          line_date: exp.expense_date,
          hours: null,
          cost_price: null,
          source_status: exp.status,
          chargeable_to_customer: exp.chargeable_to_customer,
          procurement_method: 'partner',
          expense_category: exp.category
        });
      });

      // 6. Build supplier expense lines (NOT on invoice, but tracked for reference)
      let supplierExpenseTotal = 0;
      let supplierExpenseChargeable = 0;
      let supplierExpenseNonChargeable = 0;
      const supplierExpenseLines = [];

      supplierExpenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);
        supplierExpenseTotal += amount;
        
        if (exp.chargeable_to_customer) {
          supplierExpenseChargeable += amount;
        } else {
          supplierExpenseNonChargeable += amount;
        }

        supplierExpenseLines.push({
          line_type: 'supplier_expense',
          timesheet_id: null,
          expense_id: exp.id,
          description: `${exp.resource_name} - ${exp.category}: ${exp.reason}`,
          quantity: 1,
          unit_price: amount,
          line_total: amount,
          resource_name: exp.resource_name,
          line_date: exp.expense_date,
          hours: null,
          cost_price: null,
          source_status: exp.status,
          chargeable_to_customer: exp.chargeable_to_customer,
          procurement_method: 'supplier',
          expense_category: exp.category
        });
      });

      // 7. Calculate totals
      // Invoice total = timesheets + partner expenses (supplier expenses are informational only)
      const invoiceTotal = timesheetTotal + partnerExpenseTotal;
      
      // Chargeable total = everything that can be passed to customer
      const chargeableTotal = timesheetChargeable + partnerExpenseChargeable + supplierExpenseChargeable;
      
      // Non-chargeable total
      const nonChargeableTotal = partnerExpenseNonChargeable + supplierExpenseNonChargeable;

      // 8. Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(projectId);
      
      // Generate invoice type label for notes
      const invoiceTypeLabel = invoiceType === 'timesheets' ? 'Timesheets Only' :
                               invoiceType === 'expenses' ? 'Expenses Only' : 
                               'Combined (Timesheets & Expenses)';

      // 9. Create invoice record
      const { data: invoice, error: invError } = await supabase
        .from(this.tableName)
        .insert({
          project_id: projectId,
          partner_id: partnerId,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          period_start: periodStart,
          period_end: periodEnd,
          timesheet_total: timesheetTotal,
          expense_total: partnerExpenseTotal,
          supplier_expense_total: supplierExpenseTotal,
          invoice_total: invoiceTotal,
          chargeable_total: chargeableTotal,
          non_chargeable_total: nonChargeableTotal,
          status: 'Draft',
          notes: notes || `Invoice Type: ${invoiceTypeLabel}`,
          created_by: createdBy,
          invoice_type: invoiceType
        })
        .select()
        .single();

      if (invError) throw invError;

      // 10. Create line items
      const allLines = [
        ...timesheetLines, 
        ...partnerExpenseLines, 
        ...supplierExpenseLines
      ].map(line => ({
        ...line,
        invoice_id: invoice.id
      }));

      if (allLines.length > 0) {
        const { error: linesError } = await supabase
          .from('partner_invoice_lines')
          .insert(allLines);

        if (linesError) throw linesError;
      }

      // 11. Return complete invoice with grouped lines
      return this.getWithLines(invoice.id);

    } catch (error) {
      console.error('InvoicingService generateInvoice error:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(invoiceId, status) {
    const updates = { status };
    
    if (status === 'Sent') {
      updates.sent_at = new Date().toISOString();
    } else if (status === 'Paid') {
      updates.paid_at = new Date().toISOString();
    }

    return this.update(invoiceId, updates);
  }

  /**
   * Mark invoice as sent
   */
  async markSent(invoiceId) {
    return this.updateStatus(invoiceId, 'Sent');
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(invoiceId) {
    return this.updateStatus(invoiceId, 'Paid');
  }

  /**
   * Cancel an invoice
   */
  async cancel(invoiceId) {
    return this.updateStatus(invoiceId, 'Cancelled');
  }

  /**
   * Get invoice summary stats for a partner
   */
  async getPartnerStats(partnerId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('status, invoice_total')
        .eq('partner_id', partnerId);

      if (error) throw error;

      const stats = {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        cancelled: 0,
        count: data?.length || 0
      };

      (data || []).forEach(inv => {
        const amount = parseFloat(inv.invoice_total || 0);
        stats.total += amount;
        
        switch (inv.status) {
          case 'Draft': stats.draft += amount; break;
          case 'Sent': stats.sent += amount; break;
          case 'Paid': stats.paid += amount; break;
          case 'Cancelled': stats.cancelled += amount; break;
        }
      });

      return stats;
    } catch (error) {
      console.error('InvoicingService getPartnerStats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const invoicingService = new InvoicingService();

export default invoicingService;
