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

      // Add the owner as a member
      const { error: memberError } = await supabase
        .from('user_organisations')
        .insert({
          organisation_id: org.id,
          user_id: ownerId,
          org_role: ORG_ROLES.ORG_OWNER,
          is_active: true,
          is_default: true,
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Organisation owner membership error:', memberError);
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
      // First get the user_organisations memberships
      const { data: memberships, error: memberError } = await supabase
        .from('user_organisations')
        .select('*')
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .order('org_role', { ascending: true })
        .order('created_at', { ascending: true });

      if (memberError) {
        console.error('Organisation getMembers error:', memberError);
        throw memberError;
      }

      console.log('Memberships found:', memberships?.length);

      if (!memberships || memberships.length === 0) {
        return [];
      }

      // Get user IDs from memberships
      const userIds = memberships.map(m => m.user_id);
      console.log('User IDs to fetch:', userIds);

      // Fetch profiles one by one to avoid potential .in() issues
      // This is less efficient but more reliable
      const profiles = [];
      for (const userId of userIds) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, role')
          .eq('id', userId)
          .single();
        
        if (!profileError && profile) {
          profiles.push(profile);
        } else {
          console.log('Failed to fetch profile for user:', userId, profileError?.message);
        }
      }

      console.log('Profiles fetched:', profiles.length);

      // Map profiles to memberships
      const profileMap = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      console.log('Profile map keys:', Object.keys(profileMap));

      return memberships.map(m => ({
        ...m,
        user: profileMap[m.user_id] || null
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
   * @returns {Promise<Object>} Created membership
   */
  async addMember(organisationId, userId, role = ORG_ROLES.ORG_MEMBER, invitedBy = null) {
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
        // Reactivate existing membership
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
        return data;
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
          accepted_at: new Date().toISOString(), // Auto-accept for now
        })
        .select()
        .single();

      if (error) {
        console.error('Organisation addMember error:', error);
        throw error;
      }

      return data;
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

      if (membership && membership[0]?.org_role === ORG_ROLES.ORG_OWNER) {
        throw new Error('Cannot remove the organisation owner');
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

      // If promoting to owner, demote current owner to admin
      if (newRole === ORG_ROLES.ORG_OWNER && currentRole !== ORG_ROLES.ORG_OWNER) {
        // Find current owner
        const { data: currentOwner } = await supabase
          .from('user_organisations')
          .select('id')
          .eq('organisation_id', organisationId)
          .eq('org_role', ORG_ROLES.ORG_OWNER)
          .limit(1);

        if (currentOwner && currentOwner.length > 0) {
          // Demote current owner to admin
          await supabase
            .from('user_organisations')
            .update({
              org_role: ORG_ROLES.ORG_ADMIN,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentOwner[0].id);
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
}

// Singleton instance
export const organisationService = new OrganisationService();

export default organisationService;
