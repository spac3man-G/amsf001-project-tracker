// src/pages/AuditLog.jsx
// Admin page to view audit trail of all changes
// Version 1.0 - Created 30 November 2025

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { PageHeader, LoadingSpinner } from '../components/common';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Archive, 
  RotateCcw,
  Filter,
  Calendar,
  User,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

// Action icons and colors
const ACTION_CONFIG = {
  INSERT: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100', label: 'Created' },
  UPDATE: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Updated' },
  DELETE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', label: 'Deleted' },
  SOFT_DELETE: { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Archived' },
  RESTORE: { icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Restored' }
};

// Table display names
const TABLE_NAMES = {
  timesheets: 'Timesheet',
  expenses: 'Expense',
  resources: 'Resource',
  partners: 'Partner',
  milestones: 'Milestone',
  deliverables: 'Deliverable',
  kpis: 'KPI',
  quality_standards: 'Quality Standard',
  partner_invoices: 'Invoice'
};

export default function AuditLog() {
  const { profile } = useAuth();
  const { currentProject } = useProject();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    table: '',
    action: '',
    user: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Unique users for filter dropdown
  const [uniqueUsers, setUniqueUsers] = useState([]);

  // Check permissions
  const canView = profile?.role === 'admin' || profile?.role === 'supplier_pm';

  const fetchLogs = useCallback(async (reset = false) => {
    if (!canView || !currentProject?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 0 : page;
      if (reset) setPage(0);
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
      // Apply filters
      if (filters.table) {
        query = query.eq('table_name', filters.table);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.user) {
        query = query.eq('user_email', filters.user);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (reset) {
        setLogs(data || []);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data?.length || 0) === PAGE_SIZE);
      
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canView, currentProject?.id, filters, page]);

  // Fetch unique users for filter
  const fetchUniqueUsers = useCallback(async () => {
    if (!canView || !currentProject?.id) return;
    
    const { data } = await supabase
      .from('audit_log')
      .select('user_email')
      .eq('project_id', currentProject.id)
      .not('user_email', 'is', null);
    
    if (data) {
      const unique = [...new Set(data.map(d => d.user_email))].filter(Boolean);
      setUniqueUsers(unique);
    }
  }, [canView, currentProject?.id]);

  useEffect(() => {
    fetchLogs(true);
    fetchUniqueUsers();
  }, [fetchLogs, fetchUniqueUsers]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs(true);
  };

  const clearFilters = () => {
    setFilters({
      table: '',
      action: '',
      user: '',
      dateFrom: '',
      dateTo: ''
    });
    // Fetch will be triggered by useEffect when filters change
  };

  const toggleExpanded = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatChangedFields = (fields) => {
    if (!fields || fields.length === 0) return null;
    return fields.join(', ');
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          You do not have permission to view audit logs.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="audit-log-page">
      <PageHeader 
        title="Audit Log" 
        subtitle="Track all changes made to project data"
        icon={FileText}
      />

      {/* Filter Panel */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Filters</span>
            {Object.values(filters).some(v => v) && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Table filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Database className="w-3 h-3 inline mr-1" />
                  Table
                </label>
                <select
                  value={filters.table}
                  onChange={(e) => handleFilterChange('table', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Tables</option>
                  {Object.entries(TABLE_NAMES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {/* Action filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Actions</option>
                  {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              
              {/* User filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-3 h-3 inline mr-1" />
                  User
                </label>
                <select
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>
              
              {/* Date from */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              
              {/* Date to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && logs.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No audit logs found</p>
          {Object.values(filters).some(v => v) && (
            <p className="text-sm mt-2">Try adjusting your filters</p>
          )}
        </div>
      )}

      {/* Audit log table */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Changes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const actionConfig = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                  const ActionIcon = actionConfig.icon;
                  const isExpanded = expandedRows.has(log.id);
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionConfig.bg} ${actionConfig.color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {actionConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {TABLE_NAMES[log.table_name] || log.table_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.user_email || 'System'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.changed_fields && log.changed_fields.length > 0 ? (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {formatChangedFields(log.changed_fields)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
                          >
                            {isExpanded ? 'Hide' : 'View'}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Old data */}
                              {log.old_data && (
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                                    Previous Values
                                  </h4>
                                  <pre className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto max-h-48">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {/* New data */}
                              {log.new_data && (
                                <div>
                                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                                    New Values
                                  </h4>
                                  <pre className="text-xs bg-white border border-gray-200 rounded p-3 overflow-auto max-h-48">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 text-xs text-gray-500">
                              Record ID: <code className="bg-gray-200 px-1 rounded">{log.record_id}</code>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Load more */}
          {hasMore && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setPage(prev => prev + 1);
                  fetchLogs();
                }}
                disabled={loading}
                className="text-primary hover:text-primary-dark text-sm disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats summary */}
      {logs.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          Showing {logs.length} entries
        </div>
      )}
    </div>
  );
}
