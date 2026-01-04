/**
 * Document Card Component
 * 
 * Displays a single document with metadata and actions.
 * Supports preview, download, and delete operations.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation,
  File,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  MoreVertical,
  Edit2,
  Clock,
  User,
  Tag,
  Cpu,
  CheckCircle,
  AlertCircle,
  Loader,
  MinusCircle
} from 'lucide-react';
import { 
  DOCUMENT_TYPE_CONFIG,
  PARSE_STATUS_CONFIG,
  PARSE_STATUSES 
} from '../../../services/evaluator';
import './DocumentCard.css';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get icon component for file type
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
 * Get parse status icon
 */
function getParseStatusIcon(status) {
  switch (status) {
    case PARSE_STATUSES.PENDING:
      return Clock;
    case PARSE_STATUSES.PROCESSING:
      return Loader;
    case PARSE_STATUSES.COMPLETE:
      return CheckCircle;
    case PARSE_STATUSES.FAILED:
      return AlertCircle;
    case PARSE_STATUSES.SKIPPED:
      return MinusCircle;
    default:
      return Clock;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

function DocumentCard({
  document,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
  onParse,
  compact = false
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Get config and icons
  const typeConfig = DOCUMENT_TYPE_CONFIG[document.document_type] || DOCUMENT_TYPE_CONFIG.other;
  const parseConfig = PARSE_STATUS_CONFIG[document.parse_status] || PARSE_STATUS_CONFIG.pending;
  const FileIcon = getFileIcon(document.mime_type);
  const ParseStatusIcon = getParseStatusIcon(document.parse_status);

  // Check if preview is possible
  const canPreview = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'text/plain'].includes(document.mime_type);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleAction = useCallback(async (action, handler) => {
    if (!handler) return;
    setActionLoading(action);
    setShowMenu(false);
    try {
      await handler(document);
    } finally {
      setActionLoading(null);
    }
  }, [document]);

  const handlePreview = useCallback((e) => {
    e.stopPropagation();
    handleAction('preview', onPreview);
  }, [handleAction, onPreview]);

  const handleDownload = useCallback((e) => {
    e.stopPropagation();
    handleAction('download', onDownload);
  }, [handleAction, onDownload]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    handleAction('edit', onEdit);
  }, [handleAction, onEdit]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    handleAction('delete', onDelete);
  }, [handleAction, onDelete]);

  const handleParse = useCallback((e) => {
    e.stopPropagation();
    handleAction('parse', onParse);
  }, [handleAction, onParse]);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  }, []);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  if (compact) {
    return (
      <div className="document-card compact" onClick={handlePreview}>
        <div className="document-icon">
          <FileIcon size={20} />
        </div>
        <div className="document-info">
          <span className="document-name">{document.name}</span>
          <span className="document-meta">
            {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
          </span>
        </div>
        <div className="document-actions">
          {onDownload && (
            <button 
              className="action-btn"
              onClick={handleDownload}
              disabled={actionLoading === 'download'}
              title="Download"
            >
              {actionLoading === 'download' ? (
                <Loader className="spinning" size={16} />
              ) : (
                <Download size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="document-card">
      {/* Header */}
      <div className="document-header">
        <div className={`document-icon-lg color-${typeConfig.color}`}>
          <FileIcon size={24} />
        </div>
        
        <div className="document-title-section">
          <h4 className="document-title">{document.name}</h4>
          {document.description && (
            <p className="document-description">{document.description}</p>
          )}
        </div>

        <div className="document-menu">
          <button 
            className="menu-trigger"
            onClick={toggleMenu}
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="dropdown-menu">
                {canPreview && onPreview && (
                  <button className="menu-item" onClick={handlePreview}>
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                )}
                {onDownload && (
                  <button className="menu-item" onClick={handleDownload}>
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                )}
                {onEdit && (
                  <button className="menu-item" onClick={handleEdit}>
                    <Edit2 size={14} />
                    <span>Edit Details</span>
                  </button>
                )}
                {onParse && document.parse_status === PARSE_STATUSES.PENDING && (
                  <button className="menu-item" onClick={handleParse}>
                    <Cpu size={14} />
                    <span>Parse with AI</span>
                  </button>
                )}
                <div className="menu-divider" />
                {onDelete && (
                  <button className="menu-item danger" onClick={handleDelete}>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="document-metadata">
        <div className="metadata-item">
          <Tag size={14} />
          <span>{typeConfig.label}</span>
        </div>
        
        <div className="metadata-item">
          <File size={14} />
          <span>{formatFileSize(document.file_size)}</span>
        </div>
        
        <div className="metadata-item">
          <Clock size={14} />
          <span>{formatDate(document.created_at)}</span>
        </div>

        {document.uploaded_by_profile && (
          <div className="metadata-item">
            <User size={14} />
            <span>{document.uploaded_by_profile.full_name}</span>
          </div>
        )}
      </div>

      {/* Parse Status */}
      <div className={`parse-status status-${document.parse_status}`}>
        <ParseStatusIcon size={14} className={document.parse_status === PARSE_STATUSES.PROCESSING ? 'spinning' : ''} />
        <span>{parseConfig.label}</span>
        {document.parse_status === PARSE_STATUSES.COMPLETE && document.parse_results?.requirements?.length > 0 && (
          <span className="parse-results-count">
            ({document.parse_results.requirements.length} requirements extracted)
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="document-quick-actions">
        {canPreview && onPreview && (
          <button 
            className="quick-action-btn"
            onClick={handlePreview}
            disabled={actionLoading === 'preview'}
          >
            {actionLoading === 'preview' ? (
              <Loader className="spinning" size={14} />
            ) : (
              <Eye size={14} />
            )}
            <span>Preview</span>
          </button>
        )}
        
        {onDownload && (
          <button 
            className="quick-action-btn"
            onClick={handleDownload}
            disabled={actionLoading === 'download'}
          >
            {actionLoading === 'download' ? (
              <Loader className="spinning" size={14} />
            ) : (
              <Download size={14} />
            )}
            <span>Download</span>
          </button>
        )}

        {document.file_url && (
          <a 
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-action-btn"
          >
            <ExternalLink size={14} />
            <span>Open</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default DocumentCard;
