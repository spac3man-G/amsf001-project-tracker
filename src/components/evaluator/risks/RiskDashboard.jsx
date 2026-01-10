/**
 * RiskDashboard Component
 * Part of: Evaluator Product Roadmap v1.0.x - Feature 0.9: Risk Dashboard
 *
 * Comprehensive risk and issue management dashboard with risk matrix,
 * statistics, and management workflows.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Building,
  Edit2,
  Trash2,
  MessageSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertOctagon,
} from 'lucide-react';
import risksService, {
  RISK_CATEGORIES,
  RISK_CATEGORY_CONFIG,
  PROBABILITY_LEVELS,
  PROBABILITY_CONFIG,
  IMPACT_LEVELS,
  IMPACT_CONFIG,
  RISK_LEVELS,
  RISK_LEVEL_CONFIG,
  MITIGATION_STATUSES,
  MITIGATION_STATUS_CONFIG,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_CONFIG,
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_CONFIG,
  ISSUE_STATUSES,
  ISSUE_STATUS_CONFIG,
} from '../../../services/evaluator/risks.service';
import './RiskDashboard.css';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function RiskDashboard({ evaluationProjectId, currentUserId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [risks, setRisks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);

  // Filters
  const [riskFilters, setRiskFilters] = useState({});
  const [issueFilters, setIssueFilters] = useState({});

  // Load data
  const loadData = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const [dashboard, riskData, issueData] = await Promise.all([
        risksService.getDashboardData(evaluationProjectId),
        risksService.getRisks(evaluationProjectId, riskFilters),
        risksService.getIssues(evaluationProjectId, issueFilters),
      ]);

      setDashboardData(dashboard);
      setRisks(riskData);
      setIssues(issueData);
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError('Failed to load risk dashboard');
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId, riskFilters, issueFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Risk handlers
  const handleCreateRisk = async (riskData) => {
    try {
      await risksService.createRisk({
        ...riskData,
        evaluation_project_id: evaluationProjectId,
        identified_by: currentUserId,
      });
      await loadData();
      setShowRiskModal(false);
    } catch (err) {
      console.error('Error creating risk:', err);
      alert('Failed to create risk');
    }
  };

  const handleUpdateRisk = async (riskId, updates) => {
    try {
      await risksService.updateRisk(riskId, updates, currentUserId);
      await loadData();
      setEditingRisk(null);
    } catch (err) {
      console.error('Error updating risk:', err);
      alert('Failed to update risk');
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!confirm('Are you sure you want to delete this risk?')) return;
    try {
      await risksService.deleteRisk(riskId);
      await loadData();
    } catch (err) {
      console.error('Error deleting risk:', err);
      alert('Failed to delete risk');
    }
  };

  // Issue handlers
  const handleCreateIssue = async (issueData) => {
    try {
      await risksService.createIssue({
        ...issueData,
        evaluation_project_id: evaluationProjectId,
        reported_by: currentUserId,
      });
      await loadData();
      setShowIssueModal(false);
    } catch (err) {
      console.error('Error creating issue:', err);
      alert('Failed to create issue');
    }
  };

  const handleUpdateIssue = async (issueId, updates) => {
    try {
      await risksService.updateIssue(issueId, updates, currentUserId);
      await loadData();
      setEditingIssue(null);
    } catch (err) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    try {
      await risksService.deleteIssue(issueId);
      await loadData();
    } catch (err) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue');
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="risk-dashboard">
        <div className="risk-loading">
          <div className="risk-loading-spinner" />
          <p>Loading risk dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-dashboard">
        <div className="risk-error">
          <AlertCircle size={48} />
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={loadData} className="risk-btn risk-btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-dashboard">
      {/* Header */}
      <div className="risk-header">
        <div className="risk-header-left">
          <h1>Risk & Issue Management</h1>
          <p>Track and mitigate procurement risks</p>
        </div>
        <div className="risk-header-actions">
          <button
            onClick={() => setShowIssueModal(true)}
            className="risk-btn"
          >
            <Plus size={16} />
            New Issue
          </button>
          <button
            onClick={() => setShowRiskModal(true)}
            className="risk-btn risk-btn-primary"
          >
            <Plus size={16} />
            New Risk
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="risk-tabs">
        <button
          className={`risk-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button
          className={`risk-tab ${activeTab === 'risks' ? 'active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle size={16} />
          Risks
          {dashboardData?.riskStats?.activeCount > 0 && (
            <span className="risk-tab-badge">{dashboardData.riskStats.activeCount}</span>
          )}
        </button>
        <button
          className={`risk-tab ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          <AlertOctagon size={16} />
          Issues
          {dashboardData?.issueStats?.openCount > 0 && (
            <span className="risk-tab-badge">{dashboardData.issueStats.openCount}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="risk-content">
        {activeTab === 'overview' && dashboardData && (
          <OverviewTab
            data={dashboardData}
            onRiskClick={(risk) => setEditingRisk(risk)}
            onIssueClick={(issue) => setEditingIssue(issue)}
          />
        )}

        {activeTab === 'risks' && (
          <RisksTab
            risks={risks}
            filters={riskFilters}
            onFilterChange={setRiskFilters}
            onEdit={(risk) => setEditingRisk(risk)}
            onDelete={handleDeleteRisk}
            onStatusChange={(id, status) => handleUpdateRisk(id, { mitigation_status: status })}
          />
        )}

        {activeTab === 'issues' && (
          <IssuesTab
            issues={issues}
            filters={issueFilters}
            onFilterChange={setIssueFilters}
            onEdit={(issue) => setEditingIssue(issue)}
            onDelete={handleDeleteIssue}
            onStatusChange={(id, status) => handleUpdateIssue(id, { status })}
          />
        )}
      </div>

      {/* Risk Modal */}
      {(showRiskModal || editingRisk) && (
        <RiskModal
          risk={editingRisk}
          onSave={editingRisk
            ? (data) => handleUpdateRisk(editingRisk.id, data)
            : handleCreateRisk
          }
          onClose={() => {
            setShowRiskModal(false);
            setEditingRisk(null);
          }}
        />
      )}

      {/* Issue Modal */}
      {(showIssueModal || editingIssue) && (
        <IssueModal
          issue={editingIssue}
          onSave={editingIssue
            ? (data) => handleUpdateIssue(editingIssue.id, data)
            : handleCreateIssue
          }
          onClose={() => {
            setShowIssueModal(false);
            setEditingIssue(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ data, onRiskClick, onIssueClick }) {
  const { riskStats, issueStats, topRisks, urgentIssues, riskMatrix } = data;

  return (
    <div className="risk-overview">
      {/* Stats Cards */}
      <div className="risk-stats-grid">
        <StatCard
          label="Active Risks"
          value={riskStats.activeCount}
          icon={<AlertTriangle />}
          variant="warning"
          subtitle={`${riskStats.byLevel.critical} critical, ${riskStats.byLevel.high} high`}
        />
        <StatCard
          label="Open Issues"
          value={issueStats.openCount}
          icon={<AlertOctagon />}
          variant="danger"
          subtitle={`${issueStats.byPriority.critical} critical, ${issueStats.byPriority.high} high`}
        />
        <StatCard
          label="Overdue Items"
          value={riskStats.overdue + issueStats.overdue}
          icon={<Clock />}
          variant={riskStats.overdue + issueStats.overdue > 0 ? 'danger' : 'success'}
          subtitle={`${riskStats.dueSoon + issueStats.dueSoon} due this week`}
        />
        <StatCard
          label="Closed/Resolved"
          value={riskStats.closedCount + issueStats.resolvedCount}
          icon={<CheckCircle />}
          variant="success"
          subtitle="Total completed"
        />
      </div>

      {/* Risk Matrix */}
      <div className="risk-matrix-section">
        <h3>Risk Matrix</h3>
        <RiskMatrix matrix={riskMatrix} onRiskClick={onRiskClick} />
      </div>

      {/* Top Risks & Urgent Issues */}
      <div className="risk-lists-grid">
        <div className="risk-list-section">
          <h3>
            <AlertTriangle size={18} />
            Top Risks
          </h3>
          {topRisks.length === 0 ? (
            <p className="risk-empty-list">No critical or high risks</p>
          ) : (
            <div className="risk-mini-list">
              {topRisks.map(risk => (
                <MiniRiskCard
                  key={risk.id}
                  risk={risk}
                  onClick={() => onRiskClick(risk)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="risk-list-section">
          <h3>
            <AlertOctagon size={18} />
            Urgent Issues
          </h3>
          {urgentIssues.length === 0 ? (
            <p className="risk-empty-list">No critical or high priority issues</p>
          ) : (
            <div className="risk-mini-list">
              {urgentIssues.map(issue => (
                <MiniIssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick(issue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RISK MATRIX
// ============================================================================

function RiskMatrix({ matrix, onRiskClick }) {
  const probabilities = ['high', 'medium', 'low'];
  const impacts = ['low', 'medium', 'high'];

  const getCellColor = (prob, imp) => {
    const score = PROBABILITY_CONFIG[prob].value * IMPACT_CONFIG[imp].value;
    if (score >= 6) return 'critical';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  };

  return (
    <div className="risk-matrix">
      <div className="risk-matrix-y-label">Probability</div>
      <div className="risk-matrix-grid">
        {/* Y-axis labels */}
        <div className="risk-matrix-y-axis">
          {probabilities.map(prob => (
            <div key={prob} className="risk-matrix-y-tick">
              {PROBABILITY_CONFIG[prob].label}
            </div>
          ))}
        </div>

        {/* Matrix cells */}
        <div className="risk-matrix-cells">
          {probabilities.map(prob => (
            <div key={prob} className="risk-matrix-row">
              {impacts.map(imp => {
                const risks = matrix[prob]?.[imp] || [];
                const cellColor = getCellColor(prob, imp);
                return (
                  <div
                    key={`${prob}-${imp}`}
                    className={`risk-matrix-cell ${cellColor}`}
                  >
                    {risks.length > 0 && (
                      <div className="risk-matrix-cell-content">
                        <span className="risk-matrix-count">{risks.length}</span>
                        <div className="risk-matrix-dots">
                          {risks.slice(0, 3).map((r, i) => (
                            <div
                              key={r.id}
                              className="risk-matrix-dot"
                              title={r.title}
                              onClick={() => onRiskClick(r)}
                            />
                          ))}
                          {risks.length > 3 && (
                            <span className="risk-matrix-more">+{risks.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="risk-matrix-x-axis">
          {impacts.map(imp => (
            <div key={imp} className="risk-matrix-x-tick">
              {IMPACT_CONFIG[imp].label}
            </div>
          ))}
        </div>
      </div>
      <div className="risk-matrix-x-label">Impact</div>
    </div>
  );
}

// ============================================================================
// RISKS TAB
// ============================================================================

function RisksTab({ risks, filters, onFilterChange, onEdit, onDelete, onStatusChange }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="risk-tab-content">
      <div className="risk-tab-header">
        <h3>{risks.length} Risks</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`risk-btn risk-btn-sm ${showFilters ? 'active' : ''}`}
        >
          <Filter size={14} />
          Filters
        </button>
      </div>

      {showFilters && (
        <RiskFilters filters={filters} onChange={onFilterChange} />
      )}

      <div className="risk-cards-list">
        {risks.length === 0 ? (
          <div className="risk-empty-state">
            <AlertTriangle size={48} />
            <h4>No Risks Found</h4>
            <p>No risks match your current filters.</p>
          </div>
        ) : (
          risks.map(risk => (
            <RiskCard
              key={risk.id}
              risk={risk}
              onEdit={() => onEdit(risk)}
              onDelete={() => onDelete(risk.id)}
              onStatusChange={(status) => onStatusChange(risk.id, status)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ISSUES TAB
// ============================================================================

function IssuesTab({ issues, filters, onFilterChange, onEdit, onDelete, onStatusChange }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="risk-tab-content">
      <div className="risk-tab-header">
        <h3>{issues.length} Issues</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`risk-btn risk-btn-sm ${showFilters ? 'active' : ''}`}
        >
          <Filter size={14} />
          Filters
        </button>
      </div>

      {showFilters && (
        <IssueFilters filters={filters} onChange={onFilterChange} />
      )}

      <div className="risk-cards-list">
        {issues.length === 0 ? (
          <div className="risk-empty-state">
            <AlertOctagon size={48} />
            <h4>No Issues Found</h4>
            <p>No issues match your current filters.</p>
          </div>
        ) : (
          issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onEdit={() => onEdit(issue)}
              onDelete={() => onDelete(issue.id)}
              onStatusChange={(status) => onStatusChange(issue.id, status)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ label, value, icon, variant, subtitle }) {
  return (
    <div className={`risk-stat-card ${variant || ''}`}>
      <div className="risk-stat-icon">{icon}</div>
      <div className="risk-stat-content">
        <div className="risk-stat-value">{value}</div>
        <div className="risk-stat-label">{label}</div>
        {subtitle && <div className="risk-stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// MINI CARDS
// ============================================================================

function MiniRiskCard({ risk, onClick }) {
  const levelConfig = RISK_LEVEL_CONFIG[risk.risk_level] || {};
  const categoryConfig = RISK_CATEGORY_CONFIG[risk.risk_category] || {};

  return (
    <div className="risk-mini-card" onClick={onClick}>
      <div
        className="risk-mini-level"
        style={{ backgroundColor: levelConfig.color }}
      />
      <div className="risk-mini-content">
        <h4>{risk.risk_title}</h4>
        <div className="risk-mini-meta">
          <span className="risk-mini-category" style={{ color: categoryConfig.color }}>
            {categoryConfig.label}
          </span>
          <span className={`risk-mini-status ${risk.mitigation_status}`}>
            {MITIGATION_STATUS_CONFIG[risk.mitigation_status]?.label}
          </span>
        </div>
      </div>
      <ChevronRight size={16} className="risk-mini-arrow" />
    </div>
  );
}

function MiniIssueCard({ issue, onClick }) {
  const priorityConfig = ISSUE_PRIORITY_CONFIG[issue.priority] || {};

  return (
    <div className="risk-mini-card" onClick={onClick}>
      <div
        className="risk-mini-level"
        style={{ backgroundColor: priorityConfig.color }}
      />
      <div className="risk-mini-content">
        <h4>{issue.issue_title}</h4>
        <div className="risk-mini-meta">
          <span>{ISSUE_CATEGORY_CONFIG[issue.issue_category]?.label}</span>
          <span className={`risk-mini-status ${issue.status}`}>
            {ISSUE_STATUS_CONFIG[issue.status]?.label}
          </span>
        </div>
      </div>
      <ChevronRight size={16} className="risk-mini-arrow" />
    </div>
  );
}

// ============================================================================
// RISK CARD
// ============================================================================

function RiskCard({ risk, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const levelConfig = RISK_LEVEL_CONFIG[risk.risk_level] || {};
  const categoryConfig = RISK_CATEGORY_CONFIG[risk.risk_category] || {};
  const statusConfig = MITIGATION_STATUS_CONFIG[risk.mitigation_status] || {};

  return (
    <div className={`risk-card level-${risk.risk_level}`}>
      <div className="risk-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="risk-card-level" style={{ backgroundColor: levelConfig.color }}>
          {risk.risk_score}
        </div>
        <div className="risk-card-main">
          <h4>{risk.risk_title}</h4>
          <div className="risk-card-meta">
            <span
              className="risk-card-category"
              style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
            >
              {categoryConfig.label}
            </span>
            <span
              className="risk-card-status"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {risk.vendors?.name && (
              <span className="risk-card-vendor">
                <Building size={12} />
                {risk.vendors.name}
              </span>
            )}
          </div>
        </div>
        <div className="risk-card-assessment">
          <div className="risk-assessment-item">
            <span className="risk-assessment-label">P</span>
            <span className={`risk-assessment-value ${risk.probability}`}>
              {risk.probability?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="risk-assessment-x">×</span>
          <div className="risk-assessment-item">
            <span className="risk-assessment-label">I</span>
            <span className={`risk-assessment-value ${risk.impact}`}>
              {risk.impact?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <button className="risk-expand-btn">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="risk-card-body">
          {risk.risk_description && (
            <p className="risk-card-description">{risk.risk_description}</p>
          )}

          <div className="risk-card-details">
            {risk.mitigation_plan && (
              <div className="risk-detail">
                <label>Mitigation Plan</label>
                <p>{risk.mitigation_plan}</p>
              </div>
            )}
            <div className="risk-detail-row">
              {risk.mitigation_owner?.full_name && (
                <div className="risk-detail">
                  <label>Owner</label>
                  <span><User size={12} /> {risk.mitigation_owner.full_name}</span>
                </div>
              )}
              {risk.mitigation_due_date && (
                <div className="risk-detail">
                  <label>Due Date</label>
                  <span><Calendar size={12} /> {new Date(risk.mitigation_due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="risk-card-actions">
            <select
              value={risk.mitigation_status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="risk-status-select"
            >
              {Object.entries(MITIGATION_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <button onClick={onEdit} className="risk-btn risk-btn-sm">
              <Edit2 size={14} />
              Edit
            </button>
            <button onClick={onDelete} className="risk-btn risk-btn-sm risk-btn-ghost">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ISSUE CARD
// ============================================================================

function IssueCard({ issue, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const priorityConfig = ISSUE_PRIORITY_CONFIG[issue.priority] || {};
  const categoryConfig = ISSUE_CATEGORY_CONFIG[issue.issue_category] || {};
  const statusConfig = ISSUE_STATUS_CONFIG[issue.status] || {};

  return (
    <div className={`risk-card priority-${issue.priority}`}>
      <div className="risk-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="risk-card-level" style={{ backgroundColor: priorityConfig.color }}>
          {issue.priority?.charAt(0).toUpperCase()}
        </div>
        <div className="risk-card-main">
          <h4>{issue.issue_title}</h4>
          <div className="risk-card-meta">
            <span
              className="risk-card-category"
              style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
            >
              {categoryConfig.label}
            </span>
            <span
              className="risk-card-status"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {issue.vendors?.name && (
              <span className="risk-card-vendor">
                <Building size={12} />
                {issue.vendors.name}
              </span>
            )}
          </div>
        </div>
        <button className="risk-expand-btn">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="risk-card-body">
          {issue.issue_description && (
            <p className="risk-card-description">{issue.issue_description}</p>
          )}

          <div className="risk-card-details">
            {issue.resolution_plan && (
              <div className="risk-detail">
                <label>Resolution Plan</label>
                <p>{issue.resolution_plan}</p>
              </div>
            )}
            <div className="risk-detail-row">
              {issue.resolution_owner?.full_name && (
                <div className="risk-detail">
                  <label>Owner</label>
                  <span><User size={12} /> {issue.resolution_owner.full_name}</span>
                </div>
              )}
              {issue.resolution_due_date && (
                <div className="risk-detail">
                  <label>Due Date</label>
                  <span><Calendar size={12} /> {new Date(issue.resolution_due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="risk-card-actions">
            <select
              value={issue.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="risk-status-select"
            >
              {Object.entries(ISSUE_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <button onClick={onEdit} className="risk-btn risk-btn-sm">
              <Edit2 size={14} />
              Edit
            </button>
            <button onClick={onDelete} className="risk-btn risk-btn-sm risk-btn-ghost">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTERS
// ============================================================================

function RiskFilters({ filters, onChange }) {
  return (
    <div className="risk-filters">
      <select
        value={filters.category || ''}
        onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
      >
        <option value="">All Categories</option>
        {Object.entries(RISK_CATEGORY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <select
        value={filters.riskLevel || ''}
        onChange={(e) => onChange({ ...filters, riskLevel: e.target.value || undefined })}
      >
        <option value="">All Levels</option>
        {Object.entries(RISK_LEVEL_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
      >
        <option value="">Active Only</option>
        {Object.entries(MITIGATION_STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <label className="risk-checkbox">
        <input
          type="checkbox"
          checked={filters.includeClosed || false}
          onChange={(e) => onChange({ ...filters, includeClosed: e.target.checked })}
        />
        Include Closed
      </label>
    </div>
  );
}

function IssueFilters({ filters, onChange }) {
  return (
    <div className="risk-filters">
      <select
        value={filters.category || ''}
        onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
      >
        <option value="">All Categories</option>
        {Object.entries(ISSUE_CATEGORY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <select
        value={filters.priority || ''}
        onChange={(e) => onChange({ ...filters, priority: e.target.value || undefined })}
      >
        <option value="">All Priorities</option>
        {Object.entries(ISSUE_PRIORITY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
      >
        <option value="">Open Only</option>
        {Object.entries(ISSUE_STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <label className="risk-checkbox">
        <input
          type="checkbox"
          checked={filters.includeClosed || false}
          onChange={(e) => onChange({ ...filters, includeClosed: e.target.checked })}
        />
        Include Closed
      </label>
    </div>
  );
}

// ============================================================================
// RISK MODAL
// ============================================================================

function RiskModal({ risk, onSave, onClose }) {
  const [formData, setFormData] = useState({
    risk_title: risk?.risk_title || '',
    risk_description: risk?.risk_description || '',
    risk_category: risk?.risk_category || 'technical',
    probability: risk?.probability || 'medium',
    impact: risk?.impact || 'medium',
    mitigation_plan: risk?.mitigation_plan || '',
    mitigation_owner_name: risk?.mitigation_owner_name || '',
    mitigation_due_date: risk?.mitigation_due_date || '',
    mitigation_status: risk?.mitigation_status || 'identified',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.risk_title.trim()) return;
    onSave(formData);
  };

  return (
    <div className="risk-modal-overlay" onClick={onClose}>
      <div className="risk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="risk-modal-header">
          <h3>{risk ? 'Edit Risk' : 'New Risk'}</h3>
          <button onClick={onClose} className="risk-modal-close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="risk-modal-body">
            <div className="risk-form-group">
              <label>Risk Title *</label>
              <input
                type="text"
                value={formData.risk_title}
                onChange={(e) => setFormData({ ...formData, risk_title: e.target.value })}
                placeholder="Brief description of the risk"
                required
              />
            </div>

            <div className="risk-form-group">
              <label>Description</label>
              <textarea
                value={formData.risk_description}
                onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                placeholder="Detailed description of the risk and its potential impact"
                rows={3}
              />
            </div>

            <div className="risk-form-row">
              <div className="risk-form-group">
                <label>Category</label>
                <select
                  value={formData.risk_category}
                  onChange={(e) => setFormData({ ...formData, risk_category: e.target.value })}
                >
                  {Object.entries(RISK_CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="risk-form-group">
                <label>Status</label>
                <select
                  value={formData.mitigation_status}
                  onChange={(e) => setFormData({ ...formData, mitigation_status: e.target.value })}
                >
                  {Object.entries(MITIGATION_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="risk-form-row">
              <div className="risk-form-group">
                <label>Probability</label>
                <select
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                >
                  {Object.entries(PROBABILITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="risk-form-group">
                <label>Impact</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                >
                  {Object.entries(IMPACT_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="risk-form-group">
              <label>Mitigation Plan</label>
              <textarea
                value={formData.mitigation_plan}
                onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                placeholder="Steps to mitigate or reduce this risk"
                rows={3}
              />
            </div>

            <div className="risk-form-row">
              <div className="risk-form-group">
                <label>Owner</label>
                <input
                  type="text"
                  value={formData.mitigation_owner_name}
                  onChange={(e) => setFormData({ ...formData, mitigation_owner_name: e.target.value })}
                  placeholder="Person responsible"
                />
              </div>
              <div className="risk-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.mitigation_due_date}
                  onChange={(e) => setFormData({ ...formData, mitigation_due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="risk-modal-footer">
            <button type="button" onClick={onClose} className="risk-btn">
              Cancel
            </button>
            <button type="submit" className="risk-btn risk-btn-primary">
              {risk ? 'Update Risk' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ISSUE MODAL
// ============================================================================

function IssueModal({ issue, onSave, onClose }) {
  const [formData, setFormData] = useState({
    issue_title: issue?.issue_title || '',
    issue_description: issue?.issue_description || '',
    issue_category: issue?.issue_category || 'technical',
    priority: issue?.priority || 'medium',
    resolution_plan: issue?.resolution_plan || '',
    resolution_owner_name: issue?.resolution_owner_name || '',
    resolution_due_date: issue?.resolution_due_date || '',
    status: issue?.status || 'open',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.issue_title.trim()) return;
    onSave(formData);
  };

  return (
    <div className="risk-modal-overlay" onClick={onClose}>
      <div className="risk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="risk-modal-header">
          <h3>{issue ? 'Edit Issue' : 'New Issue'}</h3>
          <button onClick={onClose} className="risk-modal-close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="risk-modal-body">
            <div className="risk-form-group">
              <label>Issue Title *</label>
              <input
                type="text"
                value={formData.issue_title}
                onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div className="risk-form-group">
              <label>Description</label>
              <textarea
                value={formData.issue_description}
                onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                placeholder="Detailed description of the issue"
                rows={3}
              />
            </div>

            <div className="risk-form-row">
              <div className="risk-form-group">
                <label>Category</label>
                <select
                  value={formData.issue_category}
                  onChange={(e) => setFormData({ ...formData, issue_category: e.target.value })}
                >
                  {Object.entries(ISSUE_CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="risk-form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {Object.entries(ISSUE_PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="risk-form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {Object.entries(ISSUE_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="risk-form-group">
              <label>Resolution Plan</label>
              <textarea
                value={formData.resolution_plan}
                onChange={(e) => setFormData({ ...formData, resolution_plan: e.target.value })}
                placeholder="Steps to resolve this issue"
                rows={3}
              />
            </div>

            <div className="risk-form-row">
              <div className="risk-form-group">
                <label>Owner</label>
                <input
                  type="text"
                  value={formData.resolution_owner_name}
                  onChange={(e) => setFormData({ ...formData, resolution_owner_name: e.target.value })}
                  placeholder="Person responsible"
                />
              </div>
              <div className="risk-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.resolution_due_date}
                  onChange={(e) => setFormData({ ...formData, resolution_due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="risk-modal-footer">
            <button type="button" onClick={onClose} className="risk-btn">
              Cancel
            </button>
            <button type="submit" className="risk-btn risk-btn-primary">
              {issue ? 'Update Issue' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { RiskCard, IssueCard, RiskMatrix, StatCard };
