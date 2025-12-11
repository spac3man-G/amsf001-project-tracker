/**
 * Report Builder Wizard
 * 
 * Main container for the multi-step report builder wizard.
 * Manages step navigation and renders the appropriate step component.
 * 
 * Features:
 * - 4-step wizard (Template → Parameters → Sections → Preview)
 * - Progress indicator with step labels
 * - Step validation before navigation
 * - AI assistant panel toggle
 * - Unsaved changes warning
 * 
 * @version 1.4
 * @created 11 December 2025
 * @updated 11 December 2025 - Integrated PreviewGenerate (Segment 11)
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md
 */

import React, { useCallback, useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  useReportBuilder, 
  WIZARD_STEPS, 
  WIZARD_STEP_CONFIG,
  ReportBuilderProvider 
} from '../../contexts/ReportBuilderContext';
import { Card, LoadingSpinner, ConfirmDialog } from '../common';
import TemplateSelector from './TemplateSelector';
import ParameterConfig from './ParameterConfig';
import SectionBuilder from './SectionBuilder';
import PreviewGenerate from './PreviewGenerate';
import ReportAIAssistant from './ReportAIAssistant';
import './ReportBuilderWizard.css';

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

function StepIndicator({ currentStep, canProceedToStep, onStepClick }) {
  const steps = Object.entries(WIZARD_STEP_CONFIG);
  
  return (
    <div className="wizard-steps">
      {steps.map(([step, config], index) => {
        const stepNum = parseInt(step);
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const isClickable = canProceedToStep(stepNum);
        
        return (
          <React.Fragment key={step}>
            <button
              className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              type="button"
            >
              <div className="wizard-step-number">
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <div className="wizard-step-info">
                <span className="wizard-step-label">{config.label}</span>
                <span className="wizard-step-description">{config.description}</span>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div className={`wizard-step-connector ${isCompleted ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================
// NAVIGATION BUTTONS COMPONENT
// ============================================

function WizardNavigation({ 
  currentStep, 
  canProceed, 
  canGoBack, 
  onNext, 
  onPrev, 
  onCancel,
  isGenerating,
  validation 
}) {
  const isLastStep = currentStep === WIZARD_STEPS.PREVIEW_GENERATE;
  const isFirstStep = currentStep === WIZARD_STEPS.TEMPLATE_SELECTION;
  
  return (
    <div className="wizard-navigation">
      <div className="wizard-nav-left">
        <button 
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
      
      {!validation.valid && validation.errors.length > 0 && (
        <div className="wizard-validation-hint">
          <AlertCircle size={14} />
          <span>{validation.errors[0]}</span>
        </div>
      )}
      
      <div className="wizard-nav-right">
        {!isFirstStep && (
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={onPrev}
            disabled={!canGoBack || isGenerating}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}
        
        {!isLastStep && (
          <button 
            type="button"
            className="btn btn-primary"
            onClick={onNext}
            disabled={!canProceed || isGenerating}
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN WIZARD CONTENT COMPONENT
// ============================================

function WizardContent({ onClose }) {
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    canGoBack,
    canProceedToStep,
    getStepValidation,
    isDirty,
    isGenerating,
    aiPanelOpen,
    toggleAIPanel,
    resetWizard
  } = useReportBuilder();
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Get current step validation
  const validation = getStepValidation(currentStep);
  
  // Handle step click in indicator
  const handleStepClick = useCallback((step) => {
    if (canProceedToStep(step)) {
      goToStep(step);
    }
  }, [canProceedToStep, goToStep]);
  
  // Handle next button
  const handleNext = useCallback(() => {
    if (canProceed) {
      nextStep();
    }
  }, [canProceed, nextStep]);
  
  // Handle previous button
  const handlePrev = useCallback(() => {
    if (canGoBack) {
      prevStep();
    }
  }, [canGoBack, prevStep]);
  
  // Handle cancel with unsaved changes check
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      resetWizard();
      onClose();
    }
  }, [isDirty, resetWizard, onClose]);
  
  // Confirm cancel and close
  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);
  
  // Render appropriate step component
  const renderStep = () => {
    switch (currentStep) {
      case WIZARD_STEPS.TEMPLATE_SELECTION:
        return <TemplateSelector />;
      case WIZARD_STEPS.PARAMETERS:
        return <ParameterConfig />;
      case WIZARD_STEPS.SECTION_BUILDER:
        return <SectionBuilder />;
      case WIZARD_STEPS.PREVIEW_GENERATE:
        return <PreviewGenerate />;
      default:
        return <TemplateSelector />;
    }
  };
  
  return (
    <div className={`report-wizard ${aiPanelOpen ? 'ai-panel-open' : ''}`}>
      {/* Header */}
      <div className="wizard-header">
        <div className="wizard-header-title">
          <FileText size={24} />
          <h2>Report Builder</h2>
        </div>
        <div className="wizard-header-actions">
          <button 
            type="button"
            className={`wizard-ai-toggle ${aiPanelOpen ? 'active' : ''}`}
            onClick={toggleAIPanel}
            title="Toggle AI Assistant"
          >
            <Sparkles size={18} />
            <span>AI Assistant</span>
          </button>
          <button 
            type="button"
            className="wizard-close-btn"
            onClick={handleCancel}
            title="Close wizard"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Step Indicator */}
      <StepIndicator 
        currentStep={currentStep}
        canProceedToStep={canProceedToStep}
        onStepClick={handleStepClick}
      />
      
      {/* Main Content Area */}
      <div className="wizard-content">
        <div className="wizard-main">
          {renderStep()}
        </div>
        
        {/* AI Assistant Panel */}
        {aiPanelOpen && (
          <div className="wizard-ai-panel">
            <ReportAIAssistant onClose={toggleAIPanel} />
          </div>
        )}
      </div>
      
      {/* Navigation Footer */}
      <WizardNavigation
        currentStep={currentStep}
        canProceed={canProceed}
        canGoBack={canGoBack}
        onNext={handleNext}
        onPrev={handlePrev}
        onCancel={handleCancel}
        isGenerating={isGenerating}
        validation={validation}
      />
      
      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Changes?"
        message="You have unsaved changes to your report. Are you sure you want to close the wizard? Your progress will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Working"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}

// ============================================
// MAIN EXPORTED COMPONENT
// ============================================

/**
 * ReportBuilderWizard
 * 
 * Wrapped component that provides the ReportBuilderContext.
 * Use this component to embed the wizard in any page.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the wizard is visible
 * @param {Function} props.onClose - Callback when wizard is closed
 */
export default function ReportBuilderWizard({ isOpen, onClose }) {
  // Don't render anything if not open
  if (!isOpen) return null;
  
  return (
    <div className="report-wizard-overlay">
      <ReportBuilderProvider>
        <WizardContent onClose={onClose} />
      </ReportBuilderProvider>
    </div>
  );
}
