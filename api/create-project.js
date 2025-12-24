// Vercel Edge Function for Project Creation
// Allows admins and supplier_pm to create new projects
// Version 2.0 - Added organisation support for multi-tenancy
// - Requires organisation_id in request
// - Validates user has org_admin/org_owner role OR system admin
// - Projects are now scoped to organisations

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
      organisation_id,
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

    // Check user's global role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    const isSystemAdmin = userProfile?.role === 'admin';

    // Determine organisation_id
    let orgId = organisation_id;

    // If no org specified, try to get user's default organisation
    if (!orgId) {
      const { data: userOrgs } = await supabase
        .from('user_organisations')
        .select('organisation_id, is_default, org_role')
        .eq('user_id', requestingUser.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1);

      if (userOrgs && userOrgs.length > 0) {
        orgId = userOrgs[0].organisation_id;
      }
    }

    // Validate organisation exists if specified
    if (orgId) {
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .select('id, name, is_active')
        .eq('id', orgId)
        .single();

      if (orgError || !org || !org.is_active) {
        return new Response(JSON.stringify({ 
          error: 'Organisation not found or inactive' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if user can create projects in this organisation
      // Must be org_owner, org_admin, or system admin
      if (!isSystemAdmin) {
        const { data: membership } = await supabase
          .from('user_organisations')
          .select('org_role')
          .eq('organisation_id', orgId)
          .eq('user_id', requestingUser.id)
          .eq('is_active', true)
          .single();

        const canCreateProjects = membership && 
          (membership.org_role === 'org_owner' || membership.org_role === 'org_admin');

        if (!canCreateProjects) {
          // Fallback: check if they're supplier_pm on any project in this org
          const { data: pmAssignments } = await supabase
            .from('user_projects')
            .select(`
              role,
              project:projects!inner(organisation_id)
            `)
            .eq('user_id', requestingUser.id)
            .eq('role', 'supplier_pm')
            .limit(1);

          const hasPmInOrg = pmAssignments?.some(
            a => a.project?.organisation_id === orgId
          );

          if (!hasPmInOrg) {
            return new Response(JSON.stringify({ 
              error: 'Insufficient permissions. Only organisation admins can create projects.' 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } else {
      // No organisation - legacy support for system admins only
      if (!isSystemAdmin) {
        return new Response(JSON.stringify({ 
          error: 'Organisation is required to create a project' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ========================================================================
    // CHECK SUBSCRIPTION LIMITS
    // ========================================================================
    if (orgId) {
      // Get organisation's subscription tier
      const { data: org } = await supabase
        .from('organisations')
        .select('subscription_tier')
        .eq('id', orgId)
        .single();

      const tier = org?.subscription_tier || 'free';

      // Define tier limits (Infinity = unlimited)
      const tierLimits = {
        free: Infinity,       // Unlimited for free tier
        starter: Infinity,
        professional: Infinity,
        enterprise: Infinity,
      };

      const projectLimit = tierLimits[tier] ?? Infinity;

      // Skip limit check if unlimited
      if (projectLimit !== Infinity) {
        // Count existing projects (exclude deleted)
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', orgId)
          .neq('status', 'deleted');

        if (projectCount >= projectLimit) {
          const tierNames = {
            free: 'Free',
            starter: 'Starter',
            professional: 'Professional',
            enterprise: 'Enterprise',
          };

          return new Response(JSON.stringify({ 
            error: 'LIMIT_EXCEEDED',
            code: 'PROJECT_LIMIT_EXCEEDED',
            message: `You've reached the project limit (${projectLimit}) for your ${tierNames[tier]} plan.`,
            details: {
              current: projectCount,
              limit: projectLimit,
              tier: tier,
            },
            upgrade: {
              available: false,
              message: 'Contact support for assistance.',
            },
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Check if reference already exists (within the organisation if specified)
    let existingQuery = supabase
      .from('projects')
      .select('id')
      .eq('reference', reference.toUpperCase());
    
    if (orgId) {
      existingQuery = existingQuery.eq('organisation_id', orgId);
    }

    const { data: existingProject } = await existingQuery.single();

    if (existingProject) {
      return new Response(JSON.stringify({ 
        error: `Project reference "${reference}" already exists${orgId ? ' in this organisation' : ''}` 
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
      organisation_id: orgId || null,
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

    // Assign the creating user as supplier_pm (admin) on the new project
    const { error: assignmentError } = await supabase
      .from('user_projects')
      .insert({
        user_id: requestingUser.id,
        project_id: newProject.id,
        role: 'admin', // Creator gets admin role on the project
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
