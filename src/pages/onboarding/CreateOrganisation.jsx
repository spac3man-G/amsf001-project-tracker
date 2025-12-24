/**
 * Create Organisation Page
 * 
 * Shown to new users who don't belong to any organisation yet.
 * Allows them to create their first organisation or join via invitation.
 * 
 * Flow:
 * 1. New user signs up
 * 2. Redirected here if they have no organisations
 * 3. They create an org OR accept a pending invitation
 * 4. Redirected to onboarding wizard
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { Building2, Users, ArrowRight, Loader2, AlertCircle, Mail } from 'lucide-react';
import './CreateOrganisation.css';

export default function CreateOrganisation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availableOrganisations, refreshOrganisationMemberships } = useOrganisation();
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // If user already has organisations, redirect to dashboard
  useEffect(() => {
    if (availableOrganisations && availableOrganisations.length > 0) {
      navigate('/dashboard', { replace: true });
    }
  }, [availableOrganisations, navigate]);

  // Check for pending invitations
  useEffect(() => {
    async function checkInvitations() {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('org_invitations')
          .select(`
            id,
            organisation_id,
            org_role,
            expires_at,
            organisations:organisation_id (
              name,
              slug
            )
          `)
          .eq('email', user.email.toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());
        
        if (error) throw error;
        setPendingInvitations(data || []);
      } catch (err) {
        console.error('Error checking invitations:', err);
      } finally {
        setLoadingInvitations(false);
      }
    }
    
    checkInvitations();
  }, [user?.email]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugTouched && name) {
      const autoSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
      setSlug(autoSlug);
    }
  }, [name, slugTouched]);

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Organisation name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/create-organisation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organisation');
      }

      // Refresh organisations in context
      await refreshOrganisationMemberships();
      
      // Navigate to onboarding wizard
      navigate('/onboarding/wizard', { replace: true });
      
    } catch (err) {
      console.error('Error creating organisation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation) => {
    // Navigate to accept invitation page
    navigate(`/accept-invitation?org=${invitation.organisation_id}`);
  };

  return (
    <div className="create-org-page">
      <div className="create-org-container">
        {/* Header */}
        <div className="create-org-header">
          <div className="create-org-icon">
            <Building2 size={32} />
          </div>
          <h1>Welcome to Project Tracker</h1>
          <p>Create your organisation to get started, or join an existing one.</p>
        </div>

        {/* Pending Invitations */}
        {loadingInvitations ? (
          <div className="invitations-loading">
            <Loader2 size={20} className="spinner" />
            <span>Checking for invitations...</span>
          </div>
        ) : pendingInvitations.length > 0 && (
          <div className="pending-invitations">
            <h3>
              <Mail size={18} />
              You've been invited!
            </h3>
            <div className="invitation-list">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="invitation-card">
                  <div className="invitation-info">
                    <strong>{inv.organisations?.name}</strong>
                    <span className="invitation-role">as {inv.org_role.replace('_', ' ')}</span>
                  </div>
                  <button
                    className="btn-accept"
                    onClick={() => handleAcceptInvitation(inv)}
                  >
                    Accept
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="invitation-divider">
              <span>or create your own</span>
            </div>
          </div>
        )}

        {/* Create Organisation Form */}
        <form onSubmit={handleSubmit} className="create-org-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="org-name">Organisation Name *</label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              maxLength={100}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="org-slug">
              Organisation URL
              <span className="label-hint">(auto-generated)</span>
            </label>
            <div className="slug-input-wrapper">
              <span className="slug-prefix">app.projecttracker.com/</span>
              <input
                id="org-slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme-corp"
                maxLength={50}
                disabled={loading}
              />
            </div>
            <p className="field-hint">
              This will be your organisation's unique URL. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="org-description">
              Description
              <span className="label-hint">(optional)</span>
            </label>
            <textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organisation..."
              rows={3}
              maxLength={500}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-create"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                Creating...
              </>
            ) : (
              <>
                <Building2 size={18} />
                Create Organisation
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="create-org-footer">
          <p>
            <Users size={14} />
            You'll be able to invite team members after creating your organisation.
          </p>
        </div>
      </div>
    </div>
  );
}
