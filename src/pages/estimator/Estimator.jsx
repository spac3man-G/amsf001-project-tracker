/**
 * Estimator Tool - Component-Based Cost Estimation
 * 
 * Creates estimates by adding components with tasks and resource allocations.
 * Uses benchmark rates from the SFIA 8 benchmarking tool.
 * 
 * Features:
 * - Add/clone/delete components
 * - Excel-like grid: tasks (rows) × resource types (columns)
 * - Effort in days × day rate = cost
 * - Component quantity multiplier
 * - Real-time totals
 * - Save/Load estimates to database
 * - Duplicate estimates
 * - Unsaved changes indicator
 * - Back to Planning navigation
 * - CSV export
 * 
 * Access: Admin and Supplier PM only
 * 
 * @version 3.1 - Final polish (Checkpoint 6)
 * @created 26 December 2025
 * @checkpoint 6 - Linked Estimates Feature Complete
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Save,
  FileDown,
  FolderOpen,
  FilePlus,
  X,
  GripVertical,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import './Estimator.css';

// Import from centralized services
import {
  benchmarkRatesService,
  estimatesService,
  ROLES,
  SKILLS,
  TIERS,
  ESTIMATE_STATUS,
  getRoleName,
  getSkillName,
  getTierName,
  getTierColor
} from '../../services';

// Import contexts
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';

// =============================================================================
// FALLBACK STATIC RATE DATA (used if database is empty)
// =============================================================================

const FALLBACK_RATE_LOOKUP = {
  'DEV-JAVA-3-contractor': 525, 'DEV-JAVA-3-associate': 750, 'DEV-JAVA-3-top4': 1100,
  'DEV-JAVA-4-contractor': 600, 'DEV-JAVA-4-associate': 850, 'DEV-JAVA-4-top4': 1250,
  'DEV-PYTHON-3-contractor': 500, 'DEV-PYTHON-3-associate': 720, 'DEV-PYTHON-3-top4': 1050,
  'DEV-PYTHON-4-contractor': 575, 'DEV-PYTHON-4-associate': 820, 'DEV-PYTHON-4-top4': 1200,
  'SDEV-JAVA-4-contractor': 650, 'SDEV-JAVA-4-associate': 920, 'SDEV-JAVA-4-top4': 1350,
  'SDEV-JAVA-5-contractor': 750, 'SDEV-JAVA-5-associate': 1050, 'SDEV-JAVA-5-top4': 1550,
  'ARCH-AWS-5-contractor': 850, 'ARCH-AWS-5-associate': 1200, 'ARCH-AWS-5-top4': 1800,
  'ARCH-AWS-6-contractor': 950, 'ARCH-AWS-6-associate': 1400, 'ARCH-AWS-6-top4': 2100,
  'DATASCI-PYTHON-4-contractor': 600, 'DATASCI-PYTHON-4-associate': 850, 'DATASCI-PYTHON-4-top4': 1300,
  'DATASCI-ML-5-contractor': 775, 'DATASCI-ML-5-associate': 1100, 'DATASCI-ML-5-top4': 1650,
  'DEVOPS-K8S-4-contractor': 600, 'DEVOPS-K8S-4-associate': 850, 'DEVOPS-K8S-4-top4': 1280,
  'DEVOPS-AWS-5-contractor': 675, 'DEVOPS-AWS-5-associate': 950, 'DEVOPS-AWS-5-top4': 1420,
  'SECENG-AWS-4-contractor': 625, 'SECENG-AWS-4-associate': 880, 'SECENG-AWS-4-top4': 1320,
  'SECARCH-AWS-5-contractor': 800, 'SECARCH-AWS-5-associate': 1140, 'SECARCH-AWS-5-top4': 1720,
  'PM-AGILE-4-contractor': 550, 'PM-AGILE-4-associate': 780, 'PM-AGILE-4-top4': 1180,
  'PM-AGILE-5-contractor': 650, 'PM-AGILE-5-associate': 920, 'PM-AGILE-5-top4': 1380,
  'BA-AGILE-3-contractor': 450, 'BA-AGILE-3-associate': 640, 'BA-AGILE-3-top4': 960,
  'BA-AGILE-4-contractor': 525, 'BA-AGILE-4-associate': 750, 'BA-AGILE-4-top4': 1120
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId() {
  return 'temp-' + Math.random().toString(36).substr(2, 9);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Rate lookup helpers
function getRate(rateLookup, roleId, skillId, level, tier) {
  const key = `${roleId}-${skillId}-${level}-${tier}`;
  return rateLookup[key] || null;
}

function getSkillsForRole(rateLookup, roleId) {
  const roleKeys = Object.keys(rateLookup).filter(k => k.startsWith(roleId + '-'));
  const skillIds = [...new Set(roleKeys.map(k => k.split('-')[1]))];
  return SKILLS.filter(s => skillIds.includes(s.id));
}

function getLevelsForRoleSkill(rateLookup, roleId, skillId) {
  const prefix = `${roleId}-${skillId}-`;
  const keys = Object.keys(rateLookup).filter(k => k.startsWith(prefix));
  const levels = [...new Set(keys.map(k => parseInt(k.split('-')[2])))];
  return levels.sort((a, b) => a - b);
}

// Create empty estimate
function createEmptyEstimate() {
  return {
    id: null,
    name: 'New Estimate',
    description: '',
    status: ESTIMATE_STATUS.DRAFT,
    components: []
  };
}


// =============================================================================
// RESOURCE TYPE SELECTOR COMPONENT
// =============================================================================

function ResourceTypeSelector({ rateLookup, onSelect, onClose, existingTypes = [] }) {
  const [roleId, setRoleId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const [tier, setTier] = useState('contractor');
  
  const availableSkills = roleId ? getSkillsForRole(rateLookup, roleId) : [];
  const availableLevels = roleId && skillId ? getLevelsForRoleSkill(rateLookup, roleId, skillId) : [];
  const rate = roleId && skillId && level && tier ? getRate(rateLookup, roleId, skillId, parseInt(level), tier) : null;
  
  // Check for duplicate using the composite key format
  const proposedKey = `${roleId}-${skillId}-${level}-${tier}`;
  const isDuplicate = existingTypes.some(t => t.id === proposedKey);
  
  const handleAdd = () => {
    if (roleId && skillId && level && tier && rate && !isDuplicate) {
      onSelect({
        id: proposedKey,
        roleId,
        skillId,
        level: parseInt(level),
        tier,
        rate
      });
      onClose();
    }
  };
  
  return (
    <div className="est-resource-selector">
      <div className="est-selector-header">
        <h4>Add Resource Type</h4>
        <button className="est-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="est-selector-grid">
        <div className="est-selector-field">
          <label>Role</label>
          <select value={roleId} onChange={(e) => { setRoleId(e.target.value); setSkillId(''); setLevel(''); }}>
            <option value="">Select role...</option>
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        
        <div className="est-selector-field">
          <label>Skill</label>
          <select value={skillId} onChange={(e) => { setSkillId(e.target.value); setLevel(''); }} disabled={!roleId}>
            <option value="">Select skill...</option>
            {availableSkills.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="est-selector-field">
          <label>SFIA Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={!skillId}>
            <option value="">Level...</option>
            {availableLevels.map(l => (
              <option key={l} value={l}>L{l}</option>
            ))}
          </select>
        </div>
        
        <div className="est-selector-field">
          <label>Rate Tier</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            {TIERS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {rate && (
        <div className="est-selector-preview">
          <span className="est-preview-label">Day Rate:</span>
          <span className="est-preview-rate" style={{ color: getTierColor(tier) }}>
            {formatCurrency(rate)}
          </span>
        </div>
      )}
      
      {isDuplicate && (
        <div className="est-selector-warning">
          This resource type is already added to the component.
        </div>
      )}
      
      <div className="est-selector-actions">
        <button className="est-btn est-btn-secondary" onClick={onClose}>Cancel</button>
        <button 
          className="est-btn est-btn-primary" 
          onClick={handleAdd}
          disabled={!rate || isDuplicate}
        >
          Add Resource Type
        </button>
      </div>
    </div>
  );
}


// =============================================================================
// COMPONENT CARD
// =============================================================================

function ComponentCard({ 
  component, 
  rateLookup,
  onUpdate, 
  onClone, 
  onDelete,
  isExpanded,
  onToggleExpand,
  onMarkChanged
}) {
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  
  // Calculate component totals
  const totals = useMemo(() => {
    const byResource = {};
    let totalDays = 0;
    let totalCost = 0;
    
    component.resourceTypes.forEach(rt => {
      byResource[rt.id] = { days: 0, cost: 0 };
    });
    
    component.tasks.forEach(task => {
      component.resourceTypes.forEach(rt => {
        const days = task.efforts[rt.id] || 0;
        const cost = days * rt.rate;
        byResource[rt.id].days += days;
        byResource[rt.id].cost += cost;
        totalDays += days;
        totalCost += cost;
      });
    });
    
    return { byResource, totalDays, totalCost, grandTotal: totalCost * component.quantity };
  }, [component]);
  
  const handleChange = (updates) => {
    onUpdate(updates);
    onMarkChanged();
  };
  
  const handleAddTask = () => {
    const newTask = {
      id: generateId(),
      name: '',
      description: '',
      efforts: {}
    };
    handleChange({
      ...component,
      tasks: [...component.tasks, newTask]
    });
  };
  
  const handleUpdateTask = (taskId, field, value) => {
    handleChange({
      ...component,
      tasks: component.tasks.map(t => 
        t.id === taskId ? { ...t, [field]: value } : t
      )
    });
  };
  
  const handleUpdateEffort = (taskId, resourceId, days) => {
    const numDays = parseFloat(days) || 0;
    handleChange({
      ...component,
      tasks: component.tasks.map(t => 
        t.id === taskId ? { ...t, efforts: { ...t.efforts, [resourceId]: numDays } } : t
      )
    });
  };
  
  const handleDeleteTask = (taskId) => {
    handleChange({
      ...component,
      tasks: component.tasks.filter(t => t.id !== taskId)
    });
  };
  
  const handleAddResourceType = (resourceType) => {
    handleChange({
      ...component,
      resourceTypes: [...component.resourceTypes, resourceType]
    });
  };
  
  const handleRemoveResourceType = (resourceId) => {
    handleChange({
      ...component,
      resourceTypes: component.resourceTypes.filter(r => r.id !== resourceId),
      tasks: component.tasks.map(t => {
        const { [resourceId]: removed, ...remainingEfforts } = t.efforts;
        return { ...t, efforts: remainingEfforts };
      })
    });
  };
  
  return (
    <div className="est-component-card">
      <div className="est-component-header" onClick={onToggleExpand}>
        <div className="est-component-drag">
          <GripVertical size={16} />
        </div>
        
        <div className="est-component-title">
          <input
            type="text"
            value={component.name}
            onChange={(e) => handleChange({ ...component, name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Component name..."
            className="est-component-name-input"
          />
          <span className="est-component-summary">
            {component.tasks.length} task{component.tasks.length !== 1 ? 's' : ''} • 
            {component.resourceTypes.length} resource type{component.resourceTypes.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="est-component-quantity" onClick={(e) => e.stopPropagation()}>
          <label>Qty:</label>
          <input
            type="number"
            min="1"
            value={component.quantity}
            onChange={(e) => handleChange({ ...component, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
        
        <div className="est-component-total">
          <span className="est-total-label">Component Total</span>
          <span className="est-total-value">{formatCurrency(totals.grandTotal)}</span>
          {component.quantity > 1 && (
            <span className="est-total-breakdown">
              ({formatCurrency(totals.totalCost)} × {component.quantity})
            </span>
          )}
        </div>
        
        <div className="est-component-actions" onClick={(e) => e.stopPropagation()}>
          <button className="est-action-btn" onClick={onClone} title="Clone component">
            <Copy size={16} />
          </button>
          <button className="est-action-btn est-action-delete" onClick={onDelete} title="Delete component">
            <Trash2 size={16} />
          </button>
          <button className="est-action-btn est-action-expand">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      
      {isExpanded && (
        <div className="est-component-body">
          {/* Description */}
          <div className="est-component-description">
            <textarea
              value={component.description}
              onChange={(e) => handleChange({ ...component, description: e.target.value })}
              placeholder="Component description (optional)..."
              rows={2}
            />
          </div>
          
          {/* Grid */}
          <div className="est-grid-wrapper">
            <table className="est-grid">
              <thead>
                <tr>
                  <th className="est-col-task">Task</th>
                  <th className="est-col-desc">Description</th>
                  {component.resourceTypes.map(rt => (
                    <th key={rt.id} className="est-col-resource">
                      <div className="est-resource-header">
                        <span className="est-resource-name">{getRoleName(rt.roleId)}</span>
                        <span className="est-resource-detail">
                          {getSkillName(rt.skillId)} • L{rt.level}
                        </span>
                        <span className="est-resource-rate" style={{ color: getTierColor(rt.tier) }}>
                          {formatCurrency(rt.rate)}/day
                        </span>
                        <button 
                          className="est-resource-remove"
                          onClick={() => handleRemoveResourceType(rt.id)}
                          title="Remove resource type"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="est-col-add-resource">
                    <button 
                      className="est-add-resource-btn"
                      onClick={() => setShowResourceSelector(true)}
                      title="Add resource type"
                    >
                      <Plus size={14} />
                    </button>
                  </th>
                  <th className="est-col-row-total">Row Total</th>
                  <th className="est-col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {component.tasks.map((task, index) => {
                  const rowTotal = component.resourceTypes.reduce((sum, rt) => {
                    return sum + ((task.efforts[rt.id] || 0) * rt.rate);
                  }, 0);
                  
                  return (
                    <tr key={task.id}>
                      <td className="est-col-task">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => handleUpdateTask(task.id, 'name', e.target.value)}
                          placeholder={`Task ${index + 1}`}
                        />
                      </td>
                      <td className="est-col-desc">
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => handleUpdateTask(task.id, 'description', e.target.value)}
                          placeholder="Description..."
                        />
                      </td>
                      {component.resourceTypes.map(rt => (
                        <td key={rt.id} className="est-col-resource">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={task.efforts[rt.id] || ''}
                            onChange={(e) => handleUpdateEffort(task.id, rt.id, e.target.value)}
                            placeholder="0"
                            className="est-effort-input"
                          />
                        </td>
                      ))}
                      <td className="est-col-add-resource"></td>
                      <td className="est-col-row-total">
                        {rowTotal > 0 ? formatCurrency(rowTotal) : '-'}
                      </td>
                      <td className="est-col-actions">
                        <button 
                          className="est-row-delete"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Add Task Row */}
                <tr className="est-add-task-row">
                  <td colSpan={component.resourceTypes.length + 5}>
                    <button className="est-add-task-btn" onClick={handleAddTask}>
                      <Plus size={14} />
                      Add Task
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="est-totals-row">
                  <td className="est-col-task"><strong>Totals</strong></td>
                  <td className="est-col-desc"></td>
                  {component.resourceTypes.map(rt => (
                    <td key={rt.id} className="est-col-resource">
                      <div className="est-column-total">
                        <span className="est-days-total">{totals.byResource[rt.id]?.days || 0} days</span>
                        <span className="est-cost-total">{formatCurrency(totals.byResource[rt.id]?.cost || 0)}</span>
                      </div>
                    </td>
                  ))}
                  <td className="est-col-add-resource"></td>
                  <td className="est-col-row-total">
                    <strong>{formatCurrency(totals.totalCost)}</strong>
                  </td>
                  <td className="est-col-actions"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Resource Type Selector Modal */}
          {showResourceSelector && (
            <div className="est-modal-overlay" onClick={() => setShowResourceSelector(false)}>
              <div className="est-modal" onClick={(e) => e.stopPropagation()}>
                <ResourceTypeSelector
                  rateLookup={rateLookup}
                  onSelect={handleAddResourceType}
                  onClose={() => setShowResourceSelector(false)}
                  existingTypes={component.resourceTypes}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// =============================================================================
// ESTIMATE SELECTOR DROPDOWN
// =============================================================================

function EstimateSelector({ 
  currentEstimate, 
  availableEstimates, 
  onNew, 
  onSelect, 
  onDuplicate,
  onDelete,
  isLoading 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (est) => {
    onSelect(est.id);
    setIsOpen(false);
  };

  const handleDelete = () => {
    setShowConfirmDelete(false);
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="est-estimate-selector" ref={dropdownRef}>
      <button 
        className="est-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <FolderOpen size={18} />
        <span className="est-selector-name">
          {currentEstimate?.name || 'New Estimate'}
        </span>
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="est-selector-dropdown">
          <div className="est-selector-section">
            <button className="est-selector-item est-selector-new" onClick={() => { onNew(); setIsOpen(false); }}>
              <FilePlus size={16} />
              New Estimate
            </button>
          </div>

          {availableEstimates.length > 0 && (
            <div className="est-selector-section">
              <div className="est-selector-section-title">Recent Estimates</div>
              {availableEstimates.map(est => (
                <button 
                  key={est.id} 
                  className={`est-selector-item ${est.id === currentEstimate?.id ? 'active' : ''}`}
                  onClick={() => handleSelect(est)}
                >
                  <div className="est-selector-item-info">
                    <span className="est-selector-item-name">{est.name}</span>
                    <span className="est-selector-item-meta">
                      {formatCurrency(est.totalCost)} • {est.componentCount} components
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentEstimate?.id && (
            <div className="est-selector-section est-selector-actions-section">
              <button 
                className="est-selector-item"
                onClick={() => { onDuplicate(); setIsOpen(false); }}
              >
                <Copy size={16} />
                Duplicate Estimate
              </button>
              <button 
                className="est-selector-item est-selector-delete"
                onClick={() => setShowConfirmDelete(true)}
              >
                <Trash2 size={16} />
                Delete Estimate
              </button>
            </div>
          )}

          {showConfirmDelete && (
            <div className="est-selector-confirm">
              <p>Delete "{currentEstimate?.name}"?</p>
              <div className="est-selector-confirm-actions">
                <button onClick={() => setShowConfirmDelete(false)}>Cancel</button>
                <button className="danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Estimator() {
  // Context hooks
  const { currentProject } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const [searchParams] = useSearchParams();
  
  // Rate data state
  const [rateLookup, setRateLookup] = useState(FALLBACK_RATE_LOOKUP);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);
  const [ratesSource, setRatesSource] = useState('loading');
  
  // Estimate data state
  const [estimate, setEstimate] = useState(createEmptyEstimate());
  const [availableEstimates, setAvailableEstimates] = useState([]);
  const [expandedComponents, setExpandedComponents] = useState(new Set());
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Refs
  const initialLoadDone = useRef(false);

  // Load rates from database on mount
  useEffect(() => {
    async function loadRates() {
      try {
        setRatesLoading(true);
        setRatesError(null);
        
        const lookup = await benchmarkRatesService.buildRateLookup();
        
        if (lookup && Object.keys(lookup).length > 0) {
          setRateLookup(lookup);
          setRatesSource('database');
        } else {
          console.warn('No benchmark rates in database, using fallback data');
          setRateLookup(FALLBACK_RATE_LOOKUP);
          setRatesSource('fallback');
        }
      } catch (err) {
        console.error('Failed to load benchmark rates:', err);
        setRatesError(err.message);
        setRateLookup(FALLBACK_RATE_LOOKUP);
        setRatesSource('fallback');
      } finally {
        setRatesLoading(false);
      }
    }
    
    loadRates();
  }, []);

  // Load available estimates when project changes
  useEffect(() => {
    async function loadEstimates() {
      if (!currentProject?.id) return;
      
      try {
        const estimates = await estimatesService.getSummaryList(currentProject.id);
        setAvailableEstimates(estimates);
        
        // On initial load, if there's a recent estimate, don't auto-load it
        // User should explicitly choose to load an estimate
        initialLoadDone.current = true;
      } catch (err) {
        console.error('Failed to load estimates:', err);
        showError('Failed to load estimates');
      }
    }
    
    loadEstimates();
  }, [currentProject?.id]);

  // Load estimate from URL parameter (e.g., /estimator?estimateId=xxx)
  useEffect(() => {
    async function loadFromUrl() {
      const estimateId = searchParams.get('estimateId');
      if (!estimateId || !currentProject?.id) return;
      
      try {
        setIsLoading(true);
        const fullEstimate = await estimatesService.getWithDetails(estimateId);
        
        if (fullEstimate) {
          setEstimate(fullEstimate);
          setExpandedComponents(new Set(fullEstimate.components?.map(c => c.id) || []));
          setHasUnsavedChanges(false);
          setLastSavedAt(fullEstimate.updated_at ? new Date(fullEstimate.updated_at) : null);
          showSuccess(`Loaded estimate: ${fullEstimate.name}`);
        }
      } catch (err) {
        console.error('Failed to load estimate from URL:', err);
        showError('Failed to load estimate');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only load from URL on mount, not on every searchParams change
    if (initialLoadDone.current) {
      loadFromUrl();
    }
  }, [searchParams, currentProject?.id, initialLoadDone.current]);

  // Calculate estimate totals
  const estimateTotals = useMemo(() => {
    let totalDays = 0;
    let totalCost = 0;
    
    estimate.components.forEach(comp => {
      comp.tasks.forEach(task => {
        comp.resourceTypes.forEach(rt => {
          const days = task.efforts[rt.id] || 0;
          totalDays += days * comp.quantity;
          totalCost += (days * rt.rate) * comp.quantity;
        });
      });
    });
    
    return { totalDays, totalCost, componentCount: estimate.components.length };
  }, [estimate]);

  // Mark as having unsaved changes
  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Handler: New Estimate
  const handleNewEstimate = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Create new estimate anyway?')) {
        return;
      }
    }
    setEstimate(createEmptyEstimate());
    setExpandedComponents(new Set());
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
  }, [hasUnsavedChanges]);

  // Handler: Load Estimate
  const handleLoadEstimate = useCallback(async (estimateId) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Load different estimate anyway?')) {
        return;
      }
    }

    try {
      setIsLoading(true);
      const fullEstimate = await estimatesService.getWithDetails(estimateId);
      const uiFormat = estimatesService.toUIFormat(fullEstimate);
      
      setEstimate(uiFormat);
      setExpandedComponents(new Set(uiFormat.components.map(c => c.id)));
      setHasUnsavedChanges(false);
      setLastSavedAt(fullEstimate.updated_at);
      
      showSuccess(`Loaded "${uiFormat.name}"`);
    } catch (err) {
      console.error('Failed to load estimate:', err);
      showError('Failed to load estimate');
    } finally {
      setIsLoading(false);
    }
  }, [hasUnsavedChanges, showSuccess, showError]);


  // Handler: Save Estimate
  const handleSaveEstimate = useCallback(async () => {
    if (!currentProject?.id) {
      showWarning('Please select a project first');
      return;
    }

    try {
      setIsSaving(true);
      
      const savedEstimate = await estimatesService.saveFullEstimate(currentProject.id, estimate);
      const uiFormat = estimatesService.toUIFormat(savedEstimate);
      
      setEstimate(uiFormat);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toISOString());
      
      // Refresh available estimates list
      const estimates = await estimatesService.getSummaryList(currentProject.id);
      setAvailableEstimates(estimates);
      
      showSuccess('Estimate saved');
    } catch (err) {
      console.error('Failed to save estimate:', err);
      showError('Failed to save estimate');
    } finally {
      setIsSaving(false);
    }
  }, [currentProject?.id, estimate, showSuccess, showError, showWarning]);

  // Handler: Duplicate Estimate
  const handleDuplicateEstimate = useCallback(async () => {
    if (!estimate.id) {
      showWarning('Save the estimate first before duplicating');
      return;
    }

    try {
      setIsLoading(true);
      
      const duplicated = await estimatesService.duplicateEstimate(estimate.id);
      const uiFormat = estimatesService.toUIFormat(duplicated);
      
      setEstimate(uiFormat);
      setExpandedComponents(new Set(uiFormat.components.map(c => c.id)));
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toISOString());
      
      // Refresh available estimates list
      const estimates = await estimatesService.getSummaryList(currentProject.id);
      setAvailableEstimates(estimates);
      
      showSuccess(`Created "${uiFormat.name}"`);
    } catch (err) {
      console.error('Failed to duplicate estimate:', err);
      showError('Failed to duplicate estimate');
    } finally {
      setIsLoading(false);
    }
  }, [estimate.id, currentProject?.id, showSuccess, showError, showWarning]);

  // Handler: Delete Estimate
  const handleDeleteEstimate = useCallback(async () => {
    if (!estimate.id) {
      handleNewEstimate();
      return;
    }

    try {
      setIsLoading(true);
      
      await estimatesService.delete(estimate.id);
      
      // Refresh available estimates list
      const estimates = await estimatesService.getSummaryList(currentProject.id);
      setAvailableEstimates(estimates);
      
      // Reset to new estimate
      setEstimate(createEmptyEstimate());
      setExpandedComponents(new Set());
      setHasUnsavedChanges(false);
      setLastSavedAt(null);
      
      showSuccess('Estimate deleted');
    } catch (err) {
      console.error('Failed to delete estimate:', err);
      showError('Failed to delete estimate');
    } finally {
      setIsLoading(false);
    }
  }, [estimate.id, currentProject?.id, handleNewEstimate, showSuccess, showError]);

  // Handler: Add Component
  const handleAddComponent = useCallback(() => {
    const newComponent = {
      id: generateId(),
      name: `Component ${estimate.components.length + 1}`,
      description: '',
      quantity: 1,
      resourceTypes: [],
      tasks: [{ id: generateId(), name: '', description: '', efforts: {} }]
    };
    setEstimate(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
    setExpandedComponents(prev => new Set([...prev, newComponent.id]));
    markChanged();
  }, [estimate.components.length, markChanged]);
  
  // Handler: Update Component
  const handleUpdateComponent = useCallback((componentId, updates) => {
    setEstimate(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === componentId ? updates : c
      )
    }));
  }, []);
  
  // Handler: Clone Component
  const handleCloneComponent = useCallback((componentId) => {
    const original = estimate.components.find(c => c.id === componentId);
    if (!original) return;
    
    const cloned = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: `${original.name} (Copy)`
    };
    // Regenerate IDs for tasks
    cloned.tasks = cloned.tasks.map(t => ({ ...t, id: generateId() }));
    
    const index = estimate.components.findIndex(c => c.id === componentId);
    const newComponents = [...estimate.components];
    newComponents.splice(index + 1, 0, cloned);
    
    setEstimate(prev => ({ ...prev, components: newComponents }));
    setExpandedComponents(prev => new Set([...prev, cloned.id]));
    markChanged();
  }, [estimate.components, markChanged]);
  
  // Handler: Delete Component
  const handleDeleteComponent = useCallback((componentId) => {
    setEstimate(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }));
    setExpandedComponents(prev => {
      const next = new Set(prev);
      next.delete(componentId);
      return next;
    });
    markChanged();
  }, [markChanged]);
  
  // Handler: Toggle Component Expanded
  const toggleComponentExpanded = useCallback((componentId) => {
    setExpandedComponents(prev => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  }, []);
  
  // Handler: Expand/Collapse All
  const expandAll = () => setExpandedComponents(new Set(estimate.components.map(c => c.id)));
  const collapseAll = () => setExpandedComponents(new Set());

  // Handler: Update Estimate Name
  const handleUpdateName = useCallback((name) => {
    setEstimate(prev => ({ ...prev, name }));
    markChanged();
  }, [markChanged]);


  // Loading state (rates)
  if (ratesLoading) {
    return (
      <div className="estimator-page" data-testid="estimator-page">
        <div className="est-loading">
          <Loader2 size={48} className="est-spinner" />
          <p>Loading benchmark rates...</p>
        </div>
      </div>
    );
  }

  // No project selected
  if (!currentProject) {
    return (
      <div className="estimator-page" data-testid="estimator-page">
        <div className="est-no-project">
          <Calculator size={48} />
          <h2>No Project Selected</h2>
          <p>Please select a project from the header to use the Estimator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="estimator-page" data-testid="estimator-page">
      {/* Header */}
      <header className="est-header">
        <div className="est-header-content">
          <div className="est-header-left">
            <Link to="/planning" className="est-back-link" title="Back to Planning">
              <ArrowLeft size={18} />
            </Link>
            <div className="est-header-icon">
              <Calculator size={24} />
            </div>
            <div className="est-header-info">
              <div className="est-header-title-row">
                <EstimateSelector
                  currentEstimate={estimate}
                  availableEstimates={availableEstimates}
                  onNew={handleNewEstimate}
                  onSelect={handleLoadEstimate}
                  onDuplicate={handleDuplicateEstimate}
                  onDelete={handleDeleteEstimate}
                  isLoading={isLoading}
                />
                {hasUnsavedChanges && (
                  <span className="est-unsaved-indicator" title="Unsaved changes">
                    ●
                  </span>
                )}
              </div>
              <div className="est-header-meta">
                <span>Component-based cost estimation</span>
                {lastSavedAt && (
                  <span className="est-last-saved">
                    <Clock size={12} />
                    Saved {formatDateTime(lastSavedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="est-header-totals">
            <div className="est-header-stat">
              <span className="est-stat-label">Components</span>
              <span className="est-stat-value">{estimateTotals.componentCount}</span>
            </div>
            <div className="est-header-stat">
              <span className="est-stat-label">Total Days</span>
              <span className="est-stat-value">{estimateTotals.totalDays.toFixed(1)}</span>
            </div>
            <div className="est-header-stat est-stat-total">
              <span className="est-stat-label">Estimate Total</span>
              <span className="est-stat-value">{formatCurrency(estimateTotals.totalCost)}</span>
            </div>
          </div>
          
          <div className="est-header-actions">
            <button 
              className="est-btn est-btn-secondary" 
              onClick={() => showWarning('Export coming soon!')}
            >
              <FileDown size={18} />
              Export
            </button>
            <button 
              className={`est-btn est-btn-primary ${isSaving ? 'est-btn-loading' : ''}`}
              onClick={handleSaveEstimate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="est-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>
      
      {/* Warnings */}
      {ratesSource === 'fallback' && (
        <div className="est-warning">
          <AlertCircle size={18} />
          <span>
            Using sample rate data. Run the database migration to load full benchmark rates.
            {ratesError && ` (Error: ${ratesError})`}
          </span>
        </div>
      )}
      
      {isLoading && (
        <div className="est-loading-overlay">
          <Loader2 size={32} className="est-spinner" />
        </div>
      )}
      
      {/* Toolbar */}
      <div className="est-toolbar">
        <div className="est-toolbar-content">
          <div className="est-toolbar-left">
            <button className="est-btn est-btn-primary" onClick={handleAddComponent}>
              <Plus size={18} />
              Add Component
            </button>
          </div>
          <div className="est-toolbar-right">
            <button className="est-btn est-btn-text" onClick={expandAll}>
              Expand All
            </button>
            <button className="est-btn est-btn-text" onClick={collapseAll}>
              Collapse All
            </button>
          </div>
        </div>
      </div>

      
      {/* Main Content */}
      <div className="est-content">
        {estimate.components.length === 0 ? (
          <div className="est-empty">
            <Calculator size={64} />
            <h2>No components yet</h2>
            <p>Add your first component to start building your estimate.</p>
            <button className="est-btn est-btn-primary est-btn-large" onClick={handleAddComponent}>
              <Plus size={20} />
              Add First Component
            </button>
          </div>
        ) : (
          <div className="est-components">
            {estimate.components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                rateLookup={rateLookup}
                onUpdate={(updates) => handleUpdateComponent(component.id, updates)}
                onClone={() => handleCloneComponent(component.id)}
                onDelete={() => handleDeleteComponent(component.id)}
                isExpanded={expandedComponents.has(component.id)}
                onToggleExpand={() => toggleComponentExpanded(component.id)}
                onMarkChanged={markChanged}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Summary */}
      {estimate.components.length > 0 && (
        <footer className="est-footer">
          <div className="est-footer-content">
            <div className="est-footer-left">
              {hasUnsavedChanges && (
                <span className="est-footer-unsaved">
                  <AlertCircle size={14} />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="est-footer-summary">
              <div className="est-summary-item">
                <span className="est-summary-label">Components:</span>
                <span className="est-summary-value">{estimateTotals.componentCount}</span>
              </div>
              <div className="est-summary-item">
                <span className="est-summary-label">Total Effort:</span>
                <span className="est-summary-value">{estimateTotals.totalDays.toFixed(1)} days</span>
              </div>
              <div className="est-summary-item est-summary-total">
                <span className="est-summary-label">Estimate Total:</span>
                <span className="est-summary-value">{formatCurrency(estimateTotals.totalCost)}</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
