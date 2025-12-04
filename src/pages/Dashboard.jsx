/**
 * Dashboard Page - Clean Slate
 * 
 * Dashboard with milestone progress widget.
 * 
 * @version 7.1
 * @updated 4 December 2025
 */

import React from 'react';
import './Dashboard.css';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { MilestonesWidget } from '../components/dashboard';

export default function Dashboard() {
  const { projectName, projectRef } = useProject();
  const { user } = useAuth();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">{getGreeting()}</h1>
            <p className="dashboard-subtitle">{projectRef} • {projectName}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-widgets">
          <MilestonesWidget />
        </div>
      </div>
    </div>
  );
}
