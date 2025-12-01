/**
 * Dashboard Page
 * 
 * Project overview with customizable, draggable, resizable widgets.
 * Full version with react-grid-layout for drag-and-drop functionality.
 * 
 * @version 4.0
 * @updated 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './Dashboard.css';
import { milestonesService, deliverablesService, kpisService, qualityStandardsService, timesheetsService } from '../services';
import { supabase } from '../lib/supabase';
import { TrendingUp, Clock, Package, Users, Target, Award, DollarSign, Briefcase, FileCheck, Settings } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import useDashboardLayout from '../hooks/useDashboardLayout';
import CustomizePanel from '../components/dashboard/CustomizePanel';
import { LoadingSpinner, PageHeader, StatCard, StatusBadge } from '../components/common';

const ResponsiveGridLayout = WidthProvider(Responsive);

function isPMORole(role) {
  if (!role) return false;
  const roleLower = role.toLowerCase();
  return roleLower.includes('pmo') || roleLower.includes('project manager');
}

export default function Dashboard() {
  const { showTestUsers, testUserIds } = useTestUsers();
  const { projectId, projectName, projectRef } = useProject();
  const { user, role } = useAuth();

  // Dashboard customization
  const {
    layout,
    loading: layoutLoading,
    saving: layoutSaving,
    lastSaved,
    bulkUpdateVisibility,
    saveLayoutPositions,
    resetToDefault,
    isWidgetVisible,
    getGridLayout
  } = useDashboardLayout(user?.id, projectId, role);

  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMilestones: 0, completedMilestones: 0, totalDeliverables: 0, deliveredCount: 0, totalResources: 0, totalKPIs: 0, achievedKPIs: 0, totalQS: 0, achievedQS: 0, totalBudget: 0, spendToDate: 0 });
  const [certificateStats, setCertificateStats] = useState({ signed: 0, pending: 0, awaitingGeneration: 0 });
  const [pmoStats, setPmoStats] = useState({ pmoBudget: 0, pmoSpend: 0, nonPmoBudget: 0, nonPmoSpend: 0, pmoResources: [], nonPmoResources: [] });
  const [milestones, setMilestones] = useState([]);
  const [milestoneSpend, setMilestoneSpend] = useState({});
  const [kpisByCategory, setKpisByCategory] = useState({});
  const [qualityStandards, setQualityStandards] = useState([]);
  const [projectProgress, setProjectProgress] = useState(0);
  
  const saveTimeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const milestonesData = await milestonesService.getAll(projectId, { orderBy: { column: 'milestone_ref', ascending: true } });
      setMilestones(milestonesData);

      const deliverablesSummary = await deliverablesService.getSummary(projectId);
      const kpisData = await kpisService.getAll(projectId, { orderBy: { column: 'kpi_ref', ascending: true } });
      const qsData = await qualityStandardsService.getAll(projectId, { orderBy: { column: 'qs_ref', ascending: true } });
      setQualityStandards(qsData);

      const { data: resourcesData } = await supabase.from('resources').select('*');
      const timesheetsData = await timesheetsService.getAllFiltered(projectId, showTestUsers);

      let pmoBudget = 0, nonPmoBudget = 0;
      const pmoResourcesList = [], nonPmoResourcesList = [];
      
      if (resourcesData) {
        resourcesData.forEach(r => {
          const budget = (r.daily_rate || 0) * (r.days_allocated || 0);
          if (isPMORole(r.role)) {
            pmoBudget += budget;
            pmoResourcesList.push({ name: r.name, role: r.role, budget });
          } else {
            nonPmoBudget += budget;
            nonPmoResourcesList.push({ name: r.name, role: r.role, budget });
          }
        });
      }

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
      setPmoStats({ pmoBudget, pmoSpend, nonPmoBudget, nonPmoSpend, pmoResources: pmoResourcesList, nonPmoResources: nonPmoResourcesList });

      const grouped = {};
      kpisData.forEach(kpi => {
        const category = kpi.category || 'Other';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(kpi);
      });
      setKpisByCategory(grouped);

      const totalMilestones = milestonesData.length;
      const completedMilestones = milestonesData.filter(m => m.status === 'Completed').length;
      const totalDeliverables = deliverablesSummary.total;
      const deliveredCount = deliverablesSummary.delivered;
      const totalResources = resourcesData?.length || 0;
      const totalKPIs = kpisData.length;
      const achievedKPIs = kpisData.filter(k => (k.current_value || 0) >= (k.target || 90)).length;
      const totalQS = qsData.length;
      const achievedQS = qsData.filter(q => (q.current_value || 0) >= (q.target || 100)).length;

      const { data: certificatesData } = await supabase.from('milestone_certificates').select('*').eq('project_id', projectId);
      const signedCerts = certificatesData?.filter(c => c.status === 'Signed').length || 0;
      const pendingCerts = certificatesData?.filter(c => c.status === 'Pending Customer Signature' || c.status === 'Pending Supplier Signature').length || 0;
      const awaitingGen = Math.max(0, completedMilestones - (certificatesData?.length || 0));
      setCertificateStats({ signed: signedCerts, pending: pendingCerts, awaitingGeneration: awaitingGen });

      const totalBudget = milestonesData.reduce((sum, m) => sum + (m.budget || 0), 0);
      const avgProgress = totalMilestones > 0 ? Math.round(milestonesData.reduce((sum, m) => sum + (m.progress || 0), 0) / totalMilestones) : 0;
      setProjectProgress(avgProgress);

      setStats({ totalMilestones, completedMilestones, totalDeliverables, deliveredCount, totalResources, totalKPIs, achievedKPIs, totalQS, achievedQS, totalBudget, spendToDate: totalSpend });
    } catch (error) { 
      console.error('Error:', error); 
    } finally { 
      setLoading(false); 
    }
  }, [projectId, showTestUsers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getCategoryColor(category) {
    switch (category) {
      case 'Time Performance': return '#3b82f6';
      case 'Quality of Collaboration': return '#8b5cf6';
      case 'Delivery Performance': return '#10b981';
      default: return '#64748b';
    }
  }

  // Handle layout change (drag/resize) with debounce
  const handleLayoutChange = useCallback((newLayout) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveLayoutPositions(newLayout);
    }, 1000);
  }, [saveLayoutPositions]);

  // Render individual widgets
  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'progress-hero':
        return (
          <div className="card" style={{ height: '100%', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: 'white', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>{projectProgress}%</h2>
                <p style={{ opacity: 0.9, margin: 0 }}>Overall Progress</p>
              </div>
              <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="10" strokeDasharray={`${projectProgress * 2.51} 251`} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        );

      case 'budget-summary':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Budget</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>£{stats.totalBudget.toLocaleString()}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                  <DollarSign size={24} style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #10b981', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Spend to Date</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>£{Math.round(stats.spendToDate).toLocaleString()}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{stats.totalBudget > 0 ? Math.round((stats.spendToDate / stats.totalBudget) * 100) : 0}% of budget</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                  <TrendingUp size={24} style={{ color: '#10b981' }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'pmo-tracking':
        return (
          <div className="card" style={{ height: '100%', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} /> PMO Cost Tracking
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>PMO Budget</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#d97706' }}>£{Math.round(pmoStats.pmoBudget / 1000)}k</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#ffedd5', borderRadius: '8px', borderLeft: '4px solid #ea580c' }}>
                <div style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: '0.25rem' }}>PMO Spend</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ea580c' }}>£{Math.round(pmoStats.pmoSpend / 1000)}k</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>Non-PMO Budget</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2563eb' }}>£{Math.round(pmoStats.nonPmoBudget / 1000)}k</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.25rem' }}>Non-PMO Spend</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>£{Math.round(pmoStats.nonPmoSpend / 1000)}k</div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Spend Distribution</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  PMO: {stats.spendToDate > 0 ? Math.round((pmoStats.pmoSpend / stats.spendToDate) * 100) : 0}% | 
                  Non-PMO: {stats.spendToDate > 0 ? Math.round((pmoStats.nonPmoSpend / stats.spendToDate) * 100) : 0}%
                </span>
              </div>
              <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                <div style={{ 
                  width: `${stats.spendToDate > 0 ? (pmoStats.pmoSpend / stats.spendToDate) * 100 : 0}%`, 
                  backgroundColor: '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  minWidth: pmoStats.pmoSpend > 0 ? '40px' : '0'
                }}>
                  {pmoStats.pmoSpend > 0 && 'PMO'}
                </div>
                <div style={{ 
                  width: `${stats.spendToDate > 0 ? (pmoStats.nonPmoSpend / stats.spendToDate) * 100 : 0}%`, 
                  backgroundColor: '#3b82f6',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  minWidth: pmoStats.nonPmoSpend > 0 ? '60px' : '0'
                }}>
                  {pmoStats.nonPmoSpend > 0 && 'Non-PMO'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'stats-grid':
        return (
          <div style={{ height: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <StatCard 
              icon={Clock} 
              label="Milestones" 
              value={`${stats.completedMilestones} / ${stats.totalMilestones}`} 
              subtext={`${stats.totalMilestones > 0 ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}% Complete`} 
              color="#3b82f6" 
            />
            <StatCard 
              icon={Package} 
              label="Deliverables" 
              value={`${stats.deliveredCount} / ${stats.totalDeliverables}`} 
              subtext={`${stats.totalDeliverables > 0 ? Math.round((stats.deliveredCount / stats.totalDeliverables) * 100) : 0}% Delivered`} 
              color="#10b981" 
            />
            <StatCard 
              icon={TrendingUp} 
              label="KPIs" 
              value={`${stats.achievedKPIs} / ${stats.totalKPIs}`} 
              subtext={`${stats.totalKPIs > 0 ? Math.round((stats.achievedKPIs / stats.totalKPIs) * 100) : 0}% Achieved`} 
              color="#3b82f6" 
            />
            <StatCard 
              icon={Award} 
              label="Quality Standards" 
              value={`${stats.achievedQS} / ${stats.totalQS}`} 
              subtext={`${stats.totalQS > 0 ? Math.round((stats.achievedQS / stats.totalQS) * 100) : 0}% Achieved`} 
              color="#8b5cf6" 
            />
          </div>
        );

      case 'certificates':
        return (
          <div className="card" style={{ height: '100%', backgroundColor: '#fefce8', borderLeft: '4px solid #eab308' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileCheck size={28} style={{ color: '#ca8a04' }} />
                <div>
                  <h4 style={{ margin: 0, color: '#854d0e' }}>Milestone Certificates</h4>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>{certificateStats.signed}</div>
                  <div style={{ fontSize: '0.8rem', color: '#166534' }}>Signed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706' }}>{certificateStats.pending}</div>
                  <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Pending</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: certificateStats.awaitingGeneration > 0 ? '#dc2626' : '#64748b' }}>
                    {certificateStats.awaitingGeneration}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Awaiting</div>
                </div>
              </div>
              <Link to="/milestones" style={{ padding: '0.5rem 1rem', backgroundColor: '#ca8a04', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: '500' }}>
                View →
              </Link>
            </div>
          </div>
        );

      case 'milestones-list':
        return (
          <div className="card" style={{ height: '100%', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Billable vs Spend by Milestone</h3>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', marginRight: '1rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
                Billable
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
                Spend
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', height: 'calc(100% - 80px)', alignItems: 'flex-end' }}>
              {milestones.map(milestone => {
                const maxBudget = Math.max(...milestones.map(m => m.budget || 0));
                const spend = milestoneSpend[milestone.id] || 0;
                const budgetHeight = maxBudget > 0 ? ((milestone.budget || 0) / maxBudget) * 100 : 0;
                const spendHeight = maxBudget > 0 ? (spend / maxBudget) * 100 : 0;
                return (
                  <div key={milestone.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                      <div 
                        style={{ 
                          width: '45%', 
                          height: `${budgetHeight}%`, 
                          backgroundColor: '#3b82f6', 
                          borderRadius: '4px 4px 0 0', 
                          minHeight: milestone.budget > 0 ? '20px' : '0',
                          position: 'relative'
                        }} 
                        title={`Billable: £${(milestone.budget || 0).toLocaleString()}`}
                      >
                        {budgetHeight > 15 && (
                          <span style={{ 
                            position: 'absolute', 
                            top: '4px', 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            fontSize: '0.65rem', 
                            fontWeight: '600', 
                            color: 'white'
                          }}>
                            £{Math.round((milestone.budget || 0) / 1000)}k
                          </span>
                        )}
                      </div>
                      <div 
                        style={{ 
                          width: '45%', 
                          height: `${spendHeight}%`, 
                          backgroundColor: '#10b981', 
                          borderRadius: '4px 4px 0 0', 
                          minHeight: spend > 0 ? '20px' : '0',
                          position: 'relative'
                        }} 
                        title={`Spend: £${Math.round(spend).toLocaleString()}`}
                      >
                        {spendHeight > 15 && (
                          <span style={{ 
                            position: 'absolute', 
                            top: '4px', 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            fontSize: '0.65rem', 
                            fontWeight: '600', 
                            color: 'white'
                          }}>
                            £{Math.round(spend / 1000)}k
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>{milestone.milestone_ref}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'kpis-category':
        return (
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ marginBottom: '1rem' }}>KPI Performance</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: 'calc(100% - 50px)' }}>
              {Object.entries(kpisByCategory).map(([category, kpis]) => {
                const totalKPIs = kpis.length;
                const achievedKPIs = kpis.filter(k => (k.current_value || 0) >= (k.target || 90)).length;
                const achievedPercentage = totalKPIs > 0 ? (achievedKPIs / totalKPIs) * 100 : 0;
                return (
                  <div key={category} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ 
                        height: `${100 - achievedPercentage}%`, 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: achievedPercentage > 0 ? '4px 4px 0 0' : '4px'
                      }}></div>
                      <div style={{ 
                        height: `${achievedPercentage}%`, 
                        backgroundColor: getCategoryColor(category), 
                        borderRadius: achievedPercentage < 100 ? '0 0 4px 4px' : '4px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        fontWeight: '700'
                      }}>
                        {achievedKPIs}/{totalKPIs}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>{category.split(' ')[0]}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{Math.round(achievedPercentage)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'quality-standards':
        return (
          <div className="card" style={{ height: '100%', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Quality Standards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {qualityStandards.map(qs => {
                const percentage = qs.current_value || 0;
                const isAchieved = percentage >= (qs.target || 100);
                return (
                  <div key={qs.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', minWidth: '45px', color: '#8b5cf6' }}>
                      {qs.qs_ref}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          backgroundColor: isAchieved ? '#10b981' : '#8b5cf6'
                        }}></div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '600', 
                      minWidth: '45px', 
                      color: isAchieved ? '#10b981' : '#64748b'
                    }}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading || layoutLoading) {
    return <LoadingSpinner message="Loading dashboard..." size="large" fullPage />;
  }

  const gridLayout = getGridLayout();

  return (
    <div className="page-container">
      <PageHeader 
        icon={Target} 
        title={`${projectRef || 'Project'} Dashboard`} 
        subtitle={projectName || 'Project Tracker'}
      >
        <button
          onClick={() => setShowCustomizePanel(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem'
          }}
        >
          <Settings size={18} />
          Customize
        </button>
      </PageHeader>

      {/* Draggable & Resizable Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {gridLayout.map(item => (
          <div key={item.i} style={{ position: 'relative' }}>
            {/* Drag handle */}
            <div 
              className="drag-handle" 
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                cursor: 'move',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              title="Drag to move"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="4" r="1.5" fill="#64748b"/>
                <circle cx="12" cy="4" r="1.5" fill="#64748b"/>
                <circle cx="4" cy="8" r="1.5" fill="#64748b"/>
                <circle cx="12" cy="8" r="1.5" fill="#64748b"/>
                <circle cx="4" cy="12" r="1.5" fill="#64748b"/>
                <circle cx="12" cy="12" r="1.5" fill="#64748b"/>
              </svg>
            </div>
            {renderWidget(item.i)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/milestones" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Clock size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Milestones</h4>
        </Link>
        <Link to="/deliverables" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Package size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Deliverables</h4>
        </Link>
        <Link to="/kpis" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <TrendingUp size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>KPIs</h4>
        </Link>
        <Link to="/quality-standards" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Award size={32} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quality</h4>
        </Link>
        <Link to="/reports" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Target size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Reports</h4>
        </Link>
      </div>

      {/* Customization Panel */}
      <CustomizePanel
        isOpen={showCustomizePanel}
        onClose={() => setShowCustomizePanel(false)}
        layout={layout}
        role={role}
        onUpdateVisibility={bulkUpdateVisibility}
        onReset={resetToDefault}
        saving={layoutSaving}
        lastSaved={lastSaved}
      />
    </div>
  );
}
