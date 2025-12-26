/**
 * EstimateGeneratorModal - Generate estimate from plan structure
 * 
 * Allows users to:
 * - Preview plan structure as tree
 * - Select/deselect items to include
 * - Choose generation mode (milestones only vs milestones+deliverables)
 * - Generate estimate with auto-linking
 * 
 * @version 1.0
 * @created 26 December 2025
 * @checkpoint 5 - Linked Estimates Feature
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calculator,
  ChevronRight,
  ChevronDown,
  Flag,
  Package,
  CheckSquare,
  Loader2,
  AlertCircle,
  Check,
  Square,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { estimatesService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import './EstimateGeneratorModal.css';

// Item type icons
const ITEM_ICONS = {
  milestone: Flag,
  deliverable: Package,
  task: CheckSquare
};

// Item type colors
const ITEM_COLORS = {
  milestone: '#8b5cf6',
  deliverable: '#3b82f6',
  task: '#64748b'
};

export default function EstimateGeneratorModal({ 
  planItems, 
  projectId,
  onClose, 
  onGenerated 
}) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  // State
  const [selectedIds, setSelectedIds] = useState(new Set(planItems.map(p => p.id)));
  const [estimateName, setEstimateName] = useState('Estimate from Plan');
  const [componentMode, setComponentMode] = useState('milestones'); // 'milestones' | 'milestones_and_deliverables'
  const [generating, setGenerating] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set(
    planItems.filter(p => p.item_type === 'milestone').map(p => p.id)
  ));

  // Build hierarchical tree
  const hierarchy = useMemo(() => {
    const itemMap = new Map(planItems.map(i => [i.id, { ...i, children: [] }]));
    const roots = [];

    for (const item of planItems) {
      const node = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [planItems]);

  // Count selected items by type
  const selectionStats = useMemo(() => {
    const stats = { milestones: 0, deliverables: 0, tasks: 0, total: 0 };
    for (const item of planItems) {
      if (selectedIds.has(item.id)) {
        stats.total++;
        if (item.item_type === 'milestone') stats.milestones++;
        else if (item.item_type === 'deliverable') stats.deliverables++;
        else stats.tasks++;
      }
    }
    return stats;
  }, [planItems, selectedIds]);

  // Preview what will be generated
  const generationPreview = useMemo(() => {
    const selectedItems = planItems.filter(p => selectedIds.has(p.id));
    let components = 0;
    let tasks = 0;

    const milestones = selectedItems.filter(i => i.item_type === 'milestone');
    const deliverables = selectedItems.filter(i => i.item_type === 'deliverable');
    const planTasks = selectedItems.filter(i => i.item_type === 'task');

    if (componentMode === 'milestones') {
      components = milestones.length || 1; // At least 1 component
      tasks = deliverables.length + planTasks.length;
    } else {
      components = milestones.length + deliverables.length || 1;
      tasks = planTasks.length;
    }

    // Ensure at least one task per component
    if (tasks < components) tasks = components;

    return { components, tasks };
  }, [planItems, selectedIds, componentMode]);

  // Toggle node expansion
  const toggleExpand = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Also deselect children
        const deselect = (itemId) => {
          const item = planItems.find(p => p.id === itemId);
          if (item) {
            next.delete(itemId);
            planItems.filter(p => p.parent_id === itemId).forEach(child => deselect(child.id));
          }
        };
        deselect(id);
      } else {
        next.add(id);
        // Also select ancestors
        let current = planItems.find(p => p.id === id);
        while (current?.parent_id) {
          next.add(current.parent_id);
          current = planItems.find(p => p.id === current.parent_id);
        }
      }
      return next;
    });
  };

  // Select all / none
  const selectAll = () => setSelectedIds(new Set(planItems.map(p => p.id)));
  const selectNone = () => setSelectedIds(new Set());

  // Get checkbox state for a node (checked, unchecked, indeterminate)
  const getCheckState = (node) => {
    const isSelected = selectedIds.has(node.id);
    if (!node.children || node.children.length === 0) {
      return isSelected ? 'checked' : 'unchecked';
    }
    
    const childStates = node.children.map(c => getCheckState(c));
    const allChecked = childStates.every(s => s === 'checked');
    const allUnchecked = childStates.every(s => s === 'unchecked');
    
    if (isSelected && allChecked) return 'checked';
    if (!isSelected && allUnchecked) return 'unchecked';
    return 'indeterminate';
  };

  // Generate estimate
  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      showError('Please select at least one item');
      return;
    }

    try {
      setGenerating(true);
      
      const estimate = await estimatesService.createFromPlanStructure(projectId, planItems, {
        name: estimateName,
        includeItemIds: Array.from(selectedIds),
        createComponentsFor: componentMode
      });

      showSuccess(`Created estimate with ${estimate.components?.length || 0} components`);
      onGenerated?.();
      
      // Navigate to estimator with the new estimate
      navigate(`/estimator?estimateId=${estimate.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to generate estimate:', err);
      showError('Failed to generate estimate');
    } finally {
      setGenerating(false);
    }
  };

  // Render tree node
  const renderNode = (node, depth = 0) => {
    const Icon = ITEM_ICONS[node.item_type] || CheckSquare;
    const color = ITEM_COLORS[node.item_type] || '#64748b';
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const checkState = getCheckState(node);

    return (
      <div key={node.id} className="egm-tree-node">
        <div 
          className={`egm-tree-item ${selectedIds.has(node.id) ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
        >
          {/* Expand/collapse toggle */}
          <button 
            className="egm-expand-btn"
            onClick={() => toggleExpand(node.id)}
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Checkbox */}
          <button 
            className={`egm-checkbox ${checkState}`}
            onClick={() => toggleSelect(node.id)}
          >
            {checkState === 'checked' && <Check size={12} />}
            {checkState === 'indeterminate' && <Minus size={12} />}
          </button>

          {/* Icon */}
          <Icon size={14} style={{ color, flexShrink: 0 }} />

          {/* Name */}
          <span className="egm-item-name">{node.name || 'Untitled'}</span>

          {/* Type badge */}
          <span className={`egm-type-badge ${node.item_type}`}>
            {node.item_type}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="egm-tree-children">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="egm-overlay" onClick={onClose}>
      <div className="egm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="egm-header">
          <div className="egm-header-icon">
            <Calculator size={20} />
          </div>
          <div className="egm-header-text">
            <h3>Generate Estimate from Plan</h3>
            <p>Create an estimate structure based on your plan items</p>
          </div>
          <button className="egm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>


        {/* Body */}
        <div className="egm-body">
          {/* Estimate Name */}
          <div className="egm-name-field">
            <label>Estimate Name</label>
            <input
              type="text"
              value={estimateName}
              onChange={(e) => setEstimateName(e.target.value)}
              placeholder="Enter estimate name..."
            />
          </div>

          {/* Mode Selection */}
          <div className="egm-mode-section">
            <label>Component Structure</label>
            <div className="egm-mode-options">
              <label className={`egm-mode-option ${componentMode === 'milestones' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="componentMode"
                  value="milestones"
                  checked={componentMode === 'milestones'}
                  onChange={(e) => setComponentMode(e.target.value)}
                />
                <div className="egm-mode-content">
                  <span className="egm-mode-title">Milestones as Components</span>
                  <span className="egm-mode-desc">
                    Each milestone becomes a component. Deliverables and tasks become estimate tasks.
                  </span>
                </div>
              </label>
              <label className={`egm-mode-option ${componentMode === 'milestones_and_deliverables' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="componentMode"
                  value="milestones_and_deliverables"
                  checked={componentMode === 'milestones_and_deliverables'}
                  onChange={(e) => setComponentMode(e.target.value)}
                />
                <div className="egm-mode-content">
                  <span className="egm-mode-title">Milestones + Deliverables as Components</span>
                  <span className="egm-mode-desc">
                    Both milestones and deliverables become components. Only tasks become estimate tasks.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Selection Actions */}
          <div className="egm-selection-bar">
            <span className="egm-selection-info">
              {selectionStats.total} items selected 
              ({selectionStats.milestones} milestones, {selectionStats.deliverables} deliverables, {selectionStats.tasks} tasks)
            </span>
            <div className="egm-selection-actions">
              <button onClick={selectAll}>Select All</button>
              <button onClick={selectNone}>Select None</button>
            </div>
          </div>

          {/* Tree View */}
          <div className="egm-tree-container">
            {planItems.length === 0 ? (
              <div className="egm-empty-tree">
                <AlertCircle size={32} />
                <p>No plan items found. Add items to your plan first.</p>
              </div>
            ) : (
              <div className="egm-tree">
                {hierarchy.map(node => renderNode(node, 0))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="egm-preview">
            <h4>Generation Preview</h4>
            <div className="egm-preview-stats">
              <div className="egm-preview-stat">
                <span className="egm-preview-label">Components</span>
                <span className="egm-preview-value">{generationPreview.components}</span>
              </div>
              <div className="egm-preview-stat">
                <span className="egm-preview-label">Tasks</span>
                <span className="egm-preview-value">{generationPreview.tasks}</span>
              </div>
            </div>
            <p className="egm-preview-note">
              <AlertCircle size={14} />
              Resource types will be empty. Add them in the Estimator after generation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="egm-footer">
          <button className="egm-btn egm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="egm-btn egm-btn-primary"
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="egm-spinner" />
                Generating...
              </>
            ) : (
              <>
                <Calculator size={16} />
                Generate Estimate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
