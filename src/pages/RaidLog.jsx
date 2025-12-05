import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { raidService } from '../services';
import { 
  AlertTriangle, AlertCircle, CheckCircle, Info, Link2, 
  RefreshCw, Plus, Filter, X, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog, StatusBadge } from '../components/common';
import RaidDetailModal from '../components/raid/RaidDetailModal';
import RaidAddForm from '../components/raid/RaidAddForm';

export default function RaidLog() {
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
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
    Risk: true,
    Assumption: true,
    Issue: true,
    Dependency: true
  });

  // Category icons and colors
  const categoryConfig = {
    Risk: { 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    Assumption: { 
      icon: Info, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    Issue: { 
      icon: AlertCircle, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    Dependency: { 
      icon: Link2, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  };

  // Status configuration
  const statusConfig = {
    'Open': { color: 'bg-blue-100 text-blue-800' },
    'In Progress': { color: 'bg-yellow-100 text-yellow-800' },
    'Closed': { color: 'bg-gray-100 text-gray-800' },
    'Accepted': { color: 'bg-green-100 text-green-800' },
    'Mitigated': { color: 'bg-teal-100 text-teal-800' }
  };

  // Severity configuration
  const severityConfig = {
    'High': { color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
    'Medium': { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
    'Low': { color: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
  };

  // Fetch data
  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  async function fetchData() {
    try {
      const [itemsData, summaryData] = await Promise.all([
        raidService.getAllWithRelations(projectId),
        raidService.getSummary(projectId)
      ]);
      setItems(itemsData || []);
      setSummary(summaryData);
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
  const groupedItems = useMemo(() => {
    return {
      Risk: filteredItems.filter(i => i.category === 'Risk'),
      Assumption: filteredItems.filter(i => i.category === 'Assumption'),
      Issue: filteredItems.filter(i => i.category === 'Issue'),
      Dependency: filteredItems.filter(i => i.category === 'Dependency')
    };
  }, [filteredItems]);

  // Handle delete
  async function handleDelete() {
    if (!deleteDialog.item) return;
    try {
      await raidService.delete(deleteDialog.item.id, currentUserId);
      setDeleteDialog({ isOpen: false, item: null });
      await fetchData();
    } catch (error) {
      console.error('Error deleting RAID item:', error);
      alert('Failed to delete item. Please try again.');
    }
  }

  // Toggle category expansion
  function toggleCategory(category) {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="RAID Log"
        subtitle="Risks, Assumptions, Issues, and Dependencies"
        action={canCreate && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            Add Item
          </button>
        )}
      />

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Risks"
            value={summary.byCategory.Risk.total}
            subValue={`${summary.byCategory.Risk.open} open`}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            label="Assumptions"
            value={summary.byCategory.Assumption.total}
            subValue={`${summary.byCategory.Assumption.open} open`}
            icon={Info}
            color="blue"
          />
          <StatCard
            label="Issues"
            value={summary.byCategory.Issue.total}
            subValue={`${summary.byCategory.Issue.open} open`}
            icon={AlertCircle}
            color="orange"
          />
          <StatCard
            label="Dependencies"
            value={summary.byCategory.Dependency.total}
            subValue={`${summary.byCategory.Dependency.open} open`}
            icon={Link2}
            color="purple"
          />
        </div>
      )}

      {/* High Priority Alert */}
      {summary?.highPriorityItems?.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertTriangle size={18} />
            {summary.highPriorityItems.length} High Priority Items Requiring Attention
          </div>
          <div className="text-sm text-red-700">
            {summary.highPriorityItems.map(item => (
              <span 
                key={item.id} 
                className="inline-block mr-3 cursor-pointer hover:underline"
                onClick={() => setSelectedItem(items.find(i => i.id === item.id))}
              >
                {item.raid_ref}: {item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Categories</option>
          <option value="Risk">Risks</option>
          <option value="Assumption">Assumptions</option>
          <option value="Issue">Issues</option>
          <option value="Dependency">Dependencies</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
          <option value="Accepted">Accepted</option>
          <option value="Mitigated">Mitigated</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Clear Filters */}
        {(categoryFilter !== 'all' || statusFilter !== 'all' || severityFilter !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setCategoryFilter('all');
              setStatusFilter('all');
              setSeverityFilter('all');
              setSearchTerm('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X size={14} />
            Clear
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* RAID Categories */}
      <div className="space-y-4">
        {['Risk', 'Assumption', 'Issue', 'Dependency'].map(category => {
          const config = categoryConfig[category];
          const CategoryIcon = config.icon;
          const categoryItems = groupedItems[category];
          const isExpanded = expandedCategories[category];

          return (
            <div 
              key={category} 
              className={`bg-white rounded-lg border ${config.borderColor} overflow-hidden`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between p-4 ${config.bgColor} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon size={20} className={config.color} />
                  <span className={`font-semibold ${config.color}`}>
                    {category === 'Dependency' ? 'Dependencies' : `${category}s`}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({categoryItems.length} items)
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {categoryItems.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No {category.toLowerCase()}s found
                    </div>
                  ) : (
                    categoryItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono text-sm text-gray-500">
                                {item.raid_ref}
                              </span>
                              <span className="font-medium text-gray-900 truncate">
                                {item.title || item.description?.substring(0, 50)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.description}
                            </p>
                            {item.owner && (
                              <p className="text-xs text-gray-500 mt-1">
                                Owner: {item.owner.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Severity Badge */}
                            {item.severity && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityConfig[item.severity]?.color || 'bg-gray-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${severityConfig[item.severity]?.dot || 'bg-gray-400'}`} />
                                {item.severity}
                              </span>
                            )}
                            {/* Status Badge */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[item.status]?.color || 'bg-gray-100'}`}>
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
