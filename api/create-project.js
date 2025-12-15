// Vercel Edge Function for Project Creation
// Allows admins and supplier_pm to create new projects
// Version 1.0 - 15 December 2025

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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
      name, 
      reference, 
      description, 
      start_date,
      end_date,
      total_budget,
      adminToken 
    } = body;

    // Validate required fields
    if (!name || !reference) {
      return new Response(JSON.stringify({ 
        error: 'Project name and reference are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate reference format (alphanumeric and hyphens only)
    const referenceRegex = /^[A-Za-z0-9-]+$/;
    if (!referenceRegex.test(reference)) {
      return new Response(JSON.stringify({ 
        error: 'Reference can only contain letters, numbers, and hyphens' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
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

    // Check user's global role (must be admin) OR project role (supplier_pm)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    // For now, only global admins can create projects
    // In future, could check if user is supplier_pm on any project
    if (!userProfile || userProfile.role !== 'admin') {
      // Check if they're a supplier_pm on any existing project
      const { data: pmAssignments } = await supabase
        .from('user_projects')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'supplier_pm')
        .limit(1);
      
      if (!pmAssignments || pmAssignments.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions. Only admins and supplier PMs can create projects.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if reference already exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('reference', reference.toUpperCase())
      .single();

    if (existingProject) {
      return new Response(JSON.stringify({ 
        error: `Project reference "${reference}" already exists` 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create the project
    const projectData = {
      name: name.trim(),
      reference: reference.toUpperCase().trim(),
      description: description?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
      total_budget: total_budget ? parseFloat(total_budget) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create project: ' + projectError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Assign the creating user as supplier_pm on the new project
    const { error: assignmentError } = await supabase
      .from('user_projects')
      .insert({
        user_id: requestingUser.id,
        project_id: newProject.id,
        role: 'supplier_pm',
        is_default: false, // Don't change their default project
        created_at: new Date().toISOString(),
      });

    if (assignmentError) {
      console.error('User assignment error:', assignmentError);
      // Don't fail the whole operation, project was created successfully
    }

    // Get user profile to create resource
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', requestingUser.id)
      .single();

    // Create a resource record for the creator
    if (creatorProfile) {
      const { error: resourceError } = await supabase
        .from('resources')
        .insert({
          project_id: newProject.id,
          user_id: requestingUser.id,
          name: creatorProfile.full_name || creatorProfile.email?.split('@')[0] || 'Project Manager',
          email: creatorProfile.email,
          role: 'Project Manager',
          resource_type: 'Internal',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (resourceError) {
        console.error('Resource creation error:', resourceError);
        // Don't fail the whole operation
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      project: newProject,
      message: `Project "${newProject.name}" created successfully`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create project API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
