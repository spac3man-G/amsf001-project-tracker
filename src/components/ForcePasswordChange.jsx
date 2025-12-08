/**
 * ForcePasswordChange Component
 * 
 * Displayed when a user logs in with must_change_password = true
 * Enforces strong password requirements before allowing app access
 * 
 * @version 1.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, Check, X, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};

function validatePassword(password) {
  const checks = {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const allPassed = Object.values(checks).every(Boolean);

  // Calculate strength
  let strength = 'weak';
  const passedCount = Object.values(checks).filter(Boolean).length;
  if (passedCount >= 3) strength = 'fair';
  if (passedCount >= 4 && password.length >= 14) strength = 'good';
  if (passedCount === 5 && password.length >= 16) strength = 'strong';

  return { checks, allPassed, strength };
}

export default function ForcePasswordChange({ onSuccess, userEmail }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const strengthColors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    good: '#22c55e',
    strong: '#059669',
  };

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validation.allPassed) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Clear the must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            must_change_password: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Don't throw - password was changed successfully
        }
      }

      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <Shield size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <h1 className="auth-title">Set Your Password</h1>
          <p className="auth-subtitle">
            For security, please create a strong password before continuing
          </p>
        </div>

        {userEmail && (
          <div style={{
            padding: '0.75rem',
            background: '#f1f5f9',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#475569',
          }}>
            Logged in as: <strong>{userEmail}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.25rem',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Password Strength</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: strengthColors[validation.strength],
                }}>
                  {strengthLabels[validation.strength]}
                </span>
              </div>
              <div style={{
                height: '4px',
                background: '#e2e8f0',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: validation.strength === 'weak' ? '25%' 
                       : validation.strength === 'fair' ? '50%'
                       : validation.strength === 'good' ? '75%'
                       : '100%',
                  background: strengthColors[validation.strength],
                  transition: 'all 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Requirements Checklist */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Password Requirements:
            </div>
            {[
              { key: 'length', label: `At least ${PASSWORD_REQUIREMENTS.minLength} characters` },
              { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
              { key: 'lowercase', label: 'One lowercase letter (a-z)' },
              { key: 'number', label: 'One number (0-9)' },
              { key: 'special', label: 'One special character (!@#$%...)' },
            ].map(({ key, label }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: validation.checks[key] ? '#059669' : '#94a3b8',
                  marginBottom: '0.25rem',
                }}
              >
                {validation.checks[key] ? (
                  <Check size={14} style={{ color: '#059669' }} />
                ) : (
                  <X size={14} style={{ color: '#cbd5e1' }} />
                )}
                {label}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                className="form-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ 
                  paddingRight: '2.5rem',
                  borderColor: confirmPassword.length > 0 
                    ? (passwordsMatch ? '#22c55e' : '#ef4444')
                    : undefined,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.25rem',
                }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#ef4444', 
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <X size={12} /> Passwords do not match
              </div>
            )}
            {passwordsMatch && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#22c55e', 
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <Check size={12} /> Passwords match
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: '#fee2e2',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#991b1b',
            }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !validation.allPassed || !passwordsMatch}
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              opacity: (!validation.allPassed || !passwordsMatch) ? 0.5 : 1,
            }}
          >
            {loading ? 'Updating...' : 'Set Password & Continue'}
          </button>
        </form>

        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}>
          This password will be used to access your account. 
          Choose something memorable but secure.
        </div>
      </div>
    </div>
  );
}
