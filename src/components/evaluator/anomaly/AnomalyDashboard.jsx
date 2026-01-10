/**
 * AnomalyDashboard Component
 * Part of: Evaluator Product Roadmap v1.0.x - Feature 0.3: Anomaly Detection & Risk Flagging
 *
 * Displays detected anomalies in vendor responses with filtering,
 * resolution workflow, and comparison visualizations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  Shield,
  Package,
  X,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import anomalyDetectionService, {
  ANOMALY_TYPES,
  ANOMALY_SEVERITIES,
  ANOMALY_STATUSES,
} from '../../../services/evaluator/anomalyDetection.service';
import './AnomalyDashboard.css';

// ============================================================================
// ANOMALY DASHBOARD
// ============================================================================

export default function AnomalyDashboard({ evaluationProjectId, onAnomalySelect }) {
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detecting, setDetecting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    vendorId: '',
    includeResolved: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionModal, setResolutionModal] = useState(null);

  // Load anomalies
  const loadAnomalies = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const [anomalyData, statsData] = await Promise.all([
        anomalyDetectionService.getAnomalies(evaluationProjectId, filters),
        anomalyDetectionService.getAnomalyStats(evaluationProjectId),
      ]);

      setAnomalies(anomalyData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading anomalies:', err);
      setError('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId, filters]);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  // Run detection
  const handleRunDetection = async () => {
    try {
      setDetecting(true);
      const results = await anomalyDetectionService.runAnomalyDetection(evaluationProjectId);
      await loadAnomalies();

      if (results.totalDetected > 0) {
        alert(`Detection complete: ${results.totalDetected} anomalies found`);
      } else {
        alert('Detection complete: No new anomalies detected');
      }
    } catch (err) {
      console.error('Error running detection:', err);
      alert('Failed to run anomaly detection');
    } finally {
      setDetecting(false);
    }
  };

  // Handle resolution actions
  const handleResolve = async (anomalyId, note) => {
    try {
      await anomalyDetectionService.resolveAnomaly(anomalyId, null, note);
      await loadAnomalies();
      setResolutionModal(null);
    } catch (err) {
      console.error('Error resolving anomaly:', err);
      alert('Failed to resolve anomaly');
    }
  };

  const handleAccept = async (anomalyId, note) => {
    try {
      await anomalyDetectionService.acceptAnomaly(anomalyId, null, note);
      await loadAnomalies();
      setResolutionModal(null);
    } catch (err) {
      console.error('Error accepting anomaly:', err);
      alert('Failed to accept anomaly');
    }
  };

  const handleDismiss = async (anomalyId, note) => {
    try {
      await anomalyDetectionService.dismissAnomaly(anomalyId, null, note);
      await loadAnomalies();
      setResolutionModal(null);
    } catch (err) {
      console.error('Error dismissing anomaly:', err);
      alert('Failed to dismiss anomaly');
    }
  };

  const handleMarkUnderReview = async (anomalyId) => {
    try {
      await anomalyDetectionService.markUnderReview(anomalyId);
      await loadAnomalies();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleMarkClarificationSent = async (anomalyId) => {
    try {
      await anomalyDetectionService.markClarificationSent(anomalyId);
      await loadAnomalies();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading && anomalies.length === 0) {
    return (
      <div className="anomaly-dashboard">
        <div className="anomaly-loading">
          <div className="anomaly-loading-spinner" />
          <p>Loading anomalies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anomaly-dashboard">
        <div className="anomaly-error">
          <AlertCircle size={48} />
          <h3>Error Loading Anomalies</h3>
          <p>{error}</p>
          <button onClick={loadAnomalies} className="anomaly-btn anomaly-btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-dashboard">
      {/* Header */}
      <div className="anomaly-header">
        <div className="anomaly-header-left">
          <h1>Anomaly Detection</h1>
          <p>Statistical outliers in vendor bids and responses</p>
        </div>
        <div className="anomaly-header-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`anomaly-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={handleRunDetection}
            disabled={detecting}
            className="anomaly-btn anomaly-btn-primary"
          >
            {detecting ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Detecting...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Run Detection
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="anomaly-stats-bar">
          <StatCard
            label="Open Issues"
            value={stats.open + stats.underReview + stats.clarificationSent}
            icon={<AlertTriangle />}
            variant="warning"
          />
          <StatCard
            label="Critical"
            value={stats.bySeverity.critical}
            icon={<AlertCircle />}
            variant="critical"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved + stats.accepted}
            icon={<CheckCircle />}
            variant="success"
          />
          <StatCard
            label="Total Detected"
            value={stats.total}
            icon={<BarChart3 />}
          />
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <FiltersPanel
          filters={filters}
          onFilterChange={setFilters}
          anomalies={anomalies}
        />
      )}

      {/* Anomalies List */}
      <div className="anomaly-content">
        {anomalies.length === 0 ? (
          <div className="anomaly-empty">
            <AlertTriangle size={48} />
            <h3>No Anomalies Detected</h3>
            <p>
              {filters.type || filters.severity || filters.status
                ? 'No anomalies match your current filters.'
                : 'Run detection to analyze vendor responses for statistical outliers.'}
            </p>
            {!filters.type && !filters.severity && !filters.status && (
              <button
                onClick={handleRunDetection}
                disabled={detecting}
                className="anomaly-btn anomaly-btn-primary"
              >
                Run Detection Now
              </button>
            )}
          </div>
        ) : (
          <div className="anomaly-list">
            {anomalies.map(anomaly => (
              <AnomalyCard
                key={anomaly.id}
                anomaly={anomaly}
                onSelect={() => {
                  setSelectedAnomaly(anomaly);
                  onAnomalySelect?.(anomaly);
                }}
                onResolve={() => setResolutionModal({ anomaly, action: 'resolve' })}
                onAccept={() => setResolutionModal({ anomaly, action: 'accept' })}
                onDismiss={() => setResolutionModal({ anomaly, action: 'dismiss' })}
                onMarkReview={() => handleMarkUnderReview(anomaly.id)}
                onMarkClarification={() => handleMarkClarificationSent(anomaly.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModal && (
        <ResolutionModal
          anomaly={resolutionModal.anomaly}
          action={resolutionModal.action}
          onConfirm={(note) => {
            switch (resolutionModal.action) {
              case 'resolve':
                handleResolve(resolutionModal.anomaly.id, note);
                break;
              case 'accept':
                handleAccept(resolutionModal.anomaly.id, note);
                break;
              case 'dismiss':
                handleDismiss(resolutionModal.anomaly.id, note);
                break;
            }
          }}
          onClose={() => setResolutionModal(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ label, value, icon, variant }) {
  return (
    <div className={`anomaly-stat-card ${variant || ''}`}>
      <div className="anomaly-stat-icon">{icon}</div>
      <div className="anomaly-stat-content">
        <div className="anomaly-stat-value">{value}</div>
        <div className="anomaly-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ============================================================================
// FILTERS PANEL
// ============================================================================

function FiltersPanel({ filters, onFilterChange, anomalies }) {
  // Get unique vendors from anomalies
  const vendors = [...new Set(anomalies.map(a => a.vendors?.name).filter(Boolean))];

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      type: '',
      severity: '',
      status: '',
      vendorId: '',
      includeResolved: false,
    });
  };

  const hasFilters = filters.type || filters.severity || filters.status || filters.vendorId;

  return (
    <div className="anomaly-filters-panel">
      <div className="anomaly-filters-grid">
        <div className="anomaly-filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="price">Price</option>
            <option value="schedule">Schedule</option>
            <option value="compliance">Compliance</option>
            <option value="scope">Scope</option>
            <option value="feature">Feature</option>
          </select>
        </div>

        <div className="anomaly-filter-group">
          <label>Severity</label>
          <select
            value={filters.severity}
            onChange={(e) => handleChange('severity', e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="anomaly-filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">Open Issues</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="clarification_sent">Clarification Sent</option>
            <option value="resolved">Resolved</option>
            <option value="accepted">Accepted</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="anomaly-filter-group">
          <label>Vendor</label>
          <select
            value={filters.vendorId}
            onChange={(e) => handleChange('vendorId', e.target.value)}
          >
            <option value="">All Vendors</option>
            {vendors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="anomaly-filters-actions">
        <label className="anomaly-checkbox">
          <input
            type="checkbox"
            checked={filters.includeResolved}
            onChange={(e) => handleChange('includeResolved', e.target.checked)}
          />
          <span>Include resolved</span>
        </label>
        {hasFilters && (
          <button onClick={clearFilters} className="anomaly-clear-filters">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ANOMALY CARD
// ============================================================================

function AnomalyCard({
  anomaly,
  onSelect,
  onResolve,
  onAccept,
  onDismiss,
  onMarkReview,
  onMarkClarification,
}) {
  const [expanded, setExpanded] = useState(false);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'price': return <DollarSign size={16} />;
      case 'schedule': return <Calendar size={16} />;
      case 'compliance': return <Shield size={16} />;
      case 'scope': return <Package size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'under_review': return <Clock size={14} />;
      case 'clarification_sent': return <MessageSquare size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      case 'accepted': return <CheckCircle size={14} />;
      case 'dismissed': return <XCircle size={14} />;
      default: return null;
    }
  };

  const getDeviationIcon = () => {
    if (!anomaly.deviation_percentage) return null;
    return anomaly.deviation_percentage < 0
      ? <TrendingDown size={14} className="trending-down" />
      : <TrendingUp size={14} className="trending-up" />;
  };

  const isResolved = ['resolved', 'accepted', 'dismissed'].includes(anomaly.status);

  return (
    <div className={`anomaly-card severity-${anomaly.severity} ${isResolved ? 'resolved' : ''}`}>
      <div className="anomaly-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="anomaly-card-icon">
          {getTypeIcon(anomaly.anomaly_type)}
        </div>
        <div className="anomaly-card-main">
          <div className="anomaly-card-title">
            <h4>{anomaly.title}</h4>
            <span className={`anomaly-severity-badge ${anomaly.severity}`}>
              {getSeverityIcon(anomaly.severity)}
              {anomaly.severity}
            </span>
          </div>
          <div className="anomaly-card-meta">
            <span className="anomaly-vendor">{anomaly.vendors?.name || 'Unknown Vendor'}</span>
            <span className="anomaly-type">{anomaly.anomaly_type}</span>
            <span className={`anomaly-status ${anomaly.status}`}>
              {getStatusIcon(anomaly.status)}
              {anomaly.status.replace('_', ' ')}
            </span>
            {anomaly.deviation_percentage && (
              <span className="anomaly-deviation">
                {getDeviationIcon()}
                {Math.abs(anomaly.deviation_percentage).toFixed(1)}% deviation
              </span>
            )}
          </div>
        </div>
        <button className="anomaly-expand-btn">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="anomaly-card-body">
          <p className="anomaly-description">{anomaly.description}</p>

          <div className="anomaly-details-grid">
            <div className="anomaly-detail">
              <label>Detected Value</label>
              <span>{anomaly.detected_value}</span>
            </div>
            <div className="anomaly-detail">
              <label>Typical Range</label>
              <span>{anomaly.typical_range}</span>
            </div>
            {anomaly.comparison_values && (
              <div className="anomaly-detail full-width">
                <label>Other Vendors</label>
                <div className="anomaly-comparisons">
                  {anomaly.comparison_values.map((cv, idx) => (
                    <span key={idx} className="comparison-chip">
                      {cv.vendorName}: {cv.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {anomaly.recommended_action && (
              <div className="anomaly-detail full-width">
                <label>Recommended Action</label>
                <span>{anomaly.recommended_action}</span>
              </div>
            )}
            {anomaly.resolution_note && (
              <div className="anomaly-detail full-width">
                <label>Resolution Note</label>
                <span>{anomaly.resolution_note}</span>
              </div>
            )}
          </div>

          {!isResolved && (
            <div className="anomaly-card-actions">
              {anomaly.status === 'open' && (
                <button onClick={onMarkReview} className="anomaly-btn anomaly-btn-sm">
                  <Clock size={14} />
                  Mark Under Review
                </button>
              )}
              {anomaly.status === 'under_review' && (
                <button onClick={onMarkClarification} className="anomaly-btn anomaly-btn-sm">
                  <MessageSquare size={14} />
                  Clarification Sent
                </button>
              )}
              <button onClick={onResolve} className="anomaly-btn anomaly-btn-sm anomaly-btn-success">
                <CheckCircle size={14} />
                Resolve
              </button>
              <button onClick={onAccept} className="anomaly-btn anomaly-btn-sm">
                <CheckCircle size={14} />
                Accept Risk
              </button>
              <button onClick={onDismiss} className="anomaly-btn anomaly-btn-sm anomaly-btn-ghost">
                <XCircle size={14} />
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RESOLUTION MODAL
// ============================================================================

function ResolutionModal({ anomaly, action, onConfirm, onClose }) {
  const [note, setNote] = useState('');

  const getTitle = () => {
    switch (action) {
      case 'resolve': return 'Resolve Anomaly';
      case 'accept': return 'Accept Risk';
      case 'dismiss': return 'Dismiss Anomaly';
      default: return 'Update Anomaly';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'resolve':
        return 'This anomaly has been investigated and the issue has been resolved or explained.';
      case 'accept':
        return 'You are accepting this anomaly as a known risk that does not require further action.';
      case 'dismiss':
        return 'This anomaly is a false positive and should be dismissed.';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (action) {
      case 'resolve':
        return 'Describe how the issue was resolved...';
      case 'accept':
        return 'Explain why this risk is acceptable...';
      case 'dismiss':
        return 'Explain why this is a false positive...';
      default:
        return 'Add a note...';
    }
  };

  return (
    <div className="anomaly-modal-overlay" onClick={onClose}>
      <div className="anomaly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="anomaly-modal-header">
          <h3>{getTitle()}</h3>
          <button onClick={onClose} className="anomaly-modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="anomaly-modal-body">
          <div className="anomaly-modal-anomaly">
            <h4>{anomaly.title}</h4>
            <p>{anomaly.vendors?.name} • {anomaly.anomaly_type}</p>
          </div>
          <p className="anomaly-modal-description">{getDescription()}</p>
          <div className="anomaly-modal-field">
            <label>Note (required)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
            />
          </div>
        </div>
        <div className="anomaly-modal-footer">
          <button onClick={onClose} className="anomaly-btn">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={!note.trim()}
            className={`anomaly-btn ${action === 'resolve' ? 'anomaly-btn-success' : action === 'dismiss' ? 'anomaly-btn-ghost' : 'anomaly-btn-primary'}`}
          >
            {getTitle()}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export sub-components for reuse
export { AnomalyCard, StatCard };
