import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TrendingUp, Clock, Package, Users, Target, Award, DollarSign, PoundSterling, Briefcase, FileCheck } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useProject } from '../contexts/ProjectContext';
import { LoadingSpinner, PageHeader, StatCard, StatusBadge } from '../components/common';

// Helper function to check if a role is PMO
function isPMORole(role) {
  if (!role) return false;
  const roleLower = role.toLowerCase();
  return roleLower.includes('pmo') || roleLower.includes('project manager');
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalMilestones: 0, completedMilestones: 0, 
    totalDeliverables: 0, deliveredCount: 0, 
    totalResources: 0, 
    totalKPIs: 0, achievedKPIs: 0, 
    totalQS: 0, achievedQS: 0,
    totalBudget: 0, spendToDate: 0
  });
  const [certificateStats, setCertificateStats] = useState({
    signed: 0,
    pending: 0,
    awaitingGeneration: 0
  });
  const [pmoStats, setPmoStats] = useState({
    pmoBudget: 0,
    pmoSpend: 0,
    nonPmoBudget: 0,
    nonPmoSpend: 0,
    pmoResources: [],
    nonPmoResources: []
  });
  const [milestones, setMilestones] = useState([]);
  const [milestoneSpend, setMilestoneSpend] = useState({});
  const [kpisByCategory, setKpisByCategory] = useState({});
  const [qualityStandards, setQualityStandards] = useState([]);
  const [projectProgress, setProjectProgress] = useState(0);

  // Use shared contexts
  const { showTestUsers, testUserIds } = useTestUsers();
  const { projectId } = useProject();

  // Fetch data when projectId becomes available
  useEffect(() => {
    if (projectId) {
      fetchDashboardData();
    }
  }, [projectId, showTestUsers]);

  async function fetchDashboardData() {
    if (!projectId) return;
    
    try {
      const { data: milestonesData } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('milestone_ref');
      setMilestones(milestonesData || []);

      const { data: deliverablesData } = await supabase.from('deliverables').select('*').eq('project_id', projectId);
      const { data: resourcesData } = await supabase.from('resources').select('*');
      const { data: kpisData } = await supabase.from('kpis').select('*').eq('project_id', projectId).order('kpi_ref');
      const { data: qsData } = await supabase.from('quality_standards').select('*').eq('project_id', projectId).order('qs_ref');

      // Fetch timesheets to calculate spend - with test content filter
      let timesheetQuery = supabase
        .from('timesheets')
        .select('*, resources(id, name, role, daily_rate, discount_percent)')
        .eq('project_id', projectId);
      
      // Filter out test content unless admin/supplier_pm has enabled it
      if (!showTestUsers) {
        timesheetQuery = timesheetQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }
      
      const { data: timesheetsData } = await timesheetQuery;

      // Calculate PMO budget from resources
      let pmoBudget = 0;
      let nonPmoBudget = 0;
      const pmoResourcesList = [];
      const nonPmoResourcesList = [];
      
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

      // Calculate spend per milestone and PMO spend
      // Only count: Approved OR (Submitted AND not previously rejected)
      const spendByMilestone = {};
      let totalSpend = 0;
      let pmoSpend = 0;
      let nonPmoSpend = 0;
      
      if (timesheetsData && resourcesData) {
        timesheetsData.forEach(ts => {
          // Check if this timesheet counts towards costs
          const countsTowardsCost = ts.status === 'Approved' || 
            (ts.status === 'Submitted' && !ts.was_rejected);
          
          if (!countsTowardsCost) return; // Skip rejected or draft timesheets
          
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          const resource = ts.resources || resourcesData.find(r => r.id === ts.resource_id);
          if (resource) {
            const dailyRate = resource.daily_rate || 0;
            const dayCost = (hours / 8) * dailyRate; // Convert hours to days
            
            if (ts.milestone_id) {
              spendByMilestone[ts.milestone_id] = (spendByMilestone[ts.milestone_id] || 0) + dayCost;
            }
            totalSpend += dayCost;
            
            // Track PMO vs non-PMO spend
            if (isPMORole(resource.role)) {
              pmoSpend += dayCost;
            } else {
              nonPmoSpend += dayCost;
            }
          }
        });
      }
      setMilestoneSpend(spendByMilestone);
      
      // Set PMO stats
      setPmoStats({
        pmoBudget,
        pmoSpend,
        nonPmoBudget,
        nonPmoSpend,
        pmoResources: pmoResourcesList,
        nonPmoResources: nonPmoResourcesList
      });

      setQualityStandards(qsData || []);

      const grouped = {};
      if (kpisData) {
        kpisData.forEach(kpi => {
          const category = kpi.category || 'Other';
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(kpi);
        });
      }
      setKpisByCategory(grouped);

      const totalMilestones = milestonesData?.length || 0;
      const completedMilestones = milestonesData?.filter(m => m.status === 'Completed').length || 0;
      const totalDeliverables = deliverablesData?.length || 0;
      const deliveredCount = deliverablesData?.filter(d => d.status === 'Delivered').length || 0;
      const totalResources = resourcesData?.length || 0;
      const totalKPIs = kpisData?.length || 0;
      const achievedKPIs = kpisData?.filter(k => (k.current_value || 0) >= (k.target || 90)).length || 0;
      const totalQS = qsData?.length || 0;
      const achievedQS = qsData?.filter(q => (q.current_value || 0) >= (q.target || 100)).length || 0;
      
      // Fetch certificates
      const { data: certificatesData } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('project_id', projectId);
      
      const signedCerts = certificatesData?.filter(c => c.status === 'Signed').length || 0;
      const pendingCerts = certificatesData?.filter(c => 
        c.status === 'Pending Customer Signature' || c.status === 'Pending Supplier Signature'
      ).length || 0;
      const certsGenerated = certificatesData?.length || 0;
      const awaitingGen = Math.max(0, completedMilestones - certsGenerated);
      
      setCertificateStats({
        signed: signedCerts,
        pending: pendingCerts,
        awaitingGeneration: awaitingGen
      });
      
      // Calculate total budget from milestones
      const totalBudget = milestonesData?.reduce((sum, m) => sum + (m.budget || 0), 0) || 0;

      const avgProgress = totalMilestones > 0 ? Math.round(milestonesData.reduce((sum, m) => sum + (m.progress || 0), 0) / totalMilestones) : 0;
      setProjectProgress(avgProgress);

      setStats({ 
        totalMilestones, completedMilestones, 
        totalDeliverables, deliveredCount, 
        totalResources, 
        totalKPIs, achievedKPIs, 
        totalQS, achievedQS,
        totalBudget,
        spendToDate: totalSpend
      });
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Time Performance': return '#3b82f6';
      case 'Quality of Collaboration': return '#8b5cf6';
      case 'Delivery Performance': return '#10b981';
      default: return '#64748b';
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader 
        icon={Target}
        title="AMSF001 Dashboard"
        subtitle="Network Standards & Design Architectural Services"
      />

      {/* Project Progress Hero */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>{projectProgress}%</h2>
            <p style={{ opacity: 0.9, margin: 0 }}>Overall Project Progress</p>
          </div>
          <div style={{ width: '120px', height: '120px', position: 'relative' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="10" strokeDasharray={`${projectProgress * 2.51} 251`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Budget & Spend Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
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
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Spend to Date</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>£{Math.round(stats.spendToDate).toLocaleString()}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {stats.totalBudget > 0 ? Math.round((stats.spendToDate / stats.totalBudget) * 100) : 0}% of budget
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
              <TrendingUp size={24} style={{ color: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>

      {/* PMO vs Non-PMO Cost Tracking */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={20} /> PMO Cost Tracking
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* PMO Budget (Forecast) */}
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '0.25rem' }}>PMO Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
              £{Math.round(pmoStats.pmoBudget).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
              {(pmoStats.pmoBudget + pmoStats.nonPmoBudget) > 0 
                ? Math.round((pmoStats.pmoBudget / (pmoStats.pmoBudget + pmoStats.nonPmoBudget)) * 100) 
                : 0}% of total budget
            </div>
          </div>
          
          {/* PMO Spend */}
          <div style={{ padding: '1rem', backgroundColor: '#ffedd5', borderRadius: '8px', borderLeft: '4px solid #ea580c' }}>
            <div style={{ fontSize: '0.8rem', color: '#9a3412', marginBottom: '0.25rem' }}>PMO Spend</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ea580c' }}>
              £{Math.round(pmoStats.pmoSpend).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>
              {pmoStats.pmoBudget > 0 
                ? Math.round((pmoStats.pmoSpend / pmoStats.pmoBudget) * 100) 
                : 0}% of PMO budget
            </div>
          </div>
          
          {/* Non-PMO Budget */}
          <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.8rem', color: '#1e40af', marginBottom: '0.25rem' }}>Non-PMO Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
              £{Math.round(pmoStats.nonPmoBudget).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>
              {(pmoStats.pmoBudget + pmoStats.nonPmoBudget) > 0 
                ? Math.round((pmoStats.nonPmoBudget / (pmoStats.pmoBudget + pmoStats.nonPmoBudget)) * 100) 
                : 0}% of total budget
            </div>
          </div>
          
          {/* Non-PMO Spend */}
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '0.25rem' }}>Non-PMO Spend</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
              £{Math.round(pmoStats.nonPmoSpend).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534' }}>
              {pmoStats.nonPmoBudget > 0 
                ? Math.round((pmoStats.nonPmoSpend / pmoStats.nonPmoBudget) * 100) 
                : 0}% of non-PMO budget
            </div>
          </div>
        </div>
        
        {/* PMO vs Non-PMO Comparison Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Spend Distribution</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              PMO: {stats.spendToDate > 0 ? Math.round((pmoStats.pmoSpend / stats.spendToDate) * 100) : 0}% | 
              Non-PMO: {stats.spendToDate > 0 ? Math.round((pmoStats.nonPmoSpend / stats.spendToDate) * 100) : 0}%
            </span>
          </div>
          <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
            <div 
              style={{ 
                width: `${stats.spendToDate > 0 ? (pmoStats.pmoSpend / stats.spendToDate) * 100 : 0}%`,
                backgroundColor: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                minWidth: pmoStats.pmoSpend > 0 ? '40px' : '0'
              }}
            >
              {pmoStats.pmoSpend > 0 && 'PMO'}
            </div>
            <div 
              style={{ 
                width: `${stats.spendToDate > 0 ? (pmoStats.nonPmoSpend / stats.spendToDate) * 100 : 0}%`,
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                minWidth: pmoStats.nonPmoSpend > 0 ? '60px' : '0'
              }}
            >
              {pmoStats.nonPmoSpend > 0 && 'Non-PMO'}
            </div>
          </div>
        </div>
        
        {/* PMO Resources List */}
        {pmoStats.pmoResources.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
              PMO Resources ({pmoStats.pmoResources.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pmoStats.pmoResources.map((r, idx) => (
                <span 
                  key={idx}
                  style={{ 
                    padding: '0.25rem 0.75rem', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#92400e'
                  }}
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
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

      {/* Milestone Certificates Meter */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fefce8', borderLeft: '4px solid #eab308' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileCheck size={28} style={{ color: '#ca8a04' }} />
            <div>
              <h4 style={{ margin: 0, color: '#854d0e' }}>Milestone Acceptance Certificates</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#a16207' }}>
                Track payment milestone sign-offs
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>{certificateStats.signed}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '500' }}>Signed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706' }}>{certificateStats.pending}</div>
              <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '500' }}>Pending Signature</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: certificateStats.awaitingGeneration > 0 ? '#dc2626' : '#64748b' }}>
                {certificateStats.awaitingGeneration}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Awaiting Generation</div>
            </div>
          </div>
          <Link 
            to="/milestones" 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#ca8a04', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            View Milestones →
          </Link>
        </div>
      </div>

      {/* Billable vs Spend by Milestone */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Billable vs Spend by Milestone</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Comparing the amount invoiced on completion (billable) against actual cost to date from timesheets
        </p>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', marginRight: '1rem' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
            Billable on Completion
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
            Spend to Date (Cost)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', height: '220px', alignItems: 'flex-end' }}>
          {milestones.map(milestone => {
            const maxBudget = Math.max(...milestones.map(m => m.budget || 0));
            const spend = milestoneSpend[milestone.id] || 0;
            const budgetHeight = maxBudget > 0 ? ((milestone.budget || 0) / maxBudget) * 100 : 0;
            const spendHeight = maxBudget > 0 ? (spend / maxBudget) * 100 : 0;
            
            return (
              <div key={milestone.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '180px', width: '100%', justifyContent: 'center' }}>
                  {/* Billable bar */}
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
                        color: 'white',
                        whiteSpace: 'nowrap'
                      }}>
                        £{Math.round((milestone.budget || 0) / 1000)}k
                      </span>
                    )}
                  </div>
                  {/* Spend bar */}
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
                        color: 'white',
                        whiteSpace: 'nowrap'
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

      {/* KPI & QS Performance Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* KPI Performance by Category */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>KPI Performance by Category</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '200px' }}>
            {Object.entries(kpisByCategory).map(([category, kpis]) => {
              const totalKPIs = kpis.length;
              const achievedKPIs = kpis.filter(k => (k.current_value || 0) >= (k.target || 90)).length;
              const achievedPercentage = totalKPIs > 0 ? (achievedKPIs / totalKPIs) * 100 : 0;
              const color = getCategoryColor(category);
              return (
                <div key={category} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '160px', position: 'relative' }}>
                    <div style={{ height: `${100 - achievedPercentage}%`, backgroundColor: '#e2e8f0', borderRadius: achievedPercentage > 0 ? '4px 4px 0 0' : '4px' }}></div>
                    <div style={{ height: `${achievedPercentage}%`, backgroundColor: color, borderRadius: achievedPercentage < 100 ? '0 0 4px 4px' : '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem' }}>{achievedKPIs}/{totalKPIs}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{category.split(' ')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{Math.round(achievedPercentage)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Standards Performance */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Quality Standards Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {qualityStandards.map(qs => {
              const percentage = qs.current_value || 0;
              const isAchieved = percentage >= (qs.target || 100);
              return (
                <div key={qs.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', minWidth: '45px', color: '#8b5cf6' }}>{qs.qs_ref}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: isAchieved ? '#10b981' : '#8b5cf6', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', minWidth: '45px', color: isAchieved ? '#10b981' : '#64748b' }}>{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Milestone Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Milestone Summary</h3>
          <Link to="/milestones" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>View Details →</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Due</th>
              <th>Budget</th>
              <th>Spend</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No milestones found</td></tr>
            ) : milestones.map(milestone => {
              const spend = milestoneSpend[milestone.id] || 0;
              const spendPercent = milestone.budget > 0 ? Math.round((spend / milestone.budget) * 100) : 0;
              return (
                <tr key={milestone.id}>
                  <td><Link to={`/milestones/${milestone.id}`} style={{ fontFamily: 'monospace', fontWeight: '600', color: '#3b82f6', textDecoration: 'none' }}>{milestone.milestone_ref}</Link></td>
                  <td style={{ fontWeight: '500' }}>{milestone.name}</td>
                  <td>{milestone.end_date ? new Date(milestone.end_date).toLocaleDateString('en-GB') : '-'}</td>
                  <td>£{(milestone.budget || 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: spend > 0 ? '#10b981' : '#9ca3af' }}>£{Math.round(spend).toLocaleString()}</span>
                      {milestone.budget > 0 && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: spendPercent > 100 ? '#dc2626' : '#64748b'
                        }}>
                          ({spendPercent}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${milestone.progress || 0}%`, height: '100%', backgroundColor: milestone.status === 'Completed' ? '#10b981' : '#3b82f6' }}></div>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', minWidth: '35px' }}>{milestone.progress || 0}%</span>
                    </div>
                  </td>
                  <td><StatusBadge status={milestone.status || 'Not Started'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <Link to="/milestones" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Clock size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Milestones</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Track progress</p>
        </Link>
        <Link to="/deliverables" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Package size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Deliverables</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage deliverables</p>
        </Link>
        <Link to="/kpis" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <TrendingUp size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>KPIs</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Performance indicators</p>
        </Link>
        <Link to="/quality-standards" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Award size={32} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quality</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Quality standards</p>
        </Link>
        <Link to="/reports" className="card" style={{ textDecoration: 'none', padding: '1.5rem', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
          <Target size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Reports</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Generate reports</p>
        </Link>
      </div>
    </div>
  );
}
