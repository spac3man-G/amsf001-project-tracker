import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, RefreshCw, CheckCircle, AlertCircle, 
  AlertTriangle, Clock, Edit2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { canManageKPIs } from '../lib/permissions';

export default function KPIs() {
  // Use shared contexts instead of local state for auth and project
  const { role: userRole } = useAuth();
  const { projectId } = useProject();

  const [kpis, setKpis] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch data when projectId becomes available (from ProjectContext)
  useEffect(() => {
    if (projectId) {
      fetchKPIs(projectId);
    }
  }, [projectId]);

  async function fetchKPIs(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('project_id', pid)
        .order('kpi_ref');

      if (error) throw error;
      setKpis(data || []);

      // Fetch assessment counts for each KPI
      const { data: assessments } = await supabase
        .from('deliverable_kpi_assessments')
        .select('kpi_id, criteria_met');

      // Count assessments per KPI
      const counts = {};
      if (assessments) {
        assessments.forEach(a => {
          if (!counts[a.kpi_id]) {
            counts[a.kpi_id] = { total: 0, met: 0, notMet: 0 };
          }
          counts[a.kpi_id].total++;
          if (a.criteria_met === true) counts[a.kpi_id].met++;
          if (a.criteria_met === false) counts[a.kpi_id].notMet++;
        });
      }
      setAssessmentCounts(counts);

    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  }

  function getKPIStatus(kpi) {
    const assessments = assessmentCounts[kpi.id];
    const target = kpi.target || 90;

    // If no assessments have been made for this KPI, it's "Not Started"
    if (!assessments || assessments.total === 0) {
      return {
        label: 'Not Started',
        color: '#64748b',
        bg: '#f1f5f9',
        icon: Clock
      };
    }

    // Calculate percentage based on assessments
    const percentage = assessments.total > 0 
      ? Math.round((assessments.met / assessments.total) * 100) 
      : 0;

    // Determine status based on actual assessment results
    if (percentage >= target) {
      return {
        label: 'Achieved',
        color: '#10b981',
        bg: '#f0fdf4',
        icon: CheckCircle
      };
    } else if (percentage >= target * 0.8) {
      return {
        label: 'On Track',
        color: '#3b82f6',
        bg: '#eff6ff',
        icon: TrendingUp
      };
    } else if (percentage >= target * 0.6) {
      return {
        label: 'At Risk',
        color: '#f59e0b',
        bg: '#fffbeb',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Critical',
        color: '#ef4444',
        bg: '#fef2f2',
        icon: AlertCircle
      };
    }
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Time Performance':
        return { bg: '#dbeafe', color: '#2563eb' };
      case 'Quality of Collaboration':
        return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'Delivery Performance':
        return { bg: '#dcfce7', color: '#16a34a' };
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  // Group KPIs by category
  const groupedKPIs = kpis.reduce((acc, kpi) => {
    const category = kpi.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(kpi);
    return acc;
  }, {});

  // Calculate stats
  const totalKPIs = kpis.length;
  const achievedKPIs = kpis.filter(k => {
    const status = getKPIStatus(k);
    return status.label === 'Achieved';
  }).length;
  const atRiskKPIs = kpis.filter(k => {
    const status = getKPIStatus(k);
    return status.label === 'At Risk' || status.label === 'Critical';
  }).length;
  const notStartedKPIs = kpis.filter(k => {
    const status = getKPIStatus(k);
    return status.label === 'Not Started';
  }).length;

  // Use centralized permission - Note: Customer PM should NOT edit KPIs per User Manual
  const canEdit = canManageKPIs(userRole);

  if (loading && !projectId) return <div className="loading">Loading KPIs...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <TrendingUp size={28} />
          <div>
            <h1>Key Performance Indicators</h1>
            <p>Track project performance against SOW targets</p>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => fetchKPIs()}
        >
          <RefreshCw size={18} /> Refresh Metrics
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total KPIs</div>
          <div className="stat-value">{totalKPIs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Achieved</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{achievedKPIs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">At Risk / Critical</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{atRiskKPIs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Started</div>
          <div className="stat-value" style={{ color: '#64748b' }}>{notStartedKPIs}</div>
        </div>
      </div>

      {/* KPIs Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Key Performance Indicators</h3>
        <table>
          <thead>
            <tr>
              <th>KPI ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Target</th>
              <th>Current</th>
              <th>Assessments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map(kpi => {
              const status = getKPIStatus(kpi);
              const catColor = getCategoryColor(kpi.category);
              const assessments = assessmentCounts[kpi.id];
              const StatusIcon = status.icon;

              return (
                <tr key={kpi.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{kpi.kpi_ref}</td>
                  <td>
                    <Link 
                      to={`/kpis/${kpi.id}`}
                      style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
                    >
                      {kpi.name}
                    </Link>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      backgroundColor: catColor.bg,
                      color: catColor.color
                    }}>
                      {kpi.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{kpi.target}%</td>
                  <td style={{ 
                    textAlign: 'center', 
                    fontWeight: '600',
                    color: status.color
                  }}>
                    {assessments ? Math.round((assessments.met / assessments.total) * 100) : 0}%
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {assessments ? (
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {assessments.met}/{assessments.total}
                        <span style={{ 
                          marginLeft: '0.25rem',
                          color: assessments.notMet > 0 ? '#ef4444' : '#10b981'
                        }}>
                          ({assessments.notMet > 0 ? `${assessments.notMet} failed` : 'all passed'})
                        </span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>None yet</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: status.bg,
                      color: status.color
                    }}>
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </td>
                  <td>
                    {canEdit && (
                      <Link 
                        to={`/kpis/${kpi.id}`}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f1f5f9',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="View/Edit"
                      >
                        <Edit2 size={16} />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category Cards */}
      {Object.entries(groupedKPIs).map(([category, categoryKpis]) => {
        const catColor = getCategoryColor(category);
        return (
          <div key={category} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: catColor.color
              }}></span>
              {category}
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1rem' 
            }}>
              {categoryKpis.map(kpi => {
                const status = getKPIStatus(kpi);
                const assessments = assessmentCounts[kpi.id];
                const StatusIcon = status.icon;
                const currentScore = assessments ? Math.round((assessments.met / assessments.total) * 100) : 0;
                
                return (
                  <Link 
                    key={kpi.id}
                    to={`/kpis/${kpi.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="card" style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '600',
                          color: '#64748b'
                        }}>
                          {kpi.kpi_ref}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          backgroundColor: status.bg,
                          color: status.color
                        }}>
                          <StatusIcon size={12} />
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '700', 
                        color: status.color,
                        marginBottom: '0.25rem'
                      }}>
                        {currentScore}%
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        Target: {kpi.target}%
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ 
                          width: `${Math.min(currentScore / kpi.target * 100, 100)}%`, 
                          height: '100%', 
                          backgroundColor: status.color,
                          borderRadius: '3px'
                        }}></div>
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {kpi.name}
                      </div>
                      {assessments && assessments.total > 0 ? (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#64748b',
                          marginTop: '0.5rem'
                        }}>
                          {assessments.met} of {assessments.total} assessments passed
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#9ca3af',
                          marginTop: '0.5rem'
                        }}>
                          No assessments yet
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info Box */}
      <div className="card" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>📊 How KPI Scores Work</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li><strong>Not Started</strong> - No deliverables with this KPI have been completed yet</li>
          <li><strong>Achieved</strong> - Current score meets or exceeds target</li>
          <li><strong>On Track</strong> - Within 80% of target</li>
          <li><strong>At Risk</strong> - Between 60-80% of target</li>
          <li><strong>Critical</strong> - Below 60% of target (only for KPIs that have been assessed)</li>
        </ul>
      </div>
    </div>
  );
}
