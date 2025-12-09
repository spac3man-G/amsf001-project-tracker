/**
 * Variations Page - Apple Design System
 * 
 * Project Variations management with:
 * - Variation list with status filtering
 * - Create new variation wizard
 * - View variation details
 * - Dual-signature approval workflow
 * - Delete draft variations
 * 
 * @version 1.1
 * @updated 8 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  variationsService,
  VARIATION_STATUS,
  VARIATION_TYPE,
  STATUS_CONFIG,
  TYPE_CONFIG
} from '../services/variations.service';
import {
  FileText,
  Plus,
  RefreshCw,
  Filter,
  ChevronRight,
  Clock,
  PoundSterling,
  Calendar,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  Info,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import { formatDate, formatCurrency } from '../lib/formatters';
import './Variations.css';

// Status filter options
const STATUS_FILTERS = [
  { value: 'all', label: 'All Variations' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'applied', label: 'Applied' },
  { value: 'rejected', label: 'Rejected' }
];

export default function Variations() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError } = useToast();
  const { canCreateVariation, canDeleteVariation, canSignAsSupplier, canSignAsCustomer } = usePermissions();

  // State
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, variation: null });

  useEffect(() => {
    if (projectId) {
      fetchVariations();
      fetchSummary();
    }
  }, [projectId]);

  async function fetchVariations() {
    try {
      const data = await variationsService.getAllWithStats(projectId);
      setVariations(data || []);
    } catch (error) {
      console.error('Error fetching variations:', error);
      showError('Failed to load variations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchSummary() {
    try {
      const data = await variationsService.getSummary(projectId);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchVariations();
    await fetchSummary();
  }

  function handleCreateNew() {
    navigate('/variations/new');
  }

  function handleViewVariation(variation) {
    navigate(`/variations/${variation.id}`);
  }

  function handleDeleteClick(e, variation) {
    e.stopPropagation(); // Prevent row click from navigating
    setDeleteConfirm({ open: true, variation });
  }

  async function handleDeleteConfirm() {
    const variation = deleteConfirm.variation;
    if (!variation) return;

    try {
      await variationsService.deleteDraftVariation(variation.id);
      showSuccess(`Variation ${variation.variation_ref} deleted`);
      setDeleteConfirm({ open: false, variation: null });
      await fetchVariations();
      await fetchSummary();
    } catch (error) {
      console.error('Error deleting variation:', error);
      showError(error.message || 'Failed to delete variation');
    }
  }

  function handleDeleteCancel() {
    setDeleteConfirm({ open: false, variation: null });
  }

  // Filter variations based on status
  const filteredVariations = variations.filter(v => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') {
      return [
        VARIATION_STATUS.SUBMITTED,
        VARIATION_STATUS.AWAITING_CUSTOMER,
        VARIATION_STATUS.AWAITING_SUPPLIER
      ].includes(v.status);
    }
    return v.status === statusFilter;
  });

  // Get status badge class
  function getStatusBadgeClass(status) {
    const classMap = {
      [VARIATION_STATUS.DRAFT]: 'draft',
      [VARIATION_STATUS.SUBMITTED]: 'submitted',
      [VARIATION_STATUS.AWAITING_CUSTOMER]: 'awaiting',
      [VARIATION_STATUS.AWAITING_SUPPLIER]: 'awaiting',
      [VARIATION_STATUS.APPROVED]: 'approved',
      [VARIATION_STATUS.APPLIED]: 'applied',
      [VARIATION_STATUS.REJECTED]: 'rejected'
    };
    return classMap[status] || 'draft';
  }

  // Get type icon
  function getTypeIcon(type) {
    switch (type) {
      case VARIATION_TYPE.SCOPE_EXTENSION:
        return <ChevronRight size={14} />;
      case VARIATION_TYPE.SCOPE_REDUCTION:
        return <ChevronRight size={14} className="rotate-180" />;
      case VARIATION_TYPE.TIME_EXTENSION:
        return <Clock size={14} />;
      case VARIATION_TYPE.COST_ADJUSTMENT:
        return <PoundSterling size={14} />;
      default:
        return <FileText size={14} />;
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading variations..." size="large" fullPage />;
  }

  return (
    <div className="variations-page">
      {/* Header */}
      <header className="var-header">
        <div className="var-header-content">
          <div className="var-header-left">
            <h1>Variations</h1>
            <p>Project change control and variation management</p>
          </div>
          <div className="var-header-actions">
            <button
              className="var-btn var-btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {canCreateVariation && (
              <button className="var-btn var-btn-primary" onClick={handleCreateNew}>
                <Plus size={18} />
                Create Variation
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="var-content">
        {/* Summary Cards */}
        {summary && (
          <div className="var-summary-grid">
            <div className="var-summary-card accent">
              <div className="var-summary-icon">
                <FileText size={22} />
              </div>
              <div className="var-summary-value">{summary.total}</div>
              <div className="var-summary-label">Total Variations</div>
            </div>
            <div className="var-summary-card warning">
              <div className="var-summary-icon">
                <Clock size={22} />
              </div>
              <div className="var-summary-value">{summary.pending}</div>
              <div className="var-summary-label">Pending Approval</div>
            </div>
            <div className="var-summary-card success">
              <div className="var-summary-icon">
                <CheckCircle2 size={22} />
              </div>
              <div className="var-summary-value">{summary.applied}</div>
              <div className="var-summary-label">Applied</div>
            </div>
            <div className="var-summary-card primary">
              <div className="var-summary-icon">
                <PoundSterling size={22} />
              </div>
              <div className="var-summary-value">
                {summary.totalCostImpact >= 0 ? '+' : ''}
                {formatCurrency(summary.totalCostImpact)}
              </div>
              <div className="var-summary-label">Net Cost Impact</div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="var-filter-bar">
          <div className="var-filter-group">
            <Filter size={16} />
            <span>Filter:</span>
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.value}
                className={`var-filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="var-filter-count">
            {filteredVariations.length} variation{filteredVariations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Variations Table */}
        <div className="var-table-card">
          {filteredVariations.length === 0 ? (
            <div className="var-empty">
              <div className="var-empty-icon">
                <FileText size={32} />
              </div>
              <div className="var-empty-title">
                {statusFilter === 'all' ? 'No variations yet' : `No ${statusFilter} variations`}
              </div>
              <div className="var-empty-text">
                {statusFilter === 'all'
                  ? 'Click "Create Variation" to request a project change.'
                  : 'Try a different filter to see more variations.'}
              </div>
            </div>
          ) : (
            <table className="var-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Cost Impact</th>
                  <th>Days Impact</th>
                  <th>Milestones</th>
                  <th>Created</th>
                  {canDeleteVariation && <th className="var-actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredVariations.map(variation => {
                  const statusConfig = STATUS_CONFIG[variation.status];
                  const typeConfig = TYPE_CONFIG[variation.variation_type];
                  
                  return (
                    <tr
                      key={variation.id}
                      onClick={() => handleViewVariation(variation)}
                    >
                      <td>
                        <span className="var-ref">{variation.variation_ref}</span>
                      </td>
                      <td>
                        <div className="var-title">{variation.title}</div>
                        {variation.description && (
                          <div className="var-title-sub">
                            {variation.description.substring(0, 60)}
                            {variation.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="var-type-badge">
                          {getTypeIcon(variation.variation_type)}
                          {typeConfig?.label || variation.variation_type}
                        </span>
                      </td>
                      <td>
                        <span className={`var-status-badge ${getStatusBadgeClass(variation.status)}`}>
                          <span className="var-status-dot"></span>
                          {statusConfig?.label || variation.status}
                        </span>
                      </td>
                      <td>
                        <span className={`var-impact ${variation.total_cost_impact >= 0 ? 'positive' : 'negative'}`}>
                          {variation.total_cost_impact !== 0 ? (
                            <>
                              {variation.total_cost_impact > 0 ? '+' : ''}
                              {formatCurrency(variation.total_cost_impact)}
                            </>
                          ) : (
                            <span className="var-neutral">—</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`var-impact ${variation.total_days_impact >= 0 ? 'positive' : 'negative'}`}>
                          {variation.total_days_impact !== 0 ? (
                            <>
                              {variation.total_days_impact > 0 ? '+' : ''}
                              {variation.total_days_impact} days
                            </>
                          ) : (
                            <span className="var-neutral">—</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="var-milestone-count">
                          {variation.milestone_count || 0}
                        </span>
                      </td>
                      <td>
                        <span className="var-date">{formatDate(variation.created_at)}</span>
                      </td>
                      {canDeleteVariation && (
                        <td className="var-actions-cell">
                          {[VARIATION_STATUS.DRAFT, VARIATION_STATUS.SUBMITTED, VARIATION_STATUS.REJECTED].includes(variation.status) ? (
                            <button
                              className="var-delete-btn"
                              onClick={(e) => handleDeleteClick(e, variation)}
                              title="Delete variation"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="var-no-action">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="var-info-box">
          <div className="var-info-header">
            <Info size={18} />
            How Variations Work
          </div>
          <ul className="var-info-list">
            <li><strong>Create:</strong> Define the change, select affected milestones, and specify impacts</li>
            <li><strong>Submit:</strong> Send the variation for dual-signature approval</li>
            <li><strong>Approve:</strong> Both Supplier PM and Customer PM must sign to approve</li>
            <li><strong>Apply:</strong> Approved variations update milestone baselines automatically</li>
            <li>Click any variation row to view details or continue editing drafts</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Delete Variation"
        message={
          deleteConfirm.variation 
            ? `Are you sure you want to delete ${deleteConfirm.variation.variation_ref}?\n\n"${deleteConfirm.variation.title}"\n\nThis action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
