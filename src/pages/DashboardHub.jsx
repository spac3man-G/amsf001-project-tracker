/**
 * Dashboard Hub - Consolidated Dashboard, Workflow Summary, and Reports
 * 
 * Tabbed interface for:
 * - Overview: Project dashboard with widgets
 * - Workflow: Pending workflow items requiring action
 * - Reports: Report builder and templates
 * 
 * @version 2.0
 * @created 25 December 2025
 * @updated 25 December 2025 - Added Workflow tab
 */

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './DashboardHub.css';

// Lazy load the tab content components
const DashboardContent = lazy(() => import('./dashboard/DashboardContent'));
const WorkflowContent = lazy(() => import('./dashboard/WorkflowContent'));
const ReportsContent = lazy(() => import('./dashboard/ReportsContent'));

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workflow', label: 'Workflow', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function DashboardHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="dashboard-hub">
      {/* Tab Navigation */}
      <div className="hub-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`hub-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="hub-content">
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>
          {activeTab === 'overview' && <DashboardContent />}
          {activeTab === 'workflow' && <WorkflowContent />}
          {activeTab === 'reports' && <ReportsContent />}
        </Suspense>
      </div>
    </div>
  );
}
