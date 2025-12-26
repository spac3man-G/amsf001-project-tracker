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
 * 
 * Access: Admin and Supplier PM only
 * 
 * @version 1.0 - Static MVP
 * @created 26 December 2025
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Save,
  FileDown,
  Settings2,
  X,
  GripVertical,
  Hash
} from 'lucide-react';
import './Estimator.css';

// =============================================================================
// BENCHMARK DATA (shared with Benchmarking page - will be refactored to service)
// =============================================================================

const ROLES = [
  { id: 'DEV', name: 'Software Developer', familyId: 'SE' },
  { id: 'SDEV', name: 'Senior Developer', familyId: 'SE' },
  { id: 'LDEV', name: 'Lead Developer', familyId: 'SE' },
  { id: 'ARCH', name: 'Solutions Architect', familyId: 'SE' },
  { id: 'DATASCI', name: 'Data Scientist', familyId: 'DA' },
  { id: 'DATAENG', name: 'Data Engineer', familyId: 'DA' },
  { id: 'MLENG', name: 'ML Engineer', familyId: 'DA' },
  { id: 'DEVOPS', name: 'DevOps Engineer', familyId: 'DEVOPS' },
  { id: 'SRE', name: 'Site Reliability Engineer', familyId: 'DEVOPS' },
  { id: 'CLOUD', name: 'Cloud Engineer', familyId: 'DEVOPS' },
  { id: 'BA', name: 'Business Analyst', familyId: 'BA' },
  { id: 'SBA', name: 'Senior Business Analyst', familyId: 'BA' },
  { id: 'PO', name: 'Product Owner', familyId: 'BA' },
  { id: 'SECENG', name: 'Security Engineer', familyId: 'SEC' },
  { id: 'SECARCH', name: 'Security Architect', familyId: 'SEC' },
  { id: 'PM', name: 'Project Manager', familyId: 'PM' },
  { id: 'SPM', name: 'Senior Project Manager', familyId: 'PM' },
  { id: 'DELM', name: 'Delivery Manager', familyId: 'PM' },
  { id: 'PROG', name: 'Programme Manager', familyId: 'PM' }
];

const SKILLS = [
  { id: 'JAVA', name: 'Java' },
  { id: 'PYTHON', name: 'Python' },
  { id: 'DOTNET', name: '.NET/C#' },
  { id: 'JS', name: 'JavaScript/TS' },
  { id: 'AWS', name: 'AWS' },
  { id: 'AZURE', name: 'Azure' },
  { id: 'GCP', name: 'GCP' },
  { id: 'K8S', name: 'Kubernetes' },
  { id: 'ML', name: 'Machine Learning' },
  { id: 'SQL', name: 'SQL/Databases' },
  { id: 'AGILE', name: 'Agile/Scrum' }
];

const TIERS = [
  { id: 'contractor', name: 'Contractor', color: '#2563eb' },
  { id: 'associate', name: 'Associate', color: '#059669' },
  { id: 'top4', name: 'Top 4', color: '#7c3aed' }
];

const SFIA_LEVELS = [3, 4, 5, 6, 7];

// Sample benchmark rates lookup
const RATE_LOOKUP = {
  'DEV-JAVA-3-contractor': 525, 'DEV-JAVA-3-associate': 750, 'DEV-JAVA-3-top4': 1100,
  'DEV-JAVA-4-contractor': 600, 'DEV-JAVA-4-associate': 850, 'DEV-JAVA-4-top4': 1250,
  'DEV-PYTHON-3-contractor': 500, 'DEV-PYTHON-3-associate': 720, 'DEV-PYTHON-3-top4': 1050,
  'DEV-PYTHON-4-contractor': 575, 'DEV-PYTHON-4-associate': 820, 'DEV-PYTHON-4-top4': 1200,
  'SDEV-JAVA-4-contractor': 650, 'SDEV-JAVA-4-associate': 920, 'SDEV-JAVA-4-top4': 1350,
  'SDEV-JAVA-5-contractor': 750, 'SDEV-JAVA-5-associate': 1050, 'SDEV-JAVA-5-top4': 1550,
  'SDEV-PYTHON-4-contractor': 625, 'SDEV-PYTHON-4-associate': 880, 'SDEV-PYTHON-4-top4': 1300,
  'SDEV-PYTHON-5-contractor': 725, 'SDEV-PYTHON-5-associate': 1000, 'SDEV-PYTHON-5-top4': 1480,
  'LDEV-JAVA-5-contractor': 800, 'LDEV-JAVA-5-associate': 1150, 'LDEV-JAVA-5-top4': 1700,
  'LDEV-JAVA-6-contractor': 900, 'LDEV-JAVA-6-associate': 1300, 'LDEV-JAVA-6-top4': 1950,
  'ARCH-AWS-5-contractor': 850, 'ARCH-AWS-5-associate': 1200, 'ARCH-AWS-5-top4': 1800,
  'ARCH-AWS-6-contractor': 950, 'ARCH-AWS-6-associate': 1400, 'ARCH-AWS-6-top4': 2100,
  'ARCH-AZURE-5-contractor': 825, 'ARCH-AZURE-5-associate': 1150, 'ARCH-AZURE-5-top4': 1750,
  'DATASCI-PYTHON-4-contractor': 600, 'DATASCI-PYTHON-4-associate': 850, 'DATASCI-PYTHON-4-top4': 1300,
  'DATASCI-ML-5-contractor': 775, 'DATASCI-ML-5-associate': 1100, 'DATASCI-ML-5-top4': 1650,
  'DATAENG-SQL-4-contractor': 525, 'DATAENG-SQL-4-associate': 750, 'DATAENG-SQL-4-top4': 1100,
  'MLENG-ML-5-contractor': 825, 'MLENG-ML-5-associate': 1180, 'MLENG-ML-5-top4': 1750,
  'DEVOPS-K8S-4-contractor': 600, 'DEVOPS-K8S-4-associate': 850, 'DEVOPS-K8S-4-top4': 1280,
  'DEVOPS-AWS-4-contractor': 575, 'DEVOPS-AWS-4-associate': 820, 'DEVOPS-AWS-4-top4': 1220,
  'DEVOPS-AWS-5-contractor': 675, 'DEVOPS-AWS-5-associate': 950, 'DEVOPS-AWS-5-top4': 1420,
  'SRE-K8S-5-contractor': 725, 'SRE-K8S-5-associate': 1030, 'SRE-K8S-5-top4': 1550,
  'CLOUD-AWS-4-contractor': 600, 'CLOUD-AWS-4-associate': 850, 'CLOUD-AWS-4-top4': 1280,
  'CLOUD-AZURE-4-contractor': 580, 'CLOUD-AZURE-4-associate': 820, 'CLOUD-AZURE-4-top4': 1240,
  'BA-AGILE-3-contractor': 450, 'BA-AGILE-3-associate': 640, 'BA-AGILE-3-top4': 960,
  'BA-AGILE-4-contractor': 525, 'BA-AGILE-4-associate': 750, 'BA-AGILE-4-top4': 1120,
  'SBA-AGILE-4-contractor': 575, 'SBA-AGILE-4-associate': 820, 'SBA-AGILE-4-top4': 1220,
  'SBA-AGILE-5-contractor': 650, 'SBA-AGILE-5-associate': 920, 'SBA-AGILE-5-top4': 1380,
  'PO-AGILE-4-contractor': 600, 'PO-AGILE-4-associate': 850, 'PO-AGILE-4-top4': 1280,
  'PO-AGILE-5-contractor': 700, 'PO-AGILE-5-associate': 1000, 'PO-AGILE-5-top4': 1500,
  'SECENG-AWS-4-contractor': 625, 'SECENG-AWS-4-associate': 880, 'SECENG-AWS-4-top4': 1320,
  'SECARCH-AWS-5-contractor': 800, 'SECARCH-AWS-5-associate': 1140, 'SECARCH-AWS-5-top4': 1720,
  'PM-AGILE-4-contractor': 550, 'PM-AGILE-4-associate': 780, 'PM-AGILE-4-top4': 1180,
  'PM-AGILE-5-contractor': 650, 'PM-AGILE-5-associate': 920, 'PM-AGILE-5-top4': 1380,
  'SPM-AGILE-5-contractor': 700, 'SPM-AGILE-5-associate': 1000, 'SPM-AGILE-5-top4': 1500,
  'SPM-AGILE-6-contractor': 800, 'SPM-AGILE-6-associate': 1150, 'SPM-AGILE-6-top4': 1720,
  'DELM-AGILE-5-contractor': 725, 'DELM-AGILE-5-associate': 1030, 'DELM-AGILE-5-top4': 1550,
  'PROG-AGILE-6-contractor': 900, 'PROG-AGILE-6-associate': 1300, 'PROG-AGILE-6-top4': 1950,
  'PROG-AGILE-7-contractor': 1050, 'PROG-AGILE-7-associate': 1500, 'PROG-AGILE-7-top4': 2250
};

// Helper to get rate
function getRate(roleId, skillId, level, tier) {
  const key = `${roleId}-${skillId}-${level}-${tier}`;
  return RATE_LOOKUP[key] || null;
}

// Get available skills for a role
function getSkillsForRole(roleId) {
  const roleKeys = Object.keys(RATE_LOOKUP).filter(k => k.startsWith(roleId + '-'));
  const skillIds = [...new Set(roleKeys.map(k => k.split('-')[1]))];
  return SKILLS.filter(s => skillIds.includes(s.id));
}

// Get available levels for role+skill
function getLevelsForRoleSkill(roleId, skillId) {
  const prefix = `${roleId}-${skillId}-`;
  const keys = Object.keys(RATE_LOOKUP).filter(k => k.startsWith(prefix));
  const levels = [...new Set(keys.map(k => parseInt(k.split('-')[2])))];
  return levels.sort((a, b) => a - b);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getRoleName(roleId) {
  return ROLES.find(r => r.id === roleId)?.name || roleId;
}

function getSkillName(skillId) {
  return SKILLS.find(s => s.id === skillId)?.name || skillId;
}

function getTierName(tierId) {
  return TIERS.find(t => t.id === tierId)?.name || tierId;
}

function getTierColor(tierId) {
  return TIERS.find(t => t.id === tierId)?.color || '#666';
}

// =============================================================================
// RESOURCE TYPE SELECTOR COMPONENT
// =============================================================================

function ResourceTypeSelector({ onSelect, onClose, existingTypes = [] }) {
  const [roleId, setRoleId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const [tier, setTier] = useState('contractor');
  
  const availableSkills = roleId ? getSkillsForRole(roleId) : [];
  const availableLevels = roleId && skillId ? getLevelsForRoleSkill(roleId, skillId) : [];
  const rate = roleId && skillId && level && tier ? getRate(roleId, skillId, parseInt(level), tier) : null;
  
  const isDuplicate = existingTypes.some(t => 
    t.roleId === roleId && t.skillId === skillId && t.level === parseInt(level) && t.tier === tier
  );
  
  const handleAdd = () => {
    if (roleId && skillId && level && tier && rate && !isDuplicate) {
      onSelect({
        id: generateId(),
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
  onUpdate, 
  onClone, 
  onDelete,
  isExpanded,
  onToggleExpand
}) {
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  
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
  
  const handleAddTask = () => {
    const newTask = {
      id: generateId(),
      name: '',
      description: '',
      efforts: {}
    };
    onUpdate({
      ...component,
      tasks: [...component.tasks, newTask]
    });
  };
  
  const handleUpdateTask = (taskId, field, value) => {
    onUpdate({
      ...component,
      tasks: component.tasks.map(t => 
        t.id === taskId ? { ...t, [field]: value } : t
      )
    });
  };
  
  const handleUpdateEffort = (taskId, resourceId, days) => {
    const numDays = parseFloat(days) || 0;
    onUpdate({
      ...component,
      tasks: component.tasks.map(t => 
        t.id === taskId ? { ...t, efforts: { ...t.efforts, [resourceId]: numDays } } : t
      )
    });
  };
  
  const handleDeleteTask = (taskId) => {
    onUpdate({
      ...component,
      tasks: component.tasks.filter(t => t.id !== taskId)
    });
  };
  
  const handleAddResourceType = (resourceType) => {
    onUpdate({
      ...component,
      resourceTypes: [...component.resourceTypes, resourceType]
    });
  };
  
  const handleRemoveResourceType = (resourceId) => {
    onUpdate({
      ...component,
      resourceTypes: component.resourceTypes.filter(r => r.id !== resourceId),
      tasks: component.tasks.map(t => {
        const { [resourceId]: removed, ...remainingEfforts } = t.efforts;
        return { ...t, efforts: remainingEfforts };
      })
    });
  };
  
  const handleKeyDown = (e, taskId, resourceId) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      setEditingCell(null);
    }
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
            onChange={(e) => onUpdate({ ...component, name: e.target.value })}
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
            onChange={(e) => onUpdate({ ...component, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
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
              onChange={(e) => onUpdate({ ...component, description: e.target.value })}
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
                            onKeyDown={(e) => handleKeyDown(e, task.id, rt.id)}
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
// MAIN COMPONENT
// =============================================================================

export default function Estimator() {
  const [estimate, setEstimate] = useState({
    name: 'New Estimate',
    description: '',
    components: []
  });
  
  const [expandedComponents, setExpandedComponents] = useState(new Set());
  
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
  
  const handleAddComponent = () => {
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
  };
  
  const handleUpdateComponent = (componentId, updates) => {
    setEstimate(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === componentId ? updates : c
      )
    }));
  };
  
  const handleCloneComponent = (componentId) => {
    const original = estimate.components.find(c => c.id === componentId);
    if (!original) return;
    
    const cloned = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: `${original.name} (Copy)`
    };
    // Regenerate IDs for tasks
    cloned.tasks = cloned.tasks.map(t => ({ ...t, id: generateId() }));
    // Regenerate IDs for resource types
    const rtIdMap = {};
    cloned.resourceTypes = cloned.resourceTypes.map(rt => {
      const newId = generateId();
      rtIdMap[rt.id] = newId;
      return { ...rt, id: newId };
    });
    // Update effort keys
    cloned.tasks = cloned.tasks.map(t => {
      const newEfforts = {};
      Object.entries(t.efforts).forEach(([oldId, value]) => {
        if (rtIdMap[oldId]) newEfforts[rtIdMap[oldId]] = value;
      });
      return { ...t, efforts: newEfforts };
    });
    
    const index = estimate.components.findIndex(c => c.id === componentId);
    const newComponents = [...estimate.components];
    newComponents.splice(index + 1, 0, cloned);
    
    setEstimate(prev => ({ ...prev, components: newComponents }));
    setExpandedComponents(prev => new Set([...prev, cloned.id]));
  };
  
  const handleDeleteComponent = (componentId) => {
    setEstimate(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }));
    setExpandedComponents(prev => {
      const next = new Set(prev);
      next.delete(componentId);
      return next;
    });
  };
  
  const toggleComponentExpanded = (componentId) => {
    setExpandedComponents(prev => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    setExpandedComponents(new Set(estimate.components.map(c => c.id)));
  };
  
  const collapseAll = () => {
    setExpandedComponents(new Set());
  };

  return (
    <div className="estimator-page" data-testid="estimator-page">
      {/* Header */}
      <header className="est-header">
        <div className="est-header-content">
          <div className="est-header-left">
            <div className="est-header-icon">
              <Calculator size={24} />
            </div>
            <div className="est-header-info">
              <input
                type="text"
                value={estimate.name}
                onChange={(e) => setEstimate(prev => ({ ...prev, name: e.target.value }))}
                className="est-title-input"
                placeholder="Estimate name..."
              />
              <p>Component-based cost estimation</p>
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
            <button className="est-btn est-btn-secondary" onClick={() => alert('Export coming soon!')}>
              <FileDown size={18} />
              Export
            </button>
            <button className="est-btn est-btn-primary" onClick={() => alert('Save coming soon!')}>
              <Save size={18} />
              Save
            </button>
          </div>
        </div>
      </header>
      
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
                onUpdate={(updates) => handleUpdateComponent(component.id, updates)}
                onClone={() => handleCloneComponent(component.id)}
                onDelete={() => handleDeleteComponent(component.id)}
                isExpanded={expandedComponents.has(component.id)}
                onToggleExpand={() => toggleComponentExpanded(component.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Summary */}
      {estimate.components.length > 0 && (
        <footer className="est-footer">
          <div className="est-footer-content">
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
