/**
 * Expense Table Component - Apple Design System
 * 
 * Clean data table for expenses with:
 * - Click-to-navigate pattern (row click opens detail modal)
 * - Status and category badges
 * - No action buttons in table (actions in modal)
 * - No receipt icons in table (receipts shown in modal)
 * 
 * @version 2.0
 * @updated 5 December 2025
 */

import React from 'react';
import { Car, Home, Utensils, Receipt, Building2, Briefcase, Check, X, Paperclip } from 'lucide-react';

const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected',
  'Paid': 'Paid'
};

function getCategoryIcon(category) {
  switch (category) {
    case 'Travel': return <Car size={14} />;
    case 'Accommodation': return <Home size={14} />;
    case 'Sustenance': return <Utensils size={14} />;
    default: return <Receipt size={14} />;
  }
}

function getCategoryClass(category) {
  switch (category) {
    case 'Travel': return 'category-travel';
    case 'Accommodation': return 'category-accommodation';
    case 'Sustenance': return 'category-sustenance';
    default: return 'category-default';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Approved': case 'Paid': return 'status-validated';
    case 'Submitted': return 'status-submitted';
    case 'Rejected': return 'status-rejected';
    default: return 'status-draft';
  }
}

function getProcurementClass(method) {
  return method === 'partner' ? 'procurement-partner' : 'procurement-supplier';
}

/**
 * Single Expense Row Component
 */
function ExpenseRow({ expense, showProcurement, setDetailModal }) {
  const isChargeable = expense.chargeable_to_customer !== false;
  const hasReceipts = expense.expense_files?.length > 0;

  return (
    <tr onClick={() => setDetailModal({ isOpen: true, expense })}>
      <td className="cell-ref">{expense.expense_ref || '-'}</td>
      <td>
        <span className={`category-badge ${getCategoryClass(expense.category)}`}>
          {getCategoryIcon(expense.category)}
          <span>{expense.category}</span>
        </span>
      </td>
      <td className="cell-resource">{expense.resource_name}</td>
      <td className="cell-date">{new Date(expense.expense_date).toLocaleDateString('en-GB')}</td>
      <td className="cell-reason">
        <span className="reason-text">{expense.reason}</span>
      </td>
      <td className="cell-amount">£{parseFloat(expense.amount).toFixed(2)}</td>
      <td>
        <span className={`chargeable-badge ${isChargeable ? 'chargeable-yes' : 'chargeable-no'}`}>
          {isChargeable ? <Check size={12} /> : <X size={12} />}
          <span>{isChargeable ? 'Yes' : 'No'}</span>
        </span>
      </td>
      {showProcurement && (
        <td>
          <span className={`procurement-badge ${getProcurementClass(expense.procurement_method)}`}>
            {(expense.procurement_method || 'supplier') === 'partner' ? <Building2 size={12} /> : <Briefcase size={12} />}
            <span>{(expense.procurement_method || 'supplier') === 'partner' ? 'Partner' : 'Supplier'}</span>
          </span>
        </td>
      )}
      <td>
        <span className={`status-badge ${getStatusClass(expense.status)}`}>
          {STATUS_DISPLAY_NAMES[expense.status] || expense.status}
        </span>
      </td>
      <td className="cell-receipts">
        {hasReceipts && (
          <span className="receipts-indicator">
            <Paperclip size={14} />
            <span>{expense.expense_files.length}</span>
          </span>
        )}
      </td>
    </tr>
  );
}

/**
 * Main Expense Table Component
 */
export default function ExpenseTable({
  expenses,
  hasRole,
  setDetailModal
}) {
  const showProcurement = hasRole(['admin', 'supplier_pm']);

  return (
    <div className="table-wrapper">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Type</th>
            <th>Resource</th>
            <th>Date</th>
            <th>Reason</th>
            <th className="text-right">Amount</th>
            <th>Chargeable</th>
            {showProcurement && <th>Procured By</th>}
            <th>Status</th>
            <th>Receipts</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr className="empty-row">
              <td colSpan={showProcurement ? 10 : 9}>
                <div className="empty-state">
                  <Receipt size={32} />
                  <p>No expenses found</p>
                </div>
              </td>
            </tr>
          ) : (
            expenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                showProcurement={showProcurement}
                setDetailModal={setDetailModal}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
