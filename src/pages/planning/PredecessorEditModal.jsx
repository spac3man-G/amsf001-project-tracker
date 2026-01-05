import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Link2, AlertTriangle } from 'lucide-react';

const DEPENDENCY_TYPES = [
  { value: 'FS', label: 'Finish-to-Start', description: 'Task starts when predecessor finishes' },
  { value: 'SS', label: 'Start-to-Start', description: 'Task starts when predecessor starts' },
  { value: 'FF', label: 'Finish-to-Finish', description: 'Task finishes when predecessor finishes' },
  { value: 'SF', label: 'Start-to-Finish', description: 'Task finishes when predecessor starts' }
];

/**
 * Modal for editing predecessors (dependencies) of a plan item
 */
export default function PredecessorEditModal({ item, items, onClose, onSave }) {
  // Initialize state with existing predecessors
  const [predecessors, setPredecessors] = useState(() => {
    return (item.predecessors || []).map(p => ({
      id: p.id,
      type: p.type || 'FS',
      lag: p.lag || 0
    }));
  });

  // Get available items for predecessor selection (exclude self and descendants)
  const availableItems = useMemo(() => {
    // Get all descendant IDs
    const getDescendantIds = (parentId) => {
      const descendants = [];
      const collectDescendants = (id) => {
        items.forEach(i => {
          if (i.parent_id === id) {
            descendants.push(i.id);
            collectDescendants(i.id);
          }
        });
      };
      collectDescendants(parentId);
      return descendants;
    };

    const descendantIds = new Set(getDescendantIds(item.id));
    
    return items.filter(i => 
      i.id !== item.id && // Not self
      !descendantIds.has(i.id) && // Not a descendant
      !i.is_deleted // Not deleted
    );
  }, [items, item.id]);

  // Circular dependency detection
  const [validationError, setValidationError] = useState(null);

  // Check if adding predecessorId would create a circular dependency
  const wouldCreateCycle = useMemo(() => {
    // Build a dependency graph including current predecessors
    const buildDependencyGraph = () => {
      const graph = new Map();
      
      // Add all existing dependencies from all items
      items.forEach(i => {
        if (i.predecessors && i.predecessors.length > 0) {
          // For each item, its predecessors point TO it (predecessor -> item)
          i.predecessors.forEach(p => {
            if (!graph.has(p.id)) graph.set(p.id, new Set());
            graph.get(p.id).add(i.id);
          });
        }
      });
      
      // Remove current item's existing predecessors (we're replacing them)
      items.forEach(i => {
        if (i.predecessors) {
          i.predecessors.forEach(p => {
            if (graph.has(p.id)) {
              graph.get(p.id).delete(item.id);
            }
          });
        }
      });
      
      // Add new predecessors we're setting
      predecessors.forEach(p => {
        if (!graph.has(p.id)) graph.set(p.id, new Set());
        graph.get(p.id).add(item.id);
      });
      
      return graph;
    };

    // DFS to detect cycle
    const hasCycle = (graph, startId) => {
      const visited = new Set();
      const recursionStack = new Set();
      
      const dfs = (nodeId) => {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const neighbors = graph.get(nodeId) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) return true;
          } else if (recursionStack.has(neighbor)) {
            return true; // Found a cycle
          }
        }
        
        recursionStack.delete(nodeId);
        return false;
      };
      
      return dfs(startId);
    };

    // Check each predecessor
    const graph = buildDependencyGraph();
    
    for (const pred of predecessors) {
      // Check if there's a path from item back to predecessor
      // This would mean: pred -> item -> ... -> pred (cycle)
      if (hasCycle(graph, pred.id)) {
        const predItem = items.find(i => i.id === pred.id);
        return `Adding "${predItem?.name || 'this item'}" as a predecessor would create a circular dependency.`;
      }
    }
    
    return null;
  }, [items, item.id, predecessors]);

  // Update validation error when cycle detection changes
  useEffect(() => {
    setValidationError(wouldCreateCycle);
  }, [wouldCreateCycle]);

  // Handle adding a new predecessor
  const handleAddPredecessor = () => {
    // Find first available item not already selected
    const selectedIds = new Set(predecessors.map(p => p.id));
    const available = availableItems.find(i => !selectedIds.has(i.id));
    
    if (available) {
      setPredecessors([...predecessors, { id: available.id, type: 'FS', lag: 0 }]);
    }
  };

  // Handle removing a predecessor
  const handleRemovePredecessor = (index) => {
    setPredecessors(predecessors.filter((_, i) => i !== index));
  };

  // Handle updating a predecessor
  const handleUpdatePredecessor = (index, field, value) => {
    const updated = [...predecessors];
    updated[index] = { ...updated[index], [field]: value };
    setPredecessors(updated);
  };

  // Handle save
  const handleSave = () => {
    // Check for circular dependencies
    if (validationError) {
      return; // Don't save if there's a validation error
    }
    
    // Filter out any invalid predecessors
    const validPredecessors = predecessors.filter(p => 
      p.id && availableItems.some(i => i.id === p.id)
    );
    onSave(validPredecessors);
  };

  // Get item by ID
  const getItemById = (id) => items.find(i => i.id === id);

  // Get selected IDs for filtering dropdown
  const selectedIds = new Set(predecessors.map(p => p.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container predecessor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Link2 size={20} />
            <span>Edit Predecessors</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="predecessor-item-info">
            <span className="predecessor-label">Task:</span>
            <span className="predecessor-value">{item.wbs} - {item.name}</span>
          </div>

          <div className="predecessor-list">
            <div className="predecessor-list-header">
              <span>Predecessors</span>
              <button 
                className="predecessor-add-btn"
                onClick={handleAddPredecessor}
                disabled={availableItems.filter(i => !selectedIds.has(i.id)).length === 0}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {predecessors.length === 0 ? (
              <div className="predecessor-empty">
                <p>No predecessors defined.</p>
                <p className="predecessor-hint">Click "Add" to create a dependency.</p>
              </div>
            ) : (
              <div className="predecessor-items">
                {predecessors.map((pred, index) => {
                  const predItem = getItemById(pred.id);
                  return (
                    <div key={index} className="predecessor-row">
                      <select
                        className="predecessor-select-item"
                        value={pred.id}
                        onChange={(e) => handleUpdatePredecessor(index, 'id', e.target.value)}
                      >
                        {predItem && (
                          <option value={pred.id}>
                            {predItem.wbs} - {predItem.name}
                          </option>
                        )}
                        {availableItems
                          .filter(i => i.id === pred.id || !selectedIds.has(i.id))
                          .map(i => i.id !== pred.id && (
                            <option key={i.id} value={i.id}>
                              {i.wbs} - {i.name}
                            </option>
                          ))}
                      </select>

                      <select
                        className="predecessor-select-type"
                        value={pred.type}
                        onChange={(e) => handleUpdatePredecessor(index, 'type', e.target.value)}
                        title={DEPENDENCY_TYPES.find(t => t.value === pred.type)?.description}
                      >
                        {DEPENDENCY_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.value}
                          </option>
                        ))}
                      </select>

                      <div className="predecessor-lag-input">
                        <input
                          type="number"
                          value={pred.lag}
                          onChange={(e) => handleUpdatePredecessor(index, 'lag', parseInt(e.target.value) || 0)}
                          className="predecessor-lag"
                          placeholder="0"
                        />
                        <span className="predecessor-lag-unit">days</span>
                      </div>

                      <button
                        className="predecessor-remove-btn"
                        onClick={() => handleRemovePredecessor(index)}
                        title="Remove predecessor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="predecessor-error">
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div className="predecessor-help">
            <h4>Dependency Types</h4>
            <ul>
              <li><strong>FS</strong> (Finish-to-Start): Task starts when predecessor finishes</li>
              <li><strong>SS</strong> (Start-to-Start): Task starts when predecessor starts</li>
              <li><strong>FF</strong> (Finish-to-Finish): Task finishes when predecessor finishes</li>
              <li><strong>SF</strong> (Start-to-Finish): Task finishes when predecessor starts</li>
            </ul>
            <p><strong>Lag:</strong> Positive = delay, Negative = lead time</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave}>
            Save Predecessors
          </button>
        </div>
      </div>
    </div>
  );
}
