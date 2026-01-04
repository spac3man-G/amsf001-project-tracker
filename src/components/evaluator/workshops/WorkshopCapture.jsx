/**
 * WorkshopCapture Component
 * 
 * Live requirement capture interface for workshop facilitation.
 * Allows real-time capture of requirements during a workshop session,
 * with automatic linking to workshop and attendee/stakeholder area.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.6)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Plus, 
  Save,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Send,
  ArrowRight,
  ClipboardList,
  MessageSquare,
  Target,
  Lightbulb,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  requirementsService,
  workshopsService,
  evaluationCategoriesService,
  stakeholderAreasService,
  WORKSHOP_STATUSES
} from '../../../services/evaluator';
import { LoadingSpinner, Toast, ConfirmDialog, StatusBadge } from '../../../components/common';

import './WorkshopCapture.css';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'must_have', label: 'Must Have', color: '#EF4444', icon: AlertCircle },
  { value: 'should_have', label: 'Should Have', color: '#F59E0B', icon: Target },
  { value: 'could_have', label: 'Could Have', color: '#3B82F6', icon: Lightbulb },
  { value: 'wont_have', label: "Won't Have", color: '#6B7280', icon: X }
];

// Get priority config
const getPriorityConfig = (priority) => 
  PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];

export default function WorkshopCapture({
  workshop,
  attendees = [],
  onRequirementCaptured,
  onClose
}) {
  const { evaluationId } = useEvaluation();
  const { user } = useAuth();

  // Data state
  const [categories, setCategories] = useState([]);
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [capturedRequirements, setCapturedRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quick capture form state
  const [quickCapture, setQuickCapture] = useState({
    title: '',
    description: '',
    priority: 'should_have',
    category_id: '',
    stakeholder_area_id: '',
    raised_by_attendee_id: ''
  });
  
  // UI state
  const [expandedReq, setExpandedReq] = useState(null);
  const [editingReq, setEditingReq] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs
  const titleInputRef = useRef(null);
  const captureListRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!evaluationId || !workshop?.id) return;
      
      setIsLoading(true);
      try {
        const [cats, areas, existingReqs] = await Promise.all([
          evaluationCategoriesService.getAll(evaluationId),
          stakeholderAreasService.getAll(evaluationId),
          workshopsService.getCapturedRequirements(workshop.id)
        ]);
        
        setCategories(cats || []);
        setStakeholderAreas(areas || []);
        setCapturedRequirements(existingReqs || []);
        
        // Set default category if available
        if (cats?.length > 0 && !quickCapture.category_id) {
          setQuickCapture(prev => ({ ...prev, category_id: cats[0].id }));
        }
      } catch (err) {
        console.error('Failed to load workshop capture data:', err);
        setToastMessage({ type: 'error', message: 'Failed to load data' });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [evaluationId, workshop?.id]);

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    let result = [...capturedRequirements];
    
    if (filterCategory) {
      result = result.filter(r => r.category_id === filterCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.reference_code?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [capturedRequirements, filterCategory, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const total = capturedRequirements.length;
    const byPriority = {};
    const byCategory = {};
    const byArea = {};
    
    capturedRequirements.forEach(req => {
      byPriority[req.priority] = (byPriority[req.priority] || 0) + 1;
      if (req.category_id) {
        byCategory[req.category_id] = (byCategory[req.category_id] || 0) + 1;
      }
      if (req.stakeholder_area_id) {
        byArea[req.stakeholder_area_id] = (byArea[req.stakeholder_area_id] || 0) + 1;
      }
    });
    
    return { total, byPriority, byCategory, byArea };
  }, [capturedRequirements]);

  // Handle quick capture field change
  const handleQuickCaptureChange = useCallback((field, value) => {
    setQuickCapture(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle quick capture submit
  const handleQuickCapture = useCallback(async (e) => {
    e?.preventDefault();
    
    if (!quickCapture.title.trim()) {
      setToastMessage({ type: 'warning', message: 'Please enter a requirement title' });
      titleInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      // Find attendee details if selected
      const selectedAttendee = attendees.find(a => a.id === quickCapture.raised_by_attendee_id);
      
      // Build requirement data
      const reqData = {
        evaluation_project_id: evaluationId,
        title: quickCapture.title.trim(),
        description: quickCapture.description.trim() || null,
        priority: quickCapture.priority,
        category_id: quickCapture.category_id || null,
        stakeholder_area_id: quickCapture.stakeholder_area_id || 
                             selectedAttendee?.stakeholder_area_id || null,
        status: 'draft',
        source_type: 'workshop',
        source_workshop_id: workshop.id,
        raised_by: selectedAttendee?.user_id || user?.id
      };

      const created = await requirementsService.create(reqData);
      
      // Reload requirements list
      const updatedReqs = await workshopsService.getCapturedRequirements(workshop.id);
      setCapturedRequirements(updatedReqs || []);
      
      // Clear form (keep category and area selections)
      setQuickCapture(prev => ({
        ...prev,
        title: '',
        description: '',
        raised_by_attendee_id: ''
      }));
      
      titleInputRef.current?.focus();
      
      setToastMessage({ type: 'success', message: `Captured: ${created.reference_code}` });
      onRequirementCaptured?.(created);
      
      // Scroll to bottom of list
      setTimeout(() => {
        captureListRef.current?.scrollTo({
          top: captureListRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      
    } catch (err) {
      console.error('Failed to capture requirement:', err);
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  }, [quickCapture, evaluationId, workshop?.id, attendees, user?.id, onRequirementCaptured]);

  // Handle update requirement
  const handleUpdateRequirement = useCallback(async (reqId, updates) => {
    setIsSaving(true);
    try {
      await requirementsService.update(reqId, updates);
      
      const updatedReqs = await workshopsService.getCapturedRequirements(workshop.id);
      setCapturedRequirements(updatedReqs || []);
      
      setEditingReq(null);
      setToastMessage({ type: 'success', message: 'Requirement updated' });
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  }, [workshop?.id]);

  // Handle delete requirement
  const handleDeleteRequirement = useCallback(async () => {
    if (!deleteConfirm) return;
    
    setIsSaving(true);
    try {
      await requirementsService.delete(deleteConfirm.id, user?.id);
      
      setCapturedRequirements(prev => prev.filter(r => r.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setToastMessage({ type: 'success', message: 'Requirement removed' });
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  }, [deleteConfirm, user?.id]);

  // Keyboard shortcut for quick capture (Ctrl/Cmd + Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleQuickCapture();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickCapture]);

  // Is workshop active?
  const isActive = workshop?.status === WORKSHOP_STATUSES.IN_PROGRESS;
  const isComplete = workshop?.status === WORKSHOP_STATUSES.COMPLETE;

  if (isLoading) {
    return (
      <div className="workshop-capture loading">
        <LoadingSpinner message="Loading capture interface..." />
      </div>
    );
  }

  return (
    <div className="workshop-capture">
      {/* Header */}
      <div className="capture-header">
        <div className="header-info">
          <h2>
            <ClipboardList size={20} />
            Live Capture
          </h2>
          <span className="workshop-name">{workshop?.name}</span>
          {isActive && (
            <span className="live-indicator">
              <span className="pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Captured</span>
          </div>
          {Object.entries(stats.byPriority).slice(0, 3).map(([priority, count]) => {
            const config = getPriorityConfig(priority);
            return (
              <div key={priority} className="stat" style={{ borderColor: config.color }}>
                <span className="stat-value" style={{ color: config.color }}>{count}</span>
                <span className="stat-label">{config.label.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
        {onClose && (
          <button className="btn-icon close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Quick Capture Form */}
      {!isComplete && (
        <form className="quick-capture-form" onSubmit={handleQuickCapture}>
          <div className="capture-main-row">
            {/* Title input - primary focus */}
            <div className="title-input-wrapper">
              <input
                ref={titleInputRef}
                type="text"
                placeholder="Type requirement title... (Ctrl+Enter to save)"
                value={quickCapture.title}
                onChange={e => handleQuickCaptureChange('title', e.target.value)}
                className="title-input"
                autoFocus
              />
            </div>
            
            {/* Quick save button */}
            <button 
              type="submit" 
              className="btn btn-primary capture-btn"
              disabled={isSaving || !quickCapture.title.trim()}
            >
              {isSaving ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Plus size={16} />
                  Capture
                </>
              )}
            </button>
          </div>

          {/* Optional fields row */}
          <div className="capture-options-row">
            {/* Description - expandable */}
            <div className="description-wrapper">
              <MessageSquare size={14} />
              <input
                type="text"
                placeholder="Add description (optional)"
                value={quickCapture.description}
                onChange={e => handleQuickCaptureChange('description', e.target.value)}
                className="description-input"
              />
            </div>

            {/* Priority */}
            <div className="priority-select">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`priority-btn ${quickCapture.priority === opt.value ? 'active' : ''}`}
                  style={{ 
                    '--priority-color': opt.color,
                    color: quickCapture.priority === opt.value ? '#fff' : opt.color
                  }}
                  onClick={() => handleQuickCaptureChange('priority', opt.value)}
                  title={opt.label}
                >
                  <opt.icon size={12} />
                  {opt.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Context row - category, area, attendee */}
          <div className="capture-context-row">
            {/* Category */}
            <div className="context-select">
              <Tag size={12} />
              <select
                value={quickCapture.category_id}
                onChange={e => handleQuickCaptureChange('category_id', e.target.value)}
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Stakeholder Area */}
            <div className="context-select">
              <Building2 size={12} />
              <select
                value={quickCapture.stakeholder_area_id}
                onChange={e => handleQuickCaptureChange('stakeholder_area_id', e.target.value)}
              >
                <option value="">No area</option>
                {stakeholderAreas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            {/* Raised By Attendee */}
            {attendees.length > 0 && (
              <div className="context-select">
                <User size={12} />
                <select
                  value={quickCapture.raised_by_attendee_id}
                  onChange={e => handleQuickCaptureChange('raised_by_attendee_id', e.target.value)}
                >
                  <option value="">Raised by...</option>
                  {attendees
                    .filter(a => a.rsvp_status === 'accepted' || a.attended)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.user?.full_name || a.external_name || a.external_email}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Captured Requirements List */}
      <div className="captured-list-container">
        {/* List header with filters */}
        <div className="list-header">
          <h3>
            Captured Requirements
            <span className="count">({filteredRequirements.length})</span>
          </h3>
          <div className="list-actions">
            {/* Search */}
            <div className="search-input-sm">
              <Search size={12} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category filter */}
            <select
              className="filter-select"
              value={filterCategory || ''}
              onChange={e => setFilterCategory(e.target.value || null)}
            >
              <option value="">All categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({stats.byCategory[cat.id] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requirements list */}
        <div className="captured-list" ref={captureListRef}>
          {filteredRequirements.length === 0 ? (
            <div className="empty-list">
              <ClipboardList size={32} />
              <p>
                {capturedRequirements.length === 0
                  ? 'No requirements captured yet. Start typing above to capture requirements.'
                  : 'No requirements match your filters.'}
              </p>
            </div>
          ) : (
            filteredRequirements.map(req => {
              const priorityConfig = getPriorityConfig(req.priority);
              const PriorityIcon = priorityConfig.icon;
              const isExpanded = expandedReq === req.id;
              const isEditing = editingReq === req.id;
              
              return (
                <div 
                  key={req.id} 
                  className={`captured-requirement ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Main row */}
                  <div 
                    className="req-main"
                    onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                  >
                    {/* Reference code */}
                    <span className="req-code">{req.reference_code}</span>
                    
                    {/* Title */}
                    <span className="req-title">{req.title}</span>
                    
                    {/* Priority indicator */}
                    <span 
                      className="req-priority"
                      style={{ color: priorityConfig.color }}
                      title={priorityConfig.label}
                    >
                      <PriorityIcon size={14} />
                    </span>
                    
                    {/* Category */}
                    {req.category && (
                      <span className="req-category">
                        {req.category.name}
                      </span>
                    )}
                    
                    {/* Expand indicator */}
                    <button className="expand-btn">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="req-details">
                      {/* Description */}
                      {req.description && (
                        <div className="detail-row">
                          <span className="detail-label">Description</span>
                          <p className="detail-value">{req.description}</p>
                        </div>
                      )}
                      
                      {/* Meta info */}
                      <div className="detail-meta">
                        {req.stakeholder_area && (
                          <span className="meta-item">
                            <Building2 size={12} />
                            {req.stakeholder_area.name}
                          </span>
                        )}
                        {req.raised_by_profile && (
                          <span className="meta-item">
                            <User size={12} />
                            {req.raised_by_profile.full_name}
                          </span>
                        )}
                        <span className="meta-item">
                          <Clock size={12} />
                          {new Date(req.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      {!isComplete && (
                        <div className="detail-actions">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingReq(req.id);
                            }}
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(req);
                            }}
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Remove Requirement"
        message={`Remove "${deleteConfirm?.reference_code}: ${deleteConfirm?.title}"? This will permanently delete this requirement.`}
        confirmText="Remove"
        type="danger"
        onConfirm={handleDeleteRequirement}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* Toast Messages */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

WorkshopCapture.propTypes = {
  workshop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string
  }).isRequired,
  attendees: PropTypes.array,
  onRequirementCaptured: PropTypes.func,
  onClose: PropTypes.func
};
