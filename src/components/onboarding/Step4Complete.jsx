/**
 * Step 4: Setup Complete
 * 
 * Shows a summary of what was set up and next steps.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React from 'react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { 
  CheckCircle2, Building2, Users, FolderKanban, 
  ArrowRight, Rocket
} from 'lucide-react';

export default function Step4Complete({ 
  wizardData, 
  onComplete 
}) {
  const { currentOrganisation } = useOrganisation();

  const summary = [
    {
      icon: Building2,
      label: 'Organisation',
      value: currentOrganisation?.name || wizardData.organisation?.name || 'Your Organisation',
      complete: true,
    },
    {
      icon: Users,
      label: 'Team Invitations',
      value: wizardData.invitations?.length 
        ? `${wizardData.invitations.length} invitation${wizardData.invitations.length > 1 ? 's' : ''} sent`
        : 'No invitations sent yet',
      complete: wizardData.invitations?.length > 0,
    },
    {
      icon: FolderKanban,
      label: 'First Project',
      value: wizardData.project?.name || 'No project created yet',
      complete: !!wizardData.project,
    },
  ];

  return (
    <div className="wizard-step">
      <div className="complete-step">
        <div className="complete-icon">
          <Rocket size={40} />
        </div>
        
        <h2>You're All Set!</h2>
        <p>
          Your organisation is ready to go. Here's a summary of what we've set up:
        </p>

        <div className="complete-summary">
          <h4>Setup Summary</h4>
          {summary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="summary-item">
                {item.complete ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Icon size={20} style={{ color: '#94a3b8' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    marginBottom: '2px'
                  }}>
                    {item.label}
                  </div>
                  <span style={{ 
                    color: item.complete ? '#1e293b' : '#94a3b8' 
                  }}>
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h4 style={{
            margin: '0 0 12px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#64748b'
          }}>
            Next Steps
          </h4>
          <ul style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontSize: '0.9375rem',
            color: '#475569',
            lineHeight: '1.7'
          }}>
            {!wizardData.project && (
              <li>Create your first project from the Projects page</li>
            )}
            {wizardData.invitations?.length === 0 && (
              <li>Invite team members from Organisation Settings</li>
            )}
            <li>Set up milestones and deliverables for your project</li>
            <li>Add resources and track timesheets</li>
            <li>Use the AI assistant for quick help anytime</li>
          </ul>
        </div>

        <button 
          className="btn-wizard-primary"
          onClick={onComplete}
          style={{ fontSize: '1rem', padding: '14px 32px' }}
        >
          Go to Dashboard
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
