/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 * 
 * @version 1.0
 * @created December 2025
 * @phase 2.4 - Undo/Redo Stack
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
  }

  /**
   * Subscribe to history changes
   * @param {function} callback - Called when history changes
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  _notify() {
    this.listeners.forEach(cb => cb({
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoLabel: this.getUndoLabel(),
      redoLabel: this.getRedoLabel()
    }));
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, paste, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this._notify();
  }

  /**
   * Pop last action for undo
   * @returns {object|null} The action to undo
   */
  popUndo() {
    if (!this.canUndo()) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    
    this._notify();
    return action;
  }

  /**
   * Pop last undone action for redo
   * @returns {object|null} The action to redo
   */
  popRedo() {
    if (!this.canRedo()) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    
    this._notify();
    return action;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get label for undo button
   */
  getUndoLabel() {
    if (!this.canUndo()) return 'Undo';
    const action = this.undoStack[this.undoStack.length - 1];
    return `Undo ${this._getActionLabel(action)}`;
  }

  /**
   * Get label for redo button
   */
  getRedoLabel() {
    if (!this.canRedo()) return 'Redo';
    const action = this.redoStack[this.redoStack.length - 1];
    return `Redo ${this._getActionLabel(action)}`;
  }

  /**
   * Get human-readable label for an action
   */
  _getActionLabel(action) {
    const labels = {
      create: 'Create',
      update: 'Edit',
      delete: 'Delete',
      paste: 'Paste',
      cut: 'Cut',
      move: 'Move',
      promote: 'Promote',
      demote: 'Demote',
      batch_delete: 'Delete Items'
    };
    return labels[action.type] || action.type;
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this._notify();
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      undoStack: this.undoStack.map(a => ({ type: a.type, timestamp: a.timestamp })),
      redoStack: this.redoStack.map(a => ({ type: a.type, timestamp: a.timestamp }))
    };
  }
}

// Singleton instance
export const planningHistory = new PlanningHistory();

export default planningHistory;
