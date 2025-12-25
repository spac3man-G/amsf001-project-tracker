/**
 * Workflow Content - Tab content for DashboardHub
 * 
 * Displays all pending workflow items across the project with:
 * - Stats cards that filter on click
 * - All 13 workflow categories (timesheets, expenses, deliverables, variations, certificates, baselines)
 * - Role-based filtering with "Your Action" / "Info Only" indicators
 * - Deep linking with highlight parameter
 * - Actual timestamps for days pending calculation
 * 
 * @version 1.0
 * @created 25 December 2025 - Extracted from WorkflowSummary.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Clock, Receipt, FileText, Award, 
  ChevronRight, RefreshCw, User, AlertCircle,
  CheckCircle, Filter, Eye, UserCheck, GitBranch, Lock,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { workflowService, WORKFLOW_CATEGORIES, WORKFLOW_ROLES } from '../../services';
import { LoadingSpinner, StatCard } from '../../components/common';
import './WorkflowContent.css';

export default function WorkflowContent() {
  const [workflowItems, setWorkflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyMyActions, setShowOnlyMyActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  const { projectId, projectRef, isLoading: projectLoading } = useProject();
  const { effectiveRole, loading: roleLoading } = useProjectRole();
  const { user } = useAuth();

  const canSeeAllWorkflows = (role) => {
    return ['admin', 'supplier_pm', 'customer_pm'].includes(role);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'supplier_pm': return 'Supplier PM';
      case 'customer_pm': return 'Customer PM';
      case 'contributor': return 'Contributor';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const mapRoleToWorkflowRole = (role) => {
    switch (role) {
      case 'admin': return WORKFLOW_ROLES.ADMIN;
      case 'supplier_pm': return WORKFLOW_ROLES.SUPPLIER_PM;
      case 'customer_pm': return WORKFLOW_ROLES.CUSTOMER_PM;
      default: return null;
    }
  };

  const fetchWorkflowItems = useCallback(async () => {
    if (!projectId) {
      setWorkflowItems([]);
      setLoading(false);
      return;
    }

    setRefreshing(true);
    
    try {
      const workflowRole = mapRoleToWorkflowRole(effectiveRole);
      const items = workflowRole 
        ? await workflowService.getItemsVisibleToRole(projectId, workflowRole)
        : await workflowService.getAllPendingItems(projectId);
      
      const transformedItems = items.map(item => ({
        id: item.id,
        reference_id: item.entityId || item.id,
        reference_type: item.type,
        category: getCategoryGroup(item.category),
        workflowCategory: item.category,
        title: item.title,
        message: item.description,
        entityName: getEntityName(item),
        submitterName: '',
        created_at: item.timestamp,
        daysPending: item.daysPending,
        urgency: item.urgency,
        action_url: item.actionUrl,
        action_label: getActionLabel(item.category),
        assignedTo: getAssignedTo(item.category),
        canAct: item.canAct !== undefined ? item.canAct : true,
        itemDetails: item
      }));

      setWorkflowItems(transformedItems);
    } catch (error) {
      console.error('Error fetching workflow items:', error);
      setWorkflowItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, effectiveRole]);

  const getCategoryGroup = (category) => {
    const categoryConfig = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === category);
    return categoryConfig?.group || 'other';
  };

  const getEntityName = (item) => {
    switch (item.type) {
      case 'timesheet': return item.resourceName || 'Unknown Resource';
      case 'expense': return item.resourceName || 'Unknown Resource';
      case 'deliverable':
      case 'deliverable_signoff': return item.deliverableRef || item.title;
      case 'variation': return item.variationRef || item.title;
      case 'certificate': return item.milestoneName || item.title;
      case 'baseline': return item.milestoneRef || item.milestoneName || item.title;
      default: return item.title;
    }
  };

  const getActionLabel = (category) => {
    const labels = {
      'timesheet': 'Review Timesheet',
      'expense_chargeable': 'Validate Expense',
      'expense_non_chargeable': 'Validate Expense',
      'deliverable_review': 'Review Deliverable',
      'deliverable_sign_supplier': 'Sign-off Required',
      'deliverable_sign_customer': 'Sign-off Required',
      'variation_submitted': 'Review Variation',
      'variation_awaiting_supplier': 'Signature Required',
      'variation_awaiting_customer': 'Signature Required',
      'certificate_pending_supplier': 'Sign Certificate',
      'certificate_pending_customer': 'Sign Certificate',
      'baseline_awaiting_supplier': 'Sign Baseline',
      'baseline_awaiting_customer': 'Sign Baseline'
    };
    return labels[category] || 'Review Item';
  };

  const getAssignedTo = (category) => {
    const config = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === category);
    const actionableBy = config?.actionableBy || [];
    
    if (actionableBy.includes('Supplier PM') && !actionableBy.includes('Customer PM')) {
      return { role: 'supplier_pm', label: 'Supplier PM', color: '#0891b2', bg: '#cffafe' };
    } else if (actionableBy.includes('Customer PM')) {
      return { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' };
    }
    return { role: 'admin', label: 'Admin', color: '#6366f1', bg: '#e0e7ff' };
  };

  useEffect(() => {
    if (roleLoading || projectLoading) return;
    
    if (effectiveRole === 'viewer') {
      navigate('/dashboard');
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchWorkflowItems();
  }, [roleLoading, projectLoading, effectiveRole, user, projectId, navigate, fetchWorkflowItems]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'timesheets': return <Clock size={18} />;
      case 'expenses': return <Receipt size={18} />;
      case 'deliverables': return <FileText size={18} />;
      case 'variations': return <GitBranch size={18} />;
      case 'baselines': return <Lock size={18} />;
      case 'certificates': return <Award size={18} />;
      default: return <ClipboardList size={18} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'timesheets': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      case 'expenses': return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'deliverables': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'variations': return { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' };
      case 'baselines': return { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' };
      case 'certificates': return { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const getUrgencyStyle = (days) => {
    if (days >= 5) return { color: '#dc2626', fontWeight: '600' };
    if (days >= 3) return { color: '#f59e0b', fontWeight: '500' };
    return { color: '#64748b' };
  };

  const filteredItems = workflowItems.filter(item => {
    if (showOnlyMyActions && !item.canAct) return false;
    if (filterCategory === 'all') return true;
    if (filterCategory === 'urgent') return item.daysPending >= 5;
    if (filterCategory === 'myactions') return item.canAct;
    return item.category === filterCategory;
  });

  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const stats = {
    total: workflowItems.length,
    myActions: workflowItems.filter(i => i.canAct).length,
    timesheets: workflowItems.filter(i => i.category === 'timesheets').length,
    expenses: workflowItems.filter(i => i.category === 'expenses').length,
    deliverables: workflowItems.filter(i => i.category === 'deliverables').length,
    variations: workflowItems.filter(i => i.category === 'variations').length,
    baselines: workflowItems.filter(i => i.category === 'baselines').length,
    certificates: workflowItems.filter(i => i.category === 'certificates').length,
    urgent: workflowItems.filter(item => item.daysPending >= 5).length
  };

  const handleStatCardClick = (category) => {
    setFilterCategory(category);
  };

  const navigateToItem = (item) => {
    const url = item.action_url || '/';
    navigate(url);
  };

  if (loading || roleLoading || projectLoading) {
    return <LoadingSpinner message="Loading workflow summary..." size="large" />;
  }

  return (
    <div className="workflow-content">
      {/* Header */}
      <div className="workflow-header">
        <div className="workflow-header-left">
          <h2>Workflow Summary</h2>
          <p>Pending actions for {projectRef || 'Current Project'}</p>
        </div>
        <div className="workflow-header-right">
          <div className="role-indicator">
            {canSeeAllWorkflows(effectiveRole) ? <Eye size={16} /> : <User size={16} />}
            <span>Viewing as: <strong>{getRoleDisplayName(effectiveRole)}</strong></span>
          </div>
          <button 
            className="btn-refresh" 
            onClick={() => fetchWorkflowItems()}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* My Actions Banner */}
      {stats.myActions > 0 && (
        <div className="my-actions-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <UserCheck size={24} />
            </div>
            <div className="banner-text">
              <div className="banner-title">
                {stats.myActions} Action{stats.myActions !== 1 ? 's' : ''} For You
              </div>
              <div className="banner-subtitle">
                {stats.urgent > 0 && (
                  <span className="urgent-count">{stats.urgent} urgent • </span>
                )}
                Items requiring your attention as {getRoleDisplayName(effectiveRole)}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowOnlyMyActions(true);
              setFilterCategory('all');
            }}
            className="show-actions-btn"
          >
            Show My Actions Only
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="workflow-stats-grid">
        <div onClick={() => handleStatCardClick('all')} className={filterCategory === 'all' && !showOnlyMyActions ? 'stat-active' : ''}>
          <StatCard icon={ClipboardList} label="Total Pending" value={stats.total} color="#64748b" subValue={stats.myActions > 0 ? `${stats.myActions} for you` : undefined} />
        </div>
        <div onClick={() => handleStatCardClick('timesheets')} className={filterCategory === 'timesheets' ? 'stat-active' : ''}>
          <StatCard icon={Clock} label="Timesheets" value={stats.timesheets} color="#3b82f6" />
        </div>
        <div onClick={() => handleStatCardClick('expenses')} className={filterCategory === 'expenses' ? 'stat-active' : ''}>
          <StatCard icon={Receipt} label="Expenses" value={stats.expenses} color="#10b981" />
        </div>
        <div onClick={() => handleStatCardClick('deliverables')} className={filterCategory === 'deliverables' ? 'stat-active' : ''}>
          <StatCard icon={FileText} label="Deliverables" value={stats.deliverables} color="#f59e0b" />
        </div>
        <div onClick={() => handleStatCardClick('variations')} className={filterCategory === 'variations' ? 'stat-active' : ''}>
          <StatCard icon={GitBranch} label="Variations" value={stats.variations} color="#8b5cf6" />
        </div>
        <div onClick={() => handleStatCardClick('baselines')} className={filterCategory === 'baselines' ? 'stat-active' : ''}>
          <StatCard icon={Lock} label="Baselines" value={stats.baselines} color="#06b6d4" />
        </div>
        <div onClick={() => handleStatCardClick('certificates')} className={filterCategory === 'certificates' ? 'stat-active' : ''}>
          <StatCard icon={Award} label="Certificates" value={stats.certificates} color="#ec4899" />
        </div>
        <div onClick={() => handleStatCardClick('urgent')} className={filterCategory === 'urgent' ? 'stat-active' : ''}>
          <StatCard icon={AlertCircle} label="Urgent (5+ days)" value={stats.urgent} color="#dc2626" />
        </div>
      </div>

      {/* Filters */}
      <div className="workflow-filters">
        <div className="filters-left">
          <Filter size={18} />
          <span>Filter:</span>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="timesheets">Timesheets</option>
            <option value="expenses">Expenses</option>
            <option value="deliverables">Deliverables</option>
            <option value="variations">Variations</option>
            <option value="baselines">Baselines</option>
            <option value="certificates">Certificates</option>
            <option value="urgent">Urgent (5+ days)</option>
          </select>
          {(filterCategory !== 'all' || showOnlyMyActions) && (
            <button className="clear-filters-btn" onClick={() => { setFilterCategory('all'); setShowOnlyMyActions(false); }}>
              Clear All Filters
            </button>
          )}
        </div>
        <div className={`my-actions-toggle ${showOnlyMyActions ? 'active' : ''}`} onClick={() => setShowOnlyMyActions(!showOnlyMyActions)}>
          {showOnlyMyActions ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          <span>Show only my actions</span>
          {stats.myActions > 0 && <span className="action-count">{stats.myActions}</span>}
        </div>
      </div>

      {/* No Items */}
      {filteredItems.length === 0 ? (
        <div className="no-items">
          <CheckCircle size={48} />
          <h3>{showOnlyMyActions ? 'No Actions For You' : filterCategory !== 'all' ? 'No Items in This Category' : 'All Clear!'}</h3>
          <p>
            {showOnlyMyActions 
              ? `You have no pending actions as ${getRoleDisplayName(effectiveRole)}.`
              : filterCategory !== 'all' 
                ? `No pending ${filterCategory} workflow items.`
                : canSeeAllWorkflows(effectiveRole) 
                  ? 'No pending workflow actions across the project.' 
                  : 'You have no pending workflow actions.'}
          </p>
          {showOnlyMyActions && stats.total > 0 && (
            <button onClick={() => setShowOnlyMyActions(false)} className="view-all-btn">
              View All {stats.total} Items
            </button>
          )}
        </div>
      ) : (
        /* Workflow Items by Category */
        Object.entries(groupedByCategory).map(([category, items]) => {
          const colors = getCategoryColor(category);
          const myActionsInCategory = items.filter(i => i.canAct).length;
          
          return (
            <div key={category} className="category-card">
              <div className="category-header" style={{ borderBottomColor: colors.border }}>
                <div className="category-icon" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {getCategoryIcon(category)}
                </div>
                <div className="category-info">
                  <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <span>
                    {items.length} pending action{items.length !== 1 ? 's' : ''}
                    {myActionsInCategory > 0 && myActionsInCategory < items.length && (
                      <span className="for-you"> • {myActionsInCategory} for you</span>
                    )}
                  </span>
                </div>
              </div>

              <table className="workflow-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Action Required</th>
                    <th style={{ textAlign: 'center' }}>Your Action</th>
                    <th>Assigned To</th>
                    <th style={{ textAlign: 'center' }}>Days Pending</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const urgencyStyle = getUrgencyStyle(item.daysPending);
                    const assignedTo = item.assignedTo;
                    
                    return (
                      <tr key={item.id} className={item.canAct ? 'can-act' : ''}>
                        <td>
                          <div className="item-name">{item.entityName || 'Unknown'}</div>
                          <div className="item-message">{item.message}</div>
                        </td>
                        <td>
                          <span className="action-badge" style={{ backgroundColor: colors.bg, color: colors.text }}>
                            {item.action_label || item.title}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.canAct ? (
                            <span className="your-action-badge"><UserCheck size={12} /> Your Action</span>
                          ) : (
                            <span className="info-only-badge"><Eye size={12} /> Info Only</span>
                          )}
                        </td>
                        <td>
                          <div className="assigned-to">
                            <UserCheck size={14} style={{ color: assignedTo.color }} />
                            <span style={{ backgroundColor: assignedTo.bg, color: assignedTo.color }}>
                              {assignedTo.label}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="days-pending" style={urgencyStyle}>
                            {item.daysPending >= 5 && <AlertCircle size={14} />}
                            {item.daysPending === 0 ? 'Today' : `${item.daysPending}d`}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => navigateToItem(item)} className={`action-btn ${item.canAct ? 'primary' : 'secondary'}`}>
                            {item.canAct ? 'Act' : 'View'} <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
