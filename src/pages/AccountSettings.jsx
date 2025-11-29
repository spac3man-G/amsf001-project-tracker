import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common';
import { 
  User, Mail, KeyRound, Save, AlertCircle, CheckCircle, 
  Eye, EyeOff, Shield, Clock
} from 'lucide-react';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Email update
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [emailSuccess, setEmailSuccess] = useState(null);
  
  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setNewEmail(user.email || '');
        
        // Fetch profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEmail(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    
    if (!newEmail) {
      setEmailError('Please enter an email address');
      return;
    }
    
    if (newEmail === user.email) {
      setEmailError('This is already your current email');
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });
      
      if (error) throw error;
      
      setEmailSuccess('Confirmation email sent to your new address. Please check your inbox and confirm to complete the change.');
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // Validation
    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading account settings..." size="large" fullPage />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <User size={28} />
          <div>
            <h1>Account Settings</h1>
            <p>Manage your account details and security</p>
          </div>
        </div>
      </div>

      {/* Account Overview */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} /> Account Overview
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Current Email</div>
            <div style={{ fontWeight: '600', wordBreak: 'break-all' }}>{user?.email || 'Not set'}</div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Role</div>
            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{profile?.role || 'User'}</div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Email Verified</div>
            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user?.email_confirmed_at ? (
                <>
                  <CheckCircle size={16} style={{ color: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#f59e0b' }}>Pending</span>
                </>
              )}
            </div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Last Sign In</div>
            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: '#64748b' }} />
              {user?.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Never'
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Update Email */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} /> Update Email Address
          </h3>
          
          <form onSubmit={handleUpdateEmail}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">New Email Address</label>
              <input
                type="email"
                className="form-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.email@example.com"
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                A confirmation email will be sent to your new address.
              </p>
            </div>
            
            {emailError && (
              <div style={{
                padding: '0.75rem',
                background: '#fee2e2',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={18} />
                {emailError}
              </div>
            )}
            
            {emailSuccess && (
              <div style={{
                padding: '0.75rem',
                background: '#dcfce7',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                color: '#166534',
                fontSize: '0.875rem'
              }}>
                <CheckCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                {emailSuccess}
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} /> Update Password
          </h3>
          
          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Password requirements:</div>
              <ul style={{ margin: '0', paddingLeft: '1.25rem' }}>
                <li style={{ color: newPassword.length >= 6 ? '#16a34a' : '#64748b' }}>
                  At least 6 characters
                </li>
                <li style={{ color: newPassword && newPassword === confirmPassword ? '#16a34a' : '#64748b' }}>
                  Passwords match
                </li>
              </ul>
            </div>
            
            {passwordError && (
              <div style={{
                padding: '0.75rem',
                background: '#fee2e2',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={18} />
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div style={{
                padding: '0.75rem',
                background: '#dcfce7',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#166534',
                fontSize: '0.875rem'
              }}>
                <CheckCircle size={18} />
                {passwordSuccess}
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !newPassword || !confirmPassword}
            >
              <Save size={16} /> {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Security Tips */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>🔒 Security Tips</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Use a strong, unique password that you don't use elsewhere</li>
          <li>Never share your password with anyone</li>
          <li>Sign out when using shared computers</li>
          <li>Contact an admin if you notice any suspicious account activity</li>
        </ul>
      </div>
    </div>
  );
}
