/**
 * Dashboard Hub - Consolidated Dashboard and Reports
 * 
 * Tabbed interface for:
 * - Dashboard: Project overview with widgets
 * - Reports: Report builder and templates
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './DashboardHub.css';

// Lazy load the tab content components
const DashboardContent = lazy(() => import('./dashboard/DashboardContent'));
const ReportsContent = lazy(() => import('./dashboard/ReportsContent'));

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
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
          {activeTab === 'reports' && <ReportsContent />}
        </Suspense>
      </div>
    </div>
  );
}
