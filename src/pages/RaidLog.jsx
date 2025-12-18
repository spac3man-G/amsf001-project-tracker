/**
 * RAID Log Page
 * 
 * Risks, Assumptions, Issues, and Dependencies tracking.
 * Apple-inspired design with clean visual hierarchy.
 * 
 * @version 2.0
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, Info, AlertCircle, Link2, 
  RefreshCw, Plus, Search, X, ChevronDown, User, Calendar
} from 'lucide-react';
import './RaidLog.css';
import { raidService } from '../services';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import RaidDetailModal from '../components/raid/RaidDetailModal';
import RaidAddForm from '../components/raid/RaidAddForm';

// Category configuration
const CATEGORIES = {
  Risk: { icon: AlertTriangle, className: 'risk', plural: 'Risks' },
  Assumption: { icon: Info, className: 'assumption', plural: 'Assumptions' },
  Issue: { icon: AlertCircle, className: 'issue', plural: 'Issues' },
  Dependency: { icon: Link2, className: 'dependency', plural: 'Dependencies' }
};

export default function RaidLog() {
  const { user } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;
  
  // Permissions
  const { can } = usePermissions();
  const canCreate = can('raid', 'create');
  const canEdit = can('raid', 'edit');
  const canDelete = can('raid', 'delete');

  // State
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState({
    Risk: true, Assumption: true, Issue: true, Dependency: true
  });

  // Fetch data
  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  async function fetchData() {
    try {
      const [itemsData, summaryData] = await Promise.all([
        raidService.getAllWithRelations(projectId),
        raidService.getSummary(projectId)
      ]);
      setItems(itemsData || []);
      setSummary(summaryData);
      
      // Fetch team members for owner dropdown
      const { data: userProjectsData, error: upError } = await supabase
        .from('user_projects')
        .select(`
          user_id,
          role,
          profiles:user_id(id, full_name, email)
        `)
        .eq('project_id', projectId);
      
      if (upError) {
        console.error('Error fetching team members for RAID:', upError);
      }
      
      const members = (userProjectsData || [])
        .filter(up => up.profiles)
        .map(up => ({
          id: up.profiles.id,
          name: up.profiles.full_name || up.profiles.email,
          email: up.profiles.email,
          role: up.role
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('RAID teamMembers loaded:', members.length, 'members');
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching RAID data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  // Check if any filters are active
  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all' || 
                           severityFilter !== 'all' || searchTerm;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          item.raid_ref?.toLowerCase().includes(search) ||
          item.title?.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [items, categoryFilter, statusFilter, severityFilter, searchTerm]);

  // Group items by category
  const groupedItems = useMemo(() => ({
    Risk: filteredItems.filter(i => i.category === 'Risk'),
    Assumption: filteredItems.filter(i => i.category === 'Assumption'),
    Issue: filteredItems.filter(i => i.category === 'Issue'),
    Dependency: filteredItems.filter(i => i.category === 'Dependency')
  }), [filteredItems]);

  // Handle delete
  async function handleDelete() {
    if (!deleteDialog.item) return;
    try {
      await raidService.delete(deleteDialog.item.id, currentUserId);
      setDeleteDialog({ isOpen: false, item: null });
      await fetchData();
    } catch (error) {
      console.error('Error deleting RAID item:', error);
      alert('Failed to delete item');
    }
  }

  function clearFilters() {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSeverityFilter('all');
    setSearchTerm('');
  }

  if (loading) {
    return (
      <div className="raid-log" data-testid="raid-log-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="raid-log">
      {/* Header */}
      <header className="raid-header" data-testid="raid-header">
        <div className="raid-header-content">
          <div className="raid-header-left">
            <h1>RAID Log</h1>
            <p>Risks, Assumptions, Issues, and Dependencies</p>
          </div>
          <div className="raid-header-actions">
            <button 
              className="raid-btn raid-btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              data-testid="raid-refresh-button"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {canCreate && (
              <button 
                className="raid-btn raid-btn-primary"
                onClick={() => setShowAddForm(true)}
                data-testid="raid-add-button"
              >
                <Plus size={16} />
                Add Item
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="raid-content">
        {/* Summary Cards */}
        {summary && (
          <div className="raid-summary-grid" data-testid="raid-summary-grid">
            {Object.entries(CATEGORIES).map(([category, config]) => {
              const Icon = config.icon;
              const stats = summary.byCategory[category] || { total: 0, open: 0 };
              return (
                <div 
                  key={category}
                  className={`raid-summary-card ${config.className}`}
                  onClick={() => setCategoryFilter(category)}
                >
                  <div className="raid-summary-icon">
                    <Icon size={22} />
                  </div>
                  <div className="raid-summary-value">{stats.total}</div>
                  <div className="raid-summary-label">{config.plural}</div>
                  <div className="raid-summary-sub">{stats.open} open</div>
                </div>
              );
            })}
          </div>
        )}

        {/* High Priority Alert */}
        {summary?.highPriorityItems?.length > 0 && (
          <div className="raid-priority-alert">
            <div className="raid-priority-header">
              <AlertTriangle size={18} />
              <span>{summary.highPriorityItems.length} High Priority Items Requiring Attention</span>
            </div>
            <div className="raid-priority-items">
              {summary.highPriorityItems.map(item => (
                <div 
                  key={item.id}
                  className="raid-priority-item"
                  onClick={() => setSelectedItem(items.find(i => i.id === item.id))}
                >
                  <span className="raid-priority-ref">{item.raid_ref}</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="raid-filter-bar" data-testid="raid-filter-bar">
          <div className="raid-search" data-testid="raid-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search RAID items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="raid-search-input"
            />
          </div>

          <select
            className="raid-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            data-testid="raid-category-filter"
          >
            <option value="all">All Categories</option>
            <option value="Risk">Risks</option>
            <option value="Assumption">Assumptions</option>
            <option value="Issue">Issues</option>
            <option value="Dependency">Dependencies</option>
          </select>

          <select
            className="raid-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="raid-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
            <option value="Accepted">Accepted</option>
            <option value="Mitigated">Mitigated</option>
          </select>

          <select
            className="raid-filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            data-testid="raid-severity-filter"
          >
            <option value="all">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {hasActiveFilters && (
            <button className="raid-clear-filters" onClick={clearFilters} data-testid="raid-clear-filters">
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        {/* Category Sections */}
        <div className="raid-categories">
          {Object.entries(CATEGORIES).map(([category, config]) => {
            const Icon = config.icon;
            const categoryItems = groupedItems[category];
            const isExpanded = expandedCategories[category];

            return (
              <div key={category} className={`raid-category ${config.className} ${isExpanded ? 'expanded' : ''}`} data-testid={`raid-category-${category.toLowerCase()}`}>
                <button
                  className="raid-category-header"
                  onClick={() => setExpandedCategories(prev => ({
                    ...prev, [category]: !prev[category]
                  }))}
                >
                  <div className="raid-category-left">
                    <div className="raid-category-icon">
                      <Icon size={18} />
                    </div>
                    <span className="raid-category-title">
                      {config.plural}
                      <span className="raid-category-count">({categoryItems.length})</span>
                    </span>
                  </div>
                  <ChevronDown size={20} className="raid-category-chevron" />
                </button>

                {isExpanded && (
                  <div className="raid-items-list">
                    {categoryItems.length === 0 ? (
                      <div className="raid-empty">
                        <Icon size={32} className="raid-empty-icon" />
                        <div className="raid-empty-text">No {config.plural.toLowerCase()} found</div>
                      </div>
                    ) : (
                      categoryItems.map(item => (
                        <div
                          key={item.id}
                          className="raid-item"
                          onClick={() => setSelectedItem(item)}
                          data-testid={`raid-item-${item.id}`}
                        >
                          <div className="raid-item-main">
                            <div className="raid-item-content">
                              <div className="raid-item-header">
                                <span className="raid-item-ref">{item.raid_ref}</span>
                                <span className="raid-item-title">{item.title || 'Untitled'}</span>
                              </div>
                              <div className="raid-item-description">{item.description}</div>
                              <div className="raid-item-meta">
                                {item.owner && (
                                  <span className="raid-item-meta-item">
                                    <User size={14} />
                                    {item.owner.name}
                                  </span>
                                )}
                                {item.due_date && (
                                  <span className="raid-item-meta-item">
                                    <Calendar size={14} />
                                    {new Date(item.due_date).toLocaleDateString('en-GB', {
                                      day: 'numeric', month: 'short'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="raid-item-badges">
                              {item.severity && (
                                <span className={`raid-badge severity-${item.severity.toLowerCase()}`}>
                                  <span className="raid-badge-dot" />
                                  {item.severity}
                                </span>
                              )}
                              <span className={`raid-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <RaidAddForm
          projectId={projectId}
          onClose={() => setShowAddForm(false)}
          onSaved={() => {
            setShowAddForm(false);
            fetchData();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <RaidDetailModal
          item={selectedItem}
          canEdit={canEdit}
          canDelete={canDelete}
          teamMembers={teamMembers}
          onClose={() => setSelectedItem(null)}
          onUpdate={async (updates) => {
            await raidService.update(selectedItem.id, updates);
            await fetchData();
            setSelectedItem(null);
          }}
          onDelete={() => {
            setDeleteDialog({ isOpen: true, item: selectedItem });
            setSelectedItem(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete RAID Item"
        message={`Are you sure you want to delete ${deleteDialog.item?.raid_ref}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
      />
    </div>
  );
}
