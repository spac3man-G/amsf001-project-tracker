// src/pages/DeletedItems.jsx
// Admin page to view and restore soft-deleted items
// Version 1.0 - Created 30 November 2025

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { PageHeader, LoadingSpinner, ConfirmDialog } from '../components/common';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Clock,
  User,
  Filter,
  RefreshCw,
  Archive,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  CheckSquare,
  Briefcase,
  FileText
} from 'lucide-react';

// Table configurations
const TABLE_CONFIG = {
  timesheets: {
    label: 'Timesheets',
    icon: Clock,
    color: 'bg-blue-100 text-blue-700',
    displayField: (item) => `${item.date} - ${item.hours_worked || item.hours || 0}h`,
    descriptionField: (item) => item.description || item.comments || 'No description'
  },
  expenses: {
    label: 'Expenses',
    icon: DollarSign,
    color: 'bg-green-100 text-green-700',
    displayField: (item) => `${item.expense_ref || 'Expense'} - £${(item.amount || 0).toFixed(2)}`,
    descriptionField: (item) => item.reason || item.category || 'No description'
  },
  resources: {
    label: 'Resources',
    icon: User,
    color: 'bg-purple-100 text-purple-700',
    displayField: (item) => item.name,
    descriptionField: (item) => item.role || item.email || 'No role'
  },
  partners: {
    label: 'Partners',
    icon: Briefcase,
    color: 'bg-amber-100 text-amber-700',
    displayField: (item) => item.name,
    descriptionField: (item) => item.contact_email || 'No contact'
  },
  milestones: {
    label: 'Milestones',
    icon: Target,
    color: 'bg-indigo-100 text-indigo-700',
    displayField: (item) => `${item.milestone_ref || ''} - ${item.name}`,
    descriptionField: (item) => item.description?.substring(0, 100) || 'No description'
  },
  deliverables: {
    label: 'Deliverables',
    icon: CheckSquare,
    color: 'bg-teal-100 text-teal-700',
    displayField: (item) => `${item.deliverable_ref || ''} - ${item.name}`,
    descriptionField: (item) => item.description?.substring(0, 100) || 'No description'
  },
  kpis: {
    label: 'KPIs',
    icon: Target,
    color: 'bg-rose-100 text-rose-700',
    displayField: (item) => item.name,
    descriptionField: (item) => `Target: ${item.target_value || 'N/A'}`
  },
  quality_standards: {
    label: 'Quality Standards',
    icon: CheckSquare,
    color: 'bg-cyan-100 text-cyan-700',
    displayField: (item) => item.name,
    descriptionField: (item) => `Target: ${item.target_value || 'N/A'}%`
  },
  partner_invoices: {
    label: 'Invoices',
    icon: FileText,
    color: 'bg-orange-100 text-orange-700',
    displayField: (item) => `${item.invoice_number || 'Invoice'} - £${(item.total || 0).toFixed(2)}`,
    descriptionField: (item) => `Period: ${item.period_start || 'N/A'} to ${item.period_end || 'N/A'}`
  }
};

export default function DeletedItems() {
  const { profile } = useAuth();
  const { currentProject } = useProject();
  const { showSuccess, showError } = useToast();
  
  const [deletedItems, setDeletedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmPurge, setConfirmPurge] = useState(null);
  
  // Filter
  const [tableFilter, setTableFilter] = useState('');
  const [showOldOnly, setShowOldOnly] = useState(false);
  
  // Expanded tables
  const [expandedTables, setExpandedTables] = useState(new Set(['timesheets', 'expenses']));

  // Check permissions
  const canView = profile?.role === 'admin' || profile?.role === 'supplier_pm';
  const canPurge = profile?.role === 'admin';

  const fetchDeletedItems = useCallback(async () => {
    if (!canView || !currentProject?.id) return;
    
    try {
      setLoading(true);
      
      const tables = Object.keys(TABLE_CONFIG);
      const results = {};
      
      for (const table of tables) {
        let query = supabase
          .from(table)
          .select('*')
          .eq('project_id', currentProject.id)
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false });
        
        // Filter old items (> 30 days)
        if (showOldOnly) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.lt('deleted_at', thirtyDaysAgo.toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error fetching deleted ${table}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          results[table] = data;
        }
      }
      
      setDeletedItems(results);
      
    } catch (err) {
      console.error('Error fetching deleted items:', err);
      showError('Failed to load deleted items');
    } finally {
      setLoading(false);
    }
  }, [canView, currentProject?.id, showOldOnly, showError]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

  const handleRestore = async (table, item) => {
    try {
      setRestoring(item.id);
      
      const { error } = await supabase
        .from(table)
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', item.id);
      
      if (error) throw error;
      
      showSuccess(`${TABLE_CONFIG[table].label.slice(0, -1)} restored successfully`);
      setConfirmRestore(null);
      fetchDeletedItems();
      
    } catch (err) {
      console.error('Error restoring item:', err);
      showError('Failed to restore item: ' + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (table, item) => {
    if (!canPurge) {
      showError('Only admins can permanently delete items');
      return;
    }
    
    try {
      setRestoring(item.id);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      showSuccess(`${TABLE_CONFIG[table].label.slice(0, -1)} permanently deleted`);
      setConfirmPurge(null);
      fetchDeletedItems();
      
    } catch (err) {
      console.error('Error permanently deleting item:', err);
      showError('Failed to delete item: ' + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const toggleTable = (table) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return null;
    const deleted = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const totalDeleted = Object.values(deletedItems).reduce((sum, items) => sum + items.length, 0);
  
  // Filter tables to show
  const tablesToShow = tableFilter 
    ? { [tableFilter]: deletedItems[tableFilter] || [] }
    : deletedItems;

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          You do not have permission to view deleted items.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader 
        title="Deleted Items" 
        subtitle="View and restore soft-deleted records"
        icon={Archive}
      />

      {/* Summary */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">
              {totalDeleted} deleted {totalDeleted === 1 ? 'item' : 'items'} found
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Items shown here have been soft-deleted and can be restored. 
              {canPurge && ' Admins can permanently delete items.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Tables</option>
            {Object.entries(TABLE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOldOnly}
            onChange={(e) => setShowOldOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show only items &gt; 30 days old
        </label>
        
        <button
          onClick={fetchDeletedItems}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && totalDeleted === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No deleted items found</p>
          <p className="text-sm mt-2">Items you delete will appear here for recovery</p>
        </div>
      )}

      {/* Deleted items by table */}
      {!loading && Object.entries(tablesToShow).map(([table, items]) => {
        if (!items || items.length === 0) return null;
        
        const config = TABLE_CONFIG[table];
        const Icon = config.icon;
        const isExpanded = expandedTables.has(table);
        
        return (
          <div key={table} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table header */}
            <button
              onClick={() => toggleTable(table)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-medium">{config.label}</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Table items */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deleted</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {config.displayField(item)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {config.descriptionField(item)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div>{formatDate(item.deleted_at)}</div>
                          <div className="text-xs text-gray-400">{getDaysAgo(item.deleted_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setConfirmRestore({ table, item })}
                              disabled={restoring === item.id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Restore
                            </button>
                            {canPurge && (
                              <button
                                onClick={() => setConfirmPurge({ table, item })}
                                disabled={restoring === item.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                Purge
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirm restore dialog */}
      {confirmRestore && (
        <ConfirmDialog
          title="Restore Item"
          message={`Are you sure you want to restore this ${TABLE_CONFIG[confirmRestore.table].label.slice(0, -1).toLowerCase()}? It will be visible again in the application.`}
          confirmLabel="Restore"
          confirmStyle="primary"
          onConfirm={() => handleRestore(confirmRestore.table, confirmRestore.item)}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* Confirm purge dialog */}
      {confirmPurge && (
        <ConfirmDialog
          title="Permanently Delete"
          message={`Are you sure you want to PERMANENTLY delete this ${TABLE_CONFIG[confirmPurge.table].label.slice(0, -1).toLowerCase()}? This action cannot be undone!`}
          confirmLabel="Delete Forever"
          confirmStyle="danger"
          onConfirm={() => handlePermanentDelete(confirmPurge.table, confirmPurge.item)}
          onCancel={() => setConfirmPurge(null)}
        />
      )}
    </div>
  );
}
