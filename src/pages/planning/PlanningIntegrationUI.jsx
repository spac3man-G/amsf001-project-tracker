/**
 * PlanningIntegrationUI Components
 * 
 * React components for the Planner-Tracker integration UI including:
 * - CommitToTrackerButton
 * - PlanItemIndicators
 * - PendingChangesBanner
 * - SyncStatusFooter
 * 
 * @module components/planning/PlanningIntegrationUI
 * @version 1.0.0
 * @created 2026-01-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  CheckCircle2,
  Lock,
  AlertCircle,
  RefreshCw,
  XCircle,
  FileText,
  Trash2,
  Clock
} from 'lucide-react';

// ============================================================================
// COMMIT TO TRACKER BUTTON
// ============================================================================

/**
 * Button to commit the plan to the Tracker
 */
export function CommitToTrackerButton({
  uncommittedCount,
  isCommitting,
  canCommit,
  onClick
}) {
  if (!canCommit || uncommittedCount === 0) {
    return null;
  }
  
  return (
    <button
      className={`planning-toolbar-btn planning-toolbar-btn-primary ${
        uncommittedCount > 0 ? 'planning-toolbar-btn-commit-warning' : ''
      }`}
      onClick={onClick}
      disabled={isCommitting}
      title={`Commit ${uncommittedCount} item${uncommittedCount !== 1 ? 's' : ''} to Tracker`}
    >
      {isCommitting ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : (
        <Upload size={16} />
      )}
      <span>
        Commit to Tracker
        <span className="btn-count">{uncommittedCount}</span>
      </span>
    </button>
  );
}

CommitToTrackerButton.propTypes = {
  uncommittedCount: PropTypes.number.isRequired,
  isCommitting: PropTypes.bool,
  canCommit: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

// ============================================================================
// PLAN ITEM INDICATORS
// ============================================================================

/**
 * Visual indicators for a plan item's status
 */
export function PlanItemIndicators({
  item,
  hasPendingChanges = false,
  isSyncing = false,
  hasError = false
}) {
  const indicators = [];
  
  if (item.is_published) {
    indicators.push(
      <span
        key="published"
        className="planning-indicator planning-indicator-published"
        title="Committed to Tracker"
      >
        <CheckCircle2 size={14} />
      </span>
    );
  }
  
  if (item.is_published && item._baselineLocked) {
    indicators.push(
      <span
        key="locked"
        className="planning-indicator planning-indicator-locked"
        title="Baseline Protected - Variation required for changes"
      >
        <Lock size={14} />
      </span>
    );
  }
  
  if (hasPendingChanges) {
    indicators.push(
      <span
        key="pending"
        className="planning-indicator planning-indicator-pending"
        title="Has unsaved changes"
      >
        <AlertCircle size={14} />
      </span>
    );
  }
  
  if (isSyncing) {
    indicators.push(
      <span
        key="syncing"
        className="planning-indicator planning-indicator-syncing"
        title="Syncing..."
      >
        <RefreshCw size={14} />
      </span>
    );
  }
  
  if (hasError) {
    indicators.push(
      <span
        key="error"
        className="planning-indicator planning-indicator-error"
        title="Sync error - click for details"
      >
        <XCircle size={14} />
      </span>
    );
  }
  
  if (indicators.length === 0) return null;
  
  return (
    <div className="planning-row-indicators">
      {indicators}
    </div>
  );
}

PlanItemIndicators.propTypes = {
  item: PropTypes.shape({
    is_published: PropTypes.bool,
    _baselineLocked: PropTypes.bool
  }).isRequired,
  hasPendingChanges: PropTypes.bool,
  isSyncing: PropTypes.bool,
  hasError: PropTypes.bool
};

// ============================================================================
// PENDING CHANGES BANNER
// ============================================================================

/**
 * Banner shown when there are pending baseline changes
 */
export function PendingChangesBanner({
  pendingChanges,
  onCreateVariation,
  onDiscardAll
}) {
  if (!pendingChanges || pendingChanges.length === 0) {
    return null;
  }
  
  const milestoneCount = new Set(
    pendingChanges.map(c => c.milestone?.id).filter(Boolean)
  ).size;
  
  return (
    <div className="planning-pending-banner">
      <div className="planning-pending-banner-content">
        <AlertCircle size={20} className="planning-pending-banner-icon" />
        <span className="planning-pending-banner-text">
          <strong>{pendingChanges.length}</strong> pending change{pendingChanges.length !== 1 ? 's' : ''} to{' '}
          <strong>{milestoneCount}</strong> baselined milestone{milestoneCount !== 1 ? 's' : ''}.
          Create a variation to apply these changes.
        </span>
      </div>
      <div className="planning-pending-banner-actions">
        <button
          className="planning-pending-banner-btn planning-pending-banner-btn-secondary"
          onClick={onDiscardAll}
        >
          <Trash2 size={14} />
          Discard All
        </button>
        <button
          className="planning-pending-banner-btn planning-pending-banner-btn-primary"
          onClick={onCreateVariation}
        >
          <FileText size={14} />
          Create Variation
        </button>
      </div>
    </div>
  );
}

PendingChangesBanner.propTypes = {
  pendingChanges: PropTypes.array,
  onCreateVariation: PropTypes.func.isRequired,
  onDiscardAll: PropTypes.func.isRequired
};

// ============================================================================
// SYNC STATUS FOOTER
// ============================================================================

/**
 * Footer showing sync status and statistics
 */
export function SyncStatusFooter({
  commitSummary,
  lastSync,
  isSyncing = false
}) {
  const { committed = 0, uncommitted = 0, baselineLocked = 0 } = commitSummary || {};
  
  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const diff = Date.now() - new Date(lastSync).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return new Date(lastSync).toLocaleDateString();
  };
  
  return (
    <div className="planning-sync-status">
      <div className="planning-sync-status-left">
        <div className="planning-sync-status-item">
          <span className={`planning-sync-status-dot ${
            isSyncing 
              ? 'planning-sync-status-dot-pending' 
              : uncommitted > 0 
                ? 'planning-sync-status-dot-pending'
                : 'planning-sync-status-dot-synced'
          }`} />
          <span>
            {isSyncing 
              ? 'Syncing...' 
              : uncommitted > 0 
                ? `${uncommitted} uncommitted`
                : 'All committed'
            }
          </span>
        </div>
        
        <div className="planning-sync-status-item">
          <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
          <span>{committed} committed</span>
        </div>
        
        {baselineLocked > 0 && (
          <div className="planning-sync-status-item">
            <Lock size={14} style={{ color: '#f59e0b' }} />
            <span>{baselineLocked} baselined</span>
          </div>
        )}
      </div>
      
      <div className="planning-sync-status-item">
        <Clock size={14} />
        <span>Last sync: {formatLastSync()}</span>
      </div>
    </div>
  );
}

SyncStatusFooter.propTypes = {
  commitSummary: PropTypes.shape({
    committed: PropTypes.number,
    uncommitted: PropTypes.number,
    baselineLocked: PropTypes.number
  }),
  lastSync: PropTypes.instanceOf(Date),
  isSyncing: PropTypes.bool
};

// ============================================================================
// PLAN STATUS BADGE
// ============================================================================

/**
 * Badge showing the overall plan status
 */
export function PlanStatusBadge({ status }) {
  const configs = {
    draft: {
      label: 'Draft - Not Committed',
      className: 'planning-status-badge-draft',
      icon: AlertCircle
    },
    committed: {
      label: 'Committed - Connected to Tracker',
      className: 'planning-status-badge-committed',
      icon: CheckCircle2
    },
    syncing: {
      label: 'Syncing...',
      className: 'planning-status-badge-syncing',
      icon: RefreshCw
    }
  };
  
  const config = configs[status] || configs.draft;
  const Icon = config.icon;
  
  return (
    <span className={`planning-status-badge ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

PlanStatusBadge.propTypes = {
  status: PropTypes.oneOf(['draft', 'committed', 'syncing'])
};

export default {
  CommitToTrackerButton,
  PlanItemIndicators,
  PendingChangesBanner,
  SyncStatusFooter,
  PlanStatusBadge
};
