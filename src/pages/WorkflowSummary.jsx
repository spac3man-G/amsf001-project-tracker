import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ClipboardList, Clock, Receipt, FileText, Award, 
  ChevronRight, RefreshCw, User, AlertCircle,
  CheckCircle, Filter, Eye, UserCheck
} from 'lucide-react';

export default function WorkflowSummary() {
  const [workflowItems, setWorkflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Define which role should action each category for validation workflow
  const getTargetRoleForCategory = (category, notificationType, title) => {
    // If this is a rejection notification, it's assigned back to the submitter
    if (title?.includes('Rejected')) {
      return { role: 'submitter', label: 'Submitter', color: '#dc2626', bg: '#fef2f2' };
    }
    
    // For validation workflows, Customer PM is the validator
    switch (category) {
      case 'timesheet':
      case 'expense':
      case 'deliverable':
      case 'certificate':
        return { role: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' };
      default:
        return { role: 'admin', label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' };
    }
  };

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

  // Check permissions and fetch data
  useEffect(() => {
    checkPermissionsAndFetch();
  }, []);

  async function checkPermissionsAndFetch() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) {
        alert('Profile not found.');
        navigate('/');
        return;
      }

      // Viewers cannot access workflow summary
      if (profile.role === 'viewer') {
        alert('You do not have permission to view this page.');
        navigate('/');
        return;
      }

      setUserRole(profile.role);
      setCurrentUserProfile(profile);
      await fetchWorkflowItems(user.id, profile);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setLoading(false);
    }
  }

  async function fetchWorkflowItems(userId, profile) {
    setRefreshing(true);
    try {
      const userIdToUse = userId || currentUserId;
      const profileToUse = profile || currentUserProfile;
      
      if (!userIdToUse || !profileToUse) {
        console.error('No user ID or profile available');
        setWorkflowItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let allNotifications = [];

      // Admin, Supplier PM, Customer PM: Fetch ALL action notifications across all users
      if (canSeeAllWorkflows(profileToUse.role)) {
        // Query all notifications that are action type and not actioned
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('notification_type', 'action')
          .eq('is_actioned', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching all notifications:', error);
          throw error;
        }
        
        allNotifications = data || [];
        
        // Deduplicate by reference_id + reference_type (same item might have notifications for multiple users)
        const seen = new Set();
        allNotifications = allNotifications.filter(n => {
          const key = `${n.reference_type}-${n.reference_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      } else {
        // Contributors: Only fetch their own notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userIdToUse)
          .eq('notification_type', 'action')
          .eq('is_actioned', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user notifications:', error);
          throw error;
        }
        
        allNotifications = data || [];
      }

      console.log('Notifications fetched:', allNotifications.length);

      // Enhance data with additional context
      const enhancedItems = await Promise.all(allNotifications.map(async (item) => {
        let itemDetails = null;
        let entityName = '';
        let submitterName = '';

        // Fetch related entity details
        if (item.reference_type === 'timesheet' && item.reference_id) {
          const { data: ts } = await supabase
            .from('timesheets')
            .select('*, resources(name), profiles:user_id(full_name)')
            .eq('id', item.reference_id)
            .single();
          if (ts) {
            itemDetails = ts;
            entityName = ts.resources?.name || 'Unknown Resource';
            submitterName = ts.profiles?.full_name || '';
          }
        } else if (item.reference_type === 'expense' && item.reference_id) {
          const { data: exp } = await supabase
            .from('expenses')
            .select('*, resources(name), profiles:user_id(full_name)')
            .eq('id', item.reference_id)
            .single();
          if (exp) {
            itemDetails = exp;
            entityName = exp.resources?.name || 'Unknown Resource';
            submitterName = exp.profiles?.full_name || '';
          }
        } else if (item.reference_type === 'deliverable' && item.reference_id) {
          const { data: del } = await supabase
            .from('deliverables')
            .select('*')
            .eq('id', item.reference_id)
            .single();
          if (del) {
            itemDetails = del;
            entityName = `${del.deliverable_ref}: ${del.name}`;
          }
        } else if (item.reference_type === 'milestone_certificate' && item.reference_id) {
          const { data: cert } = await supabase
            .from('milestone_certificates')
            .select('*, milestones(milestone_ref, name)')
            .eq('id', item.reference_id)
            .single();
          if (cert) {
            itemDetails = cert;
            entityName = `${cert.milestones?.milestone_ref}: ${cert.milestones?.name}`;
          }
        } else if (item.reference_type === 'milestone' && item.reference_id) {
          const { data: ms } = await supabase
            .from('milestones')
            .select('*')
            .eq('id', item.reference_id)
            .single();
          if (ms) {
            itemDetails = ms;
            entityName = `${ms.milestone_ref}: ${ms.name}`;
          }
        }

        return {
          ...item,
          itemDetails,
          entityName,
          submitterName
        };
      }));

      setWorkflowItems(enhancedItems);
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading workflow summary...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <ClipboardList size={28} />
          <div>
            <h1>Workflow Summary</h1>
            <p>
              {canSeeAllWorkflows(userRole) 
                ? 'All pending actions across the project' 
                : 'Your pending workflow actions'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            {canSeeAllWorkflows(userRole) ? <Eye size={16} /> : <User size={16} />}
            <span>Viewing as: <strong>{getRoleDisplayName(userRole)}</strong></span>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchWorkflowItems(currentUserId, currentUserProfile)}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Pending</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Timesheets</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.timesheets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.expenses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deliverables</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.deliverables}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Certificates</div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{stats.certificates}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: stats.urgent > 0 ? '#fef2f2' : undefined }}>
          <div className="stat-label">Urgent (5+ days)</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.urgent}</div>
        </div>
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
            {canSeeAllWorkflows(userRole) 
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
                    const targetRole = getTargetRoleForCategory(item.category, item.notification_type, item.title);
                    
                    // For rejected items, show the submitter name if available
                    const assignedToLabel = item.title?.includes('Rejected') && item.submitterName
                      ? item.submitterName
                      : targetRole.label;
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{item.entityName || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.message}</div>
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
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserCheck size={14} style={{ color: targetRole.color }} />
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: targetRole.bg,
                              color: targetRole.color,
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}>
                              {assignedToLabel}
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
        {canSeeAllWorkflows(userRole) && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af' }}>
            <strong>Note:</strong> As {getRoleDisplayName(userRole)}, you can see all pending workflow items across the project.
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
