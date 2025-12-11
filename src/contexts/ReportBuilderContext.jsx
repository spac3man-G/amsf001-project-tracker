/**
 * Report Builder Context
 * 
 * Provides state management for the Report Builder Wizard.
 * Uses useReducer for complex state updates with action creators.
 * 
 * Features:
 * - Multi-step wizard navigation
 * - Template selection and customization
 * - Section management (add, remove, reorder, configure)
 * - Report parameters configuration
 * - Preview state management
 * - AI assistant panel state
 * - Unsaved changes tracking
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 5
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo,
  useEffect
} from 'react';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';
import { 
  createSectionInstance, 
  getSectionTypeConfig,
  validateSectionConfig 
} from '../lib/reportSectionTypes';
import { REPORTING_PERIOD } from '../services/reportTemplates.service';

// ============================================
// CONSTANTS
// ============================================

// Wizard steps
export const WIZARD_STEPS = {
  TEMPLATE_SELECTION: 1,
  PARAMETERS: 2,
  SECTION_BUILDER: 3,
  PREVIEW_GENERATE: 4
};

export const WIZARD_STEP_CONFIG = {
  [WIZARD_STEPS.TEMPLATE_SELECTION]: {
    label: 'Select Template',
    description: 'Choose a template or start from scratch'
  },
  [WIZARD_STEPS.PARAMETERS]: {
    label: 'Configure',
    description: 'Set report name and parameters'
  },
  [WIZARD_STEPS.SECTION_BUILDER]: {
    label: 'Build Report',
    description: 'Add and configure sections'
  },
  [WIZARD_STEPS.PREVIEW_GENERATE]: {
    label: 'Preview & Generate',
    description: 'Review and generate your report'
  }
};

// Action types
const ACTION_TYPES = {
  // Navigation
  SET_STEP: 'SET_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  
  // Template
  SELECT_TEMPLATE: 'SELECT_TEMPLATE',
  CLEAR_TEMPLATE: 'CLEAR_TEMPLATE',
  
  // Report config
  SET_REPORT_NAME: 'SET_REPORT_NAME',
  SET_PARAMETERS: 'SET_PARAMETERS',
  UPDATE_PARAMETER: 'UPDATE_PARAMETER',
  
  // Sections
  ADD_SECTION: 'ADD_SECTION',
  REMOVE_SECTION: 'REMOVE_SECTION',
  UPDATE_SECTION: 'UPDATE_SECTION',
  REORDER_SECTIONS: 'REORDER_SECTIONS',
  CLEAR_SECTIONS: 'CLEAR_SECTIONS',
  SET_SECTIONS: 'SET_SECTIONS',
  
  // Preview
  SET_PREVIEW: 'SET_PREVIEW',
  CLEAR_PREVIEW: 'CLEAR_PREVIEW',
  SET_GENERATING: 'SET_GENERATING',
  SET_PREVIEW_ERROR: 'SET_PREVIEW_ERROR',
  
  // AI Assistant
  TOGGLE_AI_PANEL: 'TOGGLE_AI_PANEL',
  SET_AI_PANEL_OPEN: 'SET_AI_PANEL_OPEN',
  ADD_AI_MESSAGE: 'ADD_AI_MESSAGE',
  CLEAR_AI_MESSAGES: 'CLEAR_AI_MESSAGES',
  SET_AI_LOADING: 'SET_AI_LOADING',
  
  // General
  SET_DIRTY: 'SET_DIRTY',
  RESET_WIZARD: 'RESET_WIZARD',
  LOAD_SAVED_STATE: 'LOAD_SAVED_STATE'
};

// ============================================
// INITIAL STATE
// ============================================

const getInitialState = () => ({
  // Navigation
  currentStep: WIZARD_STEPS.TEMPLATE_SELECTION,
  
  // Template
  selectedTemplate: null,
  isCustom: false,
  
  // Report configuration
  reportName: '',
  reportType: 'custom',
  parameters: {
    reportingPeriod: REPORTING_PERIOD.LAST_MONTH,
    customStartDate: null,
    customEndDate: null,
    includeCoverPage: true,
    includeTableOfContents: false
  },
  
  // Sections
  sections: [],
  
  // Preview
  previewHtml: null,
  previewError: null,
  isGenerating: false,
  lastPreviewTime: null,
  
  // AI Assistant
  aiPanelOpen: false,
  aiMessages: [],
  aiLoading: false,
  
  // State tracking
  isDirty: false,
  savedTemplateId: null
});

// ============================================
// REDUCER
// ============================================

function reportBuilderReducer(state, action) {
  switch (action.type) {
    // ─────────────────────────────────────────
    // Navigation
    // ─────────────────────────────────────────
    case ACTION_TYPES.SET_STEP:
      return {
        ...state,
        currentStep: action.payload
      };
      
    case ACTION_TYPES.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, WIZARD_STEPS.PREVIEW_GENERATE)
      };
      
    case ACTION_TYPES.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, WIZARD_STEPS.TEMPLATE_SELECTION)
      };
    
    // ─────────────────────────────────────────
    // Template Selection
    // ─────────────────────────────────────────
    case ACTION_TYPES.SELECT_TEMPLATE: {
      const { template, isCustom } = action.payload;
      const sections = template?.template_definition?.sections || [];
      const parameters = template?.default_parameters || state.parameters;
      
      return {
        ...state,
        selectedTemplate: template,
        isCustom: isCustom || false,
        reportName: isCustom ? 'Custom Report' : (template?.name || 'New Report'),
        reportType: template?.report_type || 'custom',
        sections: sections.map(s => ({
          ...s,
          id: s.id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        parameters: {
          ...state.parameters,
          ...parameters
        },
        isDirty: false,
        previewHtml: null,
        previewError: null
      };
    }
    
    case ACTION_TYPES.CLEAR_TEMPLATE:
      return {
        ...state,
        selectedTemplate: null,
        isCustom: true,
        sections: [],
        isDirty: false
      };
    
    // ─────────────────────────────────────────
    // Report Configuration
    // ─────────────────────────────────────────
    case ACTION_TYPES.SET_REPORT_NAME:
      return {
        ...state,
        reportName: action.payload,
        isDirty: true
      };
      
    case ACTION_TYPES.SET_PARAMETERS:
      return {
        ...state,
        parameters: {
          ...state.parameters,
          ...action.payload
        },
        isDirty: true,
        previewHtml: null // Clear preview when parameters change
      };
      
    case ACTION_TYPES.UPDATE_PARAMETER:
      return {
        ...state,
        parameters: {
          ...state.parameters,
          [action.payload.key]: action.payload.value
        },
        isDirty: true,
        previewHtml: null
      };
    
    // ─────────────────────────────────────────
    // Section Management
    // ─────────────────────────────────────────
    case ACTION_TYPES.ADD_SECTION: {
      const newSection = action.payload;
      return {
        ...state,
        sections: [...state.sections, newSection],
        isDirty: true,
        previewHtml: null
      };
    }
    
    case ACTION_TYPES.REMOVE_SECTION: {
      const sectionId = action.payload;
      return {
        ...state,
        sections: state.sections.filter(s => s.id !== sectionId),
        isDirty: true,
        previewHtml: null
      };
    }
    
    case ACTION_TYPES.UPDATE_SECTION: {
      const { sectionId, updates } = action.payload;
      return {
        ...state,
        sections: state.sections.map(s => 
          s.id === sectionId 
            ? { ...s, ...updates, config: { ...s.config, ...updates.config } }
            : s
        ),
        isDirty: true,
        previewHtml: null
      };
    }
    
    case ACTION_TYPES.REORDER_SECTIONS: {
      const { fromIndex, toIndex } = action.payload;
      const newSections = [...state.sections];
      const [removed] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, removed);
      
      return {
        ...state,
        sections: newSections,
        isDirty: true,
        previewHtml: null
      };
    }
    
    case ACTION_TYPES.CLEAR_SECTIONS:
      return {
        ...state,
        sections: [],
        isDirty: true,
        previewHtml: null
      };
      
    case ACTION_TYPES.SET_SECTIONS:
      return {
        ...state,
        sections: action.payload,
        isDirty: true,
        previewHtml: null
      };
    
    // ─────────────────────────────────────────
    // Preview
    // ─────────────────────────────────────────
    case ACTION_TYPES.SET_PREVIEW:
      return {
        ...state,
        previewHtml: action.payload.html,
        previewError: null,
        lastPreviewTime: new Date().toISOString(),
        isGenerating: false
      };
      
    case ACTION_TYPES.CLEAR_PREVIEW:
      return {
        ...state,
        previewHtml: null,
        previewError: null,
        lastPreviewTime: null
      };
      
    case ACTION_TYPES.SET_GENERATING:
      return {
        ...state,
        isGenerating: action.payload,
        previewError: action.payload ? null : state.previewError
      };
      
    case ACTION_TYPES.SET_PREVIEW_ERROR:
      return {
        ...state,
        previewError: action.payload,
        isGenerating: false
      };
    
    // ─────────────────────────────────────────
    // AI Assistant
    // ─────────────────────────────────────────
    case ACTION_TYPES.TOGGLE_AI_PANEL:
      return {
        ...state,
        aiPanelOpen: !state.aiPanelOpen
      };
      
    case ACTION_TYPES.SET_AI_PANEL_OPEN:
      return {
        ...state,
        aiPanelOpen: action.payload
      };
      
    case ACTION_TYPES.ADD_AI_MESSAGE:
      return {
        ...state,
        aiMessages: [...state.aiMessages, {
          ...action.payload,
          id: `msg_${Date.now()}`,
          timestamp: new Date().toISOString()
        }]
      };
      
    case ACTION_TYPES.CLEAR_AI_MESSAGES:
      return {
        ...state,
        aiMessages: []
      };
      
    case ACTION_TYPES.SET_AI_LOADING:
      return {
        ...state,
        aiLoading: action.payload
      };
    
    // ─────────────────────────────────────────
    // General
    // ─────────────────────────────────────────
    case ACTION_TYPES.SET_DIRTY:
      return {
        ...state,
        isDirty: action.payload
      };
      
    case ACTION_TYPES.RESET_WIZARD:
      return getInitialState();
      
    case ACTION_TYPES.LOAD_SAVED_STATE:
      return {
        ...state,
        ...action.payload,
        isDirty: false
      };
      
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const ReportBuilderContext = createContext(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function ReportBuilderProvider({ children }) {
  const { projectId, projectName, projectRef } = useProject();
  const { user, profile, role } = useAuth();
  
  const [state, dispatch] = useReducer(reportBuilderReducer, null, getInitialState);
  
  // ─────────────────────────────────────────
  // Navigation Actions
  // ─────────────────────────────────────────
  
  const setStep = useCallback((step) => {
    dispatch({ type: ACTION_TYPES.SET_STEP, payload: step });
  }, []);
  
  const nextStep = useCallback(() => {
    dispatch({ type: ACTION_TYPES.NEXT_STEP });
  }, []);
  
  const prevStep = useCallback(() => {
    dispatch({ type: ACTION_TYPES.PREV_STEP });
  }, []);
  
  const goToStep = useCallback((step) => {
    // Validate step is reachable
    if (step >= WIZARD_STEPS.TEMPLATE_SELECTION && step <= WIZARD_STEPS.PREVIEW_GENERATE) {
      dispatch({ type: ACTION_TYPES.SET_STEP, payload: step });
    }
  }, []);
  
  // ─────────────────────────────────────────
  // Template Actions
  // ─────────────────────────────────────────
  
  const selectTemplate = useCallback((template, isCustom = false) => {
    dispatch({ 
      type: ACTION_TYPES.SELECT_TEMPLATE, 
      payload: { template, isCustom } 
    });
  }, []);
  
  const startFromScratch = useCallback(() => {
    dispatch({ 
      type: ACTION_TYPES.SELECT_TEMPLATE, 
      payload: { template: null, isCustom: true } 
    });
  }, []);
  
  const clearTemplate = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_TEMPLATE });
  }, []);
  
  // ─────────────────────────────────────────
  // Report Configuration Actions
  // ─────────────────────────────────────────
  
  const setReportName = useCallback((name) => {
    dispatch({ type: ACTION_TYPES.SET_REPORT_NAME, payload: name });
  }, []);
  
  const setParameters = useCallback((params) => {
    dispatch({ type: ACTION_TYPES.SET_PARAMETERS, payload: params });
  }, []);
  
  const updateParameter = useCallback((key, value) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_PARAMETER, 
      payload: { key, value } 
    });
  }, []);
  
  // ─────────────────────────────────────────
  // Section Actions
  // ─────────────────────────────────────────
  
  const addSection = useCallback((sectionType, configOverrides = {}) => {
    try {
      const newSection = createSectionInstance(sectionType, configOverrides);
      dispatch({ type: ACTION_TYPES.ADD_SECTION, payload: newSection });
      return newSection;
    } catch (error) {
      console.error('Failed to add section:', error);
      return null;
    }
  }, []);
  
  const addSectionAtIndex = useCallback((sectionType, index, configOverrides = {}) => {
    try {
      const newSection = createSectionInstance(sectionType, configOverrides);
      dispatch({ 
        type: ACTION_TYPES.SET_SECTIONS, 
        payload: [
          ...state.sections.slice(0, index),
          newSection,
          ...state.sections.slice(index)
        ]
      });
      return newSection;
    } catch (error) {
      console.error('Failed to add section at index:', error);
      return null;
    }
  }, [state.sections]);
  
  const removeSection = useCallback((sectionId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_SECTION, payload: sectionId });
  }, []);
  
  const updateSection = useCallback((sectionId, updates) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_SECTION, 
      payload: { sectionId, updates } 
    });
  }, []);
  
  const updateSectionConfig = useCallback((sectionId, configUpdates) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_SECTION, 
      payload: { sectionId, updates: { config: configUpdates } } 
    });
  }, []);
  
  const reorderSections = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    dispatch({ 
      type: ACTION_TYPES.REORDER_SECTIONS, 
      payload: { fromIndex, toIndex } 
    });
  }, []);
  
  const moveSectionUp = useCallback((sectionId) => {
    const index = state.sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      reorderSections(index, index - 1);
    }
  }, [state.sections, reorderSections]);
  
  const moveSectionDown = useCallback((sectionId) => {
    const index = state.sections.findIndex(s => s.id === sectionId);
    if (index < state.sections.length - 1) {
      reorderSections(index, index + 1);
    }
  }, [state.sections, reorderSections]);
  
  const clearSections = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_SECTIONS });
  }, []);
  
  const duplicateSection = useCallback((sectionId) => {
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return null;
    
    const newSection = {
      ...section,
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${section.name} (Copy)`,
      config: { ...section.config }
    };
    
    const index = state.sections.findIndex(s => s.id === sectionId);
    dispatch({ 
      type: ACTION_TYPES.SET_SECTIONS, 
      payload: [
        ...state.sections.slice(0, index + 1),
        newSection,
        ...state.sections.slice(index + 1)
      ]
    });
    
    return newSection;
  }, [state.sections]);
  
  // ─────────────────────────────────────────
  // Preview Actions
  // ─────────────────────────────────────────
  
  const setPreview = useCallback((html) => {
    dispatch({ type: ACTION_TYPES.SET_PREVIEW, payload: { html } });
  }, []);
  
  const clearPreview = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_PREVIEW });
  }, []);
  
  const setGenerating = useCallback((isGenerating) => {
    dispatch({ type: ACTION_TYPES.SET_GENERATING, payload: isGenerating });
  }, []);
  
  const setPreviewError = useCallback((error) => {
    dispatch({ type: ACTION_TYPES.SET_PREVIEW_ERROR, payload: error });
  }, []);
  
  // ─────────────────────────────────────────
  // AI Assistant Actions
  // ─────────────────────────────────────────
  
  const toggleAIPanel = useCallback(() => {
    dispatch({ type: ACTION_TYPES.TOGGLE_AI_PANEL });
  }, []);
  
  const setAIPanelOpen = useCallback((isOpen) => {
    dispatch({ type: ACTION_TYPES.SET_AI_PANEL_OPEN, payload: isOpen });
  }, []);
  
  const addAIMessage = useCallback((message) => {
    dispatch({ type: ACTION_TYPES.ADD_AI_MESSAGE, payload: message });
  }, []);
  
  const clearAIMessages = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_AI_MESSAGES });
  }, []);
  
  const setAILoading = useCallback((isLoading) => {
    dispatch({ type: ACTION_TYPES.SET_AI_LOADING, payload: isLoading });
  }, []);
  
  // ─────────────────────────────────────────
  // General Actions
  // ─────────────────────────────────────────
  
  const setDirty = useCallback((isDirty) => {
    dispatch({ type: ACTION_TYPES.SET_DIRTY, payload: isDirty });
  }, []);
  
  const resetWizard = useCallback(() => {
    dispatch({ type: ACTION_TYPES.RESET_WIZARD });
  }, []);
  
  const loadSavedState = useCallback((savedState) => {
    dispatch({ type: ACTION_TYPES.LOAD_SAVED_STATE, payload: savedState });
  }, []);
  
  // ─────────────────────────────────────────
  // Validation Helpers
  // ─────────────────────────────────────────
  
  const canProceedToStep = useCallback((targetStep) => {
    switch (targetStep) {
      case WIZARD_STEPS.TEMPLATE_SELECTION:
        return true;
        
      case WIZARD_STEPS.PARAMETERS:
        // Must have selected a template or chosen "start from scratch"
        return state.selectedTemplate !== null || state.isCustom;
        
      case WIZARD_STEPS.SECTION_BUILDER:
        // Must have report name
        return state.reportName.trim().length > 0;
        
      case WIZARD_STEPS.PREVIEW_GENERATE:
        // Must have at least one section
        return state.sections.length > 0;
        
      default:
        return false;
    }
  }, [state.selectedTemplate, state.isCustom, state.reportName, state.sections]);
  
  const getStepValidation = useCallback((step) => {
    const validation = { valid: true, errors: [] };
    
    switch (step) {
      case WIZARD_STEPS.TEMPLATE_SELECTION:
        if (!state.selectedTemplate && !state.isCustom) {
          validation.valid = false;
          validation.errors.push('Please select a template or choose to start from scratch');
        }
        break;
        
      case WIZARD_STEPS.PARAMETERS:
        if (!state.reportName.trim()) {
          validation.valid = false;
          validation.errors.push('Report name is required');
        }
        if (state.parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM) {
          if (!state.parameters.customStartDate || !state.parameters.customEndDate) {
            validation.valid = false;
            validation.errors.push('Custom date range requires start and end dates');
          }
        }
        break;
        
      case WIZARD_STEPS.SECTION_BUILDER:
        if (state.sections.length === 0) {
          validation.valid = false;
          validation.errors.push('Add at least one section to your report');
        }
        // Validate each section's config
        state.sections.forEach((section, index) => {
          const sectionValidation = validateSectionConfig(section);
          if (!sectionValidation.valid) {
            validation.valid = false;
            validation.errors.push(`Section ${index + 1}: ${sectionValidation.errors.join(', ')}`);
          }
        });
        break;
        
      case WIZARD_STEPS.PREVIEW_GENERATE:
        // Aggregate all previous validations
        for (let s = 1; s < WIZARD_STEPS.PREVIEW_GENERATE; s++) {
          const stepValidation = getStepValidation(s);
          if (!stepValidation.valid) {
            validation.valid = false;
            validation.errors.push(...stepValidation.errors);
          }
        }
        break;
    }
    
    return validation;
  }, [state]);
  
  const canProceed = useMemo(() => {
    return canProceedToStep(state.currentStep + 1);
  }, [canProceedToStep, state.currentStep]);
  
  const canGoBack = useMemo(() => {
    return state.currentStep > WIZARD_STEPS.TEMPLATE_SELECTION;
  }, [state.currentStep]);
  
  // ─────────────────────────────────────────
  // Template Building Helpers
  // ─────────────────────────────────────────
  
  const buildTemplateDefinition = useCallback(() => {
    return {
      metadata: {
        title: state.reportName,
        subtitle: '{{project.name}}',
        generatedAt: '{{generated.date}}',
        generatedBy: '{{generated.by}}',
        includeCoverPage: state.parameters.includeCoverPage,
        includeTableOfContents: state.parameters.includeTableOfContents
      },
      parameters: [
        {
          id: 'reportingPeriod',
          value: state.parameters.reportingPeriod
        },
        ...(state.parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM ? [
          { id: 'customStartDate', value: state.parameters.customStartDate },
          { id: 'customEndDate', value: state.parameters.customEndDate }
        ] : [])
      ],
      sections: state.sections
    };
  }, [state.reportName, state.parameters, state.sections]);
  
  const getReportContext = useCallback(() => {
    return {
      projectId,
      projectName,
      projectRef,
      reportingPeriod: state.parameters.reportingPeriod,
      customDateRange: state.parameters.reportingPeriod === REPORTING_PERIOD.CUSTOM ? {
        startDate: state.parameters.customStartDate,
        endDate: state.parameters.customEndDate
      } : null,
      userRole: role || profile?.role || 'viewer',
      user: {
        id: user?.id,
        email: user?.email,
        full_name: profile?.full_name
      },
      project: {
        id: projectId,
        name: projectName,
        ref: projectRef
      }
    };
  }, [projectId, projectName, projectRef, state.parameters, role, profile, user]);
  
  // ─────────────────────────────────────────
  // Section Helpers
  // ─────────────────────────────────────────
  
  const getSectionById = useCallback((sectionId) => {
    return state.sections.find(s => s.id === sectionId) || null;
  }, [state.sections]);
  
  const getSectionIndex = useCallback((sectionId) => {
    return state.sections.findIndex(s => s.id === sectionId);
  }, [state.sections]);
  
  const hasSectionType = useCallback((sectionType) => {
    return state.sections.some(s => s.type === sectionType);
  }, [state.sections]);
  
  const getSectionCount = useCallback(() => {
    return state.sections.length;
  }, [state.sections]);
  
  // ─────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────
  
  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Navigation
    setStep,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    canGoBack,
    
    // Template
    selectTemplate,
    startFromScratch,
    clearTemplate,
    
    // Report config
    setReportName,
    setParameters,
    updateParameter,
    
    // Sections
    addSection,
    addSectionAtIndex,
    removeSection,
    updateSection,
    updateSectionConfig,
    reorderSections,
    moveSectionUp,
    moveSectionDown,
    clearSections,
    duplicateSection,
    getSectionById,
    getSectionIndex,
    hasSectionType,
    getSectionCount,
    
    // Preview
    setPreview,
    clearPreview,
    setGenerating,
    setPreviewError,
    
    // AI Assistant
    toggleAIPanel,
    setAIPanelOpen,
    addAIMessage,
    clearAIMessages,
    setAILoading,
    
    // General
    setDirty,
    resetWizard,
    loadSavedState,
    
    // Validation
    canProceedToStep,
    getStepValidation,
    
    // Helpers
    buildTemplateDefinition,
    getReportContext
  }), [
    state,
    setStep, nextStep, prevStep, goToStep, canProceed, canGoBack,
    selectTemplate, startFromScratch, clearTemplate,
    setReportName, setParameters, updateParameter,
    addSection, addSectionAtIndex, removeSection, updateSection, updateSectionConfig,
    reorderSections, moveSectionUp, moveSectionDown, clearSections, duplicateSection,
    getSectionById, getSectionIndex, hasSectionType, getSectionCount,
    setPreview, clearPreview, setGenerating, setPreviewError,
    toggleAIPanel, setAIPanelOpen, addAIMessage, clearAIMessages, setAILoading,
    setDirty, resetWizard, loadSavedState,
    canProceedToStep, getStepValidation,
    buildTemplateDefinition, getReportContext
  ]);
  
  return (
    <ReportBuilderContext.Provider value={contextValue}>
      {children}
    </ReportBuilderContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Main hook to access Report Builder context
 */
export function useReportBuilder() {
  const context = useContext(ReportBuilderContext);
  
  if (!context) {
    throw new Error('useReportBuilder must be used within a ReportBuilderProvider');
  }
  
  return context;
}

/**
 * Hook for wizard navigation only
 */
export function useReportBuilderNavigation() {
  const { 
    currentStep, 
    setStep, 
    nextStep, 
    prevStep, 
    goToStep,
    canProceed, 
    canGoBack,
    canProceedToStep,
    getStepValidation
  } = useReportBuilder();
  
  return {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    canGoBack,
    canProceedToStep,
    getStepValidation,
    isFirstStep: currentStep === WIZARD_STEPS.TEMPLATE_SELECTION,
    isLastStep: currentStep === WIZARD_STEPS.PREVIEW_GENERATE
  };
}

/**
 * Hook for section management only
 */
export function useReportBuilderSections() {
  const {
    sections,
    addSection,
    addSectionAtIndex,
    removeSection,
    updateSection,
    updateSectionConfig,
    reorderSections,
    moveSectionUp,
    moveSectionDown,
    clearSections,
    duplicateSection,
    getSectionById,
    getSectionIndex,
    hasSectionType,
    getSectionCount
  } = useReportBuilder();
  
  return {
    sections,
    addSection,
    addSectionAtIndex,
    removeSection,
    updateSection,
    updateSectionConfig,
    reorderSections,
    moveSectionUp,
    moveSectionDown,
    clearSections,
    duplicateSection,
    getSectionById,
    getSectionIndex,
    hasSectionType,
    getSectionCount,
    isEmpty: sections.length === 0
  };
}

/**
 * Hook for AI assistant panel
 */
export function useReportBuilderAI() {
  const {
    aiPanelOpen,
    aiMessages,
    aiLoading,
    toggleAIPanel,
    setAIPanelOpen,
    addAIMessage,
    clearAIMessages,
    setAILoading
  } = useReportBuilder();
  
  return {
    isOpen: aiPanelOpen,
    messages: aiMessages,
    isLoading: aiLoading,
    toggle: toggleAIPanel,
    setOpen: setAIPanelOpen,
    addMessage: addAIMessage,
    clearMessages: clearAIMessages,
    setLoading: setAILoading
  };
}

/**
 * Hook for preview state
 */
export function useReportBuilderPreview() {
  const {
    previewHtml,
    previewError,
    isGenerating,
    lastPreviewTime,
    setPreview,
    clearPreview,
    setGenerating,
    setPreviewError
  } = useReportBuilder();
  
  return {
    html: previewHtml,
    error: previewError,
    isGenerating,
    lastPreviewTime,
    setPreview,
    clearPreview,
    setGenerating,
    setPreviewError,
    hasPreview: !!previewHtml,
    needsRefresh: !previewHtml && !isGenerating
  };
}

export default ReportBuilderContext;
