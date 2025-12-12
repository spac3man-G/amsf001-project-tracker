import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ClipboardList, Clock, Receipt, FileText, Award, 
  ChevronRight, RefreshCw, User, AlertCircle,
  CheckCircle, Filter, Eye, UserCheck
} from 'lucide-react';
import { useProjectRole } from '../hooks/useProjectRole';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, PageHeader, StatCard } from '../components/common';

export default function WorkflowSummary() {
  const [workflowItems, setWorkflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const navigate = useNavigate();
  
  // Use project-scoped role from useProjectRole hook
  const { effectiveRole, loading: roleLoading } = useProjectRole();
  const { user } = useAuth();
  const currentUserId = user?.id || null;

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

  // Check permissions and fetch data when role is loaded
  useEffect(() => {
    if (roleLoading) return;
    
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
    
    // Fetch project ID and workflow items
    async function initializeData() {
      try {
        // Get project ID
        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('reference', 'AMSF001')
          .single();

        if (project) {
          setProjectId(project.id);
        }

        await fetchWorkflowItems(project?.id);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    }
    
    initializeData();
  }, [roleLoading, effectiveRole, user, navigate]);

  async function fetchWorkflowItems(projId) {
    setRefreshing(true);
    
    try {
      if (!currentUserId || !effectiveRole) {
        console.error('No user ID or role available');
        setWorkflowItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let allItems = [];

      // =====================================================
      // 1. Fetch submitted timesheets
      // =====================================================
      const { data: submittedTimesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('*')
        .eq('status', 'Submitted');

      if (tsError) {
        console.error('Error fetching timesheets:', tsError);
      } else if (submittedTimesheets && submittedTimesheets.length > 0) {
        // Fetch resource names separately
        const resourceIds = [...new Set(submittedTimesheets.map(ts => ts.resource_id).filter(Boolean))];
        let resourceMap = {};
        
        if (resourceIds.length > 0) {
          const { data: resources } = await supabase
            .from('resources')
            .select('id, name')
            .in('id', resourceIds);
          
          if (resources) {
            resources.forEach(r => { resourceMap[r.id] = r.name; });
          }
        }
        
        submittedTimesheets.forEach(ts => {
          // Filter based on user role if not admin/PM
          if (!canSeeAllWorkflows(effectiveRole) && ts.user_id !== currentUserId) {
            return;
          }
          
          allItems.push({
            id: `ts-${ts.id}`,
            reference_id: ts.id,
            reference_type: 'timesheet',
            category: 'timesheet',
            title: 'Timesheet Pending Approval',
            message: `${ts.hours_worked || ts.hours || 0}h on ${new Date(ts.work_date || ts.date).toLocaleDateString('en-GB')}`,
            entityName: resourceMap[ts.resource_id] || 'Unknown Resource',
            submitterName: '',
            created_at: ts.updated_at || ts.created_at,
            action_url: '/timesheets',
            action_label: 'Review Timesheet',
            assignedTo: { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
            itemDetails: ts
          });
        });
      }

      // =====================================================
      // 2. Fetch submitted expenses
      // =====================================================
      const { data: submittedExpenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('status', 'Submitted');

      if (expError) {
        console.error('Error fetching expenses:', expError);
      } else if (submittedExpenses && submittedExpenses.length > 0) {
        submittedExpenses.forEach(exp => {
          // Filter based on user role if not admin/PM
          if (!canSeeAllWorkflows(effectiveRole) && exp.created_by !== currentUserId) {
            return;
          }
          
          // Determine who should validate based on chargeable status
          const isChargeable = exp.chargeable_to_customer !== false;
          const assignedTo = isChargeable 
            ? { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' }
            : { role: 'supplier_pm', label: 'Supplier PM', color: '#0891b2', bg: '#cffafe' };
          
          allItems.push({
            id: `exp-${exp.id}`,
            reference_id: exp.id,
            reference_type: 'expense',
            category: 'expense',
            title: 'Expense Pending Validation',
            message: `${exp.category}: £${parseFloat(exp.amount || 0).toFixed(2)} - ${exp.reason || 'No description'}`,
            entityName: exp.resource_name || 'Unknown Resource',
            submitterName: '',
            created_at: exp.updated_at || exp.created_at,
            action_url: '/expenses',
            action_label: 'Review Expense',
            assignedTo,
            itemDetails: exp,
            isChargeable
          });
        });
      }

      // =====================================================
      // 3. Fetch submitted deliverables
      // =====================================================
      const { data: submittedDeliverables, error: delError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('status', 'Submitted');

      if (delError) {
        console.error('Error fetching deliverables:', delError);
      } else if (submittedDeliverables && submittedDeliverables.length > 0) {
        submittedDeliverables.forEach(del => {
          allItems.push({
            id: `del-${del.id}`,
            reference_id: del.id,
            reference_type: 'deliverable',
            category: 'deliverable',
            title: 'Deliverable Pending Review',
            message: del.name,
            entityName: `${del.deliverable_ref}: ${del.name}`,
            submitterName: '',
            created_at: del.updated_at || del.created_at,
            action_url: '/deliverables',
            action_label: 'Review Deliverable',
            assignedTo: { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
            itemDetails: del
          });
        });
      }

      // =====================================================
      // 4. Fetch submitted milestone certificates
      // =====================================================
      const { data: submittedCerts, error: certError } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('status', 'Submitted');

      if (certError) {
        console.error('Error fetching certificates:', certError);
      } else if (submittedCerts && submittedCerts.length > 0) {
        // Fetch milestone names
        const milestoneIds = [...new Set(submittedCerts.map(c => c.milestone_id).filter(Boolean))];
        let milestoneMap = {};
        
        if (milestoneIds.length > 0) {
          const { data: milestones } = await supabase
            .from('milestones')
            .select('id, milestone_ref, name')
            .in('id', milestoneIds);
          
          if (milestones) {
            milestones.forEach(m => { milestoneMap[m.id] = m; });
          }
        }
        
        submittedCerts.forEach(cert => {
          const milestone = milestoneMap[cert.milestone_id] || {};
          allItems.push({
            id: `cert-${cert.id}`,
            reference_id: cert.id,
            reference_type: 'milestone_certificate',
            category: 'certificate',
            title: 'Certificate Pending Approval',
            message: `${milestone.milestone_ref || 'Unknown'}: ${milestone.name || 'Unknown Milestone'}`,
            entityName: `${milestone.milestone_ref || 'Unknown'}: ${milestone.name || 'Unknown Milestone'}`,
            submitterName: '',
            created_at: cert.updated_at || cert.created_at,
            action_url: '/milestones',
            action_label: 'Review Certificate',
            assignedTo: { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
            itemDetails: cert
          });
        });
      }

      // Sort all items by created_at descending
      allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setWorkflowItems(allItems);
    } catch (error) {
      console.error('Error fetching workflow items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Get icon for category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'timesheet': return <Clock size={18} />;
      case 'expense': return <Receipt size={18} />;
      case 'deliverable': return <FileText size={18} />;
      case 'certificate': return <Award size={18} />;
      default: return <ClipboardList size={18} />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'timesheet': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      case 'expense': return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'deliverable': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'certificate': return { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  // Calculate days pending
  const getDaysPending = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / 86400000);
    return diffDays;
  };

  // Get urgency style based on days pending
  const getUrgencyStyle = (days) => {
    if (days >= 5) return { color: '#dc2626', fontWeight: '600' };
    if (days >= 3) return { color: '#f59e0b', fontWeight: '500' };
    return { color: '#64748b' };
  };

  // Filter items
  const filteredItems = workflowItems.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
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
    total: filteredItems.length,
    timesheets: (groupedByCategory.timesheet || []).length,
    expenses: (groupedByCategory.expense || []).length,
    deliverables: (groupedByCategory.deliverable || []).length,
    certificates: (groupedByCategory.certificate || []).length,
    urgent: filteredItems.filter(item => getDaysPending(item.created_at) >= 5).length
  };

  if (loading || roleLoading) {
    return <LoadingSpinner message="Loading workflow summary..." size="large" fullPage />;
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={ClipboardList}
        title="Workflow Summary"
        subtitle={canSeeAllWorkflows(effectiveRole) 
          ? 'All pending actions across the project' 
          : 'Your pending workflow actions'}
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
          onClick={() => fetchWorkflowItems(projectId)}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <StatCard
          icon={ClipboardList}
          label="Total Pending"
          value={stats.total}
          color="#64748b"
        />
        <StatCard
          icon={Clock}
          label="Timesheets"
          value={stats.timesheets}
          color="#3b82f6"
        />
        <StatCard
          icon={Receipt}
          label="Expenses"
          value={stats.expenses}
          color="#10b981"
        />
        <StatCard
          icon={FileText}
          label="Deliverables"
          value={stats.deliverables}
          color="#f59e0b"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={stats.certificates}
          color="#8b5cf6"
        />
        <StatCard
          icon={AlertCircle}
          label="Urgent (5+ days)"
          value={stats.urgent}
          color="#dc2626"
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={18} style={{ color: '#64748b' }} />
          <span style={{ fontWeight: '500' }}>Filter:</span>
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Categories</option>
            <option value="timesheet">Timesheets</option>
            <option value="expense">Expenses</option>
            <option value="deliverable">Deliverables</option>
            <option value="certificate">Certificates</option>
          </select>
        </div>
      </div>

      {/* No items message */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem' }}>All Clear!</h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            {canSeeAllWorkflows(effectiveRole) 
              ? 'No pending workflow actions across the project.' 
              : 'You have no pending workflow actions.'}
          </p>
        </div>
      ) : (
        /* Workflow Items by Category */
        Object.entries(groupedByCategory).map(([category, items]) => {
          const colors = getCategoryColor(category);
          
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
                <div>
                  <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                    {category === 'certificate' ? 'Milestone Certificates' : `${category}s`}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {items.length} pending action{items.length !== 1 ? 's' : ''}
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
                    const daysPending = getDaysPending(item.created_at);
                    const urgencyStyle = getUrgencyStyle(daysPending);
                    const assignedTo = item.assignedTo;
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{item.entityName || 'Unknown'}</div>
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
                          {item.category === 'expense' && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              marginTop: '0.25rem',
                              color: item.isChargeable ? '#10b981' : '#f59e0b'
                            }}>
                              {item.isChargeable ? '✓ Chargeable' : '✗ Non-chargeable'}
                            </div>
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
                            onClick={() => navigate(item.action_url || '/')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
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
                            Go <ChevronRight size={14} />
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
            <strong>Days Pending:</strong> How long the action has been waiting
          </div>
          <div>
            <strong style={{ color: '#dc2626' }}>Urgent (5+ days):</strong> Requires immediate attention
          </div>
          <div>
            <strong>Assigned To:</strong> The role/person responsible for this action
          </div>
          <div>
            <strong>Go:</strong> Navigate to the item to take action
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
          </ul>
        </div>
        
        {canSeeAllWorkflows(effectiveRole) && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af' }}>
            <strong>Note:</strong> As {getRoleDisplayName(effectiveRole)}, you can see all pending workflow items across the project.
          </div>
        )}
      </div>

      {/* Spinning animation style */}
      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
