// Vercel Edge Function for Evaluation Project Creation
// Allows org admins to create new evaluation projects
// Version 1.0 - Initial implementation
// - Requires organisation_id in request
// - Validates user has org_admin/org_owner role OR system admin
// - Creates evaluation project and assigns creator as admin

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
      client_name,
      description, 
      target_start_date,
      target_end_date,
      organisation_id,
      settings,
      adminToken 
    } = body;

    // Validate required fields
    if (!name) {
      return new Response(JSON.stringify({ 
        error: 'Evaluation name is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!organisation_id) {
      return new Response(JSON.stringify({ 
        error: 'Organisation ID is required' 
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

    // Validate organisation exists
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id, name, is_active')
      .eq('id', organisation_id)
      .single();

    if (orgError || !org || !org.is_active) {
      return new Response(JSON.stringify({ 
        error: 'Organisation not found or inactive' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user can create evaluation projects in this organisation
    // Must be org_owner, org_admin, or system admin
    if (!isSystemAdmin) {
      const { data: membership } = await supabase
        .from('user_organisations')
        .select('org_role')
        .eq('organisation_id', organisation_id)
        .eq('user_id', requestingUser.id)
        .eq('is_active', true)
        .single();

      const canCreateEvaluations = membership && 
        (membership.org_role === 'org_owner' || membership.org_role === 'org_admin');

      if (!canCreateEvaluations) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient permissions. Only organisation admins can create evaluation projects.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create the evaluation project
    const evaluationData = {
      name: name.trim(),
      client_name: client_name?.trim() || null,
      description: description?.trim() || null,
      target_start_date: target_start_date || null,
      target_end_date: target_end_date || null,
      organisation_id: organisation_id,
      status: 'setup',
      created_by: requestingUser.id,
      settings: settings || {
        requireApproval: true,
        allowVendorPortal: true,
        scoringScale: 5,
        requireEvidence: true,
        allowAIFeatures: true
      },
      branding: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newEvaluation, error: evalError } = await supabase
      .from('evaluation_projects')
      .insert(evaluationData)
      .select()
      .single();

    if (evalError) {
      console.error('Evaluation project creation error:', evalError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create evaluation project: ' + evalError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Assign the creating user as admin on the new evaluation project
    const { error: assignmentError } = await supabase
      .from('evaluation_project_users')
      .insert({
        evaluation_project_id: newEvaluation.id,
        user_id: requestingUser.id,
        role: 'admin',
        is_default: true,
        permissions: {},
        created_at: new Date().toISOString(),
      });

    if (assignmentError) {
      console.error('User assignment error:', assignmentError);
      // Don't fail the whole operation, evaluation was created successfully
    }

    // Create default scoring scale (1-5)
    const defaultScales = [
      { value: 1, label: 'Does Not Meet', description: 'Solution does not meet the requirement', color: '#EF4444' },
      { value: 2, label: 'Partially Meets', description: 'Solution partially meets with significant gaps', color: '#F97316' },
      { value: 3, label: 'Meets', description: 'Solution adequately meets the requirement', color: '#EAB308' },
      { value: 4, label: 'Exceeds', description: 'Solution exceeds expectations', color: '#22C55E' },
      { value: 5, label: 'Exceptional', description: 'Solution is exceptional and best-in-class', color: '#10B981' },
    ];

    const scalesData = defaultScales.map(scale => ({
      evaluation_project_id: newEvaluation.id,
      ...scale,
      created_at: new Date().toISOString(),
    }));

    const { error: scalesError } = await supabase
      .from('scoring_scales')
      .insert(scalesData);

    if (scalesError) {
      console.error('Scoring scales creation error:', scalesError);
      // Don't fail - this is optional setup data
    }

    return new Response(JSON.stringify({ 
      success: true,
      evaluation: newEvaluation,
      message: `Evaluation project "${newEvaluation.name}" created successfully`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create evaluation API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
