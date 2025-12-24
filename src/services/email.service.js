/**
 * Email Service
 * 
 * Sends emails via Supabase Edge Functions.
 * Edge Functions use Resend API for actual email delivery.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import { supabase } from '../lib/supabase';

/**
 * Email Service Class
 */
class EmailService {
  /**
   * Send an organisation invitation email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.orgName - Organisation name
   * @param {string} params.orgDisplayName - Organisation display name
   * @param {string} params.inviterName - Name of person sending invite
   * @param {string} params.role - Role being assigned (org_admin, org_member)
   * @param {string} params.acceptUrl - URL to accept invitation
   * @returns {Promise<Object>} Result with success status
   */
  async sendInvitationEmail({ email, orgName, orgDisplayName, inviterName, role, acceptUrl }) {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          orgName,
          orgDisplayName,
          inviterName,
          role,
          acceptUrl,
        },
      });

      if (error) {
        console.error('Error invoking send-invitation function:', error);
        return {
          success: false,
          error: error.message || 'Failed to send invitation email',
        };
      }

      if (data?.error) {
        console.error('Send invitation error:', data.error);
        return {
          success: false,
          error: data.error,
        };
      }

      return {
        success: true,
        messageId: data?.messageId,
      };
    } catch (error) {
      console.error('EmailService.sendInvitationEmail error:', error);
      return {
        success: false,
        error: 'Failed to send email',
      };
    }
  }

  /**
   * Send a test email (for verification)
   * @param {string} email - Recipient email
   * @returns {Promise<Object>} Result with success status
   */
  async sendTestEmail(email) {
    return this.sendInvitationEmail({
      email,
      orgName: 'Test Organisation',
      orgDisplayName: 'Test Org',
      inviterName: 'System Admin',
      role: 'org_member',
      acceptUrl: `${window.location.origin}/accept-invite?token=test-token`,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
