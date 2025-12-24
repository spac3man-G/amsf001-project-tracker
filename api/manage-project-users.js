// Vercel Edge Function for Managing User-Project Assignments
// Allows admins, org_admins, and supplier_pm (on target project) to add/remove users
// Version 2.0 - 24 December 2025 - Fixed authorization to check target project

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check if a user is an org_admin for the organisation that owns a project
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID to check
 * @param {string} projectId - Project ID to check against
 * @returns {Promise<boolean>}
 */
async function isOrgAdminForProject(supabase, userId, projectId) {
  // Get the project's organisation
  const { data: project } = await supabase
    .from('projects')
    .select('organisation_id')
    .eq('id', projectId)
    .single();
  
  if (!project?.organisation_id) return false;
  
  // Check if user is org_admin of that organisation
  const { data: membership } = await supabase
    .from('user_organisations')
    .select('org_role')
    .eq('user_id', userId)
    .eq('organisation_id', project.organisation_id)
    .eq('is_active', true)
    .single();
  
  return membership?.org_role === 'org_admin';
}

/**
 * Check if a user is a PM (admin or supplier_pm) on a specific project
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID to check
 * @param {string} projectId - Target project ID
 * @returns {Promise<boolean>}
 */
async function isPMOnProject(supabase, userId, projectId) {
  const { data: assignment } = await supabase
    .from('user_projects')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .in('role', ['admin', 'supplier_pm'])
    .single();
  
  return !!assignment;
}

/**
 * Check if a user is an active member of a project's organisation
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID to check
 * @param {string} projectId - Project ID to get organisation from
 * @returns {Promise<{isMember: boolean, organisationId: string|null}>}
 */
async function checkOrgMembership(supabase, userId, projectId) {
  // Get the project's organisation
  const { data: project } = await supabase
    .from('projects')
    .select('organisation_id')
    .eq('id', projectId)
    .single();
  
  if (!project?.organisation_id) {
    return { isMember: true, organisationId: null }; // Legacy project without org
  }
  
  // Check if user is an active org member
  const { data: membership } = await supabase
    .from('user_organisations')
    .select('id')
    .eq('user_id', userId)
    .eq('organisation_id', project.organisation_id)
    .eq('is_active', true)
    .single();
  
  return { 
    isMember: !!membership, 
    organisationId: project.organisation_id 
  };
}

/**
 * Get the project ID from an assignment ID
 * @param {Object} supabase - Supabase client
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<string|null>}
 */
async function getProjectIdFromAssignment(supabase, assignmentId) {
  const { data } = await supabase
    .from('user_projects')
    .select('project_id')
    .eq('id', assignmentId)
    .single();
  
  return data?.project_id || null;
}

export default async function handler(req) {
  // Only allow POST and DELETE requests
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for service key
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { 
      action, // 'add' or 'remove'
      userId,
      projectId,
      role,
      assignmentId, // For remove action
      adminToken 
    } = body;

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is authorized
    if (!adminToken) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(adminToken);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check user's permissions (must be system admin, org_admin, or PM on target project)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    const isSystemAdmin = userProfile?.role === 'admin';

    // For actions that require a target project, we'll check authorization per-action below
    // This is because different actions get project context differently

    // Handle ADD action
    if (action === 'add') {
      if (!userId || !projectId || !role) {
        return new Response(JSON.stringify({ 
          error: 'userId, projectId, and role are required for add action' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Authorization check for ADD action
      const canManageProject = isSystemAdmin || 
        await isOrgAdminForProject(supabase, requestingUser.id, projectId) ||
        await isPMOnProject(supabase, requestingUser.id, projectId);
      
      if (!canManageProject) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions. You must be a system admin, organisation admin, or project PM to add users.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate role
      const validRoles = ['admin', 'supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // SECURITY: Verify user is an organisation member before adding to project
      const { isMember, organisationId } = await checkOrgMembership(supabase, userId, projectId);
      if (!isMember) {
        return new Response(JSON.stringify({ 
          error: 'User must be an organisation member before being assigned to a project. Please invite them to the organisation first.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          error: 'User is already assigned to this project'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create the assignment
      const { data: newAssignment, error: insertError } = await supabase
        .from('user_projects')
        .insert({
          user_id: userId,
          project_id: projectId,
          role: role,
          is_default: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Assignment creation error:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Failed to add user to project: ' + insertError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        assignment: newAssignment,
        message: 'User added to project successfully',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle REMOVE action
    if (action === 'remove') {
      if (!assignmentId) {
        return new Response(JSON.stringify({ 
          error: 'assignmentId is required for remove action' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get the assignment to check it exists and get project context
      const { data: assignment } = await supabase
        .from('user_projects')
        .select('user_id, project_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        return new Response(JSON.stringify({ 
          error: 'Assignment not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Authorization check for REMOVE action - must have access to THIS project
      const canManageProject = isSystemAdmin || 
        await isOrgAdminForProject(supabase, requestingUser.id, assignment.project_id) ||
        await isPMOnProject(supabase, requestingUser.id, assignment.project_id);
      
      if (!canManageProject) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions. You must be a system admin, organisation admin, or project PM to remove users.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Prevent removing yourself
      if (assignment.user_id === requestingUser.id) {
        return new Response(JSON.stringify({ 
          error: 'Cannot remove yourself from a project'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Delete the assignment
      const { error: deleteError } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) {
        console.error('Assignment deletion error:', deleteError);
        return new Response(JSON.stringify({ 
          error: 'Failed to remove user from project: ' + deleteError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'User removed from project successfully',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle UPDATE ROLE action
    if (action === 'update_role') {
      if (!assignmentId || !role) {
        return new Response(JSON.stringify({ 
          error: 'assignmentId and role are required for update_role action' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get the project ID from the assignment for authorization
      const targetProjectId = await getProjectIdFromAssignment(supabase, assignmentId);
      if (!targetProjectId) {
        return new Response(JSON.stringify({ 
          error: 'Assignment not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Authorization check for UPDATE_ROLE action
      const canManageProject = isSystemAdmin || 
        await isOrgAdminForProject(supabase, requestingUser.id, targetProjectId) ||
        await isPMOnProject(supabase, requestingUser.id, targetProjectId);
      
      if (!canManageProject) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions. You must be a system admin, organisation admin, or project PM to update roles.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate role
      const validRoles = ['admin', 'supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update the role
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('user_projects')
        .update({ role: role })
        .eq('id', assignmentId)
        .select()
        .single();

      if (updateError) {
        console.error('Role update error:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to update role: ' + updateError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        assignment: updatedAssignment,
        message: 'Role updated successfully',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Must be "add", "remove", or "update_role"' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Manage project users API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
