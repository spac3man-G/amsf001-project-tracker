/**
 * AMSF001 Project Tracker - useReadOnly Hook
 * Location: src/hooks/useReadOnly.js
 * Version 1.0
 * 
 * This hook provides a simple way to check if the current page
 * is in read-only mode for the current user's role.
 * 
 * Usage:
 *   import { useReadOnly } from '../hooks/useReadOnly';
 *   
 *   function MyComponent() {
 *     const { isReadOnly, canEdit } = useReadOnly();
 *     
 *     return (
 *       <>
 *         {canEdit && <button>Edit</button>}
 *         {isReadOnly && <span>View only</span>}
 *       </>
 *     );
 *   }
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isReadOnlyForRole, getNavItemIdByPath, ROLES } from '../lib/navigation';

/**
 * Hook to check if current page is read-only for the user
 * @returns {object} { isReadOnly, canEdit, role }
 */
export function useReadOnly() {
  const { role } = useAuth();
  const location = useLocation();
  
  const isReadOnly = useMemo(() => {
    const itemId = getNavItemIdByPath(location.pathname);
    if (!itemId) return false;
    return isReadOnlyForRole(role, itemId);
  }, [role, location.pathname]);
  
  return {
    isReadOnly,
    canEdit: !isReadOnly,
    role
  };
}

/**
 * Check if a role is a viewer (has most restricted access)
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isViewer(role) {
  return role === ROLES?.VIEWER || role === 'viewer';
}

/**
 * Check if a role has edit capabilities on a specific page
 * @param {string} role - User's role
 * @param {string} path - Page path
 * @returns {boolean}
 */
export function canEditPage(role, path) {
  const itemId = getNavItemIdByPath(path);
  if (!itemId) return true; // Unknown pages default to editable
  return !isReadOnlyForRole(role, itemId);
}

export default useReadOnly;
