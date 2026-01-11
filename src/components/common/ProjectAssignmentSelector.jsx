/**
 * ProjectAssignmentSelector - Multi-project selection with role assignment
 *
 * Allows selecting multiple projects and assigning a role for each.
 * Used in the invitation flow to pre-assign projects.
 *
 * @version 1.0
 * @created 11 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FolderKanban, X, Plus, ChevronDown } from 'lucide-react';
import { ROLE_OPTIONS, ROLE_CONFIG } from '../../lib/permissionMatrix';
import { supabase } from '../../lib/supabase';
import './ProjectAssignmentSelector.css';

export default function ProjectAssignmentSelector({
  organisationId,
  assignments = [],     // Array of { projectId, role }
  onChange,             // (newAssignments) => void
  disabled = false,
  defaultRole = 'viewer'
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Fetch organisation's projects
  const fetchProjects = useCallback(async () => {
    if (!organisationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, reference')
        .eq('organisation_id', organisationId)
        .order('name');

      if (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Projects not yet assigned
  const availableProjects = projects.filter(
    p => !assignments.some(a => a.projectId === p.id)
  );

  const handleAddProject = (projectId) => {
    if (!projectId) return;
    onChange([...assignments, { projectId, role: defaultRole }]);
    setShowAddDropdown(false);
  };

  const handleRemoveProject = (projectId) => {
    onChange(assignments.filter(a => a.projectId !== projectId));
  };

  const handleRoleChange = (projectId, newRole) => {
    onChange(
      assignments.map(a =>
        a.projectId === projectId ? { ...a, role: newRole } : a
      )
    );
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.reference} - ${project.name}` : 'Unknown Project';
  };

  const getProjectReference = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.reference || '???';
  };

  if (loading) {
    return (
      <div className="project-assignment-selector loading">
        <div className="selector-header">
          <FolderKanban size={16} />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="project-assignment-selector empty">
        <div className="selector-header">
          <FolderKanban size={16} />
          <span>Project Assignments</span>
        </div>
        <p className="no-projects-message">No projects in this organisation yet.</p>
      </div>
    );
  }

  return (
    <div className="project-assignment-selector">
      <div className="selector-header">
        <FolderKanban size={16} />
        <span>Project Assignments</span>
        <span className="optional-badge">Optional</span>
      </div>

      {/* Selected Projects */}
      {assignments.length > 0 && (
        <div className="selected-projects">
          {assignments.map(({ projectId, role }) => (
            <div key={projectId} className="project-assignment-row">
              <div className="project-info">
                <span className="project-ref">{getProjectReference(projectId)}</span>
                <span className="project-name">{getProjectName(projectId)}</span>
              </div>
              <div className="project-actions">
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(projectId, e.target.value)}
                  disabled={disabled}
                  className="role-select"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(projectId)}
                  disabled={disabled}
                  className="btn-remove"
                  title="Remove project assignment"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Button/Dropdown */}
      {availableProjects.length > 0 && (
        <div className="add-project-container">
          {showAddDropdown ? (
            <div className="add-project-dropdown">
              <select
                autoFocus
                value=""
                onChange={(e) => handleAddProject(e.target.value)}
                onBlur={() => setTimeout(() => setShowAddDropdown(false), 150)}
                disabled={disabled}
                className="project-select"
              >
                <option value="">Select a project...</option>
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reference} - {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddDropdown(false)}
                className="btn-cancel-add"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddDropdown(true)}
              disabled={disabled}
              className="btn-add-project"
            >
              <Plus size={14} />
              Add Project
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      {assignments.length === 0 ? (
        <p className="helper-text">
          User will be added to the organisation only. You can assign projects now or later.
        </p>
      ) : (
        <p className="helper-text">
          {assignments.length} project{assignments.length !== 1 ? 's' : ''} will be assigned when the user joins.
        </p>
      )}
    </div>
  );
}
