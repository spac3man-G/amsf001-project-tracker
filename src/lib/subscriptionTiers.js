/**
 * Subscription Tiers Configuration
 * 
 * Defines the subscription tiers for multi-tenant SaaS:
 * - Free: Limited features for trying the platform
 * - Starter: Small teams getting started
 * - Professional: Growing teams with more needs
 * - Enterprise: Large organisations with unlimited access
 * 
 * @version 1.0
 * @created 24 December 2025
 */

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

// ============================================================================
// TIER CONFIGURATIONS
// ============================================================================

export const TIER_CONFIG = {
  [SUBSCRIPTION_TIERS.FREE]: {
    id: 'free',
    name: 'Free',
    description: 'Full access to all features',
    price: {
      monthly: 0,
      annual: 0,
    },
    limits: {
      members: Infinity,      // Unlimited members
      projects: Infinity,     // Unlimited projects
      storageGB: Infinity,    // Unlimited storage
      apiCallsPerDay: 10000,  // Generous API limit
    },
    features: {
      // Core features
      projectManagement: true,
      milestones: true,
      deliverables: true,
      timesheets: true,
      expenses: true,
      
      // Advanced features - all enabled for free
      aiChat: true,
      receiptScanner: true,
      variations: true,
      reportBuilder: true,
      customBranding: true,
      apiAccess: true,
      
      // Support
      emailSupport: true,
      prioritySupport: false,
      dedicatedSuccess: false,
      
      // Security
      sso: false,
      auditLog: true,
      advancedPermissions: true,
    },
    badge: null,
    color: '#10b981',
    bgColor: '#d1fae5',
  },

  [SUBSCRIPTION_TIERS.STARTER]: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    price: {
      monthly: 29,
      annual: 290,  // ~2 months free
    },
    limits: {
      members: 10,
      projects: 5,
      storageGB: 1,
      apiCallsPerDay: 1000,
    },
    features: {
      // Core features
      projectManagement: true,
      milestones: true,
      deliverables: true,
      timesheets: true,
      expenses: true,
      
      // Advanced features
      aiChat: true,
      receiptScanner: true,
      variations: true,
      reportBuilder: true,
      customBranding: false,
      apiAccess: false,
      
      // Support
      emailSupport: true,
      prioritySupport: false,
      dedicatedSuccess: false,
      
      // Security
      sso: false,
      auditLog: true,
      advancedPermissions: false,
    },
    badge: null,
    color: '#2563eb',
    bgColor: '#dbeafe',
  },

  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams with advanced needs',
    price: {
      monthly: 79,
      annual: 790,  // ~2 months free
    },
    limits: {
      members: 50,
      projects: 25,
      storageGB: 10,
      apiCallsPerDay: 10000,
    },
    features: {
      // Core features
      projectManagement: true,
      milestones: true,
      deliverables: true,
      timesheets: true,
      expenses: true,
      
      // Advanced features
      aiChat: true,
      receiptScanner: true,
      variations: true,
      reportBuilder: true,
      customBranding: true,
      apiAccess: true,
      
      // Support
      emailSupport: true,
      prioritySupport: true,
      dedicatedSuccess: false,
      
      // Security
      sso: false,
      auditLog: true,
      advancedPermissions: true,
    },
    badge: 'Popular',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },

  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organisations requiring unlimited access',
    price: {
      monthly: null,  // Custom pricing
      annual: null,
    },
    limits: {
      members: Infinity,
      projects: Infinity,
      storageGB: Infinity,
      apiCallsPerDay: Infinity,
    },
    features: {
      // Core features
      projectManagement: true,
      milestones: true,
      deliverables: true,
      timesheets: true,
      expenses: true,
      
      // Advanced features
      aiChat: true,
      receiptScanner: true,
      variations: true,
      reportBuilder: true,
      customBranding: true,
      apiAccess: true,
      
      // Support
      emailSupport: true,
      prioritySupport: true,
      dedicatedSuccess: true,
      
      // Security
      sso: true,
      auditLog: true,
      advancedPermissions: true,
    },
    badge: null,
    color: '#059669',
    bgColor: '#d1fae5',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tier configuration by tier ID
 * @param {string} tierId - Tier identifier (free, starter, professional, enterprise)
 * @returns {Object} Tier configuration
 */
export function getTierConfig(tierId) {
  return TIER_CONFIG[tierId] || TIER_CONFIG[SUBSCRIPTION_TIERS.FREE];
}

/**
 * Get limit value for a specific tier
 * @param {string} tierId - Tier identifier
 * @param {string} limitType - Limit type (members, projects, storageGB, apiCallsPerDay)
 * @returns {number} Limit value (Infinity for unlimited)
 */
export function getTierLimit(tierId, limitType) {
  const config = getTierConfig(tierId);
  return config.limits[limitType] ?? 0;
}

/**
 * Check if a tier has a specific feature
 * @param {string} tierId - Tier identifier
 * @param {string} featureName - Feature name
 * @returns {boolean} Whether the feature is available
 */
export function tierHasFeature(tierId, featureName) {
  const config = getTierConfig(tierId);
  return config.features[featureName] ?? false;
}

/**
 * Check if a limit is unlimited
 * @param {number} limit - Limit value
 * @returns {boolean} Whether the limit is unlimited
 */
export function isUnlimited(limit) {
  return limit === Infinity || limit === null || limit === -1;
}

/**
 * Get all available tiers (for pricing page)
 * @param {boolean} includeEnterprise - Whether to include enterprise tier
 * @returns {Array} Array of tier configurations
 */
export function getAllTiers(includeEnterprise = true) {
  const tiers = [
    TIER_CONFIG[SUBSCRIPTION_TIERS.FREE],
    TIER_CONFIG[SUBSCRIPTION_TIERS.STARTER],
    TIER_CONFIG[SUBSCRIPTION_TIERS.PROFESSIONAL],
  ];
  
  if (includeEnterprise) {
    tiers.push(TIER_CONFIG[SUBSCRIPTION_TIERS.ENTERPRISE]);
  }
  
  return tiers;
}

/**
 * Get the next tier upgrade option
 * @param {string} currentTierId - Current tier identifier
 * @returns {Object|null} Next tier configuration or null if already at max
 */
export function getNextTier(currentTierId) {
  const tierOrder = [
    SUBSCRIPTION_TIERS.FREE,
    SUBSCRIPTION_TIERS.STARTER,
    SUBSCRIPTION_TIERS.PROFESSIONAL,
    SUBSCRIPTION_TIERS.ENTERPRISE,
  ];
  
  const currentIndex = tierOrder.indexOf(currentTierId);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null;
  }
  
  return TIER_CONFIG[tierOrder[currentIndex + 1]];
}

/**
 * Get formatted price string
 * @param {string} tierId - Tier identifier
 * @param {string} billing - Billing period ('monthly' or 'annual')
 * @returns {string} Formatted price string (e.g., "£29/month", "Contact us")
 */
export function getFormattedPrice(tierId, billing = 'monthly') {
  const config = getTierConfig(tierId);
  const price = config.price[billing];
  
  if (price === null) {
    return 'Contact us';
  }
  
  if (price === 0) {
    return 'Free';
  }
  
  const period = billing === 'annual' ? '/year' : '/month';
  return `£${price}${period}`;
}

/**
 * Calculate savings for annual billing
 * @param {string} tierId - Tier identifier
 * @returns {number|null} Savings percentage or null if not applicable
 */
export function getAnnualSavings(tierId) {
  const config = getTierConfig(tierId);
  const monthly = config.price.monthly;
  const annual = config.price.annual;
  
  if (monthly === null || annual === null || monthly === 0) {
    return null;
  }
  
  const fullYear = monthly * 12;
  const savings = ((fullYear - annual) / fullYear) * 100;
  return Math.round(savings);
}

/**
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES = {
  // Core
  projectManagement: 'Project Management',
  milestones: 'Milestones & Deliverables',
  deliverables: 'Deliverable Tracking',
  timesheets: 'Timesheet Management',
  expenses: 'Expense Tracking',
  
  // Advanced
  aiChat: 'AI Assistant',
  receiptScanner: 'Receipt Scanner',
  variations: 'Change Control (Variations)',
  reportBuilder: 'Custom Report Builder',
  customBranding: 'Custom Branding',
  apiAccess: 'API Access',
  
  // Support
  emailSupport: 'Email Support',
  prioritySupport: 'Priority Support',
  dedicatedSuccess: 'Dedicated Success Manager',
  
  // Security
  sso: 'Single Sign-On (SSO)',
  auditLog: 'Audit Log',
  advancedPermissions: 'Advanced Permissions',
};

/**
 * Limit display names for UI
 */
export const LIMIT_DISPLAY_NAMES = {
  members: 'Team Members',
  projects: 'Active Projects',
  storageGB: 'Storage',
  apiCallsPerDay: 'API Calls/Day',
};

/**
 * Format a limit value for display
 * @param {string} limitType - Limit type
 * @param {number} value - Limit value
 * @returns {string} Formatted limit string
 */
export function formatLimitValue(limitType, value) {
  if (isUnlimited(value)) {
    return 'Unlimited';
  }
  
  switch (limitType) {
    case 'storageGB':
      if (value < 1) {
        return `${Math.round(value * 1000)}MB`;
      }
      return `${value}GB`;
    case 'apiCallsPerDay':
      if (value >= 1000) {
        return `${value / 1000}K/day`;
      }
      return `${value}/day`;
    default:
      return value.toString();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SUBSCRIPTION_TIERS,
  TIER_CONFIG,
  getTierConfig,
  getTierLimit,
  tierHasFeature,
  isUnlimited,
  getAllTiers,
  getNextTier,
  getFormattedPrice,
  getAnnualSavings,
  FEATURE_DISPLAY_NAMES,
  LIMIT_DISPLAY_NAMES,
  formatLimitValue,
};
