/**
 * Invitation Service
 *
 * Manages organisation invitations for users who don't yet have accounts.
 *
 * Features:
 * - Create invitations with secure tokens
 * - Validate and retrieve invitations by token
 * - Accept invitations (create user_organisations record)
 * - Revoke/resend invitations
 * - List pending invitations for an organisation
 * - Support project pre-assignments with invitations
 *
 * @version 2.0
 * @created 24 December 2025
 * @updated 11 January 2026 - Added project assignments support
 */

import { supabase } from '../lib/supabase';

/**
 * Generate a secure random token
 * @param {number} length - Token length (default 64)
 * @returns {string} Secure random token
 */
function generateSecureToken(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Invitation Service Class
 */
class InvitationService {
  constructor() {
    this.tableName = 'org_invitations';
  }

  /**
   * Create a new invitation
   * @param {Object} params - Invitation parameters
   * @param {string} params.organisationId - Organisation UUID
   * @param {string} params.email - Invitee email
   * @param {string} params.orgRole - Role to assign (org_admin, org_member)
   * @param {string} params.invitedBy - User ID of person sending invite
   * @param {number} params.expiryDays - Days until expiry (default 7)
   * @param {Array<{projectId: string, role: string}>} params.projectAssignments - Optional project assignments
   * @returns {Promise<Object>} Created invitation with token
   */
  async createInvitation({ organisationId, email, orgRole = 'org_member', invitedBy, expiryDays = 7, skipLimitCheck = false, projectAssignments = [] }) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // ========================================================================
      // CHECK MEMBER LIMIT (unless explicitly skipped, e.g., for system admins)
      // ========================================================================
      if (!skipLimitCheck) {
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
            .from(this.tableName)
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
                message: 'Upgrade your plan to invite more members.',
              } : {
                available: false,
              },
            };
          }
        }
      }
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        // User exists - add them immediately to org and projects
        return this.addExistingUserToOrgAndProjects({
          organisationId,
          userId: existingUser.id,
          userEmail: existingUser.email,
          userName: existingUser.full_name,
          orgRole,
          invitedBy,
          projectAssignments
        });
      }
      
      // Check if there's already a pending invitation for this email + org
      const { data: existingInvite } = await supabase
        .from(this.tableName)
        .select('id, token, expires_at')
        .eq('organisation_id', organisationId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (existingInvite) {
        return {
          success: false,
          error: 'INVITATION_EXISTS',
          message: 'A pending invitation already exists for this email',
          invitation: existingInvite
        };
      }
      
      // Generate secure token
      const token = generateSecureToken(64);
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      // Create invitation
      const { data: invitation, error } = await supabase
        .from(this.tableName)
        .insert({
          organisation_id: organisationId,
          email: normalizedEmail,
          org_role: orgRole,
          token: token,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      // Add project assignments if provided
      if (invitation && projectAssignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('invitation_project_assignments')
          .insert(
            projectAssignments.map(pa => ({
              invitation_id: invitation.id,
              project_id: pa.projectId,
              role: pa.role
            }))
          );

        if (assignmentError) {
          console.error('Error creating project assignments:', assignmentError);
          // Non-fatal - invitation still created, but warn about failed assignments
        }
      }

      return {
        success: true,
        invitation: invitation,
        isNewUser: true,
        projectAssignmentsCount: projectAssignments.length
      };
    } catch (error) {
      console.error('InvitationService.createInvitation error:', error);
      throw error;
    }
  }

  /**
   * Add existing user to organisation and projects immediately
   * Called when inviting a user who already has an account
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async addExistingUserToOrgAndProjects({
    organisationId,
    userId,
    userEmail,
    userName,
    orgRole,
    invitedBy,
    projectAssignments = []
  }) {
    try {
      // 1. Check if already a member
      const { data: existingMembership } = await supabase
        .from('user_organisations')
        .select('id, is_active')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .single();

      if (existingMembership) {
        if (existingMembership.is_active) {
          return {
            success: false,
            error: 'ALREADY_MEMBER',
            message: 'User is already a member of this organisation',
            isNewUser: false
          };
        } else {
          // Reactivate inactive membership
          await supabase
            .from('user_organisations')
            .update({
              is_active: true,
              org_role: orgRole,
              accepted_at: new Date().toISOString()
            })
            .eq('id', existingMembership.id);
        }
      } else {
        // Add to organisation
        const { error: orgError } = await supabase
          .from('user_organisations')
          .insert({
            organisation_id: organisationId,
            user_id: userId,
            org_role: orgRole,
            is_active: true,
            is_default: false,
            invited_by: invitedBy,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString()
          });

        if (orgError) {
          console.error('Error adding user to organisation:', orgError);
          throw orgError;
        }
      }

      // 2. Add to projects
      const projectResults = [];

      for (const pa of projectAssignments) {
        try {
          // Check if already assigned to this project
          const { data: existingAssignment } = await supabase
            .from('user_projects')
            .select('id')
            .eq('user_id', userId)
            .eq('project_id', pa.projectId)
            .single();

          if (existingAssignment) {
            projectResults.push({
              projectId: pa.projectId,
              success: false,
              error: 'Already assigned to this project'
            });
            continue;
          }

          // Add to project
          const { error: projectError } = await supabase
            .from('user_projects')
            .insert({
              user_id: userId,
              project_id: pa.projectId,
              role: pa.role,
              is_default: false,
              created_at: new Date().toISOString()
            });

          if (projectError) {
            projectResults.push({
              projectId: pa.projectId,
              success: false,
              error: projectError.message
            });
          } else {
            projectResults.push({
              projectId: pa.projectId,
              success: true
            });
          }
        } catch (err) {
          projectResults.push({
            projectId: pa.projectId,
            success: false,
            error: err.message
          });
        }
      }

      const successfulProjects = projectResults.filter(r => r.success).length;
      const failedProjects = projectResults.filter(r => !r.success).length;

      return {
        success: true,
        isNewUser: false,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        projectResults: projectResults,
        message: failedProjects > 0
          ? `Added to organisation. ${successfulProjects} project(s) assigned, ${failedProjects} failed.`
          : `Added to organisation${successfulProjects > 0 ? ` and ${successfulProjects} project(s)` : ''}.`
      };
    } catch (error) {
      console.error('Error adding existing user:', error);
      return {
        success: false,
        error: error.message || 'Failed to add user'
      };
    }
  }

  /**
   * Get invitation by token
   * Uses the database function for security
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>} Invitation details or null
   */
  async getInvitationByToken(token) {
    try {
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { p_token: token });
      
      if (error) {
        console.error('Error getting invitation by token:', error);
        return null;
      }
      
      // RPC returns an array, get first item
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('InvitationService.getInvitationByToken error:', error);
      return null;
    }
  }

  /**
   * Accept an invitation
   * Called after user creates their account
   * @param {string} token - Invitation token
   * @param {string} userId - New user's UUID
   * @returns {Promise<boolean>} Success status
   */
  async acceptInvitation(token, userId) {
    try {
      const { data, error } = await supabase
        .rpc('accept_invitation', { 
          p_token: token, 
          p_user_id: userId 
        });
      
      if (error) {
        console.error('Error accepting invitation:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('InvitationService.acceptInvitation error:', error);
      return false;
    }
  }

  /**
   * Revoke a pending invitation
   * @param {string} invitationId - Invitation UUID
   * @returns {Promise<boolean>} Success status
   */
  async revokeInvitation(invitationId) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ 
          status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error revoking invitation:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('InvitationService.revokeInvitation error:', error);
      return false;
    }
  }

  /**
   * Resend an invitation (creates new token, extends expiry)
   * @param {string} invitationId - Invitation UUID
   * @param {number} expiryDays - Days until expiry (default 7)
   * @returns {Promise<Object|null>} Updated invitation or null
   */
  async resendInvitation(invitationId, expiryDays = 7) {
    try {
      const newToken = generateSecureToken(64);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ 
          token: newToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .in('status', ['pending', 'expired'])
        .select()
        .single();
      
      if (error) {
        console.error('Error resending invitation:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('InvitationService.resendInvitation error:', error);
      return null;
    }
  }

  /**
   * List pending invitations for an organisation
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} List of pending invitations
   */
  async listPendingInvitations(organisationId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          inviter:profiles!invited_by (
            full_name,
            email
          ),
          organisation:organisations (
            name,
            display_name
          ),
          project_assignments:invitation_project_assignments (
            id,
            project_id,
            role,
            project:projects (
              id,
              name,
              reference
            )
          )
        `)
        .eq('organisation_id', organisationId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });
      
      if (error) {
        console.error('Error listing pending invitations:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('InvitationService.listPendingInvitations error:', error);
      return [];
    }
  }

  /**
   * List all invitations for an organisation (including accepted/revoked)
   * @param {string} organisationId - Organisation UUID
   * @param {Object} options - Filter options
   * @param {string} options.status - Filter by status
   * @param {number} options.limit - Max results
   * @returns {Promise<Array>} List of invitations
   */
  async listInvitations(organisationId, { status = null, limit = 50 } = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          inviter:profiles!invited_by (
            full_name,
            email
          )
        `)
        .eq('organisation_id', organisationId)
        .order('invited_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error listing invitations:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('InvitationService.listInvitations error:', error);
      return [];
    }
  }

  /**
   * Check if an email has a pending invitation for an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {string} email - Email to check
   * @returns {Promise<Object|null>} Existing invitation or null
   */
  async checkExistingInvitation(organisationId, email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('organisation_id', organisationId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing invitation:', error);
      }
      
      return data || null;
    } catch (error) {
      console.error('InvitationService.checkExistingInvitation error:', error);
      return null;
    }
  }

  /**
   * Expire old invitations (for cleanup)
   * @returns {Promise<number>} Number of invitations expired
   */
  async expireOldInvitations() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select('id');
      
      if (error) {
        console.error('Error expiring invitations:', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('InvitationService.expireOldInvitations error:', error);
      return 0;
    }
  }

  /**
   * Get invitation accept URL
   * @param {string} token - Invitation token
   * @returns {string} Full URL for accepting invitation
   */
  getAcceptUrl(token) {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/accept-invite?token=${token}`;
  }
}

// Export singleton instance
export const invitationService = new InvitationService();
export default invitationService;
