/**
 * Milestones Hub - Consolidated Milestones, Gantt Chart, and Variations
 * 
 * Tabbed interface for:
 * - Milestones: Track project milestones and acceptance certificates
 * - Gantt Chart: Visual timeline of milestones
 * - Variations: Project change control and variation management
 * 
 * @version 1.0
 * @created 25 December 2025
 */

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Milestone, BarChart3, GitBranch } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './MilestonesHub.css';

// Lazy load the tab content components
const MilestonesContent = lazy(() => import('./milestones/MilestonesContent'));
const GanttContent = lazy(() => import('./milestones/GanttContent'));
const VariationsContent = lazy(() => import('./milestones/VariationsContent'));

// Tab configuration
const TABS = [
  { id: 'milestones', label: 'Milestones', icon: Milestone },
  { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
  { id: 'variations', label: 'Variations', icon: GitBranch },
];

export default function MilestonesHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'milestones'
  const activeTab = searchParams.get('tab') || 'milestones';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="milestones-hub">
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
          {activeTab === 'milestones' && <MilestonesContent />}
          {activeTab === 'gantt' && <GanttContent />}
          {activeTab === 'variations' && <VariationsContent />}
        </Suspense>
      </div>
    </div>
  );
}
