/**
 * Expense Filters Component
 * 
 * Filter bar for expenses table with:
 * - Category filter
 * - Resource filter
 * - Status filter  
 * - Chargeable filter
 * - Procurement method filter (admin/supplier only)
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Expenses.jsx
 */

import React from 'react';

const CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];
const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected',
  'Paid': 'Paid'
};

export default function ExpenseFilters({
  filterCategory,
  setFilterCategory,
  filterResource,
  setFilterResource,
  filterStatus,
  setFilterStatus,
  filterChargeable,
  setFilterChargeable,
  filterProcurement,
  setFilterProcurement,
  resourceNames,
  hasRole
}) {
  const selectStyle = {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db'
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '500' }}>Filter:</span>
        
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)} 
          style={selectStyle}
        >
          <option value="all">All Types</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select 
          value={filterResource} 
          onChange={(e) => setFilterResource(e.target.value)} 
          style={selectStyle}
        >
          <option value="all">All Resources</option>
          {resourceNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
        </select>
        
        <select 
          value={filterChargeable} 
          onChange={(e) => setFilterChargeable(e.target.value)} 
          style={selectStyle}
        >
          <option value="all">All Expenses</option>
          <option value="chargeable">Chargeable Only</option>
          <option value="non-chargeable">Non-Chargeable Only</option>
        </select>
        
        {hasRole(['admin', 'supplier_pm']) && (
          <select 
            value={filterProcurement} 
            onChange={(e) => setFilterProcurement(e.target.value)} 
            style={selectStyle}
          >
            <option value="all">All Procurement</option>
            <option value="supplier">Supplier Procured</option>
            <option value="partner">Partner Procured</option>
          </select>
        )}
      </div>
    </div>
  );
}
