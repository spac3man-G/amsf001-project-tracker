/**
 * WorkshopsHub
 * 
 * Main page for workshop management in the Evaluator tool.
 * Shows list of workshops with filtering, scheduling, attendee management,
 * and links to captured requirements.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.2)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  Plus, 
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  UserCheck,
  Mail,
  Play,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  ChevronRight,
  ClipboardList,
  Filter,
  Download,
  RefreshCw,
  Send
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PageHeader, 
  Card, 
  LoadingSpinner, 
  StatusBadge,
  ConfirmDialog,
  Toast
} from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import WorkshopCard from '../../components/evaluator/workshops/WorkshopCard';
import WorkshopForm from '../../components/evaluator/workshops/WorkshopForm';
import { 
  workshopsService, 
  WORKSHOP_STATUSES, 
  WORKSHOP_STATUS_CONFIG,
  stakeholderAreasService 
} from '../../services/evaluator';

import './WorkshopsHub.css';

export default function WorkshopsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEvaluation, evaluationId, isLoading: evaluationLoading } = useEvaluation();
  const { canFacilitateWorkshops, isAdmin, isEvaluator } = useEvaluatorPermissions();

  // State
  const [workshops, setWorkshops] = useState([]);
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: null
  });
  
  // Selection and modals
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Form modal state
  const [formModal, setFormModal] = useState({
    isOpen: false,
    workshop: null // null = create mode, object = edit mode
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!evaluationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [ws, areas] = await Promise.all([
        workshopsService.getAllWithDetails(evaluationId),
        stakeholderAreasService.getAll(evaluationId)
      ]);

      setWorkshops(ws);
      setStakeholderAreas(areas);
    } catch (err) {
      console.error('Failed to load workshops data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter workshops client-side
  const filteredWorkshops = useMemo(() => {
    let result = [...workshops];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(ws =>
        ws.name.toLowerCase().includes(search) ||
        ws.description?.toLowerCase().includes(search) ||
        ws.facilitator?.full_name?.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      result = result.filter(ws => ws.status === filters.status);
    }

    return result;
  }, [workshops, filters]);

  // Summary stats
  const summary = useMemo(() => {
    const byStatus = {
      draft: 0,
      scheduled: 0,
      in_progress: 0,
      complete: 0,
      cancelled: 0
    };

    let totalAttendees = 0;
    let totalAttended = 0;

    workshops.forEach(ws => {
      if (byStatus[ws.status] !== undefined) {
        byStatus[ws.status]++;
      }
      totalAttendees += ws.attendeeCount || 0;
      totalAttended += ws.attendedCount || 0;
    });

    return {
      total: workshops.length,
      byStatus,
      totalAttendees,
      totalAttended,
      attendanceRate: totalAttendees > 0 
        ? Math.round((totalAttended / totalAttendees) * 100) 
        : 0
    };
  }, [workshops]);

  // Group workshops by status for display
  const workshopsByStatus = useMemo(() => {
    const groups = {
      upcoming: filteredWorkshops.filter(ws => 
        ws.status === WORKSHOP_STATUSES.SCHEDULED || ws.status === WORKSHOP_STATUSES.DRAFT
      ).sort((a, b) => new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0)),
      inProgress: filteredWorkshops.filter(ws => ws.status === WORKSHOP_STATUSES.IN_PROGRESS),
      completed: filteredWorkshops.filter(ws => ws.status === WORKSHOP_STATUSES.COMPLETE)
        .sort((a, b) => new Date(b.actual_date || b.scheduled_date || 0) - new Date(a.actual_date || a.scheduled_date || 0)),
      cancelled: filteredWorkshops.filter(ws => ws.status === WORKSHOP_STATUSES.CANCELLED)
    };
    return groups;
  }, [filteredWorkshops]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: null });
  }, []);

  // Open create modal
  const handleOpenCreate = useCallback(() => {
    setFormModal({ isOpen: true, workshop: null });
  }, []);

  // Open edit modal
  const handleOpenEdit = useCallback((workshop) => {
    setFormModal({ isOpen: true, workshop });
  }, []);

  // Close form modal
  const handleCloseForm = useCallback(() => {
    setFormModal({ isOpen: false, workshop: null });
  }, []);

  // Handle form save
  const handleFormSave = useCallback((savedWorkshop) => {
    const isEdit = formModal.workshop !== null;
    setToastMessage({ 
      type: 'success', 
      message: isEdit 
        ? `Workshop "${savedWorkshop.name}" updated` 
        : `Workshop "${savedWorkshop.name}" created`
    });
    loadData();
  }, [formModal.workshop, loadData]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedWorkshop) return;

    try {
      await workshopsService.delete(selectedWorkshop.id, user?.id);
      setToastMessage({ type: 'success', message: `Workshop "${selectedWorkshop.name}" deleted` });
      setSelectedWorkshop(null);
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setDeleteConfirmOpen(false);
    }
  }, [selectedWorkshop, user?.id, loadData]);

  // Status workflow actions
  const handleStart = useCallback(async (workshop) => {
    try {
      await workshopsService.start(workshop.id);
      setToastMessage({ type: 'success', message: `Workshop "${workshop.name}" started` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [loadData]);

  const handleComplete = useCallback(async (workshop) => {
    try {
      await workshopsService.complete(workshop.id);
      setToastMessage({ type: 'success', message: `Workshop "${workshop.name}" completed` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [loadData]);

  const handleCancel = useCallback(async (workshop) => {
    const reason = window.prompt('Please provide a cancellation reason (optional):');
    try {
      await workshopsService.cancel(workshop.id, reason);
      setToastMessage({ type: 'success', message: `Workshop "${workshop.name}" cancelled` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [loadData]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const data = await workshopsService.exportForReport(evaluationId);
      if (!data || data.length === 0) {
        setToastMessage({ type: 'warning', message: 'No workshops to export' });
        return;
      }
      
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workshops-${evaluationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setToastMessage({ type: 'success', message: 'Workshops exported' });
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [evaluationId]);

  // Navigate to workshop detail (capture mode)
  const handleOpenWorkshop = useCallback((workshop) => {
    navigate(`/evaluator/workshops/${workshop.id}`);
  }, [navigate]);

  // Loading state
  if (evaluationLoading || isLoading) {
    return <LoadingSpinner message="Loading workshops..." fullPage />;
  }

  // No evaluation selected
  if (!currentEvaluation) {
    return (
      <div className="workshops-hub">
        <PageHeader
          title="Workshops"
          subtitle="Select an evaluation project to view workshops"
        />
        <div className="empty-state">
          <Users size={48} />
          <p>Please select an evaluation project to view its workshops.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workshops-hub">
      <PageHeader
        title="Workshops"
        subtitle={`${currentEvaluation.name} — ${summary.total} workshop${summary.total !== 1 ? 's' : ''}`}
        actions={
          <div className="header-actions">
            <EvaluationSwitcher />
            {canFacilitateWorkshops && (
              <button 
                className="btn btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                Schedule Workshop
              </button>
            )}
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="workshops-stats">
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-value">{summary.total}</span>
            <span className="stat-label">Total Workshops</span>
          </div>
          <div className="stat-card stat-scheduled">
            <span className="stat-value">{summary.byStatus.scheduled}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat-card stat-complete">
            <span className="stat-value">{summary.byStatus.complete}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.totalAttendees}</span>
            <span className="stat-label">Total Invited</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.attendanceRate}%</span>
            <span className="stat-label">Attendance Rate</span>
          </div>
        </div>

        <div className="stat-group">
          <span className="stat-label">By Status:</span>
          <div className="stat-badges">
            {Object.entries(WORKSHOP_STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                className={`stat-badge ${filters.status === status ? 'active' : ''}`}
                style={{ 
                  backgroundColor: filters.status === status ? config.color : config.bgColor,
                  color: filters.status === status ? '#fff' : config.color
                }}
                onClick={() => handleFilterChange({ status: filters.status === status ? null : status })}
              >
                {config.label}: {summary.byStatus[status] || 0}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="workshops-toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search workshops..."
              value={filters.search}
              onChange={e => handleFilterChange({ search: e.target.value })}
            />
          </div>
          {(filters.search || filters.status) && (
            <button className="btn btn-text" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Workshops Content */}
      {filteredWorkshops.length > 0 ? (
        <div className="workshops-content">
          {/* In Progress Section */}
          {workshopsByStatus.inProgress.length > 0 && (
            <section className="workshop-section in-progress">
              <h3 className="section-title">
                <Play size={18} />
                In Progress
                <span className="count">{workshopsByStatus.inProgress.length}</span>
              </h3>
              <div className="workshop-grid">
                {workshopsByStatus.inProgress.map(workshop => (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    onOpen={handleOpenWorkshop}
                    onEdit={canFacilitateWorkshops ? handleOpenEdit : null}
                    onComplete={canFacilitateWorkshops ? handleComplete : null}
                    onCancel={canFacilitateWorkshops ? handleCancel : null}
                    showActions={canFacilitateWorkshops}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Section */}
          {workshopsByStatus.upcoming.length > 0 && (
            <section className="workshop-section upcoming">
              <h3 className="section-title">
                <Calendar size={18} />
                Upcoming
                <span className="count">{workshopsByStatus.upcoming.length}</span>
              </h3>
              <div className="workshop-grid">
                {workshopsByStatus.upcoming.map(workshop => (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    onOpen={handleOpenWorkshop}
                    onEdit={canFacilitateWorkshops ? handleOpenEdit : null}
                    onStart={canFacilitateWorkshops && workshop.status === WORKSHOP_STATUSES.SCHEDULED 
                      ? handleStart : null}
                    onCancel={canFacilitateWorkshops ? handleCancel : null}
                    onDelete={canFacilitateWorkshops ? () => {
                      setSelectedWorkshop(workshop);
                      setDeleteConfirmOpen(true);
                    } : null}
                    showActions={canFacilitateWorkshops}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {workshopsByStatus.completed.length > 0 && (
            <section className="workshop-section completed">
              <h3 className="section-title">
                <CheckCircle size={18} />
                Completed
                <span className="count">{workshopsByStatus.completed.length}</span>
              </h3>
              <div className="workshop-grid">
                {workshopsByStatus.completed.map(workshop => (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    onOpen={handleOpenWorkshop}
                    showActions={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Cancelled Section */}
          {workshopsByStatus.cancelled.length > 0 && (
            <section className="workshop-section cancelled">
              <h3 className="section-title">
                <XCircle size={18} />
                Cancelled
                <span className="count">{workshopsByStatus.cancelled.length}</span>
              </h3>
              <div className="workshop-grid collapsed">
                {workshopsByStatus.cancelled.map(workshop => (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    onOpen={handleOpenWorkshop}
                    showActions={false}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Workshops Found</h3>
          <p>
            {workshops.length === 0
              ? "This evaluation doesn't have any workshops yet. Workshops are used to gather requirements from stakeholders."
              : "No workshops match your current filters."}
          </p>
          {canFacilitateWorkshops && workshops.length === 0 && (
            <button 
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              Schedule First Workshop
            </button>
          )}
        </div>
      )}

      {/* Workshop Form Modal (Create/Edit) */}
      {formModal.isOpen && (
        <WorkshopForm
          isOpen={formModal.isOpen}
          onClose={handleCloseForm}
          onSave={handleFormSave}
          workshop={formModal.workshop}
          stakeholderAreas={stakeholderAreas}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Workshop"
        message={`Are you sure you want to delete "${selectedWorkshop?.name}"? This will also remove all attendee records.`}
        confirmText="Delete"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedWorkshop(null);
        }}
      />

      {/* Toast Messages */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
