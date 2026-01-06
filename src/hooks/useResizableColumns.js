/**
 * useResizableColumns Hook
 * 
 * Provides drag-to-resize functionality for table columns.
 * Persists column widths to localStorage.
 * 
 * @version 1.0.0
 * @created 2026-01-06
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Default column widths (in pixels)
const DEFAULT_WIDTHS = {
  checkbox: 40,
  grip: 30,
  wbs: 60,
  indicators: 40,
  name: 300,
  type: 110,
  start: 100,
  end: 100,
  predecessors: 80,
  progress: 130,
  status: 110,
  estimate: 100,
  actions: 50
};

// Minimum column widths
const MIN_WIDTHS = {
  checkbox: 40,
  grip: 30,
  wbs: 50,
  indicators: 40,
  name: 150,
  type: 80,
  start: 80,
  end: 80,
  predecessors: 60,
  progress: 80,
  status: 80,
  estimate: 80,
  actions: 50
};

// Columns that can be resized (exclude fixed utility columns)
const RESIZABLE_COLUMNS = ['name', 'type', 'start', 'end', 'predecessors', 'progress', 'status', 'estimate'];

const STORAGE_KEY = 'planning-column-widths';

export default function useResizableColumns() {
  const [columnWidths, setColumnWidths] = useState(() => {
    // Load from localStorage or use defaults
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults in case new columns were added
        return { ...DEFAULT_WIDTHS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load column widths from localStorage:', e);
    }
    return { ...DEFAULT_WIDTHS };
  });

  const [resizing, setResizing] = useState(null); // { column, startX, startWidth }
  const resizeRef = useRef(null);

  // Save to localStorage when widths change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths));
    } catch (e) {
      console.warn('Failed to save column widths to localStorage:', e);
    }
  }, [columnWidths]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!resizing) return;
    
    const delta = e.clientX - resizing.startX;
    const newWidth = Math.max(
      MIN_WIDTHS[resizing.column] || 50,
      resizing.startWidth + delta
    );
    
    setColumnWidths(prev => ({
      ...prev,
      [resizing.column]: newWidth
    }));
  }, [resizing]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    setResizing(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach/detach global mouse listeners
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Start resizing a column
  const startResize = useCallback((column, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column] || DEFAULT_WIDTHS[column]
    });
  }, [columnWidths]);

  // Reset all columns to default widths
  const resetWidths = useCallback(() => {
    setColumnWidths({ ...DEFAULT_WIDTHS });
  }, []);

  // Check if a column is resizable
  const isResizable = useCallback((column) => {
    return RESIZABLE_COLUMNS.includes(column);
  }, []);

  // Get style for a column
  const getColumnStyle = useCallback((column) => {
    const width = columnWidths[column] || DEFAULT_WIDTHS[column];
    return {
      width: `${width}px`,
      minWidth: `${MIN_WIDTHS[column] || 50}px`,
      maxWidth: column === 'name' ? 'none' : `${width}px`
    };
  }, [columnWidths]);

  return {
    columnWidths,
    startResize,
    resetWidths,
    isResizable,
    getColumnStyle,
    isResizing: !!resizing,
    resizingColumn: resizing?.column
  };
}
