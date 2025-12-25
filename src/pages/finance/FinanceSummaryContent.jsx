/**
 * Finance Summary Content - Tab content for FinanceHub
 * 
 * Expanded version of dashboard finance widget showing:
 * - Total billable from milestones
 * - Timesheet values (pending/validated) with gap calculation
 * - Expenses breakdown by status and chargeability
 * - PMO overhead percentage
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PoundSterling, TrendingUp, TrendingDown, Clock, CheckCircle,
  RefreshCw, FileText, Receipt, Users, AlertCircle, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { milestonesService, timesheetsService, expensesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { calculateBillableValue, isPMORole } from '../../config/metricsConfig';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency } from '../../lib/formatters';
import './FinanceSummaryContent.css';

export default function FinanceSummaryContent() {
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    pmoPercentage: 0,
    // Counts
    timesheetCount: 0,
    expenseCount: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // Fetch milestones for total billable
      const milestones = await milestonesService.getAll(projectId);
      const totalBillable = milestones?.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0) || 0;
      
      // Fetch timesheets with resource info
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('id, hours_worked, hours, status, resource_id, resources!inner(sell_price, role)')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false');
      
      if (tsError) throw tsError;
      
      // Calculate timesheet values
      let pending = 0, validated = 0, pmo = 0;
      const validatedStatuses = ['approved', 'invoiced', 'paid'];
      const pendingStatuses = ['submitted'];
      
      (timesheets || []).forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const sellPrice = parseFloat(ts.resources?.sell_price || 0);
        const value = calculateBillableValue(hours, sellPrice);
        const role = ts.resources?.role;
        
        if (validatedStatuses.includes(ts.status)) {
          validated += value;
          if (isPMORole(role)) pmo += value;
        } else if (pendingStatuses.includes(ts.status)) {
          pending += value;
        }
      });
      
      // Fetch expenses
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('id, amount, status, chargeable_to_customer')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false');
      
      if (expError) throw expError;
      
      // Calculate expense breakdown
      let pendingChargeable = 0, pendingNonChargeable = 0;
      let validatedChargeable = 0, validatedNonChargeable = 0;
      
      (expenses || []).forEach(exp => {
        const amount = parseFloat(exp.amount || 0);
        const isChargeable = exp.chargeable_to_customer;
        const isValidated = validatedStatuses.includes(exp.status);
        const isPending = pendingStatuses.includes(exp.status);
        
        if (isValidated) {
          if (isChargeable) validatedChargeable += amount;
          else validatedNonChargeable += amount;
        } else if (isPending) {
          if (isChargeable) pendingChargeable += amount;
          else pendingNonChargeable += amount;
        }
      });
      
      const timesheetsTotal = pending + validated;
      const gap = totalBillable - timesheetsTotal;
      const pmoPercentage = timesheetsTotal > 0 ? (pmo / timesheetsTotal) * 100 : 0;
      
      setStats({
        totalBillable,
        timesheetsPending: pending,
        timesheetsValidated: validated,
        timesheetsTotal,
        gap,
        expensesPendingChargeable: pendingChargeable,
        expensesPendingNonChargeable: pendingNonChargeable,
        expensesValidatedChargeable: validatedChargeable,
        expensesValidatedNonChargeable: validatedNonChargeable,
        expensesTotalPending: pendingChargeable + pendingNonChargeable,
        expensesTotalValidated: validatedChargeable + validatedNonChargeable,
        expensesTotalChargeable: pendingChargeable + validatedChargeable,
        expensesTotalNonChargeable: pendingNonChargeable + validatedNonChargeable,
        pmoTimesheets: pmo,
        pmoPercentage,
        timesheetCount: timesheets?.length || 0,
        expenseCount: expenses?.length || 0
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

  if (loading) {
    return <LoadingSpinner message="Loading finance summary..." />;
  }

  const gapIsPositive = stats.gap >= 0;

  return (
    <div className="finance-summary">
      {/* Header with refresh */}
      <div className="summary-header">
        <h2>Financial Overview</h2>
        <button 
          className="btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="stats-grid">
        {/* Total Billable */}
        <div className="stat-card billable">
          <div className="stat-icon">
            <PoundSterling size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Billable</span>
            <span className="stat-value">{formatCurrency(stats.totalBillable)}</span>
            <span className="stat-subtitle">From milestones</span>
          </div>
        </div>

        {/* Timesheets Total */}
        <div className="stat-card timesheets">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Timesheet Value</span>
            <span className="stat-value">{formatCurrency(stats.timesheetsTotal)}</span>
            <span className="stat-subtitle">{stats.timesheetCount} entries</span>
          </div>
        </div>

        {/* Gap */}
        <div className={`stat-card gap ${gapIsPositive ? 'positive' : 'negative'}`}>
          <div className="stat-icon">
            {gapIsPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="stat-content">
            <span className="stat-label">Gap (Billable - Timesheets)</span>
            <span className="stat-value">
              {gapIsPositive ? '+' : ''}{formatCurrency(stats.gap)}
            </span>
            <span className="stat-subtitle">
              {gapIsPositive ? 'Under budget' : 'Over budget'}
            </span>
          </div>
        </div>

        {/* PMO Overhead */}
        <div className="stat-card pmo">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">PMO Overhead</span>
            <span className="stat-value">{stats.pmoPercentage.toFixed(1)}%</span>
            <span className="stat-subtitle">{formatCurrency(stats.pmoTimesheets)}</span>
          </div>
        </div>
      </div>

      {/* Detail Sections */}
      <div className="detail-sections">
        {/* Timesheets Section */}
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-title">
              <Clock size={20} />
              <h3>Timesheets</h3>
            </div>
            <Link to="/timesheets" className="detail-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="detail-grid">
            <div className="detail-item pending">
              <span className="detail-label">
                <AlertCircle size={14} /> Pending Approval
              </span>
              <span className="detail-value">{formatCurrency(stats.timesheetsPending)}</span>
            </div>
            <div className="detail-item validated">
              <span className="detail-label">
                <CheckCircle size={14} /> Validated
              </span>
              <span className="detail-value">{formatCurrency(stats.timesheetsValidated)}</span>
            </div>
          </div>
          <div className="detail-total">
            <span>Total</span>
            <span>{formatCurrency(stats.timesheetsTotal)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-title">
              <Receipt size={20} />
              <h3>Expenses</h3>
            </div>
            <Link to="/expenses" className="detail-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="expenses-matrix">
            <div className="matrix-header">
              <span></span>
              <span>Chargeable</span>
              <span>Non-Chargeable</span>
              <span>Total</span>
            </div>
            <div className="matrix-row">
              <span className="row-label">Pending</span>
              <span>{formatCurrency(stats.expensesPendingChargeable)}</span>
              <span>{formatCurrency(stats.expensesPendingNonChargeable)}</span>
              <span className="row-total">{formatCurrency(stats.expensesTotalPending)}</span>
            </div>
            <div className="matrix-row">
              <span className="row-label">Validated</span>
              <span>{formatCurrency(stats.expensesValidatedChargeable)}</span>
              <span>{formatCurrency(stats.expensesValidatedNonChargeable)}</span>
              <span className="row-total">{formatCurrency(stats.expensesTotalValidated)}</span>
            </div>
            <div className="matrix-row totals">
              <span className="row-label">Total</span>
              <span>{formatCurrency(stats.expensesTotalChargeable)}</span>
              <span>{formatCurrency(stats.expensesTotalNonChargeable)}</span>
              <span className="row-total">
                {formatCurrency(stats.expensesTotalChargeable + stats.expensesTotalNonChargeable)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/finance?tab=billing" className="action-card">
          <FileText size={24} />
          <div>
            <h4>Billing & Invoices</h4>
            <p>Track billable milestones and invoicing</p>
          </div>
          <ArrowRight size={20} />
        </Link>
        <Link to="/timesheets" className="action-card">
          <Clock size={24} />
          <div>
            <h4>Manage Timesheets</h4>
            <p>Review and approve time entries</p>
          </div>
          <ArrowRight size={20} />
        </Link>
        <Link to="/expenses" className="action-card">
          <Receipt size={24} />
          <div>
            <h4>Manage Expenses</h4>
            <p>Review and approve expense claims</p>
          </div>
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
