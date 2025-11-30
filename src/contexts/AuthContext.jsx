// src/contexts/AuthContext.jsx
// Provides authentication state to the entire application
// Version 5.0 - Added session management and token expiry checking

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Session check interval (60 seconds)
const SESSION_CHECK_INTERVAL = 60 * 1000;

// Session expiry warning threshold (5 minutes before expiry)
const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [linkedResource, setLinkedResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  
  // Ref for session check interval
  const sessionCheckIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Fetch profile and linked resource for a user
  async function fetchUserData(authUser) {
    if (!authUser) {
      setProfile(null);
      setLinkedResource(null);
      return;
    }

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError(profileError);
        return;
      }

      setProfile(profileData);

      // Fetch linked resource (if any)
      const { data: resourceData } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      setLinkedResource(resourceData);
      setError(null);

    } catch (err) {
      console.error('Error in fetchUserData:', err);
      setError(err);
    }
  }

  // Check session validity
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        return;
      }

      if (!session) {
        // Session expired - redirect to login
        console.log('Session expired, logging out');
        await handleSessionExpired();
        return;
      }

      // Check if session is about to expire
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= 0) {
        // Session already expired
        await handleSessionExpired();
      } else if (timeUntilExpiry <= EXPIRY_WARNING_THRESHOLD) {
        // Session expiring soon - try to refresh
        setSessionExpiring(true);
        
        // Attempt to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.warn('Failed to refresh session:', refreshError);
          // Let the session expire naturally
        } else {
          console.log('Session refreshed successfully');
          setSessionExpiring(false);
        }
      } else {
        setSessionExpiring(false);
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }
  }, []);

  // Handle expired session
  async function handleSessionExpired() {
    // Clear local state
    setUser(null);
    setProfile(null);
    setLinkedResource(null);
    setSessionExpiring(false);
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Redirect to login with expired flag
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = '/login?expired=true';
    }
  }

  // Start session monitoring
  const startSessionMonitoring = useCallback(() => {
    // Clear any existing interval
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // Check session periodically
    sessionCheckIntervalRef.current = setInterval(() => {
      checkSession();
    }, SESSION_CHECK_INTERVAL);

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track user activity for potential idle timeout
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Return cleanup function
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [checkSession, updateActivity]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let cleanupSessionMonitoring = null;

    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) setError(sessionError);
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          // Then fetch user data in background (non-blocking)
          if (session?.user) {
            fetchUserData(session.user);
            // Start session monitoring for logged-in users
            cleanupSessionMonitoring = startSessionMonitoring();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          if (session?.user) {
            fetchUserData(session.user);
            // Start/restart session monitoring
            if (cleanupSessionMonitoring) cleanupSessionMonitoring();
            cleanupSessionMonitoring = startSessionMonitoring();
          } else {
            setProfile(null);
            setLinkedResource(null);
            // Stop session monitoring when logged out
            if (cleanupSessionMonitoring) {
              cleanupSessionMonitoring();
              cleanupSessionMonitoring = null;
            }
          }

          // Handle specific auth events
          if (event === 'SIGNED_OUT') {
            setSessionExpiring(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
            setSessionExpiring(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (cleanupSessionMonitoring) {
        cleanupSessionMonitoring();
      }
    };
  }, [startSessionMonitoring]);

  // Sign out function
  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLinkedResource(null);
      setSessionExpiring(false);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err);
    }
  }

  // Refresh user data (useful after profile updates)
  async function refreshUserData() {
    if (user) {
      await fetchUserData(user);
    }
  }

  // Manually refresh session
  async function refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Manual session refresh failed:', error);
        return false;
      }
      if (data.session) {
        setSessionExpiring(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session refresh error:', err);
      return false;
    }
  }

  const value = {
    user,
    profile,
    role: profile?.role || 'viewer',
    linkedResource,
    isLoading,
    error,
    signOut,
    refreshUserData,
    refreshSession,
    isAuthenticated: !!user,
    sessionExpiring, // Expose session expiring state for UI warning
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export context for testing
export { AuthContext };
