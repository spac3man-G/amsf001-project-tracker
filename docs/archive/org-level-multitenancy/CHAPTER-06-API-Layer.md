# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 6: API Layer Updates

**Document:** CHAPTER-06-API-Layer.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status: Complete (Implementation Reference)  

---

## 6.1 Overview

This chapter details the API layer changes required to support organisation-level multi-tenancy. The AMSF001 application uses Vercel Edge Functions for its API endpoints, primarily for AI chat functionality, receipt scanning, and user management.

### Current API Architecture

```
/api
├── chat/                    # AI chat assistant
│   └── route.js            
├── chat-context/            # Pre-fetch context for chat
│   └── route.js            
├── scan-receipt/            # Receipt scanner
│   └── route.js            
├── create-user/             # User creation
│   └── route.js            
└── webhook/                 # Various webhooks
    └── route.js            
```

### Key Changes Required

| Endpoint | Change | Purpose |
|----------|--------|---------|
| `/api/chat` | Add org context | Org-aware AI responses |
| `/api/chat-context` | Add org context | Include org in pre-fetch |
| `/api/create-user` | Org-first assignment | Assign to org, then project |
| `/api/organisations/*` | **NEW** | Org management endpoints |

---

## 6.2 Context Structure Updates

### 6.2.1 Current Context Structure

```javascript
// Current context passed to AI
{
  userContext: {
    name: "John Smith",
    email: "john@example.com",
    role: "supplier_pm",
    linkedResourceId: "uuid-or-null",
    partnerId: "uuid-or-null"
  },
  projectContext: {
    id: "project-uuid",
    reference: "PROJ-001",
    name: "Project Alpha"
  }
}
```

### 6.2.2 Updated Context Structure

```javascript
// NEW: Context with organisation
{
  userContext: {
    name: "John Smith",
    email: "john@example.com",
    systemRole: "user",              // From profiles.role
    linkedResourceId: "uuid-or-null",
    partnerId: "uuid-or-null"
  },
  organisationContext: {             // NEW
    id: "org-uuid",
    name: "Acme Corporation",
    slug: "acme-corp",
    orgRole: "org_admin",            // User's org role
    settings: {
      features: { ... },
      defaults: { ... }
    }
  },
  projectContext: {
    id: "project-uuid",
    reference: "PROJ-001",
    name: "Project Alpha",
    projectRole: "supplier_pm"       // MOVED from userContext
  }
}
```

---

## 6.3 Chat Context API Update

### 6.3.1 File Location

```
/api/chat-context/route.js
```

### 6.3.2 Updated Implementation

```javascript
// /api/chat-context/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId, organisationId, projectId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, linked_resource_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build user context
    const userContext = {
      name: profile.full_name || 'Unknown User',
      email: profile.email,
      systemRole: profile.role || 'user',
      linkedResourceId: profile.linked_resource_id || null,
      partnerId: null // Will be populated if linked to resource
    };

    // If user is linked to a resource, get partner info
    if (profile.linked_resource_id) {
      const { data: resource } = await supabase
        .from('resources')
        .select('partner_id')
        .eq('id', profile.linked_resource_id)
        .single();
      
      if (resource?.partner_id) {
        userContext.partnerId = resource.partner_id;
      }
    }

    // Build organisation context (NEW)
    let organisationContext = null;
    if (organisationId) {
      const { data: orgMembership } = await supabase
        .from('user_organisations')
        .select(`
          org_role,
          organisation:organisations (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('user_id', userId)
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .single();

      if (orgMembership?.organisation) {
        organisationContext = {
          id: orgMembership.organisation.id,
          name: orgMembership.organisation.name,
          slug: orgMembership.organisation.slug,
          orgRole: orgMembership.org_role,
          settings: orgMembership.organisation.settings || {}
        };
      }
    }

    // Build project context
    let projectContext = null;
    if (projectId) {
      // Validate user has access to project AND project belongs to org
      const { data: projectMembership } = await supabase
        .from('user_projects')
        .select(`
          role,
          project:projects (
            id,
            name,
            project_ref,
            organisation_id
          )
        `)
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (projectMembership?.project) {
        // Verify project belongs to the organisation
        if (organisationId && projectMembership.project.organisation_id !== organisationId) {
          return new Response(JSON.stringify({ 
            error: 'Project does not belong to the specified organisation' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        projectContext = {
          id: projectMembership.project.id,
          reference: projectMembership.project.project_ref,
          name: projectMembership.project.name,
          projectRole: projectMembership.role
        };
      }
    }

    // Return combined context
    return new Response(JSON.stringify({
      userContext,
      organisationContext,
      projectContext,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat context error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

---

## 6.4 Chat API Update

### 6.4.1 System Prompt Updates

The chat API's system prompt needs to be aware of organisation context:

```javascript
// /api/chat/route.js - System prompt section

function buildSystemPrompt(context) {
  const { userContext, organisationContext, projectContext } = context;
  
  let systemPrompt = `You are an AI assistant for the AMSF Project Tracker application.

## Current User
- Name: ${userContext.name}
- Email: ${userContext.email}
- System Role: ${userContext.systemRole}
`;

  // Add organisation context if available
  if (organisationContext) {
    systemPrompt += `
## Current Organisation
- Name: ${organisationContext.name}
- User's Organisation Role: ${organisationContext.orgRole}
`;
    
    // Add org-specific instructions based on role
    if (organisationContext.orgRole === 'org_owner' || organisationContext.orgRole === 'org_admin') {
      systemPrompt += `- The user is an organisation administrator and can manage organisation settings and members.
`;
    }
  }

  // Add project context if available
  if (projectContext) {
    systemPrompt += `
## Current Project
- Name: ${projectContext.name}
- Reference: ${projectContext.reference}
- User's Project Role: ${projectContext.projectRole}
`;
  } else {
    systemPrompt += `
## Note
The user has not selected a project. They may be asking about organisation-level information or need help selecting a project.
`;
  }

  systemPrompt += `
## Guidelines
- Only provide information the user has access to based on their roles
- For project-specific queries, ensure a project is selected
- For organisation-level queries (members, settings, all projects), the user needs org_admin or org_owner role
- Be helpful and concise
`;

  return systemPrompt;
}
```

### 6.4.2 Tool Query Updates

Database query tools need to validate organisation context:

```javascript
// /api/chat/route.js - Tool definitions

const tools = [
  {
    name: "query_timesheets",
    description: "Query timesheet data for the current project",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["Draft", "Submitted", "Approved", "Rejected"] },
        resource_id: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" }
      }
    }
  },
  // NEW: Organisation-level tools for org admins
  {
    name: "query_organisation_projects",
    description: "List all projects in the current organisation. Requires org_admin role.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["Active", "Completed", "On Hold"] }
      }
    }
  },
  {
    name: "query_organisation_members",
    description: "List members of the current organisation. Requires org_admin role.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["org_owner", "org_admin", "org_member"] }
      }
    }
  },
  {
    name: "query_organisation_metrics",
    description: "Get aggregated metrics across all organisation projects. Requires org_admin role.",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// Tool execution with org validation
async function executeTool(toolName, params, context) {
  const { userContext, organisationContext, projectContext } = context;
  
  // Organisation-level tools require org_admin
  const orgAdminTools = [
    'query_organisation_projects',
    'query_organisation_members', 
    'query_organisation_metrics'
  ];
  
  if (orgAdminTools.includes(toolName)) {
    if (!organisationContext) {
      return { error: 'No organisation context available' };
    }
    if (!['org_owner', 'org_admin'].includes(organisationContext.orgRole)) {
      return { error: 'This query requires organisation administrator access' };
    }
  }
  
  // Project-level tools require project context
  const projectTools = [
    'query_timesheets',
    'query_expenses',
    'query_milestones',
    'query_deliverables'
  ];
  
  if (projectTools.includes(toolName)) {
    if (!projectContext) {
      return { error: 'Please select a project first to query project data' };
    }
  }

  // Execute the appropriate query
  switch (toolName) {
    case 'query_organisation_projects':
      return await queryOrganisationProjects(organisationContext.id, params);
    case 'query_organisation_members':
      return await queryOrganisationMembers(organisationContext.id, params);
    case 'query_organisation_metrics':
      return await queryOrganisationMetrics(organisationContext.id);
    case 'query_timesheets':
      return await queryTimesheets(projectContext.id, params, userContext);
    // ... other tools
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
```

### 6.4.3 Organisation Query Functions

```javascript
// /api/chat/route.js - Organisation query functions

async function queryOrganisationProjects(organisationId, params) {
  let query = supabase
    .from('projects')
    .select('id, name, project_ref, status, start_date, end_date')
    .eq('organisation_id', organisationId)
    .eq('is_deleted', false);
  
  if (params.status) {
    query = query.eq('status', params.status);
  }
  
  const { data, error } = await query.order('name');
  
  if (error) {
    console.error('queryOrganisationProjects error:', error);
    return { error: 'Failed to query projects' };
  }
  
  return {
    projects: data,
    count: data.length,
    summary: `Found ${data.length} project(s) in the organisation`
  };
}

async function queryOrganisationMembers(organisationId, params) {
  let query = supabase
    .from('user_organisations')
    .select(`
      org_role,
      user:profiles!user_id (
        full_name,
        email
      )
    `)
    .eq('organisation_id', organisationId)
    .eq('is_active', true);
  
  if (params.role) {
    query = query.eq('org_role', params.role);
  }
  
  const { data, error } = await query.order('org_role');
  
  if (error) {
    console.error('queryOrganisationMembers error:', error);
    return { error: 'Failed to query members' };
  }
  
  return {
    members: data.map(m => ({
      name: m.user?.full_name,
      email: m.user?.email,
      role: m.org_role
    })),
    count: data.length
  };
}

async function queryOrganisationMetrics(organisationId) {
  // Get all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, status')
    .eq('organisation_id', organisationId)
    .eq('is_deleted', false);
  
  const projectIds = (projects || []).map(p => p.id);
  
  // Get milestone counts
  const { count: milestoneCount } = await supabase
    .from('milestones')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('is_deleted', false);
  
  // Get deliverable counts
  const { count: deliverableCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('is_deleted', false);
  
  // Get pending timesheets
  const { count: pendingTimesheets } = await supabase
    .from('timesheets')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('status', 'Submitted');
  
  return {
    projects: {
      total: projects?.length || 0,
      active: projects?.filter(p => p.status === 'Active').length || 0,
      completed: projects?.filter(p => p.status === 'Completed').length || 0
    },
    milestones: milestoneCount || 0,
    deliverables: deliverableCount || 0,
    pendingTimesheets: pendingTimesheets || 0
  };
}
```

---

## 6.5 Create User API Update

### 6.5.1 Updated Flow

```
Current Flow:
1. Create auth user
2. Create profile
3. Assign to project

New Flow:
1. Create auth user
2. Create profile
3. Assign to organisation (required)
4. Assign to project (optional)
```

### 6.5.2 Updated Implementation

```javascript
// /api/create-user/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      email,
      password,
      fullName,
      organisationId,      // REQUIRED (new)
      orgRole,             // NEW: org_owner | org_admin | org_member
      projectId,           // Optional
      projectRole,         // Optional: admin | supplier_pm | customer_pm | contributor | viewer
      invitedBy            // User ID of inviter
    } = await req.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ 
        error: 'email, password, and fullName are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate organisation (NEW - required)
    if (!organisationId) {
      return new Response(JSON.stringify({ 
        error: 'organisationId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify organisation exists
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id, name')
      .eq('id', organisationId)
      .eq('is_deleted', false)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ 
        error: 'Organisation not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If projectId provided, verify it belongs to the organisation
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, organisation_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return new Response(JSON.stringify({ 
          error: 'Project not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (project.organisation_id !== organisationId) {
        return new Response(JSON.stringify({ 
          error: 'Project does not belong to the specified organisation' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(JSON.stringify({ 
        error: authError.message || 'Failed to create user' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // Step 2: Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'user'  // Default system role
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Attempt to clean up auth user
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ 
        error: 'Failed to create user profile' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Assign to organisation (NEW)
    const { error: orgMembershipError } = await supabase
      .from('user_organisations')
      .insert({
        user_id: userId,
        organisation_id: organisationId,
        org_role: orgRole || 'org_member',
        invited_by: invitedBy || null,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        is_active: true
      });

    if (orgMembershipError) {
      console.error('Org membership error:', orgMembershipError);
      // Clean up
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ 
        error: 'Failed to assign user to organisation' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Assign to project (optional)
    if (projectId && projectRole) {
      const { error: projectMembershipError } = await supabase
        .from('user_projects')
        .insert({
          user_id: userId,
          project_id: projectId,
          role: projectRole
        });

      if (projectMembershipError) {
        console.error('Project membership error:', projectMembershipError);
        // Don't fail the whole operation, just log
        // User is created and in org, just not in project
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        organisationId,
        orgRole: orgRole || 'org_member',
        projectId: projectId || null,
        projectRole: projectRole || null
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

---

## 6.6 New Organisation API Endpoints

### 6.6.1 Organisation Management Endpoints

```javascript
// /api/organisations/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req);
    case 'POST':
      return handlePost(req);
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

// GET /api/organisations - List user's organisations
async function handleGet(req) {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('user_organisations')
    .select(`
      id,
      org_role,
      is_default,
      organisation:organisations (
        id,
        name,
        slug,
        display_name,
        logo_url,
        primary_color
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ organisations: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/organisations - Create organisation (system admin only)
async function handlePost(req) {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify system admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role !== 'system_admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { name, ownerEmail, settings } = body;

  if (!name || !ownerEmail) {
    return new Response(JSON.stringify({ 
      error: 'name and ownerEmail are required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Find owner by email
  const { data: owner } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ownerEmail.toLowerCase())
    .single();

  if (!owner) {
    return new Response(JSON.stringify({ 
      error: 'Owner user not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Create organisation
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({
      name,
      slug,
      settings: settings || {},
      created_by: userId
    })
    .select()
    .single();

  if (orgError) {
    return new Response(JSON.stringify({ error: orgError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Add owner membership
  await supabase
    .from('user_organisations')
    .insert({
      user_id: owner.id,
      organisation_id: org.id,
      org_role: 'org_owner',
      is_active: true,
      is_default: true
    });

  return new Response(JSON.stringify({ organisation: org }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 6.6.2 Organisation Members Endpoint

```javascript
// /api/organisations/[id]/members/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req, { params }) {
  const organisationId = params.id;
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user is org admin
  const { data: membership } = await supabase
    .from('user_organisations')
    .select('org_role')
    .eq('user_id', userId)
    .eq('organisation_id', organisationId)
    .eq('is_active', true)
    .single();

  if (!membership || !['org_owner', 'org_admin'].includes(membership.org_role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetMembers(organisationId);
    case 'POST':
      return handleAddMember(organisationId, req, userId);
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

async function handleGetMembers(organisationId) {
  const { data, error } = await supabase
    .from('user_organisations')
    .select(`
      id,
      org_role,
      invited_at,
      accepted_at,
      user:profiles!user_id (
        id,
        full_name,
        email
      )
    `)
    .eq('organisation_id', organisationId)
    .eq('is_active', true)
    .order('org_role');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ members: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAddMember(organisationId, req, invitedBy) {
  const { email, orgRole } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Find user
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    return new Response(JSON.stringify({ 
      error: 'User not found. They must create an account first.' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if already member
  const { data: existing } = await supabase
    .from('user_organisations')
    .select('id, is_active')
    .eq('user_id', user.id)
    .eq('organisation_id', organisationId)
    .single();

  if (existing?.is_active) {
    return new Response(JSON.stringify({ 
      error: 'User is already a member of this organisation' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Add or reactivate membership
  if (existing) {
    await supabase
      .from('user_organisations')
      .update({ 
        is_active: true, 
        org_role: orgRole || 'org_member' 
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_organisations')
      .insert({
        user_id: user.id,
        organisation_id: organisationId,
        org_role: orgRole || 'org_member',
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        is_active: true
      });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 6.7 Receipt Scanner Update

### 6.7.1 Organisation Context

The receipt scanner needs to consider organisation-level classification rules (future enhancement):

```javascript
// /api/scan-receipt/route.js - Updated to include org context

async function processReceipt(imageData, projectId, organisationId) {
  // Get classification rules - check org-level first, then project-level
  const rules = await getClassificationRules(projectId, organisationId);
  
  // Process with Claude Vision
  const result = await callClaudeVision(imageData);
  
  // Apply classification rules
  const category = classifyExpense(result.merchant, rules);
  
  return {
    ...result,
    suggestedCategory: category
  };
}

async function getClassificationRules(projectId, organisationId) {
  // Get project-specific rules
  const { data: projectRules } = await supabase
    .from('classification_rules')
    .select('*')
    .eq('project_id', projectId);
  
  // Future: Get org-level rules
  // const { data: orgRules } = await supabase
  //   .from('org_classification_rules')
  //   .select('*')
  //   .eq('organisation_id', organisationId);
  
  // Merge with project rules taking precedence
  return projectRules || [];
}
```

---

## 6.8 API Error Handling

### 6.8.1 Standard Error Responses

```javascript
// /api/lib/errors.js

export const API_ERRORS = {
  UNAUTHORIZED: {
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Authentication required'
  },
  FORBIDDEN: {
    status: 403,
    code: 'FORBIDDEN',
    message: 'You do not have permission to perform this action'
  },
  NOT_FOUND: {
    status: 404,
    code: 'NOT_FOUND',
    message: 'Resource not found'
  },
  ORG_REQUIRED: {
    status: 400,
    code: 'ORG_REQUIRED',
    message: 'Organisation context is required'
  },
  PROJECT_REQUIRED: {
    status: 400,
    code: 'PROJECT_REQUIRED',
    message: 'Project context is required'
  },
  ORG_MISMATCH: {
    status: 400,
    code: 'ORG_MISMATCH',
    message: 'Project does not belong to the specified organisation'
  },
  NOT_ORG_MEMBER: {
    status: 403,
    code: 'NOT_ORG_MEMBER',
    message: 'User is not a member of the organisation'
  }
};

export function apiError(error) {
  return new Response(JSON.stringify({
    error: error.message,
    code: error.code
  }), {
    status: error.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 6.9 API Route Summary

### 6.9.1 Updated Routes

| Route | Method | Changes |
|-------|--------|---------|
| `/api/chat` | POST | Add org context to system prompt, new org-level tools |
| `/api/chat-context` | POST | Return org context alongside project context |
| `/api/create-user` | POST | Require organisationId, assign to org first |
| `/api/scan-receipt` | POST | Add org context for future org-level rules |

### 6.9.2 New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/organisations` | GET | List user's organisations |
| `/api/organisations` | POST | Create organisation (system admin) |
| `/api/organisations/[id]` | GET | Get organisation details |
| `/api/organisations/[id]` | PATCH | Update organisation |
| `/api/organisations/[id]/members` | GET | List members |
| `/api/organisations/[id]/members` | POST | Add member |
| `/api/organisations/[id]/members/[memberId]` | PATCH | Update member role |
| `/api/organisations/[id]/members/[memberId]` | DELETE | Remove member |
| `/api/organisations/[id]/projects` | GET | List org projects |
| `/api/organisations/[id]/metrics` | GET | Get org metrics |

---

## 6.10 Chapter Summary

This chapter established:

1. **Updated Context Structure** - Three-tier context (user, organisation, project)

2. **Chat Context API** - Returns organisation context with role and settings

3. **Chat API Updates**:
   - System prompt includes org context
   - New org-level query tools
   - Tool execution validates org permissions

4. **Create User API** - Organisation assignment required before project

5. **New Organisation Endpoints**:
   - CRUD for organisations
   - Member management
   - Metrics aggregation

6. **Error Handling** - Standard error codes for org-related issues

---

## Next Chapter Preview

**Chapter 7: Permission Matrix Updates** will cover:
- Organisation-level permissions
- Updated permission matrix structure
- usePermissions hook updates
- Permission check patterns

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
