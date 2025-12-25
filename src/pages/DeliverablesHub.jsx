/**
 * Deliverables Hub - Consolidated Deliverables, KPIs, and Quality Standards
 * 
 * Tabbed interface for:
 * - Deliverables: Track project deliverables with review workflow
 * - KPIs: Key Performance Indicators management
 * - Quality Standards: Quality standards and assessments
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, TrendingUp, Award } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './DeliverablesHub.css';

// Lazy load the tab content components
const DeliverablesContent = lazy(() => import('./deliverables/DeliverablesContent'));
const KPIsContent = lazy(() => import('./deliverables/KPIsContent'));
const QualityStandardsContent = lazy(() => import('./deliverables/QualityStandardsContent'));

// Tab configuration
const TABS = [
  { id: 'deliverables', label: 'Deliverables', icon: Package },
  { id: 'kpis', label: 'KPIs', icon: TrendingUp },
  { id: 'quality', label: 'Quality Standards', icon: Award },
];

export default function DeliverablesHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'deliverables'
  const activeTab = searchParams.get('tab') || 'deliverables';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="deliverables-hub">
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
          {activeTab === 'deliverables' && <DeliverablesContent />}
          {activeTab === 'kpis' && <KPIsContent />}
          {activeTab === 'quality' && <QualityStandardsContent />}
        </Suspense>
      </div>
    </div>
  );
}
