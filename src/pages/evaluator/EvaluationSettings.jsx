/**
 * EvaluationSettings
 * 
 * Settings page for configuring evaluation project parameters:
 * - Stakeholder areas
 * - Evaluation categories with weights
 * - Scoring scale
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Tasks 3C.3, 3C.4, 3C.5)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { 
  PageHeader, 
  Card, 
  LoadingSpinner, 
  Toast 
} from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import { 
  StakeholderAreasManager, 
  EvaluationCategoriesManager,
  ScoringScaleManager,
  ProjectDetailsManager
} from '../../components/evaluator/settings';
import { 
  stakeholderAreasService, 
  evaluationCategoriesService 
} from '../../services/evaluator';
import { supabase } from '../../lib/supabase';

import './EvaluationSettings.css';


export default function EvaluationSettings() {
  const navigate = useNavigate();
  const { currentEvaluation, evaluationId, isLoading: evaluationLoading } = useEvaluation();
  const { canEditSettings } = useEvaluatorPermissions();

  // State
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scoringScales, setScoringScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!evaluationId) return;

    setIsLoading(true);
    try {
      const [areasData, categoriesData, scalesData] = await Promise.all([
        stakeholderAreasService.getAllWithCounts(evaluationId),
        evaluationCategoriesService.getAllWithCounts(evaluationId),
        supabase
          .from('scoring_scales')
          .select('*')
          .eq('evaluation_project_id', evaluationId)
          .order('value', { ascending: true })
          .then(({ data }) => data || [])
      ]);

      setStakeholderAreas(areasData);
      setCategories(categoriesData);
      setScoringScales(scalesData);
    } catch (err) {
      console.error('Failed to load settings data:', err);
      setToast({ type: 'error', message: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Stakeholder Areas handlers
  const handleSaveStakeholderArea = useCallback(async (areaData) => {
    if (areaData.id) {
      // Update
      await stakeholderAreasService.update(areaData.id, {
        name: areaData.name,
        description: areaData.description,
        color: areaData.color
      });
    } else {
      // Create
      await stakeholderAreasService.createWithSortOrder({
        evaluation_project_id: evaluationId,
        name: areaData.name,
        description: areaData.description,
        color: areaData.color
      });
    }
    await loadData();
  }, [evaluationId, loadData]);

  const handleDeleteStakeholderArea = useCallback(async (areaId) => {
    await stakeholderAreasService.deleteWithValidation(areaId, null);
    await loadData();
  }, [loadData]);

  // Categories handlers
  const handleSaveCategory = useCallback(async (categoryData) => {
    if (categoryData.id) {
      // Update
      await evaluationCategoriesService.update(categoryData.id, {
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        weight: categoryData.weight
      });
    } else {
      // Create
      await evaluationCategoriesService.createWithSortOrder({
        evaluation_project_id: evaluationId,
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        weight: categoryData.weight
      });
    }
    await loadData();
  }, [evaluationId, loadData]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    await evaluationCategoriesService.deleteWithValidation(categoryId, null);
    await loadData();
  }, [loadData]);

  const handleUpdateCategoryWeights = useCallback(async (updates) => {
    await evaluationCategoriesService.updateWeights(updates, true);
    await loadData();
  }, [loadData]);

  const handleDistributeCategoryWeights = useCallback(async () => {
    await evaluationCategoriesService.distributeWeightsEvenly(evaluationId);
    await loadData();
  }, [evaluationId, loadData]);


  // Scoring Scale handler
  const handleSaveScoringScales = useCallback(async (scales) => {
    // Delete existing scales
    await supabase
      .from('scoring_scales')
      .delete()
      .eq('evaluation_project_id', evaluationId);

    // Insert new scales
    const { error } = await supabase
      .from('scoring_scales')
      .insert(scales);

    if (error) throw error;
    await loadData();
  }, [evaluationId, loadData]);

  // Project Details handler
  const handleSaveProjectDetails = useCallback(async (details) => {
    const { error } = await supabase
      .from('evaluation_projects')
      .update(details)
      .eq('id', evaluationId);

    if (error) throw error;
    
    // Refresh the evaluation in context
    setToast({ type: 'success', message: 'Project details saved successfully' });
    // Force reload the page data to reflect changes
    window.location.reload();
  }, [evaluationId]);

  // Loading state
  if (evaluationLoading || isLoading) {
    return <LoadingSpinner message="Loading settings..." fullPage />;
  }

  // No evaluation selected
  if (!currentEvaluation) {
    return (
      <div className="evaluation-settings">
        <PageHeader
          title="Settings"
          subtitle="Select an evaluation project to configure"
        />
        <div className="empty-state">
          <Settings size={48} />
          <p>Please select an evaluation project to configure its settings.</p>
        </div>
      </div>
    );
  }

  // No permission
  if (!canEditSettings) {
    return (
      <div className="evaluation-settings">
        <PageHeader
          title="Settings"
          subtitle={currentEvaluation.name}
          actions={<EvaluationSwitcher />}
        />
        <Card className="no-permission-card">
          <AlertCircle size={24} />
          <p>You don't have permission to edit settings for this evaluation.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="evaluation-settings">
      <PageHeader
        title="Settings"
        subtitle={currentEvaluation.name}
        actions={
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/evaluator/dashboard')}
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
            <EvaluationSwitcher />
          </div>
        }
      />


      <div className="settings-grid">
        {/* Project Details */}
        <ProjectDetailsManager
          evaluation={currentEvaluation}
          onSave={handleSaveProjectDetails}
          isLoading={isLoading}
        />

        {/* Stakeholder Areas */}
        <StakeholderAreasManager
          areas={stakeholderAreas}
          evaluationProjectId={evaluationId}
          onSave={handleSaveStakeholderArea}
          onDelete={handleDeleteStakeholderArea}
          isLoading={isLoading}
        />

        {/* Evaluation Categories */}
        <EvaluationCategoriesManager
          categories={categories}
          evaluationProjectId={evaluationId}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onUpdateWeights={handleUpdateCategoryWeights}
          onDistributeWeights={handleDistributeCategoryWeights}
          isLoading={isLoading}
        />

        {/* Scoring Scale */}
        <ScoringScaleManager
          scales={scoringScales}
          evaluationProjectId={evaluationId}
          onSave={handleSaveScoringScales}
          isLoading={isLoading}
        />
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
