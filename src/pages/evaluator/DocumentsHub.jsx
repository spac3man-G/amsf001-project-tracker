/**
 * Documents Hub Page
 * 
 * Main page for managing evaluation documents.
 * Provides document upload, viewing, and management functionality.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Folder,
  RefreshCw,
  Plus,
  AlertCircle,
  Download,
  CheckCircle
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  evaluationDocumentsService,
  DOCUMENT_TYPE_CONFIG 
} from '../../services/evaluator';
import { 
  DocumentUploader, 
  DocumentList,
  DocumentViewer 
} from '../../components/evaluator';
import './DocumentsHub.css';

function DocumentsHub() {
  const { evaluationId, currentEvaluation } = useEvaluation();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  
  // Viewer state
  const [viewerDocument, setViewerDocument] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // --------------------------------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------------------------------

  const loadDocuments = useCallback(async () => {
    if (!evaluationId) return;
    
    setLoading(true);
    try {
      const [docs, sum] = await Promise.all([
        evaluationDocumentsService.getAllWithDetails(evaluationId),
        evaluationDocumentsService.getSummary(evaluationId)
      ]);
      setDocuments(docs);
      setSummary(sum);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [evaluationId, showError]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleUpload = useCallback(async (uploads) => {
    if (!evaluationId || !user?.id) return;

    setUploading(true);
    setUploadProgress(null);

    try {
      const results = await evaluationDocumentsService.uploadMultipleDocuments(
        evaluationId,
        uploads,
        user.id,
        setUploadProgress
      );

      if (results.successful.length > 0) {
        showSuccess(`Successfully uploaded ${results.successful.length} document(s)`);
      }

      if (results.failed.length > 0) {
        showError(`Failed to upload ${results.failed.length} document(s)`);
      }

      // Refresh document list
      await loadDocuments();
      
      // Close uploader if all successful
      if (results.failed.length === 0) {
        setShowUploader(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [evaluationId, user?.id, loadDocuments, showSuccess, showError]);

  const handlePreview = useCallback((document) => {
    setViewerDocument(document);
    setViewerOpen(true);
  }, []);

  const handleDownload = useCallback(async (document) => {
    try {
      const url = await evaluationDocumentsService.getDownloadUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        // Fallback to direct URL
        window.open(document.file_url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct URL
      if (document.file_url) {
        window.open(document.file_url, '_blank');
      } else {
        showError('Failed to download document');
      }
    }
  }, [showError]);

  const handleEdit = useCallback((document) => {
    // TODO: Implement edit modal
    console.log('Edit document:', document);
  }, []);

  const handleDelete = useCallback(async (document) => {
    if (!confirm(`Are you sure you want to delete "${document.name}"?`)) {
      return;
    }

    try {
      await evaluationDocumentsService.deleteDocument(document.id, user?.id);
      showSuccess('Document deleted successfully');
      await loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete document');
    }
  }, [user?.id, loadDocuments, showSuccess, showError]);

  const handleParse = useCallback(async (document) => {
    // Placeholder for AI parsing - will be implemented in Phase 8
    showSuccess('AI parsing will be available in a future update');
  }, [showSuccess]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="documents-hub">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Folder className="header-icon" />
            Documents
          </h1>
          <p className="header-description">
            Upload and manage documents for {currentEvaluation?.name || 'this evaluation'}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={loadDocuments}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowUploader(true)}
          >
            <Plus size={16} />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="documents-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <FileText size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.total}</span>
              <span className="summary-label">Total Documents</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">
              <Download size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.totalSizeFormatted}</span>
              <span className="summary-label">Total Size</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.byParseStatus?.complete || 0}</span>
              <span className="summary-label">Parsed</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon warning">
              <AlertCircle size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.byParseStatus?.pending || 0}</span>
              <span className="summary-label">Pending Parse</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <div className="modal-overlay">
          <div className="modal upload-modal">
            <div className="modal-header">
              <h2>
                <Upload size={20} />
                Upload Documents
              </h2>
              <button 
                className="modal-close"
                onClick={() => !uploading && setShowUploader(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <DocumentUploader
                onUpload={handleUpload}
                onCancel={() => setShowUploader(false)}
                uploading={uploading}
                progress={uploadProgress}
                multiple={true}
                maxFiles={10}
              />
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="documents-content">
        <DocumentList
          documents={documents}
          loading={loading}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onParse={handleParse}
          emptyMessage="No documents uploaded yet. Click 'Upload Documents' to add files."
        />
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        document={viewerDocument}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default DocumentsHub;
