// src/contexts/TestUserContext.jsx
// Manages session-level visibility of test users and their content
// Only Admin and Supplier PM can toggle this setting

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestUserContext = createContext();

export function TestUserProvider({ children }) {
  // Session-only state - resets on page refresh/logout (not persisted)
  const [showTestUsers, setShowTestUsers] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [testUserIds, setTestUserIds] = useState([]);

  // Fetch user role on mount
  useEffect(() => {
    fetchUserRole();
    fetchTestUserIds();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserRole(profile.role);
      }
    }
  }

  async function fetchTestUserIds() {
    // Get list of test user IDs for filtering
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_test_user', true);
    
    if (data) {
      setTestUserIds(data.map(p => p.id));
    }
  }

  // Only Admin and Supplier PM can toggle test user visibility
  const canToggleTestUsers = userRole === 'admin' || userRole === 'supplier_pm';

  // Toggle function - only works if user has permission
  function toggleTestUsers() {
    if (canToggleTestUsers) {
      setShowTestUsers(prev => !prev);
    }
  }

  // Helper to check if a user ID is a test user
  function isTestUser(userId) {
    return testUserIds.includes(userId);
  }

  // Filter function to exclude test content from arrays
  // Usage: const filtered = filterTestContent(data, 'user_id')
  function filterTestContent(items, userIdField = 'user_id') {
    if (!items || showTestUsers) return items;
    return items.filter(item => !testUserIds.includes(item[userIdField]));
  }

  // Filter function for items with is_test_content flag
  function filterByTestFlag(items) {
    if (!items || showTestUsers) return items;
    return items.filter(item => !item.is_test_content);
  }

  const value = {
    showTestUsers,
    setShowTestUsers,
    toggleTestUsers,
    canToggleTestUsers,
    testUserIds,
    isTestUser,
    filterTestContent,
    filterByTestFlag,
    userRole
  };

  return (
    <TestUserContext.Provider value={value}>
      {children}
    </TestUserContext.Provider>
  );
}

// Custom hook for easy access
export function useTestUsers() {
  const context = useContext(TestUserContext);
  if (!context) {
    throw new Error('useTestUsers must be used within a TestUserProvider');
  }
  return context;
}

export default TestUserContext;
