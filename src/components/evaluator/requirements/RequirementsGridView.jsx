/**
 * RequirementsGridView
 *
 * Excel-like spreadsheet interface for bulk requirements entry and editing.
 * Uses react-data-grid for virtualized, editable grid with full keyboard navigation.
 *
 * @version 1.0
 * @created 10 January 2026
 * @phase FE-007 - Excel-Like Requirements Grid Interface
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import DataGrid from 'react-data-grid';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Undo2,
  Redo2,
  CheckSquare,
  Square,
  Save,
  AlertCircle,
  Check,
  Copy,
  ClipboardPaste,
  Send,
  ChevronDown,
  Loader2,
  Keyboard,
  X
} from 'lucide-react';
import { requirementsService } from '../../../services/evaluator';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import ImportWizard from './ImportWizard';
import PasteWizard from './PasteWizard';
import 'react-data-grid/lib/styles.css';
import './RequirementsGridView.css';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'must_have', label: 'Must Have' },
  { value: 'should_have', label: 'Should Have' },
  { value: 'could_have', label: 'Could Have' },
  { value: 'wont_have', label: "Won't Have" }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

// Source type options
const SOURCE_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'interview', label: 'Interview' },
  { value: 'document', label: 'Document' },
  { value: 'survey', label: 'Survey' },
  { value: 'market_analysis', label: 'Market Analysis' },
  { value: 'competitor_analysis', label: 'Competitor Analysis' },
  { value: 'ai', label: 'AI Generated' }
];

// Text editor component
function TextEditor({ row, column, onRowChange, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className="rdg-text-editor"
      value={row[column.key] || ''}
      onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClose(true);
        } else if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    />
  );
}

// Textarea editor for description/acceptance criteria
function TextAreaEditor({ row, column, onRowChange, onClose }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className="rdg-textarea-editor"
      value={row[column.key] || ''}
      onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onClose(true);
        } else if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    />
  );
}

// Dropdown editor component
function DropdownEditor({ row, column, onRowChange, onClose, options }) {
  const selectRef = useRef(null);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  return (
    <select
      ref={selectRef}
      className="rdg-select-editor"
      value={row[column.key] || ''}
      onChange={(e) => {
        onRowChange({ ...row, [column.key]: e.target.value });
        onClose(true);
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    >
      <option value="">-- Select --</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// Category dropdown editor
function CategoryEditor({ row, column, onRowChange, onClose, categories }) {
  const selectRef = useRef(null);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  return (
    <select
      ref={selectRef}
      className="rdg-select-editor"
      value={row.category_id || ''}
      onChange={(e) => {
        const categoryId = e.target.value || null;
        const category = categories.find(c => c.id === categoryId);
        onRowChange({ ...row, category_id: categoryId, category });
        onClose(true);
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    >
      <option value="">-- Select Category --</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}

// Stakeholder area dropdown editor
function StakeholderAreaEditor({ row, column, onRowChange, onClose, stakeholderAreas }) {
  const selectRef = useRef(null);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  return (
    <select
      ref={selectRef}
      className="rdg-select-editor"
      value={row.stakeholder_area_id || ''}
      onChange={(e) => {
        const areaId = e.target.value || null;
        const area = stakeholderAreas.find(a => a.id === areaId);
        onRowChange({ ...row, stakeholder_area_id: areaId, stakeholder_area: area });
        onClose(true);
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    >
      <option value="">-- Select Area --</option>
      {stakeholderAreas.map(area => (
        <option key={area.id} value={area.id}>{area.name}</option>
      ))}
    </select>
  );
}

// Number editor for weighting
function NumberEditor({ row, column, onRowChange, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type="number"
      min="0"
      max="100"
      className="rdg-number-editor"
      value={row[column.key] || 0}
      onChange={(e) => {
        const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
        onRowChange({ ...row, [column.key]: val });
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClose(true);
        } else if (e.key === 'Escape') {
          onClose(false);
        }
      }}
    />
  );
}

export default function RequirementsGridView({
  requirements,
  categories,
  stakeholderAreas,
  onDataChange,
  canManage = true
}) {
  const { evaluationId } = useEvaluation();
  const { user } = useAuth();
  const gridRef = useRef(null);

  // State
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showPasteWizard, setShowPasteWizard] = useState(false);
  const [pasteData, setPasteData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Bulk operation state
  const [bulkOperating, setBulkOperating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, operation: '' });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Sync rows with requirements prop
  useEffect(() => {
    setRows(requirements.map(req => ({ ...req, _isNew: false, _isDirty: false })));
  }, [requirements]);

  // Save debounce timer
  const saveTimerRef = useRef(null);

  // Validate a row
  const validateRow = useCallback((row) => {
    const errors = {};
    if (!row.title || row.title.trim() === '') {
      errors.title = 'Title is required';
    } else if (row.title.length > 255) {
      errors.title = 'Title must be 255 characters or less';
    }
    if (row.description && row.description.length > 5000) {
      errors.description = 'Description must be 5000 characters or less';
    }
    return errors;
  }, []);

  // Save a single row
  const saveRow = useCallback(async (row) => {
    if (!canManage) return;

    const errors = validateRow(row);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, [row.id]: errors }));
      return;
    }

    setSaveStatus('saving');
    try {
      if (row._isNew) {
        // Create new requirement
        const created = await requirementsService.createWithReferenceCode({
          evaluation_project_id: evaluationId,
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status || 'draft',
          category_id: row.category_id,
          stakeholder_area_id: row.stakeholder_area_id,
          source_type: row.source_type,
          source_reference: row.source_reference,
          acceptance_criteria: row.acceptance_criteria,
          weighting: row.weighting
        });

        // Update row with real ID
        setRows(prev => prev.map(r =>
          r.id === row.id ? { ...created, _isNew: false, _isDirty: false } : r
        ));
      } else {
        // Update existing requirement
        await requirementsService.update(row.id, {
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status,
          category_id: row.category_id,
          stakeholder_area_id: row.stakeholder_area_id,
          source_type: row.source_type,
          source_reference: row.source_reference,
          acceptance_criteria: row.acceptance_criteria,
          weighting: row.weighting
        });

        setRows(prev => prev.map(r =>
          r.id === row.id ? { ...r, _isDirty: false } : r
        ));
      }

      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  }, [canManage, evaluationId, validateRow]);

  // Debounced save
  const debouncedSave = useCallback((row) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveRow(row);
    }, 500);
  }, [saveRow]);

  // Handle row change
  const handleRowsChange = useCallback((newRows, { indexes }) => {
    // Push to undo stack
    setUndoStack(prev => [...prev.slice(-49), rows]);
    setRedoStack([]);

    const updatedRows = newRows.map((row, idx) => {
      if (indexes.includes(idx)) {
        return { ...row, _isDirty: true };
      }
      return row;
    });

    setRows(updatedRows);

    // Trigger debounced save for changed rows
    indexes.forEach(idx => {
      debouncedSave(updatedRows[idx]);
    });
  }, [rows, debouncedSave]);

  // Add new row
  const handleAddRow = useCallback(() => {
    if (!canManage) return;

    const tempId = `temp-${Date.now()}`;
    const newRow = {
      id: tempId,
      reference_code: 'NEW',
      title: '',
      description: '',
      priority: 'should_have',
      status: 'draft',
      category_id: null,
      stakeholder_area_id: null,
      source_type: 'manual',
      source_reference: '',
      acceptance_criteria: '',
      weighting: 0,
      _isNew: true,
      _isDirty: true
    };

    setUndoStack(prev => [...prev.slice(-49), rows]);
    setRedoStack([]);
    setRows(prev => [...prev, newRow]);
  }, [canManage, rows]);

  // Delete selected rows
  const handleDeleteSelected = useCallback(async () => {
    if (!canManage || selectedRows.size === 0) return;

    const idsToDelete = Array.from(selectedRows).filter(id => !id.toString().startsWith('temp-'));
    const tempIds = Array.from(selectedRows).filter(id => id.toString().startsWith('temp-'));

    setUndoStack(prev => [...prev.slice(-49), rows]);
    setRedoStack([]);

    try {
      if (idsToDelete.length > 0) {
        await requirementsService.bulkDelete(idsToDelete, user?.id);
      }

      setRows(prev => prev.filter(r => !selectedRows.has(r.id)));
      setSelectedRows(new Set());
      onDataChange?.();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [canManage, selectedRows, rows, user?.id, onDataChange]);

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, rows]);
    setUndoStack(prev => prev.slice(0, -1));
    setRows(prevState);
  }, [undoStack, rows]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, rows]);
    setRedoStack(prev => prev.slice(0, -1));
    setRows(nextState);
  }, [redoStack, rows]);

  // Get tooltip for undo/redo buttons
  const getUndoTooltip = useCallback(() => {
    if (undoStack.length === 0) return 'Nothing to undo (Ctrl+Z)';
    const diff = rows.length - undoStack[undoStack.length - 1].length;
    if (diff > 0) return `Undo add ${diff} row(s) (Ctrl+Z)`;
    if (diff < 0) return `Undo delete ${-diff} row(s) (Ctrl+Z)`;
    return `Undo last edit (Ctrl+Z)`;
  }, [undoStack, rows]);

  const getRedoTooltip = useCallback(() => {
    if (redoStack.length === 0) return 'Nothing to redo (Ctrl+Y)';
    const diff = redoStack[redoStack.length - 1].length - rows.length;
    if (diff > 0) return `Redo add ${diff} row(s) (Ctrl+Y)`;
    if (diff < 0) return `Redo delete ${-diff} row(s) (Ctrl+Y)`;
    return `Redo last edit (Ctrl+Y)`;
  }, [redoStack, rows]);

  // Handle paste from clipboard
  const handlePaste = useCallback((e) => {
    const clipboardData = e.clipboardData?.getData('text');
    if (!clipboardData) return;

    // Check if it looks like tabular data
    if (clipboardData.includes('\t') || clipboardData.includes('\n')) {
      e.preventDefault();
      const lines = clipboardData.trim().split('\n');
      const data = lines.map(line => line.split('\t'));
      setPasteData(data);
      setShowPasteWizard(true);
    }
  }, []);

  // Handle copy
  const handleCopy = useCallback(() => {
    if (selectedRows.size === 0) return;

    const selectedData = rows.filter(r => selectedRows.has(r.id));
    const headers = ['Title', 'Description', 'Priority', 'Status', 'Category', 'Stakeholder Area'];
    const csvRows = selectedData.map(r => [
      r.title,
      r.description || '',
      r.priority,
      r.status,
      r.category?.name || '',
      r.stakeholder_area?.name || ''
    ].join('\t'));

    const csv = [headers.join('\t'), ...csvRows].join('\n');
    navigator.clipboard.writeText(csv);
  }, [selectedRows, rows]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Insert - Add row
      if (e.ctrlKey && e.key === 'Insert') {
        e.preventDefault();
        handleAddRow();
      }
      // Delete - Delete selected
      if (e.key === 'Delete' && selectedRows.size > 0 && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        handleDeleteSelected();
      }
      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c' && !e.target.matches('input, textarea, select')) {
        handleCopy();
      }
      // ? - Show keyboard help
      if (e.key === '?' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      // Escape - Close help
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleAddRow, handleDeleteSelected, handleCopy, selectedRows, showKeyboardHelp]);

  // Paste event listener
  useEffect(() => {
    const container = gridRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
      return () => container.removeEventListener('paste', handlePaste);
    }
  }, [handlePaste]);

  // Close bulk actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showBulkActions && !e.target.closest('.bulk-dropdown')) {
        setShowBulkActions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showBulkActions]);

  // Import completed handler
  const handleImportComplete = useCallback((importedRows) => {
    setShowImportWizard(false);
    onDataChange?.();
  }, [onDataChange]);

  // Paste completed handler
  const handlePasteComplete = useCallback(async (mappedData) => {
    setShowPasteWizard(false);
    setPasteData(null);

    try {
      setSaving(true);
      const result = await requirementsService.bulkCreate(evaluationId, mappedData);
      onDataChange?.();
    } catch (err) {
      console.error('Paste import error:', err);
    } finally {
      setSaving(false);
    }
  }, [evaluationId, onDataChange]);

  // Get selected row IDs (excluding temp rows for certain operations)
  const getSelectedIds = useCallback((excludeTemp = true) => {
    const ids = Array.from(selectedRows);
    if (excludeTemp) {
      return ids.filter(id => !id.toString().startsWith('temp-'));
    }
    return ids;
  }, [selectedRows]);

  // Bulk status change
  const handleBulkStatusChange = useCallback(async (newStatus) => {
    if (!canManage || selectedRows.size === 0) return;

    const ids = getSelectedIds();
    if (ids.length === 0) return;

    setBulkOperating(true);
    setBulkProgress({ current: 0, total: ids.length, operation: 'Updating status' });

    try {
      await requirementsService.bulkUpdate(ids, { status: newStatus });

      // Update local state
      setRows(prev => prev.map(r =>
        selectedRows.has(r.id) ? { ...r, status: newStatus } : r
      ));

      setBulkProgress({ current: ids.length, total: ids.length, operation: 'Updating status' });
      onDataChange?.();
    } catch (err) {
      console.error('Bulk status change error:', err);
      setSaveStatus('error');
    } finally {
      setBulkOperating(false);
      setShowBulkActions(false);
    }
  }, [canManage, selectedRows, getSelectedIds, onDataChange]);

  // Bulk priority change
  const handleBulkPriorityChange = useCallback(async (newPriority) => {
    if (!canManage || selectedRows.size === 0) return;

    const ids = getSelectedIds();
    if (ids.length === 0) return;

    setBulkOperating(true);
    setBulkProgress({ current: 0, total: ids.length, operation: 'Updating priority' });

    try {
      await requirementsService.bulkUpdate(ids, { priority: newPriority });

      // Update local state
      setRows(prev => prev.map(r =>
        selectedRows.has(r.id) ? { ...r, priority: newPriority } : r
      ));

      setBulkProgress({ current: ids.length, total: ids.length, operation: 'Updating priority' });
      onDataChange?.();
    } catch (err) {
      console.error('Bulk priority change error:', err);
      setSaveStatus('error');
    } finally {
      setBulkOperating(false);
      setShowBulkActions(false);
    }
  }, [canManage, selectedRows, getSelectedIds, onDataChange]);

  // Bulk category change
  const handleBulkCategoryChange = useCallback(async (categoryId) => {
    if (!canManage || selectedRows.size === 0) return;

    const ids = getSelectedIds();
    if (ids.length === 0) return;

    setBulkOperating(true);
    setBulkProgress({ current: 0, total: ids.length, operation: 'Updating category' });

    try {
      await requirementsService.bulkUpdate(ids, { category_id: categoryId || null });

      // Find category object for local state update
      const category = categories.find(c => c.id === categoryId) || null;

      // Update local state
      setRows(prev => prev.map(r =>
        selectedRows.has(r.id) ? { ...r, category_id: categoryId || null, category } : r
      ));

      setBulkProgress({ current: ids.length, total: ids.length, operation: 'Updating category' });
      onDataChange?.();
    } catch (err) {
      console.error('Bulk category change error:', err);
      setSaveStatus('error');
    } finally {
      setBulkOperating(false);
      setShowBulkActions(false);
    }
  }, [canManage, selectedRows, getSelectedIds, categories, onDataChange]);

  // Bulk stakeholder area change
  const handleBulkStakeholderChange = useCallback(async (areaId) => {
    if (!canManage || selectedRows.size === 0) return;

    const ids = getSelectedIds();
    if (ids.length === 0) return;

    setBulkOperating(true);
    setBulkProgress({ current: 0, total: ids.length, operation: 'Updating stakeholder' });

    try {
      await requirementsService.bulkUpdate(ids, { stakeholder_area_id: areaId || null });

      // Find area object for local state update
      const stakeholder_area = stakeholderAreas.find(a => a.id === areaId) || null;

      // Update local state
      setRows(prev => prev.map(r =>
        selectedRows.has(r.id) ? { ...r, stakeholder_area_id: areaId || null, stakeholder_area } : r
      ));

      setBulkProgress({ current: ids.length, total: ids.length, operation: 'Updating stakeholder' });
      onDataChange?.();
    } catch (err) {
      console.error('Bulk stakeholder change error:', err);
      setSaveStatus('error');
    } finally {
      setBulkOperating(false);
      setShowBulkActions(false);
    }
  }, [canManage, selectedRows, getSelectedIds, stakeholderAreas, onDataChange]);

  // Bulk submit for approval
  const handleBulkSubmitForApproval = useCallback(async () => {
    if (!canManage || selectedRows.size === 0) return;

    // Only submit draft requirements
    const draftIds = getSelectedIds().filter(id => {
      const row = rows.find(r => r.id === id);
      return row && row.status === 'draft';
    });

    if (draftIds.length === 0) {
      alert('No draft requirements selected. Only draft requirements can be submitted for approval.');
      return;
    }

    setBulkOperating(true);
    setBulkProgress({ current: 0, total: draftIds.length, operation: 'Submitting for approval' });

    try {
      await requirementsService.bulkSubmitForReview(evaluationId, draftIds, user?.id);

      // Update local state
      setRows(prev => prev.map(r =>
        draftIds.includes(r.id) ? { ...r, status: 'under_review' } : r
      ));

      setBulkProgress({ current: draftIds.length, total: draftIds.length, operation: 'Submitting for approval' });
      onDataChange?.();
    } catch (err) {
      console.error('Bulk submit for approval error:', err);
      setSaveStatus('error');
    } finally {
      setBulkOperating(false);
      setShowBulkActions(false);
    }
  }, [canManage, selectedRows, getSelectedIds, rows, evaluationId, user?.id, onDataChange]);

  // Column definitions - using react-data-grid v7 API
  const columns = useMemo(() => {
    const cols = [
      {
        key: 'select',
        name: '',
        width: 40,
        frozen: true,
        renderHeaderCell: () => (
          <input
            type="checkbox"
            checked={selectedRows.size === rows.length && rows.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(rows.map(r => r.id)));
              } else {
                setSelectedRows(new Set());
              }
            }}
          />
        ),
        renderCell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedRows);
              if (e.target.checked) {
                newSelected.add(row.id);
              } else {
                newSelected.delete(row.id);
              }
              setSelectedRows(newSelected);
            }}
          />
        )
      },
      {
        key: 'reference_code',
        name: 'Ref',
        width: 80,
        frozen: true,
        resizable: true
      },
      {
        key: 'title',
        name: 'Title',
        width: 250,
        resizable: true,
        renderEditCell: TextEditor,
        editable: canManage,
        cellClass: (row) => validationErrors[row.id]?.title ? 'rdg-cell-error' : ''
      },
      {
        key: 'description',
        name: 'Description',
        width: 300,
        resizable: true,
        renderEditCell: TextAreaEditor,
        editable: canManage
      },
      {
        key: 'priority',
        name: 'Priority',
        width: 120,
        resizable: true,
        renderEditCell: (p) => <DropdownEditor {...p} options={PRIORITY_OPTIONS} />,
        editable: canManage,
        renderCell: ({ row }) => {
          const opt = PRIORITY_OPTIONS.find(o => o.value === row.priority);
          return <span className={`priority-badge priority-${row.priority}`}>{opt?.label || row.priority}</span>;
        }
      },
      {
        key: 'category_id',
        name: 'Category',
        width: 150,
        resizable: true,
        renderEditCell: (p) => <CategoryEditor {...p} categories={categories} />,
        editable: canManage,
        renderCell: ({ row }) => row.category ? (
          <span
            className="category-badge"
            style={{ backgroundColor: row.category.color || '#6B7280' }}
          >
            {row.category.name}
          </span>
        ) : <span className="text-muted">—</span>
      },
      {
        key: 'stakeholder_area_id',
        name: 'Stakeholder',
        width: 150,
        resizable: true,
        renderEditCell: (p) => <StakeholderAreaEditor {...p} stakeholderAreas={stakeholderAreas} />,
        editable: canManage,
        renderCell: ({ row }) => row.stakeholder_area ? (
          <span
            className="stakeholder-badge"
            style={{ borderColor: row.stakeholder_area.color || '#6B7280' }}
          >
            {row.stakeholder_area.name}
          </span>
        ) : <span className="text-muted">—</span>
      },
      {
        key: 'status',
        name: 'Status',
        width: 120,
        resizable: true,
        renderEditCell: (p) => <DropdownEditor {...p} options={STATUS_OPTIONS} />,
        editable: canManage,
        renderCell: ({ row }) => {
          const opt = STATUS_OPTIONS.find(o => o.value === row.status);
          return <span className={`status-badge status-${row.status}`}>{opt?.label || row.status}</span>;
        }
      },
      {
        key: 'source_type',
        name: 'Source Type',
        width: 130,
        resizable: true,
        renderEditCell: (p) => <DropdownEditor {...p} options={SOURCE_TYPE_OPTIONS} />,
        editable: canManage,
        renderCell: ({ row }) => {
          const opt = SOURCE_TYPE_OPTIONS.find(o => o.value === row.source_type);
          return opt?.label || row.source_type || '—';
        }
      },
      {
        key: 'source_reference',
        name: 'Source Ref',
        width: 150,
        resizable: true,
        renderEditCell: TextEditor,
        editable: canManage
      },
      {
        key: 'acceptance_criteria',
        name: 'Acceptance Criteria',
        width: 250,
        resizable: true,
        renderEditCell: TextAreaEditor,
        editable: canManage
      },
      {
        key: 'weighting',
        name: 'Weight',
        width: 80,
        resizable: true,
        renderEditCell: NumberEditor,
        editable: canManage,
        renderCell: ({ row }) => row.weighting || 0
      }
    ];

    return cols;
  }, [categories, stakeholderAreas, canManage, selectedRows, rows, validationErrors]);

  // Row key getter
  const rowKeyGetter = useCallback((row) => row.id, []);

  return (
    <div className="requirements-grid-view" ref={gridRef} tabIndex={0}>
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          {canManage && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleAddRow}>
                <Plus size={14} />
                Add Row
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowImportWizard(true)}
              >
                <Upload size={14} />
                Import
              </button>
            </>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            disabled={selectedRows.size === 0}
          >
            <Copy size={14} />
            Copy
          </button>
        </div>

        <div className="toolbar-center">
          {selectedRows.size > 0 && (
            <>
              <span className="selection-count">{selectedRows.size} selected</span>

              {canManage && (
                <div className="bulk-actions-group">
                  {/* Bulk Actions Dropdown */}
                  <div className="bulk-dropdown">
                    <button
                      className="btn btn-secondary btn-sm dropdown-trigger"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      disabled={bulkOperating}
                    >
                      Bulk Actions
                      <ChevronDown size={14} />
                    </button>
                    {showBulkActions && (
                      <div className="dropdown-menu bulk-actions-menu">
                        {/* Status submenu */}
                        <div className="dropdown-submenu">
                          <span className="submenu-label">Set Status</span>
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              className="dropdown-item"
                              onClick={() => handleBulkStatusChange(opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        <div className="dropdown-divider" />

                        {/* Priority submenu */}
                        <div className="dropdown-submenu">
                          <span className="submenu-label">Set Priority</span>
                          {PRIORITY_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              className="dropdown-item"
                              onClick={() => handleBulkPriorityChange(opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        <div className="dropdown-divider" />

                        {/* Category submenu */}
                        <div className="dropdown-submenu">
                          <span className="submenu-label">Set Category</span>
                          <button
                            className="dropdown-item"
                            onClick={() => handleBulkCategoryChange(null)}
                          >
                            — None —
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              className="dropdown-item"
                              onClick={() => handleBulkCategoryChange(cat.id)}
                            >
                              <span
                                className="color-dot"
                                style={{ backgroundColor: cat.color || '#6B7280' }}
                              />
                              {cat.name}
                            </button>
                          ))}
                        </div>

                        <div className="dropdown-divider" />

                        {/* Stakeholder Area submenu */}
                        <div className="dropdown-submenu">
                          <span className="submenu-label">Set Stakeholder</span>
                          <button
                            className="dropdown-item"
                            onClick={() => handleBulkStakeholderChange(null)}
                          >
                            — None —
                          </button>
                          {stakeholderAreas.map(area => (
                            <button
                              key={area.id}
                              className="dropdown-item"
                              onClick={() => handleBulkStakeholderChange(area.id)}
                            >
                              <span
                                className="color-dot"
                                style={{ backgroundColor: area.color || '#6B7280' }}
                              />
                              {area.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit for Approval */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleBulkSubmitForApproval}
                    disabled={bulkOperating}
                    title="Submit selected draft requirements for approval"
                  >
                    <Send size={14} />
                    Submit for Approval
                  </button>

                  {/* Delete */}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteSelected}
                    disabled={bulkOperating}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </>
          )}

          {/* Bulk Operation Progress */}
          {bulkOperating && (
            <div className="bulk-progress">
              <Loader2 size={16} className="spinning" />
              <span>{bulkProgress.operation}...</span>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <div className="undo-redo-group">
            <button
              className="btn btn-icon btn-sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title={getUndoTooltip()}
            >
              <Undo2 size={16} />
              {undoStack.length > 0 && (
                <span className="badge-count">{undoStack.length}</span>
              )}
            </button>
            <button
              className="btn btn-icon btn-sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title={getRedoTooltip()}
            >
              <Redo2 size={16} />
              {redoStack.length > 0 && (
                <span className="badge-count">{redoStack.length}</span>
              )}
            </button>
          </div>

          <div className="save-status">
            {saveStatus === 'saving' && (
              <span className="status-saving">
                <span className="spinner-sm" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="status-saved">
                <Check size={14} /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="status-error">
                <AlertCircle size={14} /> Error
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={handleRowsChange}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        rowHeight={40}
        headerRowHeight={44}
        className="rdg-light requirements-data-grid"
        style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
        enableVirtualization={true}
      />

      {/* Status bar */}
      <div className="grid-status-bar">
        <span>Showing {rows.length} requirements</span>
        <button
          className="keyboard-help-btn"
          onClick={() => setShowKeyboardHelp(true)}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={14} />
          Shortcuts
        </button>
      </div>

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <ImportWizard
          evaluationId={evaluationId}
          categories={categories}
          stakeholderAreas={stakeholderAreas}
          onComplete={handleImportComplete}
          onClose={() => setShowImportWizard(false)}
        />
      )}

      {/* Paste Wizard Modal */}
      {showPasteWizard && pasteData && (
        <PasteWizard
          data={pasteData}
          categories={categories}
          stakeholderAreas={stakeholderAreas}
          onComplete={handlePasteComplete}
          onClose={() => {
            setShowPasteWizard(false);
            setPasteData(null);
          }}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="btn-close" onClick={() => setShowKeyboardHelp(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="help-content">
              <div className="shortcut-section">
                <h4>Navigation</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>
                    <span>Next/Previous cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd>
                    <span>Move down/up</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Arrow keys</kbd>
                    <span>Move in direction</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Home</kbd> / <kbd>End</kbd>
                    <span>First/Last cell in row</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Page Up</kbd> / <kbd>Page Down</kbd>
                    <span>Scroll page</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Editing</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>F2</kbd>
                    <span>Edit cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Escape</kbd>
                    <span>Cancel edit</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Delete</kbd>
                    <span>Delete selected rows</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+C</kbd>
                    <span>Copy selected rows</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+V</kbd>
                    <span>Paste from clipboard</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Z</kbd>
                    <span>Undo</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Y</kbd>
                    <span>Redo</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Selection</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Click</kbd>
                    <span>Select row</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Click</kbd>
                    <span>Add to selection</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Shift+Click</kbd>
                    <span>Range selection</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+A</kbd>
                    <span>Select all</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Other</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Ctrl+Insert</kbd>
                    <span>Add new row</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>?</kbd>
                    <span>Show this help</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="help-footer">
              <span className="tip">Press <kbd>Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
