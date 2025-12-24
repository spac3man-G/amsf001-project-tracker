/**
 * Accept Invitation Page
 * 
 * Landing page for users who receive an invitation link.
 * Validates the token, shows invitation details, and allows user to create account.
 * 
 * URL: /accept-invite?token=xxx
 * 
 * Flow:
 * 1. Validate token on page load
 * 2. Show invitation details (org name, role, inviter)
 * 3. User enters name and password
 * 4. Create Supabase auth account
 * 5. Accept invitation (creates user_organisations record)
 * 6. Redirect to dashboard
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { invitationService } from '../services';
import { 
  Building2, Mail, Shield, User, CheckCircle, 
  AlertCircle, Loader2, Eye, EyeOff, UserPlus
} from 'lucide-react';

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
  },
  header: {
    padding: '2rem 2rem 1.5rem',
    textAlign: 'center',
    borderBottom: '1px solid #f1f5f9',
  },
  logo: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#87CEEB',
    borderRadius: '6px',
    margin: '0 auto 1rem',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#64748b',
  },
  body: {
    padding: '1.5rem 2rem 2rem',
  },
  inviteDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  detailRowLast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: 0,
  },
  detailIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.125rem',
  },
  detailValue: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.625rem',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#8b5cf6',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '0.25rem',
  },
  hint: {
    display: 'block',
    marginTop: '0.375rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  btn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  btnPrimary: {
    backgroundColor: '#87CEEB',
    color: 'white',
  },
  btnPrimaryHover: {
    backgroundColor: '#5BA3C6',
  },
  btnDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '1.25rem',
  },
  errorText: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#dc2626',
  },
  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: '1rem',
    fontSize: '0.9375rem',
    color: '#64748b',
  },
  // Invalid token state
  invalidContainer: {
    padding: '2rem',
    textAlign: 'center',
  },
  invalidIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
  },
  invalidTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  invalidText: {
    margin: '0 0 1.5rem',
    fontSize: '0.9375rem',
    color: '#64748b',
    lineHeight: 1.6,
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
  },
  // Success state
  successContainer: {
    padding: '2rem',
    textAlign: 'center',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#d1fae5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
  },
  footer: {
    padding: '1rem 2rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: '0.8125rem',
    color: '#94a3b8',
  },
  footerLink: {
    color: '#5BA3C6',
    textDecoration: 'none',
  },
};

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // State
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        const inviteData = await invitationService.getInvitationByToken(token);
        
        if (!inviteData) {
          setError('This invitation link is invalid or has expired');
          setLoading(false);
          return;
        }

        setInvitation(inviteData);
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Unable to validate invitation. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validate
    if (!fullName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        if (authError.message.includes('already registered')) {
          setFormError('An account with this email already exists. Please log in instead.');
        } else {
          setFormError(authError.message);
        }
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setFormError('Failed to create account. Please try again.');
        setSubmitting(false);
        return;
      }

      // 2. Update profile with full name (trigger should create profile, but let's ensure name is set)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Non-fatal, continue
      }

      // 3. Accept the invitation
      const accepted = await invitationService.acceptInvitation(token, authData.user.id);

      if (!accepted) {
        console.error('Failed to accept invitation');
        // Non-fatal - user account created, they can be added manually
      }

      // 4. Show success and redirect
      setSuccess(true);
      
      // Wait a moment then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Accept invitation error:', err);
      setFormError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <Loader2 size={40} style={{ color: '#87CEEB', animation: 'spin 1s linear infinite' }} />
            <p style={styles.loadingText}>Validating invitation...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Invalid/expired token
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.invalidContainer}>
            <div style={styles.invalidIcon}>
              <AlertCircle size={32} style={{ color: '#dc2626' }} />
            </div>
            <h1 style={styles.invalidTitle}>Invitation Not Valid</h1>
            <p style={styles.invalidText}>
              {error}
              <br />
              Please contact the person who sent you this invitation for a new link.
            </p>
            <button 
              style={styles.linkBtn}
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>
              <CheckCircle size={32} style={{ color: '#059669' }} />
            </div>
            <h1 style={styles.invalidTitle}>Welcome!</h1>
            <p style={styles.invalidText}>
              Your account has been created and you've joined{' '}
              <strong>{invitation.organisation_display_name || invitation.organisation_name}</strong>.
              <br />
              Redirecting to dashboard...
            </p>
            <Loader2 size={24} style={{ color: '#87CEEB', animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main form
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoText}>progressive</span>
          </div>
          <h1 style={styles.title}>You're Invited!</h1>
          <p style={styles.subtitle}>Create your account to get started</p>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Invitation Details */}
          <div style={styles.inviteDetails}>
            <div style={styles.detailRow}>
              <div style={styles.detailIcon}>
                <Building2 size={18} style={{ color: '#87CEEB' }} />
              </div>
              <div style={styles.detailText}>
                <div style={styles.detailLabel}>Organisation</div>
                <div style={styles.detailValue}>
                  {invitation.organisation_display_name || invitation.organisation_name}
                </div>
              </div>
            </div>
            <div style={styles.detailRow}>
              <div style={styles.detailIcon}>
                <Shield size={18} style={{ color: '#059669' }} />
              </div>
              <div style={styles.detailText}>
                <div style={styles.detailLabel}>Your Role</div>
                <span style={styles.roleBadge}>
                  {invitation.org_role === 'org_admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
            {invitation.inviter_name && (
              <div style={styles.detailRowLast}>
                <div style={styles.detailIcon}>
                  <User size={18} style={{ color: '#64748b' }} />
                </div>
                <div style={styles.detailText}>
                  <div style={styles.detailLabel}>Invited by</div>
                  <div style={styles.detailValue}>{invitation.inviter_name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {formError && (
            <div style={styles.errorBox}>
              <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
              <span style={styles.errorText}>{formError}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={invitation.email}
                disabled
                style={{ ...styles.input, ...styles.inputDisabled }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                style={styles.input}
                required
                autoFocus
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWithIcon}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  style={{ ...styles.input, paddingRight: '2.75rem' }}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  style={styles.inputIcon}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={styles.hint}>Must be at least 8 characters</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.btn,
                ...(submitting ? styles.btnDisabled : styles.btnPrimary),
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Account & Join
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <a href="/login" style={styles.footerLink}>Log in</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
