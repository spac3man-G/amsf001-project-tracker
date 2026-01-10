/**
 * Client Portal Token Authentication API
 *
 * Handles token-based authentication for external stakeholders.
 * Uses secure URL tokens instead of access codes for easier sharing.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/evaluator/client-portal-token
 *
 * Validates an access token and returns portal data.
 *
 * Actions:
 * - validate: Check token and return portal context
 * - approve: Submit requirement approval
 * - batch-approve: Submit batch requirement approvals
 * - final-approval: Submit final stakeholder area sign-off
 *
 * Request body:
 * {
 *   "action": "validate",
 *   "token": "abc123...",
 *   "requirementId": "uuid" (for approve action),
 *   "approval": { status, comments, note } (for approve actions)
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
    const { action, token } = req.body;

    // Validate input
    if (!action) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Action is required'
      });
    }

    if (!token) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Token is required'
      });
    }

    // Validate token first
    const tokenData = await validateToken(token);
    if (!tokenData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Route to appropriate handler
    switch (action) {
      case 'validate':
        return handleValidate(req, res, tokenData);
      case 'get-requirements':
        return handleGetRequirements(req, res, tokenData);
      case 'approve':
        return handleApprove(req, res, tokenData);
      case 'batch-approve':
        return handleBatchApprove(req, res, tokenData);
      case 'final-approval':
        return handleFinalApproval(req, res, tokenData);
      default:
        return res.status(400).json({
          error: 'Bad request',
          message: `Unknown action: ${action}`
        });
    }

  } catch (error) {
    console.error('Client portal token error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred'
    });
  }
}

/**
 * Validate access token and return token data
 */
async function validateToken(token) {
  try {
    const { data, error } = await supabase
      .from('client_portal_access_tokens')
      .select(`
        *,
        evaluation_project:evaluation_projects!evaluation_project_id(
          id, name, description, client_name, client_logo_url, status, branding
        ),
        stakeholder_area:stakeholder_areas!stakeholder_area_id(
          id, name, color, weight
        )
      `)
      .eq('access_token', token)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;

    // Check expiration
    if (new Date(data.token_expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('client_portal_access_tokens')
        .update({ status: 'expired' })
        .eq('id', data.id);
      return null;
    }

    // Check if project is still active
    if (!data.evaluation_project || data.evaluation_project.status === 'cancelled') {
      return null;
    }

    // Update access tracking
    await supabase
      .from('client_portal_access_tokens')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (data.access_count || 0) + 1
      })
      .eq('id', data.id);

    return data;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Handle validate action - return portal context
 */
async function handleValidate(req, res, tokenData) {
  try {
    const evaluationProjectId = tokenData.evaluation_project_id;
    const stakeholderAreaId = tokenData.stakeholder_area_id;

    // Get requirements summary
    let reqQuery = supabase
      .from('requirements')
      .select(`
        id,
        reference_code,
        title,
        description,
        priority,
        status,
        stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name),
        category:evaluation_categories!category_id(id, name),
        requirement_approvals(id, status, comments, approved_at, client_email, stakeholder_area_id)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('reference_code', { ascending: true });

    if (stakeholderAreaId) {
      reqQuery = reqQuery.eq('stakeholder_area_id', stakeholderAreaId);
    }

    const { data: requirements, error: reqError } = await reqQuery;
    if (reqError) throw reqError;

    // Get stakeholder areas
    const { data: stakeholderAreas } = await supabase
      .from('stakeholder_areas')
      .select('id, name, color, weight')
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('sort_order');

    // Get area approvals
    const { data: areaApprovals } = await supabase
      .from('stakeholder_area_approvals')
      .select(`
        *,
        stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color)
      `)
      .eq('evaluation_project_id', evaluationProjectId);

    // Calculate approval stats
    const stats = calculateApprovalStats(requirements, tokenData.user_email, stakeholderAreaId);

    // Check if user's area has final approval
    const userAreaApproval = stakeholderAreaId
      ? (areaApprovals || []).find(a => a.stakeholder_area_id === stakeholderAreaId)
      : null;

    // Log access
    await logPortalAccess(tokenData, req);

    return res.status(200).json({
      success: true,
      project: tokenData.evaluation_project,
      user: {
        name: tokenData.user_name,
        email: tokenData.user_email,
        title: tokenData.user_title,
        stakeholderArea: tokenData.stakeholder_area
      },
      permissions: tokenData.permissions,
      requirements: requirements || [],
      approvalStats: stats,
      stakeholderAreas: stakeholderAreas || [],
      areaApprovals: areaApprovals || [],
      userAreaApproval,
      canSubmitFinalApproval: stakeholderAreaId && !userAreaApproval,
      tokenExpiresAt: tokenData.token_expires_at
    });
  } catch (error) {
    console.error('Validate handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to load portal data'
    });
  }
}

/**
 * Handle get-requirements action - return filtered requirements
 */
async function handleGetRequirements(req, res, tokenData) {
  try {
    const { filter, stakeholderAreaId: filterAreaId } = req.body;
    const evaluationProjectId = tokenData.evaluation_project_id;
    const stakeholderAreaId = filterAreaId || tokenData.stakeholder_area_id;

    let query = supabase
      .from('requirements')
      .select(`
        id,
        reference_code,
        title,
        description,
        priority,
        status,
        stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color),
        category:evaluation_categories!category_id(id, name),
        requirement_approvals(id, status, comments, approved_at, client_email, stakeholder_area_id, approval_note)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('reference_code', { ascending: true });

    if (stakeholderAreaId) {
      query = query.eq('stakeholder_area_id', stakeholderAreaId);
    }

    const { data: requirements, error } = await query;
    if (error) throw error;

    // Apply client-side filtering if needed
    let filtered = requirements || [];
    if (filter === 'pending') {
      filtered = filtered.filter(r => {
        const myApproval = (r.requirement_approvals || []).find(
          a => a.client_email === tokenData.user_email
        );
        return !myApproval || myApproval.status === 'pending';
      });
    } else if (filter === 'approved') {
      filtered = filtered.filter(r => {
        const myApproval = (r.requirement_approvals || []).find(
          a => a.client_email === tokenData.user_email
        );
        return myApproval?.status === 'approved';
      });
    } else if (filter === 'changes_requested') {
      filtered = filtered.filter(r => {
        const myApproval = (r.requirement_approvals || []).find(
          a => a.client_email === tokenData.user_email
        );
        return myApproval?.status === 'changes_requested';
      });
    }

    return res.status(200).json({
      success: true,
      requirements: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to load requirements'
    });
  }
}

/**
 * Handle approve action - submit requirement approval
 */
async function handleApprove(req, res, tokenData) {
  try {
    // Check permission
    if (!tokenData.permissions?.approve_requirements) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to approve requirements'
      });
    }

    const { requirementId, approval } = req.body;

    if (!requirementId || !approval) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Requirement ID and approval data are required'
      });
    }

    // Verify requirement belongs to this evaluation project
    const { data: requirement, error: reqError } = await supabase
      .from('requirements')
      .select('id, evaluation_project_id, stakeholder_area_id')
      .eq('id', requirementId)
      .eq('evaluation_project_id', tokenData.evaluation_project_id)
      .single();

    if (reqError || !requirement) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Requirement not found'
      });
    }

    // Check stakeholder area access if token is area-restricted
    if (tokenData.stakeholder_area_id &&
        requirement.stakeholder_area_id !== tokenData.stakeholder_area_id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only approve requirements in your stakeholder area'
      });
    }

    // Upsert approval
    const { data, error } = await supabase
      .from('requirement_approvals')
      .upsert({
        requirement_id: requirementId,
        client_name: tokenData.user_name,
        client_email: tokenData.user_email,
        stakeholder_area_id: tokenData.stakeholder_area_id,
        status: approval.status,
        comments: approval.comments,
        approval_note: approval.note,
        revision_requested: approval.status === 'changes_requested',
        approved_at: approval.status !== 'pending' ? new Date().toISOString() : null
      }, {
        onConflict: 'requirement_id,client_email'
      })
      .select()
      .single();

    if (error) throw error;

    // Log the approval
    await supabase.from('evaluation_audit_log').insert({
      evaluation_project_id: tokenData.evaluation_project_id,
      action: 'client_requirement_approval',
      entity_type: 'requirement',
      entity_id: requirementId,
      user_id: null,
      details: {
        client_name: tokenData.user_name,
        client_email: tokenData.user_email,
        status: approval.status,
        stakeholder_area_id: tokenData.stakeholder_area_id
      }
    });

    return res.status(200).json({
      success: true,
      approval: data
    });
  } catch (error) {
    console.error('Approve handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to submit approval'
    });
  }
}

/**
 * Handle batch-approve action - submit multiple approvals
 */
async function handleBatchApprove(req, res, tokenData) {
  try {
    if (!tokenData.permissions?.approve_requirements) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to approve requirements'
      });
    }

    const { requirementIds, approval } = req.body;

    if (!requirementIds || !Array.isArray(requirementIds) || requirementIds.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Requirement IDs array is required'
      });
    }

    if (!approval) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Approval data is required'
      });
    }

    // Verify all requirements belong to this project
    const { data: requirements, error: reqError } = await supabase
      .from('requirements')
      .select('id, stakeholder_area_id')
      .in('id', requirementIds)
      .eq('evaluation_project_id', tokenData.evaluation_project_id);

    if (reqError) throw reqError;

    // Filter to valid requirements (matching stakeholder area if restricted)
    const validIds = requirements
      .filter(r => !tokenData.stakeholder_area_id ||
                   r.stakeholder_area_id === tokenData.stakeholder_area_id)
      .map(r => r.id);

    if (validIds.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No valid requirements to approve'
      });
    }

    // Create approval records
    const approvals = validIds.map(reqId => ({
      requirement_id: reqId,
      client_name: tokenData.user_name,
      client_email: tokenData.user_email,
      stakeholder_area_id: tokenData.stakeholder_area_id,
      status: approval.status,
      comments: approval.comments,
      approved_at: approval.status !== 'pending' ? new Date().toISOString() : null
    }));

    const { data, error } = await supabase
      .from('requirement_approvals')
      .upsert(approvals, {
        onConflict: 'requirement_id,client_email'
      })
      .select();

    if (error) throw error;

    // Log the batch approval
    await supabase.from('evaluation_audit_log').insert({
      evaluation_project_id: tokenData.evaluation_project_id,
      action: 'client_batch_approval',
      entity_type: 'requirement',
      entity_id: null,
      user_id: null,
      details: {
        client_name: tokenData.user_name,
        client_email: tokenData.user_email,
        status: approval.status,
        count: validIds.length,
        requirement_ids: validIds
      }
    });

    return res.status(200).json({
      success: true,
      approvals: data,
      count: data.length
    });
  } catch (error) {
    console.error('Batch approve handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to submit batch approval'
    });
  }
}

/**
 * Handle final-approval action - submit stakeholder area sign-off
 */
async function handleFinalApproval(req, res, tokenData) {
  try {
    const { approval } = req.body;

    if (!tokenData.stakeholder_area_id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Only stakeholder area leads can submit final approval'
      });
    }

    if (!approval || !approval.signature) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Approval signature is required'
      });
    }

    // Get current stats for the area
    const stats = await getAreaStats(
      tokenData.evaluation_project_id,
      tokenData.stakeholder_area_id,
      tokenData.user_email
    );

    // Insert or update the area approval
    const { data, error } = await supabase
      .from('stakeholder_area_approvals')
      .upsert({
        evaluation_project_id: tokenData.evaluation_project_id,
        stakeholder_area_id: tokenData.stakeholder_area_id,
        approved_by_name: tokenData.user_name,
        approved_by_email: tokenData.user_email,
        approved_by_title: tokenData.user_title,
        approved_at: new Date().toISOString(),
        approval_signature: approval.signature,
        approval_notes: approval.notes,
        total_requirements: stats.total,
        approved_count: stats.approved,
        rejected_count: stats.rejected,
        changes_requested_count: stats.changesRequested
      }, {
        onConflict: 'evaluation_project_id,stakeholder_area_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Log the final approval
    await supabase.from('evaluation_audit_log').insert({
      evaluation_project_id: tokenData.evaluation_project_id,
      action: 'stakeholder_area_final_approval',
      entity_type: 'stakeholder_area',
      entity_id: tokenData.stakeholder_area_id,
      user_id: null,
      details: {
        approved_by_name: tokenData.user_name,
        approved_by_email: tokenData.user_email,
        total_requirements: stats.total,
        approved_count: stats.approved
      }
    });

    return res.status(200).json({
      success: true,
      approval: data
    });
  } catch (error) {
    console.error('Final approval handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to submit final approval'
    });
  }
}

/**
 * Calculate approval statistics for requirements
 */
function calculateApprovalStats(requirements, userEmail, stakeholderAreaId) {
  const reqs = requirements || [];
  let approved = 0;
  let rejected = 0;
  let changesRequested = 0;
  let pending = 0;

  reqs.forEach(req => {
    const approvals = req.requirement_approvals || [];
    // Find this user's approval
    const myApproval = approvals.find(a => a.client_email === userEmail);

    if (myApproval) {
      switch (myApproval.status) {
        case 'approved': approved++; break;
        case 'rejected': rejected++; break;
        case 'changes_requested': changesRequested++; break;
        default: pending++;
      }
    } else {
      pending++;
    }
  });

  return {
    total: reqs.length,
    approved,
    rejected,
    changesRequested,
    pending,
    reviewedCount: approved + rejected + changesRequested,
    reviewedPercent: reqs.length > 0
      ? Math.round(((approved + rejected + changesRequested) / reqs.length) * 100)
      : 0,
    approvedPercent: reqs.length > 0
      ? Math.round((approved / reqs.length) * 100)
      : 0
  };
}

/**
 * Get stats for a specific stakeholder area
 */
async function getAreaStats(evaluationProjectId, stakeholderAreaId, userEmail) {
  const { data: requirements } = await supabase
    .from('requirements')
    .select(`
      id,
      requirement_approvals(id, status, client_email)
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .eq('stakeholder_area_id', stakeholderAreaId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  return calculateApprovalStats(requirements || [], userEmail, stakeholderAreaId);
}

/**
 * Log portal access for audit trail
 */
async function logPortalAccess(tokenData, req) {
  try {
    await supabase.from('evaluation_audit_log').insert({
      evaluation_project_id: tokenData.evaluation_project_id,
      action: 'client_portal_access',
      entity_type: 'client_portal_access_token',
      entity_id: tokenData.id,
      user_id: null,
      details: {
        client_name: tokenData.user_name,
        client_email: tokenData.user_email,
        stakeholder_area: tokenData.stakeholder_area?.name,
        ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        access_count: tokenData.access_count + 1
      }
    });
  } catch (error) {
    console.error('Failed to log portal access:', error);
  }
}
