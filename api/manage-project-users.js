// Vercel Edge Function for Managing User-Project Assignments
// Allows admins and supplier_pm to add/remove users from projects
// Version 1.0 - 15 December 2025

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Check user's permissions (must be admin or supplier_pm)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    const isGlobalAdmin = userProfile?.role === 'admin';

    // Check if they're a supplier_pm on any project
    const { data: pmAssignments } = await supabase
      .from('user_projects')
      .select('role, project_id')
      .eq('user_id', requestingUser.id)
      .in('role', ['admin', 'supplier_pm']);

    const hasProjectAccess = pmAssignments && pmAssignments.length > 0;
    
    if (!isGlobalAdmin && !hasProjectAccess) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions. Only admins and supplier PMs can manage project assignments.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

      // Get the assignment to check it exists and get user_id
      const { data: assignment } = await supabase
        .from('user_projects')
        .select('user_id')
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
