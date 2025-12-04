/**
 * Deliverables Widget
 * 
 * Dashboard widget showing deliverables status breakdown.
 * Clicking anywhere navigates to the Deliverables page.
 * 
 * @version 1.0
 * @created 4 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, ThumbsUp, Clock, RotateCcw, RefreshCw, Circle } from 'lucide-react';
import { deliverablesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { useTestUsers } from '../../contexts/TestUserContext';

export default function DeliverablesWidget({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    reviewComplete: 0,
    awaitingReview: 0,
    returned: 0,
    inProgress: 0,
    notStarted: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const deliverables = await deliverablesService.getAllWithRelations(projectId, showTestUsers);

      // Calculate stats by status
      let delivered = 0;
      let reviewComplete = 0;
      let awaitingReview = 0;
      let returned = 0;
      let inProgress = 0;
      let notStarted = 0;

      deliverables.forEach(d => {
        switch (d.status) {
          case 'Delivered':
            delivered++;
            break;
          case 'Review Complete':
            reviewComplete++;
            break;
          case 'Submitted for Review':
            awaitingReview++;
            break;
          case 'Returned for More Work':
            returned++;
            break;
          case 'In Progress':
            inProgress++;
            break;
          case 'Not Started':
          default:
            notStarted++;
            break;
        }
      });

      setStats({
        total: deliverables.length,
        delivered,
        reviewComplete,
        awaitingReview,
        returned,
        inProgress,
        notStarted
      });
    } catch (error) {
      console.error('DeliverablesWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleClick = () => {
    navigate('/deliverables');
  };

  if (loading) {
    return (
      <div className="dashboard-widget" onClick={handleClick}>
        <div className="widget-header">
          <div className="widget-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Package size={20} />
          </div>
          <span className="widget-title">Deliverables</span>
        </div>
        <div className="widget-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget" onClick={handleClick}>
      <div className="widget-header">
        <div className="widget-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
          <Package size={20} />
        </div>
        <span className="widget-title">Deliverables</span>
        <span className="widget-total">{stats.total} Total</span>
      </div>
      
      <div className="widget-breakdown">
        <div className="widget-row">
          <div className="widget-row-icon approved">
            <CheckCircle size={16} />
          </div>
          <span className="widget-row-label">Delivered</span>
          <span className="widget-row-value">{stats.delivered}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <ThumbsUp size={16} />
          </div>
          <span className="widget-row-label">Review Complete</span>
          <span className="widget-row-value">{stats.reviewComplete}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon pending">
            <Clock size={16} />
          </div>
          <span className="widget-row-label">Awaiting Review</span>
          <span className="widget-row-value">{stats.awaitingReview}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
            <RotateCcw size={16} />
          </div>
          <span className="widget-row-label">Returned</span>
          <span className="widget-row-value">{stats.returned}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <RefreshCw size={16} />
          </div>
          <span className="widget-row-label">In Progress</span>
          <span className="widget-row-value">{stats.inProgress}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon progress">
            <Circle size={16} />
          </div>
          <span className="widget-row-label">Not Started</span>
          <span className="widget-row-value">{stats.notStarted}</span>
        </div>
      </div>
    </div>
  );
}
