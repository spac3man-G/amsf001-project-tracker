/**
 * Dashboard Page
 * 
 * Dashboard with milestone, deliverables, KPI/QS metrics, billing and finance widgets.
 * Includes refresh button to reload all widget data.
 * 
 * @version 7.6
 * @updated 14 December 2025 - Added data-testid attributes for E2E testing
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import './Dashboard.css';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  MilestonesWidget, 
  DeliverablesWidget, 
  TimesheetsWidget, 
  ExpensesWidget, 
  BillingWidget,
  FinanceWidget,
  KPICardsRow,
  QSCardsRow
} from '../components/dashboard';

export default function Dashboard() {
  const { projectName, projectRef } = useProject();
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    // Reset spinning after animation
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  return (
    <div className="dashboard" data-testid="dashboard-page">
      {/* Header */}
      <div className="dashboard-header" data-testid="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title" data-testid="dashboard-title">{getGreeting()}</h1>
            <p className="dashboard-subtitle" data-testid="dashboard-project-info">{projectRef} • {projectName}</p>
          </div>
          <button 
            className="dashboard-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh all data"
            data-testid="dashboard-refresh-button"
          >
            <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-content" data-testid="dashboard-content">
        {/* Main Widgets Grid (4 columns) */}
        <div className="dashboard-widgets" data-testid="dashboard-widgets">
          <MilestonesWidget refreshTrigger={refreshTrigger} />
          <DeliverablesWidget refreshTrigger={refreshTrigger} />
          <TimesheetsWidget refreshTrigger={refreshTrigger} />
          <ExpensesWidget refreshTrigger={refreshTrigger} />
        </div>

        {/* KPI Metrics Row */}
        <div data-testid="dashboard-kpi-section">
          <KPICardsRow refreshTrigger={refreshTrigger} />
        </div>

        {/* QS Metrics Row */}
        <div data-testid="dashboard-qs-section">
          <QSCardsRow refreshTrigger={refreshTrigger} />
        </div>

        {/* Billing & Finance Row (2 columns) */}
        <div className="dashboard-widgets-row" data-testid="dashboard-finance-section">
          <BillingWidget editable={false} refreshTrigger={refreshTrigger} />
          <FinanceWidget refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
