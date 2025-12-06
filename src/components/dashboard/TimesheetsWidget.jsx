/**
 * Timesheets Widget
 * 
 * Dashboard widget showing timesheet submission and validation status.
 * Shows count and billable value (sell_price based) for each status.
 * Excludes deleted and rejected timesheets.
 * 
 * @version 1.0
 * @created 4 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Send, CheckCircle } from 'lucide-react';
import { timesheetsService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { calculateBillableValue } from '../../config/metricsConfig';
import { SkeletonWidget } from '../common';

export default function TimesheetsWidget({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    submittedCount: 0,
    submittedValue: 0,
    validatedCount: 0,
    validatedValue: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Fetch all timesheets with resource data for sell_price
      const timesheets = await timesheetsService.getAll(projectId, {
        select: `
          id, hours_worked, hours, status, is_deleted,
          resources(id, sell_price)
        `
      });

      // Filter out deleted timesheets
      const activeTimesheets = (timesheets || []).filter(ts => ts.is_deleted !== true);

      let submittedCount = 0;
      let submittedValue = 0;
      let validatedCount = 0;
      let validatedValue = 0;

      activeTimesheets.forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const sellPrice = ts.resources?.sell_price || 0;
        const billableValue = calculateBillableValue(hours, sellPrice);

        switch (ts.status) {
          case 'Submitted':
            submittedCount++;
            submittedValue += billableValue;
            break;
          case 'Validated':
          case 'Approved':
            validatedCount++;
            validatedValue += billableValue;
            break;
          // Draft and Rejected are excluded from display
        }
      });

      setStats({
        submittedCount,
        submittedValue,
        validatedCount,
        validatedValue
      });
    } catch (error) {
      console.error('TimesheetsWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleClick = () => {
    navigate('/timesheets');
  };

  const formatCurrency = (value) => {
    return `£${Math.round(value).toLocaleString()}`;
  };

  if (loading) {
    return <SkeletonWidget rows={2} />;
  }

  const totalCount = stats.submittedCount + stats.validatedCount;

  return (
    <div className="dashboard-widget" onClick={handleClick}>
      <div className="widget-header">
        <div className="widget-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
          <Clock size={20} />
        </div>
        <span className="widget-title">Timesheets</span>
        <span className="widget-total">{totalCount} Active</span>
      </div>
      
      <div className="widget-breakdown">
        <div className="widget-row">
          <div className="widget-row-icon pending">
            <Send size={16} />
          </div>
          <span className="widget-row-label">Submitted</span>
          <span className="widget-row-value">{stats.submittedCount}</span>
          <span className="widget-row-secondary">{formatCurrency(stats.submittedValue)}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon approved">
            <CheckCircle size={16} />
          </div>
          <span className="widget-row-label">Validated</span>
          <span className="widget-row-value">{stats.validatedCount}</span>
          <span className="widget-row-secondary">{formatCurrency(stats.validatedValue)}</span>
        </div>
      </div>
    </div>
  );
}
