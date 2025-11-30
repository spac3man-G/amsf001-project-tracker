import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, Mail, KeyRound, RefreshCw, Clock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check for existing session and listen for auth changes
  useEffect(() => {
    // Check for session expired parameter
    if (searchParams.get('expired') === 'true') {
      setSessionExpired(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, '/login');
    }

    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSessionExpired(false);

    try {
      if (isSignUp) {
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        setSuccess('Check your email for confirmation link!');
      } else {
        // Sign in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Navigation will happen via onAuthStateChange listener
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setSuccess('Verification email resent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setShowForgotPassword(false);
    setShowResendVerification(false);
    setError(null);
    setSuccess(null);
    setSessionExpired(false);
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">
            <KeyRound size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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

            {success && (
              <div style={{
                padding: '0.75rem',
                background: '#dcfce7',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#166534'
              }}>
                <Mail size={20} />
                <span style={{ fontSize: '0.875rem' }}>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={resetView}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Resend Verification View
  if (showResendVerification) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">
            <RefreshCw size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <h1 className="auth-title">Resend Verification</h1>
            <p className="auth-subtitle">Enter your email to resend the verification link</p>
          </div>

          <form onSubmit={handleResendVerification}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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

            {success && (
              <div style={{
                padding: '0.75rem',
                background: '#dcfce7',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#166534'
              }}>
                <Mail size={20} />
                <span style={{ fontSize: '0.875rem' }}>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={resetView}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Login View
  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <h1 className="auth-title">AMSF001 Tracker</h1>
          <p className="auth-subtitle">Network Architecture Services Project</p>
        </div>

        {/* Session Expired Warning */}
        {sessionExpired && (
          <div style={{
            padding: '0.75rem',
            background: '#fef3c7',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#92400e',
            border: '1px solid #fcd34d'
          }}>
            <Clock size={20} />
            <span style={{ fontSize: '0.875rem' }}>
              Your session has expired. Please sign in again.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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

          {success && (
            <div style={{
              padding: '0.75rem',
              background: '#dcfce7',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#166534'
            }}>
              <Mail size={20} />
              <span style={{ fontSize: '0.875rem' }}>{success}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Forgot Password Link */}
        {!isSignUp && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={() => {
                setShowForgotPassword(true);
                setError(null);
                setSuccess(null);
                setSessionExpired(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Toggle Sign In / Sign Up */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
              setSessionExpired(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Resend Verification Link */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Haven't received your verification email?
          </p>
          <button
            onClick={() => {
              setShowResendVerification(true);
              setError(null);
              setSuccess(null);
              setSessionExpired(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RefreshCw size={14} /> Resend Verification Email
          </button>
        </div>
      </div>
    </div>
  );
}
