/**
 * Onboarding Wizard Page
 * 
 * Page wrapper for the onboarding wizard component.
 * Handles authentication check and redirects.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { OnboardingWizard } from '../../components/onboarding';
import { LoadingSpinner } from '../../components/common';

export default function OnboardingWizardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { availableOrganisations, isLoading: orgLoading, orgSettings } = useOrganisation();

  // Show loading while checking auth and organisations
  if (authLoading || orgLoading) {
    return <LoadingSpinner message="Loading..." size="large" fullPage />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to create-organisation if no organisations
  if (!availableOrganisations || availableOrganisations.length === 0) {
    return <Navigate to="/onboarding/create-organisation" replace />;
  }

  // If onboarding already completed, redirect to dashboard
  // (the wizard component also checks this, but this is a faster redirect)
  if (orgSettings?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingWizard />;
}
