/**
 * ClientDashboard Component
 * 
 * Main dashboard view for client portal showing progress summary,
 * requirements overview, vendor comparison, and report access.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.3-7B.6)
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Download,
  ChevronRight,
  Calendar,
  Award,
  Star,
  Layers
} from 'lucide-react';
import { clientPortalService } from '../../../services/evaluator/clientPortal.service';
import { approvalsService } from '../../../services/evaluator/approvals.service';
import { RequirementApprovalList } from './RequirementApproval';
import RequirementComments from './RequirementComments';
import './ClientDashboard.css';
import './RequirementApproval.css';
import './RequirementComments.css';

// Portal views (must match parent)
const PORTAL_VIEW = {
  DASHBOARD: 'dashboard',
  REQUIREMENTS: 'requirements',
  APPROVALS: 'approvals',
  VENDORS: 'vendors',
  REPORTS: 'reports'
};

// Priority colors
const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#dc2626', bgColor: '#fef2f2' },
  high: { label: 'High', color: '#ea580c', bgColor: '#fff7ed' },
  medium: { label: 'Medium', color: '#ca8a04', bgColor: '#fefce8' },
  low: { label: 'Low', color: '#16a34a', bgColor: '#f0fdf4' }
};

// MoSCoW colors
const MOSCOW_CONFIG = {
  must: { label: 'Must Have', color: '#dc2626', bgColor: '#fef2f2' },
  should: { label: 'Should Have', color: '#ea580c', bgColor: '#fff7ed' },
  could: { label: 'Could Have', color: '#2563eb', bgColor: '#eff6ff' },
  wont: { label: 'Won\'t Have', color: '#6b7280', bgColor: '#f9fafb' }
};

function ClientDashboard({ view, session, dashboardData, onRefresh, clientInfo, branding }) {
  const [requirementsData, setRequirementsData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [approvalsData, setApprovalsData] = useState(null);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

  const evaluationProjectId = session?.evaluationProject?.id;
  const permissions = session?.client?.permissions || {};

  // Fetch requirements data when requirements view is active
  useEffect(() => {
    if (view === PORTAL_VIEW.REQUIREMENTS && evaluationProjectId && !requirementsData) {
      fetchRequirements();
    }
  }, [view, evaluationProjectId]);

  // Fetch vendor data when vendors view is active
  useEffect(() => {
    if (view === PORTAL_VIEW.VENDORS && evaluationProjectId && !vendorData) {
      fetchVendors();
    }
  }, [view, evaluationProjectId]);

  // Fetch approvals data when approvals view is active
  useEffect(() => {
    if (view === PORTAL_VIEW.APPROVALS && evaluationProjectId && !approvalsData) {
      fetchApprovals();
    }
  }, [view, evaluationProjectId]);

  const fetchRequirements = async () => {
    try {
      setIsLoadingRequirements(true);
      const data = await clientPortalService.getRequirementsSummary(
        evaluationProjectId,
        session?.stakeholderArea?.id // Filter by stakeholder area if assigned
      );
      setRequirementsData(data);
    } catch (err) {
      console.error('Failed to fetch requirements:', err);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true);
      const data = await clientPortalService.getVendorComparison(evaluationProjectId);
      setVendorData(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setIsLoadingApprovals(true);
      // Fetch requirements with their approvals
      const [requirementsResult, approvalSummary] = await Promise.all([
        clientPortalService.getRequirementsSummary(
          evaluationProjectId,
          session?.stakeholderArea?.id
        ),
        approvalsService.getProjectApprovalSummary(evaluationProjectId)
      ]);
      
      // Fetch approvals for each requirement
      const requirements = requirementsResult.requirements || [];
      const approvals = [];
      for (const req of requirements) {
        const reqApprovals = await approvalsService.getByRequirement(req.id);
        approvals.push(...reqApprovals);
      }
      
      setApprovalsData({
        requirements,
        approvals,
        summary: approvalSummary
      });
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const handleApprovalSubmitted = (requirementId, status) => {
    // Refresh approvals data after submission
    fetchApprovals();
  };

  // Render based on active view
  switch (view) {
    case PORTAL_VIEW.DASHBOARD:
      return <DashboardView data={dashboardData} session={session} branding={branding} />;
    case PORTAL_VIEW.REQUIREMENTS:
      return (
        <RequirementsView 
          data={requirementsData} 
          isLoading={isLoadingRequirements}
          stakeholderArea={session?.stakeholderArea}
          clientInfo={clientInfo}
        />
      );
    case PORTAL_VIEW.APPROVALS:
      return (
        <ApprovalsView 
          data={approvalsData}
          isLoading={isLoadingApprovals}
          clientInfo={clientInfo}
          onApprovalSubmitted={handleApprovalSubmitted}
          branding={branding}
        />
      );
    case PORTAL_VIEW.VENDORS:
      return (
        <VendorsView 
          data={vendorData} 
          isLoading={isLoadingVendors}
          permissions={permissions}
          branding={branding}
        />
      );
    case PORTAL_VIEW.REPORTS:
      return (
        <ReportsView 
          session={session} 
          dashboardData={dashboardData}
          branding={branding}
        />
      );
    default:
      return <DashboardView data={dashboardData} session={session} branding={branding} />;
  }
}

/**
 * Dashboard View - Progress Summary
 */
function DashboardView({ data, session }) {
  if (!data) {
    return (
      <div className="client-dashboard-empty">
        <BarChart3 size={48} />
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  const { project, requirements, vendors, workshops, scoring } = data;

  return (
    <div className="client-dashboard">
      {/* Project Header */}
      <div className="client-dashboard-project-header">
        <div className="project-info">
          <h2>{project.name}</h2>
          {project.description && <p>{project.description}</p>}
        </div>
        <div className="project-status">
          <span className={`status-badge status-${project.status}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="client-dashboard-stats">
        <StatCard
          icon={<FileText size={24} />}
          label="Requirements"
          value={requirements.total}
          subtext={`${requirements.approved} approved`}
          color="#3b82f6"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Vendors"
          value={vendors.total}
          subtext={`${vendors.shortlisted} shortlisted`}
          color="#10b981"
        />
        <StatCard
          icon={<Calendar size={24} />}
          label="Workshops"
          value={workshops.total}
          subtext={`${workshops.completed} completed`}
          color="#f59e0b"
        />
        <StatCard
          icon={<Target size={24} />}
          label="Scoring Progress"
          value={`${scoring.progressPercent}%`}
          subtext={`${scoring.scoresEntered} scores entered`}
          color="#8b5cf6"
        />
      </div>

      {/* Progress Section */}
      <div className="client-dashboard-section">
        <h3>
          <TrendingUp size={20} />
          Evaluation Progress
        </h3>
        <div className="progress-grid">
          <ProgressBar 
            label="Requirements Approved"
            current={requirements.approved}
            total={requirements.total}
            color="#10b981"
          />
          <ProgressBar 
            label="Workshops Completed"
            current={workshops.completed}
            total={workshops.total}
            color="#3b82f6"
          />
          <ProgressBar 
            label="Vendors Scored"
            current={scoring.progressPercent}
            total={100}
            isPercent
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Requirements Breakdown */}
      <div className="client-dashboard-section">
        <h3>
          <Layers size={20} />
          Requirements by Priority
        </h3>
        <div className="breakdown-grid">
          {Object.entries(requirements.byPriority || {}).map(([priority, count]) => {
            const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
            return (
              <div 
                key={priority} 
                className="breakdown-item"
                style={{ borderLeftColor: config.color }}
              >
                <span className="breakdown-label">{config.label}</span>
                <span className="breakdown-value">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MoSCoW Breakdown */}
      {Object.keys(requirements.byMosCow || {}).length > 0 && (
        <div className="client-dashboard-section">
          <h3>
            <Target size={20} />
            Requirements by MoSCoW
          </h3>
          <div className="breakdown-grid">
            {Object.entries(requirements.byMosCow || {}).map(([moscow, count]) => {
              const config = MOSCOW_CONFIG[moscow] || MOSCOW_CONFIG.could;
              return (
                <div 
                  key={moscow} 
                  className="breakdown-item"
                  style={{ borderLeftColor: config.color }}
                >
                  <span className="breakdown-label">{config.label}</span>
                  <span className="breakdown-value">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vendor Pipeline */}
      {vendors.total > 0 && (
        <div className="client-dashboard-section">
          <h3>
            <Users size={20} />
            Vendor Pipeline
          </h3>
          <div className="pipeline-visual">
            <PipelineStage 
              label="Long List"
              count={vendors.byStage?.longlist || 0}
              color="#6b7280"
            />
            <ChevronRight size={20} className="pipeline-arrow" />
            <PipelineStage 
              label="Shortlist"
              count={vendors.shortlisted}
              color="#3b82f6"
            />
            <ChevronRight size={20} className="pipeline-arrow" />
            <PipelineStage 
              label="Evaluation"
              count={vendors.inEvaluation}
              color="#f59e0b"
            />
            <ChevronRight size={20} className="pipeline-arrow" />
            <PipelineStage 
              label="Finalist"
              count={vendors.finalist}
              color="#10b981"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Requirements View - Requirements Summary
 */
function RequirementsView({ data, isLoading, stakeholderArea }) {
  if (isLoading) {
    return (
      <div className="client-dashboard-loading">
        <div className="spinner" />
        <span>Loading requirements...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="client-dashboard-empty">
        <FileText size={48} />
        <h3>No Requirements Data</h3>
        <p>Requirements data could not be loaded.</p>
      </div>
    );
  }

  const { requirements, byStakeholderArea, byCategory } = data;

  return (
    <div className="client-dashboard">
      {/* Header */}
      <div className="client-dashboard-view-header">
        <h2>
          <FileText size={24} />
          Requirements Summary
        </h2>
        {stakeholderArea && (
          <span className="stakeholder-filter">
            Filtered by: {stakeholderArea.name}
          </span>
        )}
      </div>

      {/* Summary Stats */}
      <div className="requirements-summary-stats">
        <div className="summary-stat">
          <span className="stat-value">{data.total}</span>
          <span className="stat-label">Total Requirements</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {requirements.filter(r => r.status === 'approved').length}
          </span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {requirements.filter(r => r.status === 'pending_review').length}
          </span>
          <span className="stat-label">Pending Review</span>
        </div>
      </div>

      {/* By Stakeholder Area */}
      {Object.keys(byStakeholderArea).length > 0 && (
        <div className="client-dashboard-section">
          <h3>By Stakeholder Area</h3>
          <div className="requirements-grouped">
            {Object.entries(byStakeholderArea).map(([area, reqs]) => (
              <RequirementGroup 
                key={area}
                title={area}
                requirements={reqs}
              />
            ))}
          </div>
        </div>
      )}

      {/* By Category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="client-dashboard-section">
          <h3>By Category</h3>
          <div className="requirements-grouped">
            {Object.entries(byCategory).map(([category, reqs]) => (
              <RequirementGroup 
                key={category}
                title={category}
                requirements={reqs}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Requirement Group Component
 */
function RequirementGroup({ title, requirements }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="requirement-group">
      <button 
        className="requirement-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="group-title">{title}</span>
        <span className="group-count">{requirements.length}</span>
        <ChevronRight 
          size={18} 
          className={`group-chevron ${isExpanded ? 'expanded' : ''}`}
        />
      </button>
      
      {isExpanded && (
        <div className="requirement-group-content">
          {requirements.map(req => (
            <div key={req.id} className="requirement-item">
              <div className="requirement-item-header">
                <span className="requirement-id">{req.requirement_id}</span>
                <span className={`requirement-status status-${req.status}`}>
                  {req.status === 'approved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {req.status}
                </span>
              </div>
              <p className="requirement-name">{req.name}</p>
              <div className="requirement-meta">
                {req.priority && (
                  <span 
                    className="requirement-priority"
                    style={{ 
                      color: PRIORITY_CONFIG[req.priority]?.color,
                      backgroundColor: PRIORITY_CONFIG[req.priority]?.bgColor
                    }}
                  >
                    {PRIORITY_CONFIG[req.priority]?.label || req.priority}
                  </span>
                )}
                {req.mos_cow && (
                  <span 
                    className="requirement-moscow"
                    style={{ 
                      color: MOSCOW_CONFIG[req.mos_cow]?.color,
                      backgroundColor: MOSCOW_CONFIG[req.mos_cow]?.bgColor
                    }}
                  >
                    {MOSCOW_CONFIG[req.mos_cow]?.label || req.mos_cow}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Approvals View - Requirement Approval Workflow
 */
function ApprovalsView({ data, isLoading, clientInfo, onApprovalSubmitted, branding }) {
  if (isLoading) {
    return (
      <div className="client-dashboard-loading">
        <div className="spinner" />
        <span>Loading approvals...</span>
      </div>
    );
  }

  if (!data || !data.requirements || data.requirements.length === 0) {
    return (
      <div className="client-dashboard-empty">
        <CheckCircle size={48} />
        <h3>No Requirements to Approve</h3>
        <p>Requirements for approval will appear here.</p>
      </div>
    );
  }

  const { requirements, approvals, summary } = data;

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-view-header">
        <h2>
          <CheckCircle size={24} />
          Requirement Approvals
        </h2>
        {summary && (
          <span className="approval-progress-badge">
            {summary.approvedPercent}% approved
          </span>
        )}
      </div>

      {/* Approval Summary */}
      {summary && (
        <div className="approval-stats-bar">
          <div className="stat-item">
            <span className="stat-number">{summary.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item approved">
            <span className="stat-number">{summary.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-item rejected">
            <span className="stat-number">{summary.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
          <div className="stat-item changes">
            <span className="stat-number">{summary.changesRequested}</span>
            <span className="stat-label">Changes</span>
          </div>
          <div className="stat-item pending">
            <span className="stat-number">{summary.noApproval + summary.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      )}

      {/* Approval List */}
      <RequirementApprovalList
        requirements={requirements}
        approvals={approvals}
        clientInfo={clientInfo}
        onApprovalSubmitted={onApprovalSubmitted}
      />
    </div>
  );
}

/**
 * Vendors View - Vendor Comparison
 */
function VendorsView({ data, isLoading, permissions, branding }) {
  if (isLoading) {
    return (
      <div className="client-dashboard-loading">
        <div className="spinner" />
        <span>Loading vendor data...</span>
      </div>
    );
  }

  if (!data || data.vendors.length === 0) {
    return (
      <div className="client-dashboard-empty">
        <Users size={48} />
        <h3>No Vendors to Compare</h3>
        <p>Vendor comparison data is not yet available.</p>
      </div>
    );
  }

  const { vendors, categories } = data;

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-view-header">
        <h2>
          <Users size={24} />
          Vendor Comparison
        </h2>
        <span className="vendor-count">{vendors.length} vendors</span>
      </div>

      {/* Vendor Ranking */}
      <div className="vendor-ranking">
        {vendors.map((vendor, index) => (
          <VendorCard 
            key={vendor.id}
            vendor={vendor}
            rank={index + 1}
            categories={categories}
            showScores={permissions.canViewScores}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Vendor Card Component
 */
function VendorCard({ vendor, rank, categories, showScores }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRankBadge = () => {
    if (rank === 1) return { icon: <Award size={16} />, class: 'gold' };
    if (rank === 2) return { icon: <Award size={16} />, class: 'silver' };
    if (rank === 3) return { icon: <Award size={16} />, class: 'bronze' };
    return { icon: null, class: '' };
  };

  const rankBadge = getRankBadge();

  return (
    <div className={`vendor-card rank-${rank <= 3 ? rank : 'other'}`}>
      <div className="vendor-card-header">
        <div className="vendor-rank">
          {rankBadge.icon && (
            <span className={`rank-badge ${rankBadge.class}`}>
              {rankBadge.icon}
            </span>
          )}
          <span className="rank-number">#{rank}</span>
        </div>
        <div className="vendor-info">
          <h4>{vendor.name}</h4>
          <span className={`vendor-stage stage-${vendor.pipeline_stage}`}>
            {vendor.pipeline_stage}
          </span>
        </div>
        {showScores && (
          <div className="vendor-score">
            <span className="score-value">{vendor.weightedTotal.toFixed(1)}</span>
            <span className="score-label">Overall Score</span>
          </div>
        )}
        <button 
          className="vendor-expand"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronRight 
            size={18} 
            className={isExpanded ? 'expanded' : ''}
          />
        </button>
      </div>

      {isExpanded && showScores && (
        <div className="vendor-card-details">
          <h5>Category Scores</h5>
          <div className="category-scores">
            {categories.map(cat => {
              const catScore = vendor.categoryScores[cat.id];
              return (
                <div key={cat.id} className="category-score-row">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-weight">{cat.weight}%</span>
                  <div className="category-score-bar">
                    <div 
                      className="category-score-fill"
                      style={{ 
                        width: `${(catScore?.score || 0) * 20}%`,
                        backgroundColor: getScoreColor(catScore?.score || 0)
                      }}
                    />
                  </div>
                  <span className="category-score-value">
                    {catScore?.score?.toFixed(1) || '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reports View - Download Reports
 */
function ReportsView({ session, dashboardData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      setGenerateError(null);

      const response = await fetch('/api/evaluator/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationProjectId: session.evaluationProject.id,
          reportType: 'summary',
          format: 'pdf'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.evaluationProject.name}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report generation failed:', err);
      setGenerateError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCSV = async (type) => {
    try {
      setIsGenerating(true);
      setGenerateError(null);

      const response = await fetch('/api/evaluator/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationProjectId: session.evaluationProject.id,
          reportType: type,
          format: 'csv'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.evaluationProject.name}-${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setGenerateError('Failed to generate export. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-view-header">
        <h2>
          <Download size={24} />
          Reports & Exports
        </h2>
      </div>

      {generateError && (
        <div className="report-error">
          <AlertTriangle size={16} />
          {generateError}
        </div>
      )}

      <div className="reports-grid">
        {/* PDF Report */}
        <div className="report-card">
          <div className="report-icon pdf">
            <FileText size={32} />
          </div>
          <div className="report-info">
            <h4>Evaluation Summary Report</h4>
            <p>Complete overview of the evaluation progress, requirements, and vendor rankings.</p>
          </div>
          <button 
            className="report-download-btn"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner-small" />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Requirements CSV */}
        <div className="report-card">
          <div className="report-icon csv">
            <FileText size={32} />
          </div>
          <div className="report-info">
            <h4>Requirements Export</h4>
            <p>Export all requirements with status, priority, and categorization.</p>
          </div>
          <button 
            className="report-download-btn secondary"
            onClick={() => handleDownloadCSV('requirements')}
            disabled={isGenerating}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Scores CSV */}
        {session?.client?.permissions?.canViewScores && (
          <div className="report-card">
            <div className="report-icon csv">
              <BarChart3 size={32} />
            </div>
            <div className="report-info">
              <h4>Vendor Scores Export</h4>
              <p>Export vendor scores and rankings in spreadsheet format.</p>
            </div>
            <button 
              className="report-download-btn secondary"
              onClick={() => handleDownloadCSV('scores')}
              disabled={isGenerating}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
}

function ProgressBar({ label, current, total, isPercent = false, color }) {
  const percent = isPercent ? current : (total > 0 ? (current / total) * 100 : 0);
  
  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {isPercent ? `${current}%` : `${current}/${total}`}
        </span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PipelineStage({ label, count, color }) {
  return (
    <div className="pipeline-stage" style={{ borderColor: color }}>
      <span className="stage-count" style={{ color }}>{count}</span>
      <span className="stage-label">{label}</span>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 4) return '#10b981';
  if (score >= 3) return '#f59e0b';
  return '#ef4444';
}

export default ClientDashboard;
