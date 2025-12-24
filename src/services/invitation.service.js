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
 * 
 * @version 1.0
 * @created 24 December 2025
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
   * @returns {Promise<Object>} Created invitation with token
   */
  async createInvitation({ organisationId, email, orgRole = 'org_member', invitedBy, expiryDays = 7 }) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();
      
      if (existingUser) {
        return {
          success: false,
          error: 'USER_EXISTS',
          message: 'User already has an account',
          userId: existingUser.id
        };
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
      
      return {
        success: true,
        invitation: invitation
      };
    } catch (error) {
      console.error('InvitationService.createInvitation error:', error);
      throw error;
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
