/**
 * Section List
 * 
 * Right panel component for the Section Builder.
 * Displays current sections with drag-and-drop reordering.
 * 
 * Features:
 * - Drag-and-drop reordering
 * - Remove section button
 * - Configure section button
 * - Duplicate section button
 * - Move up/down buttons
 * - Visual feedback during drag
 * - Section type indicator
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 8
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GripVertical,
  X,
  Settings,
  Copy,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { getSectionTypeConfig } from '../../lib/reportSectionTypes';

// ============================================
// SECTION ITEM COMPONENT
// ============================================

function SectionItem({
  section,
  index,
  isFirst,
  isLast,
  isHighlighted,
  isDragging,
  isDragOver,
  onRemove,
  onConfigure,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) {
  const sectionConfig = getSectionTypeConfig(section.type);
  const Icon = sectionConfig?.icon;
  const categoryLabel = sectionConfig?.category || 'content';
  
  const itemRef = useRef(null);
  
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart(index);
    
    // Add a slight delay to show the dragging state
    setTimeout(() => {
      if (itemRef.current) {
        itemRef.current.classList.add('dragging');
      }
    }, 0);
  }, [index, onDragStart]);
  
  const handleDragEnd = useCallback((e) => {
    if (itemRef.current) {
      itemRef.current.classList.remove('dragging');
    }
    onDragEnd();
  }, [onDragEnd]);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  }, [index, onDragOver]);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onDrop(fromIndex, index);
    }
  }, [index, onDrop]);
  
  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    onRemove(section.id);
  }, [section.id, onRemove]);
  
  const handleConfigure = useCallback((e) => {
    e.stopPropagation();
    onConfigure(section);
  }, [section, onConfigure]);
  
  const handleDuplicate = useCallback((e) => {
    e.stopPropagation();
    onDuplicate(section.id);
  }, [section.id, onDuplicate]);
  
  const handleMoveUp = useCallback((e) => {
    e.stopPropagation();
    onMoveUp(index);
  }, [index, onMoveUp]);
  
  const handleMoveDown = useCallback((e) => {
    e.stopPropagation();
    onMoveDown(index);
  }, [index, onMoveDown]);
  
  // Check if section has configuration issues
  const hasConfigWarning = !section.config || Object.keys(section.config).length === 0;
  
  return (
    <div
      ref={itemRef}
      className={`section-list-item ${isHighlighted ? 'highlighted' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} category-${categoryLabel}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleConfigure}
      role="listitem"
    >
      {/* Drag Handle */}
      <div className="section-list-item-handle" title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      
      {/* Section Number */}
      <div className="section-list-item-number">
        {index + 1}
      </div>
      
      {/* Section Icon */}
      <div className="section-list-item-icon">
        {Icon && <Icon size={18} />}
      </div>
      
      {/* Section Info */}
      <div className="section-list-item-info">
        <span className="section-list-item-name">
          {section.name || sectionConfig?.name || 'Unnamed Section'}
        </span>
        <span className="section-list-item-type">
          {sectionConfig?.name || section.type}
        </span>
      </div>
      
      {/* Warning indicator */}
      {hasConfigWarning && (
        <div className="section-list-item-warning" title="Configuration may need review">
          <AlertCircle size={14} />
        </div>
      )}
      
      {/* Actions */}
      <div className="section-list-item-actions">
        {/* Move Up */}
        <button
          type="button"
          className="section-list-item-btn"
          onClick={handleMoveUp}
          disabled={isFirst}
          title="Move up"
          aria-label="Move section up"
        >
          <ChevronUp size={14} />
        </button>
        
        {/* Move Down */}
        <button
          type="button"
          className="section-list-item-btn"
          onClick={handleMoveDown}
          disabled={isLast}
          title="Move down"
          aria-label="Move section down"
        >
          <ChevronDown size={14} />
        </button>
        
        {/* Configure */}
        <button
          type="button"
          className="section-list-item-btn"
          onClick={handleConfigure}
          title="Configure section"
          aria-label="Configure section"
        >
          <Settings size={14} />
        </button>
        
        {/* Duplicate */}
        <button
          type="button"
          className="section-list-item-btn"
          onClick={handleDuplicate}
          title="Duplicate section"
          aria-label="Duplicate section"
        >
          <Copy size={14} />
        </button>
        
        {/* Remove */}
        <button
          type="button"
          className="section-list-item-btn danger"
          onClick={handleRemove}
          title="Remove section"
          aria-label="Remove section"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// DROP ZONE COMPONENT (for empty state or end of list)
// ============================================

function DropZone({ onDrop, isActive }) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex)) {
      onDrop(fromIndex);
    }
  }, [onDrop]);
  
  return (
    <div 
      className={`section-list-dropzone ${isActive ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span>Drop section here</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SectionList({
  sections,
  onRemove,
  onReorder,
  onConfigure,
  onDuplicate,
  highlightedSection
}) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Handle drag start
  const handleDragStart = useCallback((index) => {
    setDraggingIndex(index);
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);
  
  // Handle drag over an item
  const handleDragOver = useCallback((index) => {
    setDragOverIndex(index);
  }, []);
  
  // Handle drop on an item
  const handleDrop = useCallback((fromIndex, toIndex) => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }, [onReorder]);
  
  // Handle drop at end of list
  const handleDropAtEnd = useCallback((fromIndex) => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    
    const toIndex = sections.length - 1;
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }, [sections.length, onReorder]);
  
  // Handle move up
  const handleMoveUp = useCallback((index) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  }, [onReorder]);
  
  // Handle move down
  const handleMoveDown = useCallback((index) => {
    if (index < sections.length - 1) {
      onReorder(index, index + 1);
    }
  }, [sections.length, onReorder]);
  
  return (
    <div className="section-list" role="list">
      {sections.map((section, index) => (
        <SectionItem
          key={section.id}
          section={section}
          index={index}
          isFirst={index === 0}
          isLast={index === sections.length - 1}
          isHighlighted={highlightedSection === section.id}
          isDragging={draggingIndex === index}
          isDragOver={dragOverIndex === index && draggingIndex !== index}
          onRemove={onRemove}
          onConfigure={onConfigure}
          onDuplicate={onDuplicate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
      
      {/* Drop zone at end when dragging */}
      {draggingIndex !== null && draggingIndex !== sections.length - 1 && (
        <DropZone 
          onDrop={handleDropAtEnd}
          isActive={dragOverIndex === sections.length}
        />
      )}
    </div>
  );
}
