/**
 * Client Portal Authentication API
 * 
 * Handles authentication for the client portal using access codes.
 * Clients authenticate with simple access codes, not full user accounts.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.2)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate a simple session token
 */
function generateSessionToken(userId, evaluationProjectId) {
  const payload = {
    uid: userId,
    epid: evaluationProjectId,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * POST /api/evaluator/client-portal-auth
 * 
 * Authenticates a client stakeholder using their access code.
 * Returns client info and a session token if successful.
 * 
 * Request body:
 * {
 *   "accessCode": "CLIENT-ABC123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "client": { userId, name, email, role, permissions },
 *   "evaluationProject": { id, name, client_name, ... },
 *   "stakeholderArea": { id, name } | null,
 *   "sessionToken": "...",
 *   "expiresAt": "..."
 * }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { accessCode } = req.body;

    // Validate input
    if (!accessCode) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Access code is required'
      });
    }

    // Clean the access code (remove spaces, uppercase)
    const cleanCode = accessCode.trim().toUpperCase();

    // Look up client by access code in evaluation_project_users
    // The access code is stored in the permissions JSON field as { accessCode: "..." }
    // We need to search for it
    const { data: users, error: usersError } = await supabase
      .from('evaluation_project_users')
      .select(`
        id,
        evaluation_project_id,
        user_id,
        role,
        stakeholder_area_id,
        permissions,
        evaluation_project:evaluation_project_id(
          id,
          name,
          description,
          client_name,
          status
        ),
        stakeholder_area:stakeholder_area_id(id, name),
        profile:user_id(
          id,
          full_name,
          email
        )
      `)
      .in('role', ['client_stakeholder', 'participant'])
      .contains('permissions', { accessCode: cleanCode });

    if (usersError) {
      console.error('User lookup error:', usersError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to authenticate'
      });
    }

    // Check if we found a matching user
    const clientUser = users && users.length > 0 ? users[0] : null;

    if (!clientUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid access code'
      });
    }

    // Check if access code has expired
    const permissions = clientUser.permissions || {};
    if (permissions.accessCodeExpiresAt) {
      const expiresAt = new Date(permissions.accessCodeExpiresAt);
      if (expiresAt < new Date()) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Access code has expired. Please contact the evaluation team for a new code.'
        });
      }
    }

    // Check if evaluation project is still active
    if (!clientUser.evaluation_project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Evaluation project not found'
      });
    }

    if (clientUser.evaluation_project.status === 'cancelled') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This evaluation project has been cancelled'
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken(
      clientUser.user_id, 
      clientUser.evaluation_project_id
    );
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // 24 hour session

    // Extract client permissions (what they can view)
    const clientPermissions = {
      canViewProgress: permissions.canViewProgress !== false, // default true
      canViewRequirements: permissions.canViewRequirements !== false, // default true
      canViewVendors: permissions.canViewVendors === true, // default false
      canViewScores: permissions.canViewScores === true, // default false
      canViewTraceability: permissions.canViewTraceability === true, // default false
      canApproveRequirements: permissions.canApproveRequirements === true // default false
    };

    // Log the portal access
    try {
      await supabase.from('evaluation_audit_log').insert({
        evaluation_project_id: clientUser.evaluation_project_id,
        action: 'client_portal_login',
        entity_type: 'evaluation_project_user',
        entity_id: clientUser.id,
        user_id: clientUser.user_id,
        details: {
          client_name: clientUser.profile?.full_name,
          ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
        }
      });
    } catch (auditError) {
      console.error('Failed to log portal access:', auditError);
      // Don't fail the login for audit log errors
    }

    // Return success response
    return res.status(200).json({
      success: true,
      client: {
        id: clientUser.id,
        userId: clientUser.user_id,
        name: clientUser.profile?.full_name || 'Client',
        email: clientUser.profile?.email,
        role: clientUser.role,
        permissions: clientPermissions
      },
      evaluationProject: {
        id: clientUser.evaluation_project.id,
        name: clientUser.evaluation_project.name,
        description: clientUser.evaluation_project.description,
        clientName: clientUser.evaluation_project.client_name,
        status: clientUser.evaluation_project.status
      },
      stakeholderArea: clientUser.stakeholder_area || null,
      sessionToken,
      expiresAt: sessionExpiresAt.toISOString()
    });

  } catch (error) {
    console.error('Client portal auth error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred'
    });
  }
}
