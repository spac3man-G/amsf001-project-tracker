/**
 * Org-filtered query helpers for multi-tenant data access
 * 
 * These helpers ensure that user queries are properly scoped to
 * the current organisation, preventing cross-org data exposure.
 * 
 * @module lib/queries
 * @created 24 December 2025
 * @see docs/MULTI-TENANCY-IMPLEMENTATION-GUIDE.md
 */

import { supabase } from './supabase';

/**
 * Get users who are members of a specific organisation
 * 
 * This replaces direct queries to the profiles table which would
 * expose ALL users in the system regardless of organisation.
 * 
 * @param {string} organisationId - The organisation UUID
 * @param {Object} options - Query options
 * @param {boolean} options.includeTestUsers - Include test users (default: true)
 * @param {string[]} options.excludeUserIds - User IDs to exclude from results
 * @param {string[]} options.orgRoles - Filter by org roles (e.g., ['org_admin', 'org_member'])
 * @returns {Promise<Array>} Array of user objects with org_role included
 * 
 * @example
 * // Get all org members
 * const members = await getOrgMembers(orgId);
 * 
 * @example
 * // Get org members excluding current user, no test users
 * const members = await getOrgMembers(orgId, {
 *   includeTestUsers: false,
 *   excludeUserIds: [currentUserId]
 * });
 * 
 * @example
 * // Get only org admins
 * const admins = await getOrgMembers(orgId, {
 *   orgRoles: ['org_admin']
 * });
 */
export async function getOrgMembers(organisationId, options = {}) {
  const { 
    includeTestUsers = true, 
    excludeUserIds = [],
    orgRoles = null 
  } = options;

  if (!organisationId) {
    console.warn('getOrgMembers called without organisationId');
    return [];
  }

  let query = supabase
    .from('user_organisations')
    .select(`
      user_id,
      org_role,
      is_default,
      joined_at,
      profiles:user_id (
        id,
        email,
        full_name,
        is_test_user,
        avatar_url
      )
    `)
    .eq('organisation_id', organisationId)
    .eq('is_active', true);

  // Filter by specific org roles if provided
  if (orgRoles && orgRoles.length > 0) {
    query = query.in('org_role', orgRoles);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching org members:', error);
    throw error;
  }

  // Transform the data to a flat user structure with org_role included
  let users = (data || [])
    .filter(m => m.profiles) // Filter out any null profiles
    .map(m => ({
      id: m.profiles.id,
      email: m.profiles.email,
      full_name: m.profiles.full_name,
      is_test_user: m.profiles.is_test_user,
      avatar_url: m.profiles.avatar_url,
      org_role: m.org_role,
      is_default_org: m.is_default,
      joined_at: m.joined_at
    }));

  // Filter out test users if requested
  if (!includeTestUsers) {
    users = users.filter(u => !u.is_test_user);
  }

  // Exclude specific users (e.g., current user when building assignment lists)
  if (excludeUserIds.length > 0) {
    users = users.filter(u => !excludeUserIds.includes(u.id));
  }

  return users;
}

/**
 * Get users available for project assignment
 * 
 * Returns org members who are NOT already assigned to the specified project.
 * Useful for "Add User to Project" dropdowns.
 * 
 * @param {string} organisationId - The organisation UUID
 * @param {string} projectId - The project UUID to check assignments against
 * @param {Object} options - Additional filter options (same as getOrgMembers)
 * @returns {Promise<Array>} Array of user objects available for assignment
 * 
 * @example
 * const availableUsers = await getAvailableUsersForProject(orgId, projectId);
 */
export async function getAvailableUsersForProject(organisationId, projectId, options = {}) {
  if (!organisationId || !projectId) {
    console.warn('getAvailableUsersForProject called without required IDs');
    return [];
  }

  // Get all org members
  const orgMembers = await getOrgMembers(organisationId, options);

  // Get users already assigned to this project
  const { data: projectAssignments, error } = await supabase
    .from('user_projects')
    .select('user_id')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project assignments:', error);
    throw error;
  }

  const assignedUserIds = new Set((projectAssignments || []).map(a => a.user_id));

  // Return org members not already assigned
  return orgMembers.filter(u => !assignedUserIds.has(u.id));
}

/**
 * Check if a user is a member of an organisation
 * 
 * @param {string} userId - The user UUID to check
 * @param {string} organisationId - The organisation UUID
 * @returns {Promise<boolean>} True if user is an active org member
 */
export async function isUserOrgMember(userId, organisationId) {
  if (!userId || !organisationId) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_organisations')
    .select('id')
    .eq('user_id', userId)
    .eq('organisation_id', organisationId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error checking org membership:', error);
  }

  return !!data;
}

/**
 * Check if a user is an admin of an organisation
 * 
 * @param {string} userId - The user UUID to check
 * @param {string} organisationId - The organisation UUID
 * @returns {Promise<boolean>} True if user is an org admin
 */
export async function isUserOrgAdmin(userId, organisationId) {
  if (!userId || !organisationId) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_organisations')
    .select('org_role')
    .eq('user_id', userId)
    .eq('organisation_id', organisationId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking org admin status:', error);
  }

  return data?.org_role === 'org_admin';
}

/**
 * Get the organisation ID for a given project
 * 
 * Useful for validation checks before project operations.
 * 
 * @param {string} projectId - The project UUID
 * @returns {Promise<string|null>} The organisation ID or null
 */
export async function getProjectOrganisationId(projectId) {
  if (!projectId) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('organisation_id')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project organisation:', error);
    return null;
  }

  return data?.organisation_id || null;
}
