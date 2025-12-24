/**
 * Usage Meter Component
 * 
 * Visual progress bar showing current usage vs limit.
 * Used in dashboards and settings pages.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React from 'react';
import { Users, FolderKanban, HardDrive, Zap, Infinity } from 'lucide-react';
import { isUnlimited, formatLimitValue } from '../../lib/subscriptionTiers';
import './UsageMeter.css';

// Icon mapping for limit types
const LIMIT_ICONS = {
  members: Users,
  projects: FolderKanban,
  storageGB: HardDrive,
  apiCallsPerDay: Zap,
};

// Label mapping for limit types
const LIMIT_LABELS = {
  members: 'Team Members',
  projects: 'Projects',
  storageGB: 'Storage',
  apiCallsPerDay: 'API Calls',
};

export default function UsageMeter({
  type,
  current,
  limit,
  label,
  showIcon = true,
  showLabel = true,
  showValues = true,
  size = 'default', // 'small', 'default', 'large'
  className = '',
}) {
  const Icon = LIMIT_ICONS[type] || Users;
  const displayLabel = label || LIMIT_LABELS[type] || type;
  
  // Calculate percentage
  const unlimited = isUnlimited(limit);
  const percentage = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  
  // Determine status color
  let status = 'normal';
  if (!unlimited) {
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 90) status = 'critical';
    else if (percentage >= 75) status = 'warning';
  }

  return (
    <div className={`usage-meter usage-meter-${size} usage-meter-${status} ${className}`}>
      {(showIcon || showLabel) && (
        <div className="meter-header">
          {showIcon && (
            <div className="meter-icon">
              <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 16} />
            </div>
          )}
          {showLabel && (
            <span className="meter-label">{displayLabel}</span>
          )}
        </div>
      )}
      
      <div className="meter-bar-container">
        <div className="meter-bar">
          <div 
            className="meter-bar-fill"
            style={{ width: unlimited ? '0%' : `${percentage}%` }}
          />
        </div>
      </div>
      
      {showValues && (
        <div className="meter-values">
          <span className="meter-current">{current}</span>
          <span className="meter-separator">/</span>
          {unlimited ? (
            <span className="meter-limit">
              <Infinity size={14} />
            </span>
          ) : (
            <span className="meter-limit">{formatLimitValue(type, limit)}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact usage display for inline use
 */
export function UsageInline({ type, current, limit, className = '' }) {
  const unlimited = isUnlimited(limit);
  const percentage = unlimited ? 0 : Math.round((current / limit) * 100);
  
  let status = 'normal';
  if (!unlimited && percentage >= 90) status = 'critical';
  else if (!unlimited && percentage >= 75) status = 'warning';

  return (
    <span className={`usage-inline usage-inline-${status} ${className}`}>
      {current}
      {!unlimited && (
        <>/{limit}</>
      )}
    </span>
  );
}

/**
 * Usage summary card for dashboard
 */
export function UsageSummaryCard({
  tierName,
  members,
  projects,
  storage,
  onUpgrade,
  className = '',
}) {
  return (
    <div className={`usage-summary-card ${className}`}>
      <div className="summary-header">
        <h3>Plan Usage</h3>
        <span className="tier-badge">{tierName}</span>
      </div>
      
      <div className="summary-meters">
        {members && (
          <UsageMeter
            type="members"
            current={members.current}
            limit={members.limit}
            size="small"
          />
        )}
        {projects && (
          <UsageMeter
            type="projects"
            current={projects.current}
            limit={projects.limit}
            size="small"
          />
        )}
        {storage && (
          <UsageMeter
            type="storageGB"
            current={storage.current}
            limit={storage.limit}
            size="small"
          />
        )}
      </div>
      
      {onUpgrade && (
        <button onClick={onUpgrade} className="summary-upgrade-btn">
          Upgrade Plan
        </button>
      )}
    </div>
  );
}
