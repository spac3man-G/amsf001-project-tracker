/**
 * Upgrade Prompt Component
 * 
 * Displays a prompt when user hits a subscription limit.
 * Shows current usage, limit info, and upgrade CTA.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, ArrowRight, Sparkles, 
  Users, FolderKanban, HardDrive, Zap
} from 'lucide-react';
import { getNextTier, getTierConfig, formatLimitValue } from '../../lib/subscriptionTiers';
import './UpgradePrompt.css';

// Icon mapping for limit types
const LIMIT_ICONS = {
  members: Users,
  projects: FolderKanban,
  storageGB: HardDrive,
  apiCallsPerDay: Zap,
};

export default function UpgradePrompt({
  limitType,
  current,
  limit,
  tier,
  variant = 'banner', // 'banner', 'modal', 'inline', 'card'
  onUpgrade,
  onDismiss,
  className = '',
}) {
  const navigate = useNavigate();
  const currentTierConfig = getTierConfig(tier);
  const nextTier = getNextTier(tier);
  
  const LimitIcon = LIMIT_ICONS[limitType] || AlertTriangle;
  
  // Calculate percentage used
  const percentUsed = limit === Infinity ? 0 : Math.round((current / limit) * 100);
  const isAtLimit = current >= limit;
  const isNearLimit = percentUsed >= 80 && !isAtLimit;

  // Handle upgrade click
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/admin/billing');
    }
  };

  // Limit type display names
  const limitNames = {
    members: 'team members',
    projects: 'projects',
    storageGB: 'storage',
    apiCallsPerDay: 'API calls',
  };

  const limitName = limitNames[limitType] || limitType;

  // Different variants
  if (variant === 'inline') {
    return (
      <div className={`upgrade-prompt-inline ${isAtLimit ? 'at-limit' : ''} ${className}`}>
        <LimitIcon size={16} />
        <span>
          {isAtLimit 
            ? `${limitName} limit reached` 
            : `${current}/${limit} ${limitName}`
          }
        </span>
        {nextTier && (
          <button onClick={handleUpgrade} className="upgrade-link">
            Upgrade
          </button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`upgrade-prompt-card ${isAtLimit ? 'at-limit' : ''} ${className}`}>
        <div className="card-icon">
          <LimitIcon size={24} />
        </div>
        <div className="card-content">
          <h4>
            {isAtLimit 
              ? `${limitName.charAt(0).toUpperCase() + limitName.slice(1)} Limit Reached`
              : `Running Low on ${limitName.charAt(0).toUpperCase() + limitName.slice(1)}`
            }
          </h4>
          <p>
            You're using {current} of {formatLimitValue(limitType, limit)} {limitName} 
            on your {currentTierConfig.name} plan.
          </p>
          {nextTier && (
            <button onClick={handleUpgrade} className="btn-upgrade-card">
              <Sparkles size={16} />
              Upgrade to {nextTier.name}
            </button>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="card-dismiss">×</button>
        )}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="upgrade-prompt-modal-overlay" onClick={onDismiss}>
        <div className="upgrade-prompt-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-icon">
            <AlertTriangle size={48} />
          </div>
          <h2>
            {isAtLimit 
              ? `You've reached your ${limitName} limit`
              : `You're running low on ${limitName}`
            }
          </h2>
          <p className="modal-description">
            Your {currentTierConfig.name} plan includes {formatLimitValue(limitType, limit)} {limitName}.
            {isAtLimit 
              ? ` You've used all ${limit}.`
              : ` You've used ${current} of ${limit}.`
            }
          </p>
          
          {nextTier && (
            <div className="modal-upgrade-info">
              <div className="upgrade-comparison">
                <div className="current-plan">
                  <span className="plan-label">Current</span>
                  <span className="plan-name">{currentTierConfig.name}</span>
                  <span className="plan-limit">{formatLimitValue(limitType, limit)} {limitName}</span>
                </div>
                <ArrowRight size={20} />
                <div className="next-plan">
                  <span className="plan-label">Upgrade to</span>
                  <span className="plan-name">{nextTier.name}</span>
                  <span className="plan-limit">{formatLimitValue(limitType, nextTier.limits[limitType])} {limitName}</span>
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            {onDismiss && (
              <button onClick={onDismiss} className="btn-secondary">
                Maybe Later
              </button>
            )}
            {nextTier ? (
              <button onClick={handleUpgrade} className="btn-upgrade">
                <Sparkles size={18} />
                Upgrade to {nextTier.name}
              </button>
            ) : (
              <button onClick={handleUpgrade} className="btn-upgrade">
                Contact Sales
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: banner variant
  return (
    <div className={`upgrade-prompt-banner ${isAtLimit ? 'at-limit' : 'warning'} ${className}`}>
      <div className="banner-icon">
        <LimitIcon size={20} />
      </div>
      <div className="banner-content">
        <strong>
          {isAtLimit 
            ? `You've reached your ${limitName} limit`
            : `You're using ${percentUsed}% of your ${limitName}`
          }
        </strong>
        <span>
          {current} of {formatLimitValue(limitType, limit)} on {currentTierConfig.name} plan
        </span>
      </div>
      {nextTier && (
        <button onClick={handleUpgrade} className="btn-upgrade-banner">
          <Sparkles size={16} />
          Upgrade to {nextTier.name}
          <ArrowRight size={16} />
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="banner-dismiss">×</button>
      )}
    </div>
  );
}
