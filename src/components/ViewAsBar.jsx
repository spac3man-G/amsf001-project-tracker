// src/components/ViewAsBar.jsx
// View As role selector for admin and supplier_pm users
// Version 1.0
//
// Displays a compact role selector in the header that allows
// admins and supplier PMs to preview the application as different roles.

import React from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { useViewAs } from '../contexts/ViewAsContext';

export default function ViewAsBar() {
  const {
    canUseViewAs,
    isImpersonating,
    effectiveRole,
    actualRole,
    setViewAs,
    clearViewAs,
    availableRoles,
    effectiveRoleConfig,
  } = useViewAs();

  // Don't render if user can't use View As
  if (!canUseViewAs) {
    return null;
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.75rem',
        backgroundColor: isImpersonating ? '#fef3c7' : '#f8fafc',
        borderRadius: '6px',
        border: isImpersonating ? '1px solid #fcd34d' : '1px solid #e2e8f0',
        fontSize: '0.8125rem',
        transition: 'all 0.15s ease',
      }}
    >
      <Eye 
        size={14} 
        style={{ 
          color: isImpersonating ? '#d97706' : '#64748b',
          flexShrink: 0
        }} 
      />
      
      <span style={{ 
        color: isImpersonating ? '#92400e' : '#64748b',
        fontWeight: '500',
        whiteSpace: 'nowrap'
      }}>
        View as:
      </span>
      
      <select
        value={effectiveRole}
        onChange={(e) => setViewAs(e.target.value)}
        style={{
          padding: '0.25rem 0.5rem',
          paddingRight: '1.5rem',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: isImpersonating 
            ? effectiveRoleConfig.bg 
            : 'white',
          color: isImpersonating 
            ? effectiveRoleConfig.color 
            : '#374151',
          fontWeight: '600',
          fontSize: '0.75rem',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.25rem center',
          minWidth: '110px',
        }}
      >
        {availableRoles.map((role) => (
          <option 
            key={role.value} 
            value={role.value}
            style={{
              fontWeight: role.value === actualRole ? '700' : '400'
            }}
          >
            {role.label}{role.value === actualRole ? ' (You)' : ''}
          </option>
        ))}
      </select>

      {isImpersonating && (
        <button
          onClick={clearViewAs}
          title="Reset to your actual role"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#92400e',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}

// Compact inline version for tight spaces
export function ViewAsInline() {
  const {
    canUseViewAs,
    isImpersonating,
    effectiveRole,
    effectiveRoleConfig,
  } = useViewAs();

  if (!canUseViewAs || !isImpersonating) {
    return null;
  }

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.375rem',
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontWeight: '600',
        color: '#92400e',
      }}
    >
      <Eye size={10} />
      viewing as {effectiveRoleConfig.label}
    </span>
  );
}
