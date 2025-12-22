# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 5: Service Layer Updates

**Document:** CHAPTER-05-Service-Layer.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 5.1 Overview

This chapter details the service layer changes required to support organisation-level multi-tenancy. The implementation adds a new `OrganisationsService` and updates existing services to be organisation-aware where necessary.

### Key Principles

1. **Entity services remain project-scoped** - Timesheets, expenses, milestones, etc. continue to use `project_id` as primary scope
2. **RLS handles security** - Services don't need to manually filter by org; RLS policies enforce access
3. **Cache keys include context** - Organisation ID included in cache keys to prevent cross-org data leakage
4. **New org-level service** - `OrganisationsService` handles org CRUD and membership

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              NEW: OrganisationsService                   │    │
│  │  - Org CRUD, membership management, invitations         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           MODIFIED: ProjectsService                      │    │
│  │  - Create requires organisation_id                       │    │
│  │  - List filtered by organisation                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           UNCHANGED: Entity Services                     │    │
│  │  - milestones, deliverables, timesheets, expenses       │    │
│  │  - Resources, partners, KPIs, RAID, variations          │    │
│  │  - RLS handles org validation automatically              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           MODIFIED: MetricsService                       │    │
│  │  - Add org-level aggregation methods                     │    │
│  │  - Cache keys include org context                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.2 OrganisationsService

### 5.2.1 File Location

```
src/services/organisations.service.js
```

### 5.2.2 Full Implementation

```javascript
// src/services/organisations.service.js
import { supabase } from '../lib/supabase';
import { 
  getCacheKey, 
  getFromCache, 
  setInCache, 
  invalidateNamespace, 
  CACHE_TTL 
} from '../lib/cache';

// ============================================================
// Constants
// ============================================================

const CACHE_NAMESPACE = 'organisations';

export const ORG_ROLES = {
  ORG_OWNER: 'org_owner',
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member'
};

// ============================================================
// Service Class
// ============================================================

export class OrganisationsService {
  constructor() {
    this.tableName = 'organisations';
    this.membershipsTable = 'user_organisations';
  }

  // ============================================================
  // Organisation CRUD
  // ============================================================

  /**
   * Get all organisations the current user belongs to
   */
  async getMyOrganisations() {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, 'my-orgs');
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from(this.membershipsTable)
      .select(`
        id,
        org_role,
        is_default,
        is_active,
        invited_at,
        accepted_at,
        organisation:organisations (
          id,
          name,
          slug,
          display_name,
          logo_url,
          primary_color,
          settings,
          is_active,
          subscription_tier,
          created_at
        )
      `)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('OrganisationsService.getMyOrganisations error:', error);
      throw error;
    }

    // Filter out inactive organisations
    const result = (data || []).filter(m => m.organisation?.is_active);
    
    setInCache(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }

  /**
   * Get organisation by ID
   */
  async getById(organisationId) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, organisationId);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', organisationId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('OrganisationsService.getById error:', error);
      throw error;
    }

    setInCache(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  }

  /**
   * Get organisation by slug
   */
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('OrganisationsService.getBySlug error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new organisation
   * Note: Typically restricted to system admins via RLS
   */
  async create(organisationData, createdByUserId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        name: organisationData.name,
        slug: this.generateSlug(organisationData.name),
        display_name: organisationData.display_name || null,
        logo_url: organisationData.logo_url || null,
        primary_color: organisationData.primary_color || '#6366f1',
        settings: organisationData.settings || {},
        created_by: createdByUserId
      })
      .select()
      .single();

    if (error) {
      console.error('OrganisationsService.create error:', error);
      throw error;
    }

    // Add creator as org_owner
    await this.addMember(data.id, createdByUserId, ORG_ROLES.ORG_OWNER);

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Update organisation
   */
  async update(organisationId, updates) {
    // Prevent updating protected fields
    const { id, slug, created_by, created_at, is_deleted, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', organisationId)
      .select()
      .single();

    if (error) {
      console.error('OrganisationsService.update error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Soft delete organisation
   * Note: Restricted to org_owner via RLS
   */
  async delete(organisationId, deletedByUserId) {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedByUserId
      })
      .eq('id', organisationId);

    if (error) {
      console.error('OrganisationsService.delete error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return true;
  }

  // ============================================================
  // Membership Management
  // ============================================================

  /**
   * Get all members of an organisation
   */
  async getMembers(organisationId) {
    const { data, error } = await supabase
      .from(this.membershipsTable)
      .select(`
        id,
        user_id,
        org_role,
        is_active,
        invited_by,
        invited_at,
        accepted_at,
        created_at,
        user:profiles!user_id (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('organisation_id', organisationId)
      .eq('is_active', true)
      .order('org_role', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('OrganisationsService.getMembers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific membership
   */
  async getMembership(organisationId, userId) {
    const { data, error } = await supabase
      .from(this.membershipsTable)
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Add a member to organisation
   */
  async addMember(organisationId, userId, orgRole = ORG_ROLES.ORG_MEMBER, invitedBy = null) {
    // Check if already a member
    const existing = await this.getMembership(organisationId, userId);
    if (existing) {
      if (existing.is_active) {
        throw new Error('User is already a member of this organisation');
      }
      // Reactivate membership
      return this.updateMembership(existing.id, { 
        is_active: true, 
        org_role: orgRole 
      });
    }

    const { data, error } = await supabase
      .from(this.membershipsTable)
      .insert({
        organisation_id: organisationId,
        user_id: userId,
        org_role: orgRole,
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(), // Auto-accept for direct adds
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('OrganisationsService.addMember error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Update member role
   */
  async updateMemberRole(membershipId, newRole) {
    return this.updateMembership(membershipId, { org_role: newRole });
  }

  /**
   * Update membership
   */
  async updateMembership(membershipId, updates) {
    const { data, error } = await supabase
      .from(this.membershipsTable)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) {
      console.error('OrganisationsService.updateMembership error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Remove member from organisation (soft remove via is_active)
   */
  async removeMember(membershipId) {
    const { error } = await supabase
      .from(this.membershipsTable)
      .update({ is_active: false })
      .eq('id', membershipId);

    if (error) {
      console.error('OrganisationsService.removeMember error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return true;
  }

  /**
   * Set default organisation for user
   */
  async setDefaultOrganisation(userId, organisationId) {
    // Clear existing defaults
    await supabase
      .from(this.membershipsTable)
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { error } = await supabase
      .from(this.membershipsTable)
      .update({ is_default: true })
      .eq('user_id', userId)
      .eq('organisation_id', organisationId);

    if (error) {
      console.error('OrganisationsService.setDefaultOrganisation error:', error);
      throw error;
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return true;
  }

  // ============================================================
  // Invitation Management
  // ============================================================

  /**
   * Invite a user to the organisation by email
   * If user exists, adds them directly
   * If user doesn't exist, creates a pending invitation
   */
  async inviteMember(organisationId, { email, org_role }, invitedBy) {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      // User exists - add directly
      return this.addMember(organisationId, existingUser.id, org_role, invitedBy);
    }

    // User doesn't exist - create pending invitation
    // This would typically involve sending an email and creating
    // an invitation record. For now, we'll throw an error.
    throw new Error(
      'User not found. Please ask them to create an account first, ' +
      'or implement email invitation system.'
    );

    // Future implementation:
    // return this.createPendingInvitation(organisationId, normalizedEmail, org_role, invitedBy);
  }

  // ============================================================
  // Statistics
  // ============================================================

  /**
   * Get organisation statistics
   */
  async getStats(organisationId) {
    const [members, projects] = await Promise.all([
      this.getMemberCount(organisationId),
      this.getProjectCount(organisationId)
    ]);

    return {
      memberCount: members,
      projectCount: projects
    };
  }

  /**
   * Get member count for organisation
   */
  async getMemberCount(organisationId) {
    const { count, error } = await supabase
      .from(this.membershipsTable)
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get project count for organisation
   */
  async getProjectCount(organisationId) {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId)
      .eq('is_deleted', false);

    if (error) throw error;
    return count || 0;
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Generate URL-safe slug from name
   */
  generateSlug(name) {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Add random suffix for uniqueness
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${suffix}`;
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug) {
    const { count } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug);

    return count === 0;
  }

  /**
   * Clear cache
   */
  clearCache() {
    invalidateNamespace(CACHE_NAMESPACE);
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const organisationsService = new OrganisationsService();
export default organisationsService;
```

---

## 5.3 ProjectsService Updates

### 5.3.1 Key Changes

1. **Create requires `organisation_id`** - Projects must belong to an organisation
2. **List methods filter by organisation** - When fetching for org context
3. **Org admin methods** - Get all projects in organisation

### 5.3.2 Updated Implementation

```javascript
// src/services/projects.service.js
import { supabase } from '../lib/supabase';
import { BaseService } from './base.service';
import { 
  getCacheKey, 
  getFromCache, 
  setInCache, 
  invalidateNamespace,
  CACHE_TTL 
} from '../lib/cache';

const CACHE_NAMESPACE = 'projects';

export class ProjectsService extends BaseService {
  constructor() {
    super('projects', {
      supportsSoftDelete: true
    });
  }

  // ============================================================
  // Organisation-Scoped Methods
  // ============================================================

  /**
   * Get all projects in an organisation
   * Used by org admins to see all org projects
   */
  async getByOrganisation(organisationId, options = {}) {
    const cacheKey = getCacheKey(CACHE_NAMESPACE, organisationId, 'all');
    
    if (!options.bypassCache) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        member_count:user_projects(count)
      `)
      .eq('organisation_id', organisationId)
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error('ProjectsService.getByOrganisation error:', error);
      throw error;
    }

    // Transform member count
    const result = (data || []).map(project => ({
      ...project,
      member_count: project.member_count?.[0]?.count || 0
    }));

    setInCache(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }

  /**
   * Get projects the current user is assigned to within an organisation
   */
  async getMyProjectsInOrganisation(organisationId) {
    const { data, error } = await supabase
      .from('user_projects')
      .select(`
        id,
        role,
        is_default,
        project:projects (
          id,
          name,
          project_ref,
          status,
          start_date,
          end_date,
          organisation_id,
          is_deleted
        )
      `)
      .eq('projects.organisation_id', organisationId)
      .eq('projects.is_deleted', false)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('ProjectsService.getMyProjectsInOrganisation error:', error);
      throw error;
    }

    // Filter out any null projects (from join)
    return (data || []).filter(d => d.project !== null);
  }

  // ============================================================
  // CRUD Overrides
  // ============================================================

  /**
   * Create a new project
   * UPDATED: Requires organisation_id
   */
  async create(projectData) {
    // Validate organisation_id
    if (!projectData.organisation_id) {
      throw new Error('organisation_id is required to create a project');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        name: projectData.name,
        project_ref: projectData.project_ref,
        organisation_id: projectData.organisation_id,
        description: projectData.description || null,
        status: projectData.status || 'Active',
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        budget: projectData.budget || null,
        settings: projectData.settings || {},
        created_by: projectData.created_by
      })
      .select()
      .single();

    if (error) {
      console.error('ProjectsService.create error:', error);
      throw error;
    }

    // Optionally add creator to project
    if (projectData.created_by && projectData.add_creator_as_admin !== false) {
      await this.addMember(data.id, projectData.created_by, 'admin');
    }

    invalidateNamespace(CACHE_NAMESPACE);
    return data;
  }

  /**
   * Get project with organisation details
   */
  async getWithOrganisation(projectId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        organisation:organisations (
          id,
          name,
          slug,
          display_name,
          settings
        )
      `)
      .eq('id', projectId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // ============================================================
  // Member Management
  // ============================================================

  /**
   * Add member to project
   * UPDATED: Validates user is org member first (via RLS, but we can check too)
   */
  async addMember(projectId, userId, role = 'viewer') {
    const { data, error } = await supabase
      .from('user_projects')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role
      })
      .select()
      .single();

    if (error) {
      // Check for specific constraint violation
      if (error.code === '23503') {
        throw new Error('User must be a member of the organisation first');
      }
      console.error('ProjectsService.addMember error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get project members
   */
  async getMembers(projectId) {
    const { data, error } = await supabase
      .from('user_projects')
      .select(`
        id,
        role,
        is_default,
        created_at,
        user:profiles!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('role')
      .order('created_at');

    if (error) {
      console.error('ProjectsService.getMembers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update member role
   */
  async updateMemberRole(membershipId, newRole) {
    const { data, error } = await supabase
      .from('user_projects')
      .update({ role: newRole })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove member from project
   */
  async removeMember(membershipId) {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', membershipId);

    if (error) throw error;
    return true;
  }

  // ============================================================
  // Statistics
  // ============================================================

  /**
   * Get project summary for organisation dashboard
   */
  async getOrganisationSummary(organisationId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id, status')
      .eq('organisation_id', organisationId)
      .eq('is_deleted', false);

    if (error) throw error;

    const projects = data || [];
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'Active').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      onHold: projects.filter(p => p.status === 'On Hold').length
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    invalidateNamespace(CACHE_NAMESPACE);
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const projectsService = new ProjectsService();
export default projectsService;
```

---

## 5.4 MetricsService Updates

### 5.4.1 Key Changes

1. **Add org-level aggregation methods** - Aggregate metrics across all org projects
2. **Update cache keys** - Include organisation context
3. **Cross-project summaries** - For org admin dashboard

### 5.4.2 New Methods

```javascript
// src/services/metrics.service.js - Additional methods

// Add to existing MetricsService class:

// ============================================================
// Organisation-Level Metrics
// ============================================================

/**
 * Get aggregated metrics across all projects in an organisation
 * For org admin dashboard
 */
async getOrganisationMetrics(organisationId, options = {}) {
  const cacheKey = `org-metrics:${organisationId}`;
  
  const cached = this.getCached(cacheKey);
  if (cached && !options.bypassCache) return cached;

  // Get all projects in org
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('organisation_id', organisationId)
    .eq('is_deleted', false);

  if (error) throw error;

  // Aggregate metrics from all projects
  const projectIds = projects.map(p => p.id);
  
  const [
    milestoneStats,
    deliverableStats,
    budgetStats,
    timesheetStats
  ] = await Promise.all([
    this.getOrgMilestoneStats(projectIds),
    this.getOrgDeliverableStats(projectIds),
    this.getOrgBudgetStats(projectIds),
    this.getOrgTimesheetStats(projectIds)
  ]);

  const result = {
    projects: {
      total: projects.length,
      active: projects.filter(p => p.status === 'Active').length,
      completed: projects.filter(p => p.status === 'Completed').length
    },
    milestones: milestoneStats,
    deliverables: deliverableStats,
    budget: budgetStats,
    timesheets: timesheetStats,
    generatedAt: new Date().toISOString()
  };

  this.setCache(cacheKey, result);
  return result;
}

/**
 * Get milestone stats across projects
 */
async getOrgMilestoneStats(projectIds) {
  if (projectIds.length === 0) {
    return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
  }

  const { data, error } = await supabase
    .from('milestones')
    .select('id, status')
    .in('project_id', projectIds)
    .eq('is_deleted', false);

  if (error) throw error;

  const milestones = data || [];
  return {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'Completed').length,
    inProgress: milestones.filter(m => m.status === 'In Progress').length,
    notStarted: milestones.filter(m => m.status === 'Not Started').length
  };
}

/**
 * Get deliverable stats across projects
 */
async getOrgDeliverableStats(projectIds) {
  if (projectIds.length === 0) {
    return { total: 0, delivered: 0, inProgress: 0, overdue: 0 };
  }

  const { data, error } = await supabase
    .from('deliverables')
    .select('id, status, due_date')
    .in('project_id', projectIds)
    .eq('is_deleted', false);

  if (error) throw error;

  const deliverables = data || [];
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total: deliverables.length,
    delivered: deliverables.filter(d => d.status === 'Delivered').length,
    inProgress: deliverables.filter(d => 
      !['Delivered', 'Not Started'].includes(d.status)
    ).length,
    overdue: deliverables.filter(d => 
      d.due_date < today && d.status !== 'Delivered'
    ).length
  };
}

/**
 * Get budget stats across projects
 */
async getOrgBudgetStats(projectIds) {
  if (projectIds.length === 0) {
    return { totalBudget: 0, totalSpend: 0, utilizationPercent: 0 };
  }

  // Get project budgets
  const { data: projects } = await supabase
    .from('projects')
    .select('budget')
    .in('id', projectIds);

  // Get timesheet spend
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('hours, cost_price')
    .in('project_id', projectIds)
    .eq('status', 'Approved');

  // Get expense spend
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .in('project_id', projectIds)
    .eq('status', 'Approved');

  const totalBudget = (projects || []).reduce((sum, p) => sum + (p.budget || 0), 0);
  const timesheetSpend = (timesheets || []).reduce((sum, t) => 
    sum + ((t.hours || 0) * (t.cost_price || 0)), 0
  );
  const expenseSpend = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalSpend = timesheetSpend + expenseSpend;

  return {
    totalBudget,
    timesheetSpend,
    expenseSpend,
    totalSpend,
    utilizationPercent: totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0
  };
}

/**
 * Get timesheet stats across projects
 */
async getOrgTimesheetStats(projectIds) {
  if (projectIds.length === 0) {
    return { totalHours: 0, pendingApproval: 0 };
  }

  const { data, error } = await supabase
    .from('timesheets')
    .select('hours, status')
    .in('project_id', projectIds);

  if (error) throw error;

  const timesheets = data || [];
  return {
    totalHours: timesheets
      .filter(t => t.status === 'Approved')
      .reduce((sum, t) => sum + (t.hours || 0), 0),
    pendingApproval: timesheets.filter(t => t.status === 'Submitted').length
  };
}

/**
 * Get per-project breakdown for org dashboard
 */
async getProjectBreakdown(organisationId) {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_ref,
      status,
      budget
    `)
    .eq('organisation_id', organisationId)
    .eq('is_deleted', false)
    .order('name');

  if (error) throw error;

  // Get metrics for each project
  const breakdown = await Promise.all(
    (projects || []).map(async (project) => {
      const metrics = await this.getAllDashboardMetrics(project.id, { 
        lightweight: true 
      });
      return {
        ...project,
        metrics: {
          milestoneProgress: metrics.milestones?.averageProgress || 0,
          deliverableCompletion: metrics.deliverables?.completionPercent || 0,
          budgetUtilization: metrics.budget?.utilizationPercent || 0
        }
      };
    })
  );

  return breakdown;
}
```

---

## 5.5 Cache Strategy Updates

### 5.5.1 Cache Key Patterns

```javascript
// src/lib/cache.js - Updated patterns

/**
 * Generate cache key with org awareness
 * 
 * Pattern: namespace:orgId:projectId:identifier
 */
export function getCacheKey(namespace, ...parts) {
  return [namespace, ...parts.filter(Boolean)].join(':');
}

// Examples:
// Organisation-level:  'organisations:org-123'
// Project in org:      'projects:org-123:proj-456'
// Entity in project:   'timesheets:proj-456:all'
```

### 5.5.2 Cache Invalidation on Org Switch

```javascript
// In OrganisationContext when switching orgs:

const switchOrganisation = useCallback((organisationId) => {
  // ... existing logic ...
  
  // Clear all project-scoped caches
  invalidateNamespace('projects');
  invalidateNamespace('timesheets');
  invalidateNamespace('expenses');
  invalidateNamespace('milestones');
  invalidateNamespace('deliverables');
  invalidateNamespace('resources');
  invalidateNamespace('partners');
  // ... etc
  
  // Clear metrics cache
  metricsService.clearCache();
  
}, []);
```

---

## 5.6 Service Index Updates

### 5.6.1 Barrel Export

```javascript
// src/services/index.js

// Base class
export { BaseService } from './base.service';

// NEW: Organisation service
export { 
  organisationsService, 
  OrganisationsService,
  ORG_ROLES 
} from './organisations.service';

// Updated: Projects service
export { projectsService, ProjectsService } from './projects.service';

// Existing services (unchanged)
export { partnersService, PartnersService } from './partners.service';
export { resourcesService, ResourcesService } from './resources.service';
export { timesheetsService, TimesheetsService } from './timesheets.service';
export { expensesService, ExpensesService } from './expenses.service';
export { milestonesService, MilestonesService } from './milestones.service';
export { deliverablesService, DeliverablesService } from './deliverables.service';
export { kpisService, KPIsService } from './kpis.service';
export { qualityStandardsService, QualityStandardsService } from './qualityStandards.service';
export { raidService, RAIDService } from './raid.service';
export { variationsService, VariationsService } from './variations.service';
export { invoicingService, InvoicingService } from './invoicing.service';
export { metricsService, MetricsService } from './metrics.service';
export { documentTemplatesService } from './documentTemplates.service';
export { documentRendererService } from './documentRenderer.service';
export { receiptScannerService } from './receiptScanner.service';
export { workflowService } from './workflow.service';
export { dashboardService } from './dashboard.service';
```

---

## 5.7 Entity Services - No Changes Required

The following services require **no changes** because:

1. RLS policies handle org validation automatically
2. They continue to scope by `project_id`
3. The org check happens at the database level

| Service | Reason No Changes Needed |
|---------|-------------------------|
| `timesheets.service.js` | Scoped by project_id, RLS validates org |
| `expenses.service.js` | Scoped by project_id, RLS validates org |
| `milestones.service.js` | Scoped by project_id, RLS validates org |
| `deliverables.service.js` | Scoped by project_id, RLS validates org |
| `resources.service.js` | Scoped by project_id, RLS validates org |
| `partners.service.js` | Scoped by project_id, RLS validates org |
| `kpis.service.js` | Scoped by project_id, RLS validates org |
| `qualityStandards.service.js` | Scoped by project_id, RLS validates org |
| `raid.service.js` | Scoped by project_id, RLS validates org |
| `variations.service.js` | Scoped by project_id, RLS validates org |
| `invoicing.service.js` | Scoped by project_id, RLS validates org |

---

## 5.8 Testing Service Changes

### 5.8.1 Unit Test Examples

```javascript
// src/__tests__/services/organisations.service.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organisationsService, ORG_ROLES } from '../../services';

describe('OrganisationsService', () => {
  describe('create', () => {
    it('creates organisation and adds creator as owner', async () => {
      const org = await organisationsService.create(
        { name: 'Test Org' },
        'user-123'
      );
      
      expect(org.name).toBe('Test Org');
      expect(org.slug).toMatch(/^test-org-[a-z0-9]{4}$/);
      
      // Verify owner membership created
      const membership = await organisationsService.getMembership(
        org.id, 
        'user-123'
      );
      expect(membership.org_role).toBe(ORG_ROLES.ORG_OWNER);
    });
  });

  describe('getMembers', () => {
    it('returns members grouped by role', async () => {
      const members = await organisationsService.getMembers('org-123');
      
      expect(Array.isArray(members)).toBe(true);
      members.forEach(member => {
        expect(member).toHaveProperty('org_role');
        expect(member).toHaveProperty('user');
      });
    });
  });

  describe('inviteMember', () => {
    it('adds existing user directly', async () => {
      const result = await organisationsService.inviteMember(
        'org-123',
        { email: 'existing@test.com', org_role: ORG_ROLES.ORG_MEMBER },
        'inviter-123'
      );
      
      expect(result.org_role).toBe(ORG_ROLES.ORG_MEMBER);
    });

    it('throws for non-existent user', async () => {
      await expect(
        organisationsService.inviteMember(
          'org-123',
          { email: 'new@test.com', org_role: ORG_ROLES.ORG_MEMBER },
          'inviter-123'
        )
      ).rejects.toThrow('User not found');
    });
  });
});
```

### 5.8.2 Integration Test Examples

```javascript
// src/__tests__/integration/org-project-flow.test.js
import { describe, it, expect } from 'vitest';
import { organisationsService, projectsService } from '../../services';

describe('Organisation-Project Flow', () => {
  it('creates project within organisation', async () => {
    // Create org
    const org = await organisationsService.create(
      { name: 'Test Org' },
      'admin-user'
    );

    // Create project in org
    const project = await projectsService.create({
      name: 'Test Project',
      project_ref: 'TEST-001',
      organisation_id: org.id,
      created_by: 'admin-user'
    });

    expect(project.organisation_id).toBe(org.id);

    // Verify project appears in org's projects
    const orgProjects = await projectsService.getByOrganisation(org.id);
    expect(orgProjects.some(p => p.id === project.id)).toBe(true);
  });

  it('prevents project creation without organisation_id', async () => {
    await expect(
      projectsService.create({
        name: 'Orphan Project',
        project_ref: 'ORPHAN-001',
        created_by: 'admin-user'
        // Missing organisation_id
      })
    ).rejects.toThrow('organisation_id is required');
  });
});
```

---

## 5.9 Chapter Summary

This chapter established:

1. **New OrganisationsService** - Complete implementation with:
   - Organisation CRUD
   - Membership management
   - Invitation handling
   - Statistics methods

2. **Updated ProjectsService** - Key changes:
   - `create()` requires `organisation_id`
   - `getByOrganisation()` for org admins
   - `getMyProjectsInOrganisation()` for filtered access

3. **Updated MetricsService** - New methods:
   - `getOrganisationMetrics()` - Cross-project aggregation
   - `getProjectBreakdown()` - Per-project summary for org dashboard

4. **Cache Strategy** - Updated patterns:
   - Org-aware cache keys
   - Cache invalidation on org switch

5. **Entity Services Unchanged** - RLS handles org validation

6. **Testing Approach** - Unit and integration test examples

---

## Next Chapter Preview

**Chapter 6: API Layer Updates** will cover:
- Updated API endpoints for org context
- Chat context modifications
- User creation API changes
- Org-level API endpoints

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
