/**
 * Expenses Billing Widget
 *
 * Widget showing monthly chargeable expenses for billing purposes.
 * Displays monthly totals with expandable breakdown by category and resource.
 * Includes click-through links to underlying expense data.
 *
 * @version 1.0
 * @created 13 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ChevronDown, ChevronRight, Calendar, Users, ExternalLink, Check, X } from 'lucide-react';
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
  const [billedMonths, setBilledMonths] = useState({});

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Fetch all chargeable expenses
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

  const toggleBilled = (monthKey) => {
    if (!allowEdit) return;
    setBilledMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
    showSuccess(`${billedMonths[monthKey] ? 'Unmarked' : 'Marked'} as billed`);
  };

  const navigateToExpenses = (monthData, filterType = null, filterValue = null) => {
    // Build URL with filters
    const [year, month] = monthData.key.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    // Navigate to expenses page - the filter state will need to be handled there
    // For now, navigate and show which month to filter
    navigate(`/expenses?month=${monthData.key}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalChargeable = monthlyExpenses.reduce((sum, m) => sum + m.total, 0);
  const totalBilled = monthlyExpenses.filter(m => billedMonths[m.key]).reduce((sum, m) => sum + m.total, 0);

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
      <div className="widget-header">
        <div className="widget-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
          <Receipt size={20} />
        </div>
        <span className="widget-title">Expenses Billing</span>
        <span className="widget-total" data-testid="expenses-billing-total">
          {formatCurrency(totalChargeable)} Total
        </span>
      </div>

      {/* Summary Row */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <span style={{ color: '#64748b' }}>Chargeable: </span>
          <span style={{ fontWeight: '600', color: '#d97706' }}>{formatCurrency(totalChargeable)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Billed: </span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>{formatCurrency(totalBilled)}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Unbilled: </span>
          <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(totalChargeable - totalBilled)}</span>
        </div>
      </div>

      {/* Monthly Expenses List */}
      <div style={{ maxHeight: fullPage ? 'none' : '400px', overflowY: 'auto' }}>
        {monthlyExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No chargeable expenses found
          </div>
        ) : (
          monthlyExpenses.map(monthData => (
            <div
              key={monthData.key}
              style={{
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: billedMonths[monthData.key] ? '#f0fdf4' : 'transparent'
              }}
            >
              {/* Month Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 0.5rem',
                  cursor: 'pointer',
                  gap: '0.75rem'
                }}
                onClick={() => toggleMonth(monthData.key)}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {expandedMonths[monthData.key] ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {monthData.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {monthData.count} expense{monthData.count !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{
                  fontWeight: '600',
                  fontSize: '1rem',
                  color: '#1e293b',
                  minWidth: '100px',
                  textAlign: 'right'
                }}>
                  {formatCurrency(monthData.total)}
                </div>

                {/* Billed Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBilled(monthData.key); }}
                  disabled={!allowEdit}
                  title={billedMonths[monthData.key] ? 'Mark as unbilled' : 'Mark as billed'}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: allowEdit ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: billedMonths[monthData.key] ? '#dcfce7' : '#f1f5f9',
                    color: billedMonths[monthData.key] ? '#16a34a' : '#94a3b8'
                  }}
                >
                  {billedMonths[monthData.key] ? <Check size={16} /> : <X size={16} />}
                </button>

                {/* View Details Link */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigateToExpenses(monthData); }}
                  title="View expenses for this month"
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.375rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#3b82f6'
                  }}
                >
                  <ExternalLink size={14} />
                  View
                </button>
              </div>

              {/* Expanded Details */}
              {expandedMonths[monthData.key] && (
                <div style={{
                  padding: '0 0.5rem 1rem 2.5rem',
                  backgroundColor: '#fafafa'
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
                              minWidth: '120px'
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
                    <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'left', padding: '0.375rem 0.25rem', fontWeight: '500', color: '#64748b' }}>Resource</th>
                          <th style={{ textAlign: 'right', padding: '0.375rem 0.25rem', fontWeight: '500', color: '#64748b' }}>Expenses</th>
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
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
