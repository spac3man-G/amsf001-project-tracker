/**
 * Project Calendar Page
 * 
 * Comprehensive calendar combining:
 * - Team Availability (OOO, Remote, On-Site with half/full day)
 * - Milestones (by forecast date)
 * - Deliverables (by due date)
 * 
 * Views:
 * - All Events (combined)
 * - Team Availability
 * - Milestones
 * - Deliverables  
 * - Milestones + Deliverables
 * 
 * Permissions:
 * - Viewer: View all, cannot edit
 * - Contributor: View all, edit own entries only
 * - Customer PM: View all, edit own entries only
 * - Supplier PM: View all, edit any entry
 * - Admin: View all, edit any entry
 * 
 * @version 2.1
 * @updated 8 December 2025
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ChevronLeft, ChevronRight, RefreshCw, X, Users, 
  Target, Package, CalendarDays, Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { 
  calendarService, 
  AVAILABILITY_STATUS, 
  AVAILABILITY_PERIOD,
  STATUS_CONFIG,
  PERIOD_CONFIG,
  CALENDAR_EVENT_TYPE
} from '../services/calendar.service';
import { LoadingSpinner } from '../components/common';
import './Calendar.css';

// ========================================
// PERMISSION HELPERS
// ========================================

/**
 * Check if user can edit availability for a specific resource
 * - Admin/Supplier PM: Can edit anyone's availability
 * - Customer PM/Contributor: Can only edit their own
 * - Viewer: Cannot edit
 */
function canEditAvailability(userRole, userId, resourceId) {
  // Viewers cannot edit
  if (userRole === 'viewer') return false;
  
  // Admin and Supplier PM can edit anyone
  if (userRole === 'admin' || userRole === 'supplier_pm') return true;
  
  // Customer PM and Contributor can only edit their own
  return userId === resourceId;
}

/**
 * Check if user can edit any availability (for UI hints)
 */
function canEditAnyAvailability(userRole) {
  return userRole !== 'viewer';
}

// ========================================
// VIEW TYPES
// ========================================

const VIEW_TYPE = {
  ALL_EVENTS: 'all',
  AVAILABILITY: 'availability',
  MILESTONES: 'milestones',
  DELIVERABLES: 'deliverables',
  MILESTONES_DELIVERABLES: 'milestones_deliverables'
};

const VIEW_CONFIG = {
  [VIEW_TYPE.ALL_EVENTS]: {
    label: 'All Events',
    icon: Layers,
    showAvailability: true,
    showMilestones: true,
    showDeliverables: true
  },
  [VIEW_TYPE.AVAILABILITY]: {
    label: 'Team Availability',
    icon: Users,
    showAvailability: true,
    showMilestones: false,
    showDeliverables: false
  },
  [VIEW_TYPE.MILESTONES]: {
    label: 'Milestones',
    icon: Target,
    showAvailability: false,
    showMilestones: true,
    showDeliverables: false
  },
  [VIEW_TYPE.DELIVERABLES]: {
    label: 'Deliverables',
    icon: Package,
    showAvailability: false,
    showMilestones: false,
    showDeliverables: true
  },
  [VIEW_TYPE.MILESTONES_DELIVERABLES]: {
    label: 'Milestones & Deliverables',
    icon: CalendarDays,
    showAvailability: false,
    showMilestones: true,
    showDeliverables: true
  }
};

// ========================================
// DATE UTILITIES
// ========================================

const dateUtils = {
  formatDate: (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  getWeekStart: (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  },
  
  getWeekEnd: (date) => {
    const start = dateUtils.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  },
  
  getMonthStart: (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },
  
  getMonthEnd: (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  },
  
  getWeekDates: (date) => {
    const start = dateUtils.getWeekStart(date);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  },
  
  getMonthWeeks: (date) => {
    const monthStart = dateUtils.getMonthStart(date);
    const monthEnd = dateUtils.getMonthEnd(date);
    const startDate = dateUtils.getWeekStart(monthStart);
    
    const weeks = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= monthEnd || weeks.length < 5) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      if (weeks.length >= 6) break;
    }
    
    return weeks;
  },
  
  getWeeksAhead: (weeks) => {
    const result = [];
    const today = new Date();
    let weekStart = dateUtils.getWeekStart(today);
    
    for (let i = 0; i < weeks; i++) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      result.push({
        start: new Date(weekStart),
        end: weekEnd,
        label: i === 0 ? 'This Week' : `Week ${i + 1}`
      });
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return result;
  },
  
  isToday: (date) => {
    const today = new Date();
    return dateUtils.formatDate(date) === dateUtils.formatDate(today);
  },
  
  isWeekend: (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  },
  
  isPast: (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  },
  
  formatDisplay: (date, format = 'short') => {
    const d = new Date(date);
    if (format === 'short') return d.toLocaleDateString('en-GB', { day: 'numeric' });
    if (format === 'day') return d.toLocaleDateString('en-GB', { weekday: 'short' });
    if (format === 'full') return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (format === 'medium') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (format === 'month') return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (format === 'week') {
      const end = dateUtils.getWeekEnd(date);
      const startStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    if (format === 'weekRange') {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
    return d.toLocaleDateString('en-GB');
  }
};

// ========================================
// SUB-COMPONENTS
// ========================================

function AvailabilityBadge({ status, period, size = 'normal' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  
  const statusClass = status === AVAILABILITY_STATUS.OUT_OF_OFFICE ? 'ooo' : 
    status === AVAILABILITY_STATUS.REMOTE ? 'remote' : 'onsite';
  
  const isHalfDay = period && period !== AVAILABILITY_PERIOD.FULL_DAY;
  
  if (size === 'mini') {
    return (
      <span 
        className={`cal-mini-badge ${statusClass}`}
        title={`${config.label}${isHalfDay ? ` (${PERIOD_CONFIG[period]?.shortLabel})` : ''}`}
      />
    );
  }
  
  return (
    <span className={`cal-status-badge ${statusClass} ${isHalfDay ? 'half-day' : ''}`}>
      {config.shortLabel}
      {isHalfDay && <span className="cal-period-indicator">({PERIOD_CONFIG[period]?.shortLabel})</span>}
    </span>
  );
}

function EventBadge({ type, item, isOverdue, size = 'normal', onClick, onMouseEnter, onMouseLeave }) {
  const typeClass = type === CALENDAR_EVENT_TYPE.MILESTONE ? 'milestone' : 'deliverable';
  const reference = type === CALENDAR_EVENT_TYPE.MILESTONE ? item.milestone_ref : item.deliverable_ref;
  const name = item.name;
  
  if (size === 'mini') {
    return (
      <span 
        className={`cal-mini-badge ${typeClass} clickable`} 
        title={`${reference}: ${name}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  
  return (
    <span 
      className={`cal-event-badge ${typeClass} ${isOverdue ? 'overdue' : ''} clickable`} 
      title={name}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="cal-event-ref">{reference}</span>
    </span>
  );
}

function EditAvailabilityModal({ isOpen, onClose, onSave, onClear, date, resource, currentEntry, isEditingOther }) {
  const [status, setStatus] = useState(currentEntry?.status || '');
  const [period, setPeriod] = useState(currentEntry?.period || AVAILABILITY_PERIOD.FULL_DAY);
  const [notes, setNotes] = useState(currentEntry?.notes || '');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    setStatus(currentEntry?.status || '');
    setPeriod(currentEntry?.period || AVAILABILITY_PERIOD.FULL_DAY);
    setNotes(currentEntry?.notes || '');
  }, [currentEntry, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    if (!status) return;
    setSaving(true);
    try {
      await onSave(status, period, notes);
      onClose();
    } finally {
      setSaving(false);
    }
  };
  
  const handleClear = async () => {
    setSaving(true);
    try {
      await onClear();
      onClose();
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h3>{isEditingOther ? 'Edit Availability' : 'Set Availability'}</h3>
          <button className="cal-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="cal-modal-body">
          <div className="cal-modal-info">
            <div className="cal-modal-info-row">
              <span className="cal-modal-info-label">Date</span>
              <span className="cal-modal-info-value">{dateUtils.formatDisplay(date, 'full')}</span>
            </div>
            <div className="cal-modal-info-row">
              <span className="cal-modal-info-label">Resource</span>
              <span className="cal-modal-info-value">
                {resource?.name}
                {isEditingOther && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8em' }}> (editing as manager)</span>}
              </span>
            </div>
          </div>
          
          <div className="cal-modal-section-title">Status</div>
          <div className="cal-status-options">
            {Object.entries(AVAILABILITY_STATUS).map(([key, value]) => {
              const config = STATUS_CONFIG[value];
              const dotClass = value === AVAILABILITY_STATUS.OUT_OF_OFFICE ? 'ooo' :
                value === AVAILABILITY_STATUS.REMOTE ? 'remote' : 'onsite';
              return (
                <div
                  key={value}
                  className={`cal-status-option ${status === value ? 'selected' : ''}`}
                  onClick={() => setStatus(value)}
                >
                  <span className={`cal-status-option-dot ${dotClass}`} />
                  <span className="cal-status-option-text">{config.label}</span>
                </div>
              );
            })}
          </div>
          
          <div className="cal-modal-section-title">Duration</div>
          <div className="cal-period-options">
            {Object.entries(AVAILABILITY_PERIOD).map(([key, value]) => (
              <div
                key={value}
                className={`cal-period-option ${period === value ? 'selected' : ''}`}
                onClick={() => setPeriod(value)}
              >
                {PERIOD_CONFIG[value].label}
              </div>
            ))}
          </div>
          
          <div className="cal-modal-section-title">Notes (optional)</div>
          <textarea
            className="cal-notes-input"
            placeholder="Add notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        
        <div className="cal-modal-footer">
          {currentEntry && (
            <button className="cal-btn cal-btn-danger" onClick={handleClear} disabled={saving}>Clear</button>
          )}
          <button className="cal-btn cal-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="cal-btn cal-btn-primary" onClick={handleSave} disabled={!status || saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function ProjectCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId, projectRole } = useProject();
  const { showSuccess, showError } = useToast();
  
  const [viewType, setViewType] = useState(VIEW_TYPE.ALL_EVENTS);
  const [periodView, setPeriodView] = useState('week');
  const [weeksAhead, setWeeksAhead] = useState(4);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterResource, setFilterResource] = useState('all');
  
  const [availability, setAvailability] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  const [editModal, setEditModal] = useState({ isOpen: false, date: null, resource: null, entry: null });
  
  const currentViewConfig = VIEW_CONFIG[viewType];
  
  // User's effective role for permissions
  const userRole = projectRole || 'viewer';
  const canEdit = canEditAnyAvailability(userRole);
  
  const dateRange = useMemo(() => {
    if (viewType === VIEW_TYPE.DELIVERABLES) {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + (weeksAhead * 7));
      return { start: dateUtils.formatDate(today), end: dateUtils.formatDate(end) };
    }
    
    if (periodView === 'week') {
      return {
        start: dateUtils.formatDate(dateUtils.getWeekStart(currentDate)),
        end: dateUtils.formatDate(dateUtils.getWeekEnd(currentDate))
      };
    } else {
      const monthStart = dateUtils.getMonthStart(currentDate);
      const monthEnd = dateUtils.getMonthEnd(currentDate);
      return {
        start: dateUtils.formatDate(dateUtils.getWeekStart(monthStart)),
        end: dateUtils.formatDate(dateUtils.getWeekEnd(monthEnd))
      };
    }
  }, [viewType, periodView, currentDate, weeksAhead]);
  
  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (!projectId) return;
    
    if (showRefreshIndicator) {
      setRefreshing(true);
    }
    
    try {
      const results = await calendarService.getAllEvents(projectId, dateRange.start, dateRange.end, {
        showAvailability: currentViewConfig.showAvailability,
        showMilestones: currentViewConfig.showMilestones,
        showDeliverables: currentViewConfig.showDeliverables,
        userId: filterResource !== 'all' ? filterResource : null
      });
      
      setAvailability(results.availability);
      setMilestones(results.milestones);
      setDeliverables(results.deliverables);
      setLastRefresh(new Date());
      
      // Always fetch members for availability views
      if (currentViewConfig.showAvailability) {
        const membersData = await calendarService.getProjectMembers(projectId);
        setMembers(membersData);
      }
      
      if (showRefreshIndicator) {
        showSuccess('Calendar refreshed');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      showError('Failed to load calendar data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, dateRange, currentViewConfig, filterResource, showError, showSuccess]);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleRefresh = () => fetchData(true);
  
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (periodView === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => setCurrentDate(new Date());
  
  const getAvailabilityEntry = (userId, date) => {
    const dateStr = dateUtils.formatDate(date);
    return availability.find(e => e.user_id === userId && e.date === dateStr);
  };
  
  const getMilestonesForDate = (date) => {
    const dateStr = dateUtils.formatDate(date);
    return milestones.filter(m => (m.forecast_end_date || m.end_date) === dateStr);
  };
  
  const getDeliverablesForDate = (date) => {
    const dateStr = dateUtils.formatDate(date);
    return deliverables.filter(d => d.due_date === dateStr);
  };
  
  // Handle cell click with proper permission checking
  const handleCellClick = (date, resource) => {
    // Check if user can edit this resource's availability
    if (!canEditAvailability(userRole, user?.id, resource.id)) {
      return; // No action if not permitted
    }
    
    const entry = getAvailabilityEntry(resource.id, date);
    setEditModal({ isOpen: true, date, resource, entry });
  };
  
  const handleSaveAvailability = async (status, period, notes) => {
    const targetUserId = editModal.resource?.id;
    
    try {
      await calendarService.setAvailability(projectId, targetUserId, dateUtils.formatDate(editModal.date), status, period, notes);
      
      const isEditingOther = targetUserId !== user?.id;
      showSuccess(isEditingOther 
        ? `Availability updated for ${editModal.resource?.name}`
        : 'Availability updated'
      );
      fetchData();
    } catch (error) {
      showError('Failed to save availability');
      throw error;
    }
  };
  
  const handleClearAvailability = async () => {
    const targetUserId = editModal.resource?.id;
    
    try {
      await calendarService.clearAvailability(projectId, targetUserId, dateUtils.formatDate(editModal.date));
      
      const isEditingOther = targetUserId !== user?.id;
      showSuccess(isEditingOther 
        ? `Availability cleared for ${editModal.resource?.name}`
        : 'Availability cleared'
      );
      fetchData();
    } catch (error) {
      showError('Failed to clear availability');
      throw error;
    }
  };
  
  const filteredMembers = useMemo(() => {
    if (filterResource === 'all') return members;
    return members.filter(m => m.id === filterResource);
  }, [members, filterResource]);
  
  const deliverablesByWeek = useMemo(() => {
    const weeks = dateUtils.getWeeksAhead(weeksAhead);
    return weeks.map(week => ({
      ...week,
      items: deliverables.filter(d => {
        const dueDate = new Date(d.due_date);
        return dueDate >= week.start && dueDate <= week.end;
      })
    }));
  }, [deliverables, weeksAhead]);
  
  const milestonesByWeek = useMemo(() => {
    const weeks = dateUtils.getWeeksAhead(weeksAhead);
    return weeks.map(week => ({
      ...week,
      items: milestones.filter(m => {
        const dueDate = new Date(m.forecast_end_date || m.end_date);
        return dueDate >= week.start && dueDate <= week.end;
      })
    }));
  }, [milestones, weeksAhead]);
  
  // Check if editing another user's availability
  const isEditingOther = editModal.resource?.id !== user?.id;
  
  if (loading) return <LoadingSpinner message="Loading calendar..." size="large" fullPage />;
  
  const showCalendarGrid = viewType !== VIEW_TYPE.DELIVERABLES;
  const showDeliverablesList = viewType === VIEW_TYPE.DELIVERABLES;
  
  // Helper text for legend based on role
  const getLegendHint = () => {
    if (userRole === 'viewer') {
      return 'View only - contact a manager to update availability';
    }
    if (userRole === 'admin' || userRole === 'supplier_pm') {
      return 'Click any row to edit availability';
    }
    return 'Click your row to set availability';
  };
  
  return (
    <div className="calendar-page">
      <header className="cal-header">
        <div className="cal-header-content">
          <div className="cal-header-left">
            <div className="cal-header-icon"><Calendar size={24} /></div>
            <div>
              <h1>Project Calendar</h1>
              <p>Team availability, milestones, and deliverables</p>
            </div>
          </div>
          <div className="cal-header-actions">
            <button className="cal-btn cal-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastRefresh && (
              <span className="cal-last-refresh">
                Updated {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </header>
      
      <div className="cal-controls">
        <div className="cal-controls-inner">
          <div className="cal-controls-left">
            <div className="cal-view-tabs">
              {Object.entries(VIEW_TYPE).map(([key, value]) => {
                const config = VIEW_CONFIG[value];
                const Icon = config.icon;
                return (
                  <button key={value} className={`cal-view-tab ${viewType === value ? 'active' : ''}`} onClick={() => setViewType(value)}>
                    <Icon size={16} className="cal-view-tab-icon" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="cal-controls-center">
            {showDeliverablesList ? (
              <div className="cal-range-select">
                {[1, 2, 3, 4].map(weeks => (
                  <button key={weeks} className={`cal-range-btn ${weeksAhead === weeks ? 'active' : ''}`} onClick={() => setWeeksAhead(weeks)}>
                    {weeks}W
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="cal-nav">
                  <button className="cal-nav-btn" onClick={() => navigateDate(-1)}><ChevronLeft size={20} /></button>
                  <span className="cal-period">
                    {periodView === 'week' ? dateUtils.formatDisplay(currentDate, 'week') : dateUtils.formatDisplay(currentDate, 'month')}
                  </span>
                  <button className="cal-nav-btn" onClick={() => navigateDate(1)}><ChevronRight size={20} /></button>
                </div>
                <button className="cal-today-btn" onClick={goToToday}>Today</button>
              </>
            )}
          </div>
          
          <div className="cal-controls-right">
            {showCalendarGrid && (
              <div className="cal-period-toggle">
                <button className={`cal-period-btn ${periodView === 'week' ? 'active' : ''}`} onClick={() => setPeriodView('week')}>Week</button>
                <button className={`cal-period-btn ${periodView === 'month' ? 'active' : ''}`} onClick={() => setPeriodView('month')}>Month</button>
              </div>
            )}
            
            {currentViewConfig.showAvailability && (
              <select className="cal-filter-select" value={filterResource} onChange={e => setFilterResource(e.target.value)}>
                <option value="all">All Resources ({members.length})</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>
      
      <div className="cal-content">
        <div className="cal-legend">
          {currentViewConfig.showAvailability && (
            <>
              <div className="cal-legend-item"><span className="cal-legend-dot ooo" /><span>Out of Office</span></div>
              <div className="cal-legend-item"><span className="cal-legend-dot remote" /><span>Remote</span></div>
              <div className="cal-legend-item"><span className="cal-legend-dot onsite" /><span>On Site</span></div>
            </>
          )}
          {currentViewConfig.showMilestones && <div className="cal-legend-item"><span className="cal-legend-dot milestone" /><span>Milestone</span></div>}
          {currentViewConfig.showDeliverables && <div className="cal-legend-item"><span className="cal-legend-dot deliverable" /><span>Deliverable</span></div>}
          {currentViewConfig.showAvailability && (
            <div className="cal-legend-hint">
              <Users size={16} />
              <span>{getLegendHint()}</span>
            </div>
          )}
        </div>
        
        {showCalendarGrid ? (
          <div className="cal-calendar-card">
            {periodView === 'week' ? (
              <WeekView
                currentDate={currentDate}
                members={currentViewConfig.showAvailability ? filteredMembers : []}
                currentUserId={user?.id}
                userRole={userRole}
                showAvailability={currentViewConfig.showAvailability}
                showMilestones={currentViewConfig.showMilestones}
                showDeliverables={currentViewConfig.showDeliverables}
                onCellClick={handleCellClick}
                onMilestoneClick={(m) => navigate(`/milestones/${m.id}`)}
                onDeliverableClick={(d) => navigate(`/milestones/${d.milestone_id}`)}
                getAvailabilityEntry={getAvailabilityEntry}
                getMilestonesForDate={getMilestonesForDate}
                getDeliverablesForDate={getDeliverablesForDate}
              />
            ) : (
              <MonthView
                currentDate={currentDate}
                members={currentViewConfig.showAvailability ? filteredMembers : []}
                currentUserId={user?.id}
                userRole={userRole}
                showAvailability={currentViewConfig.showAvailability}
                showMilestones={currentViewConfig.showMilestones}
                showDeliverables={currentViewConfig.showDeliverables}
                onCellClick={handleCellClick}
                onMilestoneClick={(m) => navigate(`/milestones/${m.id}`)}
                onDeliverableClick={(d) => navigate(`/milestones/${d.milestone_id}`)}
                onDateClick={(date) => {
                  setCurrentDate(date);
                  setPeriodView('week');
                }}
                getAvailabilityEntry={getAvailabilityEntry}
                getMilestonesForDate={getMilestonesForDate}
                getDeliverablesForDate={getDeliverablesForDate}
              />
            )}
          </div>
        ) : (
          <DeliverablesListView
            deliverablesByWeek={deliverablesByWeek}
            milestonesByWeek={currentViewConfig.showMilestones ? milestonesByWeek : []}
            onDeliverableClick={() => navigate('/deliverables')}
            onMilestoneClick={(m) => navigate(`/milestones/${m.id}`)}
          />
        )}
      </div>
      
      <EditAvailabilityModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, date: null, resource: null, entry: null })}
        onSave={handleSaveAvailability}
        onClear={handleClearAvailability}
        date={editModal.date}
        resource={editModal.resource}
        currentEntry={editModal.entry}
        isEditingOther={isEditingOther}
      />
    </div>
  );
}

// ========================================
// WEEK VIEW COMPONENT
// ========================================

function WeekView({ currentDate, members, currentUserId, userRole, showAvailability, showMilestones, showDeliverables, onCellClick, onMilestoneClick, onDeliverableClick, getAvailabilityEntry, getMilestonesForDate, getDeliverablesForDate }) {
  const weekDates = dateUtils.getWeekDates(currentDate);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  if (!showAvailability || members.length === 0) {
    return (
      <div className="cal-week-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        <div className="cal-week-header">
          {weekDates.map((date, idx) => (
            <div key={idx} className={`cal-week-header-cell ${dateUtils.isToday(date) ? 'today' : ''}`}>
              {dayNames[idx]}
              <span className="cal-week-header-date">{dateUtils.formatDisplay(date, 'short')}</span>
            </div>
          ))}
        </div>
        <div className="cal-week-row">
          {weekDates.map((date, idx) => {
            const dayMilestones = getMilestonesForDate(date);
            const dayDeliverables = getDeliverablesForDate(date);
            return (
              <div key={idx} className={`cal-day-cell not-editable ${dateUtils.isWeekend(date) ? 'weekend' : ''} ${dateUtils.isToday(date) ? 'today' : ''}`} style={{ minHeight: '120px' }}>
                {showMilestones && dayMilestones.map(m => (
                  <EventBadge 
                    key={m.id} 
                    type={CALENDAR_EVENT_TYPE.MILESTONE} 
                    item={m}
                    isOverdue={dateUtils.isPast(m.forecast_end_date || m.end_date)} 
                    onClick={(e) => { e.stopPropagation(); onMilestoneClick && onMilestoneClick(m); }}
                  />
                ))}
                {showDeliverables && dayDeliverables.map(d => (
                  <EventBadge 
                    key={d.id} 
                    type={CALENDAR_EVENT_TYPE.DELIVERABLE} 
                    item={d}
                    isOverdue={dateUtils.isPast(d.due_date) && d.status !== 'Delivered'} 
                    onClick={(e) => { e.stopPropagation(); onDeliverableClick && onDeliverableClick(d); }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="cal-week-grid">
      <div className="cal-week-header">
        <div className="cal-week-header-cell">Resource</div>
        {weekDates.map((date, idx) => (
          <div key={idx} className={`cal-week-header-cell ${dateUtils.isToday(date) ? 'today' : ''}`}>
            {dayNames[idx]}
            <span className="cal-week-header-date">{dateUtils.formatDisplay(date, 'short')}</span>
          </div>
        ))}
      </div>
      
      {members.map(member => {
        const canEditThis = canEditAvailability(userRole, currentUserId, member.id);
        
        return (
          <div key={member.id} className="cal-week-row">
            <div className="cal-resource-cell">
              <div className="cal-resource-name">{member.name}</div>
              <div className="cal-resource-role">{member.role}</div>
            </div>
            {weekDates.map((date, idx) => {
              const entry = getAvailabilityEntry(member.id, date);
              return (
                <div
                  key={idx}
                  className={`cal-day-cell ${dateUtils.isWeekend(date) ? 'weekend' : ''} ${dateUtils.isToday(date) ? 'today' : ''} ${!canEditThis ? 'not-editable' : ''}`}
                  onClick={() => canEditThis && onCellClick(date, member)}
                  style={{ cursor: canEditThis ? 'pointer' : 'default' }}
                  title={canEditThis ? 'Click to edit availability' : `${member.name}'s availability`}
                >
                  {entry && <AvailabilityBadge status={entry.status} period={entry.period} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ========================================
// MONTH VIEW COMPONENT
// ========================================

function MonthView({ currentDate, members, currentUserId, userRole, showAvailability, showMilestones, showDeliverables, onCellClick, onMilestoneClick, onDeliverableClick, onDateClick, getAvailabilityEntry, getMilestonesForDate, getDeliverablesForDate }) {
  const weeks = dateUtils.getMonthWeeks(currentDate);
  const currentMonth = currentDate.getMonth();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Month view without availability - just milestones/deliverables
  // Clicking on a day with items drills down to week view
  if (!showAvailability || members.length === 0) {
    return (
      <div className="cal-month-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        <div className="cal-month-header">
          {dayNames.map((day, idx) => <div key={idx} className="cal-month-header-cell">{day}</div>)}
        </div>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="cal-month-row">
            {week.map((date, dayIdx) => {
              const isOutsideMonth = date.getMonth() !== currentMonth;
              const dayMilestones = getMilestonesForDate(date);
              const dayDeliverables = getDeliverablesForDate(date);
              const hasItems = dayMilestones.length > 0 || dayDeliverables.length > 0;
              
              return (
                <div 
                  key={dayIdx} 
                  className={`cal-month-cell ${hasItems ? 'has-items' : ''} ${dateUtils.isWeekend(date) ? 'weekend' : ''} ${dateUtils.isToday(date) ? 'today' : ''} ${isOutsideMonth ? 'outside-month' : ''}`} 
                  style={{ minHeight: '80px', cursor: hasItems && !isOutsideMonth ? 'pointer' : 'default' }}
                  onClick={() => hasItems && !isOutsideMonth && onDateClick && onDateClick(date)}
                  title={hasItems ? 'Click to see week view' : ''}
                >
                  <span className="cal-month-date">{dateUtils.formatDisplay(date, 'short')}</span>
                  {showMilestones && dayMilestones.map(m => (
                    <EventBadge 
                      key={m.id} 
                      type={CALENDAR_EVENT_TYPE.MILESTONE} 
                      item={m}
                      size="mini" 
                      onClick={(e) => { e.stopPropagation(); onMilestoneClick && onMilestoneClick(m); }}
                    />
                  ))}
                  {showDeliverables && dayDeliverables.map(d => (
                    <EventBadge 
                      key={d.id} 
                      type={CALENDAR_EVENT_TYPE.DELIVERABLE} 
                      item={d}
                      size="mini" 
                      onClick={(e) => { e.stopPropagation(); onDeliverableClick && onDeliverableClick(d); }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
  
  // Month view with availability rows
  return (
    <div className="cal-month-grid">
      <div className="cal-month-header">
        <div className="cal-month-header-cell">Resource</div>
        {dayNames.map((day, idx) => <div key={idx} className="cal-month-header-cell">{day}</div>)}
      </div>
      {members.map(member => {
        const canEditThis = canEditAvailability(userRole, currentUserId, member.id);
        
        return weeks.map((week, weekIdx) => (
          <div key={`${member.id}-${weekIdx}`} className="cal-month-row">
            <div className="cal-resource-cell">
              {weekIdx === 0 && (
                <>
                  <div className="cal-resource-name">{member.name}</div>
                  <div className="cal-resource-role">{member.role}</div>
                </>
              )}
            </div>
            {week.map((date, dayIdx) => {
              const entry = getAvailabilityEntry(member.id, date);
              const isOutsideMonth = date.getMonth() !== currentMonth;
              return (
                <div
                  key={dayIdx}
                  className={`cal-month-cell ${dateUtils.isWeekend(date) ? 'weekend' : ''} ${dateUtils.isToday(date) ? 'today' : ''} ${isOutsideMonth ? 'outside-month' : ''} ${!canEditThis ? 'not-editable' : ''}`}
                  onClick={() => !isOutsideMonth && canEditThis && onCellClick(date, member)}
                  style={{ cursor: canEditThis && !isOutsideMonth ? 'pointer' : 'default' }}
                >
                  {(weekIdx === 0 || dayIdx === 0) && <span className="cal-month-date">{dateUtils.formatDisplay(date, 'short')}</span>}
                  {entry && <AvailabilityBadge status={entry.status} period={entry.period} size="mini" />}
                </div>
              );
            })}
          </div>
        ));
      })}
    </div>
  );
}

// ========================================
// DELIVERABLES LIST VIEW
// ========================================

function DeliverablesListView({ deliverablesByWeek, milestonesByWeek, onDeliverableClick, onMilestoneClick }) {
  const getStatusClass = (status) => {
    const statusMap = { 'Not Started': 'not-started', 'Draft': 'not-started', 'In Progress': 'in-progress', 'Submitted': 'submitted', 'Review Complete': 'submitted', 'Delivered': 'delivered', 'Completed': 'delivered' };
    return statusMap[status] || 'not-started';
  };
  
  const combinedWeeks = deliverablesByWeek.map((week, idx) => ({
    ...week,
    milestones: milestonesByWeek[idx]?.items || [],
    deliverables: week.items || []
  }));
  
  const hasAnyItems = combinedWeeks.some(w => w.milestones.length > 0 || w.deliverables.length > 0);
  
  if (!hasAnyItems) {
    return (
      <div className="cal-deliverables-list">
        <div className="cal-empty">
          <Package size={48} className="cal-empty-icon" />
          <p>No milestones or deliverables due in this period</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cal-deliverables-list">
      {combinedWeeks.map((week, idx) => {
        const totalCount = week.milestones.length + week.deliverables.length;
        return (
          <div key={idx} className="cal-deliverables-week">
            <div className="cal-week-label">
              <span>{week.label}</span>
              <span style={{ fontWeight: 400, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{dateUtils.formatDisplay(week.start, 'weekRange')}</span>
              {totalCount > 0 && <span className="cal-week-count">{totalCount}</span>}
            </div>
            {totalCount === 0 ? (
              <div className="cal-empty-week">No items due this week</div>
            ) : (
              <>
                {week.milestones.map(m => (
                  <div key={m.id} className="cal-milestone-item" onClick={() => onMilestoneClick(m)}>
                    <div className={`cal-deliverable-date ${dateUtils.isPast(m.forecast_end_date || m.end_date) && m.status !== 'Completed' ? 'overdue' : ''}`}>
                      {dateUtils.formatDisplay(m.forecast_end_date || m.end_date, 'medium')}
                    </div>
                    <div className="cal-deliverable-info">
                      <span className="cal-milestone-ref">{m.milestone_ref}</span>
                      <span className="cal-milestone-name">{m.name}</span>
                    </div>
                    <div className="cal-milestone-progress">
                      <div className="cal-progress-bar"><div className="cal-progress-fill" style={{ width: `${m.completion_percentage || 0}%` }} /></div>
                      <span className="cal-progress-text">{m.completion_percentage || 0}%</span>
                    </div>
                    <div className={`cal-deliverable-status ${getStatusClass(m.status)}`}>{m.status}</div>
                  </div>
                ))}
                {week.deliverables.map(d => (
                  <div key={d.id} className="cal-deliverable-item" onClick={() => onDeliverableClick(d)}>
                    <div className={`cal-deliverable-date ${dateUtils.isPast(d.due_date) && d.status !== 'Delivered' ? 'overdue' : ''}`}>
                      {dateUtils.formatDisplay(d.due_date, 'medium')}
                    </div>
                    <div className="cal-deliverable-info">
                      <span className="cal-deliverable-ref">{d.deliverable_ref}</span>
                      <span className="cal-deliverable-name">{d.name}</span>
                    </div>
                    <div className="cal-deliverable-milestone"><Target size={12} />{d.milestones?.milestone_ref || '—'}</div>
                    <div className={`cal-deliverable-status ${getStatusClass(d.status)}`}>{d.status}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
