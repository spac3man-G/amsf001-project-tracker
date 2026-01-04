/**
 * TraceabilityView Page
 * 
 * Displays the full traceability matrix showing requirements vs vendors
 * with scores, RAG status, and drill-down capabilities.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7 - Traceability & Reports (Task 7A.2)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid3x3,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Layers,
  Eye,
  X,
  Search,
  BarChart3
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { 
  traceabilityService,
  evaluationCategoriesService,
  RAG_STATUS,
  RAG_CONFIG
} from '../../services/evaluator';
import { TraceabilityMatrix, TraceabilityDrilldown } from '../../components/evaluator';
import './TraceabilityView.css';

// View modes
const VIEW_MODES = {
  MATRIX: 'matrix',
  COVERAGE: 'coverage',
  SUMMARY: 'summary'
};

function TraceabilityView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentEvaluation } = useEvaluation();

  // State
  const [viewMode, setViewMode] = useState(VIEW_MODES.MATRIX);
  const [matrixData, setMatrixData] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    categoryId: null,
    priority: null,
    mosCow: null,
    vendorIds: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Drilldown state
  const [drilldownData, setDrilldownData] = useState(null);
  const [showDrilldown, setShowDrilldown] = useState(false);

  // Collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Handle URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode && Object.values(VIEW_MODES).includes(mode)) {
      setViewMode(mode);
    }
  }, [searchParams]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentEvaluation?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [matrix, cats, coverage] = await Promise.all([
        traceabilityService.getTraceabilityMatrix(currentEvaluation.id, filters),
        evaluationCategoriesService.getAllWithCriteria(currentEvaluation.id),
        traceabilityService.getCoverageReport(currentEvaluation.id)
      ]);

      setMatrixData(matrix);
      setCategories(cats);
      setCoverageData(coverage);
    } catch (err) {
      console.error('Failed to fetch traceability data:', err);
      setError('Failed to load traceability data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter the matrix rows by search term
  const filteredMatrix = useMemo(() => {
    if (!matrixData?.matrix || !searchTerm.trim()) {
      return matrixData?.matrix;
    }

    const term = searchTerm.toLowerCase();
    return {
      ...matrixData.matrix,
      rows: matrixData.matrix.rows.filter(row => {
        if (row.type === 'category_header') {
          return row.category.name.toLowerCase().includes(term);
        }
        return row.requirement?.name?.toLowerCase().includes(term) ||
               row.requirement?.description?.toLowerCase().includes(term);
      })
    };
  }, [matrixData, searchTerm]);

  // Handle cell click for drilldown
  const handleCellClick = async (requirementId, vendorId) => {
    try {
      setShowDrilldown(true);
      const data = await traceabilityService.getTraceabilityDrilldown(requirementId, vendorId);
      setDrilldownData(data);
    } catch (err) {
      console.error('Failed to load drilldown:', err);
      setError('Failed to load details. Please try again.');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setExporting(true);
      const exportData = await traceabilityService.getMatrixForExport(
        currentEvaluation.id, 
        filters
      );

      // Create CSV content
      const csvContent = [
        exportData.mainSheet.headers.join(','),
        ...exportData.mainSheet.rows.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `traceability-matrix-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Toggle category collapse
  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      categoryId: null,
      priority: null,
      mosCow: null,
      vendorIds: []
    });
    setSearchTerm('');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="traceability-view">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={32} />
          <p>Loading traceability matrix...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="traceability-view">
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="btn btn-primary">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!matrixData || matrixData.requirements.length === 0) {
    return (
      <div className="traceability-view">
        <div className="empty-container">
          <Grid3x3 size={64} strokeWidth={1} />
          <h2>No Requirements Found</h2>
          <p>Add requirements to see the traceability matrix.</p>
          <button 
            onClick={() => navigate('/evaluator/requirements')} 
            className="btn btn-primary"
          >
            Go to Requirements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="traceability-view">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Grid3x3 size={28} />
            <div>
              <h1>Traceability Matrix</h1>
              <p className="header-subtitle">
                {matrixData.requirements.length} requirements × {matrixData.vendors.length} vendors
              </p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="search-clear" 
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              className={`btn btn-icon ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
            </button>

            <button 
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <RefreshCw size={16} className="loading-spinner" />
              ) : (
                <Download size={16} />
              )}
              Export
            </button>

            <button 
              className="btn btn-icon"
              onClick={fetchData}
              title="Refresh data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === VIEW_MODES.MATRIX ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.MATRIX)}
          >
            <Grid3x3 size={16} />
            Matrix
          </button>
          <button
            className={`view-tab ${viewMode === VIEW_MODES.COVERAGE ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.COVERAGE)}
          >
            <Layers size={16} />
            Coverage
          </button>
          <button
            className={`view-tab ${viewMode === VIEW_MODES.SUMMARY ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.SUMMARY)}
          >
            <BarChart3 size={16} />
            Summary
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Category</label>
              <select 
                value={filters.categoryId || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  categoryId: e.target.value || null 
                }))}
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
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priority: e.target.value || null 
                }))}
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
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  mosCow: e.target.value || null 
                }))}
              >
                <option value="">All</option>
                <option value="must">Must Have</option>
                <option value="should">Should Have</option>
                <option value="could">Could Have</option>
                <option value="wont">Won't Have</option>
              </select>
            </div>

            <div className="filter-actions">
              <button className="btn btn-sm btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="traceability-content">
        {viewMode === VIEW_MODES.MATRIX && (
          <TraceabilityMatrix
            matrix={filteredMatrix}
            vendors={matrixData.vendors}
            categories={categories}
            collapsedCategories={collapsedCategories}
            onToggleCategory={toggleCategory}
            onCellClick={handleCellClick}
          />
        )}

        {viewMode === VIEW_MODES.COVERAGE && coverageData && (
          <div className="coverage-view">
            {/* Overall Coverage */}
            <div className="coverage-section">
              <h2>Overall Coverage</h2>
              <div className="coverage-stats">
                <div className="coverage-stat">
                  <div className="stat-value">
                    {coverageData.overall.scoredPercent.toFixed(1)}%
                  </div>
                  <div className="stat-label">Scored</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-bar-fill scored" 
                      style={{ width: `${coverageData.overall.scoredPercent}%` }}
                    />
                  </div>
                </div>

                <div className="coverage-stat">
                  <div className="stat-value">
                    {coverageData.overall.evidencePercent.toFixed(1)}%
                  </div>
                  <div className="stat-label">Has Evidence</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-bar-fill evidence" 
                      style={{ width: `${coverageData.overall.evidencePercent}%` }}
                    />
                  </div>
                </div>

                <div className="coverage-stat">
                  <div className="stat-value">
                    {coverageData.overall.completePercent.toFixed(1)}%
                  </div>
                  <div className="stat-label">Complete</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-bar-fill complete" 
                      style={{ width: `${coverageData.overall.completePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Coverage */}
            <div className="coverage-section">
              <h2>Coverage by Vendor</h2>
              <div className="vendor-coverage-grid">
                {matrixData.vendors.map(vendor => {
                  const vc = coverageData.byVendor[vendor.id];
                  const percent = (vc.scored / vc.total) * 100;
                  return (
                    <div key={vendor.id} className="vendor-coverage-card">
                      <div className="vendor-info">
                        <Building2 size={20} />
                        <span className="vendor-name">{vendor.name}</span>
                      </div>
                      <div className="vendor-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {vc.scored} / {vc.total} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      {vc.missing.length > 0 && (
                        <div className="missing-count">
                          <AlertCircle size={14} />
                          {vc.missing.length} requirements need scoring
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gaps List */}
            {coverageData.gaps.length > 0 && (
              <div className="coverage-section">
                <h2>Scoring Gaps ({coverageData.gaps.length})</h2>
                <div className="gaps-list">
                  {coverageData.gaps.slice(0, 20).map((gap, idx) => (
                    <div key={idx} className="gap-item">
                      <div className="gap-requirement">
                        <FileText size={16} />
                        {gap.requirement.name}
                      </div>
                      <ChevronRight size={16} />
                      <div className="gap-vendor">
                        <Building2 size={16} />
                        {gap.vendor.name}
                      </div>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleCellClick(gap.requirement.id, gap.vendor.id)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  ))}
                  {coverageData.gaps.length > 20 && (
                    <div className="gaps-more">
                      +{coverageData.gaps.length - 20} more gaps
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === VIEW_MODES.SUMMARY && matrixData.summary && (
          <div className="summary-view">
            {/* Vendor Rankings */}
            <div className="summary-section">
              <h2>Vendor Rankings</h2>
              <div className="rankings-table">
                <div className="rankings-header">
                  <span>Rank</span>
                  <span>Vendor</span>
                  <span>Avg Score</span>
                  <span>Weighted</span>
                  <span>Progress</span>
                  <span>Rating</span>
                </div>
                {Object.values(matrixData.summary.vendorSummaries)
                  .sort((a, b) => b.weightedScore - a.weightedScore)
                  .map((vs, idx) => (
                    <div key={vs.vendor.id} className="rankings-row">
                      <span className="rank">#{idx + 1}</span>
                      <span className="vendor-name">
                        <Building2 size={16} />
                        {vs.vendor.name}
                      </span>
                      <span className="avg-score">
                        {vs.averageScore.toFixed(2)}
                      </span>
                      <span className="weighted-score">
                        {vs.weightedScore.toFixed(2)}
                      </span>
                      <span className="progress">
                        <div className="mini-progress">
                          <div 
                            className="mini-progress-fill"
                            style={{ width: `${vs.progress}%` }}
                          />
                        </div>
                        {vs.progress.toFixed(0)}%
                      </span>
                      <span 
                        className={`rag-badge ${vs.ragStatus}`}
                        style={{ 
                          backgroundColor: vs.ragConfig?.bgColor,
                          color: vs.ragConfig?.color
                        }}
                      >
                        {vs.ragConfig?.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="summary-section">
              <h2>Requirements by Category</h2>
              <div className="category-breakdown">
                {categories.map(cat => {
                  const count = matrixData.summary.categoryCounts[cat.id] || 0;
                  return (
                    <div key={cat.id} className="category-stat">
                      <div className="category-info">
                        <span className="category-name">{cat.name}</span>
                        <span className="category-weight">{cat.weight}%</span>
                      </div>
                      <div className="category-count">
                        {count} requirements
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drilldown Modal */}
      {showDrilldown && (
        <TraceabilityDrilldown
          data={drilldownData}
          onClose={() => {
            setShowDrilldown(false);
            setDrilldownData(null);
          }}
        />
      )}
    </div>
  );
}

export default TraceabilityView;
