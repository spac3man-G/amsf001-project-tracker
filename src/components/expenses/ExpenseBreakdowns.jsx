/**
 * Expense Breakdowns Component
 * 
 * Display cards for expense breakdowns:
 * - CategoryBreakdown - By expense type (Travel, Accommodation, Sustenance)
 * - ResourceBreakdown - By resource with chargeable/non-chargeable splits
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Expenses.jsx
 */

import React from 'react';
import { Car, Home, Utensils, Receipt, User } from 'lucide-react';

const CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];

function getCategoryIcon(category) {
  switch (category) {
    case 'Travel': return <Car size={16} />;
    case 'Accommodation': return <Home size={16} />;
    case 'Sustenance': return <Utensils size={16} />;
    default: return <Receipt size={16} />;
  }
}

function getCategoryColor(category) {
  switch (category) {
    case 'Travel': return { bg: '#dbeafe', color: '#2563eb' };
    case 'Accommodation': return { bg: '#f3e8ff', color: '#7c3aed' };
    case 'Sustenance': return { bg: '#ffedd5', color: '#ea580c' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

/**
 * Category Breakdown Card
 */
export function CategoryBreakdown({ expenses, categoryTotals }) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Breakdown by Type</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {CATEGORIES.map(cat => {
          const colors = getCategoryColor(cat);
          const count = expenses.filter(e => e.category === cat).length;
          const chargeableAmt = expenses
            .filter(e => e.category === cat && e.chargeable_to_customer !== false)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          
          return (
            <div key={cat} style={{ padding: '1rem', backgroundColor: colors.bg, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.color, marginBottom: '0.5rem' }}>
                {getCategoryIcon(cat)}
                <span style={{ fontWeight: '600' }}>{cat}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.color }}>
                £{categoryTotals[cat].toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} expense(s)</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                £{chargeableAmt.toFixed(2)} chargeable
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Resource Breakdown Card
 */
export function ResourceBreakdown({ resourceTotals }) {
  if (Object.keys(resourceTotals).length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Breakdown by Resource</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {Object.entries(resourceTotals).map(([name, totals]) => (
          <div key={name} style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <User size={16} style={{ color: '#64748b' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{name}</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
              £{totals.total.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              £{totals.chargeable.toFixed(2)} chargeable
            </div>
            {totals.nonChargeable > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                £{totals.nonChargeable.toFixed(2)} non-chargeable
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Expense Guidelines Card
 */
export function ExpenseGuidelines() {
  return (
    <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#92400e' }}>📋 Expense Guidelines</h4>
      <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
        <li>PMO travel/accommodation requires advance approval from Authority Project Manager</li>
        <li>Attach receipts for all expenses over £25</li>
        <li>Submit expenses within 30 days of incurring them</li>
        <li><strong>Submit:</strong> Click the send icon to submit for validation</li>
        <li><strong>Chargeable expenses:</strong> Validated by Customer PM</li>
        <li><strong>Non-chargeable expenses:</strong> Validated by Supplier PM</li>
      </ul>
    </div>
  );
}
