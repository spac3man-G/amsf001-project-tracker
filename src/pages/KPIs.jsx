import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, RefreshCw, Edit2, Save, X, Target,
  CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';

export default function KPIs() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    'Time Performance',
    'Quality of Collaboration',
    'Delivery Performance'
  ];

  useEffect(() => {
    fetchKPIs();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchKPIs() {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('kpi_id');

      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshMetrics() {
    setRefreshing(true);
    // In a real implementation, this would recalculate KPI values from deliverables, timesheets, etc.
    await fetchKPIs();
    setTimeout(() => setRefreshing(false), 1000);
  }

  async function handleEdit(kpi) {
    setEditingId(kpi.id);
    setEditForm({
      current_value: kpi.current_value || ''
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({
          current_value: parseFloat(editForm.current_value) || 0
        })
        .eq('id', id);

      if (error) throw error;
      await fetchKPIs();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('Failed to update KPI');
    }
  }

  function getStatus(current, target) {
    const curr = parseFloat(current) || 0;
    const tgt = parseFloat(target) || 100;
    const percentage = (curr / tgt) * 100;
    
    if (curr === 0) return { status: 'Critical', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle };
    if (percentage >= 100) return { status: 'Achieved', color: '#10b981', bg: '#f0fdf4', icon: CheckCircle };
    if (percentage >= 80) return { status: 'On Track', color: '#3b82f6', bg: '#eff6ff', icon: TrendingUp };
    if (percentage >= 60) return { status: 'At Risk', color: '#f59e0b', bg: '#fffbeb', icon: AlertTriangle };
    return { status: 'Critical', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle };
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'Time Performance': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Quality of Collaboration': return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'Delivery Performance': return { bg: '#dcfce7', color: '#16a34a' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  if (loading) {
    return <div className="loading">Loading KPIs...</div>;
  }

  const canEdit = userRole === 'admin' || userRole === 'contributor';

  // Group KPIs by category
  const kpisByCategory = categories.reduce((acc, cat) => {
    acc[cat] = kpis.filter(k => k.category === cat);
    return acc;
  }, {});

  // Calculate overall stats
  const totalKPIs = kpis.length;
  const achievedKPIs = kpis.filter(k => {
    const status = getStatus(k.current_value, k.target_value);
    return status.status === 'Achieved';
  }).length;
  const atRiskKPIs = kpis.filter(k => {
    const status = getStatus(k.current_value, k.target_value);
    return status.status === 'At Risk' || status.status === 'Critical';
  }).length;

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
          onClick={handleRefreshMetrics}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Summary Stats */}
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
          <div className="stat-label">Achievement Rate</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {totalKPIs > 0 ? Math.round((achievedKPIs / totalKPIs) * 100) : 0}%
          </div>
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
              <th style={{ textAlign: 'center' }}>Target</th>
              <th style={{ textAlign: 'center' }}>Current</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kpis.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No KPIs found.
                </td>
              </tr>
            ) : (
              kpis.map(kpi => {
                const statusInfo = getStatus(kpi.current_value, kpi.target_value);
                const StatusIcon = statusInfo.icon;
                const catColors = getCategoryColor(kpi.category);
                
                return (
                  <tr key={kpi.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{kpi.kpi_id}</td>
                    <td>
                      <Link 
                        to={`/kpis/${kpi.id}`}
                        style={{ 
                          color: '#3b82f6', 
                          textDecoration: 'none', 
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {kpi.name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: catColors.bg,
                        color: catColors.color
                      }}>
                        {kpi.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>{kpi.target_value}%</td>
                    <td style={{ textAlign: 'center' }}>
                      {editingId === kpi.id ? (
                        <input
                          type="number"
                          className="form-input"
                          value={editForm.current_value}
                          onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })}
                          style={{ width: '80px', textAlign: 'center' }}
                          min="0"
                          max="100"
                        />
                      ) : (
                        <span style={{ color: statusInfo.color, fontWeight: '600' }}>
                          {kpi.current_value !== null ? `${kpi.current_value}%` : '-%'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        <StatusIcon size={14} />
                        {statusInfo.status}
                      </span>
                    </td>
                    <td>
                      {editingId === kpi.id ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(kpi.id)} title="Save">
                            <Save size={16} />
                          </button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingId(null)} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          {canEdit && (
                            <button className="btn-icon" onClick={() => handleEdit(kpi)} title="Edit Value">
                              <Edit2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* KPIs by Category */}
      {categories.map(category => {
        const categoryKPIs = kpisByCategory[category] || [];
        if (categoryKPIs.length === 0) return null;
        
        const catColors = getCategoryColor(category);
        
        return (
          <div key={category} className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: catColors.color 
              }}></span>
              {category}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {categoryKPIs.map(kpi => {
                const statusInfo = getStatus(kpi.current_value, kpi.target_value);
                const progress = kpi.target_value > 0 
                  ? Math.min(100, ((kpi.current_value || 0) / kpi.target_value) * 100)
                  : 0;
                
                return (
                  <Link 
                    key={kpi.id}
                    to={`/kpis/${kpi.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{kpi.kpi_id}</span>
                        <Target size={16} style={{ color: statusInfo.color }} />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: statusInfo.color, marginBottom: '0.25rem' }}>
                        {kpi.current_value !== null ? `${kpi.current_value}%` : '0%'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        Target: {kpi.target_value}%
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ 
                          width: `${progress}%`, 
                          height: '100%', 
                          backgroundColor: statusInfo.color,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
                        {kpi.name}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info Box */}
      <div className="card" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 About KPIs</h4>
        <p style={{ color: '#166534', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Click on any KPI name to view full details including SOW definitions, measurement methods, and remediation actions.
        </p>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li><strong>Achieved:</strong> Current value meets or exceeds target</li>
          <li><strong>On Track:</strong> Current value is 80% or more of target</li>
          <li><strong>At Risk:</strong> Current value is 60-80% of target</li>
          <li><strong>Critical:</strong> Current value is below 60% of target</li>
        </ul>
      </div>
    </div>
  );
}
