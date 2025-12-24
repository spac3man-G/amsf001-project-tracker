/**
 * Step 2: Invite Team Members
 * 
 * Allows user to invite team members via email.
 * Uses the existing invitation service.
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, ChevronRight, ChevronLeft, Loader2, 
  Plus, X, Mail, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function Step2InviteTeam({ 
  wizardData, 
  updateWizardData, 
  onNext, 
  onPrev 
}) {
  const { organisationId, currentOrganisation } = useOrganisation();
  const { user } = useAuth();
  
  const [invitations, setInvitations] = useState(wizardData.invitations || []);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('org_member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const roles = [
    { value: 'org_admin', label: 'Admin', description: 'Full organisation control' },
    { value: 'org_member', label: 'Member', description: 'Access assigned projects' },
  ];

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddInvitation = async () => {
    const email = newEmail.trim().toLowerCase();
    
    // Validate email
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if already invited
    if (invitations.some(inv => inv.email === email)) {
      setError('This email has already been added');
      return;
    }

    // Check if it's the current user's email
    if (email === user?.email?.toLowerCase()) {
      setError("You can't invite yourself");
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create invitation via API or direct insert
      const { data: { session } } = await supabase.auth.getSession();
      
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: invitation, error: inviteError } = await supabase
        .from('org_invitations')
        .insert({
          organisation_id: organisationId,
          email: email,
          org_role: newRole,
          token: token,
          invited_by: user?.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (inviteError) {
        // Check if it's a duplicate
        if (inviteError.code === '23505') {
          throw new Error('An invitation has already been sent to this email');
        }
        throw inviteError;
      }

      // Add to local list
      const newInvitation = {
        id: invitation.id,
        email: email,
        role: newRole,
        status: 'pending',
      };
      
      const updatedInvitations = [...invitations, newInvitation];
      setInvitations(updatedInvitations);
      updateWizardData('invitations', updatedInvitations);
      
      // Clear form
      setNewEmail('');
      setNewRole('org_member');
      setSuccessMessage(`Invitation sent to ${email}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveInvitation = async (invitationId) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('org_invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      // Remove from local list
      const updatedInvitations = invitations.filter(inv => inv.id !== invitationId);
      setInvitations(updatedInvitations);
      updateWizardData('invitations', updatedInvitations);

    } catch (err) {
      console.error('Error removing invitation:', err);
      setError('Failed to remove invitation');
    }
  };

  const handleContinue = () => {
    updateWizardData('invitations', invitations);
    onNext();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInvitation();
    }
  };

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h2>Invite Your Team</h2>
        <p>Add team members to {currentOrganisation?.name}. They'll receive an email invitation.</p>
      </div>

      <div className="step-body">
        {error && (
          <div className="wizard-error" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.875rem',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '0.875rem',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {/* Add Invitation Form */}
        <div className="add-invitation-form">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            disabled={sending}
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-wizard-primary"
            onClick={handleAddInvitation}
            disabled={sending || !newEmail.trim()}
          >
            {sending ? (
              <Loader2 size={18} className="wizard-spinner" />
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>

        {/* Invitations List */}
        <div className="invitation-list">
          {invitations.length > 0 ? (
            <>
              <h4>Pending Invitations ({invitations.length})</h4>
              {invitations.map(inv => (
                <div key={inv.id} className="invitation-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} style={{ color: '#94a3b8' }} />
                    <span className="invitation-email">{inv.email}</span>
                  </div>
                  <div className="invitation-role">
                    <span className="invitation-role-badge">
                      {roles.find(r => r.value === inv.role)?.label || inv.role}
                    </span>
                    <button
                      className="invitation-remove"
                      onClick={() => handleRemoveInvitation(inv.id)}
                      title="Remove invitation"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-invitations">
              <Users size={40} />
              <p>No invitations yet. Add team members above.</p>
            </div>
          )}
        </div>
      </div>

      <div className="step-footer">
        <button 
          type="button" 
          className="btn-wizard-secondary"
          onClick={onPrev}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {invitations.length === 0 && (
            <button
              type="button"
              className="btn-wizard-text"
              onClick={handleContinue}
            >
              Skip for now
            </button>
          )}
          <button 
            type="button" 
            className="btn-wizard-primary"
            onClick={handleContinue}
          >
            Continue
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
