/**
 * PasteWizard
 *
 * Modal wizard for mapping pasted clipboard data to requirement fields.
 * Handles tabular data pasted from Excel/Google Sheets.
 *
 * @version 1.1
 * @created 10 January 2026
 * @updated 10 January 2026 - Phase 3 enhancements
 * @phase FE-007 - Excel-Like Requirements Grid Interface
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, AlertTriangle, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './PasteWizard.css';

// Field definitions for mapping
const REQUIREMENT_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'priority', label: 'Priority', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'category_name', label: 'Category', required: false },
  { key: 'stakeholder_area_name', label: 'Stakeholder Area', required: false },
  { key: 'source_type', label: 'Source Type', required: false },
  { key: 'source_reference', label: 'Source Reference', required: false },
  { key: 'acceptance_criteria', label: 'Acceptance Criteria', required: false },
  { key: 'weighting', label: 'Weighting', required: false }
];

// Priority mapping
const PRIORITY_MAP = {
  'must have': 'must_have',
  'must': 'must_have',
  'high': 'must_have',
  'critical': 'must_have',
  'should have': 'should_have',
  'should': 'should_have',
  'medium': 'should_have',
  'could have': 'could_have',
  'could': 'could_have',
  'low': 'could_have',
  'nice to have': 'could_have',
  "won't have": 'wont_have',
  'wont have': 'wont_have',
  'wont': 'wont_have',
  'out of scope': 'wont_have'
};

// Status mapping
const STATUS_MAP = {
  'draft': 'draft',
  'new': 'draft',
  'pending': 'under_review',
  'under review': 'under_review',
  'review': 'under_review',
  'approved': 'approved',
  'accepted': 'approved',
  'rejected': 'rejected',
  'declined': 'rejected'
};

export default function PasteWizard({
  data,
  categories,
  stakeholderAreas,
  onComplete,
  onClose
}) {
  const [columnMapping, setColumnMapping] = useState({});
  const [skipFirstRow, setSkipFirstRow] = useState(false);
  const [showMappedPreview, setShowMappedPreview] = useState(false);

  // Auto-detect if first row is headers
  useEffect(() => {
    if (data && data.length > 1) {
      const firstRow = data[0];
      const secondRow = data[1];

      // Check if first row looks like headers (contains common header terms)
      const headerKeywords = ['title', 'description', 'name', 'requirement', 'priority', 'status', 'category'];
      const looksLikeHeaders = firstRow.some(cell =>
        cell && headerKeywords.some(kw => cell.toString().toLowerCase().includes(kw))
      );

      setSkipFirstRow(looksLikeHeaders);

      // Auto-map columns
      if (looksLikeHeaders) {
        autoMapColumns(firstRow);
      }
    }
  }, [data]);

  // Auto-map columns based on header names
  const autoMapColumns = useCallback((headers) => {
    const mapping = {};
    const headerLower = headers.map(h => (h || '').toString().toLowerCase().trim());

    headerLower.forEach((header, idx) => {
      if (header.includes('title') || header.includes('name') || header === 'requirement') {
        mapping[idx] = 'title';
      } else if (header.includes('description') || header.includes('desc') || header.includes('detail')) {
        mapping[idx] = 'description';
      } else if (header.includes('priority') || header.includes('moscow')) {
        mapping[idx] = 'priority';
      } else if (header.includes('status') || header.includes('state')) {
        mapping[idx] = 'status';
      } else if (header.includes('category') || header.includes('cat') || header.includes('type')) {
        mapping[idx] = 'category_name';
      } else if (header.includes('stakeholder') || header.includes('area') || header.includes('department')) {
        mapping[idx] = 'stakeholder_area_name';
      } else if (header.includes('source') && header.includes('type')) {
        mapping[idx] = 'source_type';
      } else if (header.includes('source') || header.includes('reference')) {
        mapping[idx] = 'source_reference';
      } else if (header.includes('acceptance') || header.includes('criteria')) {
        mapping[idx] = 'acceptance_criteria';
      }
    });

    setColumnMapping(mapping);
  }, []);

  // Map data to requirements with detailed validation
  const validationResult = useMemo(() => {
    if (!data || data.length === 0) return { requirements: [], errors: [], warnings: [] };

    const startRow = skipFirstRow ? 1 : 0;
    const requirements = [];
    const errors = [];
    const warnings = [];

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(cell => !cell)) continue; // Skip empty rows

      const rowNum = i + 1; // Human-readable row number
      const req = { _rowNum: rowNum };
      const rowErrors = [];
      const rowWarnings = [];
      let hasTitle = false;

      Object.entries(columnMapping).forEach(([colIdx, fieldKey]) => {
        if (fieldKey === 'skip') return;

        const value = row[parseInt(colIdx, 10)];
        if (value === undefined || value === null || value === '') return;

        const strValue = value.toString().trim();

        switch (fieldKey) {
          case 'title':
            if (strValue.length > 255) {
              rowErrors.push(`Title too long (${strValue.length}/255 chars)`);
            } else {
              req.title = strValue;
              hasTitle = !!strValue;
            }
            break;
          case 'description':
            if (strValue.length > 5000) {
              rowWarnings.push(`Description truncated to 5000 chars`);
              req.description = strValue.substring(0, 5000);
            } else {
              req.description = strValue;
            }
            break;
          case 'source_reference':
          case 'acceptance_criteria':
            req[fieldKey] = strValue;
            break;
          case 'priority':
            const mappedPriority = PRIORITY_MAP[strValue.toLowerCase()];
            if (!mappedPriority) {
              rowWarnings.push(`Unknown priority "${strValue}", defaulting to "Should Have"`);
            }
            req.priority = mappedPriority || 'should_have';
            break;
          case 'status':
            const mappedStatus = STATUS_MAP[strValue.toLowerCase()];
            if (!mappedStatus) {
              rowWarnings.push(`Unknown status "${strValue}", defaulting to "Draft"`);
            }
            req.status = mappedStatus || 'draft';
            break;
          case 'category_name':
            const cat = categories.find(c =>
              c.name.toLowerCase() === strValue.toLowerCase()
            );
            if (cat) {
              req.category_id = cat.id;
              req._categoryName = cat.name;
            } else {
              rowWarnings.push(`Category "${strValue}" not found, will be skipped`);
            }
            break;
          case 'stakeholder_area_name':
            const area = stakeholderAreas.find(a =>
              a.name.toLowerCase() === strValue.toLowerCase()
            );
            if (area) {
              req.stakeholder_area_id = area.id;
              req._stakeholderName = area.name;
            } else {
              rowWarnings.push(`Stakeholder "${strValue}" not found, will be skipped`);
            }
            break;
          case 'source_type':
            req.source_type = strValue.toLowerCase().replace(/\s+/g, '_');
            break;
          case 'weighting':
            const num = parseFloat(strValue);
            if (isNaN(num)) {
              rowWarnings.push(`Invalid weighting "${strValue}", defaulting to 0`);
              req.weighting = 0;
            } else if (num < 0 || num > 100) {
              rowWarnings.push(`Weighting ${num} out of range, clamping to 0-100`);
              req.weighting = Math.max(0, Math.min(100, num));
            } else {
              req.weighting = num;
            }
            break;
        }
      });

      if (!hasTitle) {
        errors.push({ row: rowNum, message: 'Missing or empty title' });
      } else {
        requirements.push(req);
        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, message: rowErrors.join('; ') });
        }
        if (rowWarnings.length > 0) {
          warnings.push({ row: rowNum, messages: rowWarnings });
        }
      }
    }

    return { requirements, errors, warnings };
  }, [data, columnMapping, skipFirstRow, categories, stakeholderAreas]);

  // Get mapped requirements
  const mappedRequirements = validationResult.requirements;

  // Preview rows
  const previewRows = useMemo(() => {
    if (!data) return [];
    const startRow = skipFirstRow ? 1 : 0;
    return data.slice(startRow, startRow + 5);
  }, [data, skipFirstRow]);

  // Handle import
  const handleImport = useCallback(() => {
    onComplete(mappedRequirements);
  }, [mappedRequirements, onComplete]);

  // Check if title is mapped
  const hasTitleMapping = Object.values(columnMapping).includes('title');

  // Get column count
  const columnCount = data && data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

  return (
    <div className="paste-wizard-overlay">
      <div className="paste-wizard">
        <div className="wizard-header">
          <h3>Paste Data from Clipboard</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="wizard-content">
          {/* Preview Toggle */}
          <div className="preview-toggle">
            <button
              className={`toggle-btn ${!showMappedPreview ? 'active' : ''}`}
              onClick={() => setShowMappedPreview(false)}
            >
              <Eye size={14} />
              Raw Data
            </button>
            <button
              className={`toggle-btn ${showMappedPreview ? 'active' : ''}`}
              onClick={() => setShowMappedPreview(true)}
              disabled={!hasTitleMapping}
            >
              <EyeOff size={14} />
              Mapped Preview
            </button>
          </div>

          {/* Raw Preview Table */}
          {!showMappedPreview && (
            <div className="preview-section">
              <h4>Preview (showing first {Math.min(previewRows.length, 5)} of {data.length - (skipFirstRow ? 1 : 0)} rows)</h4>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <tbody>
                    {previewRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx}>{cell || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mapped Preview Table */}
          {showMappedPreview && hasTitleMapping && (
            <div className="preview-section">
              <h4>Mapped Preview (first 5 of {mappedRequirements.length} valid rows)</h4>
              <div className="preview-table-wrapper">
                <table className="preview-table mapped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Stakeholder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRequirements.slice(0, 5).map((req, idx) => (
                      <tr key={idx}>
                        <td>{req.title}</td>
                        <td>{req.priority || 'should_have'}</td>
                        <td>{req.status || 'draft'}</td>
                        <td>{req._categoryName || '—'}</td>
                        <td>{req._stakeholderName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skip First Row */}
          <label className="skip-row-checkbox">
            <input
              type="checkbox"
              checked={skipFirstRow}
              onChange={(e) => setSkipFirstRow(e.target.checked)}
            />
            First row contains headers (skip)
          </label>

          {/* Column Mapping */}
          <div className="mapping-section">
            <h4>Column Mapping</h4>
            <div className="mapping-grid">
              {Array.from({ length: columnCount }).map((_, idx) => (
                <div key={idx} className="mapping-item">
                  <label>Column {idx + 1}</label>
                  <span className="sample-value">
                    {data[skipFirstRow ? 0 : 0]?.[idx] || `—`}
                  </span>
                  <select
                    value={columnMapping[idx] || 'skip'}
                    onChange={(e) => setColumnMapping(prev => ({
                      ...prev,
                      [idx]: e.target.value
                    }))}
                  >
                    <option value="skip">— Skip —</option>
                    {REQUIREMENT_FIELDS.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Messages */}
          {!hasTitleMapping && (
            <div className="mapping-warning">
              <AlertTriangle size={16} />
              <span>Title column is required. Please map a column to "Title".</span>
            </div>
          )}

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div className="validation-errors">
              <div className="error-header">
                <AlertCircle size={16} />
                <span>{validationResult.errors.length} rows with errors (will be skipped)</span>
              </div>
              <ul className="error-list">
                {validationResult.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>Row {err.row}: {err.message}</li>
                ))}
                {validationResult.errors.length > 5 && (
                  <li className="more">... and {validationResult.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="validation-warnings">
              <div className="warning-header">
                <AlertTriangle size={16} />
                <span>{validationResult.warnings.length} rows with warnings</span>
              </div>
              <ul className="warning-list">
                {validationResult.warnings.slice(0, 3).map((warn, idx) => (
                  <li key={idx}>Row {warn.row}: {warn.messages.join('; ')}</li>
                ))}
                {validationResult.warnings.length > 3 && (
                  <li className="more">... and {validationResult.warnings.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Success */}
          {hasTitleMapping && mappedRequirements.length > 0 && validationResult.errors.length === 0 && (
            <div className="validation-success">
              <Check size={16} />
              <span>{mappedRequirements.length} valid rows ready to import</span>
            </div>
          )}

          {hasTitleMapping && mappedRequirements.length > 0 && validationResult.errors.length > 0 && (
            <div className="validation-partial">
              <Check size={16} />
              <span>{mappedRequirements.length} valid rows will be imported ({validationResult.errors.length} skipped)</span>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!hasTitleMapping || mappedRequirements.length === 0}
          >
            Import {mappedRequirements.length} Rows
          </button>
        </div>
      </div>
    </div>
  );
}
