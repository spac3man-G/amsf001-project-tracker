/**
 * Dashboard Page - Apple-Inspired Premium Design
 * 
 * Clean, professional dashboard with meaningful KPIs and metrics.
 * Uses centralized MetricsService for all calculations.
 * 
 * @version 6.0
 * @updated 3 December 2025
 * @change Uses centralized metricsService - no local calculations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { metricsService } from '../services';
import { BUDGET_CONFIG } from '../config/metricsConfig';
import { 
  TrendingUp, Clock, Package, Target, Award, 
  FileCheck, BarChart3, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common';

export default function Dashboard() {
  const { showTestUsers } = useTestUsers();
  const { projectId, projectName, projectRef } = useProject();
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all metrics from centralized service
  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clear any cached metrics to ensure fresh data
      metricsService.clearCache();
      
      // Get all dashboard metrics in a single call
      const dashboardMetrics = await metricsService.getAllDashboardMetrics(projectId, {
        includeTestContent: showTestUsers
      });
      
      setMetrics(dashboardMetrics);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => { 
    fetchMetrics(); 
  }, [fetchMetrics]);

  // Helper to format currency using config
  const formatCurrency = (amount) => {
    const { currency } = BUDGET_CONFIG;
    if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency}${Math.round(amount / 1000)}k`;
    return `${currency}${Math.round(amount)}`;
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." size="large" fullPage />;
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMetrics} className="btn btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <LoadingSpinner message="Preparing dashboard..." size="large" fullPage />;
  }

  // Destructure metrics for easier access
  const { 
    milestones, 
    deliverables, 
    kpis, 
    qualityStandards, 
    budget, 
    certificates,
    milestoneSpend,
    projectProgress 
  } = metrics;

  const maxBudget = Math.max(...(milestones.milestones?.map(m => m.budget || 0) || [1]), 1);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">{getGreeting()}</h1>
            <p className="dashboard-subtitle">{projectRef} • {projectName}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Progress Hero */}
        <div className="progress-ring-container">
          <div className="progress-ring-info">
            <h2>{projectProgress}%</h2>
            <p>Overall Project Progress</p>
            <p className="detail">{milestones.completed} of {milestones.total} milestones complete</p>
          </div>
          <div className="progress-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle className="progress-ring-bg" cx="70" cy="70" r="58" />
              <circle 
                className="progress-ring-fill" 
                cx="70" 
                cy="70" 
                r="58" 
                strokeDasharray={`${projectProgress * 3.64} 364`}
              />
            </svg>
            <span className="progress-ring-text">{projectProgress}%</span>
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="hero-metric-icon teal">
              <Clock size={20} />
            </div>
            <div className="hero-metric-label">Milestones</div>
            <div className="hero-metric-value teal">{milestones.completed}/{milestones.total}</div>
            <div className="hero-metric-subtext">
              <CheckCircle2 size={14} />
              {milestones.total > 0 ? Math.round((milestones.completed / milestones.total) * 100) : 0}% complete
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon success">
              <Package size={20} />
            </div>
            <div className="hero-metric-label">Deliverables</div>
            <div className="hero-metric-value success">{deliverables.delivered}/{deliverables.total}</div>
            <div className="hero-metric-subtext">
              <TrendingUp size={14} />
              {deliverables.completionPercent}% delivered
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon accent">
              <Target size={20} />
            </div>
            <div className="hero-metric-label">KPIs Achieved</div>
            <div className="hero-metric-value accent">{kpis.achieved}/{kpis.total}</div>
            <div className="hero-metric-subtext">
              <BarChart3 size={14} />
              {kpis.achievementPercent}% on target
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon purple" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Award size={20} />
            </div>
            <div className="hero-metric-label">Quality Standards</div>
            <div className="hero-metric-value" style={{ color: '#8b5cf6' }}>{qualityStandards.achieved}/{qualityStandards.total}</div>
            <div className="hero-metric-subtext">
              <CheckCircle2 size={14} />
              {qualityStandards.achievementPercent}% achieved
            </div>
          </div>
        </div>

        {/* Certificates Banner */}
        {(certificates.pending > 0 || certificates.awaitingGeneration > 0) && (
          <div className="certificates-banner">
            <div className="certificates-info">
              <div className="certificates-icon">
                <FileCheck size={24} />
              </div>
              <div className="certificates-text">
                <h4>Milestone Certificates</h4>
                <p>Track completion certificates for billing milestones</p>
              </div>
            </div>
            <div className="certificates-stats">
              <div className="cert-stat">
                <div className="cert-stat-value signed">{certificates.signed}</div>
                <div className="cert-stat-label">Signed</div>
              </div>
              <div className="cert-stat">
                <div className="cert-stat-value pending">{certificates.pending}</div>
                <div className="cert-stat-label">Pending</div>
              </div>
              <div className="cert-stat">
                <div className="cert-stat-value awaiting">{certificates.awaitingGeneration}</div>
                <div className="cert-stat-label">Awaiting</div>
              </div>
            </div>
            <Link to="/milestones" className="certificates-action">
              View Certificates <ArrowRight size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
            </Link>
          </div>
        )}

        {/* Main Card Grid */}
        <div className="card-grid">
          {/* Budget Overview */}
          <div className="card-span-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">Budget Overview</h3>
                  <p className="ds-card-subtitle">{budget.utilizationPercent}% of budget utilized</p>
                </div>
                <Link to="/reports" className="ds-card-action">View Reports →</Link>
              </div>
              <div className="ds-card-body">
                <div className="budget-display">
                  <div className="budget-item">
                    <div className="budget-item-label">Total Budget</div>
                    <div className="budget-item-value budget">{formatCurrency(budget.totalBudget)}</div>
                  </div>
                  <div className="budget-item">
                    <div className="budget-item-label">Spend to Date</div>
                    <div className="budget-item-value spend">{formatCurrency(budget.totalSpend)}</div>
                    <div className="budget-item-percent">{budget.utilizationPercent}% utilized</div>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div 
                      className="progress-bar-fill teal" 
                      style={{ width: `${Math.min(budget.utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PMO Tracking */}
          <div className="card-span-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">PMO Cost Tracking</h3>
                  <p className="ds-card-subtitle">Management vs delivery costs</p>
                </div>
              </div>
              <div className="ds-card-body">
                <div className="stat-tiles">
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: '#f59e0b' }}>{formatCurrency(budget.pmoBudget)}</div>
                    <div className="stat-tile-label">PMO Budget</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: '#ea580c' }}>{formatCurrency(budget.pmoSpend)}</div>
                    <div className="stat-tile-label">PMO Spend</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: 'var(--ds-accent)' }}>{formatCurrency(budget.deliveryBudget)}</div>
                    <div className="stat-tile-label">Delivery Budget</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: 'var(--ds-teal)' }}>{formatCurrency(budget.deliverySpend)}</div>
                    <div className="stat-tile-label">Delivery Spend</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone Chart */}
          <div className="card-span-8">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">Milestone Budget vs Spend</h3>
                  <p className="ds-card-subtitle">Comparing billable amounts to actual costs</p>
                </div>
                <Link to="/milestones" className="ds-card-action">View All →</Link>
              </div>
              <div className="ds-card-body">
                <div className="milestone-legend">
                  <div className="milestone-legend-item">
                    <div className="milestone-legend-dot budget"></div>
                    <span>Budget</span>
                  </div>
                  <div className="milestone-legend-item">
                    <div className="milestone-legend-dot spend"></div>
                    <span>Spend</span>
                  </div>
                </div>
                <div className="milestone-chart">
                  {milestones.milestones?.map(milestone => {
                    const spend = milestoneSpend[milestone.id] || 0;
                    const budgetHeight = maxBudget > 0 ? ((milestone.budget || 0) / maxBudget) * 100 : 0;
                    const spendHeight = maxBudget > 0 ? (spend / maxBudget) * 100 : 0;
                    return (
                      <div key={milestone.id} className="milestone-bar-group">
                        <div className="milestone-bars">
                          <div 
                            className="milestone-bar budget"
                            style={{ height: `${Math.max(budgetHeight, 5)}%` }}
                            title={`Budget: ${formatCurrency(milestone.budget || 0)}`}
                          />
                          <div 
                            className="milestone-bar spend"
                            style={{ height: `${Math.max(spendHeight, spend > 0 ? 5 : 0)}%` }}
                            title={`Spend: ${formatCurrency(spend)}`}
                          />
                        </div>
                        <span className="milestone-label">{milestone.milestone_ref}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Performance */}
          <div className="card-span-4">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">KPI Performance</h3>
                  <p className="ds-card-subtitle">By category</p>
                </div>
                <Link to="/kpis" className="ds-card-action">View All →</Link>
              </div>
              <div className="ds-card-body">
                <div className="kpi-categories">
                  {Object.entries(kpis.byCategory || {}).map(([category, categoryKpis]) => {
                    const totalKPIs = categoryKpis.length;
                    const achievedKPIs = categoryKpis.filter(k => k.isAchieved).length;
                    const achievedPercentage = totalKPIs > 0 ? (achievedKPIs / totalKPIs) * 100 : 0;
                    const barClass = category.includes('Time') ? 'time' : category.includes('Quality') ? 'quality' : 'delivery';
                    return (
                      <div key={category} className="kpi-category">
                        <div className="kpi-category-bar-container">
                          <div 
                            className={`kpi-category-bar ${barClass}`}
                            style={{ height: `${Math.max(achievedPercentage, 15)}%` }}
                          >
                            {achievedKPIs}/{totalKPIs}
                          </div>
                        </div>
                        <div className="kpi-category-label">
                          {category.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Standards */}
          <div className="card-span-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">Quality Standards</h3>
                  <p className="ds-card-subtitle">{qualityStandards.achieved} of {qualityStandards.total} standards achieved</p>
                </div>
                <Link to="/quality-standards" className="ds-card-action">View All →</Link>
              </div>
              <div className="ds-card-body">
                <div className="progress-list">
                  {qualityStandards.qualityStandards?.slice(0, 5).map(qs => {
                    const percentage = qs.calculatedValue || 0;
                    const isAchieved = qs.isAchieved;
                    return (
                      <div key={qs.id} className="progress-item">
                        <div className="progress-item-header">
                          <span className="progress-item-label">{qs.qs_ref} - {qs.name}</span>
                          <span className="progress-item-value">{percentage}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-bar-fill ${isAchieved ? 'success' : 'purple'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="card-span-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <div>
                  <h3 className="ds-card-title">Project Summary</h3>
                  <p className="ds-card-subtitle">Key metrics at a glance</p>
                </div>
              </div>
              <div className="ds-card-body">
                <div className="progress-list">
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">Milestone Completion</span>
                      <span className="progress-item-value">{milestones.completed}/{milestones.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill teal"
                        style={{ width: `${milestones.total > 0 ? (milestones.completed / milestones.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">Deliverables Completed</span>
                      <span className="progress-item-value">{deliverables.delivered}/{deliverables.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill success"
                        style={{ width: `${deliverables.completionPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">Budget Utilization</span>
                      <span className="progress-item-value">{budget.utilizationPercent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill accent"
                        style={{ width: `${Math.min(budget.utilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">KPI Achievement</span>
                      <span className="progress-item-value">{kpis.achieved}/{kpis.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill warning"
                        style={{ width: `${kpis.achievementPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <Link to="/milestones" className="quick-link">
            <div className="quick-link-icon teal">
              <Clock size={24} />
            </div>
            <div className="quick-link-title">Milestones</div>
          </Link>
          <Link to="/deliverables" className="quick-link">
            <div className="quick-link-icon success">
              <Package size={24} />
            </div>
            <div className="quick-link-title">Deliverables</div>
          </Link>
          <Link to="/kpis" className="quick-link">
            <div className="quick-link-icon accent">
              <TrendingUp size={24} />
            </div>
            <div className="quick-link-title">KPIs</div>
          </Link>
          <Link to="/quality-standards" className="quick-link">
            <div className="quick-link-icon purple">
              <Award size={24} />
            </div>
            <div className="quick-link-title">Quality</div>
          </Link>
          <Link to="/reports" className="quick-link">
            <div className="quick-link-icon warning">
              <BarChart3 size={24} />
            </div>
            <div className="quick-link-title">Reports</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
