/**
 * RAID Detail Modal - Apple Design System
 * 
 * View and edit RAID (Risk, Assumption, Issue, Dependency) items.
 * Consistent styling with ExpenseDetailModal.
 * 
 * @version 3.0 - TD-001: Uses useRaidPermissions hook internally
 * @updated 28 December 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Edit2, Trash2, Save, AlertTriangle, AlertCircle, 
  Info, Link2, User, Calendar, CheckCircle, Clock, Flag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProject } from '../../contexts/ProjectContext';
import { useRaidPermissions } from '../../hooks';
import './RaidDetailModal.css';

// Category configuration
const CATEGORY_CONFIG = {
  Risk: { icon: AlertTriangle, className: 'cat-risk' },
  Assumption: { icon: Info, className: 'cat-assumption' },
  Issue: { icon: AlertCircle, className: 'cat-issue' },
  Dependency: { icon: Link2, className: 'cat-dependency' }
};

function getSeverityClass(severity) {
  switch (severity) {
    case 'High': return 'severity-high';
    case 'Medium': return 'severity-medium';
    case 'Low': return 'severity-low';
    default: return 'severity-none';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Open': return 'status-open';
    case 'In Progress': return 'status-progress';
    case 'Closed': return 'status-closed';
    case 'Accepted': return 'status-accepted';
    case 'Mitigated': return 'status-mitigated';
    default: return 'status-default';
  }
}

export default function RaidDetailModal({ 
  item, 
  onClose, 
  onUpdate, 
  onDelete 
}) {
  const { projectId } = useProject();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Get permissions from hook - centralised permission logic
  const permissions = useRaidPermissions(item);

  // Fetch team members for owner dropdown
  useEffect(() => {
    async function fetchTeamMembers() {
      if (!projectId) return;
      
      try {
        // First get the user_projects for this project
        const { data: userProjectsData, error: upError } = await supabase
          .from('user_projects')
          .select('user_id, role')
          .eq('project_id', projectId);
        
        if (upError) {
          console.error('RaidDetailModal: Error fetching user_projects:', upError);
          return;
        }
        
        if (!userProjectsData || userProjectsData.length === 0) {
          console.log('RaidDetailModal: No user_projects found for project');
          return;
        }
        
        // Get the user IDs
        const userIds = userProjectsData.map(up => up.user_id);
        
        // Fetch profiles for these users
        const { data: profilesData, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profError) {
          console.error('RaidDetailModal: Error fetching profiles:', profError);
          return;
        }
        
        // Merge the data
        const members = userProjectsData
          .map(up => {
            const profile = (profilesData || []).find(p => p.id === up.user_id);
            if (!profile) return null;
            return {
              id: profile.id,
              name: profile.full_name || profile.email,
              email: profile.email,
              role: up.role
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setTeamMembers(members);
      } catch (err) {
        console.error('RaidDetailModal: Failed to fetch team members:', err);
      }
    }
    
    fetchTeamMembers();
  }, [projectId]);

  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Risk;
  const editConfig = CATEGORY_CONFIG[editData.category] || CATEGORY_CONFIG.Risk;
  const activeConfig = isEditing ? editConfig : config;
  const CategoryIcon = activeConfig.icon;

  async function handleSave() {
    setSaving(true);
    try {
      // Strip out relation objects that can't be saved to the database
      const { owner, owner_user, milestone, ...updateData } = editData;
      await onUpdate(updateData);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  }

  function handleStatusChange(newStatus) {
    setEditData(prev => ({
      ...prev,
      status: newStatus,
      closed_date: ['Closed', 'Accepted', 'Mitigated'].includes(newStatus) 
        ? new Date().toISOString().split('T')[0] 
        : null
    }));
  }

  function handleCancel() {
    setEditData({ ...item });
    setIsEditing(false);
  }

  return (
    <div className="raid-modal-overlay" onClick={onClose}>
      <div className="raid-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header - updates dynamically when category changes in edit mode */}
        <header className={`raid-modal-header ${activeConfig.className}`}>
          <div className="raid-modal-header-left">
            <div className="raid-modal-icon">
              <CategoryIcon size={22} />
            </div>
            <div className="raid-modal-title-group">
              <span className="raid-modal-ref">{item.raid_ref}</span>
              <h2>{isEditing ? editData.category : item.category}</h2>
            </div>
          </div>
          <div className="raid-modal-header-right">
            <span className={`raid-modal-status ${getStatusClass(item.status)}`}>
              {item.status}
            </span>
            <button className="raid-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="raid-modal-body">
          {isEditing ? (
            /* Edit Form */
            <div className="raid-edit-form">
              {/* Category Selector - allows changing Risk to Issue, etc. */}
              <div className="raid-form-group">
                <label>Category</label>
                <div className="raid-category-selector">
                  {Object.keys(CATEGORY_CONFIG).map(cat => {
                    const CatIcon = CATEGORY_CONFIG[cat].icon;
                    const isSelected = editData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`raid-category-btn ${CATEGORY_CONFIG[cat].className} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setEditData(prev => ({ ...prev, category: cat }))}
                      >
                        <CatIcon size={18} />
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="raid-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Short title for this item"
                />
              </div>

              <div className="raid-form-group">
                <label>Description</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="raid-form-group">
                <label>Impact</label>
                <textarea
                  value={editData.impact || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, impact: e.target.value }))}
                  rows={2}
                  placeholder="What is the impact if this materialises?"
                />
              </div>

              <div className="raid-form-row">
                <div className="raid-form-group">
                  <label>Probability</label>
                  <select
                    value={editData.probability || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, probability: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="raid-form-group">
                  <label>Severity</label>
                  <select
                    value={editData.severity || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="raid-form-group">
                  <label>Status</label>
                  <select
                    value={editData.status || 'Open'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Mitigated">Mitigated</option>
                  </select>
                </div>
              </div>

              <div className="raid-form-group">
                <label>Mitigation / Action Plan</label>
                <textarea
                  value={editData.mitigation || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, mitigation: e.target.value }))}
                  rows={3}
                  placeholder="Actions to mitigate or address this item"
                />
              </div>

              <div className="raid-form-row">
                <div className="raid-form-group">
                  <label>Owner</label>
                  <select
                    value={editData.owner_user_id || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_user_id: e.target.value || null }))}
                  >
                    <option value="">Select owner...</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.role ? ` (${m.role.replace('_', ' ')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="raid-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editData.due_date || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="raid-form-group">
                <label>Resolution</label>
                <input
                  type="text"
                  value={editData.resolution || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, resolution: e.target.value }))}
                  placeholder="How was this resolved?"
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="raid-view-content">
              {/* Title */}
              <div className="raid-detail-section">
                <h3 className="raid-detail-title">
                  {item.title || <span className="raid-no-value">No title</span>}
                </h3>
              </div>

              {/* Description */}
              <div className="raid-detail-section">
                <span className="raid-detail-label">Description</span>
                <p className="raid-detail-text">{item.description}</p>
              </div>

              {/* Impact */}
              {item.impact && (
                <div className="raid-detail-section">
                  <span className="raid-detail-label">Impact</span>
                  <p className="raid-detail-text">{item.impact}</p>
                </div>
              )}

              {/* Badges Grid */}
              <div className="raid-badges-grid">
                <div className="raid-badge-item">
                  <span className="raid-badge-label">Probability</span>
                  <span className={`raid-badge ${getSeverityClass(item.probability)}`}>
                    {item.probability || 'Not set'}
                  </span>
                </div>
                <div className="raid-badge-item">
                  <span className="raid-badge-label">Severity</span>
                  <span className={`raid-badge ${getSeverityClass(item.severity)}`}>
                    {item.severity || 'Not set'}
                  </span>
                </div>
                <div className="raid-badge-item">
                  <span className="raid-badge-label">Status</span>
                  <span className={`raid-badge ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Mitigation */}
              {item.mitigation && (
                <div className="raid-detail-section">
                  <span className="raid-detail-label">Mitigation / Action Plan</span>
                  <p className="raid-detail-text">{item.mitigation}</p>
                </div>
              )}

              {/* Resolution (if closed) */}
              {item.resolution && (
                <div className="raid-detail-section">
                  <span className="raid-detail-label">Resolution</span>
                  <p className="raid-detail-text">{item.resolution}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="raid-metadata">
                {(item.owner_user || item.owner) && (
                  <div className="raid-meta-item">
                    <User size={15} />
                    <span>Owner: {item.owner_user?.full_name || item.owner?.name}</span>
                  </div>
                )}
                {item.due_date && (
                  <div className="raid-meta-item">
                    <Calendar size={15} />
                    <span>Due: {new Date(item.due_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}</span>
                  </div>
                )}
                {item.milestone && (
                  <div className="raid-meta-item">
                    <Flag size={15} />
                    <span>Milestone: {item.milestone.milestone_ref}</span>
                  </div>
                )}
                {item.raised_date && (
                  <div className="raid-meta-item">
                    <Clock size={15} />
                    <span>Raised: {new Date(item.raised_date).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
                {item.source && (
                  <div className="raid-meta-item">
                    <Info size={15} />
                    <span>Source: {item.source}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="raid-modal-footer">
          <div className="raid-footer-left">
            {permissions.canDelete && !isEditing && (
              <button onClick={onDelete} className="raid-btn raid-btn-danger">
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div className="raid-footer-right">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="raid-btn raid-btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="raid-btn raid-btn-primary"
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="raid-btn raid-btn-secondary">
                  Close
                </button>
                {permissions.canEdit && (
                  <button onClick={() => setIsEditing(true)} className="raid-btn raid-btn-primary">
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
