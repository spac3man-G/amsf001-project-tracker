/**
 * Task View Page
 *
 * Aggregates tasks from deliverables across selected milestones
 * into a single, Excel-like editable grid view.
 *
 * @version 1.0
 * @created 16 January 2026
 * @phase Task View Feature
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ListChecks, Filter, RefreshCw, X } from 'lucide-react';
import { milestonesService, deliverablesService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '../components/common';
import { TaskGridView } from '../components/tasks';
import './TaskView.css';

export default function TaskView() {
  const { projectId } = useProject();
  const { user } = useAuth();
  const { showError } = useToast();
  const { canEditDeliverable } = usePermissions();

  // State
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load milestones for filter
  const loadMilestones = useCallback(async () => {
    if (!projectId) return;

    try {
      const data = await milestonesService.getAll(projectId);
      // Sort by milestone_ref
      const sorted = (data || []).sort((a, b) =>
        (a.milestone_ref || '').localeCompare(b.milestone_ref || '')
      );
      setMilestones(sorted);
    } catch (error) {
      console.error('Error loading milestones:', error);
      showError('Failed to load milestones');
    }
  }, [projectId, showError]);

  // Load tasks based on selected milestones
  const loadTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      const data = await deliverablesService.getTasksForMilestones(
        projectId,
        selectedMilestoneIds
      );
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showError('Failed to load tasks');
      setTasks([]);
    }
  }, [projectId, selectedMilestoneIds, showError]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadMilestones();
      await loadTasks();
      setLoading(false);
    };
    loadData();
  }, [loadMilestones, loadTasks]);

  // Reload tasks when milestone selection changes
  useEffect(() => {
    if (!loading) {
      loadTasks();
    }
  }, [selectedMilestoneIds]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  // Toggle milestone selection
  const toggleMilestone = useCallback((milestoneId) => {
    setSelectedMilestoneIds(prev => {
      if (prev.includes(milestoneId)) {
        return prev.filter(id => id !== milestoneId);
      }
      return [...prev, milestoneId];
    });
  }, []);

  // Select all milestones
  const selectAllMilestones = useCallback(() => {
    setSelectedMilestoneIds(milestones.map(m => m.id));
  }, [milestones]);

  // Clear milestone selection
  const clearMilestoneSelection = useCallback(() => {
    setSelectedMilestoneIds([]);
  }, []);

  // Get selected milestone names for display
  const selectedMilestoneNames = useMemo(() => {
    if (selectedMilestoneIds.length === 0) return 'All Milestones';
    if (selectedMilestoneIds.length === milestones.length) return 'All Milestones';
    if (selectedMilestoneIds.length <= 2) {
      return milestones
        .filter(m => selectedMilestoneIds.includes(m.id))
        .map(m => m.milestone_ref)
        .join(', ');
    }
    return `${selectedMilestoneIds.length} milestones selected`;
  }, [selectedMilestoneIds, milestones]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Loading task view..." />
      </div>
    );
  }

  return (
    <div className="page-container task-view-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="page-title">
            <ListChecks size={24} />
            <h1>Task View</h1>
          </div>
          <p className="page-subtitle">
            View and manage tasks across milestones
          </p>
        </div>

        <div className="header-right">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            <span>{selectedMilestoneNames}</span>
          </button>
        </div>
      </div>

      {/* Milestone Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Filter by Milestone</h3>
            <div className="filter-actions">
              <button onClick={selectAllMilestones} className="filter-action-btn">
                Select All
              </button>
              <button onClick={clearMilestoneSelection} className="filter-action-btn">
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="filter-close-btn"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="milestone-chips">
            {milestones.map(milestone => (
              <button
                key={milestone.id}
                onClick={() => toggleMilestone(milestone.id)}
                className={`milestone-chip ${
                  selectedMilestoneIds.includes(milestone.id) ? 'selected' : ''
                }`}
              >
                <span className="chip-ref">{milestone.milestone_ref}</span>
                <span className="chip-name">{milestone.name}</span>
              </button>
            ))}

            {milestones.length === 0 && (
              <p className="no-milestones">No milestones found in this project.</p>
            )}
          </div>
        </div>
      )}

      {/* Task Grid */}
      <TaskGridView
        tasks={tasks}
        onTaskUpdate={handleRefresh}
        onRefresh={handleRefresh}
        canEdit={canEditDeliverable}
        isLoading={refreshing}
      />
    </div>
  );
}
