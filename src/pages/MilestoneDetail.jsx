import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Target, ArrowLeft, Package, CheckCircle, Clock, 
  AlertCircle, Calendar, DollarSign
} from 'lucide-react';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestoneData();
  }, [id]);

  async function fetchMilestoneData() {
    try {
      // Fetch milestone
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .single();

      if (milestoneError) throw milestoneError;
      setMilestone(milestoneData);

      // Fetch deliverables for this milestone
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('deliverables')
        .select('*, deliverable_kpis(kpi_id, kpis(kpi_ref, name))')
        .eq('milestone_id', id)
        .order('deliverable_ref');

      if (deliverablesError) throw deliverablesError;
      setDeliverables(deliverablesData || []);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Complete': case 'Completed': return { bg: '#dcfce7', color: '#16a34a' };
      case 'In Progress': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Not Started': return { bg: '#f1f5f9', color: '#64748b' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  if (loading) {
    return <div className="loading">Loading milestone...</div>;
  }

  if (!milestone) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Milestone Not Found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/milestones')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Milestones
          </button>
        </div>
      </div>
    );
  }

  const totalDeliverables = deliverables.length;
  const completedDeliverables = deliverables.filter(d => d.status === 'Complete').length;
  const inProgressDeliverables = deliverables.filter(d => d.status === 'In Progress').length;
  const progress = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/milestones')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}
          >
            <ArrowLeft size={24} />
          </button>
          <Target size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{milestone.milestone_ref}</h1>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: getStatusColor(milestone.status).bg,
                color: getStatusColor(milestone.status).color
              }}>
                {milestone.status || 'Not Started'}
              </span>
            </div>
            <p>{milestone.name}</p>
          </div>
        </div>
      </div>

      {/* Milestone Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Deliverables</div>
          <div className="stat-value">{totalDeliverables}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedDeliverables}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{inProgressDeliverables}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Progress</div>
          <div className="stat-value" style={{ color: progress >= 100 ? '#10b981' : '#3b82f6' }}>{progress}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: '500' }}>Milestone Progress</span>
          <span style={{ fontWeight: '600', color: progress >= 100 ? '#10b981' : '#3b82f6' }}>{progress}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '12px', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            backgroundColor: progress >= 100 ? '#10b981' : '#3b82f6',
            borderRadius: '6px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* Milestone Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Description</h3>
          <p style={{ color: '#374151', lineHeight: '1.6' }}>
            {milestone.description || 'No description provided.'}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b' }}>Start:</span>
              <span style={{ fontWeight: '500' }}>
                {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString('en-GB') : '-'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b' }}>End:</span>
              <span style={{ fontWeight: '500' }}>
                {milestone.end_date ? new Date(milestone.end_date).toLocaleDateString('en-GB') : '-'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={16} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b' }}>Budget:</span>
              <span style={{ fontWeight: '500' }}>
                £{(milestone.value || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} /> Deliverables ({totalDeliverables})
          </h3>
          <Link to="/deliverables" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Manage Deliverables
          </Link>
        </div>

        {deliverables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No deliverables assigned to this milestone yet.</p>
            <Link to="/deliverables" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
              Add Deliverable
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Linked KPIs</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map(del => {
                const statusColors = getStatusColor(del.status);
                return (
                  <tr key={del.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{del.deliverable_ref}</td>
                    <td style={{ fontWeight: '500' }}>{del.name}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: statusColors.bg,
                        color: statusColors.color
                      }}>
                        {del.status === 'Complete' && <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />}
                        {del.status === 'In Progress' && <Clock size={12} style={{ marginRight: '0.25rem' }} />}
                        {del.status || 'Not Started'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '6px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${del.progress || 0}%`, 
                            height: '100%', 
                            backgroundColor: del.status === 'Complete' ? '#10b981' : '#3b82f6',
                            borderRadius: '3px'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{del.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {del.deliverable_kpis?.map((dk, idx) => (
                          <span key={idx} style={{ 
                            padding: '0.125rem 0.375rem', 
                            backgroundColor: '#dbeafe', 
                            color: '#2563eb',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {dk.kpis?.kpi_ref}
                          </span>
                        ))}
                        {(!del.deliverable_kpis || del.deliverable_kpis.length === 0) && (
                          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {del.due_date ? new Date(del.due_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
