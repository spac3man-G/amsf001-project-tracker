/**
 * useEvaluatorPermissions Hook
 * 
 * Provides permission checks for evaluator actions based on user's role.
 * Similar to usePermissions but specific to the evaluator tool.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 */

import { useMemo } from 'react';
import { useEvaluation } from '../contexts/EvaluationContext';
import { useOrganisation } from '../contexts/OrganisationContext';

// Permission matrix for evaluator roles
const EVALUATOR_PERMISSION_MATRIX = {
  admin: {
    evaluation: { view: true, edit: true, delete: true },
    requirements: { view: true, create: true, edit: true, delete: true, approve: true },
    workshops: { view: true, create: true, edit: true, delete: true, facilitate: true },
    surveys: { view: true, create: true, edit: true, delete: true },
    vendors: { view: true, create: true, edit: true, delete: true },
    scoring: { view: true, score: true, reconcile: true },
    reports: { view: true, generate: true },
    settings: { view: true, edit: true },
    team: { view: true, manage: true }
  },
  evaluator: {
    evaluation: { view: true, edit: false, delete: false },
    requirements: { view: true, create: true, edit: true, delete: false, approve: false },
    workshops: { view: true, create: true, edit: true, delete: false, facilitate: true },
    surveys: { view: true, create: true, edit: true, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    scoring: { view: true, score: true, reconcile: false },
    reports: { view: true, generate: true },
    settings: { view: true, edit: false },
    team: { view: true, manage: false }
  },

  client_stakeholder: {
    evaluation: { view: true, edit: false, delete: false },
    requirements: { view: true, create: false, edit: false, delete: false, approve: true },
    workshops: { view: true, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: true, create: false, edit: false, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    scoring: { view: true, score: false, reconcile: false },
    reports: { view: true, generate: false },
    settings: { view: false, edit: false },
    team: { view: true, manage: false }
  },
  participant: {
    evaluation: { view: false, edit: false, delete: false },
    requirements: { view: false, create: false, edit: false, delete: false, approve: false },
    workshops: { view: false, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: true, create: false, edit: false, delete: false }, // Can respond to surveys
    vendors: { view: false, create: false, edit: false, delete: false },
    scoring: { view: false, score: false, reconcile: false },
    reports: { view: false, generate: false },
    settings: { view: false, edit: false },
    team: { view: false, manage: false }
  },
  vendor: {
    evaluation: { view: false, edit: false, delete: false },
    requirements: { view: true, create: false, edit: false, delete: false, approve: false }, // See requirements to respond
    workshops: { view: false, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: false, create: false, edit: false, delete: false },
    vendors: { view: false, create: false, edit: false, delete: false }, // Own vendor record managed differently
    scoring: { view: false, score: false, reconcile: false },
    reports: { view: false, generate: false },
    settings: { view: false, edit: false },
    team: { view: false, manage: false }
  }
};

/**
 * Custom hook for evaluator permissions
 * @returns {Object} Permission helpers and role info
 */
export function useEvaluatorPermissions() {
  const { evaluationRole } = useEvaluation();
  const { isOrgAdmin, isSystemAdmin } = useOrganisation();
  
  // Effective role (org/system admins get admin role)
  const effectiveRole = useMemo(() => {
    if (isOrgAdmin || isSystemAdmin) return 'admin';
    return evaluationRole || 'participant';
  }, [isOrgAdmin, isSystemAdmin, evaluationRole]);
  
  // Get permission from matrix
  const can = useMemo(() => {
    return (entity, action) => {
      const rolePerms = EVALUATOR_PERMISSION_MATRIX[effectiveRole];
      return rolePerms?.[entity]?.[action] ?? false;
    };
  }, [effectiveRole]);

  // Permission checks
  const permissions = useMemo(() => ({
    // Evaluation
    canViewEvaluation: can('evaluation', 'view'),
    canEditEvaluation: can('evaluation', 'edit'),
    canDeleteEvaluation: can('evaluation', 'delete'),
    
    // Requirements
    canViewRequirements: can('requirements', 'view'),
    canCreateRequirements: can('requirements', 'create'),
    canEditRequirements: can('requirements', 'edit'),
    canDeleteRequirements: can('requirements', 'delete'),
    canApproveRequirements: can('requirements', 'approve'),
    
    // Workshops
    canViewWorkshops: can('workshops', 'view'),
    canCreateWorkshops: can('workshops', 'create'),
    canEditWorkshops: can('workshops', 'edit'),
    canDeleteWorkshops: can('workshops', 'delete'),
    canFacilitateWorkshops: can('workshops', 'facilitate'),
    
    // Surveys
    canViewSurveys: can('surveys', 'view'),
    canCreateSurveys: can('surveys', 'create'),
    canEditSurveys: can('surveys', 'edit'),
    canDeleteSurveys: can('surveys', 'delete'),
    
    // Vendors
    canViewVendors: can('vendors', 'view'),
    canCreateVendors: can('vendors', 'create'),
    canEditVendors: can('vendors', 'edit'),
    canDeleteVendors: can('vendors', 'delete'),
    
    // Scoring
    canViewScoring: can('scoring', 'view'),
    canScore: can('scoring', 'score'),
    canReconcileScores: can('scoring', 'reconcile'),
    
    // Reports
    canViewReports: can('reports', 'view'),
    canGenerateReports: can('reports', 'generate'),
    
    // Settings
    canViewSettings: can('settings', 'view'),
    canEditSettings: can('settings', 'edit'),
    
    // Team
    canViewTeam: can('team', 'view'),
    canManageTeam: can('team', 'manage'),
  }), [can]);

  // Role checks
  const roleChecks = useMemo(() => ({
    isAdmin: effectiveRole === 'admin',
    isEvaluator: effectiveRole === 'evaluator',
    isClientStakeholder: effectiveRole === 'client_stakeholder',
    isParticipant: effectiveRole === 'participant',
    isVendor: effectiveRole === 'vendor',

    // Aggregate checks
    canManageEvaluation: effectiveRole === 'admin',
    canContribute: ['admin', 'evaluator'].includes(effectiveRole),
    canApprove: ['admin', 'client_stakeholder'].includes(effectiveRole),

    // Requirements management (create, edit, delete)
    canManageRequirements: ['admin', 'evaluator'].includes(effectiveRole),
  }), [effectiveRole]);

  return {
    effectiveRole,
    can,
    ...permissions,
    ...roleChecks,
  };
}

export default useEvaluatorPermissions;
