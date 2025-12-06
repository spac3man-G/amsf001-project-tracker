/**
 * MultiSelectList - Reusable multi-select list component
 * 
 * A scrollable, clickable list for selecting multiple items.
 * Used for KPI selection, Quality Standard selection, etc.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React from 'react';
import './MultiSelectList.css';

/**
 * MultiSelectList Component
 * 
 * @param {Object[]} items - Array of items to display
 * @param {string[]} selectedIds - Array of selected item IDs
 * @param {Function} onChange - Callback when selection changes (receives new array of IDs)
 * @param {Function} renderItem - Function to render each item content
 * @param {Function} getItemId - Function to get ID from item (default: item => item.id)
 * @param {string} label - Label for the list
 * @param {string} emptyMessage - Message when no items available
 * @param {string} variant - Color variant: 'blue' | 'purple' | 'green' (default: 'blue')
 * @param {number} maxHeight - Max height in pixels (default: 200)
 */
export default function MultiSelectList({
  items = [],
  selectedIds = [],
  onChange,
  renderItem,
  getItemId = (item) => item.id,
  label = 'Select items',
  emptyMessage = 'No items available',
  variant = 'blue',
  maxHeight = 200
}) {
  const handleItemClick = (item) => {
    const itemId = getItemId(item);
    const isSelected = selectedIds.includes(itemId);
    
    if (isSelected) {
      onChange(selectedIds.filter(id => id !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="multi-select-list">
      <label className="multi-select-label">
        <span>{label}</span>
        {selectedIds.length > 0 && (
          <button 
            type="button" 
            onClick={handleClear}
            className="multi-select-clear"
          >
            Clear
          </button>
        )}
      </label>
      
      <div 
        className="multi-select-container"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {items.length === 0 ? (
          <div className="multi-select-empty">{emptyMessage}</div>
        ) : (
          items.map(item => {
            const itemId = getItemId(item);
            const isSelected = selectedIds.includes(itemId);
            
            return (
              <div
                key={itemId}
                onClick={() => handleItemClick(item)}
                className={`multi-select-item multi-select-item--${variant} ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="multi-select-checkbox"
                />
                <div className="multi-select-content">
                  {renderItem(item, isSelected)}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="multi-select-count">
        {selectedIds.length} selected
      </div>
    </div>
  );
}
