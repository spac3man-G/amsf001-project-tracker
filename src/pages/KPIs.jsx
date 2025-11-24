import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Edit2, Save, X, Target, AlertCircle } from 'lucide-react';

export default function KPIs() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        .order('kpi_ref');
      
      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(kpi) {
    setEditingId(kpi.id);
    setEditForm({
      current_value: kpi.current_value,
      last_measured: new Date().toISOString().split('T')[0]
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('kpis')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;
      
      await fetchKPIs();
      setEditingId(null);
      alert('KPI updated successfully!');
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('Failed to update KPI');
    }
  }

  const getStatusColor = (current, target) => {
    const performance = (current / target) * 100;
    if (performance >= 95) return 'badge-success';
    if (performance >= 80) return 'badge-primary';
    if (performance >= 70) return 'badge-warning';
    return 'badge-danger';
  };

  const getStatusText = (current, target) => {
    const performance = (current / target) * 100;
    if (performance >= 95) return 'ON TARGET';
    if (performance >= 80) return 'NEAR TARGET';
    if (performance >= 70) return 'AT RISK';
    return 'CRITICAL';
  };

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Key Performance Indicators</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <p>Loading KPIs...</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = {
    'Time Performance': kpis.filter(k => k.category === 'Time Performance'),
    'Quality of Collaboration': kpis.filter(k => k.category === 'Quality of Collaboration'),
    'Delivery Performance': kpis.filter(k => k.category === 'Delivery Performance')
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Key Performance Indicators</h2>
          {userRole === 'admin' && (
            <button 
              className="btn btn-primary"
              onClick={() => alert('Refresh KPIs from latest data')}
            >
              <TrendingUp size={20} />
              Refresh Metrics
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>KPI ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Target</th>
                <th>Current</th>
                <th>Status</th>
                {userRole === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id}>
                  <td>{kpi.kpi_ref}</td>
                  <td>
                    <div>
                      <strong>{kpi.name}</strong>
                      {kpi.description && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                          {kpi.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{kpi.category}</td>
                  <td>{kpi.target}%</td>
                  <td>
                    {editingId === kpi.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.current_value}
                          onChange={(e) => setEditForm({...editForm, current_value: e.target.value})}
                          style={{ width: '80px' }}
                        />
                        %
                      </div>
                    ) : (
                      <div>
                        {kpi.current_value || '-'}%
                        {kpi.last_measured && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {new Date(kpi.last_measured).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(kpi.current_value || 0, kpi.target)}`}>
                      {getStatusText(kpi.current_value || 0, kpi.target)}
                    </span>
                  </td>
                  {userRole === 'admin' && (
                    <td>
                      {editingId === kpi.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSave(kpi.id)}
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(kpi)}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Object.entries(categories).map(([category, categoryKpis]) => (
        <div key={category} className="card" style={{ marginTop: '1rem' }}>
          <div className="card-header">
            <h3 className="card-title">{category}</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <div className="kpi-grid">
              {categoryKpis.map(kpi => {
                const performance = (kpi.current_value || 0) / kpi.target * 100;
                return (
                  <div key={kpi.id} className="kpi-card">
                    <div className="kpi-header">
                      <span className="kpi-ref">{kpi.kpi_ref}</span>
                      <Target size={20} />
                    </div>
                    <div className="kpi-value">{kpi.current_value || 0}%</div>
                    <div className="kpi-target">Target: {kpi.target}%</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${Math.min(performance, 100)}%`,
                          background: performance >= 90 ? 'var(--success)' : 
                                     performance >= 70 ? 'var(--primary)' : 'var(--danger)'
                        }}
                      />
                    </div>
                    <div className="kpi-name">{kpi.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .kpi-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1rem;
        }
        
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .kpi-ref {
          font-size: 0.875rem;
          color: var(--text-light);
        }
        
        .kpi-value {
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 0.25rem;
        }
        
        .kpi-target {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-bottom: 0.5rem;
        }
        
        .kpi-name {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        .badge-warning {
          background: #f59e0b;
          color: white;
        }
        
        .badge-danger {
          background: var(--danger);
          color: white;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
