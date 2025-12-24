/**
 * Organisation Usage Widget
 * 
 * Dashboard widget showing current plan usage for org admins.
 * Displays member and project counts.
 * 
 * @version 1.1
 * @created 24 December 2025
 * @updated 24 December 2025 - Removed upgrade prompts (free tier is unlimited)
 */

import React, { useState, useEffect } from 'react';
import { Building2, Users, FolderKanban, RefreshCw } from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { subscriptionService } from '../../services';
import { getTierConfig } from '../../lib/subscriptionTiers';
import './OrganisationUsageWidget.css';

export default function OrganisationUsageWidget({ onRefresh }) {
  const { currentOrganisation, organisationId, isOrgAdmin } = useOrganisation();
  
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch usage data
  useEffect(() => {
    async function fetchUsage() {
      if (!organisationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await subscriptionService.getCurrentUsage(organisationId);
        setUsage(data);
      } catch (err) {
        console.error('Error fetching usage:', err);
        setError('Failed to load usage data');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [organisationId, onRefresh]);

  // Only show for org admins
  if (!isOrgAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="org-usage-widget loading">
        <div className="widget-header">
          <Building2 size={20} />
          <span>Organisation</span>
        </div>
        <div className="widget-loading">
          <RefreshCw size={20} className="spinning" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null; // Silently fail - this is a supplementary widget
  }

  const tierConfig = usage.tierConfig;

  return (
    <div className="org-usage-widget">
      {/* Header */}
      <div className="widget-header">
        <div className="header-left">
          <Building2 size={20} />
          <span>{currentOrganisation?.display_name || currentOrganisation?.name || 'Organisation'}</span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="widget-stats">
        <div className="stat-item">
          <Users size={18} />
          <div className="stat-content">
            <span className="stat-value">{usage.members.total}</span>
            <span className="stat-label">Members</span>
          </div>
        </div>
        <div className="stat-item">
          <FolderKanban size={18} />
          <div className="stat-content">
            <span className="stat-value">{usage.projects.current}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
