/**
 * Organisation Service
 * 
 * Manages organisation-level operations for multi-tenancy.
 * Unlike project-scoped services, this service operates at the organisation level.
 * 
 * Features:
 * - CRUD operations for organisations
 * - Member management (invite, remove, role changes)
 * - Settings management
 * - Feature flag control
 * 
 * @version 1.0
 * @created 22 December 2025
 */

import { supabase } from '../lib/supabase';
import { ORG_ROLES } from '../lib/permissionMatrix';

/**
 * Organisation Service Class
 */
export class OrganisationService {
  constructor() {
    this.tableName = 'organisations';
  }

  // ============================================
  // ORGANISATION CRUD
  // ============================================

  /**
   * Get organisation by ID
   * @param {string} id - Organisation UUID
   * @returns {Promise<Object|null>} Organisation or null
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Organisation getById error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Organisation getById failed:', error);
      throw error;
    }
  }

  /**
   * Get organisation by slug
   * @param {string} slug - Organisation slug
   * @returns {Promise<Object|null>} Organisation or null
   */
  async getBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Organisation getBySlug error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Organisation getBySlug failed:', error);
      throw error;
    }
  }

  /**
   * Create a new organisation
   * @param {Object} data - Organisation data
   * @param {string} data.name - Organisation name (required)
   * @param {string} data.slug - URL-friendly slug (required, unique)
   * @param {string} data.display_name - Display name (optional)
   * @param {string} ownerId - User ID of the organisation owner
   * @returns {Promise<Object>} Created organisation
   */
  async create(data, ownerId) {
    try {
      if (!data.name || !data.slug) {
        throw new Error('name and slug are required');
      }

      if (!ownerId) {
        throw new Error('ownerId is required');
      }

      // Create the organisation
      const { data: org, error: orgError } = await supabase
        .from(this.tableName)
        .insert({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          display_name: data.display_name || null,
          logo_url: data.logo_url || null,
          primary_color: data.primary_color || null,
          settings: data.settings || {
            features: {
              ai_chat_enabled: true,
              receipt_scanner_enabled: true,
              variations_enabled: true,
              report_builder_enabled: true,
            },
            defaults: {
              currency: 'GBP',
              hours_per_day: 8,
              date_format: 'DD/MM/YYYY',
              timezone: 'Europe/London',
            },
          },
          is_active: true,
          subscription_tier: 'free',
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organisation create error:', orgError);
        throw orgError;
      }

      // Add the creator as an admin
      const { error: memberError } = await supabase
        .from('user_organisations')
        .insert({
          organisation_id: org.id,
          user_id: ownerId,
          org_role: ORG_ROLES.ORG_ADMIN,
          is_active: true,
          is_default: true,
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Organisation admin membership error:', memberError);
        // Try to clean up the org if member creation fails
        await supabase.from(this.tableName).delete().eq('id', org.id);
        throw memberError;
      }

      return org;
    } catch (error) {
      console.error('Organisation create failed:', error);
      throw error;
    }
  }

  /**
   * Create a new organisation with user as Supplier PM
   * Used when an existing user creates a new organisation from the dropdown
   * @param {Object} data - Organisation data
   * @param {string} data.name - Organisation name (required)
   * @param {string} data.slug - URL-friendly slug (required, unique)
   * @param {string} data.display_name - Display name (optional)
   * @param {string} ownerId - User ID of the organisation owner
   * @returns {Promise<Object>} Created organisation
   */
  async createWithSupplierPM(data, ownerId) {
    try {
      if (!data.name || !data.slug) {
        throw new Error('name and slug are required');
      }

      if (!ownerId) {
        throw new Error('ownerId is required');
      }

      // Create the organisation
      const { data: org, error: orgError } = await supabase
        .from(this.tableName)
        .insert({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          display_name: data.display_name || data.name,
          logo_url: data.logo_url || null,
          primary_color: data.primary_color || '#10b981',
          settings: data.settings || {
            features: {
              ai_chat_enabled: true,
              receipt_scanner_enabled: true,
              variations_enabled: true,
              report_builder_enabled: true,
            },
            defaults: {
              currency: 'GBP',
              hours_per_day: 8,
              date_format: 'DD/MM/YYYY',
              timezone: 'Europe/London',
            },
          },
          is_active: true,
          subscription_tier: 'free',
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organisation create error:', orgError);
        throw orgError;
      }

      // Add the creator as a Supplier PM (not org_admin)
      const { error: memberError } = await supabase
        .from('user_organisations')
        .insert({
          organisation_id: org.id,
          user_id: ownerId,
          org_role: ORG_ROLES.SUPPLIER_PM,
          is_active: true,
          is_default: false, // Don't make new orgs default automatically
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Organisation supplier_pm membership error:', memberError);
        // Try to clean up the org if member creation fails
        await supabase.from(this.tableName).delete().eq('id', org.id);
        throw memberError;
      }

      return org;
    } catch (error) {
      console.error('Organisation createWithSupplierPM failed:', error);
      throw error;
    }
  }

  /**
   * Update organisation details
   * @param {string} id - Organisation UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated organisation
   */
  async update(id, updates) {
    try {
      // Sanitize updates - don't allow certain fields to be updated
      const safeUpdates = { ...updates };
      delete safeUpdates.id;
      delete safeUpdates.slug; // Slug changes could break URLs
      delete safeUpdates.created_at;
      delete safeUpdates.created_by;

      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Organisation update error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Organisation update failed:', error);
      throw error;
    }
  }

  /**
   * Soft delete organisation (deactivate)
   * @param {string} id - Organisation UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Organisation delete error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Organisation delete failed:', error);
      throw error;
    }
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  /**
   * Update organisation settings
   * @param {string} id - Organisation UUID
   * @param {Object} settings - New settings object (merged with existing)
   * @returns {Promise<Object>} Updated organisation
   */
  async updateSettings(id, settings) {
    try {
      // Get current organisation to merge settings
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Organisation not found');
      }

      const mergedSettings = {
        ...current.settings,
        ...settings,
        features: {
          ...(current.settings?.features || {}),
          ...(settings.features || {}),
        },
        defaults: {
          ...(current.settings?.defaults || {}),
          ...(settings.defaults || {}),
        },
        branding: {
          ...(current.settings?.branding || {}),
          ...(settings.branding || {}),
        },
        limits: {
          ...(current.settings?.limits || {}),
          ...(settings.limits || {}),
        },
      };

      return this.update(id, { settings: mergedSettings });
    } catch (error) {
      console.error('Organisation updateSettings failed:', error);
      throw error;
    }
  }

  /**
   * Toggle a feature flag
   * @param {string} id - Organisation UUID
   * @param {string} feature - Feature key
   * @param {boolean} enabled - Enable or disable
   * @returns {Promise<Object>} Updated organisation
   */
  async toggleFeature(id, feature, enabled) {
    try {
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Organisation not found');
      }

      const features = {
        ...(current.settings?.features || {}),
        [feature]: enabled,
      };

      return this.updateSettings(id, { features });
    } catch (error) {
      console.error('Organisation toggleFeature failed:', error);
      throw error;
    }
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * Get all members of an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Array of members with user details
   */
  async getMembers(organisationId) {
    try {
      // Use the view that joins user_organisations with profiles
      const { data, error } = await supabase
        .from('organisation_members_with_profiles')
        .select('*')
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .order('org_role', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Organisation getMembers error:', error);
        throw error;
      }

      // Transform to expected format with nested user object
      return (data || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        organisation_id: m.organisation_id,
        org_role: m.org_role,
        is_active: m.is_active,
        is_default: m.is_default,
        invited_by: m.invited_by,
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
        created_at: m.created_at,
        updated_at: m.updated_at,
        user: m.user_email ? {
          id: m.user_id,
          email: m.user_email,
          full_name: m.user_full_name,
          avatar_url: null,
          role: m.user_role
        } : null
      }));
    } catch (error) {
      console.error('Organisation getMembers failed:', error);
      throw error;
    }
  }

  /**
   * Add a member to an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {string} userId - User UUID
   * @param {string} role - Organisation role (org_admin, org_member)
   * @param {string} invitedBy - UUID of user who invited
   * @param {boolean} skipLimitCheck - Skip limit check (for system admins)
   * @returns {Promise<Object>} Created membership or error object
   */
  async addMember(organisationId, userId, role = ORG_ROLES.ORG_MEMBER, invitedBy = null, skipLimitCheck = false) {
    try {
      // Validate role
      if (!Object.values(ORG_ROLES).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('user_organisations')
        .select('id, is_active')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        if (existing[0].is_active) {
          throw new Error('User is already a member of this organisation');
        }
        // Reactivating - still counts toward limit, check it
      }

      // ========================================================================
      // CHECK MEMBER LIMIT
      // ========================================================================
      if (!skipLimitCheck && !(existing && existing.length > 0 && !existing[0].is_active)) {
        // Get organisation's subscription tier
        const { data: org } = await supabase
          .from('organisations')
          .select('subscription_tier')
          .eq('id', organisationId)
          .single();

        const tier = org?.subscription_tier || 'free';

        // Define tier limits (Infinity = unlimited)
        const tierLimits = {
          free: Infinity,       // Unlimited for free tier
          starter: Infinity,
          professional: Infinity,
          enterprise: Infinity,
        };

        const memberLimit = tierLimits[tier] ?? Infinity;

        if (memberLimit !== Infinity) {
          // Count active members
          const { count: memberCount } = await supabase
            .from('user_organisations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', organisationId)
            .eq('is_active', true);

          // Count pending invitations
          const { count: pendingCount } = await supabase
            .from('org_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', organisationId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

          const totalMembers = (memberCount || 0) + (pendingCount || 0);

          if (totalMembers >= memberLimit) {
            const tierNames = {
              free: 'Free',
              starter: 'Starter',
              professional: 'Professional',
              enterprise: 'Enterprise',
            };

            return {
              success: false,
              error: 'LIMIT_EXCEEDED',
              code: 'MEMBER_LIMIT_EXCEEDED',
              message: `You've reached the member limit (${memberLimit}) for your ${tierNames[tier]} plan.`,
              details: {
                current: totalMembers,
                limit: memberLimit,
                tier: tier,
              },
              upgrade: tier !== 'enterprise' ? {
                available: true,
                message: 'Upgrade your plan to add more members.',
              } : {
                available: false,
              },
            };
          }
        }
      }

      // Reactivate existing membership if applicable
      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('user_organisations')
          .update({
            org_role: role,
            is_active: true,
            accepted_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }

      // Create new membership
      const { data, error } = await supabase
        .from('user_organisations')
        .insert({
          organisation_id: organisationId,
          user_id: userId,
          org_role: role,
          is_active: true,
          is_default: false,
          invited_by: invitedBy,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Organisation addMember error:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Organisation addMember failed:', error);
      throw error;
    }
  }

  /**
   * Remove a member from an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeMember(organisationId, userId) {
    try {
      // Check if user is the owner
      const { data: membership } = await supabase
        .from('user_organisations')
        .select('org_role')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .limit(1);

      if (membership && membership[0]?.org_role === ORG_ROLES.ORG_ADMIN) {
        // Check if this is the last admin - don't allow removal
        const { data: adminCount } = await supabase
          .from('user_organisations')
          .select('id', { count: 'exact' })
          .eq('organisation_id', organisationId)
          .eq('org_role', ORG_ROLES.ORG_ADMIN);
        
        if (adminCount && adminCount.length <= 1) {
          throw new Error('Cannot remove the last organisation admin');
        }
      }

      // Delete the membership
      const { error } = await supabase
        .from('user_organisations')
        .delete()
        .eq('organisation_id', organisationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Organisation removeMember error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Organisation removeMember failed:', error);
      throw error;
    }
  }

  /**
   * Change a member's role
   * @param {string} organisationId - Organisation UUID
   * @param {string} userId - User UUID
   * @param {string} newRole - New role
   * @param {string} currentUserId - ID of user making the change
   * @returns {Promise<Object>} Updated membership
   */
  async changeMemberRole(organisationId, userId, newRole, currentUserId = null) {
    try {
      // Validate role
      if (!Object.values(ORG_ROLES).includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
      }

      // Get current membership
      const { data: membership } = await supabase
        .from('user_organisations')
        .select('id, org_role')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .limit(1);

      if (!membership || membership.length === 0) {
        throw new Error('User is not a member of this organisation');
      }

      const currentRole = membership[0].org_role;

      // If demoting from admin, check if this is the last admin
      if (currentRole === ORG_ROLES.ORG_ADMIN && newRole === ORG_ROLES.ORG_MEMBER) {
        const { data: adminCount } = await supabase
          .from('user_organisations')
          .select('id', { count: 'exact' })
          .eq('organisation_id', organisationId)
          .eq('org_role', ORG_ROLES.ORG_ADMIN);
        
        if (adminCount && adminCount.length <= 1) {
          throw new Error('Cannot demote the last organisation admin');
        }
      }

      // Update the role
      const { data, error } = await supabase
        .from('user_organisations')
        .update({
          org_role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership[0].id)
        .select()
        .single();

      if (error) {
        console.error('Organisation changeMemberRole error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Organisation changeMemberRole failed:', error);
      throw error;
    }
  }

  /**
   * Get user's role in an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {string} userId - User UUID
   * @returns {Promise<string|null>} Role or null if not a member
   */
  async getUserRole(organisationId, userId) {
    try {
      const { data, error } = await supabase
        .from('user_organisations')
        .select('org_role')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Organisation getUserRole error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0].org_role : null;
    } catch (error) {
      console.error('Organisation getUserRole failed:', error);
      throw error;
    }
  }

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  /**
   * Get all projects in an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Array of projects
   */
  async getProjects(organisationId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('name');

      if (error) {
        console.error('Organisation getProjects error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Organisation getProjects failed:', error);
      throw error;
    }
  }

  /**
   * Get organisation statistics
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(organisationId) {
    try {
      // Get member count
      const { data: members } = await supabase
        .from('user_organisations')
        .select('id')
        .eq('organisation_id', organisationId)
        .eq('is_active', true);

      // Get project count
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organisation_id', organisationId);

      return {
        memberCount: members?.length || 0,
        projectCount: projects?.length || 0,
      };
    } catch (error) {
      console.error('Organisation getStatistics failed:', error);
      throw error;
    }
  }

  // ============================================
  // PROJECT ASSIGNMENT MANAGEMENT
  // ============================================

  /**
   * Get all project assignments for a specific member
   * Uses a SECURITY DEFINER database function to bypass RLS
   * @param {string} organisationId - Organisation UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of project assignments with project details
   */
  async getMemberProjectAssignments(organisationId, userId) {
    try {
      // Use database function that bypasses RLS for org admin operations
      const { data, error } = await supabase
        .rpc('get_user_project_assignments_for_org', {
          p_organisation_id: organisationId,
          p_user_id: userId
        });

      if (error) {
        console.error('getMemberProjectAssignments error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('getMemberProjectAssignments failed:', error);
      throw error;
    }
  }

  /**
   * Add a member to a project
   * Uses a SECURITY DEFINER database function to bypass RLS
   * @param {string} userId - User UUID
   * @param {string} projectId - Project UUID
   * @param {string} role - Project role (supplier_pm, customer_pm, contributor, viewer, etc.)
   * @returns {Promise<Object>} Created assignment ID
   */
  async addMemberToProject(userId, projectId, role) {
    try {
      const { data, error } = await supabase
        .rpc('add_user_to_project_as_org_admin', {
          p_user_id: userId,
          p_project_id: projectId,
          p_project_role: role,
        });

      if (error) {
        console.error('addMemberToProject error:', error);
        throw new Error(error.message || 'Failed to add member to project');
      }

      return { id: data };
    } catch (error) {
      console.error('addMemberToProject failed:', error);
      throw error;
    }
  }

  /**
   * Remove a member from a project
   * Uses a SECURITY DEFINER database function to bypass RLS
   * @param {string} userId - User UUID
   * @param {string} projectId - Project UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeMemberFromProject(userId, projectId) {
    try {
      const { error } = await supabase
        .rpc('remove_user_from_project_as_org_admin', {
          p_user_id: userId,
          p_project_id: projectId,
        });

      if (error) {
        console.error('removeMemberFromProject error:', error);
        throw new Error(error.message || 'Failed to remove member from project');
      }

      return true;
    } catch (error) {
      console.error('removeMemberFromProject failed:', error);
      throw error;
    }
  }

  /**
   * Change a member's role on a project
   * Uses a SECURITY DEFINER database function to bypass RLS
   * @param {string} userId - User UUID
   * @param {string} projectId - Project UUID
   * @param {string} newRole - New project role
   * @returns {Promise<boolean>} Success status
   */
  async changeMemberProjectRole(userId, projectId, newRole) {
    try {
      const { error } = await supabase
        .rpc('change_user_project_role_as_org_admin', {
          p_user_id: userId,
          p_project_id: projectId,
          p_new_role: newRole,
        });

      if (error) {
        console.error('changeMemberProjectRole error:', error);
        throw new Error(error.message || 'Failed to update project role');
      }

      return true;
    } catch (error) {
      console.error('changeMemberProjectRole failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const organisationService = new OrganisationService();

export default organisationService;
