/**
 * Milestone Detail Page
 * 
 * Displays detailed information for a single milestone including:
 * - Dates (baseline and forecast)
 * - Billable amount
 * - Dependencies (future feature)
 * - Linked deliverables with progress calculation
 * 
 * @version 2.1
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesService, deliverablesService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { 
  Target, ArrowLeft, AlertCircle, RefreshCw, Calendar, 
  PoundSterling, Package, CheckCircle, Clock, Link2, ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './MilestoneDetail.css';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project } = useProject();
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMilestoneData = useCallback(async (showRefresh = false) => {
    // Guard: Don't fetch if project is not loaded yet
    if (!project?.id) {
      return;
    }
    
    if (showRefresh) setRefreshing(true);
    
    try {
      const milestoneData = await milestonesService.getById(id);
      
      if (!milestoneData) {
        setMilestone(null);
        setLoading(false);
        return;
      }
      
      setMilestone(milestoneData);

      // Fetch deliverables for this milestone
      const deliverablesData = await deliverablesService.getAll(project.id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        select: '*, deliverable_kpis(kpi_id, kpis(kpi_ref, name))',
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      setDeliverables(deliverablesData || []);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, project?.id]);

  useEffect(() => {
    if (project?.id) {
      fetchMilestoneData();
    }
  }, [fetchMilestoneData, project?.id]);

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }

    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    
    if (allDelivered) return 'Completed';
    if (allNotStarted) return 'Not Started';
    return 'In Progress';
  }

  // Format date for display
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get status styling
  function getStatusClass(status) {
    switch (status) {
      case 'Delivered': 
      case 'Completed': 
        return 'status-completed';
      case 'In Progress': 
        return 'status-in-progress';
      default: 
        return 'status-not-started';
    }
  }

  // Show loading if project or milestone not yet loaded
  if (!project?.id || loading) {
    return <LoadingSpinner message="Loading milestone..." size="large" fullPage />;
  }

  if (!milestone) {
    return (
      <div className="milestone-detail-page">
        <div className="milestone-not-found">
          <AlertCircle size={48} />
          <h2>Milestone Not Found</h2>
          <button onClick={() => navigate('/milestones')}>
            <ArrowLeft size={16} /> Back to Milestones
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived data
  const computedStatus = calculateMilestoneStatus(deliverables);
  const totalDeliverables = deliverables.length;
  const deliveredCount = deliverables.filter(d => d.status === 'Delivered').length;
  const progress = totalDeliverables > 0 
    ? Math.round((deliveredCount / totalDeliverables) * 100) 
    : 0;

  return (
    <div className="milestone-detail-page">
      {/* Header */}
      <header className="milestone-header">
        <button className="back-button" onClick={() => navigate('/milestones')}>
          <ArrowLeft size={20} />
        </button>
        <div className="milestone-icon">
          <Target size={24} />
        </div>
        <div className="milestone-title-block">
          <div className="milestone-ref-row">
            <span className="milestone-ref">{milestone.milestone_ref}</span>
            <span className={`milestone-status ${getStatusClass(computedStatus)}`}>
              {computedStatus}
            </span>
          </div>
          <h1 className="milestone-name">{milestone.name}</h1>
        </div>
        <button 
          className="refresh-button"
          onClick={() => fetchMilestoneData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Content */}
      <div className="milestone-content">
        
        {/* Key Metrics Row */}
        <div className="metrics-grid">
          {/* Progress Card */}
          <div className="metric-card">
            <div className="metric-header">
              <Package size={18} />
              <span>Progress</span>
            </div>
            <div className="metric-value progress-value">
              <span className="progress-percent">{progress}%</span>
              <span className="progress-detail">{deliveredCount} of {totalDeliverables} deliverables</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Billable Amount Card */}
          <div className="metric-card">
            <div className="metric-header">
              <PoundSterling size={18} />
              <span>Billable Amount</span>
            </div>
            <div className="metric-value currency-value">
              £{(milestone.billable || 0).toLocaleString()}
            </div>
            <div className="metric-subtitle">
              {milestone.billable > 0 ? 'To be invoiced on completion' : 'Non-billable milestone'}
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="section-card">
          <h3 className="section-title">
            <Calendar size={18} />
            Schedule
          </h3>
          <div className="dates-grid">
            <div className="date-group">
              <h4 className="date-group-title">Baseline</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.baseline_start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{formatDate(milestone.baseline_end_date)}</span>
              </div>
            </div>
            <div className="date-group">
              <h4 className="date-group-title">Forecast</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{formatDate(milestone.forecast_end_date)}</span>
              </div>
            </div>
            <div className="date-group">
              <h4 className="date-group-title">Actual</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.actual_start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{computedStatus === 'Completed' ? formatDate(new Date()) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dependencies Section */}
        <div className="section-card">
          <h3 className="section-title">
            <Link2 size={18} />
            Dependencies
          </h3>
          <div className="empty-state small">
            <p>No dependencies defined for this milestone.</p>
            <span className="empty-hint">Dependencies feature coming soon</span>
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">
              <Package size={18} />
              Deliverables ({totalDeliverables})
            </h3>
            <Link to="/deliverables" className="section-action">
              Manage Deliverables
              <ChevronRight size={16} />
            </Link>
          </div>

          {deliverables.length === 0 ? (
            <div className="empty-state">
              <Package size={40} strokeWidth={1.5} />
              <p>No deliverables assigned to this milestone.</p>
              <Link to="/deliverables" className="empty-action">
                Add Deliverable
              </Link>
            </div>
          ) : (
            <div className="deliverables-list">
              {deliverables.map(del => (
                <div 
                  key={del.id} 
                  className="deliverable-item"
                  onClick={() => navigate(`/deliverables/${del.id}`)}
                >
                  <div className="deliverable-main">
                    <span className="deliverable-ref">{del.deliverable_ref}</span>
                    <span className="deliverable-name">{del.name}</span>
                  </div>
                  <div className="deliverable-meta">
                    <span className={`deliverable-status ${getStatusClass(del.status)}`}>
                      {del.status === 'Delivered' && <CheckCircle size={12} />}
                      {del.status === 'In Progress' && <Clock size={12} />}
                      {del.status || 'Not Started'}
                    </span>
                    <ChevronRight size={16} className="deliverable-chevron" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
