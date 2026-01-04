/**
 * Document Uploader Component
 * 
 * Drag-and-drop file upload interface for evaluation documents.
 * Supports multiple file upload with progress tracking.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation,
  File,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { 
  DOCUMENT_TYPES, 
  DOCUMENT_TYPE_CONFIG,
  ALLOWED_FILE_TYPES 
} from '../../../services/evaluator';
import './DocumentUploader.css';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get icon for file type
 */
function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType?.includes('word')) return FileText;
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return FileSpreadsheet;
  if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return Presentation;
  return File;
}

/**
 * Validate a file
 */
function validateFile(file) {
  const typeConfig = ALLOWED_FILE_TYPES[file.type];
  if (!typeConfig) {
    return { valid: false, error: 'File type not allowed' };
  }
  if (file.size > typeConfig.maxSize) {
    return { valid: false, error: `File too large (max ${formatFileSize(typeConfig.maxSize)})` };
  }
  return { valid: true };
}

// ============================================================================
// COMPONENT
// ============================================================================

function DocumentUploader({ 
  onUpload, 
  onCancel,
  uploading = false,
  progress = null,
  multiple = true,
  maxFiles = 10
}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const handleFiles = useCallback((newFiles) => {
    if (!multiple && newFiles.length > 1) {
      newFiles = [newFiles[0]];
    }

    const processedFiles = newFiles.map(file => {
      const validation = validateFile(file);
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        documentType: DOCUMENT_TYPES.OTHER,
        description: '',
        valid: validation.valid,
        error: validation.error,
        status: validation.valid ? 'pending' : 'error'
      };
    });

    setFiles(prev => {
      const combined = [...prev, ...processedFiles];
      return multiple ? combined.slice(0, maxFiles) : processedFiles;
    });
  }, [multiple, maxFiles]);

  const handleRemoveFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleUpdateFile = useCallback((fileId, updates) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  }, []);

  const handleUpload = useCallback(() => {
    const validFiles = files.filter(f => f.valid);
    if (validFiles.length === 0) return;

    const uploads = validFiles.map(f => ({
      file: f.file,
      metadata: {
        name: f.name,
        description: f.description,
        document_type: f.documentType
      }
    }));

    onUpload(uploads);
  }, [files, onUpload]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  const validFiles = files.filter(f => f.valid);
  const hasValidFiles = validFiles.length > 0;

  return (
    <div className="document-uploader">
      {/* Drop Zone */}
      <div 
        className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInput}
          accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
          style={{ display: 'none' }}
        />
        
        <div className="drop-zone-content">
          <Upload className="drop-zone-icon" size={48} />
          <p className="drop-zone-text">
            Drag and drop files here, or <span className="browse-link">browse</span>
          </p>
          <p className="drop-zone-hint">
            PDF, Word, Excel, PowerPoint, images, and text files up to 50MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected Files ({files.length})</h4>
          
          {files.map(fileItem => {
            const FileIcon = getFileIcon(fileItem.type);
            
            return (
              <div 
                key={fileItem.id} 
                className={`file-item ${fileItem.valid ? '' : 'invalid'}`}
              >
                <div className="file-item-icon">
                  <FileIcon size={20} />
                </div>
                
                <div className="file-item-details">
                  <div className="file-item-header">
                    <input
                      type="text"
                      className="file-name-input"
                      value={fileItem.name}
                      onChange={(e) => handleUpdateFile(fileItem.id, { name: e.target.value })}
                      disabled={uploading}
                    />
                    <span className="file-size">{formatFileSize(fileItem.size)}</span>
                  </div>
                  
                  {fileItem.valid ? (
                    <div className="file-item-meta">
                      <select
                        className="document-type-select"
                        value={fileItem.documentType}
                        onChange={(e) => handleUpdateFile(fileItem.id, { documentType: e.target.value })}
                        disabled={uploading}
                      >
                        {Object.entries(DOCUMENT_TYPE_CONFIG).map(([type, config]) => (
                          <option key={type} value={type}>{config.label}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        className="file-description-input"
                        placeholder="Add description (optional)"
                        value={fileItem.description}
                        onChange={(e) => handleUpdateFile(fileItem.id, { description: e.target.value })}
                        disabled={uploading}
                      />
                    </div>
                  ) : (
                    <div className="file-error">
                      <AlertCircle size={14} />
                      <span>{fileItem.error}</span>
                    </div>
                  )}
                </div>
                
                <div className="file-item-status">
                  {uploading && progress?.file === fileItem.file.name ? (
                    progress.status === 'success' ? (
                      <Check className="status-icon success" size={20} />
                    ) : progress.status === 'error' ? (
                      <AlertCircle className="status-icon error" size={20} />
                    ) : (
                      <Loader className="status-icon loading" size={20} />
                    )
                  ) : (
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => handleRemoveFile(fileItem.id)}
                      disabled={uploading}
                      aria-label="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress */}
      {uploading && progress && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Uploading {progress.current} of {progress.total}...
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="uploader-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!hasValidFiles || uploading}
        >
          {uploading ? (
            <>
              <Loader className="btn-icon spinning" size={16} />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="btn-icon" size={16} />
              Upload {hasValidFiles ? `(${validFiles.length})` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default DocumentUploader;
