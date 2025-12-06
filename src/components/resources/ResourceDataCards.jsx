/**
 * Resource Data Cards Components
 * 
 * Display cards for resource-related data:
 * - TimesheetsCard - Recent timesheet entries
 * - ExpensesCard - Expense entries with full details
 * 
 * @version 2.0 - Removed AllocationCard, using centralised utilities
 * @created 1 December 2025
 * @updated 6 December 2025
 */

import React from 'react';
import { Clock, Receipt, CheckCircle, X } from 'lucide-react';
import { getStatusConfig } from '../../lib/timesheetCalculations';

/**
 * Get expense status style
 */
function getExpenseStatusStyle(status) {
  switch (status) {
    case 'Approved':
    case 'Validated':
      return { bg: '#dcfce7', color: '#16a34a' };
    case 'Submitted':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'Rejected':
      return { bg: '#fee2e2', color: '#dc2626' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
}

/**
 * Expense category colours
 */
const CATEGORY_COLORS = {
  'Travel': { bg: '#dbeafe', color: '#1e40af' },
  'Accommodation': { bg: '#f3e8ff', color: '#7c3aed' },
  'Sustenance': { bg: '#fef3c7', color: '#92400e' }
};

/**
 * Timesheets Card - Recent timesheet entries
 */
export function TimesheetsCard({ timesheets, dateRangeLabel }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">Timesheets</h3>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {timesheets.length} entries
          {dateRangeLabel && dateRangeLabel !== 'All Time' ? ` (${dateRangeLabel})` : ''}
        </span>
      </div>
      {timesheets.length > 0 ? (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Hours</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map(ts => {
                const statusConfig = getStatusConfig(ts.status);
                return (
                  <tr key={ts.id}>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(ts.date).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No timesheets {dateRangeLabel && dateRangeLabel !== 'All Time' ? 'in selected period' : 'recorded'}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Expenses Card - Full width expenses table
 */
export function ExpensesCard({ expenses, dateRangeLabel }) {
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">Expenses</h3>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {expenses.length} entries
          {dateRangeLabel && dateRangeLabel !== 'All Time' ? ` (${dateRangeLabel})` : ''}
        </span>
      </div>
      {expenses.length > 0 ? (
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Reason</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Chargeable</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Paid By</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => {
                const amount = parseFloat(exp.amount) || 0;
                const statusStyle = getExpenseStatusStyle(exp.status);
                const catStyle = CATEGORY_COLORS[exp.category] || { bg: '#f1f5f9', color: '#475569' };
                
                return (
                  <tr key={exp.id}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: catStyle.bg,
                        color: catStyle.color
                      }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {exp.reason || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      £{amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {exp.chargeable_to_customer ? (
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <X size={16} style={{ color: '#94a3b8' }} />
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: exp.procurement_method === 'partner' ? '#fef3c7' : '#e0f2fe',
                        color: exp.procurement_method === 'partner' ? '#92400e' : '#0369a1'
                      }}>
                        {exp.procurement_method === 'partner' ? 'Partner' : 'Supplier'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {exp.status || 'Draft'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          <Receipt size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No expenses {dateRangeLabel && dateRangeLabel !== 'All Time' ? 'in selected period' : 'recorded'}</p>
        </div>
      )}
    </div>
  );
}
