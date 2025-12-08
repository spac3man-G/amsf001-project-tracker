/**
 * Invoice Modal Component
 * 
 * Displays generated invoice details with:
 * - Summary cards (timesheets, billable/non-billable expenses, total)
 * - Expenses breakdown panel
 * - Timesheet line items table
 * - Partner expense line items table
 * - Supplier expense line items table (not on invoice)
 * - Print/PDF functionality
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from PartnerDetail.jsx
 */

import React from 'react';
import { 
  CheckCircle, Clock, Receipt, Building2, 
  AlertCircle, Printer, X 
} from 'lucide-react';

export default function InvoiceModal({ 
  invoice, 
  partner, 
  onClose,
  onPrint 
}) {
  if (!invoice) return null;

  // Determine invoice type
  const invoiceType = invoice.invoice_type || 'combined';
  const showTimesheets = invoiceType === 'combined' || invoiceType === 'timesheets';
  const showExpenses = invoiceType === 'combined' || invoiceType === 'expenses';

  // Calculate all expense breakdowns
  const timesheetTotal = parseFloat(invoice.timesheet_total || 0);
  const partnerExpenses = invoice.groupedLines?.partnerExpenses || [];
  const supplierExpenses = invoice.groupedLines?.supplierExpenses || [];
  
  // Partner expenses breakdown
  const partnerExpensesTotal = partnerExpenses.reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  const chargeablePartnerExpenses = partnerExpenses
    .filter(e => e.chargeable_to_customer)
    .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  const nonChargeablePartnerExpenses = partnerExpenses
    .filter(e => !e.chargeable_to_customer)
    .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  
  // Supplier expenses breakdown
  const supplierExpensesTotal = supplierExpenses.reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  const chargeableSupplierExpenses = supplierExpenses
    .filter(e => e.chargeable_to_customer)
    .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  const nonChargeableSupplierExpenses = supplierExpenses
    .filter(e => !e.chargeable_to_customer)
    .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
  
  // Totals
  const allExpensesTotal = partnerExpensesTotal + supplierExpensesTotal;
  const allChargeableExpenses = chargeablePartnerExpenses + chargeableSupplierExpenses;
  const allNonChargeableExpenses = nonChargeablePartnerExpenses + nonChargeableSupplierExpenses;
  const invoiceTotal = timesheetTotal + partnerExpensesTotal;

  const hasNoData = !invoice.groupedLines?.timesheets?.length && 
                    !invoice.groupedLines?.partnerExpenses?.length && 
                    !invoice.groupedLines?.supplierExpenses?.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Printable Content */}
        <div id="invoice-print-content">
          {/* Header */}
          <InvoiceHeader invoice={invoice} />

          {/* Summary Cards */}
          <SummaryCards 
            timesheetTotal={timesheetTotal}
            chargeablePartnerExpenses={chargeablePartnerExpenses}
            nonChargeablePartnerExpenses={nonChargeablePartnerExpenses}
            invoiceTotal={invoiceTotal}
            partnerName={partner?.name}
            invoiceType={invoiceType}
          />

          {/* Expenses Breakdown - only show for combined or expenses invoices */}
          {showExpenses && (
            <ExpensesBreakdown 
              allExpensesTotal={allExpensesTotal}
              allChargeableExpenses={allChargeableExpenses}
              allNonChargeableExpenses={allNonChargeableExpenses}
              partnerExpensesTotal={partnerExpensesTotal}
              supplierExpensesTotal={supplierExpensesTotal}
              partnerName={partner?.name}
            />
          )}

          {/* Timesheet Lines - only show for combined or timesheets invoices */}
          {showTimesheets && invoice.groupedLines?.timesheets?.length > 0 && (
            <TimesheetTable 
              timesheets={invoice.groupedLines.timesheets}
              total={invoice.timesheet_total}
            />
          )}

          {/* Partner Expense Lines - only show for combined or expenses invoices */}
          {showExpenses && invoice.groupedLines?.partnerExpenses?.length > 0 && (
            <PartnerExpensesTable 
              expenses={invoice.groupedLines.partnerExpenses}
              total={invoice.expense_total}
              partnerName={partner?.name}
            />
          )}

          {/* Supplier Expense Lines - only show for combined or expenses invoices */}
          {showExpenses && (
            <SupplierExpensesSection 
              expenses={invoice.groupedLines?.supplierExpenses || []}
              total={invoice.supplier_expense_total}
            />
          )}

          {/* No data message */}
          {hasNoData && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <AlertCircle size={32} style={{ color: '#92400e', marginBottom: '0.5rem' }} />
              <p style={{ color: '#92400e', margin: 0 }}>
                No approved or submitted {invoiceType === 'timesheets' ? 'timesheets' : invoiceType === 'expenses' ? 'expenses' : 'timesheets/expenses'} found for this period.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end', 
          borderTop: '1px solid #e2e8f0', 
          paddingTop: '1rem' 
        }}>
          <button 
            className="btn btn-secondary"
            onClick={onPrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function InvoiceHeader({ invoice }) {
  // Determine invoice type label and color
  const invoiceType = invoice.invoice_type || 'combined';
  const typeConfig = {
    combined: { label: 'Combined', color: '#16a34a', bg: '#dcfce7' },
    timesheets: { label: 'Timesheets Only', color: '#2563eb', bg: '#dbeafe' },
    expenses: { label: 'Expenses Only', color: '#d97706', bg: '#fef3c7' }
  };
  const { label: typeLabel, color: typeColor, bg: typeBg } = typeConfig[invoiceType] || typeConfig.combined;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{ 
        backgroundColor: '#dcfce7', 
        borderRadius: '50%', 
        padding: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CheckCircle size={24} style={{ color: '#16a34a' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Invoice Generated</h2>
          <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: '600',
            backgroundColor: typeBg,
            color: typeColor,
            textTransform: 'uppercase'
          }}>
            {typeLabel}
          </span>
        </div>
        <p style={{ margin: 0, color: '#64748b' }}>{invoice.invoice_number}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Period</div>
        <div style={{ fontWeight: '500' }}>
          {new Date(invoice.period_start).toLocaleDateString('en-GB')} - {new Date(invoice.period_end).toLocaleDateString('en-GB')}
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ 
  timesheetTotal, 
  chargeablePartnerExpenses, 
  nonChargeablePartnerExpenses, 
  invoiceTotal,
  partnerName,
  invoiceType = 'combined'
}) {
  const showTimesheets = invoiceType === 'combined' || invoiceType === 'timesheets';
  const showExpenses = invoiceType === 'combined' || invoiceType === 'expenses';
  
  // Calculate the actual invoice total based on type
  const displayTotal = invoiceType === 'timesheets' ? timesheetTotal :
                       invoiceType === 'expenses' ? (chargeablePartnerExpenses + nonChargeablePartnerExpenses) :
                       invoiceTotal;

  // Determine grid columns based on what's shown
  const gridCols = (showTimesheets && showExpenses) ? '1fr 1fr 1fr 1fr' :
                   showTimesheets ? '1fr 1fr' :
                   showExpenses ? '1fr 1fr 1fr' :
                   '1fr';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0.75rem', marginBottom: '1.5rem' }}>
      {showTimesheets && (
        <div style={{ backgroundColor: '#dbeafe', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: '600' }}>Timesheets</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af' }}>
            £{timesheetTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#3b82f6' }}>All billable</div>
        </div>
      )}
      {showExpenses && (
        <>
          <div style={{ backgroundColor: '#dcfce7', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: '600' }}>Expenses Billable</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
              £{chargeablePartnerExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#22c55e' }}>Chargeable to customer</div>
          </div>
          <div style={{ backgroundColor: '#fee2e2', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#dc2626', textTransform: 'uppercase', fontWeight: '600' }}>Expenses Non-Billable</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
              £{nonChargeablePartnerExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#ef4444' }}>Not chargeable</div>
          </div>
        </>
      )}
      <div style={{ backgroundColor: '#7c3aed', borderRadius: '8px', padding: '1rem', color: 'white' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '600', opacity: 0.9 }}>Invoice Total</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
          £{displayTotal.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>To be paid by {partnerName}</div>
      </div>
    </div>
  );
}

function ExpensesBreakdown({ 
  allExpensesTotal, 
  allChargeableExpenses, 
  allNonChargeableExpenses,
  partnerExpensesTotal,
  supplierExpensesTotal,
  partnerName 
}) {
  const partnerShortName = partnerName?.split(' ')[0] || 'Partner';
  
  return (
    <div style={{ 
      backgroundColor: '#f8fafc', 
      borderRadius: '8px', 
      padding: '1rem', 
      marginBottom: '1.5rem',
      border: '1px solid #e2e8f0'
    }}>
      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Receipt size={16} />
        Expenses Breakdown
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
        <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#e2e8f0', borderRadius: '6px' }}>
          <div style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: '0.25rem' }}>Total Expenses</div>
          <div style={{ fontWeight: '700', color: '#334155' }}>£{allExpensesTotal.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
          <div style={{ color: '#16a34a', fontSize: '0.65rem', marginBottom: '0.25rem' }}>Chargeable to Customer</div>
          <div style={{ fontWeight: '700', color: '#16a34a' }}>£{allChargeableExpenses.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
          <div style={{ color: '#dc2626', fontSize: '0.65rem', marginBottom: '0.25rem' }}>Not Chargeable</div>
          <div style={{ fontWeight: '700', color: '#dc2626' }}>£{allNonChargeableExpenses.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f3e8ff', borderRadius: '6px' }}>
          <div style={{ color: '#7c3aed', fontSize: '0.65rem', marginBottom: '0.25rem' }}>Paid by {partnerShortName}</div>
          <div style={{ fontWeight: '700', color: '#7c3aed' }}>£{partnerExpensesTotal.toFixed(2)}</div>
          <div style={{ fontSize: '0.6rem', color: '#a78bfa' }}>On this invoice</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
          <div style={{ color: '#92400e', fontSize: '0.65rem', marginBottom: '0.25rem' }}>Paid by Supplier</div>
          <div style={{ fontWeight: '700', color: '#92400e' }}>£{supplierExpensesTotal.toFixed(2)}</div>
          <div style={{ fontSize: '0.6rem', color: '#b45309' }}>Not on this invoice</div>
        </div>
      </div>
    </div>
  );
}


function TimesheetTable({ timesheets, total }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={18} style={{ color: '#1e40af' }} />
        Timesheets ({timesheets.length} entries)
      </h4>
      <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#dbeafe' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Hours</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cost/Day</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{parseFloat(line.hours || line.quantity || 0).toFixed(1)}h</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>£{parseFloat(line.cost_price || line.unit_price || 0).toFixed(0)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: line.source_status === 'Approved' ? '#dcfce7' : '#fef3c7',
                    color: line.source_status === 'Approved' ? '#16a34a' : '#92400e'
                  }}>
                    {line.source_status}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                  £{parseFloat(line.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
              <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>Timesheet Total:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                £{parseFloat(total || 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function PartnerExpensesTable({ expenses, total, partnerName }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Receipt size={18} style={{ color: '#7c3aed' }} />
        Partner-Procured Expenses ({expenses.length} entries)
        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#7c3aed' }}>- Billed to {partnerName}</span>
      </h4>
      <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.85rem', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3e8ff' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Chargeable</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                <td style={{ padding: '0.5rem' }}>{line.expense_category}</td>
                <td style={{ padding: '0.5rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {line.description.split(': ').slice(1).join(': ') || line.description}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: line.chargeable_to_customer ? '#dcfce7' : '#fee2e2',
                    color: line.chargeable_to_customer ? '#16a34a' : '#dc2626'
                  }}>
                    {line.chargeable_to_customer ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                  £{parseFloat(line.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
              <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>Partner Expenses Total:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                £{parseFloat(total || 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SupplierExpensesSection({ expenses, total }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ 
        backgroundColor: '#fef3c7', 
        border: '2px dashed #f59e0b',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.5rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
          <Building2 size={18} />
          Supplier-Procured Expenses
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: '600',
            backgroundColor: '#92400e',
            color: 'white',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            marginLeft: '0.5rem'
          }}>
            NOT ON THIS INVOICE
          </span>
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>
          These expenses were paid by the supplier and must be reconciled separately. 
          The supplier should pass these charges to the customer via their own invoicing process.
        </p>
      </div>
      
      {expenses.length > 0 ? (
        <div style={{ fontSize: '0.85rem', border: '1px solid #fde68a', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fef3c7' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Chargeable</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((line, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fffbeb' }}>
                  <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                  <td style={{ padding: '0.5rem' }}>{line.expense_category}</td>
                  <td style={{ padding: '0.5rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line.description.split(': ').slice(1).join(': ') || line.description}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      backgroundColor: line.chargeable_to_customer ? '#dcfce7' : '#fee2e2',
                      color: line.chargeable_to_customer ? '#16a34a' : '#dc2626'
                    }}>
                      {line.chargeable_to_customer ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                    £{parseFloat(line.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#fef3c7', fontWeight: '600' }}>
                <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>
                  Supplier Expenses Total (to be billed separately):
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                  £{parseFloat(total || 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          backgroundColor: '#fffbeb', 
          borderRadius: '8px',
          border: '1px solid #fde68a',
          color: '#92400e'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No supplier-procured expenses for this period.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#a16207' }}>
            When expenses are marked as "Paid by: Supplier" they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
