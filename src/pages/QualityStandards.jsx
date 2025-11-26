import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Award, CheckCircle, AlertCircle, Clock, TrendingUp,
  AlertTriangle, Info
} from 'lucide-react';

export default function QualityStandards() {
  const [qualityStandards, setQualityStandards] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    fetchQualityStandards();
  }, []);

  async function fetchQualityStandards() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();

      if (!project) return;

      const { data, error } = await supabase
        .from('quality_standards')
        .select('*')
        .eq('project_id', project.id)
        .order('qs_ref');

      if (error) throw error;
      setQualityStandards(data || []);

      // Fetch assessment counts for each QS
      const counts = {};
      for (const qs of (data || [])) {
        const { data: assessments } = await supabase
          .from('deliverable_qs_assessments')
          .select('criteria_met')
          .eq('quality_standard_id', qs.id);

        const total = assessments?.filter(a => a.criteria_met !== null).length || 0;
        const met = assessments?.filter(a => a.criteria_met === true).length || 0;
        counts[qs.id] = { total, met };
      }
      setAssessmentCounts(counts);

    } catch (error) {
      console.error('Error fetching quality standards:', error);
    } finally {
      setLoading(false);
    }
  }

  function getQSStatus(qs) {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    
    if (assessments.total === 0) {
      return { 
        label: 'Not Started', 
        color: '#64748b', 
        bg: '#f1f5f9',
        icon: Clock
      };
    }

    const percentage = (assessments.met / assessments.total) * 100;
    const target = qs.target || 100;

    if (percentage >= target) {
      return { 
        label: 'Achieved', 
        color: '#16a34a', 
        bg: '#dcfce7',
        icon: CheckCircle
      };
    } else if (percentage >= target * 0.8) {
      return { 
        label: 'On Track', 
        color: '#2563eb', 
        bg: '#dbeafe',
        icon: TrendingUp
      };
    } else if (percentage >= target * 0.6) {
      return { 
        label: 'At Risk', 
        color: '#ea580c', 
        bg: '#ffedd5',
        icon: AlertTriangle
      };
    } else {
      return { 
        label: 'Critical', 
        color: '#dc2626', 
        bg: '#fee2e2',
        icon: AlertCircle
      };
    }
  }

  // Calculate summary stats
  const totalQS = qualityStandards.length;
  const achievedQS = qualityStandards.filter(qs => {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    if (assessments.total === 0) return false;
    const percentage = (assessments.met / assessments.total) * 100;
    return percentage >= (qs.target || 100);
  }).length;
  const atRiskQS = qualityStandards.filter(qs => {
    const status = getQSStatus(qs);
    return status.label === 'At Risk' || status.label === 'Critical';
  }).length;
  const notStartedQS = qualityStandards.filter(qs => {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    return assessments.total === 0;
  }).length;

  if (loading) return <div className="loading">Loading quality standards...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Award size={28} />
          <div>
            <h1>Quality Standards</h1>
            <p>Track quality compliance across deliverables</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Standards</div>
          <div className="stat-value">{totalQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#16a34a' }}>Achieved</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{achievedQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#ea580c' }}>At Risk</div>
          <div className="stat-value" style={{ color: '#ea580c' }}>{atRiskQS}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: '#64748b' }}>Not Started</div>
          <div className="stat-value" style={{ color: '#64748b' }}>{notStartedQS}</div>
        </div>
      </div>

      {/* Quality Standards Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Target</th>
              <th>Current</th>
              <th>Assessments</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {qualityStandards.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No quality standards found
                </td>
              </tr>
            ) : (
              qualityStandards.map(qs => {
                const status = getQSStatus(qs);
                const StatusIcon = status.icon;
                const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };

                return (
                  <tr key={qs.id}>
                    <td>
                      <Link 
                        to={`/quality-standards/${qs.id}`}
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '600',
                          color: '#8b5cf6',
                          textDecoration: 'none'
                        }}
                      >
                        {qs.qs_ref}
                      </Link>
                    </td>
                    <td>
                      <Link 
                        to={`/quality-standards/${qs.id}`}
                        style={{ 
                          fontWeight: '500',
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                      >
                        {qs.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'center' }}>{qs.target}%</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: '600',
                        color: qs.current_value >= qs.target ? '#16a34a' : '#64748b'
                      }}>
                        {qs.current_value}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {assessments.total > 0 ? (
                        <span style={{ color: '#64748b' }}>
                          {assessments.met} of {assessments.total} passed
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          None yet
                        </span>
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
                        fontWeight: '500',
                        backgroundColor: status.bg,
                        color: status.color
                      }}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderLeft: '4px solid #16a34a',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#16a34a', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Quality Standards Overview</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.9rem' }}>
              <li><strong>Not Started:</strong> No deliverables have been assessed against this standard yet</li>
              <li><strong>Achieved:</strong> Current score meets or exceeds target</li>
              <li><strong>On Track:</strong> Within 80% of target</li>
              <li><strong>At Risk:</strong> 60-80% of target</li>
              <li><strong>Critical:</strong> Below 60% of target (only for assessed standards)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
