/**
 * RequirementsHub
 * 
 * Main page for requirements management in the Evaluator tool.
 * Shows list of requirements with filtering, CRUD operations, and views.
 * Includes AI-powered gap analysis for identifying missing requirements.
 * 
 * @version 1.2
 * @created 01 January 2026
 * @updated 04 January 2026 - Added Gap Analysis (Phase 8A)
 * @phase Phase 3 - Requirements Module (Tasks 3A.4, 3B.1-3B.4), Phase 8A - AI Features
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Filter, 
  Download,
  Grid3X3,
  List,
  Search,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RotateCcw,
  Sparkles
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PageHeader, 
  Card, 
  LoadingSpinner, 
  StatusBadge,
  DataTable,
  ConfirmDialog,
  Toast
} from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import { RequirementFilters, RequirementForm, RequirementMatrix } from '../../components/evaluator/requirements';
import { GapAnalysisResults } from '../../components/evaluator/ai';
import { requirementsService, stakeholderAreasService, evaluationCategoriesService, aiService } from '../../services/evaluator';

import './RequirementsHub.css';

// Priority configuration
const PRIORITY_CONFIG = {
  must_have: { label: 'Must Have', color: 'danger', icon: AlertCircle },
  should_have: { label: 'Should Have', color: 'warning', icon: Clock },
  could_have: { label: 'Could Have', color: 'info', icon: ChevronDown },
  wont_have: { label: "Won't Have", color: 'neutral', icon: XCircle }
};

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'neutral', icon: Edit2 },
  under_review: { label: 'Under Review', color: 'warning', icon: Clock },
  approved: { label: 'Approved', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle }
};

export default function RequirementsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEvaluation, evaluationId, isLoading: evaluationLoading } = useEvaluation();
  const { canManageRequirements, canApproveRequirements } = useEvaluatorPermissions();

  // State
  const [requirements, setRequirements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    categoryId: null,
    stakeholderAreaId: null,
    priority: null,
    status: null
  });
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Modal state for create/edit
  const [formModal, setFormModal] = useState({
    isOpen: false,
    requirement: null // null = create mode, object = edit mode
  });
  
  // Status action state
  const [statusActionModal, setStatusActionModal] = useState({
    isOpen: false,
    requirement: null,
    action: null // 'submit', 'approve', 'reject', 'returnToDraft'
  });

  // Gap Analysis state (Phase 8A)
  const [runningGapAnalysis, setRunningGapAnalysis] = useState(false);
  const [gapAnalysisResults, setGapAnalysisResults] = useState(null);
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);


  // Load data
  const loadData = useCallback(async () => {
    if (!evaluationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [reqs, cats, areas] = await Promise.all([
        requirementsService.getAllWithDetails(evaluationId, filters),
        evaluationCategoriesService.getAllWithCounts(evaluationId),
        stakeholderAreasService.getAllWithCounts(evaluationId)
      ]);

      setRequirements(reqs);
      setCategories(cats);
      setStakeholderAreas(areas);
    } catch (err) {
      console.error('Failed to load requirements data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter requirements client-side for responsiveness
  const filteredRequirements = useMemo(() => {
    let result = [...requirements];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(req =>
        req.title.toLowerCase().includes(search) ||
        req.description?.toLowerCase().includes(search) ||
        req.reference_code.toLowerCase().includes(search)
      );
    }

    if (filters.categoryId) {
      result = result.filter(req => req.category_id === filters.categoryId);
    }

    if (filters.stakeholderAreaId) {
      result = result.filter(req => req.stakeholder_area_id === filters.stakeholderAreaId);
    }

    if (filters.priority) {
      result = result.filter(req => req.priority === filters.priority);
    }

    if (filters.status) {
      result = result.filter(req => req.status === filters.status);
    }

    return result;
  }, [requirements, filters]);

  // Summary stats
  const summary = useMemo(() => {
    const total = requirements.length;
    const byStatus = {
      draft: requirements.filter(r => r.status === 'draft').length,
      under_review: requirements.filter(r => r.status === 'under_review').length,
      approved: requirements.filter(r => r.status === 'approved').length,
      rejected: requirements.filter(r => r.status === 'rejected').length
    };
    const byPriority = {
      must_have: requirements.filter(r => r.priority === 'must_have').length,
      should_have: requirements.filter(r => r.priority === 'should_have').length,
      could_have: requirements.filter(r => r.priority === 'could_have').length,
      wont_have: requirements.filter(r => r.priority === 'wont_have').length
    };
    return { total, byStatus, byPriority };
  }, [requirements]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      categoryId: null,
      stakeholderAreaId: null,
      priority: null,
      status: null
    });
  }, []);

  // Handle selection
  const handleSelectAll = useCallback((checked) => {
    setSelectedIds(checked ? filteredRequirements.map(r => r.id) : []);
  }, [filteredRequirements]);

  const handleSelectOne = useCallback((id, checked) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  }, []);

  // Open create modal
  const handleOpenCreate = useCallback(() => {
    setFormModal({ isOpen: true, requirement: null });
  }, []);

  // Open edit modal
  const handleOpenEdit = useCallback((requirement) => {
    setFormModal({ isOpen: true, requirement });
  }, []);

  // Close form modal
  const handleCloseForm = useCallback(() => {
    setFormModal({ isOpen: false, requirement: null });
  }, []);

  // Handle form save (create or edit)
  const handleFormSave = useCallback((savedRequirement) => {
    const isEdit = formModal.requirement !== null;
    setToastMessage({ 
      type: 'success', 
      message: isEdit 
        ? `Requirement ${savedRequirement.reference_code} updated` 
        : `Requirement ${savedRequirement.reference_code} created`
    });
    loadData();
  }, [formModal.requirement, loadData]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      await requirementsService.bulkDelete(selectedIds, user?.id);
      setToastMessage({ type: 'success', message: `${selectedIds.length} requirement(s) deleted` });
      setSelectedIds([]);
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setDeleteConfirmOpen(false);
    }
  }, [selectedIds, user?.id, loadData]);

  // Status workflow actions
  const handleSubmitForReview = useCallback(async (requirement) => {
    try {
      await requirementsService.submitForReview(requirement.id);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} submitted for review` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [loadData]);

  const handleApprove = useCallback(async (requirement, notes = null) => {
    try {
      await requirementsService.approve(requirement.id, user?.id, notes);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} approved` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [user?.id, loadData]);

  const handleReject = useCallback(async (requirement, notes) => {
    if (!notes) {
      setToastMessage({ type: 'error', message: 'Rejection reason is required' });
      return;
    }
    try {
      await requirementsService.reject(requirement.id, user?.id, notes);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} rejected` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [user?.id, loadData]);

  const handleReturnToDraft = useCallback(async (requirement) => {
    try {
      await requirementsService.returnToDraft(requirement.id);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} returned to draft` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [loadData]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const data = await requirementsService.exportForReport(evaluationId);
      if (!data || data.length === 0) {
        setToastMessage({ type: 'warning', message: 'No requirements to export' });
        return;
      }
      // Simple CSV export
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requirements-${evaluationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setToastMessage({ type: 'success', message: 'Requirements exported' });
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [evaluationId]);

  // Gap Analysis handlers (Phase 8A)
  const handleRunGapAnalysis = useCallback(async () => {
    if (!evaluationId || !user?.id) return;
    
    if (requirements.length === 0) {
      setToastMessage({ type: 'warning', message: 'Add some requirements before running gap analysis' });
      return;
    }
    
    setRunningGapAnalysis(true);
    try {
      const results = await aiService.runGapAnalysis(evaluationId, user.id);
      
      if (results.success) {
        setGapAnalysisResults(results);
        setShowGapAnalysis(true);
        setToastMessage({ 
          type: 'success', 
          message: `Gap analysis complete: ${results.suggested_requirements?.length || 0} suggestions` 
        });
      } else {
        throw new Error(results.error || 'Gap analysis failed');
      }
    } catch (err) {
      console.error('Gap analysis error:', err);
      setToastMessage({ type: 'error', message: err.message || 'Failed to run gap analysis' });
    } finally {
      setRunningGapAnalysis(false);
    }
  }, [evaluationId, user?.id, requirements.length]);

  const handleAddGapSuggestions = useCallback(async (suggestions) => {
    if (!evaluationId || !user?.id) return;
    
    try {
      const result = await aiService.addGapSuggestions(
        evaluationId,
        user.id,
        suggestions,
        categories
      );
      
      setToastMessage({ 
        type: 'success', 
        message: `Added ${result.imported} requirements from gap analysis` 
      });
      
      // Refresh requirements list
      loadData();
      
      return result;
    } catch (err) {
      console.error('Add suggestions error:', err);
      setToastMessage({ type: 'error', message: err.message || 'Failed to add requirements' });
      throw err;
    }
  }, [evaluationId, user?.id, categories, loadData]);

  // Get row action menu items based on requirement status
  const getRowActions = useCallback((row) => {
    const actions = [];
    
    // View is always available
    actions.push({
      icon: Eye,
      label: 'View Details',
      onClick: () => navigate(`/evaluator/requirements/${row.id}`)
    });
    
    // Edit (if user can manage and not approved)
    if (canManageRequirements && row.status !== 'approved') {
      actions.push({
        icon: Edit2,
        label: 'Edit',
        onClick: () => handleOpenEdit(row)
      });
    }
    
    // Status actions based on current status
    if (canManageRequirements) {
      if (row.status === 'draft') {
        actions.push({
          icon: Send,
          label: 'Submit for Review',
          onClick: () => handleSubmitForReview(row)
        });
      }
      
      if (row.status === 'rejected') {
        actions.push({
          icon: RotateCcw,
          label: 'Return to Draft',
          onClick: () => handleReturnToDraft(row)
        });
      }
    }
    
    if (canApproveRequirements && row.status === 'under_review') {
      actions.push({
        icon: CheckCircle,
        label: 'Approve',
        variant: 'success',
        onClick: () => handleApprove(row)
      });
      actions.push({
        icon: XCircle,
        label: 'Reject',
        variant: 'danger',
        onClick: () => {
          const notes = window.prompt('Please provide a rejection reason:');
          if (notes) handleReject(row, notes);
        }
      });
    }
    
    return actions;
  }, [canManageRequirements, canApproveRequirements, navigate, handleOpenEdit, handleSubmitForReview, handleReturnToDraft, handleApprove, handleReject]);


  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length === filteredRequirements.length && filteredRequirements.length > 0}
          onChange={e => handleSelectAll(e.target.checked)}
        />
      ),
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={e => handleSelectOne(row.id, e.target.checked)}
          onClick={e => e.stopPropagation()}
        />
      )
    },
    {
      key: 'reference_code',
      header: 'Ref',
      width: '80px',
      sortable: true,
      render: (row) => (
        <span className="requirement-ref">{row.reference_code}</span>
      )
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row) => (
        <div className="requirement-title-cell">
          <span className="title">{row.title}</span>
          {row.description && (
            <span className="description">{row.description.substring(0, 80)}{row.description.length > 80 ? '...' : ''}</span>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: '150px',
      render: (row) => row.category ? (
        <span 
          className="category-badge"
          style={{ backgroundColor: row.category.color || '#6B7280' }}
        >
          {row.category.name}
        </span>
      ) : <span className="text-muted">—</span>
    },
    {
      key: 'stakeholder_area',
      header: 'Stakeholder',
      width: '130px',
      render: (row) => row.stakeholder_area ? (
        <span 
          className="stakeholder-badge"
          style={{ borderColor: row.stakeholder_area.color || '#6B7280' }}
        >
          {row.stakeholder_area.name}
        </span>
      ) : <span className="text-muted">—</span>
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '120px',
      sortable: true,
      render: (row) => {
        const config = PRIORITY_CONFIG[row.priority] || PRIORITY_CONFIG.should_have;
        return (
          <StatusBadge status={config.color} size="sm">
            {config.label}
          </StatusBadge>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortable: true,
      render: (row) => {
        const config = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
        return (
          <StatusBadge status={config.color} size="sm">
            {config.label}
          </StatusBadge>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (row) => {
        const actions = getRowActions(row);
        return (
          <div className="row-actions">
            {/* Primary action - Edit if available, otherwise View */}
            {canManageRequirements && row.status !== 'approved' ? (
              <button 
                className="btn-icon btn-sm"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button 
                className="btn-icon btn-sm"
                onClick={(e) => { e.stopPropagation(); navigate(`/evaluator/requirements/${row.id}`); }}
                title="View"
              >
                <Eye size={16} />
              </button>
            )}
            
            {/* Quick status actions */}
            {canManageRequirements && row.status === 'draft' && (
              <button 
                className="btn-icon btn-sm"
                onClick={(e) => { e.stopPropagation(); handleSubmitForReview(row); }}
                title="Submit for Review"
              >
                <Send size={16} />
              </button>
            )}
            
            {canApproveRequirements && row.status === 'under_review' && (
              <button 
                className="btn-icon btn-sm btn-success"
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                title="Approve"
              >
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [selectedIds, filteredRequirements, handleSelectAll, handleSelectOne, canManageRequirements, canApproveRequirements, getRowActions, navigate, handleOpenEdit, handleSubmitForReview, handleApprove]);

  // Handle row click
  const handleRowClick = useCallback((row) => {
    // Open edit if user can manage, otherwise view
    if (canManageRequirements && row.status !== 'approved') {
      handleOpenEdit(row);
    } else {
      navigate(`/evaluator/requirements/${row.id}`);
    }
  }, [canManageRequirements, handleOpenEdit, navigate]);


  // Loading state
  if (evaluationLoading || isLoading) {
    return <LoadingSpinner message="Loading requirements..." fullPage />;
  }

  // No evaluation selected
  if (!currentEvaluation) {
    return (
      <div className="requirements-hub">
        <PageHeader
          title="Requirements"
          subtitle="Select an evaluation project to view requirements"
        />
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>Please select an evaluation project to view its requirements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="requirements-hub">
      <PageHeader
        title="Requirements"
        subtitle={`${currentEvaluation.name} — ${summary.total} requirement${summary.total !== 1 ? 's' : ''}`}
        actions={
          <div className="header-actions">
            <EvaluationSwitcher />
            {canManageRequirements && (
              <button 
                className="btn btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                Add Requirement
              </button>
            )}
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="requirements-stats">
        <div className="stat-group">
          <span className="stat-label">By Status:</span>
          <div className="stat-badges">
            {Object.entries(summary.byStatus).map(([status, count]) => {
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  className={`stat-badge stat-${config.color} ${filters.status === status ? 'active' : ''}`}
                  onClick={() => handleFilterChange({ status: filters.status === status ? null : status })}
                >
                  {config.label}: {count}
                </button>
              );
            })}
          </div>
        </div>
        <div className="stat-group">
          <span className="stat-label">By Priority:</span>
          <div className="stat-badges">
            {Object.entries(summary.byPriority).map(([priority, count]) => {
              const config = PRIORITY_CONFIG[priority];
              return (
                <button
                  key={priority}
                  className={`stat-badge stat-${config.color} ${filters.priority === priority ? 'active' : ''}`}
                  onClick={() => handleFilterChange({ priority: filters.priority === priority ? null : priority })}
                >
                  {config.label}: {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="requirements-toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search requirements..."
              value={filters.search}
              onChange={e => handleFilterChange({ search: e.target.value })}
            />
          </div>
          <RequirementFilters
            categories={categories}
            stakeholderAreas={stakeholderAreas}
            filters={filters}
            onChange={handleFilterChange}
          />
          {Object.values(filters).some(v => v) && (
            <button className="btn btn-text" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
              title="Matrix view"
            >
              <Grid3X3 size={18} />
            </button>
          </div>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          {canManageRequirements && (
            <button 
              className="btn btn-ai"
              onClick={handleRunGapAnalysis}
              disabled={runningGapAnalysis}
              title="AI Gap Analysis"
            >
              <Sparkles size={16} className={runningGapAnalysis ? 'spinning' : ''} />
              {runningGapAnalysis ? 'Analyzing...' : 'Gap Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedIds.length} selected</span>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button 
            className="btn btn-text btn-sm"
            onClick={() => setSelectedIds([])}
          >
            Clear selection
          </button>
        </div>
      )}


      {/* Requirements Table */}
      {viewMode === 'list' && (
        <Card className="requirements-table-card">
          {filteredRequirements.length > 0 ? (
            <DataTable
              data={filteredRequirements}
              columns={columns}
              emptyMessage="No requirements match your filters"
              sortable
              onRowClick={handleRowClick}
            />
          ) : (
            <div className="empty-state">
              <ClipboardList size={48} />
              <h3>No Requirements Found</h3>
              <p>
                {requirements.length === 0
                  ? "This evaluation doesn't have any requirements yet."
                  : "No requirements match your current filters."}
              </p>
              {canManageRequirements && requirements.length === 0 && (
                <button 
                  className="btn btn-primary"
                  onClick={handleOpenCreate}
                >
                  <Plus size={16} />
                  Add First Requirement
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <Card className="requirements-matrix-card">
          <RequirementMatrix
            requirements={filteredRequirements}
            categories={categories}
            stakeholderAreas={stakeholderAreas}
            onCellClick={(cellData) => {
              if (cellData) {
                // Apply filters from cell selection
                handleFilterChange({
                  categoryId: cellData.filters.category_id || null,
                  stakeholderAreaId: cellData.filters.stakeholder_area_id || null,
                  priority: cellData.filters.priority || null,
                  status: cellData.filters.status || null
                });
              }
            }}
            onRequirementClick={(req) => navigate(`/evaluator/requirements/${req.id}`)}
          />
        </Card>
      )}

      {/* Requirement Form Modal (Create/Edit) */}
      <RequirementForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSave={handleFormSave}
        requirement={formModal.requirement}
        categories={categories}
        stakeholderAreas={stakeholderAreas}
        workshops={[]} // Will be populated when workshops are available
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Requirements"
        message={`Are you sure you want to delete ${selectedIds.length} requirement(s)? This action can be undone by an administrator.`}
        confirmText="Delete"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      {/* Toast Messages */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Gap Analysis Results Modal (Phase 8A) */}
      <GapAnalysisResults
        isOpen={showGapAnalysis}
        onClose={() => {
          setShowGapAnalysis(false);
          setGapAnalysisResults(null);
        }}
        analysisResults={gapAnalysisResults}
        categories={categories}
        onAddRequirements={handleAddGapSuggestions}
      />
    </div>
  );
}
