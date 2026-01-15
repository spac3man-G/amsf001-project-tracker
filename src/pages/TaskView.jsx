/**
 * Task View Page
 *
 * Aggregates tasks from deliverables across selected milestones
 * into a single, Excel-like editable grid view.
 *
 * @version 1.1
 * @created 16 January 2026
 * @updated 15 January 2026 - Added component filter
 * @phase Task View Feature
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ListChecks, Filter, RefreshCw, X, Layers } from 'lucide-react';
import { milestonesService, deliverablesService, planItemsService } from '../services';
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
  const [components, setComponents] = useState([]);
  const [milestoneComponentMap, setMilestoneComponentMap] = useState({});
  const [selectedComponentId, setSelectedComponentId] = useState('all');
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load components and milestones for filter
  const loadFilterData = useCallback(async () => {
    if (!projectId) return;

    try {
      // Load components
      const componentsData = await planItemsService.getComponents(projectId);
      setComponents(componentsData || []);

      // Load milestone-component mapping
      const mapData = await planItemsService.getMilestoneComponentMap(projectId);
      setMilestoneComponentMap(mapData || {});

      // Load milestones
      const milestonesData = await milestonesService.getAll(projectId);
      // Sort by milestone_ref
      const sorted = (milestonesData || []).sort((a, b) =>
        (a.milestone_ref || '').localeCompare(b.milestone_ref || '')
      );
      setMilestones(sorted);
    } catch (error) {
      console.error('Error loading filter data:', error);
      showError('Failed to load filter data');
    }
  }, [projectId, showError]);

  // Filter milestones by selected component
  const filteredMilestones = useMemo(() => {
    if (selectedComponentId === 'all') {
      return milestones;
    }
    return milestones.filter(m => {
      const componentInfo = milestoneComponentMap[m.id];
      return componentInfo?.component_id === selectedComponentId;
    });
  }, [milestones, milestoneComponentMap, selectedComponentId]);

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
      await loadFilterData();
      await loadTasks();
      setLoading(false);
    };
    loadData();
  }, [loadFilterData, loadTasks]);

  // Reload tasks when milestone selection changes
  useEffect(() => {
    if (!loading) {
      loadTasks();
    }
  }, [selectedMilestoneIds]);

  // Clear milestone selection when component filter changes
  useEffect(() => {
    setSelectedMilestoneIds([]);
  }, [selectedComponentId]);

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

  // Select all milestones (filtered by component)
  const selectAllMilestones = useCallback(() => {
    setSelectedMilestoneIds(filteredMilestones.map(m => m.id));
  }, [filteredMilestones]);

  // Clear milestone selection
  const clearMilestoneSelection = useCallback(() => {
    setSelectedMilestoneIds([]);
  }, []);

  // Get selected milestone names for display
  const selectedMilestoneNames = useMemo(() => {
    if (selectedMilestoneIds.length === 0) return 'All Milestones';
    if (selectedMilestoneIds.length === filteredMilestones.length && filteredMilestones.length > 0) return 'All Milestones';
    if (selectedMilestoneIds.length <= 2) {
      return filteredMilestones
        .filter(m => selectedMilestoneIds.includes(m.id))
        .map(m => m.milestone_ref)
        .join(', ');
    }
    return `${selectedMilestoneIds.length} milestones selected`;
  }, [selectedMilestoneIds, filteredMilestones]);

  // Get selected component name for display
  const selectedComponentName = useMemo(() => {
    if (selectedComponentId === 'all') return 'All Components';
    const comp = components.find(c => c.id === selectedComponentId);
    return comp?.name || 'Unknown';
  }, [selectedComponentId, components]);

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

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          {/* Component Filter */}
          {components.length > 0 && (
            <div className="filter-section component-filter-section">
              <div className="filter-header">
                <h3><Layers size={16} /> Filter by Component</h3>
              </div>
              <div className="component-filter">
                <select
                  value={selectedComponentId}
                  onChange={(e) => setSelectedComponentId(e.target.value)}
                  className="component-select"
                >
                  <option value="all">All Components</option>
                  {components.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.wbs ? `${comp.wbs} - ` : ''}{comp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Milestone Filter */}
          <div className="filter-section milestone-filter-section">
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
              {filteredMilestones.map(milestone => (
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

              {filteredMilestones.length === 0 && (
                <p className="no-milestones">
                  {selectedComponentId === 'all'
                    ? 'No milestones found in this project.'
                    : 'No milestones found for this component.'}
                </p>
              )}
            </div>
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
