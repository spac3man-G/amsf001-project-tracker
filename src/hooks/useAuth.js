/**
 * useAuth Hook
 * 
 * Centralised authentication and user profile management.
 * Replaces duplicated auth logic across all page components.
 * 
 * Usage:
 *   import { useAuth } from '../hooks';
 *   const { user, profile, userRole, loading } = useAuth();
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to get current authenticated user and their profile
 * @returns {object} { user, profile, userRole, userId, loading, error, refetch }
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchAuth() {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }

      if (!authUser) {
        // No authenticated user
        setUser(null);
        setProfile(null);
        setUserRole('viewer');
        setLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch user profile with role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url, is_test_user')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // Profile might not exist yet for new users
        console.warn('Profile fetch warning:', profileError.message);
        setProfile(null);
        setUserRole('viewer');
      } else if (profileData) {
        setProfile(profileData);
        setUserRole(profileData.role || 'viewer');
      }

    } catch (err) {
      console.error('Auth error:', err);
      setError(err);
      setUser(null);
      setProfile(null);
      setUserRole('viewer');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuth();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchAuth();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setUserRole('viewer');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    userRole,
    userId: user?.id || null,
    loading,
    error,
    refetch: fetchAuth,
    // Convenience properties
    isAuthenticated: !!user,
    userName: profile?.full_name || profile?.email?.split('@')[0] || 'User',
    userEmail: profile?.email || user?.email || '',
    isTestUser: profile?.is_test_user || false
  };
}

export default useAuth;
