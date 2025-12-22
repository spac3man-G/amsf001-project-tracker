// src/App.jsx
// Version 17.0 - Added OrganisationProvider for multi-tenancy
//
// Provider order is critical:
// 1. AuthProvider - user authentication (no dependencies)
// 2. OrganisationProvider - fetches user's organisations (needs AuthContext)
// 3. ProjectProvider - fetches user's projects filtered by org (needs AuthContext AND OrganisationContext)
// 4. ViewAsProvider - role impersonation (needs AuthContext AND ProjectContext)

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Suspense, lazy } from 'react';

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganisationProvider } from './contexts/OrganisationContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ViewAsProvider } from './contexts/ViewAsContext';
import { TestUserProvider } from './contexts/TestUserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { MetricsProvider } from './contexts/MetricsContext';
import { HelpProvider } from './contexts/HelpContext';

// Import hooks
import { useProjectRole } from './hooks/useProjectRole';

// Shared components - always loaded
import { ErrorBoundary, LoadingSpinner, Skeleton } from './components/common';
import { ChatWidget } from './components/chat';
import { HelpDrawer, HelpButton } from './components/help';
import Layout from './components/Layout';
import ForcePasswordChange from './components/ForcePasswordChange';

// Critical pages - loaded immediately
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-loaded pages - split into separate chunks
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MobileChat = lazy(() => import('./pages/MobileChat'));
const Milestones = lazy(() => import('./pages/Milestones'));
const MilestoneDetail = lazy(() => import('./pages/MilestoneDetail'));
const Gantt = lazy(() => import('./pages/Gantt'));
const Deliverables = lazy(() => import('./pages/Deliverables'));
const Resources = lazy(() => import('./pages/Resources'));
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'));
const Partners = lazy(() => import('./pages/Partners'));
const PartnerDetail = lazy(() => import('./pages/PartnerDetail'));
const Timesheets = lazy(() => import('./pages/Timesheets'));
const Expenses = lazy(() => import('./pages/Expenses'));
const KPIs = lazy(() => import('./pages/KPIs'));
const KPIDetail = lazy(() => import('./pages/KPIDetail'));
const QualityStandards = lazy(() => import('./pages/QualityStandards'));
const QualityStandardDetail = lazy(() => import('./pages/QualityStandardDetail'));
const RaidLog = lazy(() => import('./pages/RaidLog'));
const Reports = lazy(() => import('./pages/Reports'));
const Billing = lazy(() => import('./pages/Billing'));
const TeamMembers = lazy(() => import('./pages/TeamMembers'));
const Settings = lazy(() => import('./pages/Settings'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const WorkflowSummary = lazy(() => import('./pages/WorkflowSummary'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const DeletedItems = lazy(() => import('./pages/DeletedItems'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Variations = lazy(() => import('./pages/Variations'));
const VariationDetail = lazy(() => import('./pages/VariationDetail'));
const VariationForm = lazy(() => import('./pages/VariationForm'));
const SystemUsers = lazy(() => import('./pages/admin/SystemUsers'));
const ProjectManagement = lazy(() => import('./pages/admin/ProjectManagement'));
const OrganisationSettings = lazy(() => import('./pages/admin/OrganisationSettings'));
const OrganisationMembers = lazy(() => import('./pages/admin/OrganisationMembers'));

/**
 * PageLoader - Shows skeleton while lazy components load
 */
function PageLoader() {
  return (
    <div className="page-container">
      <Skeleton type="page" />
    </div>
  );
}

/**
 * ProtectedRoute - Wraps routes that require authentication
 * Uses AuthContext for single source of truth.
 * Also handles forced password change flow.
 * 
 * @param {ReactNode} children - Child components to render
 * @param {boolean} adminOnly - If true, requires global admin role (isSystemAdmin)
 * @param {string[]} requiredRoles - Array of roles that can access this route (uses effectiveRole)
 * 
 * Role checking logic:
 * - adminOnly: Checks isSystemAdmin (global role === 'admin')
 * - requiredRoles: Checks effectiveRole (project role with global fallback)
 * 
 * @version 2.0 - Added project-scoped role checks
 */
function ProtectedRoute({ children, adminOnly = false, requiredRoles = null }) {
  const { user, isLoading, mustChangePassword, clearMustChangePassword, profile } = useAuth();
  const { effectiveRole, isSystemAdmin, loading: roleLoading } = useProjectRole();

  // Show loading spinner while auth or role is loading
  if (isLoading || roleLoading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user must change password, show the password change screen
  if (mustChangePassword) {
    return (
      <ForcePasswordChange 
        userEmail={user?.email}
        onSuccess={clearMustChangePassword}
      />
    );
  }

  // Admin-only routes (like System Users) - requires global admin role
  if (adminOnly && !isSystemAdmin) {
    console.warn(`Access denied to admin-only route. isSystemAdmin: ${isSystemAdmin}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Routes with required roles - check effectiveRole (project role with global fallback)
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(effectiveRole)) {
    console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}. User's effectiveRole: ${effectiveRole}`);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children || <Outlet />}
      </Suspense>
    </Layout>
  );
}

/**
 * MobileChatRoute - Protected route without Layout wrapper
 * Used for full-screen mobile chat experience
 */
function MobileChatRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading chat..." size="large" fullPage />}>
      <MobileChat />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            {/* OrganisationProvider must come before ProjectProvider
                because ProjectProvider filters projects by current organisation */}
            <OrganisationProvider>
              <ProjectProvider>
                <ViewAsProvider>
                <TestUserProvider>
                  <MetricsProvider>
                    <NotificationProvider>
                      <ChatProvider>
                        <HelpProvider>
                          <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route 
                              path="/reset-password" 
                              element={
                                <Suspense fallback={<LoadingSpinner fullPage />}>
                                  <ResetPassword />
                                </Suspense>
                              } 
                            />
                            
                            {/* Mobile Chat - Full screen, no layout wrapper */}
                            <Route path="/chat" element={<MobileChatRoute />} />
                            
                            {/* Protected routes */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            
                            {/* Dashboard - not lazy loaded for fast initial render */}
                            <Route path="/dashboard" element={
                              <ProtectedRoute><Dashboard /></ProtectedRoute>
                            } />
                            
                            {/* Milestones */}
                            <Route path="/milestones" element={
                              <ProtectedRoute><Milestones /></ProtectedRoute>
                            } />
                            <Route path="/milestones/:id" element={
                              <ProtectedRoute><MilestoneDetail /></ProtectedRoute>
                            } />
                            
                            {/* Gantt */}
                            <Route path="/gantt" element={
                              <ProtectedRoute><Gantt /></ProtectedRoute>
                            } />
                            
                            {/* Deliverables */}
                            <Route path="/deliverables" element={
                              <ProtectedRoute><Deliverables /></ProtectedRoute>
                            } />
                            
                            {/* Resources */}
                            <Route path="/resources" element={
                              <ProtectedRoute><Resources /></ProtectedRoute>
                            } />
                            <Route path="/resources/:id" element={
                              <ProtectedRoute><ResourceDetail /></ProtectedRoute>
                            } />
                            
                            {/* Partners */}
                            <Route path="/partners" element={
                              <ProtectedRoute><Partners /></ProtectedRoute>
                            } />
                            <Route path="/partners/:id" element={
                              <ProtectedRoute><PartnerDetail /></ProtectedRoute>
                            } />
                            
                            {/* Timesheets */}
                            <Route path="/timesheets" element={
                              <ProtectedRoute><Timesheets /></ProtectedRoute>
                            } />
                            
                            {/* Expenses */}
                            <Route path="/expenses" element={
                              <ProtectedRoute><Expenses /></ProtectedRoute>
                            } />
                            
                            {/* KPIs */}
                            <Route path="/kpis" element={
                              <ProtectedRoute><KPIs /></ProtectedRoute>
                            } />
                            <Route path="/kpis/:id" element={
                              <ProtectedRoute><KPIDetail /></ProtectedRoute>
                            } />
                            
                            {/* Quality Standards */}
                            <Route path="/quality-standards" element={
                              <ProtectedRoute><QualityStandards /></ProtectedRoute>
                            } />
                            <Route path="/quality-standards/:id" element={
                              <ProtectedRoute><QualityStandardDetail /></ProtectedRoute>
                            } />
                            
                            {/* RAID Log */}
                            <Route path="/raid" element={
                              <ProtectedRoute><RaidLog /></ProtectedRoute>
                            } />
                            
                            {/* Project Calendar */}
                            <Route path="/calendar" element={
                              <ProtectedRoute><Calendar /></ProtectedRoute>
                            } />
                            
                            {/* Variations (Change Control) */}
                            <Route path="/variations" element={
                              <ProtectedRoute><Variations /></ProtectedRoute>
                            } />
                            <Route path="/variations/new" element={
                              <ProtectedRoute><VariationForm /></ProtectedRoute>
                            } />
                            <Route path="/variations/:id" element={
                              <ProtectedRoute><VariationDetail /></ProtectedRoute>
                            } />
                            <Route path="/variations/:id/edit" element={
                              <ProtectedRoute><VariationForm /></ProtectedRoute>
                            } />
                            
                            {/* Reports */}
                            <Route path="/reports" element={
                              <ProtectedRoute><Reports /></ProtectedRoute>
                            } />
                            
                            {/* Billing */}
                            <Route path="/billing" element={
                              <ProtectedRoute><Billing /></ProtectedRoute>
                            } />
                            
                            {/* Team Members (project-scoped user management) */}
                            <Route path="/team-members" element={
                              <ProtectedRoute><TeamMembers /></ProtectedRoute>
                            } />
                            
                            {/* Redirect old /users URL to /team-members */}
                            <Route path="/users" element={<Navigate to="/team-members" replace />} />
                            
                            {/* Settings */}
                            <Route path="/settings" element={
                              <ProtectedRoute><Settings /></ProtectedRoute>
                            } />
                            <Route path="/account" element={
                              <ProtectedRoute><AccountSettings /></ProtectedRoute>
                            } />

                            {/* Workflow Summary */}
                            <Route path="/workflow-summary" element={
                              <ProtectedRoute><WorkflowSummary /></ProtectedRoute>
                            } />

                            {/* Admin Pages */}
                            <Route path="/audit-log" element={
                              <ProtectedRoute><AuditLog /></ProtectedRoute>
                            } />
                            <Route path="/deleted-items" element={
                              <ProtectedRoute><DeletedItems /></ProtectedRoute>
                            } />
                            
                            {/* System Users (admin only - requires global admin role) */}
                            <Route path="/admin/users" element={
                              <ProtectedRoute adminOnly><SystemUsers /></ProtectedRoute>
                            } />
                            
                            {/* Project Management (admin and supplier_pm) */}
                            <Route path="/admin/projects" element={
                              <ProtectedRoute><ProjectManagement /></ProtectedRoute>
                            } />
                            
                            {/* Organisation Settings (org admins) */}
                            <Route path="/admin/organisation" element={
                              <ProtectedRoute><OrganisationSettings /></ProtectedRoute>
                            } />
                            
                            {/* Organisation Members (org admins) */}
                            <Route path="/admin/organisation/members" element={
                              <ProtectedRoute><OrganisationMembers /></ProtectedRoute>
                            } />
                            
                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                          
                          {/* AI Chat Widget */}
                          <ChatWidget />
                          
                          {/* Help System */}
                          <HelpDrawer />
                          <HelpButton />
                          
                          {/* Vercel Production Monitoring */}
                          <Analytics />
                          <SpeedInsights />
                        </HelpProvider>
                      </ChatProvider>
                    </NotificationProvider>
                  </MetricsProvider>
                </TestUserProvider>
                </ViewAsProvider>
              </ProjectProvider>
            </OrganisationProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
