/**
 * Subscription Service
 * 
 * Manages subscription-related operations:
 * - Check if organisation is within limits
 * - Get current usage metrics
 * - Feature access checks
 * - Upgrade/downgrade handling
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import { supabase } from '../lib/supabase';
import { 
  SUBSCRIPTION_TIERS,
  getTierConfig, 
  getTierLimit, 
  tierHasFeature,
  isUnlimited,
  getNextTier,
  formatLimitValue,
  LIMIT_DISPLAY_NAMES
} from '../lib/subscriptionTiers';

// ============================================================================
// LIMIT TYPES
// ============================================================================

export const LIMIT_TYPES = {
  MEMBERS: 'members',
  PROJECTS: 'projects',
  STORAGE: 'storageGB',
  API_CALLS: 'apiCallsPerDay',
};

// ============================================================================
// SUBSCRIPTION SERVICE CLASS
// ============================================================================

class SubscriptionService {
  /**
   * Get organisation's subscription tier
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<string>} Tier ID (defaults to 'free')
   */
  async getOrganisationTier(organisationId) {
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('subscription_tier')
        .eq('id', organisationId)
        .single();

      if (error || !data) {
        console.error('Error fetching organisation tier:', error);
        return SUBSCRIPTION_TIERS.FREE;
      }

      return data.subscription_tier || SUBSCRIPTION_TIERS.FREE;
    } catch (err) {
      console.error('SubscriptionService.getOrganisationTier error:', err);
      return SUBSCRIPTION_TIERS.FREE;
    }
  }

  /**
   * Get current member count for an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<number>} Member count
   */
  async getMemberCount(organisationId) {
    try {
      const { count, error } = await supabase
        .from('user_organisations')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', organisationId)
        .eq('is_active', true);

      if (error) {
        console.error('Error counting members:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('SubscriptionService.getMemberCount error:', err);
      return 0;
    }
  }

  /**
   * Get current project count for an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<number>} Project count
   */
  async getProjectCount(organisationId) {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', organisationId)
        .neq('status', 'deleted');

      if (error) {
        console.error('Error counting projects:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('SubscriptionService.getProjectCount error:', err);
      return 0;
    }
  }

  /**
   * Get pending invitation count for an organisation
   * (Counts toward member limit)
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<number>} Pending invitation count
   */
  async getPendingInvitationCount(organisationId) {
    try {
      const { count, error } = await supabase
        .from('org_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', organisationId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error counting invitations:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('SubscriptionService.getPendingInvitationCount error:', err);
      return 0;
    }
  }

  /**
   * Check if organisation can add more members
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Object>} { allowed, current, limit, remaining }
   */
  async checkMemberLimit(organisationId) {
    const tier = await this.getOrganisationTier(organisationId);
    const limit = getTierLimit(tier, LIMIT_TYPES.MEMBERS);
    
    if (isUnlimited(limit)) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity };
    }

    // Count both active members AND pending invitations
    const memberCount = await this.getMemberCount(organisationId);
    const pendingCount = await this.getPendingInvitationCount(organisationId);
    const current = memberCount + pendingCount;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      current,
      limit,
      remaining,
      memberCount,
      pendingCount,
    };
  }

  /**
   * Check if organisation can add more projects
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Object>} { allowed, current, limit, remaining }
   */
  async checkProjectLimit(organisationId) {
    const tier = await this.getOrganisationTier(organisationId);
    const limit = getTierLimit(tier, LIMIT_TYPES.PROJECTS);
    
    if (isUnlimited(limit)) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity };
    }

    const current = await this.getProjectCount(organisationId);
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      current,
      limit,
      remaining,
    };
  }

  /**
   * Generic limit check
   * @param {string} organisationId - Organisation UUID
   * @param {string} limitType - Type of limit to check
   * @returns {Promise<Object>} Limit check result
   */
  async checkLimit(organisationId, limitType) {
    switch (limitType) {
      case LIMIT_TYPES.MEMBERS:
        return this.checkMemberLimit(organisationId);
      case LIMIT_TYPES.PROJECTS:
        return this.checkProjectLimit(organisationId);
      default:
        console.warn(`Unknown limit type: ${limitType}`);
        return { allowed: true, current: 0, limit: Infinity, remaining: Infinity };
    }
  }

  /**
   * Check if organisation has access to a feature
   * @param {string} organisationId - Organisation UUID
   * @param {string} featureName - Feature name to check
   * @returns {Promise<boolean>} Whether feature is available
   */
  async hasFeature(organisationId, featureName) {
    try {
      const tier = await this.getOrganisationTier(organisationId);
      return tierHasFeature(tier, featureName);
    } catch (err) {
      console.error('SubscriptionService.hasFeature error:', err);
      return false;
    }
  }

  /**
   * Get comprehensive current usage for dashboard
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Object>} Usage metrics
   */
  async getCurrentUsage(organisationId) {
    try {
      const tier = await this.getOrganisationTier(organisationId);
      const tierConfig = getTierConfig(tier);

      // Fetch all counts in parallel
      const [memberCount, projectCount, pendingCount] = await Promise.all([
        this.getMemberCount(organisationId),
        this.getProjectCount(organisationId),
        this.getPendingInvitationCount(organisationId),
      ]);

      const memberLimit = tierConfig.limits.members;
      const projectLimit = tierConfig.limits.projects;

      return {
        tier,
        tierConfig,
        members: {
          current: memberCount,
          pending: pendingCount,
          total: memberCount + pendingCount,
          limit: memberLimit,
          percentage: isUnlimited(memberLimit) ? 0 : Math.round(((memberCount + pendingCount) / memberLimit) * 100),
          remaining: isUnlimited(memberLimit) ? Infinity : Math.max(0, memberLimit - memberCount - pendingCount),
          formatted: {
            current: `${memberCount + pendingCount}`,
            limit: formatLimitValue(LIMIT_TYPES.MEMBERS, memberLimit),
          },
        },
        projects: {
          current: projectCount,
          limit: projectLimit,
          percentage: isUnlimited(projectLimit) ? 0 : Math.round((projectCount / projectLimit) * 100),
          remaining: isUnlimited(projectLimit) ? Infinity : Math.max(0, projectLimit - projectCount),
          formatted: {
            current: `${projectCount}`,
            limit: formatLimitValue(LIMIT_TYPES.PROJECTS, projectLimit),
          },
        },
        // Storage usage would require additional implementation
        storage: {
          current: 0,
          limit: tierConfig.limits.storageGB,
          percentage: 0,
          formatted: {
            current: '0MB',
            limit: formatLimitValue(LIMIT_TYPES.STORAGE, tierConfig.limits.storageGB),
          },
        },
        nextTier: getNextTier(tier),
      };
    } catch (err) {
      console.error('SubscriptionService.getCurrentUsage error:', err);
      throw err;
    }
  }

  /**
   * Generate a structured limit error
   * @param {string} limitType - Type of limit exceeded
   * @param {Object} limitCheck - Result from checkLimit
   * @param {string} organisationId - Organisation UUID
   * @returns {Object} Structured error object
   */
  async createLimitError(limitType, limitCheck, organisationId) {
    const tier = await this.getOrganisationTier(organisationId);
    const nextTier = getNextTier(tier);
    const limitName = LIMIT_DISPLAY_NAMES[limitType] || limitType;

    return {
      code: 'LIMIT_EXCEEDED',
      type: limitType,
      message: `You've reached the ${limitName.toLowerCase()} limit for your plan.`,
      details: {
        current: limitCheck.current,
        limit: limitCheck.limit,
        limitName,
      },
      upgrade: nextTier ? {
        available: true,
        tierName: nextTier.name,
        tierId: nextTier.id,
        newLimit: nextTier.limits[limitType],
        message: `Upgrade to ${nextTier.name} for ${formatLimitValue(limitType, nextTier.limits[limitType])} ${limitName.toLowerCase()}.`,
      } : {
        available: false,
        message: 'Contact us for enterprise solutions.',
      },
    };
  }

  /**
   * Update organisation's subscription tier
   * (Called after successful payment)
   * @param {string} organisationId - Organisation UUID
   * @param {string} newTier - New tier ID
   * @returns {Promise<boolean>} Success status
   */
  async updateTier(organisationId, newTier) {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({
          subscription_tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Error updating tier:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('SubscriptionService.updateTier error:', err);
      return false;
    }
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
