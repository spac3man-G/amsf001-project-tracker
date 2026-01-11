/**
 * ImportWizard
 *
 * Multi-step wizard for importing requirements from Excel/CSV files.
 * Handles file parsing, column mapping, validation, and bulk import.
 *
 * @version 1.1
 * @created 10 January 2026
 * @updated 10 January 2026 - Phase 3 enhancements
 * @phase FE-007 - Excel-Like Requirements Grid Interface
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { requirementsService } from '../../../services/evaluator';
import './ImportWizard.css';

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
  'done': 'approved',
  'rejected': 'rejected',
  'declined': 'rejected'
};

export default function ImportWizard({
  evaluationId,
  categories,
  stakeholderAreas,
  onComplete,
  onClose
}) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheet Select, 3: Map, 4: Validate, 5: Complete
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [importValidOnly, setImportValidOnly] = useState(true);

  const fileInputRef = useRef(null);

  // Parse file
  const parseFile = useCallback(async (file) => {
    setError(null);

    try {
      const extension = file.name.split('.').pop().toLowerCase();

      if (extension === 'csv') {
        // Parse CSV
        Papa.parse(file, {
          complete: (results) => {
            setRawData(results.data);
            setSheets([{ name: 'Sheet 1', data: results.data }]);
            setSelectedSheet('Sheet 1');
            autoMapColumns(results.data[0] || []);
            setStep(3); // Skip sheet selection for CSV
          },
          error: (err) => {
            setError(`Failed to parse CSV: ${err.message}`);
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);

        const parsedSheets = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })
        }));

        setSheets(parsedSheets);

        if (parsedSheets.length === 1) {
          setSelectedSheet(parsedSheets[0].name);
          setRawData(parsedSheets[0].data);
          autoMapColumns(parsedSheets[0].data[0] || []);
          setStep(3);
        } else {
          setStep(2);
        }
      } else {
        setError('Unsupported file format. Please use .xlsx, .xls, or .csv');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(`Failed to parse file: ${err.message}`);
    }
  }, []);

  // Auto-map columns based on header names
  const autoMapColumns = useCallback((headers) => {
    const mapping = {};
    const headerLower = headers.map(h => (h || '').toString().toLowerCase().trim());

    headerLower.forEach((header, idx) => {
      // Try to match headers to fields
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
      } else if (header.includes('weight')) {
        mapping[idx] = 'weighting';
      }
    });

    setColumnMapping(mapping);
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      parseFile(droppedFile);
    }
  }, [parseFile]);

  // Handle file select
  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, [parseFile]);

  // Handle sheet selection
  const handleSheetSelect = useCallback((sheetName) => {
    const sheet = sheets.find(s => s.name === sheetName);
    if (sheet) {
      setSelectedSheet(sheetName);
      setRawData(sheet.data);
      autoMapColumns(sheet.data[0] || []);
    }
  }, [sheets, autoMapColumns]);

  // Map raw data to requirements with enhanced validation
  const mapDataToRequirements = useCallback(() => {
    const startRow = skipFirstRow ? 1 : 0;
    const requirements = [];
    const errors = [];
    const warnings = [];

    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every(cell => !cell)) continue; // Skip empty rows

      const rowNum = i + 1;
      const req = { _rowNum: rowNum };
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
              errors.push({ row: rowNum, message: `Title too long (${strValue.length}/255 chars)` });
            } else {
              req.title = strValue;
              hasTitle = !!strValue;
            }
            break;
          case 'description':
            if (strValue.length > 5000) {
              rowWarnings.push('Description truncated to 5000 chars');
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
              rowWarnings.push(`Unknown priority "${strValue}"`);
            }
            req.priority = mappedPriority || 'should_have';
            break;
          case 'status':
            const mappedStatus = STATUS_MAP[strValue.toLowerCase()];
            if (!mappedStatus) {
              rowWarnings.push(`Unknown status "${strValue}"`);
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
              rowWarnings.push(`Category "${strValue}" not found`);
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
              rowWarnings.push(`Stakeholder "${strValue}" not found`);
            }
            break;
          case 'source_type':
            req.source_type = strValue.toLowerCase().replace(/\s+/g, '_');
            break;
          case 'weighting':
            const num = parseFloat(strValue);
            if (isNaN(num)) {
              rowWarnings.push(`Invalid weighting "${strValue}"`);
              req.weighting = 0;
            } else if (num < 0 || num > 100) {
              rowWarnings.push(`Weighting ${num} clamped to 0-100`);
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
        if (rowWarnings.length > 0) {
          warnings.push({ row: rowNum, messages: rowWarnings });
        }
      }
    }

    return { requirements, errors, warnings };
  }, [rawData, columnMapping, skipFirstRow, categories, stakeholderAreas]);

  // Validate step
  const handleValidate = useCallback(() => {
    const result = mapDataToRequirements();
    setValidationResults(result);
    setStep(4);
  }, [mapDataToRequirements]);

  // Import requirements with progress tracking
  const handleImport = useCallback(async () => {
    if (!validationResults) return;

    const toImport = validationResults.requirements;
    if (toImport.length === 0) return;

    setImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: toImport.length });

    try {
      // Import in batches to show progress
      const batchSize = 25;
      let created = 0;
      const allErrors = [];

      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
        const result = await requirementsService.bulkCreate(evaluationId, batch);

        created += result.created || 0;
        if (result.errors) {
          allErrors.push(...result.errors);
        }

        setImportProgress({
          current: Math.min(i + batchSize, toImport.length),
          total: toImport.length
        });
      }

      setImportResult({
        created,
        total: toImport.length,
        errors: allErrors
      });
      setStep(5);
    } catch (err) {
      console.error('Import error:', err);
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }, [validationResults, evaluationId]);

  // Get preview data
  const getPreviewData = useCallback(() => {
    const startRow = skipFirstRow ? 1 : 0;
    return rawData.slice(startRow, startRow + 5);
  }, [rawData, skipFirstRow]);

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1: // Upload
        return (
          <div className="wizard-step upload-step">
            <div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} strokeWidth={1.5} />
              <p className="drop-text">Drag & drop your file here</p>
              <p className="drop-subtext">or click to browse</p>
              <p className="drop-formats">Supported: .xlsx, .xls, .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        );

      case 2: // Sheet Selection
        return (
          <div className="wizard-step sheet-step">
            <h4>Select Sheet</h4>
            <p className="step-description">This workbook contains multiple sheets. Select the one with your requirements.</p>
            <div className="sheet-list">
              {sheets.map(sheet => (
                <button
                  key={sheet.name}
                  className={`sheet-option ${selectedSheet === sheet.name ? 'selected' : ''}`}
                  onClick={() => handleSheetSelect(sheet.name)}
                >
                  <FileSpreadsheet size={20} />
                  <span className="sheet-name">{sheet.name}</span>
                  <span className="sheet-rows">{sheet.data.length} rows</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3: // Column Mapping
        return (
          <div className="wizard-step mapping-step">
            <h4>Map Columns</h4>
            <p className="step-description">Match your spreadsheet columns to requirement fields.</p>

            <label className="skip-row-checkbox">
              <input
                type="checkbox"
                checked={skipFirstRow}
                onChange={(e) => setSkipFirstRow(e.target.checked)}
              />
              First row contains headers (skip)
            </label>

            <div className="column-mapping">
              <div className="mapping-header">
                <span>Your Column</span>
                <span>Sample Data</span>
                <span>Map To</span>
              </div>
              {(rawData[0] || []).map((header, idx) => (
                <div key={idx} className="mapping-row">
                  <span className="column-name">{header || `Column ${idx + 1}`}</span>
                  <span className="sample-data">
                    {rawData[skipFirstRow ? 1 : 0]?.[idx] || '—'}
                  </span>
                  <select
                    value={columnMapping[idx] || 'skip'}
                    onChange={(e) => setColumnMapping(prev => ({
                      ...prev,
                      [idx]: e.target.value
                    }))}
                  >
                    <option value="skip">— Skip this column —</option>
                    {REQUIREMENT_FIELDS.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!Object.values(columnMapping).includes('title') && (
              <div className="mapping-warning">
                <AlertTriangle size={16} />
                <span>Title column is required. Please map a column to "Title".</span>
              </div>
            )}
          </div>
        );

      case 4: // Validation
        return (
          <div className="wizard-step validation-step">
            <h4>Validation Results</h4>

            <div className="validation-summary">
              <div className="summary-item valid">
                <Check size={20} />
                <span>{validationResults?.requirements.length || 0} valid rows</span>
              </div>
              {validationResults?.errors.length > 0 && (
                <div className="summary-item errors">
                  <AlertCircle size={20} />
                  <span>{validationResults.errors.length} rows with errors (will be skipped)</span>
                </div>
              )}
              {validationResults?.warnings?.length > 0 && (
                <div className="summary-item warnings">
                  <AlertTriangle size={20} />
                  <span>{validationResults.warnings.length} rows with warnings</span>
                </div>
              )}
            </div>

            {validationResults?.errors.length > 0 && (
              <div className="error-list-section">
                <h5>Errors:</h5>
                <ul className="error-list">
                  {validationResults.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.message}</li>
                  ))}
                  {validationResults.errors.length > 10 && (
                    <li className="more-errors">
                      ... and {validationResults.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {validationResults?.warnings?.length > 0 && (
              <div className="warning-list-section">
                <h5>Warnings:</h5>
                <ul className="warning-list">
                  {validationResults.warnings.slice(0, 5).map((warn, idx) => (
                    <li key={idx}>Row {warn.row}: {warn.messages.join('; ')}</li>
                  ))}
                  {validationResults.warnings.length > 5 && (
                    <li className="more-warnings">
                      ... and {validationResults.warnings.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="preview-table">
              <h5>Preview (first 5 valid rows):</h5>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults?.requirements.slice(0, 5).map((req, idx) => (
                    <tr key={idx}>
                      <td>{req.title}</td>
                      <td>{req.priority || 'should_have'}</td>
                      <td>{req.status || 'draft'}</td>
                      <td>{req._categoryName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="import-progress">
                <div className="progress-header">
                  <Loader2 size={16} className="spinning" />
                  <span>Importing requirements...</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(importProgress.current / importProgress.total) * 100}%`
                    }}
                  />
                </div>
                <div className="progress-text">
                  {importProgress.current} of {importProgress.total}
                </div>
              </div>
            )}
          </div>
        );

      case 5: // Complete
        return (
          <div className="wizard-step complete-step">
            <div className="complete-icon">
              <Check size={48} />
            </div>
            <h4>Import Complete</h4>
            <p className="complete-message">
              Successfully imported <strong>{importResult?.created || 0}</strong> requirements.
            </p>
            {importResult?.errors?.length > 0 && (
              <p className="complete-warning">
                {importResult.errors.length} rows were skipped due to errors.
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="import-wizard-overlay">
      <div className="import-wizard">
        <div className="wizard-header">
          <h3>Import Requirements</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="wizard-progress">
          {['Upload', 'Sheet', 'Map', 'Validate', 'Done'].map((label, idx) => (
            <div
              key={label}
              className={`progress-step ${step > idx + 1 ? 'completed' : ''} ${step === idx + 1 ? 'active' : ''}`}
            >
              <div className="step-number">{step > idx + 1 ? <Check size={14} /> : idx + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="wizard-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="wizard-content">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          {step > 1 && step < 5 && (
            <button
              className="btn btn-secondary"
              onClick={() => setStep(prev => prev - 1)}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          <div className="footer-spacer" />

          {step === 2 && selectedSheet && (
            <button
              className="btn btn-primary"
              onClick={() => setStep(3)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button
              className="btn btn-primary"
              onClick={handleValidate}
              disabled={!Object.values(columnMapping).includes('title')}
            >
              Validate
              <ChevronRight size={16} />
            </button>
          )}

          {step === 4 && (
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || !validationResults?.requirements.length}
            >
              {importing
                ? `Importing ${importProgress.current}/${importProgress.total}...`
                : `Import ${validationResults?.requirements.length || 0} Rows`
              }
            </button>
          )}

          {step === 5 && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onComplete(importResult);
                onClose();
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
