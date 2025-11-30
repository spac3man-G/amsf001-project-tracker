// src/App.jsx
// Version 9.0 - Code splitting with React.lazy for improved bundle size

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TestUserProvider } from './contexts/TestUserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';

// Shared components - always loaded
import { ErrorBoundary, LoadingSpinner, Skeleton } from './components/common';
import { ChatWidget } from './components/chat';
import Layout from './components/Layout';

// Critical pages - loaded immediately
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-loaded pages - split into separate chunks
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
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
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const WorkflowSummary = lazy(() => import('./pages/WorkflowSummary'));

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
 */
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children || <Outlet />}
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <ProjectProvider>
              <TestUserProvider>
                <NotificationProvider>
                  <ChatProvider>
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
                      
                      {/* Reports */}
                      <Route path="/reports" element={
                        <ProtectedRoute><Reports /></ProtectedRoute>
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
                      
                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                    
                    {/* AI Chat Widget */}
                    <ChatWidget />
                  </ChatProvider>
                </NotificationProvider>
              </TestUserProvider>
            </ProjectProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
