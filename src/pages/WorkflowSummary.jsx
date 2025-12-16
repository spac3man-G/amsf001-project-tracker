import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Clock, Receipt, FileText, Award, 
  ChevronRight, RefreshCw, User, AlertCircle,
  CheckCircle, Filter, Eye, UserCheck, GitBranch, Lock,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { useProjectRole } from '../hooks/useProjectRole';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { workflowService, WORKFLOW_CATEGORIES, WORKFLOW_ROLES } from '../services';
import { LoadingSpinner, PageHeader, StatCard } from '../components/common';

/**
 * WorkflowSummary Page
 * 
 * Displays all pending workflow items across the project with:
 * - Stats cards that filter on click
 * - All 13 workflow categories (timesheets, expenses, deliverables, variations, certificates, baselines)
 * - Role-based filtering with "Your Action" / "Info Only" indicators
 * - Deep linking with highlight parameter
 * - Actual timestamps for days pending calculation
 * 
 * @version 4.0
 * @updated 16 December 2025
 * @phase Workflow System Enhancement - Segment 4
 */

export default function WorkflowSummary() {
  const [workflowItems, setWorkflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyMyActions, setShowOnlyMyActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Use project context instead of hardcoded project ID
  const { projectId, projectRef, isLoading: projectLoading } = useProject();
  
  // Use project-scoped role from useProjectRole hook
  const { effectiveRole, loading: roleLoading } = useProjectRole();
  const { user } = useAuth();

  // Check if user can see all workflows or just their own
  const canSeeAllWorkflows = (role) => {
    return ['admin', 'supplier_pm', 'customer_pm'].includes(role);
  };

  // Get role display name
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

  // Map profile role to workflow service role constant
  const mapRoleToWorkflowRole = (role) => {
    switch (role) {
      case 'admin': return WORKFLOW_ROLES.ADMIN;
      case 'supplier_pm': return WORKFLOW_ROLES.SUPPLIER_PM;
      case 'customer_pm': return WORKFLOW_ROLES.CUSTOMER_PM;
      default: return null;
    }
  };

  // Fetch workflow items using the workflow service with role-based canAct flag
  const fetchWorkflowItems = useCallback(async () => {
    if (!projectId) {
      console.log('No project ID available');
      setWorkflowItems([]);
      setLoading(false);
      return;
    }

    setRefreshing(true);
    
    try {
      // Get the workflow role for the current user
      const workflowRole = mapRoleToWorkflowRole(effectiveRole);
      
      // Use getItemsVisibleToRole to get items with canAct flag
      const items = workflowRole 
        ? await workflowService.getItemsVisibleToRole(projectId, workflowRole)
        : await workflowService.getAllPendingItems(projectId);
      
      // Transform items to match the display format
      const transformedItems = items.map(item => ({
        id: item.id,
        reference_id: item.entityId || item.id,
        reference_type: item.type,
        category: getCategoryGroup(item.category),
        workflowCategory: item.category, // Keep original category for filtering
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
        canAct: item.canAct !== undefined ? item.canAct : true, // Default to true for admins
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

  // Get category group for filtering (maps workflow categories to display groups)
  const getCategoryGroup = (category) => {
    const categoryConfig = Object.values(WORKFLOW_CATEGORIES).find(c => c.id === category);
    return categoryConfig?.group || 'other';
  };

  // Get entity name for display
  const getEntityName = (item) => {
    switch (item.type) {
      case 'timesheet':
        return item.resourceName || 'Unknown Resource';
      case 'expense':
        return item.resourceName || 'Unknown Resource';
      case 'deliverable':
      case 'deliverable_signoff':
        return item.deliverableRef || item.title;
      case 'variation':
        return item.variationRef || item.title;
      case 'certificate':
        return item.milestoneName || item.title;
      case 'baseline':
        return item.milestoneRef || item.milestoneName || item.title;
      default:
        return item.title;
    }
  };

  // Get action label based on category
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

  // Get assigned to based on category
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

  // Check permissions and fetch data when role is loaded
  useEffect(() => {
    if (roleLoading || projectLoading) return;
    
    // Viewers cannot access workflow summary
    if (effectiveRole === 'viewer') {
      alert('You do not have permission to view this page.');
      navigate('/');
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchWorkflowItems();
  }, [roleLoading, projectLoading, effectiveRole, user, projectId, navigate, fetchWorkflowItems]);

  // Get icon for category
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

  // Get category color
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

  // Get urgency style based on days pending
  const getUrgencyStyle = (days) => {
    if (days >= 5) return { color: '#dc2626', fontWeight: '600' };
    if (days >= 3) return { color: '#f59e0b', fontWeight: '500' };
    return { color: '#64748b' };
  };

  // Filter items based on selected category and "my actions" toggle
  const filteredItems = workflowItems.filter(item => {
    // Apply "my actions only" filter first
    if (showOnlyMyActions && !item.canAct) return false;
    
    // Then apply category filter
    if (filterCategory === 'all') return true;
    if (filterCategory === 'urgent') return item.daysPending >= 5;
    if (filterCategory === 'myactions') return item.canAct;
    return item.category === filterCategory;
  });

  // Group by category
  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Summary stats
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

  // Handle stat card click - filter table
  const handleStatCardClick = (category) => {
    setFilterCategory(category);
  };

  // Navigate to item with highlight parameter
  const navigateToItem = (item) => {
    const url = item.action_url || '/';
    navigate(url);
  };

  if (loading || roleLoading || projectLoading) {
    return <LoadingSpinner message="Loading workflow summary..." size="large" fullPage />;
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={ClipboardList}
        title="Workflow Summary"
        subtitle={`Pending actions for ${projectRef || 'Current Project'}`}
      >
        {/* Role indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          fontSize: '0.85rem'
        }}>
          {canSeeAllWorkflows(effectiveRole) ? <Eye size={16} /> : <User size={16} />}
          <span>Viewing as: <strong>{getRoleDisplayName(effectiveRole)}</strong></span>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => fetchWorkflowItems()}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </PageHeader>

      {/* My Actions Summary Banner */}
      {stats.myActions > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
          borderRadius: '12px',
          border: '1px solid #86efac',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <UserCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#166534' }}>
                {stats.myActions} Action{stats.myActions !== 1 ? 's' : ''} For You
              </div>
              <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                {stats.urgent > 0 && (
                  <span style={{ color: '#dc2626', fontWeight: '500' }}>
                    {stats.urgent} urgent • 
                  </span>
                )} Items requiring your attention as {getRoleDisplayName(effectiveRole)}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowOnlyMyActions(true);
              setFilterCategory('all');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Show My Actions Only
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Stats - Clickable cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(8, 1fr)' }}>
        <div 
          onClick={() => handleStatCardClick('all')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'all' && !showOnlyMyActions ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={ClipboardList}
            label="Total Pending"
            value={stats.total}
            color="#64748b"
            subValue={stats.myActions > 0 ? `${stats.myActions} for you` : undefined}
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('timesheets')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'timesheets' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={Clock}
            label="Timesheets"
            value={stats.timesheets}
            color="#3b82f6"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('expenses')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'expenses' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={Receipt}
            label="Expenses"
            value={stats.expenses}
            color="#10b981"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('deliverables')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'deliverables' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={FileText}
            label="Deliverables"
            value={stats.deliverables}
            color="#f59e0b"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('variations')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'variations' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={GitBranch}
            label="Variations"
            value={stats.variations}
            color="#8b5cf6"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('baselines')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'baselines' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={Lock}
            label="Baselines"
            value={stats.baselines}
            color="#06b6d4"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('certificates')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'certificates' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={Award}
            label="Certificates"
            value={stats.certificates}
            color="#ec4899"
          />
        </div>
        <div 
          onClick={() => handleStatCardClick('urgent')} 
          style={{ cursor: 'pointer' }}
          className={filterCategory === 'urgent' ? 'stat-card-active' : ''}
        >
          <StatCard
            icon={AlertCircle}
            label="Urgent (5+ days)"
            value={stats.urgent}
            color="#dc2626"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={18} style={{ color: '#64748b' }} />
            <span style={{ fontWeight: '500' }}>Filter:</span>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
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
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setFilterCategory('all');
                  setShowOnlyMyActions(false);
                }}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* My Actions Toggle */}
          <div 
            onClick={() => setShowOnlyMyActions(!showOnlyMyActions)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              backgroundColor: showOnlyMyActions ? '#dcfce7' : '#f1f5f9',
              border: showOnlyMyActions ? '1px solid #86efac' : '1px solid #e2e8f0',
              transition: 'all 0.2s'
            }}
          >
            {showOnlyMyActions ? (
              <ToggleRight size={20} style={{ color: '#22c55e' }} />
            ) : (
              <ToggleLeft size={20} style={{ color: '#64748b' }} />
            )}
            <span style={{ 
              fontWeight: '500', 
              fontSize: '0.9rem',
              color: showOnlyMyActions ? '#166534' : '#64748b'
            }}>
              Show only my actions
            </span>
            {stats.myActions > 0 && (
              <span style={{
                padding: '2px 8px',
                backgroundColor: showOnlyMyActions ? '#22c55e' : '#94a3b8',
                color: 'white',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {stats.myActions}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* No items message */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem' }}>
            {showOnlyMyActions ? 'No Actions For You' : filterCategory !== 'all' ? 'No Items in This Category' : 'All Clear!'}
          </h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            {showOnlyMyActions 
              ? `You have no pending actions as ${getRoleDisplayName(effectiveRole)}.`
              : filterCategory !== 'all' 
                ? `No pending ${filterCategory} workflow items.`
                : canSeeAllWorkflows(effectiveRole) 
                  ? 'No pending workflow actions across the project.' 
                  : 'You have no pending workflow actions.'}
          </p>
          {showOnlyMyActions && stats.total > 0 && (
            <button
              onClick={() => setShowOnlyMyActions(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              View All {stats.total} Items
            </button>
          )}
        </div>
      ) : (
        /* Workflow Items by Category */
        Object.entries(groupedByCategory).map(([category, items]) => {
          const colors = getCategoryColor(category);
          const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
          const myActionsInCategory = items.filter(i => i.canAct).length;
          
          return (
            <div key={category} className="card" style={{ marginBottom: '1.5rem' }}>
              {/* Category Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: `2px solid ${colors.border}`
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text
                }}>
                  {getCategoryIcon(category)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                    {categoryLabel}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {items.length} pending action{items.length !== 1 ? 's' : ''}
                    {myActionsInCategory > 0 && myActionsInCategory < items.length && (
                      <span style={{ color: '#22c55e', fontWeight: '500' }}>
                        {' '}• {myActionsInCategory} for you
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Item
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Action Required
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Your Action
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Assigned To
                    </th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Days Pending
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const daysPending = item.daysPending;
                    const urgencyStyle = getUrgencyStyle(daysPending);
                    const assignedTo = item.assignedTo;
                    const canAct = item.canAct;
                    
                    return (
                      <tr 
                        key={item.id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: canAct ? '#f0fdf4' : 'transparent',
                          opacity: !canAct && showOnlyMyActions ? 0.5 : 1
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ 
                            fontWeight: '500',
                            color: canAct ? '#166534' : '#1e293b'
                          }}>
                            {item.entityName || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.message}</div>
                          {item.submitterName && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                              Submitted by: {item.submitterName}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {item.action_label || item.title}
                          </span>
                          {item.itemDetails?.isChargeable !== undefined && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              marginTop: '0.25rem',
                              color: item.itemDetails.isChargeable ? '#10b981' : '#f59e0b'
                            }}>
                              {item.itemDetails.isChargeable ? '✓ Chargeable' : '✗ Non-chargeable'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {canAct ? (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <UserCheck size={12} />
                              Your Action
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Eye size={12} />
                              Info Only
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserCheck size={14} style={{ color: assignedTo.color }} />
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: assignedTo.bg,
                              color: assignedTo.color,
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}>
                              {assignedTo.label}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {daysPending >= 5 && <AlertCircle size={14} style={{ color: '#dc2626' }} />}
                            <span style={urgencyStyle}>
                              {daysPending === 0 ? 'Today' : `${daysPending}d`}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => navigateToItem(item)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: canAct ? '#22c55e' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {canAct ? 'Act' : 'View'} <ChevronRight size={14} />
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

      {/* Legend */}
      <div className="card" style={{ backgroundColor: '#f8fafc', marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>📊 Understanding This View</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
          <div>
            <strong>Days Pending:</strong> Time since submission (from actual timestamp)
          </div>
          <div>
            <strong style={{ color: '#dc2626' }}>Urgent (5+ days):</strong> Requires immediate attention
          </div>
          <div>
            <span style={{
              padding: '2px 8px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>Your Action</span> Items you can act on
          </div>
          <div>
            <span style={{
              padding: '2px 8px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>Info Only</span> View only (another role's action)
          </div>
        </div>
        
        {/* Category Legend */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Workflow Categories:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
            <span><Clock size={14} style={{ verticalAlign: 'middle', color: '#3b82f6' }} /> Timesheets</span>
            <span><Receipt size={14} style={{ verticalAlign: 'middle', color: '#10b981' }} /> Expenses</span>
            <span><FileText size={14} style={{ verticalAlign: 'middle', color: '#f59e0b' }} /> Deliverables</span>
            <span><GitBranch size={14} style={{ verticalAlign: 'middle', color: '#8b5cf6' }} /> Variations</span>
            <span><Lock size={14} style={{ verticalAlign: 'middle', color: '#06b6d4' }} /> Baselines</span>
            <span><Award size={14} style={{ verticalAlign: 'middle', color: '#ec4899' }} /> Certificates</span>
          </div>
        </div>
        
        {/* Validation Rules */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '0.85rem', color: '#166534' }}>
          <strong>Validation Rules:</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0.5rem' }}>
            <li><strong>Timesheets:</strong> Always validated by Customer PM (billable hours)</li>
            <li><strong>Chargeable Expenses:</strong> Validated by Customer PM</li>
            <li><strong>Non-Chargeable Expenses:</strong> Validated by Supplier PM</li>
            <li><strong>Deliverables &amp; Certificates:</strong> Validated by Customer PM</li>
            <li><strong>Variations:</strong> Submitted to Customer PM, signatures from both PMs</li>
            <li><strong>Baselines:</strong> Supplier PM signs first, then Customer PM</li>
          </ul>
        </div>
        
        {canSeeAllWorkflows(effectiveRole) && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af' }}>
            <strong>Note:</strong> As {getRoleDisplayName(effectiveRole)}, you can see all pending workflow items across the project. 
            Items marked "Your Action" are ones you can directly act on.
          </div>
        )}
      </div>

      {/* Spinning animation and stat card active styles */}
      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .stat-card-active > div {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
