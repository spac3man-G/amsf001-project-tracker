/**
 * useEvaluationRole Hook
 * 
 * Simple hook to get the current user's role in the active evaluation.
 * Used for role-based UI rendering.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 */

import { useMemo } from 'react';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useOrganisation } from '../contexts/OrganisationContext';

/**
 * Custom hook for evaluation role information
 * @returns {Object} Role information and display helpers
 */
export function useEvaluationRole() {
  const { evaluationRole, stakeholderAreaId, currentEvaluation } = useEvaluation();
  const { isOrgAdmin, isSystemAdmin } = useOrganisation();
  
  // Effective role (org/system admins get admin role)
  const effectiveRole = useMemo(() => {
    if (isOrgAdmin || isSystemAdmin) return 'admin';
    return evaluationRole || null;
  }, [isOrgAdmin, isSystemAdmin, evaluationRole]);

  // Role display name for UI
  const roleDisplayName = useMemo(() => {
    const roleNames = {
      admin: 'Administrator',
      evaluator: 'Evaluator',
      client_stakeholder: 'Client Stakeholder',
      participant: 'Participant',
      vendor: 'Vendor'
    };
    return roleNames[effectiveRole] || 'Unknown';
  }, [effectiveRole]);

  // Role badge color for UI
  const roleBadgeColor = useMemo(() => {
    const colors = {
      admin: 'blue',
      evaluator: 'green',
      client_stakeholder: 'purple',
      participant: 'gray',
      vendor: 'orange'
    };
    return colors[effectiveRole] || 'gray';
  }, [effectiveRole]);

  // Check if user has a specific role
  const hasRole = useMemo(() => {
    return (role) => effectiveRole === role;
  }, [effectiveRole]);

  // Check if user is one of multiple roles
  const hasAnyRole = useMemo(() => {
    return (roles) => roles.includes(effectiveRole);
  }, [effectiveRole]);

  return {
    role: effectiveRole,
    roleDisplayName,
    roleBadgeColor,
    stakeholderAreaId,
    evaluationId: currentEvaluation?.id || null,
    evaluationName: currentEvaluation?.name || null,
    hasRole,
    hasAnyRole,
    
    // Convenience boolean checks
    isAdmin: effectiveRole === 'admin',
    isEvaluator: effectiveRole === 'evaluator',
    isClientStakeholder: effectiveRole === 'client_stakeholder',
    isParticipant: effectiveRole === 'participant',
    isVendor: effectiveRole === 'vendor',
    
    // Is elevated role (admin or evaluator)
    isElevated: ['admin', 'evaluator'].includes(effectiveRole),
    
    // Is internal role (not vendor)
    isInternal: effectiveRole && effectiveRole !== 'vendor',
  };
}

export default useEvaluationRole;
