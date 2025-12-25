/**
 * Finance Summary Content - Tab content for FinanceHub
 * 
 * Replicates the dashboard finance widget showing:
 * - Total billable from milestones
 * - Timesheet values (pending/validated) with gap calculation
 * - Expenses breakdown by status and chargeability
 * - PMO overhead percentage
 * 
 * @version 2.0 - Replicated dashboard widget layout
 * @updated 25 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PoundSterling, TrendingUp, TrendingDown, Clock, CheckCircle,
  RefreshCw
} from 'lucide-react';
import { milestonesService, timesheetsService, expensesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { calculateBillableValue, isPMORole } from '../../config/metricsConfig';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common';
import './FinanceSummaryContent.css';

export default function FinanceSummaryContent() {
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBillable: 0,
    timesheetsPending: 0,
    timesheetsValidated: 0,
    timesheetsTotal: 0,
    gap: 0,
    expensesPendingChargeable: 0,
    expensesPendingNonChargeable: 0,
    expensesValidatedChargeable: 0,
    expensesValidatedNonChargeable: 0,
    expensesTotalPending: 0,
    expensesTotalValidated: 0,
    expensesTotalChargeable: 0,
    expensesTotalNonChargeable: 0,
    pmoTimesheets: 0,
    pmoPercentage: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // 1. Get total billable from milestones
      const milestones = await milestonesService.getAll(projectId, {
        select: 'id, billable'
      });
      const totalBillable = (milestones || [])
        .reduce((sum, m) => sum + (parseFloat(m.billable) || 0), 0);

      // 2. Get timesheets with resource data (including role for PMO check)
      const timesheets = await timesheetsService.getAll(projectId, {
        select: `
          id, hours_worked, hours, status, is_deleted,
          resources(id, sell_price, role)
        `
      });

      // Filter out deleted timesheets
      const activeTimesheets = (timesheets || []).filter(ts => ts.is_deleted !== true);

      let timesheetsPending = 0;
      let timesheetsValidated = 0;
      let pmoTimesheets = 0;

      activeTimesheets.forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const sellPrice = ts.resources?.sell_price || 0;
        const billableValue = calculateBillableValue(hours, sellPrice);
        const isPMO = isPMORole(ts.resources?.role);

        switch (ts.status) {
          case 'Submitted':
            timesheetsPending += billableValue;
            if (isPMO) pmoTimesheets += billableValue;
            break;
          case 'Validated':
          case 'Approved':
            timesheetsValidated += billableValue;
            if (isPMO) pmoTimesheets += billableValue;
            break;
        }
      });

      const timesheetsTotal = timesheetsPending + timesheetsValidated;
      const gap = totalBillable - timesheetsTotal;
      const pmoPercentage = timesheetsTotal > 0 
        ? (pmoTimesheets / timesheetsTotal) * 100 
        : 0;

      // 3. Get expenses with chargeability
      const expenses = await expensesService.getAll(projectId, {
        select: 'id, amount, status, chargeable_to_customer, is_deleted'
      });

      // Filter out deleted expenses
      const activeExpenses = (expenses || []).filter(exp => exp.is_deleted !== true);

      let expensesPendingChargeable = 0;
      let expensesPendingNonChargeable = 0;
      let expensesValidatedChargeable = 0;
      let expensesValidatedNonChargeable = 0;

      activeExpenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);
        const isChargeable = exp.chargeable_to_customer !== false;

        switch (exp.status) {
          case 'Submitted':
            if (isChargeable) {
              expensesPendingChargeable += amount;
            } else {
              expensesPendingNonChargeable += amount;
            }
            break;
          case 'Validated':
          case 'Approved':
            if (isChargeable) {
              expensesValidatedChargeable += amount;
            } else {
              expensesValidatedNonChargeable += amount;
            }
            break;
        }
      });

      setStats({
        totalBillable,
        timesheetsPending,
        timesheetsValidated,
        timesheetsTotal,
        gap,
        expensesPendingChargeable,
        expensesPendingNonChargeable,
        expensesValidatedChargeable,
        expensesValidatedNonChargeable,
        expensesTotalPending: expensesPendingChargeable + expensesPendingNonChargeable,
        expensesTotalValidated: expensesValidatedChargeable + expensesValidatedNonChargeable,
        expensesTotalChargeable: expensesPendingChargeable + expensesValidatedChargeable,
        expensesTotalNonChargeable: expensesPendingNonChargeable + expensesValidatedNonChargeable,
        pmoTimesheets,
        pmoPercentage
      });
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (value) => {
    const absValue = Math.abs(Math.round(value));
    const formatted = `£${absValue.toLocaleString()}`;
    return value < 0 ? `-${formatted}` : formatted;
  };

  if (loading) {
    return <LoadingSpinner message="Loading finance summary..." />;
  }

  const isNegativeGap = stats.gap < 0;

  return (
    <div className="finance-summary-widget">
      {/* Header with refresh */}
      <div className="fsw-header">
        <div className="fsw-header-left">
          <div className="fsw-icon">
            <PoundSterling size={24} />
          </div>
          <span className="fsw-title">Finance</span>
        </div>
        <button 
          className="fsw-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="fsw-content">
        {/* Total Billable */}
        <div className="fsw-section fsw-billable">
          <div className="fsw-row fsw-row-large">
            <span className="fsw-label">Total Billable</span>
            <span className="fsw-value">{formatCurrency(stats.totalBillable)}</span>
          </div>
        </div>

        {/* Timesheets */}
        <div className="fsw-section">
          <div className="fsw-section-header">Timesheets</div>
          <div className="fsw-row">
            <Clock size={14} className="fsw-icon-sm pending" />
            <span className="fsw-label">Pending Validation</span>
            <span className="fsw-value">{formatCurrency(stats.timesheetsPending)}</span>
          </div>
          <div className="fsw-row">
            <CheckCircle size={14} className="fsw-icon-sm approved" />
            <span className="fsw-label">Validated</span>
            <span className="fsw-value">{formatCurrency(stats.timesheetsValidated)}</span>
          </div>
          <div className="fsw-row fsw-row-total">
            <span className="fsw-label">Total</span>
            <span className="fsw-value">{formatCurrency(stats.timesheetsTotal)}</span>
          </div>
          <div className={`fsw-row fsw-row-gap ${isNegativeGap ? 'negative' : 'positive'}`}>
            {isNegativeGap ? (
              <TrendingDown size={14} className="fsw-icon-sm" />
            ) : (
              <TrendingUp size={14} className="fsw-icon-sm" />
            )}
            <span className="fsw-label">Gap vs Billable</span>
            <span className="fsw-value">{formatCurrency(stats.gap)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="fsw-section">
          <div className="fsw-section-header">Expenses</div>
          <div className="fsw-expenses-grid">
            <div className="fsw-expenses-header"></div>
            <div className="fsw-expenses-header">Chargeable</div>
            <div className="fsw-expenses-header">Non-Chg</div>
            <div className="fsw-expenses-header">Total</div>
            
            <div className="fsw-expenses-label">
              <Clock size={12} className="fsw-icon-sm pending" />
              Pending
            </div>
            <div className="fsw-expenses-value">{formatCurrency(stats.expensesPendingChargeable)}</div>
            <div className="fsw-expenses-value">{formatCurrency(stats.expensesPendingNonChargeable)}</div>
            <div className="fsw-expenses-value fsw-expenses-total">{formatCurrency(stats.expensesTotalPending)}</div>
            
            <div className="fsw-expenses-label">
              <CheckCircle size={12} className="fsw-icon-sm approved" />
              Validated
            </div>
            <div className="fsw-expenses-value">{formatCurrency(stats.expensesValidatedChargeable)}</div>
            <div className="fsw-expenses-value">{formatCurrency(stats.expensesValidatedNonChargeable)}</div>
            <div className="fsw-expenses-value fsw-expenses-total">{formatCurrency(stats.expensesTotalValidated)}</div>
            
            <div className="fsw-expenses-label fsw-expenses-total-label">Total</div>
            <div className="fsw-expenses-value fsw-expenses-total">{formatCurrency(stats.expensesTotalChargeable)}</div>
            <div className="fsw-expenses-value fsw-expenses-total">{formatCurrency(stats.expensesTotalNonChargeable)}</div>
            <div className="fsw-expenses-value fsw-expenses-grand-total">
              {formatCurrency(stats.expensesTotalChargeable + stats.expensesTotalNonChargeable)}
            </div>
          </div>
        </div>

        {/* PMO Overhead */}
        <div className="fsw-section">
          <div className="fsw-section-header">PMO Overhead</div>
          <div className="fsw-row">
            <span className="fsw-label">PMO Timesheets</span>
            <span className="fsw-value">{formatCurrency(stats.pmoTimesheets)}</span>
          </div>
          <div className="fsw-row">
            <span className="fsw-label">% of Total Timesheets</span>
            <span className="fsw-value">{stats.pmoPercentage.toFixed(1)}%</span>
          </div>
          <div className="fsw-pmo-bar">
            <div 
              className="fsw-pmo-bar-fill" 
              style={{ width: `${Math.min(stats.pmoPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
