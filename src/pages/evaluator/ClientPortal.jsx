/**
 * ClientPortal Page
 * 
 * Public-facing portal for clients to view evaluation progress and reports.
 * Authentication is done via access codes stored in permissions JSON.
 * Supports custom branding from evaluation project settings.
 * 
 * @version 1.1
 * @created 04 January 2026
 * @updated 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.1, 9.2, 9.3)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Key,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  RefreshCw,
  CheckSquare
} from 'lucide-react';
import { clientPortalService } from '../../services/evaluator/clientPortal.service';
import ClientDashboard from '../../components/evaluator/client/ClientDashboard';
import './ClientPortal.css';

// Portal states
const PORTAL_STATE = {
  LOGIN: 'login',
  AUTHENTICATED: 'authenticated',
  LOADING: 'loading',
  ERROR: 'error'
};

// Portal views
const PORTAL_VIEW = {
  DASHBOARD: 'dashboard',
  REQUIREMENTS: 'requirements',
  APPROVALS: 'approvals',
  VENDORS: 'vendors',
  REPORTS: 'reports'
};

// Default branding colors
const DEFAULT_BRANDING = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  backgroundColor: '#1e3a5f',
  textColor: '#ffffff'
};

function ClientPortal() {
  const [searchParams] = useSearchParams();
  
  // Auth state
  const [portalState, setPortalState] = useState(PORTAL_STATE.LOGIN);
  const [accessCode, setAccessCode] = useState('');
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // View state
  const [activeView, setActiveView] = useState(PORTAL_VIEW.DASHBOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Extract branding from session and dashboard data
  const branding = useMemo(() => {
    const projectBranding = dashboardData?.project?.branding || session?.evaluationProject?.branding || {};
    return {
      primaryColor: projectBranding.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: projectBranding.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      accentColor: projectBranding.accentColor || DEFAULT_BRANDING.accentColor,
      backgroundColor: projectBranding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
      textColor: projectBranding.textColor || DEFAULT_BRANDING.textColor,
      logoUrl: projectBranding.logoUrl || dashboardData?.project?.client_logo_url || session?.evaluationProject?.client_logo_url
    };
  }, [session, dashboardData]);

  // Generate CSS variables for branding
  const brandingStyle = useMemo(() => ({
    '--portal-primary': branding.primaryColor,
    '--portal-secondary': branding.secondaryColor,
    '--portal-accent': branding.accentColor,
    '--portal-bg': branding.backgroundColor,
    '--portal-text': branding.textColor
  }), [branding]);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem('clientPortalSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
          setPortalState(PORTAL_STATE.AUTHENTICATED);
        } else {
          sessionStorage.removeItem('clientPortalSession');
        }
      } catch (e) {
        sessionStorage.removeItem('clientPortalSession');
      }
    }

    // Check for code in URL params
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setAccessCode(codeParam);
    }
  }, [searchParams]);

  // Fetch dashboard data when authenticated
  const fetchDashboardData = useCallback(async () => {
    if (!session?.evaluationProject?.id) return;

    try {
      setIsLoading(true);
      const data = await clientPortalService.getProgressSummary(
        session.evaluationProject.id
      );
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (portalState === PORTAL_STATE.AUTHENTICATED) {
      fetchDashboardData();
    }
  }, [portalState, fetchDashboardData]);

  // Authentication handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setAuthError('Please enter your access code');
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const response = await fetch('/api/evaluator/client-portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save session
      sessionStorage.setItem('clientPortalSession', JSON.stringify(data));
      setSession(data);
      setPortalState(PORTAL_STATE.AUTHENTICATED);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Failed to authenticate. Please check your access code.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('clientPortalSession');
    setSession(null);
    setAccessCode('');
    setDashboardData(null);
    setPortalState(PORTAL_STATE.LOGIN);
    setActiveView(PORTAL_VIEW.DASHBOARD);
  };

  // Check permissions
  const canView = (view) => {
    const permissions = session?.client?.permissions || {};
    switch (view) {
      case PORTAL_VIEW.DASHBOARD:
        return true;
      case PORTAL_VIEW.REQUIREMENTS:
        return permissions.canViewRequirements !== false;
      case PORTAL_VIEW.APPROVALS:
        return permissions.canApproveRequirements === true;
      case PORTAL_VIEW.VENDORS:
        return permissions.canViewVendors === true;
      case PORTAL_VIEW.REPORTS:
        return permissions.canViewProgress !== false;
      default:
        return false;
    }
  };

  // Client info for approvals/comments
  const clientInfo = useMemo(() => ({
    name: session?.client?.name,
    email: session?.client?.email
  }), [session]);

  // Render login form
  if (portalState === PORTAL_STATE.LOGIN) {
    return (
      <div className="client-portal client-portal-login" style={brandingStyle}>
        <div className="client-portal-login-card">
          <div className="client-portal-login-header">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt="Logo" 
                className="login-logo"
              />
            ) : (
              <Building2 size={40} style={{ color: branding.primaryColor }} />
            )}
            <h1>Client Portal</h1>
            <p>Enter your access code to view evaluation progress</p>
          </div>

          <form onSubmit={handleLogin} className="client-portal-login-form">
            <div className="client-portal-field">
              <label htmlFor="access-code">
                <Key size={16} />
                Access Code
              </label>
              <input
                id="access-code"
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                maxLength={20}
                autoFocus
              />
            </div>

            {authError && (
              <div className="client-portal-error">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="client-portal-login-btn"
              disabled={isAuthenticating}
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isAuthenticating ? (
                <>
                  <span className="spinner-small" />
                  Verifying...
                </>
              ) : (
                <>
                  <ChevronRight size={18} />
                  Access Portal
                </>
              )}
            </button>
          </form>

          <div className="client-portal-login-footer">
            <p>Don't have an access code?</p>
            <p>Please contact your evaluation team for access.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render authenticated portal
  return (
    <div className="client-portal client-portal-branded" style={brandingStyle}>
      {/* Header */}
      <header className="client-portal-header">
        <div className="client-portal-brand">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt="Logo" 
              className="portal-logo"
            />
          ) : (
            <Building2 size={24} style={{ color: branding.primaryColor }} />
          )}
          <div>
            <h1>{session?.evaluationProject?.name || 'Client Portal'}</h1>
            <p>Welcome, {session?.client?.name}</p>
          </div>
        </div>
        <div className="client-portal-header-actions">
          <button 
            className="client-portal-refresh" 
            onClick={fetchDashboardData}
            disabled={isLoading}
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
          <button className="client-portal-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="client-portal-nav">
        <button
          className={`client-portal-nav-btn ${activeView === PORTAL_VIEW.DASHBOARD ? 'active' : ''}`}
          onClick={() => setActiveView(PORTAL_VIEW.DASHBOARD)}
          style={activeView === PORTAL_VIEW.DASHBOARD ? { 
            backgroundColor: `${branding.primaryColor}15`,
            borderColor: `${branding.primaryColor}40`,
            color: branding.primaryColor
          } : {}}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        
        {canView(PORTAL_VIEW.REQUIREMENTS) && (
          <button
            className={`client-portal-nav-btn ${activeView === PORTAL_VIEW.REQUIREMENTS ? 'active' : ''}`}
            onClick={() => setActiveView(PORTAL_VIEW.REQUIREMENTS)}
            style={activeView === PORTAL_VIEW.REQUIREMENTS ? { 
              backgroundColor: `${branding.primaryColor}15`,
              borderColor: `${branding.primaryColor}40`,
              color: branding.primaryColor
            } : {}}
          >
            <FileText size={18} />
            Requirements
          </button>
        )}

        {canView(PORTAL_VIEW.APPROVALS) && (
          <button
            className={`client-portal-nav-btn ${activeView === PORTAL_VIEW.APPROVALS ? 'active' : ''}`}
            onClick={() => setActiveView(PORTAL_VIEW.APPROVALS)}
            style={activeView === PORTAL_VIEW.APPROVALS ? { 
              backgroundColor: `${branding.primaryColor}15`,
              borderColor: `${branding.primaryColor}40`,
              color: branding.primaryColor
            } : {}}
          >
            <CheckSquare size={18} />
            Approvals
          </button>
        )}
        
        {canView(PORTAL_VIEW.VENDORS) && (
          <button
            className={`client-portal-nav-btn ${activeView === PORTAL_VIEW.VENDORS ? 'active' : ''}`}
            onClick={() => setActiveView(PORTAL_VIEW.VENDORS)}
            style={activeView === PORTAL_VIEW.VENDORS ? { 
              backgroundColor: `${branding.primaryColor}15`,
              borderColor: `${branding.primaryColor}40`,
              color: branding.primaryColor
            } : {}}
          >
            <Users size={18} />
            Vendors
          </button>
        )}
        
        {canView(PORTAL_VIEW.REPORTS) && (
          <button
            className={`client-portal-nav-btn ${activeView === PORTAL_VIEW.REPORTS ? 'active' : ''}`}
            onClick={() => setActiveView(PORTAL_VIEW.REPORTS)}
            style={activeView === PORTAL_VIEW.REPORTS ? { 
              backgroundColor: `${branding.primaryColor}15`,
              borderColor: `${branding.primaryColor}40`,
              color: branding.primaryColor
            } : {}}
          >
            <BarChart3 size={18} />
            Reports
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="client-portal-main">
        {isLoading && !dashboardData ? (
          <div className="client-portal-loading">
            <div className="spinner" style={{ borderTopColor: branding.primaryColor }} />
            <span>Loading...</span>
          </div>
        ) : (
          <ClientDashboard
            view={activeView}
            session={session}
            dashboardData={dashboardData}
            onRefresh={fetchDashboardData}
            clientInfo={clientInfo}
            branding={branding}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="client-portal-footer">
        <p>
          {session?.evaluationProject?.clientName || session?.evaluationProject?.client_name} • 
          Last updated: {dashboardData?.generatedAt 
            ? new Date(dashboardData.generatedAt).toLocaleString() 
            : 'N/A'}
        </p>
      </footer>
    </div>
  );
}

export default ClientPortal;
