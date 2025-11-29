// src/contexts/AuthContext.jsx
// Provides authentication state to the entire application
// Version 4.0 - Phase 0, Task 0.1

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [linkedResource, setLinkedResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

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
          setIsLoading(false); // Set loading false IMMEDIATELY
          
          // Then fetch user data in background (non-blocking)
          if (session?.user) {
            fetchUserData(session.user); // Don't await
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
            fetchUserData(session.user); // Don't await
          } else {
            setProfile(null);
            setLinkedResource(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLinkedResource(null);
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

  const value = {
    user,
    profile,
    role: profile?.role || 'viewer',
    linkedResource,
    isLoading,
    error,
    signOut,
    refreshUserData,
    isAuthenticated: !!user,
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
