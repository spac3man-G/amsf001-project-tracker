/**
 * Project Settings Page - Unified tabbed interface
 * Combines: Settings, Audit Log, Deleted Items
 * 
 * @version 1.1 - Fixed missing X icon import and toFixed safety checks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { milestonesService } from '../services';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  Target, 
  Info,
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
  Briefcase,
  CheckSquare,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { useResourcePermissions } from '../hooks/useResourcePermissions';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, PageHeader, ConfirmDialog } from '../components/common';
import { resourcesService, timesheetsService, partnersService } from '../services';
import { timesheetContributesToSpend, hoursToDays } from '../config/metricsConfig';
import {
  RESOURCE_TYPE,
  sfiaToDisplay,
  sfiaToDatabase,
  getSfiaCssClass,
  getSfiaOptions,
  getRoleOptions,
  getResourceTypeConfig,
  calculateMargin,
  getMarginConfig,
  calculateSellValue
} from '../lib/resourceCalculations';
import './ProjectSettings.css';

// Tab configuration
const TABS = [
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'resources', label: 'Resources', icon: User },
  { id: 'audit', label: 'Audit Log', icon: FileText },
  { id: 'deleted', label: 'Deleted Items', icon: Trash2 }
];

export default function ProjectSettings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { projectId, currentProject, refreshProject } = useProject();
  const { canAccessSettings, userRole } = usePermissions();
  const { showSuccess, showError } = useToast();

  // Active tab from URL or default
  const activeTab = searchParams.get('tab') || 'settings';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && userRole) {
      if (!canAccessSettings) {
        navigate('/dashboard');
        return;
      }
      setLoading(false);
    }
  }, [projectId, userRole, canAccessSettings, navigate]);

  if (loading || !projectId) {
    return <LoadingSpinner message="Loading project settings..." size="large" fullPage />;
  }

  if (!canAccessSettings) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p style={{ color: '#64748b' }}>You don't have permission to access project settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-settings-page">
      <div className="project-settings-header">
        <div className="project-settings-icon">
          <SettingsIcon size={32} />
        </div>
        <div className="project-settings-title">
          <h1>Project Settings</h1>
          <p>Configure project parameters, view audit logs, and manage deleted items</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="project-settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="project-settings-content">
        {activeTab === 'settings' && (
          <SettingsTab 
            projectId={projectId}
            refreshProject={refreshProject}
          />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab 
            projectId={projectId}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
        {activeTab === 'audit' && (
          <AuditLogTab 
            projectId={projectId}
            profile={profile}
          />
        )}
        {activeTab === 'deleted' && (
          <DeletedItemsTab 
            projectId={projectId}
            profile={profile}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================
function SettingsTab({ projectId, refreshProject }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const [settings, setSettings] = useState({
    name: '',
    reference: '',
    total_budget: 0,
    pmo_threshold: 15
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [savingMilestone, setSavingMilestone] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [projectId]);

  async function fetchSettings() {
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      if (project) {
        const settingsData = {
          name: project.name || '',
          reference: project.reference || '',
          total_budget: project.total_budget || 0,
          pmo_threshold: project.pmo_threshold || 15
        };
        setSettings(settingsData);
        setOriginalSettings(settingsData);
      }

      const milestonesData = await milestonesService.getAll(projectId, {
        orderBy: { column: 'milestone_ref', ascending: true }
      });
      setMilestones(milestonesData || []);
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setSaveStatus(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: settings.name,
          total_budget: parseFloat(settings.total_budget) || 0,
          pmo_threshold: parseInt(settings.pmo_threshold) || 15
        })
        .eq('id', projectId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows returned.');
      }

      setOriginalSettings({ ...settings });
      setSaveStatus('success');
      
      if (refreshProject) refreshProject();
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMilestoneBudgetChange(milestoneId, newBudget) {
    setSavingMilestone(milestoneId);
    
    try {
      await milestonesService.update(milestoneId, { 
        budget: parseFloat(newBudget) || 0 
      });

      setMilestones(milestones.map(m => 
        m.id === milestoneId ? { ...m, budget: parseFloat(newBudget) || 0 } : m
      ));
    } catch (error) {
      console.error('Error updating milestone budget:', error);
    } finally {
      setSavingMilestone(null);
    }
  }

  const totalAllocated = milestones.reduce((sum, m) => sum + (parseFloat(m.billable) || 0), 0);
  const unallocated = parseFloat(settings.total_budget) - totalAllocated;
  const allocationPercent = settings.total_budget > 0 
    ? Math.round((totalAllocated / settings.total_budget) * 100) 
    : 0;

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="settings-tab">
      {/* Save Button Header */}
      <div className="settings-actions">
        {saveStatus === 'success' && (
          <span className="save-status success">
            <CheckCircle size={18} /> Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="save-status error">
            <AlertCircle size={18} /> Error saving
          </span>
        )}
        <button 
          className="btn btn-primary" 
          onClick={handleSaveSettings}
          disabled={saving || !hasChanges}
        >
          {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Project Information Card */}
      <div className="section-card">
        <h3><Target size={20} /> Project Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input 
              className="form-input" 
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project Reference</label>
            <input 
              className="form-input" 
              value={settings.reference}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
            <span className="form-hint">Reference cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label">Total Project Budget (£)</label>
            <input 
              className="form-input" 
              type="number"
              min="0"
              step="0.01"
              value={settings.total_budget}
              onChange={(e) => setSettings({ ...settings, total_budget: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PMO Threshold (%)</label>
            <input 
              className="form-input" 
              type="number"
              min="0"
              max="100"
              value={settings.pmo_threshold}
              onChange={(e) => setSettings({ ...settings, pmo_threshold: e.target.value })}
            />
            <span className="form-hint">Percentage of budget allocated to PMO overhead</span>
          </div>
        </div>
      </div>

      {/* Budget Allocation Card */}
      <div className="section-card">
        <h3><DollarSign size={20} /> Milestone Budget Allocation</h3>
        
        <div className="budget-summary">
          <div className="budget-stat">
            <div className="budget-label">Total Budget</div>
            <div className="budget-value">£{parseFloat(settings.total_budget).toLocaleString()}</div>
          </div>
          <div className="budget-stat">
            <div className="budget-label">Allocated to Milestones</div>
            <div className="budget-value allocated">£{totalAllocated.toLocaleString()}</div>
          </div>
          <div className="budget-stat">
            <div className="budget-label">Unallocated</div>
            <div className={`budget-value ${unallocated < 0 ? 'negative' : 'positive'}`}>
              £{unallocated.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="allocation-progress">
          <div className="progress-label">
            <span>Allocation Progress</span>
            <span>{allocationPercent}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(allocationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Milestones Table */}
        <table className="milestones-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Name</th>
              <th>Billable Amount (£)</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((milestone) => (
              <tr key={milestone.id}>
                <td><strong>{milestone.milestone_ref}</strong></td>
                <td>{milestone.name}</td>
                <td>
                  <input
                    type="number"
                    className="budget-input"
                    value={milestone.billable || ''}
                    onChange={(e) => handleMilestoneBudgetChange(milestone.id, e.target.value)}
                    disabled={savingMilestone === milestone.id}
                  />
                </td>
                <td>
                  {settings.total_budget > 0 
                    ? ((parseFloat(milestone.billable) || 0) / settings.total_budget * 100).toFixed(1)
                    : '0.0'}%
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={2}><strong>Total Allocated</strong></td>
              <td><strong>£{totalAllocated.toLocaleString()}</strong></td>
              <td><strong>{allocationPercent}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Settings Tips */}
      <div className="section-card info-card">
        <h3><Info size={20} /> Settings Tips</h3>
        <ul>
          <li>The <strong>Total Budget</strong> is used to calculate overall project progress on the Dashboard</li>
          <li><strong>Milestone billable amounts</strong> determine invoice values when milestones are completed and certificates are signed</li>
          <li>The <strong>PMO Threshold</strong> helps separate management costs from delivery costs on the Dashboard</li>
          <li>Milestone budget changes are saved automatically when you change the value</li>
        </ul>
      </div>
    </div>
  );
}


// ============================================================================
// AUDIT LOG TAB
// ============================================================================

// Action icons and colors for audit log
const ACTION_CONFIG = {
  INSERT: { icon: Plus, color: 'text-green-600', bg: 'bg-green-100', label: 'Created' },
  UPDATE: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Updated' },
  DELETE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100', label: 'Deleted' },
  SOFT_DELETE: { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Archived' },
  RESTORE: { icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Restored' }
};

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

function AuditLogTab({ projectId, profile }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    table: '',
    action: '',
    user: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [uniqueUsers, setUniqueUsers] = useState([]);

  const canView = profile?.role === 'admin' || profile?.role === 'supplier_pm' || profile?.role === 'viewer';

  const fetchLogs = useCallback(async (reset = false) => {
    if (!canView || !projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 0 : page;
      if (reset) setPage(0);
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
      if (filters.table) query = query.eq('table_name', filters.table);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.user) query = query.eq('user_id', filters.user);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      if (reset) {
        setLogs(data || []);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      
      // Get unique users on first load
      if (reset && data?.length > 0) {
        const users = [...new Set(data.map(l => l.user_id).filter(Boolean))];
        setUniqueUsers(users);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, canView, page, filters]);

  useEffect(() => {
    fetchLogs(true);
  }, [projectId, filters]);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderChanges = (oldData, newData) => {
    if (!oldData && !newData) return null;
    
    const changes = [];
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {})
    ]);
    
    allKeys.forEach(key => {
      if (['id', 'created_at', 'updated_at', 'project_id'].includes(key)) return;
      
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ key, oldVal, newVal });
      }
    });
    
    if (changes.length === 0) return <p className="no-changes">No significant changes</p>;
    
    return (
      <div className="changes-list">
        {changes.map((change, idx) => (
          <div key={idx} className="change-item">
            <span className="change-field">{change.key}:</span>
            {change.oldVal !== undefined && (
              <span className="change-old">{JSON.stringify(change.oldVal)}</span>
            )}
            <span className="change-arrow">→</span>
            <span className="change-new">{JSON.stringify(change.newVal)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!canView) {
    return (
      <div className="access-denied">
        <AlertCircle size={48} />
        <h3>Access Denied</h3>
        <p>You don't have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="audit-log-tab">
      {/* Filters */}
      <div className="filters-section">
        <button 
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => fetchLogs(true)}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Table</label>
            <select 
              value={filters.table}
              onChange={(e) => setFilters({ ...filters, table: e.target.value })}
            >
              <option value="">All Tables</option>
              {Object.entries(TABLE_NAMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Action</label>
            <select 
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input 
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input 
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => setFilters({ table: '', action: '', user: '', dateFrom: '', dateTo: '' })}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Results */}
      {loading && logs.length === 0 ? (
        <LoadingSpinner message="Loading audit logs..." />
      ) : error ? (
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No Audit Logs</h3>
          <p>No activity has been recorded for this project yet.</p>
        </div>
      ) : (
        <>
          <div className="audit-logs-list">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
              const ActionIcon = config.icon;
              const isExpanded = expandedRows.has(log.id);
              
              return (
                <div key={log.id} className={`audit-log-item ${config.bg}`}>
                  <div 
                    className="log-header"
                    onClick={() => toggleRow(log.id)}
                  >
                    <div className="log-icon">
                      <ActionIcon size={20} className={config.color} />
                    </div>
                    <div className="log-content">
                      <div className="log-title">
                        <span className={`action-badge ${config.bg}`}>{config.label}</span>
                        <span className="table-name">{TABLE_NAMES[log.table_name] || log.table_name}</span>
                      </div>
                      <div className="log-meta">
                        <span><Clock size={14} /> {formatDate(log.created_at)}</span>
                        {log.user_email && <span><User size={14} /> {log.user_email}</span>}
                      </div>
                    </div>
                    <div className="log-expand">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="log-details">
                      {log.action === 'INSERT' && (
                        <div>
                          <h4>Created Data:</h4>
                          <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                        </div>
                      )}
                      {log.action === 'UPDATE' && renderChanges(log.old_data, log.new_data)}
                      {log.action === 'DELETE' && (
                        <div>
                          <h4>Deleted Data:</h4>
                          <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {hasMore && (
            <div className="load-more">
              <button 
                className="btn btn-secondary"
                onClick={() => { setPage(p => p + 1); fetchLogs(); }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ============================================================================
// DELETED ITEMS TAB
// ============================================================================

const DELETED_TABLE_CONFIG = {
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
    displayField: (item) => `${item.expense_ref || 'Expense'} - £${(parseFloat(item.amount) || 0).toFixed(2)}`,
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
  }
};

function DeletedItemsTab({ projectId, profile, showSuccess, showError }) {
  const [deletedItems, setDeletedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmPurge, setConfirmPurge] = useState(null);
  
  const [tableFilter, setTableFilter] = useState('');
  const [expandedTables, setExpandedTables] = useState(new Set(['timesheets', 'expenses']));

  const canView = profile?.role === 'admin' || profile?.role === 'supplier_pm' || profile?.role === 'viewer';
  const canPurge = profile?.role === 'admin';

  const fetchDeletedItems = useCallback(async () => {
    if (!canView || !projectId) return;
    
    try {
      setLoading(true);
      
      const tables = Object.keys(DELETED_TABLE_CONFIG);
      const results = {};
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('project_id', projectId)
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false });
        
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
    } finally {
      setLoading(false);
    }
  }, [projectId, canView]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

  const handleRestore = async (table, item) => {
    setRestoring(`${table}-${item.id}`);
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: false, deleted_at: null, deleted_by: null })
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Remove from local state
      setDeletedItems(prev => ({
        ...prev,
        [table]: prev[table].filter(i => i.id !== item.id)
      }));
      
      showSuccess?.(`${DELETED_TABLE_CONFIG[table]?.label || table} restored successfully`);
    } catch (err) {
      console.error('Error restoring item:', err);
      showError?.('Failed to restore item: ' + err.message);
    } finally {
      setRestoring(null);
      setConfirmRestore(null);
    }
  };

  const handlePurge = async (table, item) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      setDeletedItems(prev => ({
        ...prev,
        [table]: prev[table].filter(i => i.id !== item.id)
      }));
      
      showSuccess?.('Item permanently deleted');
    } catch (err) {
      console.error('Error purging item:', err);
      showError?.('Failed to delete item: ' + err.message);
    } finally {
      setConfirmPurge(null);
    }
  };

  const toggleTable = (table) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(table)) {
      newExpanded.delete(table);
    } else {
      newExpanded.add(table);
    }
    setExpandedTables(newExpanded);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const totalDeletedCount = Object.values(deletedItems).reduce((sum, items) => sum + items.length, 0);

  if (!canView) {
    return (
      <div className="access-denied">
        <AlertCircle size={48} />
        <h3>Access Denied</h3>
        <p>You don't have permission to view deleted items.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading deleted items..." />;
  }

  const filteredTables = tableFilter 
    ? { [tableFilter]: deletedItems[tableFilter] || [] }
    : deletedItems;

  return (
    <div className="deleted-items-tab">
      {/* Header */}
      <div className="deleted-header">
        <div className="deleted-stats">
          <span className="stat-badge">
            <Trash2 size={16} />
            {totalDeletedCount} deleted items
          </span>
        </div>
        <div className="deleted-actions">
          <select 
            className="table-filter"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {Object.entries(DELETED_TABLE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <button 
            className="btn btn-secondary"
            onClick={fetchDeletedItems}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {totalDeletedCount === 0 ? (
        <div className="empty-state">
          <Archive size={48} />
          <h3>No Deleted Items</h3>
          <p>There are no deleted items in this project.</p>
        </div>
      ) : (
        <div className="deleted-tables">
          {Object.entries(filteredTables).map(([table, items]) => {
            if (!items || items.length === 0) return null;
            
            const config = DELETED_TABLE_CONFIG[table];
            if (!config) return null;
            
            const TableIcon = config.icon;
            const isExpanded = expandedTables.has(table);
            
            return (
              <div key={table} className="deleted-table-section">
                <div 
                  className="table-header"
                  onClick={() => toggleTable(table)}
                >
                  <div className="table-info">
                    <TableIcon size={20} />
                    <span>{config.label}</span>
                    <span className="item-count">{items.length}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {isExpanded && (
                  <div className="table-items">
                    {items.map((item) => (
                      <div key={item.id} className="deleted-item">
                        <div className="item-content">
                          <div className="item-title">{config.displayField(item)}</div>
                          <div className="item-description">{config.descriptionField(item)}</div>
                          <div className="item-meta">
                            <span><Calendar size={14} /> Deleted: {formatDate(item.deleted_at)}</span>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => setConfirmRestore({ table, item })}
                            disabled={restoring === `${table}-${item.id}`}
                          >
                            <RotateCcw size={16} />
                            Restore
                          </button>
                          {canPurge && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => setConfirmPurge({ table, item })}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Restore Dialog */}
      {confirmRestore && (
        <ConfirmDialog
          title="Restore Item"
          message={`Are you sure you want to restore this ${DELETED_TABLE_CONFIG[confirmRestore.table]?.label?.toLowerCase() || 'item'}?`}
          confirmLabel="Restore"
          onConfirm={() => handleRestore(confirmRestore.table, confirmRestore.item)}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* Confirm Purge Dialog */}
      {confirmPurge && (
        <ConfirmDialog
          title="Permanently Delete"
          message={`Are you sure you want to permanently delete this item? This action cannot be undone.`}
          confirmLabel="Delete Forever"
          variant="danger"
          onConfirm={() => handlePurge(confirmPurge.table, confirmPurge.item)}
          onCancel={() => setConfirmPurge(null)}
        />
      )}
    </div>
  );
}


// ============================================================================
// RESOURCES TAB
// ============================================================================

// Helper function to safely format numbers
const safeToFixed = (value, decimals = 0) => {
  const num = Number(value);
  return isNaN(num) ? '0' : num.toFixed(decimals);
};

function ResourcesTab({ projectId, showSuccess, showError }) {
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  
  const { 
    canCreate, 
    canSeeResourceType, 
    canSeeCostPrice,
    canSeeMargins,
    isAdmin 
  } = useResourcePermissions();

  const [resources, setResources] = useState([]);
  const [timesheetHours, setTimesheetHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null });
  const [saving, setSaving] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [partners, setPartners] = useState([]);
  const [newResource, setNewResource] = useState({
    resource_ref: '', 
    name: '', 
    email: '', 
    role: '', 
    sfia_level: 'L4',
    sell_price: '', 
    cost_price: '', 
    resource_type: RESOURCE_TYPE.INTERNAL,
    user_id: null,
    partner_id: null
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await resourcesService.getAll(projectId, { includePartner: true });
      setResources(data || []);

      const timesheets = await timesheetsService.getAllFiltered(projectId, true);
      const hoursByResource = {};
      (timesheets || []).forEach(ts => {
        const countsTowardsCost = timesheetContributesToSpend(ts.status) && !ts.was_rejected;
        if (!countsTowardsCost) return;
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        hoursByResource[ts.resource_id] = (hoursByResource[ts.resource_id] || 0) + hours;
      });
      setTimesheetHours(hoursByResource);
    } catch (error) {
      console.error('Error fetching resources:', error);
      showError?.('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleOpenAddForm() {
    setShowAddForm(true);
    setSelectedUserId('');
    setNewResource({
      resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4',
      sell_price: '', cost_price: '', resource_type: RESOURCE_TYPE.INTERNAL,
      user_id: null, partner_id: null
    });
    try {
      const [users, partnerList] = await Promise.all([
        resourcesService.getProjectUsersWithoutResources(projectId),
        partnersService.getActive(projectId)
      ]);
      setEligibleUsers(users || []);
      setPartners(partnerList || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
      setEligibleUsers([]);
      setPartners([]);
    }
  }

  function handleUserSelect(userId) {
    setSelectedUserId(userId);
    if (userId) {
      const user = eligibleUsers.find(u => u.user_id === userId);
      if (user) {
        setNewResource(prev => ({
          ...prev,
          name: user.full_name || '',
          email: user.email || '',
          user_id: userId
        }));
      }
    } else {
      setNewResource(prev => ({ ...prev, name: '', email: '', user_id: null }));
    }
  }

  async function handleAdd() {
    try {
      if (newResource.resource_type === RESOURCE_TYPE.THIRD_PARTY && !newResource.partner_id) {
        showError?.('Third-party resources must be associated with a partner.');
        return;
      }

      let userId = newResource.user_id;
      if (!userId && newResource.email) {
        const existingProfile = await resourcesService.getProfileByEmail(newResource.email);
        if (!existingProfile) {
          showError?.('This email is not registered. They need to sign up first.');
          return;
        }
        userId = existingProfile.id;
      }

      let resourceRef = newResource.resource_ref?.trim();
      if (!resourceRef) {
        const nextNum = resources.length + 1;
        resourceRef = `R${String(nextNum).padStart(3, '0')}`;
      }

      await resourcesService.create({
        resource_ref: resourceRef,
        name: newResource.name,
        email: newResource.email,
        role: newResource.role,
        project_id: projectId,
        user_id: userId,
        partner_id: newResource.resource_type === RESOURCE_TYPE.THIRD_PARTY ? newResource.partner_id : null,
        resource_type: newResource.resource_type,
        sfia_level: sfiaToDatabase(newResource.sfia_level),
        sell_price: parseFloat(newResource.sell_price) || 0,
        cost_price: newResource.cost_price ? parseFloat(newResource.cost_price) : null,
        created_by: currentUserId
      });

      await fetchData();
      setShowAddForm(false);
      setNewResource({ 
        resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4', 
        sell_price: '', cost_price: '', resource_type: RESOURCE_TYPE.INTERNAL,
        user_id: null, partner_id: null
      });
      setSelectedUserId('');
      showSuccess?.('Resource added!');
    } catch (error) {
      console.error('Error adding resource:', error);
      showError?.('Failed to add: ' + error.message);
    }
  }

  async function handleDelete(resource) {
    setDeleteDialog({ isOpen: true, resource });
  }

  async function handleConfirmDelete() {
    const resource = deleteDialog.resource;
    if (!resource) return;
    
    setSaving(true);
    try {
      await resourcesService.delete(resource.id, currentUserId);
      await fetchData();
      setDeleteDialog({ isOpen: false, resource: null });
      showSuccess?.('Resource deleted');
    } catch (error) {
      showError?.('Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  const filteredResources = resources.filter(r => 
    filterType === 'all' || (r.resource_type || RESOURCE_TYPE.INTERNAL) === filterType
  );

  if (loading) {
    return <LoadingSpinner message="Loading resources..." />;
  }

  return (
    <div className="resources-tab">
      {/* Header Actions */}
      <div className="resources-header">
        <div className="resources-stats">
          <span className="stat-badge">
            <User size={16} />
            {resources.length} resources
          </span>
          {canSeeResourceType && (
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value={RESOURCE_TYPE.INTERNAL}>Internal</option>
              <option value={RESOURCE_TYPE.THIRD_PARTY}>Third-Party</option>
            </select>
          )}
        </div>
        <div className="resources-actions">
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={18} /> Refresh
          </button>
          {canCreate && (
            <button className="btn btn-primary" onClick={handleOpenAddForm}>
              <Plus size={18} /> Add Resource
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-resource-form section-card">
          <h3>Add New Resource</h3>
          
          {eligibleUsers.length > 0 && (
            <div className="user-picker">
              <label>Quick Add: Select from project users</label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
              >
                <option value="">-- Select a user to auto-fill --</option>
                {eligibleUsers.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group">
              <label>Reference</label>
              <input 
                className="form-input" 
                placeholder="Auto-generated if empty" 
                value={newResource.resource_ref} 
                onChange={(e) => setNewResource({...newResource, resource_ref: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input 
                className="form-input" 
                placeholder="Full name" 
                value={newResource.name} 
                onChange={(e) => setNewResource({...newResource, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                className="form-input" 
                placeholder="Email" 
                type="email" 
                value={newResource.email} 
                onChange={(e) => setNewResource({...newResource, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select 
                className="form-input" 
                value={newResource.role} 
                onChange={(e) => setNewResource({...newResource, role: e.target.value})}
              >
                <option value="">Select Role...</option>
                {getRoleOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>SFIA Level</label>
              <select 
                className="form-input" 
                value={newResource.sfia_level} 
                onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}
              >
                {getSfiaOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sell Price (£/day)</label>
              <input 
                className="form-input" 
                type="number" 
                value={newResource.sell_price} 
                onChange={(e) => setNewResource({...newResource, sell_price: e.target.value})}
              />
            </div>
            {canSeeCostPrice && (
              <div className="form-group">
                <label>Cost Price (£/day)</label>
                <input 
                  className="form-input" 
                  type="number" 
                  value={newResource.cost_price} 
                  onChange={(e) => setNewResource({...newResource, cost_price: e.target.value})}
                />
              </div>
            )}
            {canSeeResourceType && (
              <div className="form-group">
                <label>Type</label>
                <select 
                  className="form-input" 
                  value={newResource.resource_type} 
                  onChange={(e) => setNewResource({...newResource, resource_type: e.target.value, partner_id: null})}
                >
                  <option value={RESOURCE_TYPE.INTERNAL}>Internal</option>
                  <option value={RESOURCE_TYPE.THIRD_PARTY}>Third-Party</option>
                </select>
              </div>
            )}
          </div>
          
          {newResource.resource_type === RESOURCE_TYPE.THIRD_PARTY && (
            <div className="partner-select">
              <label>Partner (Required)</label>
              {partners.length > 0 ? (
                <select
                  className="form-input"
                  value={newResource.partner_id || ''}
                  onChange={(e) => setNewResource({...newResource, partner_id: e.target.value || null})}
                >
                  <option value="">-- Select a Partner --</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>{partner.name}</option>
                  ))}
                </select>
              ) : (
                <p className="warning-text">No partners found. Create a partner first.</p>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} /> Save
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resources Table */}
      {filteredResources.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <h3>No Resources</h3>
          <p>Add team members to this project to track time and costs.</p>
        </div>
      ) : (
        <div className="section-card">
          <table className="resources-table">
            <thead>
              <tr>
                <th>Name</th>
                {canSeeResourceType && <th>Type</th>}
                <th>Role</th>
                <th>SFIA</th>
                <th>Sell Rate</th>
                {canSeeCostPrice && <th>Cost Rate</th>}
                {canSeeMargins && <th>Margin</th>}
                <th>Days Used</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => {
                const hours = timesheetHours[resource.id] || 0;
                const days = Number(hoursToDays(hours)) || 0;
                const sellRate = parseFloat(resource.sell_price) || 0;
                const costRate = parseFloat(resource.cost_price) || 0;
                const value = Number(calculateSellValue(days, sellRate)) || 0;
                const margin = Number(calculateMargin(sellRate, costRate)) || 0;
                const marginConfig = getMarginConfig(margin);
                const typeConfig = getResourceTypeConfig(resource.resource_type);
                
                return (
                  <tr key={resource.id}>
                    <td>
                      <div className="resource-name">
                        <strong>{resource.name}</strong>
                        <span className="resource-email">{resource.email}</span>
                      </div>
                    </td>
                    {canSeeResourceType && (
                      <td>
                        <span className={`type-badge ${typeConfig.className}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                    )}
                    <td>{resource.role || '-'}</td>
                    <td>
                      <span className={`sfia-badge ${getSfiaCssClass(resource.sfia_level)}`}>
                        {sfiaToDisplay(resource.sfia_level)}
                      </span>
                    </td>
                    <td>£{safeToFixed(sellRate, 0)}</td>
                    {canSeeCostPrice && <td>£{safeToFixed(costRate, 0)}</td>}
                    {canSeeMargins && (
                      <td>
                        <span className={`margin-badge ${marginConfig.className}`}>
                          {safeToFixed(margin, 0)}%
                        </span>
                      </td>
                    )}
                    <td>{safeToFixed(days, 1)}</td>
                    <td>£{value.toLocaleString()}</td>
                    <td>
                      {isAdmin && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(resource)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialog.isOpen && (
        <ConfirmDialog
          title="Delete Resource"
          message={`Are you sure you want to delete ${deleteDialog.resource?.name}?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialog({ isOpen: false, resource: null })}
        />
      )}
    </div>
  );
}
