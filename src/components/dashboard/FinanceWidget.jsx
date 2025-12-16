/**
 * Finance Widget
 * 
 * Dashboard widget showing financial overview:
 * - Total billable from milestones
 * - Timesheet values (pending/validated) with gap calculation
 * - Expenses breakdown by status and chargeability
 * - PMO overhead percentage
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PoundSterling, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { milestonesService, timesheetsService, expensesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { calculateBillableValue, isPMORole } from '../../config/metricsConfig';
import { supabase } from '../../lib/supabase';
import { SkeletonFinanceWidget } from '../common';

export default function FinanceWidget({ refreshTrigger }) {
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    // Billable
    totalBillable: 0,
    // Timesheets
    timesheetsPending: 0,
    timesheetsValidated: 0,
    timesheetsTotal: 0,
    gap: 0,
    // Expenses - 2x2 matrix
    expensesPendingChargeable: 0,
    expensesPendingNonChargeable: 0,
    expensesValidatedChargeable: 0,
    expensesValidatedNonChargeable: 0,
    // Expense totals
    expensesTotalPending: 0,
    expensesTotalValidated: 0,
    expensesTotalChargeable: 0,
    expensesTotalNonChargeable: 0,
    // PMO
    pmoTimesheets: 0,
    pmoPercentage: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
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
          // Draft and Rejected excluded
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
          // Draft and Rejected excluded
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
      console.error('FinanceWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const formatCurrency = (value) => {
    const absValue = Math.abs(Math.round(value));
    const formatted = `£${absValue.toLocaleString()}`;
    return value < 0 ? `-${formatted}` : formatted;
  };

  if (loading) {
    return <SkeletonFinanceWidget />;
  }

  const isNegativeGap = stats.gap < 0;

  return (
    <div className="dashboard-widget finance-widget" data-testid="finance-widget">
      <div className="widget-header">
        <div className="widget-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <PoundSterling size={20} />
        </div>
        <span className="widget-title">Finance</span>
      </div>
      
      <div className="finance-content">
        {/* Total Billable */}
        <div className="finance-section finance-billable">
          <div className="finance-row finance-row-large">
            <span className="finance-label">Total Billable</span>
            <span className="finance-value" data-testid="finance-total-billable">{formatCurrency(stats.totalBillable)}</span>
          </div>
        </div>

        {/* Timesheets */}
        <div className="finance-section">
          <div className="finance-section-header">Timesheets</div>
          <div className="finance-row">
            <Clock size={14} className="finance-icon pending" />
            <span className="finance-label">Pending Validation</span>
            <span className="finance-value">{formatCurrency(stats.timesheetsPending)}</span>
          </div>
          <div className="finance-row">
            <CheckCircle size={14} className="finance-icon approved" />
            <span className="finance-label">Validated</span>
            <span className="finance-value">{formatCurrency(stats.timesheetsValidated)}</span>
          </div>
          <div className="finance-row finance-row-total">
            <span className="finance-label">Total</span>
            <span className="finance-value">{formatCurrency(stats.timesheetsTotal)}</span>
          </div>
          <div className={`finance-row finance-row-gap ${isNegativeGap ? 'negative' : 'positive'}`}>
            {isNegativeGap ? (
              <TrendingDown size={14} className="finance-icon" />
            ) : (
              <TrendingUp size={14} className="finance-icon" />
            )}
            <span className="finance-label">Gap vs Billable</span>
            <span className="finance-value">{formatCurrency(stats.gap)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="finance-section">
          <div className="finance-section-header">Expenses</div>
          <div className="finance-expenses-grid">
            <div className="finance-expenses-header"></div>
            <div className="finance-expenses-header">Chargeable</div>
            <div className="finance-expenses-header">Non-Chg</div>
            <div className="finance-expenses-header">Total</div>
            
            <div className="finance-expenses-label">
              <Clock size={12} className="finance-icon pending" />
              Pending
            </div>
            <div className="finance-expenses-value">{formatCurrency(stats.expensesPendingChargeable)}</div>
            <div className="finance-expenses-value">{formatCurrency(stats.expensesPendingNonChargeable)}</div>
            <div className="finance-expenses-value finance-expenses-total">{formatCurrency(stats.expensesTotalPending)}</div>
            
            <div className="finance-expenses-label">
              <CheckCircle size={12} className="finance-icon approved" />
              Validated
            </div>
            <div className="finance-expenses-value">{formatCurrency(stats.expensesValidatedChargeable)}</div>
            <div className="finance-expenses-value">{formatCurrency(stats.expensesValidatedNonChargeable)}</div>
            <div className="finance-expenses-value finance-expenses-total">{formatCurrency(stats.expensesTotalValidated)}</div>
            
            <div className="finance-expenses-label finance-expenses-total-label">Total</div>
            <div className="finance-expenses-value finance-expenses-total">{formatCurrency(stats.expensesTotalChargeable)}</div>
            <div className="finance-expenses-value finance-expenses-total">{formatCurrency(stats.expensesTotalNonChargeable)}</div>
            <div className="finance-expenses-value finance-expenses-grand-total">
              {formatCurrency(stats.expensesTotalChargeable + stats.expensesTotalNonChargeable)}
            </div>
          </div>
        </div>

        {/* PMO Overhead */}
        <div className="finance-section">
          <div className="finance-section-header">PMO Overhead</div>
          <div className="finance-row">
            <span className="finance-label">PMO Timesheets</span>
            <span className="finance-value">{formatCurrency(stats.pmoTimesheets)}</span>
          </div>
          <div className="finance-row">
            <span className="finance-label">% of Total Timesheets</span>
            <span className="finance-value">{stats.pmoPercentage.toFixed(1)}%</span>
          </div>
          <div className="finance-pmo-bar">
            <div 
              className="finance-pmo-bar-fill" 
              style={{ width: `${Math.min(stats.pmoPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
