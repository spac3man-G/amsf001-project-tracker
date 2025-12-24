// Vercel Edge Function for Organisation Creation
// Allows authenticated users to create new organisations
// Version 1.0 - 24 December 2025
//
// Features:
// - Creates a new organisation with unique slug
// - Adds creator as org_admin with is_default=true
// - Validates slug uniqueness
// - Sets initial subscription tier to 'free'

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate a URL-safe slug from organisation name
 * @param {string} name - Organisation name
 * @returns {string} - Lowercase slug with only alphanumeric and hyphens
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50);              // Limit length
}

/**
 * Generate a unique slug by appending a number if needed
 * @param {Object} supabase - Supabase client
 * @param {string} baseSlug - Base slug to check
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(supabase, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data: existing } = await supabase
      .from('organisations')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) {
      return slug;
    }
    
    // Slug exists, try with number suffix
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Safety limit
    if (counter > 100) {
      // Fall back to timestamp-based slug
      return `${baseSlug}-${Date.now().toString(36)}`;
    }
  }
}

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
      slug: providedSlug,
      description,
      adminToken 
    } = body;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Organisation name is required (minimum 2 characters)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (name.trim().length > 100) {
      return new Response(JSON.stringify({ 
        error: 'Organisation name must be 100 characters or less' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Generate or validate slug
    let slug;
    if (providedSlug && providedSlug.trim()) {
      // Validate provided slug format
      const slugRegex = /^[a-z0-9-]+$/;
      const cleanSlug = providedSlug.toLowerCase().trim();
      
      if (!slugRegex.test(cleanSlug)) {
        return new Response(JSON.stringify({ 
          error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (cleanSlug.length < 2 || cleanSlug.length > 50) {
        return new Response(JSON.stringify({ 
          error: 'Slug must be between 2 and 50 characters' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Check if provided slug is available
      const { data: existingSlug } = await supabase
        .from('organisations')
        .select('id')
        .eq('slug', cleanSlug)
        .single();
      
      if (existingSlug) {
        return new Response(JSON.stringify({ 
          error: 'This organisation URL is already taken. Please choose a different one.' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      slug = cleanSlug;
    } else {
      // Auto-generate unique slug from name
      const baseSlug = generateSlug(name.trim());
      slug = await generateUniqueSlug(supabase, baseSlug);
    }

    // Check if user is already in an organisation (for messaging purposes)
    const { data: existingMemberships } = await supabase
      .from('user_organisations')
      .select('id')
      .eq('user_id', requestingUser.id)
      .eq('is_active', true);
    
    const isFirstOrg = !existingMemberships || existingMemberships.length === 0;

    // Create the organisation
    const orgData = {
      name: name.trim(),
      slug: slug,
      description: description?.trim() || null,
      subscription_tier: 'free',
      is_active: true,
      settings: {
        onboarding_completed: false,
        created_via: 'self_service'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newOrg, error: orgError } = await supabase
      .from('organisations')
      .insert(orgData)
      .select()
      .single();

    if (orgError) {
      console.error('Organisation creation error:', orgError);
      
      // Handle unique constraint violation
      if (orgError.code === '23505') {
        return new Response(JSON.stringify({ 
          error: 'An organisation with this name or URL already exists' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create organisation: ' + orgError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add the creator as org_admin
    const membershipData = {
      user_id: requestingUser.id,
      organisation_id: newOrg.id,
      org_role: 'org_admin',
      is_active: true,
      is_default: isFirstOrg, // Set as default if it's their first org
      joined_at: new Date().toISOString(),
    };

    const { error: membershipError } = await supabase
      .from('user_organisations')
      .insert(membershipData);

    if (membershipError) {
      console.error('Membership creation error:', membershipError);
      
      // Rollback: delete the organisation
      await supabase
        .from('organisations')
        .delete()
        .eq('id', newOrg.id);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to set up organisation membership: ' + membershipError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the creation in audit log if it exists
    try {
      await supabase
        .from('audit_log')
        .insert({
          user_id: requestingUser.id,
          action: 'organisation.created',
          entity_type: 'organisation',
          entity_id: newOrg.id,
          details: {
            organisation_name: newOrg.name,
            organisation_slug: newOrg.slug,
          },
          created_at: new Date().toISOString(),
        });
    } catch (auditError) {
      // Don't fail if audit log doesn't exist or fails
      console.log('Audit log skipped:', auditError.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      organisation: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        description: newOrg.description,
        subscription_tier: newOrg.subscription_tier,
      },
      isFirstOrganisation: isFirstOrg,
      message: `Organisation "${newOrg.name}" created successfully`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create organisation API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
