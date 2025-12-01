/**
 * Partner Data Tables Components
 * 
 * Reusable table components for displaying partner-related data:
 * - LinkedResourcesCard - Resources linked to partner
 * - RecentTimesheetsCard - Recent timesheet entries
 * - RecentExpensesCard - Recent expense entries
 * - RecentInvoicesCard - Recent invoice history
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from PartnerDetail.jsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ExternalLink, Clock, Receipt, FileText } from 'lucide-react';

// Helper function for status styling
function getStatusStyle(status) {
  switch (status) {
    case 'Approved':
    case 'Paid':
      return { bg: '#dcfce7', color: '#16a34a' };
    case 'Submitted':
    case 'Sent':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'Rejected':
    case 'Overdue':
      return { bg: '#fee2e2', color: '#dc2626' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
}

/**
 * Linked Resources Card
 */
export function LinkedResourcesCard({ resources }) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Linked Resources</h3>
      </div>
      {resources.length > 0 ? (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cost/Day</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr 
                  key={resource.id}
                  onClick={() => navigate(`/resources/${resource.id}`)}
                  style={{ cursor: 'pointer' }}
                  className="hover-row"
                >
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#2563eb', fontWeight: '500' }}>{resource.name}</span>
                      <ExternalLink size={12} style={{ color: '#9ca3af' }} />
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>{resource.role}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                    {resource.cost_price ? `£${resource.cost_price}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No resources linked to this partner</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Assign resources to this partner from the Resources page
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Recent Timesheets Card
 */
export function RecentTimesheetsCard({ timesheets, limit = 10 }) {
  if (!timesheets?.length) return null;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header">
        <h3 className="card-title">
          <Clock size={18} style={{ marginRight: '0.5rem' }} />
          Recent Timesheets
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Resource</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Hours</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.slice(0, limit).map(ts => {
              const hours = parseFloat(ts.hours_worked || ts.hours || 0);
              const costPrice = ts.resources?.cost_price || 0;
              const value = (hours / 8) * costPrice;
              const statusStyle = getStatusStyle(ts.status);
              
              return (
                <tr key={ts.id}>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(ts.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{ts.resources?.name}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{hours.toFixed(1)}h</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                    £{value.toFixed(0)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
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
    </div>
  );
}

/**
 * Recent Expenses Card
 */
export function RecentExpensesCard({ expenses }) {
  if (!expenses?.length) return null;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header">
        <h3 className="card-title">
          <Receipt size={18} style={{ marginRight: '0.5rem' }} />
          Recent Expenses
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Resource</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Procured By</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => {
              const isPartnerProcured = exp.procurement_method === 'partner';
              return (
                <tr key={exp.id} style={{ backgroundColor: isPartnerProcured ? '#faf5ff' : 'inherit' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(exp.expense_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{exp.resource_name}</td>
                  <td style={{ padding: '0.75rem' }}>{exp.category}</td>
                  <td style={{ padding: '0.75rem' }}>{exp.reason}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: isPartnerProcured ? '#f3e8ff' : '#fef3c7',
                      color: isPartnerProcured ? '#7c3aed' : '#92400e'
                    }}>
                      {isPartnerProcured ? 'Partner' : 'Supplier'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                    £{parseFloat(exp.amount).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Recent Invoices Card
 */
export function RecentInvoicesCard({ invoices }) {
  if (!invoices?.length) return null;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header">
        <h3 className="card-title">
          <FileText size={18} style={{ marginRight: '0.5rem' }} />
          Recent Invoices
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Invoice #</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Period</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const colors = getStatusStyle(inv.status);
              return (
                <tr key={inv.id}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: '500' }}>
                    {inv.invoice_number}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                    £{parseFloat(inv.invoice_total).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: colors.bg,
                      color: colors.color
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>
                    {new Date(inv.invoice_date).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
