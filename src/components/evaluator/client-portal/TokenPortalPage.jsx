/**
 * Token-Based Client Portal Page
 *
 * Public-facing portal for external stakeholders to review and approve requirements.
 * Authentication is done via URL tokens (no user account required).
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Shield,
  LogOut,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  CheckSquare,
  LayoutDashboard,
  PenLine,
  RefreshCw
} from 'lucide-react';
import PropTypes from 'prop-types';
import RequirementApprovalList from './RequirementApprovalList';
import ApprovalProgressBar from './ApprovalProgressBar';
import FinalApprovalModal from './FinalApprovalModal';
import './TokenPortalPage.css';

// Portal states
const PORTAL_STATE = {
  LOADING: 'loading',
  VALID: 'valid',
  INVALID: 'invalid',
  EXPIRED: 'expired'
};

// Filter options
const FILTER_OPTIONS = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'changes_requested'
};

// Default branding
const DEFAULT_BRANDING = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  backgroundColor: '#f8fafc'
};

function TokenPortalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Portal state
  const [portalState, setPortalState] = useState(PORTAL_STATE.LOADING);
  const [portalData, setPortalData] = useState(null);
  const [error, setError] = useState(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS.ALL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFinalApproval, setShowFinalApproval] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Extract branding
  const branding = useMemo(() => {
    const projectBranding = portalData?.project?.branding || {};
    return {
      primaryColor: projectBranding.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: projectBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      backgroundColor: projectBranding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
      logoUrl: projectBranding.logoUrl || portalData?.project?.client_logo_url
    };
  }, [portalData]);

  // CSS variables for branding
  const brandingStyle = useMemo(() => ({
    '--portal-primary': branding.primaryColor,
    '--portal-secondary': branding.secondaryColor,
    '--portal-bg': branding.backgroundColor
  }), [branding]);

  // Validate token and load portal data
  const loadPortalData = useCallback(async (showRefresh = false) => {
    if (!token) {
      setPortalState(PORTAL_STATE.INVALID);
      setError('No access token provided');
      return;
    }

    try {
      if (showRefresh) setIsRefreshing(true);
      else setPortalState(PORTAL_STATE.LOADING);

      const response = await fetch('/api/evaluator/client-portal-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', token })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setPortalState(PORTAL_STATE.EXPIRED);
          setError(data.message || 'Access token has expired');
        } else {
          setPortalState(PORTAL_STATE.INVALID);
          setError(data.message || 'Invalid access token');
        }
        return;
      }

      setPortalData(data);
      setPortalState(PORTAL_STATE.VALID);
    } catch (err) {
      console.error('Portal load error:', err);
      setPortalState(PORTAL_STATE.INVALID);
      setError('Failed to load portal data');
    } finally {
      setIsRefreshing(false);
    }
  }, [token]);

  // Load on mount
  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Handle approval submission
  const handleApproval = async (requirementId, approval) => {
    try {
      const response = await fetch('/api/evaluator/client-portal-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          token,
          requirementId,
          approval
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit approval');
      }

      // Refresh data
      await loadPortalData(true);

      setSuccessMessage('Approval submitted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      return data;
    } catch (err) {
      console.error('Approval error:', err);
      throw err;
    }
  };

  // Handle batch approval
  const handleBatchApproval = async (requirementIds, approval) => {
    try {
      const response = await fetch('/api/evaluator/client-portal-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-approve',
          token,
          requirementIds,
          approval
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit approvals');
      }

      // Refresh data
      await loadPortalData(true);

      setSuccessMessage(`${data.count} requirements approved successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);

      return data;
    } catch (err) {
      console.error('Batch approval error:', err);
      throw err;
    }
  };

  // Handle final approval
  const handleFinalApproval = async (approval) => {
    try {
      const response = await fetch('/api/evaluator/client-portal-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'final-approval',
          token,
          approval
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit final approval');
      }

      // Refresh data
      await loadPortalData(true);
      setShowFinalApproval(false);

      setSuccessMessage('Final approval submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);

      return data;
    } catch (err) {
      console.error('Final approval error:', err);
      throw err;
    }
  };

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    if (!portalData?.requirements) return [];

    const userEmail = portalData.user?.email;

    return portalData.requirements.filter(req => {
      if (activeFilter === FILTER_OPTIONS.ALL) return true;

      const myApproval = (req.requirement_approvals || []).find(
        a => a.client_email === userEmail
      );

      switch (activeFilter) {
        case FILTER_OPTIONS.PENDING:
          return !myApproval || myApproval.status === 'pending';
        case FILTER_OPTIONS.APPROVED:
          return myApproval?.status === 'approved';
        case FILTER_OPTIONS.CHANGES_REQUESTED:
          return myApproval?.status === 'changes_requested';
        default:
          return true;
      }
    });
  }, [portalData, activeFilter]);

  // Render loading state
  if (portalState === PORTAL_STATE.LOADING) {
    return (
      <div className="token-portal token-portal-loading" style={brandingStyle}>
        <div className="loading-container">
          <div className="spinner" />
          <p>Validating access...</p>
        </div>
      </div>
    );
  }

  // Render invalid/expired state
  if (portalState === PORTAL_STATE.INVALID || portalState === PORTAL_STATE.EXPIRED) {
    return (
      <div className="token-portal token-portal-error" style={brandingStyle}>
        <div className="error-container">
          <Shield size={48} className="error-icon" />
          <h1>{portalState === PORTAL_STATE.EXPIRED ? 'Access Expired' : 'Access Denied'}</h1>
          <p>{error}</p>
          <p className="error-help">
            Please contact your evaluation team for a new access link.
          </p>
        </div>
      </div>
    );
  }

  // Render authenticated portal
  const { project, user, permissions, approvalStats, canSubmitFinalApproval, userAreaApproval } = portalData;

  return (
    <div className="token-portal" style={brandingStyle}>
      {/* Header */}
      <header className="token-portal-header">
        <div className="portal-brand">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="portal-logo" />
          ) : (
            <Building2 size={28} style={{ color: branding.primaryColor }} />
          )}
          <div className="portal-title">
            <h1>{project?.name || 'Requirements Review'}</h1>
            <p>{project?.client_name}</p>
          </div>
        </div>
        <div className="portal-user-info">
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            {user?.stakeholderArea && (
              <span
                className="user-area"
                style={{ backgroundColor: user.stakeholderArea.color || branding.primaryColor }}
              >
                {user.stakeholderArea.name}
              </span>
            )}
          </div>
          <button
            className="refresh-btn"
            onClick={() => loadPortalData(true)}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="token-portal-main">
        {/* Progress Section */}
        <section className="portal-section progress-section">
          <h2>
            <LayoutDashboard size={20} />
            Approval Progress
          </h2>
          <ApprovalProgressBar stats={approvalStats} branding={branding} />

          {/* Final Approval Status */}
          {userAreaApproval ? (
            <div className="final-approval-status approved">
              <CheckCircle size={20} />
              <div>
                <strong>Final Approval Submitted</strong>
                <p>
                  Signed by {userAreaApproval.approved_by_name} on{' '}
                  {new Date(userAreaApproval.approved_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : canSubmitFinalApproval && approvalStats?.approvedPercent >= 80 ? (
            <div className="final-approval-prompt">
              <div className="prompt-content">
                <PenLine size={20} />
                <div>
                  <strong>Ready for Final Sign-off</strong>
                  <p>You have reviewed {approvalStats.reviewedPercent}% of requirements.</p>
                </div>
              </div>
              <button
                className="final-approval-btn"
                onClick={() => setShowFinalApproval(true)}
                style={{ backgroundColor: branding.primaryColor }}
              >
                Submit Final Approval
              </button>
            </div>
          ) : null}
        </section>

        {/* Requirements Section */}
        <section className="portal-section requirements-section">
          <div className="section-header">
            <h2>
              <FileText size={20} />
              Requirements to Review
            </h2>
            <div className="filter-controls">
              <Filter size={16} />
              <select
                value={activeFilter}
                onChange={e => setActiveFilter(e.target.value)}
              >
                <option value={FILTER_OPTIONS.ALL}>All ({portalData.requirements?.length || 0})</option>
                <option value={FILTER_OPTIONS.PENDING}>Pending ({approvalStats?.pending || 0})</option>
                <option value={FILTER_OPTIONS.APPROVED}>Approved ({approvalStats?.approved || 0})</option>
                <option value={FILTER_OPTIONS.CHANGES_REQUESTED}>
                  Changes Requested ({approvalStats?.changesRequested || 0})
                </option>
              </select>
            </div>
          </div>

          <RequirementApprovalList
            requirements={filteredRequirements}
            userEmail={user?.email}
            canApprove={permissions?.approve_requirements}
            canComment={permissions?.add_comments}
            onApprove={handleApproval}
            onBatchApprove={handleBatchApproval}
            branding={branding}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="token-portal-footer">
        <p>
          Access expires: {portalData.tokenExpiresAt
            ? new Date(portalData.tokenExpiresAt).toLocaleDateString()
            : 'N/A'}
        </p>
      </footer>

      {/* Final Approval Modal */}
      {showFinalApproval && (
        <FinalApprovalModal
          user={user}
          stats={approvalStats}
          onSubmit={handleFinalApproval}
          onClose={() => setShowFinalApproval(false)}
          branding={branding}
        />
      )}
    </div>
  );
}

export default TokenPortalPage;
