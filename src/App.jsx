// src/App.jsx
// Updated to include TestUserProvider for session-level test user visibility

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Import the TestUserProvider
import { TestUserProvider } from './contexts/TestUserContext';

// Layout and Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Milestones from './pages/Milestones';
import MilestoneDetail from './pages/MilestoneDetail';
import Gantt from './pages/Gantt';
import Deliverables from './pages/Deliverables';
import Resources from './pages/Resources';
import Timesheets from './pages/Timesheets';
import Expenses from './pages/Expenses';
import KPIs from './pages/KPIs';
import KPIDetail from './pages/KPIDetail';
import QualityStandards from './pages/QualityStandards';
import QualityStandardDetail from './pages/QualityStandardDetail';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AccountSettings from './pages/AccountSettings';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Wrap entire app with TestUserProvider */}
      {/* This provides the showTestUsers state to all components */}
      <TestUserProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/milestones" element={
            <ProtectedRoute><Milestones /></ProtectedRoute>
          } />
          <Route path="/milestones/:id" element={
            <ProtectedRoute><MilestoneDetail /></ProtectedRoute>
          } />
          
          <Route path="/gantt" element={
            <ProtectedRoute><Gantt /></ProtectedRoute>
          } />
          
          <Route path="/deliverables" element={
            <ProtectedRoute><Deliverables /></ProtectedRoute>
          } />
          
          <Route path="/resources" element={
            <ProtectedRoute><Resources /></ProtectedRoute>
          } />
          
          <Route path="/timesheets" element={
            <ProtectedRoute><Timesheets /></ProtectedRoute>
          } />
          
          <Route path="/expenses" element={
            <ProtectedRoute><Expenses /></ProtectedRoute>
          } />
          
          <Route path="/kpis" element={
            <ProtectedRoute><KPIs /></ProtectedRoute>
          } />
          <Route path="/kpis/:id" element={
            <ProtectedRoute><KPIDetail /></ProtectedRoute>
          } />
          
          <Route path="/quality-standards" element={
            <ProtectedRoute><QualityStandards /></ProtectedRoute>
          } />
          <Route path="/quality-standards/:id" element={
            <ProtectedRoute><QualityStandardDetail /></ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute><Reports /></ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute><Users /></ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
          
          <Route path="/account" element={
            <ProtectedRoute><AccountSettings /></ProtectedRoute>
          } />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TestUserProvider>
    </BrowserRouter>
  );
}
