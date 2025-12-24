/**
 * Onboarding Wizard Component
 * 
 * Multi-step wizard to guide new organisation admins through setup:
 * 1. Organisation Details - Review/edit org info
 * 2. Invite Team - Send invitations to team members
 * 3. First Project - Create their first project
 * 4. Complete - Success screen with next steps
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, Users, FolderKanban, CheckCircle2, 
  ChevronRight, ChevronLeft, X
} from 'lucide-react';

// Step components
import Step1OrgDetails from './Step1OrgDetails';
import Step2InviteTeam from './Step2InviteTeam';
import Step3FirstProject from './Step3FirstProject';
import Step4Complete from './Step4Complete';

import './OnboardingWizard.css';

const STEPS = [
  { id: 1, title: 'Organisation', icon: Building2, component: Step1OrgDetails },
  { id: 2, title: 'Invite Team', icon: Users, component: Step2InviteTeam },
  { id: 3, title: 'First Project', icon: FolderKanban, component: Step3FirstProject },
  { id: 4, title: 'Complete', icon: CheckCircle2, component: Step4Complete },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentOrganisation, 
    organisationId, 
    refreshOrganisation,
    orgSettings 
  } = useOrganisation();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    organisation: null,
    invitations: [],
    project: null,
  });
  const [isSkippable, setIsSkippable] = useState(false);

  // Initialize wizard data from current organisation
  useEffect(() => {
    if (currentOrganisation) {
      setWizardData(prev => ({
        ...prev,
        organisation: {
          id: currentOrganisation.id,
          name: currentOrganisation.name,
          slug: currentOrganisation.slug,
          description: currentOrganisation.description || '',
        }
      }));
    }
  }, [currentOrganisation]);

  // Check if onboarding is already completed
  useEffect(() => {
    if (orgSettings?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    }
  }, [orgSettings, navigate]);

  // Update wizard data from a step
  const updateWizardData = (key, value) => {
    setWizardData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Skip to dashboard (available after step 1)
  const skipOnboarding = async () => {
    try {
      // Mark onboarding as completed
      await markOnboardingComplete();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  // Mark onboarding as complete in database
  const markOnboardingComplete = async () => {
    if (!organisationId) return;

    const { error } = await supabase
      .from('organisations')
      .update({
        settings: {
          ...currentOrganisation?.settings,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_completed_by: user?.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organisationId);

    if (error) {
      console.error('Error marking onboarding complete:', error);
      throw error;
    }

    await refreshOrganisation();
  };

  // Complete the wizard
  const completeWizard = async () => {
    try {
      await markOnboardingComplete();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing wizard:', error);
    }
  };

  // Get current step component
  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  // Calculate progress percentage
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="onboarding-wizard">
      {/* Header */}
      <header className="wizard-header">
        <div className="wizard-header-content">
          <div className="wizard-logo">
            <Building2 size={24} />
            <span>Project Tracker</span>
          </div>
          {currentStep > 1 && currentStep < STEPS.length && (
            <button 
              className="btn-skip"
              onClick={skipOnboarding}
            >
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="wizard-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-steps">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            
            return (
              <div 
                key={step.id}
                className={`progress-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              >
                <div className="step-icon">
                  {isComplete ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <StepIcon size={20} />
                  )}
                </div>
                <span className="step-title">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <main className="wizard-content">
        <div className="wizard-content-inner">
          {CurrentStepComponent && (
            <CurrentStepComponent
              wizardData={wizardData}
              updateWizardData={updateWizardData}
              onNext={nextStep}
              onPrev={prevStep}
              onComplete={completeWizard}
              isFirstStep={currentStep === 1}
              isLastStep={currentStep === STEPS.length}
            />
          )}
        </div>
      </main>
    </div>
  );
}
