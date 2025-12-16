/**
 * Variation Form Page - Multi-Step Wizard
 * 
 * Create or edit variations with:
 * - Step 1: Basic Information (title, type, priority, date_required, benefits)
 * - Step 2: Affected Milestones
 * - Step 3: Impact Details
 * - Step 4: Assumptions & Risks
 * - Step 5: Costs & Implementation
 * - Step 6: Deliverable Due Date Updates
 * - Step 7: Review & Submit
 * 
 * @version 1.2
 * @updated 9 December 2025 - Added CR document fields (Phase 4)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  variationsService,
  milestonesService,
  deliverablesService,
  VARIATION_STATUS,
  VARIATION_TYPE
} from '../services';
import { TYPE_CONFIG } from '../services/variations.service';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Check,
  AlertTriangle,
  FileText,
  Milestone,
  PoundSterling,
  Clock,
  Package,
  CheckCircle2,
  Trash2,
  Info,
  CalendarDays,
  Flag,
  Target,
  ShieldAlert,
  Receipt
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '../components/common';
import { formatDate, formatCurrency } from '../lib/formatters';
import './VariationForm.css';

const STEPS = [
  { id: 1, name: 'Basic Info', icon: FileText },
  { id: 2, name: 'Milestones', icon: Milestone },
  { id: 3, name: 'Impacts', icon: PoundSterling },
  { id: 4, name: 'Assumptions', icon: Target },
  { id: 5, name: 'Costs', icon: Receipt },
  { id: 6, name: 'Deliverables', icon: Package },
  { id: 7, name: 'Review', icon: CheckCircle2 }
];

const TYPE_OPTIONS = [
  { value: VARIATION_TYPE.SCOPE_EXTENSION, label: 'Scope Extension', desc: 'Additional work beyond original scope' },
  { value: VARIATION_TYPE.SCOPE_REDUCTION, label: 'Scope Reduction', desc: 'Removal of work from original scope' },
  { value: VARIATION_TYPE.TIME_EXTENSION, label: 'Time Extension', desc: 'Schedule adjustment without scope change' },
  { value: VARIATION_TYPE.COST_ADJUSTMENT, label: 'Cost Adjustment', desc: 'Price change without scope/time change' },
  { value: VARIATION_TYPE.COMBINED, label: 'Combined', desc: 'Multiple impact types' }
];

const PRIORITY_OPTIONS = [
  { value: 'H', label: 'High', desc: 'Critical - requires immediate attention', color: '#dc2626' },
  { value: 'M', label: 'Medium', desc: 'Important - standard processing', color: '#f59e0b' },
  { value: 'L', label: 'Low', desc: 'Minor - can be addressed as time permits', color: '#22c55e' }
];

export default function VariationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { canCreateVariation } = usePermissions();

  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    variation_type: '',
    description: '',
    reason: '',
    contract_terms_reference: '',
    priority: '',
    date_required: '',
    benefits: '',
    initiator_name: '',
    initiator_name: '',
    // Step 2: Milestones
    affected_milestones: [],
    // Step 4: Assumptions & Risks
    assumptions: '',
    risks: '',
    // Step 5: Costs & Implementation
    cost_summary: '',
    impact_on_charges: '',
    impact_on_service_levels: '',
    implementation_timetable: '',
    // Step 6: Deliverables
    deliverable_date_updates: [],
    // Step 7: Review
    impact_summary: ''
  });

  const [variation, setVariation] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, id]);

  async function loadData() {
    try {
      // Load milestones
      const ms = await milestonesService.getAll(projectId, {
        orderBy: { column: 'milestone_ref', ascending: true }
      });
      setMilestones(ms || []);

      // Load deliverables
      const dels = await deliverablesService.getAll(projectId, {
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      setDeliverables(dels || []);

      if (id) {
        const v = await variationsService.getWithDetails(id);
        if (v) {
          setVariation(v);
          setCurrentStep(v.form_step || 1);
          
          if (v.form_data) {
            setFormData(prev => ({ ...prev, ...v.form_data }));
          } else {
            setFormData({
              title: v.title || '',
              variation_type: v.variation_type || '',
              description: v.description || '',
              reason: v.reason || '',
              contract_terms_reference: v.contract_terms_reference || '',
              priority: v.priority || '',
              date_required: v.date_required || '',
              benefits: v.benefits || '',
              initiator_name: v.initiator_name || '',
              affected_milestones: v.affected_milestones || [],
              assumptions: v.assumptions || '',
              risks: v.risks || '',
              cost_summary: v.cost_summary || '',
              impact_on_charges: v.impact_on_charges || '',
              impact_on_service_levels: v.impact_on_service_levels || '',
              implementation_timetable: v.implementation_timetable || '',
              deliverable_date_updates: [],
              impact_summary: v.impact_summary || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const autoSave = useCallback(async () => {
    if (!variation?.id) return;
    
    setAutoSaveStatus('saving');
    try {
      await variationsService.saveFormProgress(variation.id, formData, currentStep);
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [variation?.id, formData, currentStep]);

  useEffect(() => {
    if (!variation?.id) return;
    
    const timer = setTimeout(() => {
      autoSave();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAutoSaveStatus('unsaved');
  }

  async function goToStep(step) {
    if (variation?.id) {
      await variationsService.saveFormProgress(variation.id, formData, step);
    }
    setCurrentStep(step);
  }

  async function nextStep() {
    if (currentStep < 7) {
      await goToStep(currentStep + 1);
    }
  }

  async function prevStep() {
    if (currentStep > 1) {
      await goToStep(currentStep - 1);
    }
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        return formData.title && formData.variation_type;
      case 2:
        return formData.affected_milestones.length > 0;
      case 3:
        return formData.affected_milestones.every(am => 
          am.new_baseline_cost !== undefined || am.new_baseline_end
        );
      case 4:
        return true; // Assumptions & Risks - optional step
      case 5:
        return true; // Costs & Implementation - optional step
      case 6:
        return true; // Deliverables - optional step
      case 7:
        return formData.impact_summary && formData.impact_summary.trim().length > 0;
      default:
        return true;
    }
  }

  function addAffectedMilestone(milestoneId) {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    if (formData.affected_milestones.some(am => am.milestone_id === milestoneId)) {
      showWarning('Milestone already added');
      return;
    }

    const newAffected = {
      milestone_id: milestoneId,
      milestone: milestone,
      is_new_milestone: false,
      original_baseline_cost: milestone.billable || 0,
      new_baseline_cost: milestone.billable || 0,
      original_baseline_start: milestone.baseline_start_date || milestone.start_date,
      new_baseline_start: milestone.baseline_start_date || milestone.start_date,
      original_baseline_end: milestone.baseline_end_date || milestone.end_date,
      new_baseline_end: milestone.baseline_end_date || milestone.end_date,
      change_rationale: ''
    };

    updateField('affected_milestones', [...formData.affected_milestones, newAffected]);
  }

  function removeAffectedMilestone(index) {
    const removed = formData.affected_milestones[index];
    const updated = [...formData.affected_milestones];
    updated.splice(index, 1);
    updateField('affected_milestones', updated);
    
    // Also remove any deliverable date updates for this milestone
    if (removed?.milestone_id) {
      const filteredDeliverables = formData.deliverable_date_updates.filter(
        d => d.milestone_id !== removed.milestone_id
      );
      updateField('deliverable_date_updates', filteredDeliverables);
    }
  }

  function updateAffectedMilestone(index, field, value) {
    const updated = [...formData.affected_milestones];
    updated[index] = { ...updated[index], [field]: value };
    updateField('affected_milestones', updated);
  }

  // Get deliverables for affected milestones
  function getDeliverablesForAffectedMilestones() {
    const affectedMilestoneIds = formData.affected_milestones.map(am => am.milestone_id);
    return deliverables.filter(d => affectedMilestoneIds.includes(d.milestone_id));
  }

  // Toggle deliverable date update
  function toggleDeliverableDateUpdate(deliverable, milestone, daysDiff) {
    const existing = formData.deliverable_date_updates.find(d => d.deliverable_id === deliverable.id);
    
    if (existing) {
      updateField('deliverable_date_updates', 
        formData.deliverable_date_updates.filter(d => d.deliverable_id !== deliverable.id)
      );
    } else {
      const currentDueDate = deliverable.due_date || milestone.baseline_end_date || milestone.end_date;
      let newDueDate = null;
      
      if (currentDueDate && daysDiff !== 0) {
        const date = new Date(currentDueDate);
        date.setDate(date.getDate() + daysDiff);
        newDueDate = date.toISOString().split('T')[0];
      }
      
      updateField('deliverable_date_updates', [
        ...formData.deliverable_date_updates,
        {
          deliverable_id: deliverable.id,
          deliverable_ref: deliverable.deliverable_ref,
          deliverable_name: deliverable.name,
          milestone_id: milestone.milestone_id,
          original_due_date: currentDueDate,
          new_due_date: newDueDate,
          days_shift: daysDiff
        }
      ]);
    }
  }

  // Select/deselect all deliverables for a milestone
  function toggleAllDeliverablesForMilestone(milestoneId, daysDiff, select) {
    const milestoneDeliverables = deliverables.filter(d => d.milestone_id === milestoneId);
    const milestone = formData.affected_milestones.find(am => am.milestone_id === milestoneId);
    
    if (select) {
      const toAdd = milestoneDeliverables
        .filter(d => !formData.deliverable_date_updates.some(du => du.deliverable_id === d.id))
        .map(d => {
          const currentDueDate = d.due_date || milestone?.original_baseline_end;
          let newDueDate = null;
          
          if (currentDueDate && daysDiff !== 0) {
            const date = new Date(currentDueDate);
            date.setDate(date.getDate() + daysDiff);
            newDueDate = date.toISOString().split('T')[0];
          }
          
          return {
            deliverable_id: d.id,
            deliverable_ref: d.deliverable_ref,
            deliverable_name: d.name,
            milestone_id: milestoneId,
            original_due_date: currentDueDate,
            new_due_date: newDueDate,
            days_shift: daysDiff
          };
        });
      
      updateField('deliverable_date_updates', [...formData.deliverable_date_updates, ...toAdd]);
    } else {
      updateField('deliverable_date_updates', 
        formData.deliverable_date_updates.filter(d => d.milestone_id !== milestoneId)
      );
    }
  }

  function calculateTotalImpacts() {
    let totalCost = 0;
    let totalDays = 0;

    formData.affected_milestones.forEach(am => {
      totalCost += (am.new_baseline_cost || 0) - (am.original_baseline_cost || 0);
      
      if (am.original_baseline_end && am.new_baseline_end) {
        const origEnd = new Date(am.original_baseline_end);
        const newEnd = new Date(am.new_baseline_end);
        totalDays += Math.round((newEnd - origEnd) / (1000 * 60 * 60 * 24));
      }
    });

    return { totalCost, totalDays };
  }

  function getMilestoneDaysDiff(am) {
    if (!am.original_baseline_end || !am.new_baseline_end) return 0;
    const origEnd = new Date(am.original_baseline_end);
    const newEnd = new Date(am.new_baseline_end);
    return Math.round((newEnd - origEnd) / (1000 * 60 * 60 * 24));
  }

  async function saveDraft() {
    setSaving(true);
    try {
      if (variation?.id) {
        await variationsService.update(variation.id, {
          title: formData.title,
          variation_type: formData.variation_type,
          description: formData.description,
          reason: formData.reason,
          contract_terms_reference: formData.contract_terms_reference,
          // New CR document fields
          priority: formData.priority || null,
          date_required: formData.date_required || null,
          benefits: formData.benefits || null,
          initiator_name: formData.initiator_name || null,
          assumptions: formData.assumptions || null,
          risks: formData.risks || null,
          cost_summary: formData.cost_summary || null,
          impact_on_charges: formData.impact_on_charges || null,
          impact_on_service_levels: formData.impact_on_service_levels || null,
          implementation_timetable: formData.implementation_timetable || null,
          form_data: formData,
          form_step: currentStep
        });
        
        showSuccess('Draft saved');
        return variation;
      } else {
        const newVariation = await variationsService.createVariation(projectId, {
          title: formData.title,
          variation_type: formData.variation_type,
          description: formData.description,
          reason: formData.reason,
          contract_terms_reference: formData.contract_terms_reference,
          // New CR document fields
          priority: formData.priority || null,
          date_required: formData.date_required || null,
          benefits: formData.benefits || null,
          initiator_name: formData.initiator_name || null,
          assumptions: formData.assumptions || null,
          risks: formData.risks || null,
          cost_summary: formData.cost_summary || null,
          impact_on_charges: formData.impact_on_charges || null,
          impact_on_service_levels: formData.impact_on_service_levels || null,
          implementation_timetable: formData.implementation_timetable || null,
          form_data: formData,
          form_step: currentStep
        }, user?.id);

        setVariation(newVariation);
        showSuccess('Draft created');
        navigate(`/variations/${newVariation.id}/edit`, { replace: true });
        return newVariation;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showError('Failed to save draft');
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function submitForApproval() {
    // Validate all steps
    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) {
        if (step === 7) {
          showWarning('Please provide an Impact Summary before submitting');
        } else {
          showWarning(`Please complete Step ${step} before submitting`);
        }
        setCurrentStep(step);
        return;
      }
    }

    setSaving(true);
    try {
      // First ensure we have a saved variation
      let currentVariation = variation;
      if (!currentVariation?.id) {
        currentVariation = await saveDraft();
      } else {
        // Update the draft with latest form data
        await variationsService.update(currentVariation.id, {
          title: formData.title,
          variation_type: formData.variation_type,
          description: formData.description,
          reason: formData.reason,
          contract_terms_reference: formData.contract_terms_reference,
          // New CR document fields
          priority: formData.priority || null,
          date_required: formData.date_required || null,
          benefits: formData.benefits || null,
          initiator_name: formData.initiator_name || null,
          assumptions: formData.assumptions || null,
          risks: formData.risks || null,
          cost_summary: formData.cost_summary || null,
          impact_on_charges: formData.impact_on_charges || null,
          impact_on_service_levels: formData.impact_on_service_levels || null,
          implementation_timetable: formData.implementation_timetable || null,
          form_data: formData,
          form_step: 7
        });
      }

      if (!currentVariation?.id) {
        throw new Error('Failed to create variation');
      }

      // Clear existing affected milestones before re-adding (prevents duplicates)
      await variationsService.clearAffectedMilestones(currentVariation.id);

      // Save affected milestones to variation_milestones table
      for (const am of formData.affected_milestones) {
        await variationsService.addAffectedMilestone(currentVariation.id, {
          milestone_id: am.milestone_id,
          is_new_milestone: am.is_new_milestone || false,
          original_baseline_cost: am.original_baseline_cost,
          new_baseline_cost: am.new_baseline_cost,
          original_baseline_start: am.original_baseline_start,
          new_baseline_start: am.new_baseline_start,
          original_baseline_end: am.original_baseline_end,
          new_baseline_end: am.new_baseline_end,
          change_rationale: am.change_rationale
        });
      }

      // Submit for approval
      await variationsService.submitForApproval(currentVariation.id, formData.impact_summary);
      
      showSuccess('Variation submitted for approval');
      navigate(`/variations/${currentVariation.id}`);
    } catch (error) {
      console.error('Error submitting variation:', error);
      showError('Failed to submit variation: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate('/variations');
  }

  if (loading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

  const { totalCost, totalDays } = calculateTotalImpacts();
  const affectedDeliverables = getDeliverablesForAffectedMilestones();

  return (
    <div className="variation-form-page" data-testid="variation-form-page">
      <header className="vf-header" data-testid="variation-form-header">
        <div className="vf-header-content">
          <div className="vf-header-left">
            <button className="vf-back-btn" onClick={handleBack} data-testid="variation-form-back-button">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1>{isEditing ? 'Edit Variation' : 'Create Variation'}</h1>
              {variation && (
                <span className="vf-header-ref">{variation.variation_ref}</span>
              )}
            </div>
          </div>
          <div className="vf-header-right">
            <span className={`vf-save-status ${autoSaveStatus}`}>
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Draft saved'}
              {autoSaveStatus === 'unsaved' && 'Unsaved changes'}
              {autoSaveStatus === 'error' && 'Save failed'}
            </span>
            <button className="vf-btn vf-btn-secondary" onClick={saveDraft} disabled={saving} data-testid="variation-form-save-draft">
              <Save size={18} />
              Save Draft
            </button>
          </div>
        </div>
      </header>

      <div className="vf-progress" data-testid="variation-form-progress">
        <div className="vf-progress-content">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            
            return (
              <div
                key={step.id}
                className={`vf-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                onClick={() => goToStep(step.id)}
              >
                <div className="vf-step-icon">
                  {isComplete ? <Check size={16} /> : <StepIcon size={16} />}
                </div>
                <span className="vf-step-name">{step.name}</span>
                {index < STEPS.length - 1 && <div className="vf-step-connector" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="vf-content">
        <div className="vf-form">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Basic Information</h2>
                <p className="vf-card-desc">Enter the basic details of this variation request.</p>
                
                <div className="vf-field">
                  <label>Variation Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => updateField('title', e.target.value)}
                    placeholder="e.g., Additional Security Requirements"
                  />
                </div>

                <div className="vf-field">
                  <label>Initiator Name</label>
                  <input
                    type="text"
                    value={formData.initiator_name}
                    onChange={e => updateField('initiator_name', e.target.value)}
                    placeholder="e.g., John Smith"
                  />
                  <span className="vf-field-hint">Person requesting this change</span>
                </div>

                <div className="vf-field">
                  <label>Variation Type *</label>
                  <div className="vf-type-grid">
                    {TYPE_OPTIONS.map(opt => (
                      <div
                        key={opt.value}
                        className={`vf-type-option ${formData.variation_type === opt.value ? 'selected' : ''}`}
                        onClick={() => updateField('variation_type', opt.value)}
                      >
                        <div className="vf-type-radio">
                          {formData.variation_type === opt.value && <Check size={14} />}
                        </div>
                        <div className="vf-type-info">
                          <span className="vf-type-label">{opt.label}</span>
                          <span className="vf-type-desc">{opt.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New: Priority field */}
                <div className="vf-field">
                  <label>
                    <Flag size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Priority
                  </label>
                  <div className="vf-priority-grid">
                    {PRIORITY_OPTIONS.map(opt => (
                      <div
                        key={opt.value}
                        className={`vf-priority-option ${formData.priority === opt.value ? 'selected' : ''}`}
                        onClick={() => updateField('priority', opt.value)}
                        style={{ '--priority-color': opt.color }}
                      >
                        <div className="vf-priority-radio">
                          {formData.priority === opt.value && <Check size={14} />}
                        </div>
                        <div className="vf-priority-info">
                          <span className="vf-priority-label">{opt.label}</span>
                          <span className="vf-priority-desc">{opt.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New: Date Required field */}
                <div className="vf-field">
                  <label>
                    <CalendarDays size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Date Required
                  </label>
                  <input
                    type="date"
                    value={formData.date_required}
                    onChange={e => updateField('date_required', e.target.value)}
                  />
                  <span className="vf-field-hint">When is this change needed by?</span>
                </div>

                <div className="vf-field">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Describe the variation in detail..."
                    rows={4}
                  />
                </div>

                <div className="vf-field">
                  <label>Reason for Change</label>
                  <textarea
                    value={formData.reason}
                    onChange={e => updateField('reason', e.target.value)}
                    placeholder="Why is this variation necessary?"
                    rows={3}
                  />
                </div>

                {/* New: Benefits field */}
                <div className="vf-field">
                  <label>
                    <Target size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Expected Benefits
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={e => updateField('benefits', e.target.value)}
                    placeholder="What benefits will this change deliver?"
                    rows={3}
                  />
                </div>

                <div className="vf-field">
                  <label>Contract Terms Reference</label>
                  <input
                    type="text"
                    value={formData.contract_terms_reference}
                    onChange={e => updateField('contract_terms_reference', e.target.value)}
                    placeholder="e.g., Clause 7.2 - Change Control"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Affected Milestones */}
          {currentStep === 2 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Affected Milestones</h2>
                <p className="vf-card-desc">Select the milestones affected by this variation.</p>

                <div className="vf-milestone-selector">
                  <select
                    className="vf-milestone-select"
                    onChange={e => {
                      if (e.target.value) {
                        addAffectedMilestone(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add milestone...</option>
                    {milestones
                      .filter(m => !formData.affected_milestones.some(am => am.milestone_id === m.id))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.milestone_ref}: {m.name}
                        </option>
                      ))}
                  </select>
                </div>

                {formData.affected_milestones.length === 0 ? (
                  <div className="vf-empty">
                    <Milestone size={32} />
                    <p>No milestones selected</p>
                    <span>Use the dropdown above to add affected milestones</span>
                  </div>
                ) : (
                  <div className="vf-milestone-list">
                    {formData.affected_milestones.map((am, index) => (
                      <div key={index} className="vf-milestone-item">
                        <div className="vf-milestone-info">
                          <span className="vf-milestone-ref">{am.milestone?.milestone_ref}</span>
                          <span className="vf-milestone-name">{am.milestone?.name}</span>
                        </div>
                        <div className="vf-milestone-current">
                          <span>Current: {formatCurrency(am.original_baseline_cost)}</span>
                          <span>End: {formatDate(am.original_baseline_end)}</span>
                        </div>
                        <button
                          className="vf-milestone-remove"
                          onClick={() => removeAffectedMilestone(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Impact Details */}
          {currentStep === 3 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Impact Details</h2>
                <p className="vf-card-desc">Specify the cost and schedule changes for each affected milestone.</p>

                {formData.affected_milestones.length === 0 ? (
                  <div className="vf-empty">
                    <AlertTriangle size={32} />
                    <p>No milestones selected</p>
                    <span>Go back to Step 2 to add affected milestones</span>
                  </div>
                ) : (
                  <div className="vf-impacts-list">
                    {formData.affected_milestones.map((am, index) => (
                      <div key={index} className="vf-impact-item">
                        <div className="vf-impact-header">
                          <span className="vf-impact-ref">{am.milestone?.milestone_ref}</span>
                          <span className="vf-impact-name">{am.milestone?.name}</span>
                        </div>
                        
                        <div className="vf-impact-fields">
                          <div className="vf-impact-field">
                            <label>
                              <PoundSterling size={14} />
                              New Baseline Cost
                            </label>
                            <div className="vf-impact-input-group">
                              <span className="vf-currency">£</span>
                              <input
                                type="number"
                                value={am.new_baseline_cost || ''}
                                onChange={e => updateAffectedMilestone(index, 'new_baseline_cost', parseFloat(e.target.value) || 0)}
                              />
                              <span className="vf-original">
                                Was: {formatCurrency(am.original_baseline_cost)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="vf-impact-field">
                            <label>
                              <Clock size={14} />
                              New End Date
                            </label>
                            <div className="vf-impact-input-group">
                              <input
                                type="date"
                                value={am.new_baseline_end || ''}
                                onChange={e => updateAffectedMilestone(index, 'new_baseline_end', e.target.value)}
                              />
                              <span className="vf-original">
                                Was: {formatDate(am.original_baseline_end)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="vf-impact-rationale">
                          <label>Rationale for this milestone</label>
                          <textarea
                            value={am.change_rationale || ''}
                            onChange={e => updateAffectedMilestone(index, 'change_rationale', e.target.value)}
                            placeholder="Why is this milestone affected?"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="vf-impact-summary">
                  <h3>Total Impact</h3>
                  <div className="vf-impact-totals">
                    <div className={`vf-impact-total ${totalCost >= 0 ? 'positive' : 'negative'}`}>
                      <PoundSterling size={20} />
                      <span className="vf-total-value">
                        {totalCost > 0 ? '+' : ''}{formatCurrency(totalCost)}
                      </span>
                      <span className="vf-total-label">Cost</span>
                    </div>
                    <div className={`vf-impact-total ${totalDays >= 0 ? 'positive' : 'negative'}`}>
                      <Clock size={20} />
                      <span className="vf-total-value">
                        {totalDays > 0 ? '+' : ''}{totalDays} days
                      </span>
                      <span className="vf-total-label">Schedule</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Assumptions & Risks */}
          {currentStep === 4 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Assumptions & Risks</h2>
                <p className="vf-card-desc">Document any assumptions and identify potential risks associated with this change.</p>

                <div className="vf-field">
                  <label>
                    <Info size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Key Assumptions
                  </label>
                  <textarea
                    value={formData.assumptions}
                    onChange={e => updateField('assumptions', e.target.value)}
                    placeholder="List the key assumptions this change request is based on...&#10;&#10;For example:&#10;- Existing infrastructure can support the new requirements&#10;- Required resources will be available during implementation&#10;- Third-party dependencies will be delivered on schedule"
                    rows={6}
                  />
                  <span className="vf-field-hint">What conditions must be true for this change to succeed?</span>
                </div>

                <div className="vf-field">
                  <label>
                    <ShieldAlert size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Identified Risks
                  </label>
                  <textarea
                    value={formData.risks}
                    onChange={e => updateField('risks', e.target.value)}
                    placeholder="Identify potential risks and their mitigation strategies...&#10;&#10;For example:&#10;- Risk: Resource availability may be limited&#10;  Mitigation: Identify backup resources in advance&#10;- Risk: Integration complexity may cause delays&#10;  Mitigation: Allow buffer time in schedule"
                    rows={6}
                  />
                  <span className="vf-field-hint">What could go wrong and how will you address it?</span>
                </div>

                <div className="vf-info-box">
                  <Info size={18} />
                  <div>
                    <strong>Why document assumptions and risks?</strong>
                    <p>Clearly documented assumptions help stakeholders understand the basis for estimates. 
                       Identifying risks upfront enables proactive mitigation planning and sets realistic expectations.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Costs & Implementation */}
          {currentStep === 5 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Costs & Implementation</h2>
                <p className="vf-card-desc">Provide details on costs, billing impact, service levels, and implementation timeline.</p>

                <div className="vf-field">
                  <label>
                    <Receipt size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Cost Summary
                  </label>
                  <textarea
                    value={formData.cost_summary}
                    onChange={e => updateField('cost_summary', e.target.value)}
                    placeholder="Provide a breakdown of the costs...&#10;&#10;For example:&#10;- Labour: 40 hours @ £125/hr = £5,000&#10;- Materials/Equipment: £2,500&#10;- Third-party services: £1,500&#10;- Contingency (10%): £900&#10;- Total: £9,900"
                    rows={6}
                  />
                  <span className="vf-field-hint">Break down the cost components of this change</span>
                </div>

                <div className="vf-field">
                  <label>
                    <PoundSterling size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Impact on Charges
                  </label>
                  <textarea
                    value={formData.impact_on_charges}
                    onChange={e => updateField('impact_on_charges', e.target.value)}
                    placeholder="Describe how this change affects billing...&#10;&#10;For example:&#10;- One-time implementation charge of £9,900&#10;- No impact on recurring monthly charges&#10;- Or: Monthly service fee will increase by £500 from effective date"
                    rows={4}
                  />
                  <span className="vf-field-hint">How will this change affect the client's billing?</span>
                </div>

                <div className="vf-field">
                  <label>
                    <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Impact on Service Levels
                  </label>
                  <textarea
                    value={formData.impact_on_service_levels}
                    onChange={e => updateField('impact_on_service_levels', e.target.value)}
                    placeholder="Describe any impact on SLAs...&#10;&#10;For example:&#10;- No impact on existing SLAs&#10;- Or: Response time SLA will be temporarily relaxed during migration window&#10;- Or: New availability target of 99.9% will apply to additional component"
                    rows={4}
                  />
                  <span className="vf-field-hint">Will this change affect any Service Level Agreements?</span>
                </div>

                <div className="vf-field">
                  <label>
                    <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Implementation Timetable
                  </label>
                  <textarea
                    value={formData.implementation_timetable}
                    onChange={e => updateField('implementation_timetable', e.target.value)}
                    placeholder="Outline the implementation plan and timeline...&#10;&#10;For example:&#10;Week 1-2: Design and planning&#10;Week 3-4: Development and configuration&#10;Week 5: Testing and UAT&#10;Week 6: Deployment and go-live&#10;Week 7: Post-implementation support"
                    rows={6}
                  />
                  <span className="vf-field-hint">What is the planned approach and schedule for implementation?</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Deliverable Due Date Updates */}
          {currentStep === 6 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Deliverable Due Dates</h2>
                <p className="vf-card-desc">
                  When milestone dates change, you may want to update the due dates of linked deliverables.
                  Select which deliverables should have their due dates adjusted.
                </p>

                {affectedDeliverables.length === 0 ? (
                  <div className="vf-empty">
                    <Package size={32} />
                    <p>No deliverables linked to affected milestones</p>
                    <span>This step is optional - proceed to Review</span>
                  </div>
                ) : (
                  <>
                    {formData.affected_milestones.map((am, amIndex) => {
                      const milestoneDeliverables = deliverables.filter(d => d.milestone_id === am.milestone_id);
                      const daysDiff = getMilestoneDaysDiff(am);
                      
                      if (milestoneDeliverables.length === 0) return null;
                      
                      const allSelected = milestoneDeliverables.every(d => 
                        formData.deliverable_date_updates.some(du => du.deliverable_id === d.id)
                      );

                      return (
                        <div key={amIndex} className="vf-deliverable-group">
                          <div className="vf-deliverable-group-header">
                            <div className="vf-deliverable-group-info">
                              <span className="vf-deliverable-group-ref">{am.milestone?.milestone_ref}</span>
                              <span className="vf-deliverable-group-name">{am.milestone?.name}</span>
                              {daysDiff !== 0 && (
                                <span className={`vf-deliverable-group-shift ${daysDiff > 0 ? 'positive' : 'negative'}`}>
                                  {daysDiff > 0 ? '+' : ''}{daysDiff} days
                                </span>
                              )}
                            </div>
                            {daysDiff !== 0 && (
                              <button
                                className={`vf-select-all-btn ${allSelected ? 'selected' : ''}`}
                                onClick={() => toggleAllDeliverablesForMilestone(am.milestone_id, daysDiff, !allSelected)}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>

                          {daysDiff === 0 ? (
                            <div className="vf-deliverable-no-shift">
                              <Info size={16} />
                              <span>No date change for this milestone - deliverable dates will remain unchanged</span>
                            </div>
                          ) : (
                            <div className="vf-deliverable-list">
                              {milestoneDeliverables.map(d => {
                                const isSelected = formData.deliverable_date_updates.some(du => du.deliverable_id === d.id);
                                const currentDueDate = d.due_date || am.original_baseline_end;
                                let newDueDate = null;
                                
                                if (currentDueDate) {
                                  const date = new Date(currentDueDate);
                                  date.setDate(date.getDate() + daysDiff);
                                  newDueDate = date.toISOString().split('T')[0];
                                }
                                
                                return (
                                  <div 
                                    key={d.id} 
                                    className={`vf-deliverable-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleDeliverableDateUpdate(d, am, daysDiff)}
                                  >
                                    <div className="vf-deliverable-checkbox">
                                      {isSelected && <Check size={14} />}
                                    </div>
                                    <div className="vf-deliverable-info">
                                      <span className="vf-deliverable-ref">{d.deliverable_ref}</span>
                                      <span className="vf-deliverable-name">{d.name}</span>
                                    </div>
                                    <div className="vf-deliverable-dates">
                                      <span className="vf-deliverable-current">
                                        {formatDate(currentDueDate) || 'No date'}
                                      </span>
                                      <ArrowRight size={14} />
                                      <span className="vf-deliverable-new">
                                        {formatDate(newDueDate) || 'No date'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {formData.deliverable_date_updates.length > 0 && (
                      <div className="vf-deliverable-summary">
                        <CalendarDays size={18} />
                        <span>
                          <strong>{formData.deliverable_date_updates.length}</strong> deliverable{formData.deliverable_date_updates.length !== 1 ? 's' : ''} will have due dates updated when this variation is applied
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Review & Submit */}
          {currentStep === 7 && (
            <div className="vf-step-content">
              <div className="vf-card">
                <h2>Review & Submit</h2>
                <p className="vf-card-desc">Review your variation and add a summary before submitting.</p>

                <div className="vf-review-section">
                  <h3>Basic Information</h3>
                  <div className="vf-review-row">
                    <span className="vf-review-label">Title</span>
                    <span className="vf-review-value">{formData.title || '-'}</span>
                  </div>
                  {formData.initiator_name && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Initiator</span>
                      <span className="vf-review-value">{formData.initiator_name}</span>
                    </div>
                  )}
                  <div className="vf-review-row">
                    <span className="vf-review-label">Type</span>
                    <span className="vf-review-value">
                      {TYPE_OPTIONS.find(t => t.value === formData.variation_type)?.label || '-'}
                    </span>
                  </div>
                  {formData.priority && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Priority</span>
                      <span className="vf-review-value">
                        <span className={`vf-priority-badge priority-${formData.priority.toLowerCase()}`}>
                          {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label || formData.priority}
                        </span>
                      </span>
                    </div>
                  )}
                  {formData.date_required && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Date Required</span>
                      <span className="vf-review-value">{formatDate(formData.date_required)}</span>
                    </div>
                  )}
                  {formData.description && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Description</span>
                      <span className="vf-review-value">{formData.description}</span>
                    </div>
                  )}
                  {formData.reason && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Reason</span>
                      <span className="vf-review-value">{formData.reason}</span>
                    </div>
                  )}
                  {formData.benefits && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Expected Benefits</span>
                      <span className="vf-review-value vf-review-multiline">{formData.benefits}</span>
                    </div>
                  )}
                  {formData.contract_terms_reference && (
                    <div className="vf-review-row">
                      <span className="vf-review-label">Contract Reference</span>
                      <span className="vf-review-value">{formData.contract_terms_reference}</span>
                    </div>
                  )}
                </div>

                <div className="vf-review-section">
                  <h3>Affected Milestones ({formData.affected_milestones.length})</h3>
                  {formData.affected_milestones.map((am, index) => (
                    <div key={index} className="vf-review-milestone">
                      <span className="vf-review-ms-ref">{am.milestone?.milestone_ref}</span>
                      <span className="vf-review-ms-name">{am.milestone?.name}</span>
                      <div className="vf-review-ms-changes">
                        {am.original_baseline_cost !== am.new_baseline_cost && (
                          <span>
                            Cost: {formatCurrency(am.original_baseline_cost)} → {formatCurrency(am.new_baseline_cost)}
                          </span>
                        )}
                        {am.original_baseline_end !== am.new_baseline_end && (
                          <span>
                            End: {formatDate(am.original_baseline_end)} → {formatDate(am.new_baseline_end)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Assumptions & Risks Section */}
                {(formData.assumptions || formData.risks) && (
                  <div className="vf-review-section">
                    <h3>Assumptions & Risks</h3>
                    {formData.assumptions && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Assumptions</span>
                        <span className="vf-review-value vf-review-multiline">{formData.assumptions}</span>
                      </div>
                    )}
                    {formData.risks && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Risks</span>
                        <span className="vf-review-value vf-review-multiline">{formData.risks}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Costs & Implementation Section */}
                {(formData.cost_summary || formData.impact_on_charges || formData.impact_on_service_levels || formData.implementation_timetable) && (
                  <div className="vf-review-section">
                    <h3>Costs & Implementation</h3>
                    {formData.cost_summary && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Cost Summary</span>
                        <span className="vf-review-value vf-review-multiline">{formData.cost_summary}</span>
                      </div>
                    )}
                    {formData.impact_on_charges && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Impact on Charges</span>
                        <span className="vf-review-value vf-review-multiline">{formData.impact_on_charges}</span>
                      </div>
                    )}
                    {formData.impact_on_service_levels && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Impact on Service Levels</span>
                        <span className="vf-review-value vf-review-multiline">{formData.impact_on_service_levels}</span>
                      </div>
                    )}
                    {formData.implementation_timetable && (
                      <div className="vf-review-row">
                        <span className="vf-review-label">Implementation Timetable</span>
                        <span className="vf-review-value vf-review-multiline">{formData.implementation_timetable}</span>
                      </div>
                    )}
                  </div>
                )}

                {formData.deliverable_date_updates.length > 0 && (
                  <div className="vf-review-section">
                    <h3>Deliverable Date Updates ({formData.deliverable_date_updates.length})</h3>
                    {formData.deliverable_date_updates.map((du, index) => (
                      <div key={index} className="vf-review-deliverable">
                        <span className="vf-review-del-ref">{du.deliverable_ref}</span>
                        <span className="vf-review-del-name">{du.deliverable_name}</span>
                        <span className="vf-review-del-dates">
                          {formatDate(du.original_due_date)} → {formatDate(du.new_due_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="vf-review-section">
                  <h3>Total Impact</h3>
                  <div className="vf-review-impacts">
                    <div className={`vf-review-impact ${totalCost >= 0 ? 'positive' : 'negative'}`}>
                      <span className="vf-review-impact-label">Cost</span>
                      <span className="vf-review-impact-value">
                        {totalCost > 0 ? '+' : ''}{formatCurrency(totalCost)}
                      </span>
                    </div>
                    <div className={`vf-review-impact ${totalDays >= 0 ? 'positive' : 'negative'}`}>
                      <span className="vf-review-impact-label">Schedule</span>
                      <span className="vf-review-impact-value">
                        {totalDays > 0 ? '+' : ''}{totalDays} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="vf-field">
                  <label>Impact Summary *</label>
                  <textarea
                    value={formData.impact_summary}
                    onChange={e => updateField('impact_summary', e.target.value)}
                    placeholder="Provide a summary of the overall impact of this variation..."
                    rows={4}
                  />
                  <span className="vf-field-hint">
                    This summary will appear on the variation certificate
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="vf-footer">
          <div className="vf-footer-content">
            <button
              className="vf-btn vf-btn-secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={18} />
              Previous
            </button>
            
            <div className="vf-footer-right">
              {currentStep < 7 ? (
                <button
              className="vf-btn vf-btn-primary"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              data-testid="variation-form-next-button"
            >
                  Next
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  className="vf-btn vf-btn-submit"
                  onClick={submitForApproval}
                  disabled={saving || !formData.impact_summary}
                  data-testid="variation-form-submit-button"
                >
                  <Send size={18} />
                  Submit for Approval
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
