/**
 * Approval Assistant Widget
 *
 * Dashboard widget that provides AI-powered approval recommendations.
 * Analyzes pending approvals and suggests which items to approve/review.
 * Only shown to users with approval permissions.
 *
 * This is an advisory-only component - no approvals are executed.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Proactive Intelligence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileCheck,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { usePermissions } from '../../hooks/usePermissions';
import { SkeletonWidget } from '../common';
import './ApprovalAssistantWidget.css';

const CATEGORY_CONFIG = {
  timesheets: {
    icon: Clock,
    label: 'Timesheets',
    route: '/timesheets',
    color: '#3b82f6'
  },
  expenses: {
    icon: DollarSign,
    label: 'Expenses',
    route: '/expenses',
    color: '#10b981'
  },
  deliverables: {
    icon: FileCheck,
    label: 'Deliverables',
    route: '/deliverables',
    color: '#8b5cf6'
  }
};

export default function ApprovalAssistantWidget({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  const { canApproveTimesheets, canApproveExpenses, canSignOffDeliverables } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Only show for users with approval permissions
  const hasApprovalPermissions = canApproveTimesheets || canApproveExpenses || canSignOffDeliverables;

  const fetchAnalysis = useCallback(async () => {
    if (!projectId || !hasApprovalPermissions) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-approval-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          categories: [
            canApproveTimesheets && 'timesheets',
            canApproveExpenses && 'expenses',
            canSignOffDeliverables && 'deliverables'
          ].filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze approvals');
      }

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Approval assistant error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, hasApprovalPermissions, canApproveTimesheets, canApproveExpenses, canSignOffDeliverables]);

  useEffect(() => {
    if (hasApprovalPermissions) {
      fetchAnalysis();
    }
  }, [fetchAnalysis, refreshTrigger, hasApprovalPermissions]);

  // Don't render if user has no approval permissions
  if (!hasApprovalPermissions) {
    return null;
  }

  if (loading) {
    return <SkeletonWidget title="Approval Assistant" />;
  }

  // Calculate totals
  const totalPending = analysis?.summary?.totalPending || 0;
  const recommendApprove = analysis?.summary?.recommendApprove || 0;
  const needsReview = analysis?.summary?.needsReview || 0;

  // Don't show if nothing pending
  if (!error && totalPending === 0) {
    return null;
  }

  return (
    <div className="approval-widget">
      {/* Header */}
      <div
        className="approval-widget-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="approval-widget-title">
          <Sparkles size={18} className="approval-icon-ai" />
          <span>Approval Assistant</span>
          {totalPending > 0 && (
            <span className="approval-badge">{totalPending} pending</span>
          )}
        </div>
        <div className="approval-widget-actions">
          <button
            className="approval-refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              fetchAnalysis();
            }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {error ? (
        <div className="approval-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchAnalysis}>Retry</button>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="approval-summary">
            <div className="approval-summary-item recommend">
              <ThumbsUp size={16} />
              <div>
                <span className="summary-value">{recommendApprove}</span>
                <span className="summary-label">Recommend Approve</span>
              </div>
            </div>
            <div className="approval-summary-item review">
              <Eye size={16} />
              <div>
                <span className="summary-value">{needsReview}</span>
                <span className="summary-label">Needs Review</span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && analysis?.categories && (
            <div className="approval-details">
              {Object.entries(analysis.categories).map(([category, data]) => {
                const config = CATEGORY_CONFIG[category];
                if (!config || !data || data.total === 0) return null;

                const Icon = config.icon;

                return (
                  <div
                    key={category}
                    className="approval-category"
                    onClick={() => navigate(config.route)}
                  >
                    <div className="approval-category-header">
                      <div className="approval-category-icon" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="approval-category-info">
                        <span className="approval-category-name">{config.label}</span>
                        <span className="approval-category-count">
                          {data.total} pending
                          {data.totalValue && ` (${formatCurrency(data.totalValue)})`}
                        </span>
                      </div>
                      <ChevronRight size={16} className="approval-category-arrow" />
                    </div>

                    {/* AI Recommendation */}
                    {data.recommendation && (
                      <div className="approval-category-rec">
                        <Sparkles size={12} />
                        {data.recommendation}
                      </div>
                    )}

                    {/* Flagged Items */}
                    {data.flagged && data.flagged.length > 0 && (
                      <div className="approval-flagged">
                        <AlertTriangle size={12} />
                        <span>
                          {data.flagged.length} flagged: {data.flagged.slice(0, 2).map(f => f.reason).join(', ')}
                          {data.flagged.length > 2 && ` +${data.flagged.length - 2} more`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Overall AI Insight */}
              {analysis.insight && (
                <div className="approval-insight">
                  <Sparkles size={14} />
                  <p>{analysis.insight}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="approval-footer">
        <Sparkles size={12} />
        <span>AI recommendations - review before approving</span>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(amount);
}
