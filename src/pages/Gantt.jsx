import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Calendar, ChevronLeft, ChevronRight, Info, GripHorizontal,
  Lock, Move, ZoomIn, ZoomOut
} from 'lucide-react';
import { useAuth, useProject } from '../hooks';
import { useToast } from '../components/Toast';

export default function Gantt() {
  // ============================================
  // HOOKS - Replace boilerplate
  // ============================================
  const { userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const toast = useToast();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState(null);
  const [viewEnd, setViewEnd] = useState(null);
  const [daysPerPixel, setDaysPerPixel] = useState(0.1); // Zoom level
  const [dragging, setDragging] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState({});
  const chartRef = useRef(null);

  const canEdit = ['admin', 'supplier_pm', 'customer_pm'].includes(userRole);

  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchMilestones();
    }
  }, [projectId, authLoading, projectLoading]);

  useEffect(() => {
    if (milestones.length > 0) {
      calculateViewRange();
    }
  }, [milestones]);

  async function fetchMilestones() {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_ref');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  }

  function calculateViewRange() {
    let minDate = new Date();
    let maxDate = new Date();
    
    milestones.forEach(m => {
      const dates = [
        m.baseline_start_date,
        m.baseline_end_date,
        m.actual_start_date,
        m.forecast_end_date,
        m.start_date,
        m.end_date
      ].filter(Boolean).map(d => new Date(d));
      
      dates.forEach(d => {
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      });
    });

    // Add padding
    minDate.setDate(minDate.getDate() - 14);
    maxDate.setDate(maxDate.getDate() + 14);

    setViewStart(minDate);
    setViewEnd(maxDate);
  }

  function dateToX(date) {
    if (!viewStart || !date) return 0;
    const d = new Date(date);
    const diffDays = (d - viewStart) / (1000 * 60 * 60 * 24);
    return diffDays / daysPerPixel;
  }

  function xToDate(x) {
    if (!viewStart) return new Date();
    const diffDays = x * daysPerPixel;
    const date = new Date(viewStart);
    date.setDate(date.getDate() + Math.round(diffDays));
    return date;
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short',
      year: '2-digit'
    });
  }

  function formatDateISO(date) {
    return date.toISOString().split('T')[0];
  }

  // Drag handlers
  function handleMouseDown(e, milestone, dragType) {
    if (!canEdit) return;
    e.preventDefault();
    
    setDragging({ milestoneId: milestone.id, type: dragType });
    setDragStartX(e.clientX);
    setOriginalDates({
      actual_start_date: milestone.actual_start_date,
      forecast_end_date: milestone.forecast_end_date
    });

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if (!dragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaDays = Math.round(deltaX * daysPerPixel);

    setMilestones(prev => prev.map(m => {
      if (m.id !== dragging.milestoneId) return m;

      const newMilestone = { ...m };
      
      if (dragging.type === 'move') {
        // Move both dates together
        if (originalDates.actual_start_date) {
          const newStart = new Date(originalDates.actual_start_date);
          newStart.setDate(newStart.getDate() + deltaDays);
          newMilestone.actual_start_date = formatDateISO(newStart);
        }
        if (originalDates.forecast_end_date) {
          const newEnd = new Date(originalDates.forecast_end_date);
          newEnd.setDate(newEnd.getDate() + deltaDays);
          newMilestone.forecast_end_date = formatDateISO(newEnd);
        }
      } else if (dragging.type === 'start') {
        // Only move start date
        if (originalDates.actual_start_date) {
          const newStart = new Date(originalDates.actual_start_date);
          newStart.setDate(newStart.getDate() + deltaDays);
          newMilestone.actual_start_date = formatDateISO(newStart);
        }
      } else if (dragging.type === 'end') {
        // Only move end date
        if (originalDates.forecast_end_date) {
          const newEnd = new Date(originalDates.forecast_end_date);
          newEnd.setDate(newEnd.getDate() + deltaDays);
          newMilestone.forecast_end_date = formatDateISO(newEnd);
        }
      }

      return newMilestone;
    }));
  }

  async function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (!dragging) return;

    const milestone = milestones.find(m => m.id === dragging.milestoneId);
    if (milestone) {
      try {
        const { error } = await supabase
          .from('milestones')
          .update({
            actual_start_date: milestone.actual_start_date,
            forecast_end_date: milestone.forecast_end_date
          })
          .eq('id', milestone.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating milestone:', error);
        toast.error('Failed to update milestone dates');
        await fetchMilestones();
      }
    }

    setDragging(null);
  }

  // Generate timeline headers
  function generateTimelineHeaders() {
    if (!viewStart || !viewEnd) return [];
    
    const headers = [];
    const current = new Date(viewStart);
    
    while (current <= viewEnd) {
      headers.push({
        date: new Date(current),
        x: dateToX(current),
        isMonthStart: current.getDate() === 1,
        isWeekStart: current.getDay() === 1
      });
      current.setDate(current.getDate() + 7); // Weekly markers
    }
    
    return headers;
  }

  function handleZoom(direction) {
    setDaysPerPixel(prev => {
      if (direction === 'in') return Math.max(0.02, prev * 0.8);
      return Math.min(0.5, prev * 1.25);
    });
  }

  function shiftView(direction) {
    const shiftDays = direction === 'left' ? -30 : 30;
    setViewStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + shiftDays);
      return newDate;
    });
    setViewEnd(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + shiftDays);
      return newDate;
    });
  }

  const timelineHeaders = generateTimelineHeaders();
  const chartWidth = viewStart && viewEnd 
    ? (viewEnd - viewStart) / (1000 * 60 * 60 * 24) / daysPerPixel 
    : 1000;

  if (authLoading || projectLoading || loading) return <div className="loading">Loading Gantt chart...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Calendar size={28} />
          <div>
            <h1>Project Gantt Chart</h1>
            <p>Visual timeline of milestone schedules</p>
          </div>
        </div>
        <Link to="/milestones" className="btn btn-secondary">
          ← Back to Milestones
        </Link>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => shiftView('left')}
            style={{ padding: '0.5rem' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => shiftView('right')}
            style={{ padding: '0.5rem' }}
          >
            <ChevronRight size={20} />
          </button>
          <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
            {viewStart && formatDate(viewStart)} - {viewEnd && formatDate(viewEnd)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleZoom('out')}
            style={{ padding: '0.5rem' }}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleZoom('in')}
            style={{ padding: '0.5rem' }}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '12px', backgroundColor: '#94a3b8', borderRadius: '2px', opacity: 0.6 }}></div>
            <span style={{ fontSize: '0.85rem' }}>Baseline (fixed)</span>
            <Lock size={14} style={{ color: '#64748b' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '0.85rem' }}>Actual/Forecast</span>
            {canEdit && <Move size={14} style={{ color: '#3b82f6' }} />}
          </div>
          {canEdit && (
            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <GripHorizontal size={14} />
              Drag blue bars to adjust dates
            </div>
          )}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex' }}>
          {/* Milestone Labels Column */}
          <div style={{ 
            minWidth: '200px', 
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            flexShrink: 0
          }}>
            <div style={{ 
              padding: '0.75rem', 
              fontWeight: '600', 
              borderBottom: '1px solid #e2e8f0',
              height: '40px',
              display: 'flex',
              alignItems: 'center'
            }}>
              Milestone
            </div>
            {milestones.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  padding: '0.5rem 0.75rem', 
                  borderBottom: '1px solid #f1f5f9',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Link 
                  to={`/milestones/${m.id}`}
                  style={{ 
                    fontWeight: '600', 
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  {m.milestone_ref}
                </Link>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {m.name?.substring(0, 25)}{m.name?.length > 25 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div 
            ref={chartRef}
            style={{ 
              flex: 1, 
              overflowX: 'auto',
              overflowY: 'hidden'
            }}
          >
            <div style={{ minWidth: `${chartWidth}px`, position: 'relative' }}>
              {/* Timeline Header */}
              <div style={{ 
                height: '40px', 
                borderBottom: '1px solid #e2e8f0',
                position: 'relative',
                backgroundColor: '#f8fafc'
              }}>
                {timelineHeaders.map((h, idx) => (
                  <div 
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${h.x}px`,
                      top: 0,
                      height: '100%',
                      borderLeft: h.isMonthStart ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                      paddingLeft: '4px',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {h.date.toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short'
                    })}
                  </div>
                ))}
              </div>

              {/* Milestone Rows */}
              {milestones.map(m => {
                const baselineStart = m.baseline_start_date || m.start_date;
                const baselineEnd = m.baseline_end_date || m.end_date;
                const actualStart = m.actual_start_date || m.start_date;
                const forecastEnd = m.forecast_end_date || m.end_date;

                const baselineX = dateToX(baselineStart);
                const baselineWidth = Math.max(20, dateToX(baselineEnd) - baselineX);
                const actualX = dateToX(actualStart);
                const actualWidth = Math.max(20, dateToX(forecastEnd) - actualX);

                return (
                  <div 
                    key={m.id}
                    style={{ 
                      height: '80px',
                      borderBottom: '1px solid #f1f5f9',
                      position: 'relative'
                    }}
                  >
                    {/* Baseline Bar (fixed, grayed out) */}
                    {baselineStart && baselineEnd && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${baselineX}px`,
                          top: '12px',
                          width: `${baselineWidth}px`,
                          height: '20px',
                          backgroundColor: '#94a3b8',
                          opacity: 0.5,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          color: 'white',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                        title={`Baseline: ${formatDate(baselineStart)} - ${formatDate(baselineEnd)}`}
                      >
                        <Lock size={10} style={{ marginRight: '2px' }} />
                        Baseline
                      </div>
                    )}

                    {/* Actual/Forecast Bar (draggable) */}
                    {actualStart && forecastEnd && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${actualX}px`,
                          top: '40px',
                          width: `${actualWidth}px`,
                          height: '24px',
                          backgroundColor: dragging?.milestoneId === m.id ? '#2563eb' : '#3b82f6',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: canEdit ? 'move' : 'default',
                          boxShadow: dragging?.milestoneId === m.id ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                          transition: dragging ? 'none' : 'box-shadow 0.2s'
                        }}
                        title={`Actual/Forecast: ${formatDate(actualStart)} - ${formatDate(forecastEnd)}`}
                        onMouseDown={(e) => handleMouseDown(e, m, 'move')}
                      >
                        {/* Left resize handle */}
                        {canEdit && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: '8px',
                              height: '100%',
                              cursor: 'ew-resize',
                              backgroundColor: 'rgba(255,255,255,0.3)',
                              borderRadius: '4px 0 0 4px'
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, m, 'start'); }}
                          />
                        )}
                        
                        {/* Bar content */}
                        <div style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          fontSize: '0.75rem', 
                          color: 'white',
                          fontWeight: '500',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          padding: '0 10px'
                        }}>
                          {actualWidth > 100 ? `${formatDate(actualStart)} - ${formatDate(forecastEnd)}` : ''}
                        </div>

                        {/* Right resize handle */}
                        {canEdit && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              width: '8px',
                              height: '100%',
                              cursor: 'ew-resize',
                              backgroundColor: 'rgba(255,255,255,0.3)',
                              borderRadius: '0 4px 4px 0'
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, m, 'end'); }}
                          />
                        )}
                      </div>
                    )}

                    {/* Today line */}
                    {(() => {
                      const todayX = dateToX(new Date());
                      if (todayX > 0 && todayX < chartWidth) {
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${todayX}px`,
                              top: 0,
                              bottom: 0,
                              width: '2px',
                              backgroundColor: '#ef4444',
                              opacity: 0.6,
                              zIndex: 5
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Date Summary Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Milestone Date Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Baseline Start</th>
              <th>Baseline End</th>
              <th>Actual Start</th>
              <th>Forecast End</th>
              <th>Variance (days)</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(m => {
              const baselineEnd = m.baseline_end_date || m.end_date;
              const forecastEnd = m.forecast_end_date || m.end_date;
              let variance = 0;
              if (baselineEnd && forecastEnd) {
                variance = Math.round((new Date(forecastEnd) - new Date(baselineEnd)) / (1000 * 60 * 60 * 24));
              }

              return (
                <tr key={m.id}>
                  <td>
                    <Link to={`/milestones/${m.id}`} style={{ fontFamily: 'monospace', fontWeight: '600', color: '#3b82f6' }}>
                      {m.milestone_ref}
                    </Link>
                  </td>
                  <td>{m.name}</td>
                  <td>{formatDate(m.baseline_start_date || m.start_date)}</td>
                  <td>{formatDate(m.baseline_end_date || m.end_date)}</td>
                  <td>{formatDate(m.actual_start_date || m.start_date)}</td>
                  <td>{formatDate(m.forecast_end_date || m.end_date)}</td>
                  <td style={{ 
                    fontWeight: '600',
                    color: variance > 0 ? '#dc2626' : variance < 0 ? '#16a34a' : '#64748b'
                  }}>
                    {variance > 0 ? `+${variance}` : variance} days
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#3b82f6', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Using the Gantt Chart</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af', fontSize: '0.9rem' }}>
              <li><strong>Baseline bars (grey):</strong> Fixed dates representing the original plan - cannot be moved</li>
              <li><strong>Actual/Forecast bars (blue):</strong> Current schedule - drag to adjust dates</li>
              <li><strong>Drag the whole bar:</strong> Move both start and end dates together</li>
              <li><strong>Drag the edges:</strong> Adjust start or end date independently</li>
              <li><strong>Red line:</strong> Today's date</li>
              <li><strong>Variance:</strong> Positive = behind schedule, Negative = ahead of schedule</li>
              <li>Changes are saved automatically when you release the mouse</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
