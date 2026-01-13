/**
 * Expenses Billing Widget
 *
 * Widget showing monthly chargeable expenses for billing purposes.
 * Displays monthly totals with Ready, Billed, Received, and PO Number columns
 * matching the milestone billing format.
 * Includes expandable breakdown by category and resource.
 *
 * Ready to Bill: Defaults to Yes once 10 days past the end of that month.
 *
 * @version 2.0
 * @created 13 January 2026
 * @updated 13 January 2026 - Added Ready, Billed, Received, PO columns
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Receipt, ChevronDown, ChevronRight, Users, Check, X, FileText, Award } from 'lucide-react';
import { expensesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonFinanceWidget } from '../common';

export default function ExpensesBillingWidget({ editable = false, fullPage = false }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  const { canEditBilling } = usePermissions();
  const { showSuccess, showError } = useToast();

  const allowEdit = editable && canEditBilling;

  const [loading, setLoading] = useState(true);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState({});

  // Billing status per month: { monthKey: { ready, billed, received, poNumber } }
  const [monthStatus, setMonthStatus] = useState({});
  const [editingPO, setEditingPO] = useState(null);
  const [poValue, setPOValue] = useState('');

  // Check if a month is ready to bill (10 days past end of month)
  const isReadyToBill = (year, month) => {
    const endOfMonth = new Date(year, month + 1, 0); // Last day of month
    const readyDate = new Date(endOfMonth);
    readyDate.setDate(readyDate.getDate() + 10); // 10 days after
    return new Date() >= readyDate;
  };

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const expenses = await expensesService.getAll(projectId);

      // Filter to only chargeable expenses
      const chargeableExpenses = (expenses || []).filter(e =>
        e.chargeable_to_customer !== false && !e.is_deleted
      );

      // Group by month
      const byMonth = {};
      chargeableExpenses.forEach(expense => {
        const date = new Date(expense.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

        if (!byMonth[monthKey]) {
          byMonth[monthKey] = {
            key: monthKey,
            label: monthLabel,
            year: date.getFullYear(),
            month: date.getMonth(),
            total: 0,
            count: 0,
            expenses: [],
            byCategory: {},
            byResource: {}
          };
        }

        const amount = parseFloat(expense.amount || 0);
        byMonth[monthKey].total += amount;
        byMonth[monthKey].count += 1;
        byMonth[monthKey].expenses.push(expense);

        // Group by category
        const category = expense.category || 'Other';
        if (!byMonth[monthKey].byCategory[category]) {
          byMonth[monthKey].byCategory[category] = { total: 0, count: 0 };
        }
        byMonth[monthKey].byCategory[category].total += amount;
        byMonth[monthKey].byCategory[category].count += 1;

        // Group by resource
        const resource = expense.resource_name || 'Unassigned';
        if (!byMonth[monthKey].byResource[resource]) {
          byMonth[monthKey].byResource[resource] = { total: 0, count: 0 };
        }
        byMonth[monthKey].byResource[resource].total += amount;
        byMonth[monthKey].byResource[resource].count += 1;
      });

      // Sort by date descending (most recent first)
      const sorted = Object.values(byMonth).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setMonthlyExpenses(sorted);

      // Initialize status for each month with auto-ready calculation
      const initialStatus = {};
      sorted.forEach(m => {
        if (!monthStatus[m.key]) {
          initialStatus[m.key] = {
            ready: isReadyToBill(m.year, m.month),
            billed: false,
            received: false,
            poNumber: ''
          };
        }
      });
      setMonthStatus(prev => ({ ...initialStatus, ...prev }));

    } catch (error) {
      console.error('ExpensesBillingWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const toggleStatus = (monthKey, field) => {
    if (!allowEdit) return;
    setMonthStatus(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [field]: !prev[monthKey]?.[field]
      }
    }));
    showSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} status updated`);
  };

  const handlePOEdit = (monthKey) => {
    if (!allowEdit) return;
    setEditingPO(monthKey);
    setPOValue(monthStatus[monthKey]?.poNumber || '');
  };

  const handlePOSave = (monthKey) => {
    setMonthStatus(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        poNumber: poValue
      }
    }));
    setEditingPO(null);
    showSuccess('PO number updated');
  };

  const navigateToExpenses = (monthData) => {
    navigate(`/expenses?month=${monthData.key}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalChargeable = monthlyExpenses.reduce((sum, m) => sum + m.total, 0);
  const totalBilled = monthlyExpenses.filter(m => monthStatus[m.key]?.billed).reduce((sum, m) => sum + m.total, 0);
  const totalReceived = monthlyExpenses.filter(m => monthStatus[m.key]?.received).reduce((sum, m) => sum + m.total, 0);

  const getCategoryColor = (category) => {
    const colors = {
      'Travel': { bg: '#dbeafe', color: '#1d4ed8' },
      'Accommodation': { bg: '#fef3c7', color: '#b45309' },
      'Sustenance': { bg: '#dcfce7', color: '#16a34a' }
    };
    return colors[category] || { bg: '#f1f5f9', color: '#64748b' };
  };

  if (loading) {
    return <SkeletonFinanceWidget />;
  }

  return (
    <div className="dashboard-widget expenses-billing-widget" data-testid="expenses-billing-widget">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Receipt size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
            Expenses Billing
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }} data-testid="expenses-billing-total">
            {formatCurrency(totalChargeable)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '1rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <span style={{ color: '#64748b' }}>Billed: </span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>{formatCurrency(totalBilled)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Received: </span>
          <span style={{ fontWeight: '600', color: '#2563eb' }}>{formatCurrency(totalReceived)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Outstanding: </span>
          <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(totalChargeable - totalReceived)}</span>
        </div>
      </div>

      {/* Monthly Expenses Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Month</th>
              <th style={{ textAlign: 'right', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Amount</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Ready</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Billed</th>
              <th style={{ textAlign: 'center', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>Received</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem', fontWeight: '600', color: '#64748b' }}>PO Number</th>
            </tr>
          </thead>
          <tbody>
            {monthlyExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No chargeable expenses found
                </td>
              </tr>
            ) : (
              monthlyExpenses.map(monthData => {
                const status = monthStatus[monthData.key] || {};
                const autoReady = isReadyToBill(monthData.year, monthData.month);
                const isReady = status.ready !== undefined ? status.ready : autoReady;

                return (
                  <React.Fragment key={monthData.key}>
                    <tr
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: status.received ? '#f0fdf4' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.625rem 0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => toggleMonth(monthData.key)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '0.125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#64748b'
                            }}
                          >
                            {expandedMonths[monthData.key] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          <div>
                            {fullPage ? (
                              <Link
                                to={`/expenses?month=${monthData.key}`}
                                style={{ textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ fontWeight: '500', color: '#3b82f6' }}>{monthData.label}</div>
                              </Link>
                            ) : (
                              <div style={{ fontWeight: '500' }}>{monthData.label}</div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {monthData.count} expense{monthData.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.625rem 0.25rem', fontWeight: '600' }}>
                        {formatCurrency(monthData.total)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: isReady ? '#dcfce7' : '#fef3c7',
                            color: isReady ? '#16a34a' : '#d97706'
                          }}
                          title={isReady ? 'Ready to bill (10+ days past month end)' : 'Not yet ready (less than 10 days past month end)'}
                        >
                          <Award size={12} />
                          {isReady ? 'Yes' : 'No'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStatus(monthData.key, 'billed'); }}
                          disabled={!allowEdit}
                          title={status.billed ? 'Mark as not billed' : 'Mark as billed'}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: allowEdit ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: status.billed ? '#dcfce7' : '#f1f5f9',
                            color: status.billed ? '#16a34a' : '#94a3b8'
                          }}
                        >
                          {status.billed ? <Check size={16} /> : <X size={16} />}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.625rem 0.25rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStatus(monthData.key, 'received'); }}
                          disabled={!allowEdit}
                          title={status.received ? 'Mark as not received' : 'Mark as received'}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: allowEdit ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: status.received ? '#dbeafe' : '#f1f5f9',
                            color: status.received ? '#2563eb' : '#94a3b8'
                          }}
                        >
                          {status.received ? <Check size={16} /> : <X size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.625rem 0.25rem' }}>
                        {editingPO === monthData.key ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={poValue}
                              onChange={(e) => setPOValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handlePOSave(monthData.key)}
                              style={{
                                width: '100px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px'
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handlePOSave(monthData.key)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => { e.stopPropagation(); allowEdit && handlePOEdit(monthData.key); }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              color: status.poNumber ? '#1e293b' : '#94a3b8',
                              cursor: allowEdit ? 'pointer' : 'default',
                              borderRadius: '4px',
                              backgroundColor: allowEdit ? '#f8fafc' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <FileText size={12} />
                            {status.poNumber || (allowEdit ? 'Add PO' : '—')}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedMonths[monthData.key] && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div style={{
                            padding: '1rem 1rem 1rem 2.5rem',
                            backgroundColor: '#fafafa',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            {/* By Category */}
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                By Type
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {Object.entries(monthData.byCategory).map(([category, data]) => {
                                  const colors = getCategoryColor(category);
                                  return (
                                    <div
                                      key={category}
                                      style={{
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: colors.bg,
                                        borderRadius: '8px',
                                        minWidth: '100px'
                                      }}
                                    >
                                      <div style={{ fontSize: '0.75rem', color: colors.color, fontWeight: '500' }}>
                                        {category}
                                      </div>
                                      <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.color }}>
                                        {formatCurrency(data.total)}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: colors.color, opacity: 0.8 }}>
                                        {data.count} item{data.count !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* By Resource */}
                            <div>
                              <div style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <Users size={14} />
                                By Resource
                              </div>
                              <table style={{ width: '100%', maxWidth: '400px', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '0.375rem 0.25rem', fontWeight: '500', color: '#64748b' }}>Resource</th>
                                    <th style={{ textAlign: 'right', padding: '0.375rem 0.25rem', fontWeight: '500', color: '#64748b' }}>Count</th>
                                    <th style={{ textAlign: 'right', padding: '0.375rem 0.25rem', fontWeight: '500', color: '#64748b' }}>Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(monthData.byResource)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .map(([resource, data]) => (
                                      <tr key={resource} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem 0.25rem', color: '#1e293b' }}>{resource}</td>
                                        <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: '#64748b' }}>
                                          {data.count}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', fontWeight: '600' }}>
                                          {formatCurrency(data.total)}
                                        </td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
