/**
 * Invoicing Service
 * 
 * Handles partner invoice generation, management, and retrieval.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase P5 - Partner Invoicing
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

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
   * Get invoice with all line items
   */
  async getWithLines(invoiceId) {
    try {
      const { data: invoice, error: invError } = await supabase
        .from(this.tableName)
        .select('*, partners(name, contact_name, contact_email, payment_terms)')
        .eq('id', invoiceId)
        .single();

      if (invError) throw invError;
      if (!invoice) return null;

      const { data: lines, error: linesError } = await supabase
        .from('partner_invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('line_date', { ascending: true });

      if (linesError) throw linesError;

      return {
        ...invoice,
        lines: lines || []
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

      // Get the highest invoice number for this year
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
   * Generate a new invoice for a partner
   * @param {Object} params - Invoice parameters
   * @param {string} params.projectId - Project UUID
   * @param {string} params.partnerId - Partner UUID
   * @param {string} params.periodStart - Start date (YYYY-MM-DD)
   * @param {string} params.periodEnd - End date (YYYY-MM-DD)
   * @param {string} params.createdBy - User UUID
   * @param {string} params.notes - Optional notes
   */
  async generateInvoice(params) {
    const { projectId, partnerId, periodStart, periodEnd, createdBy, notes } = params;

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

      // 2. Get timesheets for period
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('id, date, hours_worked, hours, status, resource_id')
        .in('resource_id', resourceIds)
        .gte('date', periodStart)
        .lte('date', periodEnd)
        .eq('status', 'Approved');

      if (tsError) throw tsError;

      // 3. Get partner-procured expenses for period
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('id, expense_date, category, reason, amount, resource_id, resource_name')
        .in('resource_id', resourceIds)
        .eq('procurement_method', 'partner')
        .gte('expense_date', periodStart)
        .lte('expense_date', periodEnd)
        .in('status', ['Approved', 'Paid']);

      if (expError) throw expError;

      // 4. Calculate totals
      let timesheetTotal = 0;
      const timesheetLines = (timesheets || []).map(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const resource = resourceMap[ts.resource_id];
        const costPrice = resource?.cost_price || 0;
        const lineTotal = (hours / 8) * costPrice;
        timesheetTotal += lineTotal;

        return {
          line_type: 'timesheet',
          timesheet_id: ts.id,
          description: `${resource?.name || 'Unknown'} - ${hours}h`,
          quantity: hours,
          unit_price: costPrice,
          line_total: lineTotal,
          resource_name: resource?.name,
          line_date: ts.date
        };
      });

      let expenseTotal = 0;
      const expenseLines = (expenses || []).map(exp => {
        const amount = parseFloat(exp.amount || 0);
        expenseTotal += amount;

        return {
          line_type: 'expense',
          expense_id: exp.id,
          description: `${exp.category}: ${exp.reason}`,
          quantity: 1,
          unit_price: amount,
          line_total: amount,
          resource_name: exp.resource_name,
          line_date: exp.expense_date
        };
      });

      const invoiceTotal = timesheetTotal + expenseTotal;

      // 5. Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(projectId);

      // 6. Create invoice record
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
          expense_total: expenseTotal,
          invoice_total: invoiceTotal,
          status: 'Draft',
          notes: notes || null,
          created_by: createdBy
        })
        .select()
        .single();

      if (invError) throw invError;

      // 7. Create line items
      const allLines = [...timesheetLines, ...expenseLines].map(line => ({
        ...line,
        invoice_id: invoice.id
      }));

      if (allLines.length > 0) {
        const { error: linesError } = await supabase
          .from('partner_invoice_lines')
          .insert(allLines);

        if (linesError) throw linesError;
      }

      // 8. Return complete invoice
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
