import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user arrived via password reset link
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's a session, the reset link was valid
      if (session) {
        setValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    } catch (error) {
      console.error('Session check error:', error);
      setError('Unable to verify reset link. Please try again.');
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading">Verifying reset link...</div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={60} style={{ color: '#16a34a', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: '#166534' }}>Password Reset Successful!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Your password has been updated. Redirecting to login...
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={60} style={{ color: '#dc2626', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: '#991b1b' }}>Invalid Reset Link</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <KeyRound size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                className="form-input"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                className="form-input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password requirements */}
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '0.25rem', color: '#475569' }}>
              Password requirements:
            </div>
            <ul style={{ margin: '0', paddingLeft: '1.25rem', color: '#64748b' }}>
              <li style={{ color: newPassword.length >= 6 ? '#16a34a' : '#64748b' }}>
                At least 6 characters {newPassword.length >= 6 && '✓'}
              </li>
              <li style={{ color: newPassword && newPassword === confirmPassword ? '#16a34a' : '#64748b' }}>
                Passwords match {newPassword && newPassword === confirmPassword && '✓'}
              </li>
            </ul>
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
              color: '#991b1b'
            }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !newPassword || !confirmPassword}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
