// src/App.jsx
// Version 15.0 - Replaced Availability with Project Calendar (availability, milestones, deliverables)
//
// Provider order is critical:
// 1. AuthProvider - user authentication (no dependencies)
// 2. ProjectProvider - fetches user's projects and project-scoped role (needs AuthContext)
// 3. ViewAsProvider - role impersonation (needs AuthContext AND ProjectContext)

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Suspense, lazy } from 'react';

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ViewAsProvider } from './contexts/ViewAsContext';
import { TestUserProvider } from './contexts/TestUserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { MetricsProvider } from './contexts/MetricsContext';
import { HelpProvider } from './contexts/HelpContext';

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
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const WorkflowSummary = lazy(() => import('./pages/WorkflowSummary'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const DeletedItems = lazy(() => import('./pages/DeletedItems'));
const Calendar = lazy(() => import('./pages/Calendar'));

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
 */
function ProtectedRoute({ children }) {
  const { user, isLoading, mustChangePassword, clearMustChangePassword, profile } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

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
            {/* ProjectProvider must come before ViewAsProvider 
                because ViewAsProvider now uses projectRole from ProjectContext */}
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
                            
                            {/* Reports */}
                            <Route path="/reports" element={
                              <ProtectedRoute><Reports /></ProtectedRoute>
                            } />
                            
                            {/* Billing */}
                            <Route path="/billing" element={
                              <ProtectedRoute><Billing /></ProtectedRoute>
                            } />
                            
                            {/* Users (Admin) */}
                            <Route path="/users" element={
                              <ProtectedRoute><Users /></ProtectedRoute>
                            } />
                            
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
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
