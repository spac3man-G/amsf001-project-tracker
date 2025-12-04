import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesService, deliverablesService, timesheetsService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { VALID_STATUSES, timesheetContributesToSpend, calculateBillableValue, hoursToDays } from '../config/metricsConfig';
import { 
  Target, ArrowLeft, Package, CheckCircle, Clock, 
  AlertCircle, Calendar, DollarSign, Info, TrendingUp, User
} from 'lucide-react';
import { LoadingSpinner, StatCard } from '../components/common';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project } = useProject();
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestoneData();
  }, [id]);

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }

    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    
    if (allDelivered) {
      return 'Completed';
    }
    
    if (allNotStarted) {
      return 'Not Started';
    }
    
    // Any other combination means work is in progress
    return 'In Progress';
  }

  async function fetchMilestoneData() {
    try {
      // Fetch milestone using service layer
      const milestoneData = await milestonesService.getById(id);
      
      if (!milestoneData) {
        setMilestone(null);
        setLoading(false);
        return;
      }
      
      setMilestone(milestoneData);

      // Fetch deliverables for this milestone using service layer
      const deliverablesData = await deliverablesService.getAll(project.id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        select: '*, deliverable_kpis(kpi_id, kpis(kpi_ref, name))',
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      
      setDeliverables(deliverablesData || []);

      // Fetch timesheets for this milestone using service layer
      const timesheetsData = await timesheetsService.getAll(project.id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        select: '*, resources(id, name, daily_rate, discount_percent)',
        orderBy: { column: 'date', ascending: false }
      });
      
      setTimesheets(timesheetsData || []);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Delivered': 
      case 'Complete': 
      case 'Completed': 
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'In Progress': 
        return { bg: '#dbeafe', color: '#2563eb' };
      case 'Submitted for Review':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'Returned for More Work':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'Review Complete':
        return { bg: '#f3e8ff', color: '#7c3aed' };
      case 'Not Started': 
      default: 
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Delivered':
      case 'Complete':
      case 'Completed':
        return <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />;
      case 'In Progress':
      case 'Submitted for Review':
      case 'Review Complete':
        return <Clock size={12} style={{ marginRight: '0.25rem' }} />;
      default:
        return null;
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading milestone..." size="large" fullPage />;
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

  // Calculate stats from deliverables
  const totalDeliverables = deliverables.length;
  const deliveredDeliverables = deliverables.filter(d => d.status === 'Delivered').length;
  const inProgressDeliverables = deliverables.filter(d => 
    d.status === 'In Progress' || 
    d.status === 'Submitted for Review' || 
    d.status === 'Returned for More Work' ||
    d.status === 'Review Complete'
  ).length;
  
  // Calculate progress as average of all deliverable progress
  const progress = totalDeliverables > 0 
    ? Math.round(deliverables.reduce((sum, d) => sum + (d.progress || 0), 0) / totalDeliverables) 
    : 0;
  
  // Calculate status from deliverables
  const computedStatus = calculateMilestoneStatus(deliverables);
  const statusColors = getStatusColor(computedStatus);

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
                backgroundColor: statusColors.bg,
                color: statusColors.color
              }}>
                {computedStatus}
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
          <div className="stat-value" style={{ color: '#10b981' }}>{deliveredDeliverables}</div>
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

      {/* Status Info Box */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f0f9ff', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#3b82f6', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Milestone Status: {computedStatus}</h4>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem' }}>
              {computedStatus === 'Not Started' && 'No deliverables have begun. Status will change to "In Progress" when any deliverable starts.'}
              {computedStatus === 'In Progress' && `${inProgressDeliverables} deliverable${inProgressDeliverables !== 1 ? 's are' : ' is'} currently being worked on. Status will change to "Completed" when all deliverables are delivered.`}
              {computedStatus === 'Completed' && 'All deliverables have been delivered! 🎉'}
            </p>
          </div>
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
                £{(milestone.budget || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget & Spend Tracking */}
      {(() => {
        // Only count timesheets that contribute to spend (using centralized config)
        const countingTimesheets = timesheets.filter(ts => 
          timesheetContributesToSpend(ts.status) && !ts.was_rejected
        );
        
        // Calculate spend from valid timesheets only
        const totalHours = countingTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);
        const totalSpend = countingTimesheets.reduce((sum, ts) => {
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          const resource = ts.resources;
          if (resource) {
            const dailyRate = resource.daily_rate || 0;
            return sum + calculateBillableValue(hours, dailyRate);
          }
          return sum;
        }, 0);
        const budget = milestone.budget || 0;
        const spendPercent = budget > 0 ? Math.round((totalSpend / budget) * 100) : 0;
        const isOverBudget = spendPercent > 100;

        // Group spend by resource (only counting timesheets)
        const spendByResource = {};
        countingTimesheets.forEach(ts => {
          const resourceName = ts.resources?.name || 'Unknown';
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          const resource = ts.resources;
          let cost = 0;
          if (resource) {
            const dailyRate = resource.daily_rate || 0;
            cost = calculateBillableValue(hours, dailyRate);
          }
          if (!spendByResource[resourceName]) {
            spendByResource[resourceName] = { hours: 0, cost: 0 };
          }
          spendByResource[resourceName].hours += hours;
          spendByResource[resourceName].cost += cost;
        });

        return (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} /> Budget & Spend Tracking
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Budget</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                  £{budget.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: isOverBudget ? '#fef2f2' : '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Spend to Date</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isOverBudget ? '#dc2626' : '#10b981' }}>
                  £{Math.round(totalSpend).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Hours Logged</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b' }}>
                  {totalHours.toFixed(1)}h
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  ({hoursToDays(totalHours).toFixed(1)} days)
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: spendPercent > 80 ? '#fef3c7' : '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>% of Budget</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isOverBudget ? '#dc2626' : spendPercent > 80 ? '#d97706' : '#64748b' }}>
                  {spendPercent}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Budget Utilization</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isOverBudget ? '#dc2626' : '#10b981' }}>
                  £{Math.round(totalSpend).toLocaleString()} / £{budget.toLocaleString()}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(spendPercent, 100)}%`, 
                  height: '100%', 
                  backgroundColor: isOverBudget ? '#dc2626' : spendPercent > 80 ? '#f59e0b' : '#10b981',
                  borderRadius: '5px'
                }}></div>
              </div>
            </div>

            {/* Spend by Resource */}
            {Object.keys(spendByResource).length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#374151' }}>Spend by Resource</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {Object.entries(spendByResource).map(([name, data]) => (
                    <div key={name} style={{ 
                      padding: '0.75rem 1rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      minWidth: '150px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <User size={14} style={{ color: '#64748b' }} />
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{name}</span>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: '700' }}>£{Math.round(data.cost).toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.hours.toFixed(1)}h logged</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timesheets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No timesheets logged against this milestone yet.</p>
                <Link to="/timesheets" style={{ color: '#3b82f6', fontSize: '0.9rem' }}>Log time →</Link>
              </div>
            )}
          </div>
        );
      })()}

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
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Add deliverables to this milestone to track progress automatically.
            </p>
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
                const delStatusColors = getStatusColor(del.status);
                return (
                  <tr key={del.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{del.deliverable_ref}</td>
                    <td style={{ fontWeight: '500' }}>{del.name}</td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: delStatusColors.bg,
                        color: delStatusColors.color
                      }}>
                        {getStatusIcon(del.status)}
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
                            backgroundColor: del.status === 'Delivered' ? '#10b981' : '#3b82f6',
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

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 How Milestone Status Works</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>Milestone status is <strong>automatically calculated</strong> from deliverable statuses</li>
          <li><strong>Not Started:</strong> All deliverables are "Not Started"</li>
          <li><strong>In Progress:</strong> At least one deliverable has begun (In Progress, Submitted, In Review, etc.)</li>
          <li><strong>Completed:</strong> All deliverables have been "Delivered"</li>
          <li>Progress % = average of all deliverable progress percentages</li>
        </ul>
      </div>
    </div>
  );
}
