/**
 * Finance Hub - Consolidated Finance Summary and Billing
 * 
 * Tabbed interface for:
 * - Summary: Financial overview (from dashboard finance widget)
 * - Billing: Track billable milestones, invoicing status, and payments
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PoundSterling, BarChart3, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './FinanceHub.css';

// Lazy load the tab content components
const FinanceSummaryContent = lazy(() => import('./finance/FinanceSummaryContent'));
const BillingContent = lazy(() => import('./finance/BillingContent'));

// Tab configuration
const TABS = [
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: FileText },
];

export default function FinanceHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'summary'
  const activeTab = searchParams.get('tab') || 'summary';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="finance-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="hub-header-content">
          <PoundSterling size={28} />
          <div>
            <h1>Finance</h1>
            <p>Financial overview, billing, and invoicing</p>
          </div>
        </div>
      </div>

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
          {activeTab === 'summary' && <FinanceSummaryContent />}
          {activeTab === 'billing' && <BillingContent />}
        </Suspense>
      </div>
    </div>
  );
}
