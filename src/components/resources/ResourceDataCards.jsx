/**
 * Resource Data Cards Components
 * 
 * Display cards for resource-related data:
 * - AllocationCard - Days used/remaining with progress bar
 * - TimesheetsCard - Recent timesheet entries
 * - ExpensesCard - Expense entries with full details
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from ResourceDetail.jsx
 */

import React from 'react';
import { Clock, Receipt, CheckCircle, X } from 'lucide-react';

function getStatusStyle(status) {
  switch (status) {
    case 'Approved':
      return { bg: '#dcfce7', color: '#16a34a' };
    case 'Submitted':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'Rejected':
      return { bg: '#fee2e2', color: '#dc2626' };
    case 'Validated':
      return { bg: '#dcfce7', color: '#16a34a' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
}

/**
 * Allocation Card - Shows days used/remaining
 */
export function AllocationCard({ daysUsed, daysAllocated, totalHours, approvedHours }) {
  const remaining = Math.max(0, daysAllocated - daysUsed);
  const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Allocation</h3>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>{daysUsed.toFixed(1)} days used</span>
            <span>{remaining.toFixed(1)} remaining</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(utilization, 100)}%`,
              height: '100%',
              backgroundColor: utilization > 100 ? '#dc2626' : utilization > 80 ? '#10b981' : '#3b82f6',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Hours Logged</span>
            <div style={{ fontWeight: '600' }}>{totalHours?.toFixed(1) || 0}h</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Approved Hours</span>
            <div style={{ fontWeight: '600', color: '#10b981' }}>{approvedHours?.toFixed(1) || 0}h</div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                const statusStyle = getStatusStyle(ts.status);
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
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {ts.status}
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
  const categoryColors = {
    'Travel': { bg: '#dbeafe', color: '#1e40af' },
    'Accommodation': { bg: '#f3e8ff', color: '#7c3aed' },
    'Sustenance': { bg: '#fef3c7', color: '#92400e' }
  };

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
                const statusStyle = getStatusStyle(exp.status);
                const catStyle = categoryColors[exp.category] || { bg: '#f1f5f9', color: '#475569' };
                
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
                    <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
