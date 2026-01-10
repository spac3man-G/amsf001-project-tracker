/**
 * EnhancedTraceabilityView Component
 *
 * Full-featured traceability matrix view with:
 * - Interactive requirements x vendors matrix
 * - Advanced filtering (category, priority, MoSCoW, RAG status)
 * - AI-generated insights panel
 * - Export functionality (CSV, Excel)
 * - Vendor comparison charts
 * - Drill-down capability
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.8: Enhanced Traceability Matrix
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Lightbulb,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  Trophy,
  Target,
  Info
} from 'lucide-react';
import PropTypes from 'prop-types';
import { traceabilityService, RAG_CONFIG, RAG_STATUS } from '../../../services/evaluator/traceability.service';
import { useAuth } from '../../../contexts/AuthContext';
import TraceabilityMatrix from './TraceabilityMatrix';
import TraceabilityDrilldown from './TraceabilityDrilldown';
import './EnhancedTraceabilityView.css';

// ============================================================================
// INSIGHT TYPE CONFIGURATION
// ============================================================================

const INSIGHT_TYPE_CONFIG = {
  vendor_strength: { icon: TrendingUp, color: '#10b981', label: 'Strength' },
  vendor_weakness: { icon: AlertTriangle, color: '#ef4444', label: 'Weakness' },
  category_leader: { icon: Trophy, color: '#f59e0b', label: 'Leader' },
  consensus_needed: { icon: AlertCircle, color: '#f97316', label: 'Reconcile' },
  coverage_gap: { icon: Target, color: '#8b5cf6', label: 'Gap' },
  risk_area: { icon: AlertTriangle, color: '#ef4444', label: 'Risk' },
  differentiator: { icon: BarChart3, color: '#3b82f6', label: 'Differentiator' },
  common_strength: { icon: CheckCircle, color: '#10b981', label: 'Common' },
  progress_update: { icon: Info, color: '#6b7280', label: 'Progress' },
  recommendation: { icon: Lightbulb, color: '#8b5cf6', label: 'Recommendation' }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FiltersPanel({
  filters,
  onFilterChange,
  categories,
  vendors,
  onClose
}) {
  return (
    <div className="filters-panel">
      <div className="filters-header">
        <h4><Filter size={16} /> Filters</h4>
        <button className="close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="filters-body">
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => onFilterChange('categoryId', e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange('priority', e.target.value || null)}
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>MoSCoW</label>
          <select
            value={filters.mosCow || ''}
            onChange={(e) => onFilterChange('mosCow', e.target.value || null)}
          >
            <option value="">All</option>
            <option value="must">Must Have</option>
            <option value="should">Should Have</option>
            <option value="could">Could Have</option>
            <option value="wont">Won't Have</option>
          </select>
        </div>

        <div className="filter-group">
          <label>RAG Status</label>
          <select
            value={filters.ragStatus || ''}
            onChange={(e) => onFilterChange('ragStatus', e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="green">Green (≥4)</option>
            <option value="amber">Amber (3-4)</option>
            <option value="red">Red (&lt;3)</option>
            <option value="none">Not Scored</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Vendors</label>
          <div className="vendor-checkboxes">
            {vendors.map(vendor => (
              <label key={vendor.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!filters.excludedVendors?.includes(vendor.id)}
                  onChange={(e) => {
                    const excluded = filters.excludedVendors || [];
                    if (e.target.checked) {
                      onFilterChange('excludedVendors', excluded.filter(id => id !== vendor.id));
                    } else {
                      onFilterChange('excludedVendors', [...excluded, vendor.id]);
                    }
                  }}
                />
                {vendor.name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ insights, onDismiss, onRefresh, isLoading }) {
  if (isLoading) {
    return (
      <div className="insights-panel loading">
        <RefreshCw className="spinning" size={20} />
        <span>Generating insights...</span>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="insights-panel empty">
        <Lightbulb size={24} />
        <p>No insights available</p>
        <button onClick={onRefresh}>
          <Sparkles size={14} /> Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <h4><Sparkles size={16} /> AI Insights</h4>
        <button className="refresh-btn" onClick={onRefresh} title="Refresh insights">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="insights-list">
        {insights.map(insight => {
          const config = INSIGHT_TYPE_CONFIG[insight.insight_type] || INSIGHT_TYPE_CONFIG.recommendation;
          const IconComponent = config.icon;

          return (
            <div key={insight.id} className={`insight-card priority-${insight.priority}`}>
              <div className="insight-icon" style={{ color: config.color }}>
                <IconComponent size={16} />
              </div>
              <div className="insight-content">
                <h5>{insight.title}</h5>
                <p>{insight.description}</p>
                {insight.vendor && (
                  <span className="insight-vendor">
                    <Building2 size={12} /> {insight.vendor.name}
                  </span>
                )}
              </div>
              <button
                className="dismiss-btn"
                onClick={() => onDismiss(insight.id)}
                title="Dismiss insight"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryBar({ summary, vendors }) {
  if (!summary) return null;

  return (
    <div className="summary-bar">
      <div className="summary-stat">
        <span className="stat-label">Requirements</span>
        <span className="stat-value">{summary.totalRequirements}</span>
      </div>
      <div className="summary-stat">
        <span className="stat-label">Progress</span>
        <span className="stat-value">{summary.overallProgress.toFixed(0)}%</span>
      </div>
      <div className="vendor-rankings">
        {vendors.map((vendor, idx) => {
          const vendorSummary = summary.vendorSummaries[vendor.id];
          if (!vendorSummary) return null;

          return (
            <div
              key={vendor.id}
              className={`vendor-rank ${vendorSummary.ragStatus}`}
              style={{ borderColor: vendorSummary.ragConfig?.color }}
            >
              <span className="rank-position">#{idx + 1}</span>
              <span className="vendor-name">{vendor.name}</span>
              <span
                className="vendor-score"
                style={{ color: vendorSummary.ragConfig?.color }}
              >
                {vendorSummary.weightedScore.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExportMenu({ onExport, isExporting }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="export-menu">
      <button
        className="export-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <RefreshCw className="spinning" size={16} />
        ) : (
          <Download size={16} />
        )}
        Export
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="export-dropdown">
          <button onClick={() => { onExport('csv'); setIsOpen(false); }}>
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button onClick={() => { onExport('xlsx'); setIsOpen(false); }}>
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function EnhancedTraceabilityView({ evaluationProjectId }) {
  const { user } = useAuth();

  // Data state
  const [matrixData, setMatrixData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [drilldownData, setDrilldownData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    categoryId: null,
    priority: null,
    mosCow: null,
    ragStatus: null,
    excludedVendors: []
  });

  // Load matrix data
  const loadMatrixData = useCallback(async () => {
    if (!evaluationProjectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await traceabilityService.getTraceabilityMatrix(
        evaluationProjectId,
        {
          categoryId: filters.categoryId,
          priority: filters.priority,
          mosCow: filters.mosCow
        }
      );
      setMatrixData(data);
    } catch (err) {
      console.error('Failed to load matrix data:', err);
      setError(err.message || 'Failed to load traceability matrix');
    } finally {
      setIsLoading(false);
    }
  }, [evaluationProjectId, filters.categoryId, filters.priority, filters.mosCow]);

  // Load insights
  const loadInsights = useCallback(async () => {
    if (!evaluationProjectId) return;

    setIsLoadingInsights(true);
    try {
      const data = await traceabilityService.getInsights(evaluationProjectId, {
        limit: 10
      });
      setInsights(data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [evaluationProjectId]);

  // Generate new insights
  const generateInsights = useCallback(async () => {
    if (!evaluationProjectId) return;

    setIsLoadingInsights(true);
    try {
      await traceabilityService.generateSystemInsights(evaluationProjectId);
      await loadInsights();
    } catch (err) {
      console.error('Failed to generate insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [evaluationProjectId, loadInsights]);

  // Dismiss insight
  const handleDismissInsight = useCallback(async (insightId) => {
    if (!user?.id) return;

    try {
      await traceabilityService.dismissInsight(insightId, user.id);
      setInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadMatrixData();
    loadInsights();
  }, [loadMatrixData, loadInsights]);

  // Filter change handler
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Toggle category collapse
  const handleToggleCategory = useCallback((categoryId) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Cell click handler
  const handleCellClick = useCallback(async (requirementId, vendorId) => {
    try {
      const data = await traceabilityService.getTraceabilityDrilldown(requirementId, vendorId);
      setDrilldownData(data);
    } catch (err) {
      console.error('Failed to load drilldown data:', err);
    }
  }, []);

  // Export handler
  const handleExport = useCallback(async (format) => {
    if (!evaluationProjectId || !user?.id) return;

    setIsExporting(true);
    try {
      if (format === 'csv') {
        const csv = await traceabilityService.generateCSVExport(evaluationProjectId, filters);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traceability-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Record export
      await traceabilityService.recordExport({
        evaluation_project_id: evaluationProjectId,
        export_format: format,
        export_type: 'full_matrix',
        filters_applied: filters,
        vendors_included: matrixData?.vendors?.map(v => v.id),
        exported_by: user.id,
        total_requirements: matrixData?.summary?.totalRequirements || 0,
        total_vendors: matrixData?.vendors?.length || 0,
        coverage_percentage: matrixData?.summary?.overallProgress || 0
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [evaluationProjectId, user?.id, filters, matrixData]);

  // Filter vendors from display
  const filteredVendors = useMemo(() => {
    if (!matrixData?.vendors) return [];
    if (!filters.excludedVendors?.length) return matrixData.vendors;
    return matrixData.vendors.filter(v => !filters.excludedVendors.includes(v.id));
  }, [matrixData?.vendors, filters.excludedVendors]);

  // Filter matrix by RAG status
  const filteredMatrix = useMemo(() => {
    if (!matrixData?.matrix || !filters.ragStatus) return matrixData?.matrix;

    const filtered = {
      ...matrixData.matrix,
      rows: matrixData.matrix.rows.filter(row => {
        if (row.type === 'category_header') return true;
        return row.cells.some(cell => cell.ragStatus === filters.ragStatus);
      })
    };
    return filtered;
  }, [matrixData?.matrix, filters.ragStatus]);

  // Loading state
  if (isLoading && !matrixData) {
    return (
      <div className="enhanced-traceability-view loading">
        <div className="loading-state">
          <RefreshCw className="spinning" size={32} />
          <span>Loading traceability matrix...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="enhanced-traceability-view error">
        <div className="error-state">
          <AlertTriangle size={32} />
          <span>{error}</span>
          <button onClick={loadMatrixData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-traceability-view">
      {/* Toolbar */}
      <div className="traceability-toolbar">
        <div className="toolbar-left">
          <h2><Layers size={20} /> Traceability Matrix</h2>
        </div>
        <div className="toolbar-right">
          <button
            className={`toolbar-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
          <button
            className={`toolbar-btn ${showInsights ? 'active' : ''}`}
            onClick={() => setShowInsights(!showInsights)}
          >
            <Lightbulb size={16} /> Insights
          </button>
          <button
            className="toolbar-btn"
            onClick={loadMatrixData}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
          <ExportMenu onExport={handleExport} isExporting={isExporting} />
        </div>
      </div>

      {/* Summary Bar */}
      {matrixData?.summary && (
        <SummaryBar
          summary={matrixData.summary}
          vendors={filteredVendors.sort((a, b) => {
            const scoreA = matrixData.summary.vendorSummaries[a.id]?.weightedScore || 0;
            const scoreB = matrixData.summary.vendorSummaries[b.id]?.weightedScore || 0;
            return scoreB - scoreA;
          })}
        />
      )}

      {/* Main Content */}
      <div className="traceability-content">
        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={matrixData?.categories || []}
            vendors={matrixData?.vendors || []}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Matrix */}
        <div className="matrix-container">
          {filteredMatrix && filteredVendors.length > 0 ? (
            <TraceabilityMatrix
              matrix={filteredMatrix}
              vendors={filteredVendors}
              categories={matrixData?.categories || []}
              collapsedCategories={collapsedCategories}
              onToggleCategory={handleToggleCategory}
              onCellClick={handleCellClick}
            />
          ) : (
            <div className="matrix-empty">
              <Layers size={48} />
              <p>No data matches the current filters</p>
              <button onClick={() => setFilters({
                categoryId: null,
                priority: null,
                mosCow: null,
                ragStatus: null,
                excludedVendors: []
              })}>
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Insights Panel */}
        {showInsights && (
          <InsightsPanel
            insights={insights}
            onDismiss={handleDismissInsight}
            onRefresh={generateInsights}
            isLoading={isLoadingInsights}
          />
        )}
      </div>

      {/* Drilldown Modal */}
      {drilldownData && (
        <TraceabilityDrilldown
          data={drilldownData}
          onClose={() => setDrilldownData(null)}
        />
      )}
    </div>
  );
}

EnhancedTraceabilityView.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired
};

export default EnhancedTraceabilityView;
