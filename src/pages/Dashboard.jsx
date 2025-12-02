/**
 * Dashboard Page - Apple-Inspired Premium Design
 * 
 * Clean, professional dashboard with meaningful KPIs and metrics.
 * Designed with Apple's design philosophy: Clarity, Deference, Depth.
 * 
 * @version 5.0
 * @updated 2 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { milestonesService, deliverablesService, kpisService, qualityStandardsService, timesheetsService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, Clock, Package, Target, Award, 
  DollarSign, FileCheck, BarChart3, CheckCircle2,
  ArrowRight, Briefcase
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common';

function isPMORole(role) {
  if (!role) return false;
  const roleLower = role.toLowerCase();
  return roleLower.includes('pmo') || roleLower.includes('project manager');
}

export default function Dashboard() {
  const { showTestUsers } = useTestUsers();
  const { projectId, projectName, projectRef } = useProject();
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMilestones: 0,
    completedMilestones: 0,
    totalDeliverables: 0,
    deliveredCount: 0,
    inProgressDeliverables: 0,
    totalResources: 0,
    totalKPIs: 0,
    achievedKPIs: 0,
    totalQS: 0,
    achievedQS: 0,
    totalBudget: 0,
    spendToDate: 0
  });
  const [certificateStats, setCertificateStats] = useState({ signed: 0, pending: 0, awaitingGeneration: 0 });
  const [pmoStats, setPmoStats] = useState({ pmoBudget: 0, pmoSpend: 0, nonPmoBudget: 0, nonPmoSpend: 0 });
  const [milestones, setMilestones] = useState([]);
  const [milestoneSpend, setMilestoneSpend] = useState({});
  const [kpisByCategory, setKpisByCategory] = useState({});
  const [qualityStandards, setQualityStandards] = useState([]);
  const [projectProgress, setProjectProgress] = useState(0);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Fetch all data
      const milestonesData = await milestonesService.getAll(projectId, { orderBy: { column: 'milestone_ref', ascending: true } });
      setMilestones(milestonesData);

      const deliverablesSummary = await deliverablesService.getSummary(projectId);
      const kpisData = await kpisService.getAll(projectId, { orderBy: { column: 'kpi_ref', ascending: true } });
      const qsData = await qualityStandardsService.getAll(projectId, { orderBy: { column: 'qs_ref', ascending: true } });
      setQualityStandards(qsData);

      const { data: resourcesData } = await supabase.from('resources').select('*');
      const timesheetsData = await timesheetsService.getAllFiltered(projectId, showTestUsers);

      // Calculate PMO vs Non-PMO budgets
      let pmoBudget = 0, nonPmoBudget = 0;
      if (resourcesData) {
        resourcesData.forEach(r => {
          const budget = (r.daily_rate || 0) * (r.days_allocated || 0);
          if (isPMORole(r.role)) pmoBudget += budget;
          else nonPmoBudget += budget;
        });
      }

      // Calculate spend by milestone
      const spendByMilestone = {};
      let totalSpend = 0, pmoSpend = 0, nonPmoSpend = 0;
      
      if (timesheetsData && resourcesData) {
        timesheetsData.forEach(ts => {
          const countsTowardsCost = ts.status === 'Approved' || (ts.status === 'Submitted' && !ts.was_rejected);
          if (!countsTowardsCost) return;
          
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          const resource = ts.resources || resourcesData.find(r => r.id === ts.resource_id);
          if (resource) {
            const dayCost = (hours / 8) * (resource.daily_rate || 0);
            if (ts.milestone_id) spendByMilestone[ts.milestone_id] = (spendByMilestone[ts.milestone_id] || 0) + dayCost;
            totalSpend += dayCost;
            if (isPMORole(resource.role)) pmoSpend += dayCost;
            else nonPmoSpend += dayCost;
          }
        });
      }
      setMilestoneSpend(spendByMilestone);
      setPmoStats({ pmoBudget, pmoSpend, nonPmoBudget, nonPmoSpend });

      // Group KPIs by category
      const grouped = {};
      kpisData.forEach(kpi => {
        const category = kpi.category || 'Other';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(kpi);
      });
      setKpisByCategory(grouped);

      // Calculate stats
      const totalMilestones = milestonesData.length;
      const completedMilestones = milestonesData.filter(m => m.status === 'Completed').length;
      const totalDeliverables = deliverablesSummary.total;
      const deliveredCount = deliverablesSummary.delivered;
      const inProgressDeliverables = deliverablesSummary.inProgress || 0;
      const totalResources = resourcesData?.length || 0;
      const totalKPIs = kpisData.length;
      const achievedKPIs = kpisData.filter(k => (k.current_value || 0) >= (k.target || 90)).length;
      const totalQS = qsData.length;
      const achievedQS = qsData.filter(q => (q.current_value || 0) >= (q.target || 100)).length;

      // Certificates
      const { data: certificatesData } = await supabase.from('milestone_certificates').select('*').eq('project_id', projectId);
      const signedCerts = certificatesData?.filter(c => c.status === 'Signed').length || 0;
      const pendingCerts = certificatesData?.filter(c => c.status === 'Pending Customer Signature' || c.status === 'Pending Supplier Signature').length || 0;
      const awaitingGen = Math.max(0, completedMilestones - (certificatesData?.length || 0));
      setCertificateStats({ signed: signedCerts, pending: pendingCerts, awaitingGeneration: awaitingGen });

      const totalBudget = milestonesData.reduce((sum, m) => sum + (m.budget || 0), 0);
      const avgProgress = totalMilestones > 0 ? Math.round(milestonesData.reduce((sum, m) => sum + (m.progress || 0), 0) / totalMilestones) : 0;
      setProjectProgress(avgProgress);

      setStats({
        totalMilestones,
        completedMilestones,
        totalDeliverables,
        deliveredCount,
        inProgressDeliverables,
        totalResources,
        totalKPIs,
        achievedKPIs,
        totalQS,
        achievedQS,
        totalBudget,
        spendToDate: totalSpend
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Helper to format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${Math.round(amount / 1000)}k`;
    return `£${Math.round(amount)}`;
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

  const budgetUsedPercent = stats.totalBudget > 0 ? Math.round((stats.spendToDate / stats.totalBudget) * 100) : 0;
  const maxBudget = Math.max(...milestones.map(m => m.budget || 0), 1);

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
            <p className="detail">{stats.completedMilestones} of {stats.totalMilestones} milestones complete</p>
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
            <div className="hero-metric-value teal">{stats.completedMilestones}/{stats.totalMilestones}</div>
            <div className="hero-metric-subtext">
              <CheckCircle2 size={14} />
              {stats.totalMilestones > 0 ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}% complete
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon success">
              <Package size={20} />
            </div>
            <div className="hero-metric-label">Deliverables</div>
            <div className="hero-metric-value success">{stats.deliveredCount}/{stats.totalDeliverables}</div>
            <div className="hero-metric-subtext">
              <TrendingUp size={14} />
              {stats.totalDeliverables > 0 ? Math.round((stats.deliveredCount / stats.totalDeliverables) * 100) : 0}% delivered
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon accent">
              <Target size={20} />
            </div>
            <div className="hero-metric-label">KPIs Achieved</div>
            <div className="hero-metric-value accent">{stats.achievedKPIs}/{stats.totalKPIs}</div>
            <div className="hero-metric-subtext">
              <BarChart3 size={14} />
              {stats.totalKPIs > 0 ? Math.round((stats.achievedKPIs / stats.totalKPIs) * 100) : 0}% on target
            </div>
          </div>

          <div className="hero-metric">
            <div className="hero-metric-icon purple" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Award size={20} />
            </div>
            <div className="hero-metric-label">Quality Standards</div>
            <div className="hero-metric-value" style={{ color: '#8b5cf6' }}>{stats.achievedQS}/{stats.totalQS}</div>
            <div className="hero-metric-subtext">
              <CheckCircle2 size={14} />
              {stats.totalQS > 0 ? Math.round((stats.achievedQS / stats.totalQS) * 100) : 0}% achieved
            </div>
          </div>
        </div>

        {/* Certificates Banner */}
        {(certificateStats.pending > 0 || certificateStats.awaitingGeneration > 0) && (
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
                <div className="cert-stat-value signed">{certificateStats.signed}</div>
                <div className="cert-stat-label">Signed</div>
              </div>
              <div className="cert-stat">
                <div className="cert-stat-value pending">{certificateStats.pending}</div>
                <div className="cert-stat-label">Pending</div>
              </div>
              <div className="cert-stat">
                <div className="cert-stat-value awaiting">{certificateStats.awaitingGeneration}</div>
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
                  <p className="ds-card-subtitle">{budgetUsedPercent}% of budget utilized</p>
                </div>
                <Link to="/reports" className="ds-card-action">View Reports →</Link>
              </div>
              <div className="ds-card-body">
                <div className="budget-display">
                  <div className="budget-item">
                    <div className="budget-item-label">Total Budget</div>
                    <div className="budget-item-value budget">{formatCurrency(stats.totalBudget)}</div>
                  </div>
                  <div className="budget-item">
                    <div className="budget-item-label">Spend to Date</div>
                    <div className="budget-item-value spend">{formatCurrency(stats.spendToDate)}</div>
                    <div className="budget-item-percent">{budgetUsedPercent}% utilized</div>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div 
                      className="progress-bar-fill teal" 
                      style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
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
                    <div className="stat-tile-value" style={{ color: '#f59e0b' }}>{formatCurrency(pmoStats.pmoBudget)}</div>
                    <div className="stat-tile-label">PMO Budget</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: '#ea580c' }}>{formatCurrency(pmoStats.pmoSpend)}</div>
                    <div className="stat-tile-label">PMO Spend</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: 'var(--ds-accent)' }}>{formatCurrency(pmoStats.nonPmoBudget)}</div>
                    <div className="stat-tile-label">Delivery Budget</div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-value" style={{ color: 'var(--ds-teal)' }}>{formatCurrency(pmoStats.nonPmoSpend)}</div>
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
                  {milestones.map(milestone => {
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
                  {Object.entries(kpisByCategory).map(([category, kpis]) => {
                    const totalKPIs = kpis.length;
                    const achievedKPIs = kpis.filter(k => (k.current_value || 0) >= (k.target || 90)).length;
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
                  <p className="ds-card-subtitle">{stats.achievedQS} of {stats.totalQS} standards achieved</p>
                </div>
                <Link to="/quality-standards" className="ds-card-action">View All →</Link>
              </div>
              <div className="ds-card-body">
                <div className="progress-list">
                  {qualityStandards.slice(0, 5).map(qs => {
                    const percentage = qs.current_value || 0;
                    const isAchieved = percentage >= (qs.target || 100);
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
                      <span className="progress-item-value">{stats.completedMilestones}/{stats.totalMilestones}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill teal"
                        style={{ width: `${stats.totalMilestones > 0 ? (stats.completedMilestones / stats.totalMilestones) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">Deliverables Completed</span>
                      <span className="progress-item-value">{stats.deliveredCount}/{stats.totalDeliverables}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill success"
                        style={{ width: `${stats.totalDeliverables > 0 ? (stats.deliveredCount / stats.totalDeliverables) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">Budget Utilization</span>
                      <span className="progress-item-value">{budgetUsedPercent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill accent"
                        style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="progress-item">
                    <div className="progress-item-header">
                      <span className="progress-item-label">KPI Achievement</span>
                      <span className="progress-item-value">{stats.achievedKPIs}/{stats.totalKPIs}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill warning"
                        style={{ width: `${stats.totalKPIs > 0 ? (stats.achievedKPIs / stats.totalKPIs) * 100 : 0}%` }}
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
