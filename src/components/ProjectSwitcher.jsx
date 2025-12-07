// src/components/ProjectSwitcher.jsx
// Version 1.0 - Project switcher dropdown for multi-project users
//
// Only displays when user has multiple project assignments.
// Allows switching between projects with different roles.

import React, { useState, useRef, useEffect } from 'react';
import { FolderKanban, ChevronDown, Check } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { ROLE_CONFIG } from '../lib/permissionMatrix';

export default function ProjectSwitcher() {
  const {
    currentProject,
    projectRole,
    availableProjects,
    hasMultipleProjects,
    switchProject,
    isLoading
  } = useProject();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if user only has one project
  if (!hasMultipleProjects || isLoading) {
    return null;
  }

  // Get role display config
  const getRoleConfig = (role) => {
    return ROLE_CONFIG[role] || { label: role, shortLabel: role, color: '#64748b', bg: '#f1f5f9' };
  };

  const handleProjectSelect = (projectId) => {
    if (projectId !== currentProject?.id) {
      switchProject(projectId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#334155',
          transition: 'all 0.15s ease',
          minWidth: '180px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderKanban size={16} style={{ color: '#10b981' }} />
          <span style={{ 
            maxWidth: '120px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {currentProject?.reference || 'Select Project'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s ease'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          minWidth: '280px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600', 
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Switch Project
            </div>
          </div>

          {/* Project List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableProjects.map((assignment) => {
              const project = assignment.project;
              const isSelected = project?.id === currentProject?.id;
              const roleConfig = getRoleConfig(assignment.role);

              return (
                <button
                  key={assignment.id}
                  onClick={() => handleProjectSelect(project?.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: isSelected ? '#f0fdf4' : 'white',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : 'white';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '0.875rem',
                        color: isSelected ? '#10b981' : '#1e293b'
                      }}>
                        {project?.reference}
                      </span>
                      {assignment.is_default && (
                        <span style={{
                          fontSize: '0.6rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project?.name}
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.125rem 0.5rem',
                      backgroundColor: roleConfig.bg,
                      color: roleConfig.color,
                      borderRadius: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap'
                    }}>
                      {roleConfig.shortLabel}
                    </span>
                    {isSelected && (
                      <Check size={16} style={{ color: '#10b981' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
