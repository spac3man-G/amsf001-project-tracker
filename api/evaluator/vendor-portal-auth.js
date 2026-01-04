/**
 * Vendor Portal Authentication API
 * 
 * Handles authentication for the vendor portal using access codes.
 * Vendors don't have full accounts - they authenticate with time-limited codes.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.5)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/evaluator/vendor-portal-auth
 * 
 * Authenticates a vendor using their access code.
 * Returns vendor info and a session token if successful.
 * 
 * Request body:
 * {
 *   "accessCode": "ABC12345"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "vendor": { id, name, evaluation_project_id, ... },
 *   "evaluationProject": { id, name, client_name, ... },
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

    // Look up vendor by access code
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        description,
        website,
        evaluation_project_id,
        portal_enabled,
        portal_access_code,
        portal_access_expires_at,
        status
      `)
      .eq('portal_access_code', cleanCode)
      .eq('portal_enabled', true)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .single();

    if (vendorError || !vendor) {
      console.log('Vendor lookup failed:', vendorError);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid access code'
      });
    }

    // Check if code has expired
    if (vendor.portal_access_expires_at) {
      const expiresAt = new Date(vendor.portal_access_expires_at);
      if (expiresAt < new Date()) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Access code has expired. Please contact the evaluation team for a new code.'
        });
      }
    }

    // Get evaluation project details
    const { data: evaluationProject, error: evalError } = await supabase
      .from('evaluation_projects')
      .select(`
        id,
        name,
        description,
        client_name,
        status,
        organisation_id
      `)
      .eq('id', vendor.evaluation_project_id)
      .single();

    if (evalError || !evaluationProject) {
      console.error('Evaluation project lookup failed:', evalError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to retrieve evaluation details'
      });
    }

    // Generate a simple session token
    // In production, you might want to use JWT or store sessions in DB
    const sessionToken = generateSessionToken(vendor.id);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // 24 hour session

    // Log the portal access
    try {
      await supabase.from('evaluation_audit_log').insert({
        evaluation_project_id: vendor.evaluation_project_id,
        action: 'vendor_portal_login',
        entity_type: 'vendor',
        entity_id: vendor.id,
        details: {
          vendor_name: vendor.name,
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
      vendor: {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        website: vendor.website,
        status: vendor.status
      },
      evaluationProject: {
        id: evaluationProject.id,
        name: evaluationProject.name,
        clientName: evaluationProject.client_name
      },
      sessionToken,
      expiresAt: sessionExpiresAt.toISOString()
    });

  } catch (error) {
    console.error('Vendor portal auth error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Generate a simple session token
 * @param {string} vendorId - Vendor UUID
 * @returns {string} Session token
 */
function generateSessionToken(vendorId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const vendorPart = vendorId.substring(0, 8);
  return `vp_${vendorPart}_${timestamp}_${random}`;
}

/**
 * Middleware to verify vendor portal session
 * Can be used by other API endpoints
 */
export async function verifyVendorSession(sessionToken) {
  if (!sessionToken || !sessionToken.startsWith('vp_')) {
    return null;
  }

  // Extract vendor ID part from token
  const parts = sessionToken.split('_');
  if (parts.length < 3) {
    return null;
  }

  const vendorIdPart = parts[1];

  // Look up vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, name, evaluation_project_id, portal_enabled')
    .like('id', `${vendorIdPart}%`)
    .eq('portal_enabled', true)
    .single();

  if (error || !vendor) {
    return null;
  }

  return vendor;
}
