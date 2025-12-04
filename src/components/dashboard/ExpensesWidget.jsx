/**
 * Expenses Widget
 * 
 * Dashboard widget showing expense validation status and chargeability breakdown.
 * Shows awaiting validation, then validated totals split by chargeable/non-chargeable.
 * Excludes deleted and rejected expenses.
 * 
 * @version 1.0
 * @created 4 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Clock, CheckCircle, CreditCard, Building2 } from 'lucide-react';
import { expensesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';

export default function ExpensesWidget() {
  const navigate = useNavigate();
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    awaitingValue: 0,
    validatedTotal: 0,
    chargeableValue: 0,
    nonChargeableValue: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Fetch all expenses
      const expenses = await expensesService.getAll(projectId, {
        select: 'id, amount, status, chargeable_to_customer, is_deleted'
      });

      // Filter out deleted expenses
      const activeExpenses = (expenses || []).filter(exp => exp.is_deleted !== true);

      let awaitingValue = 0;
      let validatedTotal = 0;
      let chargeableValue = 0;
      let nonChargeableValue = 0;

      activeExpenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);

        switch (exp.status) {
          case 'Submitted':
            awaitingValue += amount;
            break;
          case 'Validated':
          case 'Approved':
            validatedTotal += amount;
            if (exp.chargeable_to_customer !== false) {
              chargeableValue += amount;
            } else {
              nonChargeableValue += amount;
            }
            break;
          // Draft and Rejected are excluded from display
        }
      });

      setStats({
        awaitingValue,
        validatedTotal,
        chargeableValue,
        nonChargeableValue
      });
    } catch (error) {
      console.error('ExpensesWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClick = () => {
    navigate('/expenses');
  };

  const formatCurrency = (value) => {
    return `£${Math.round(value).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="dashboard-widget" onClick={handleClick}>
        <div className="widget-header">
          <div className="widget-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <Receipt size={20} />
          </div>
          <span className="widget-title">Expenses</span>
        </div>
        <div className="widget-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleClick}>
      <div className="widget-header">
        <div className="widget-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
          <Receipt size={20} />
        </div>
        <span className="widget-title">Expenses</span>
        <span className="widget-total">{formatCurrency(stats.validatedTotal)} Validated</span>
      </div>
      
      <div className="widget-breakdown">
        <div className="widget-row">
          <div className="widget-row-icon pending">
            <Clock size={16} />
          </div>
          <span className="widget-row-label">Awaiting Validation</span>
          <span className="widget-row-value">{formatCurrency(stats.awaitingValue)}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon approved">
            <CheckCircle size={16} />
          </div>
          <span className="widget-row-label">Validated Total</span>
          <span className="widget-row-value">{formatCurrency(stats.validatedTotal)}</span>
        </div>
        
        <div className="widget-row" style={{ paddingLeft: '1.5rem' }}>
          <div className="widget-row-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <CreditCard size={16} />
          </div>
          <span className="widget-row-label">↳ Chargeable</span>
          <span className="widget-row-value">{formatCurrency(stats.chargeableValue)}</span>
        </div>
        
        <div className="widget-row" style={{ paddingLeft: '1.5rem' }}>
          <div className="widget-row-icon" style={{ background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}>
            <Building2 size={16} />
          </div>
          <span className="widget-row-label">↳ Non-Chargeable</span>
          <span className="widget-row-value">{formatCurrency(stats.nonChargeableValue)}</span>
        </div>
      </div>
    </div>
  );
}
