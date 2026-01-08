/**
 * EvaluationContext
 * 
 * Provides current evaluation project context to the evaluator tool.
 * Similar to ProjectContext but for evaluation projects.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 * 
 * Key features:
 * - Fetches user's assigned evaluation projects
 * - Includes evaluation-specific role for each assignment
 * - Auto-selects default evaluation or first available
 * - Persists selection in localStorage
 * - Exposes availableEvaluations for evaluation switcher UI
 * - Organisation-aware: filters by current organisation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOrganisation } from './OrganisationContext';

const EvaluationContext = createContext(null);

// localStorage key for persisting evaluation selection
const EVALUATION_STORAGE_KEY = 'amsf_current_evaluation_id';

export function EvaluationProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    organisationId, 
    isOrgAdmin, 
    isSystemAdmin,
    isLoading: orgLoading 
  } = useOrganisation();
  
  // State
  const [availableEvaluations, setAvailableEvaluations] = useState([]);
  const [currentEvaluationId, setCurrentEvaluationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive current evaluation and role from availableEvaluations
  const currentAssignment = useMemo(() => {
    if (!currentEvaluationId || availableEvaluations.length === 0) return null;
    return availableEvaluations.find(a => a.evaluation_project_id === currentEvaluationId) || null;
  }, [currentEvaluationId, availableEvaluations]);

  const currentEvaluation = currentAssignment?.evaluation_project || null;
  const currentEvaluationRole = currentAssignment?.role || null;
  const currentStakeholderAreaId = currentAssignment?.stakeholder_area_id || null;

  // Fetch user's assigned evaluations (filtered by organisation)
  const fetchUserEvaluations = useCallback(async () => {
    if (!user?.id) {
      setAvailableEvaluations([]);
      setCurrentEvaluationId(null);
      setIsLoading(false);
      return;
    }

    // Wait for organisation to be loaded
    if (!organisationId) {
      setAvailableEvaluations([]);
      setCurrentEvaluationId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let assignments = [];

      // For org admins or system admins: fetch ALL evaluation projects in the organisation
      if (isOrgAdmin || isSystemAdmin) {
        // Get all evaluation projects in the organisation
        const { data: orgEvaluations, error: evalError } = await supabase
          .from('evaluation_projects')
          .select('*')
          .eq('organisation_id', organisationId)
          .or('is_deleted.is.null,is_deleted.eq.false')
          .order('name');

        if (evalError) {
          console.error('Error fetching organisation evaluations:', evalError);
          setError(evalError);
          setIsLoading(false);
          return;
        }

        // Get user's actual role assignments
        const { data: userAssignments } = await supabase
          .from('evaluation_project_users')
          .select('evaluation_project_id, role, is_default, stakeholder_area_id')
          .eq('user_id', user.id);

        // Create a map of user's roles per evaluation
        const roleMap = {};
        (userAssignments || []).forEach(a => {
          roleMap[a.evaluation_project_id] = { 
            role: a.role, 
            is_default: a.is_default,
            stakeholder_area_id: a.stakeholder_area_id
          };
        });

        // Build assignments array with org admin having 'admin' role for unassigned evaluations
        // Filter out any null/undefined entries that might come from the database
        assignments = (orgEvaluations || [])
          .filter(evaluation => evaluation && evaluation.id)
          .map(evaluation => ({
            id: `${user.id}-${evaluation.id}`,
            evaluation_project_id: evaluation.id,
            role: roleMap[evaluation.id]?.role || 'admin',
            is_default: roleMap[evaluation.id]?.is_default || false,
            stakeholder_area_id: roleMap[evaluation.id]?.stakeholder_area_id || null,
            evaluation_project: evaluation
          }));

      } else {
        // Regular users: fetch only their assigned evaluations within the organisation
        const { data: userAssignments, error: fetchError } = await supabase
          .from('evaluation_project_users')
          .select(`
            id,
            evaluation_project_id,
            role,
            is_default,
            stakeholder_area_id,
            evaluation_project:evaluation_projects(*)
          `)
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (fetchError) {
          console.error('Error fetching user evaluations:', fetchError);
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        // Filter to only evaluations in the current organisation and not deleted
        // Also filter out any null/undefined evaluation_project entries
        assignments = (userAssignments || []).filter(
          a => a.evaluation_project?.id &&
               a.evaluation_project?.organisation_id === organisationId &&
               !a.evaluation_project?.is_deleted
        );
      }

      // It's okay to have no evaluations - the user just hasn't been assigned to any yet
      setAvailableEvaluations(assignments);

      // Determine which evaluation to select
      let selectedEvaluationId = null;

      // 1. Try to restore from localStorage
      try {
        const storedId = localStorage.getItem(EVALUATION_STORAGE_KEY);
        if (storedId) {
          const storedAssignment = assignments.find(
            a => a.evaluation_project_id === storedId
          );
          if (storedAssignment) {
            selectedEvaluationId = storedId;
          }
        }
      } catch (e) {
        console.warn('Failed to read evaluation from localStorage:', e);
      }

      // 2. Fall back to default evaluation
      if (!selectedEvaluationId) {
        const defaultAssignment = assignments.find(a => a.is_default);
        if (defaultAssignment) {
          selectedEvaluationId = defaultAssignment.evaluation_project_id;
        }
      }

      // 3. Fall back to first available evaluation
      if (!selectedEvaluationId && assignments.length > 0) {
        selectedEvaluationId = assignments[0].evaluation_project_id;
      }

      setCurrentEvaluationId(selectedEvaluationId);

      // Persist selection
      if (selectedEvaluationId) {
        try {
          localStorage.setItem(EVALUATION_STORAGE_KEY, selectedEvaluationId);
        } catch (e) {
          console.warn('Failed to save evaluation to localStorage:', e);
        }
      }

    } catch (err) {
      console.error('Evaluation fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organisationId, isOrgAdmin, isSystemAdmin]);

  // Fetch evaluations when user or organisation changes
  useEffect(() => {
    if (!authLoading && !orgLoading) {
      fetchUserEvaluations();
    }
  }, [authLoading, orgLoading, fetchUserEvaluations]);

  // Clear current evaluation when organisation changes and current evaluation is not in new org
  useEffect(() => {
    if (currentEvaluationId && availableEvaluations.length > 0) {
      const evalInOrg = availableEvaluations.find(a => a.evaluation_project_id === currentEvaluationId);
      if (!evalInOrg) {
        setCurrentEvaluationId(null);
        try {
          localStorage.removeItem(EVALUATION_STORAGE_KEY);
        } catch (e) {
          console.warn('Failed to clear evaluation from localStorage:', e);
        }
      }
    }
  }, [organisationId, currentEvaluationId, availableEvaluations]);

  // Switch to a different evaluation
  const switchEvaluation = useCallback((evaluationId) => {
    const assignment = availableEvaluations.find(a => a.evaluation_project_id === evaluationId);
    if (!assignment) {
      console.warn('Cannot switch to evaluation not in user assignments:', evaluationId);
      return false;
    }

    setCurrentEvaluationId(evaluationId);

    try {
      localStorage.setItem(EVALUATION_STORAGE_KEY, evaluationId);
    } catch (e) {
      console.warn('Failed to save evaluation to localStorage:', e);
    }

    return true;
  }, [availableEvaluations]);

  // Refresh current evaluation data
  const refreshEvaluation = useCallback(async () => {
    if (!currentEvaluationId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('evaluation_projects')
        .select('*')
        .eq('id', currentEvaluationId)
        .limit(1);

      if (fetchError) {
        console.error('Error refreshing evaluation:', fetchError);
        setError(fetchError);
        return;
      }

      if (data && data.length > 0) {
        setAvailableEvaluations(prev => prev.map(a => 
          a.evaluation_project_id === currentEvaluationId 
            ? { ...a, evaluation_project: data[0] }
            : a
        ));
      }

    } catch (err) {
      console.error('Evaluation refresh error:', err);
      setError(err);
    }
  }, [currentEvaluationId]);

  // Check if user has any evaluations
  const hasEvaluations = availableEvaluations.length > 0;
  const hasMultipleEvaluations = availableEvaluations.length > 1;

  // Build context value
  const value = useMemo(() => ({
    // Current evaluation
    currentEvaluation,
    evaluationId: currentEvaluation?.id || null,
    evaluationName: currentEvaluation?.name || null,
    evaluationStatus: currentEvaluation?.status || null,
    
    // Evaluation-scoped role
    evaluationRole: currentEvaluationRole,
    stakeholderAreaId: currentStakeholderAreaId,
    
    // Multi-evaluation support
    availableEvaluations,
    hasEvaluations,
    hasMultipleEvaluations,
    switchEvaluation,
    
    // State
    isLoading: isLoading || authLoading || orgLoading,
    error,
    
    // Actions
    refreshEvaluation,
    refreshEvaluationAssignments: fetchUserEvaluations,
  }), [
    currentEvaluation,
    currentEvaluationRole,
    currentStakeholderAreaId,
    availableEvaluations,
    hasEvaluations,
    hasMultipleEvaluations,
    switchEvaluation,
    isLoading,
    authLoading,
    orgLoading,
    error,
    refreshEvaluation,
    fetchUserEvaluations,
  ]);

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

// Custom hook to use evaluation context
export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}

// Export context for testing
export { EvaluationContext };
