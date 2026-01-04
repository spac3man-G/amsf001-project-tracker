/**
 * Documents Hub Page
 * 
 * Main page for managing evaluation documents.
 * Provides document upload, viewing, and management functionality.
 * Includes AI-powered document parsing for requirements extraction.
 * 
 * @version 1.1
 * @created 01 January 2026
 * @updated 04 January 2026 - Added AI parsing (Phase 8A)
 * @phase Phase 4 - Input Capture (Session 4C), Phase 8A - AI Features
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
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  evaluationDocumentsService,
  DOCUMENT_TYPE_CONFIG,
  aiService,
  evaluationCategoriesService
} from '../../services/evaluator';
import { 
  DocumentUploader, 
  DocumentList,
  DocumentViewer,
  ParsedRequirementsReview
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

  // AI Parsing state (Phase 8A)
  const [parsingDocumentId, setParsingDocumentId] = useState(null);
  const [parseResults, setParseResults] = useState(null);
  const [showParseReview, setShowParseReview] = useState(false);
  const [parseDocumentName, setParseDocumentName] = useState('');
  const [categories, setCategories] = useState([]);

  // --------------------------------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------------------------------

  const loadDocuments = useCallback(async () => {
    if (!evaluationId) return;
    
    setLoading(true);
    try {
      const [docs, sum, cats] = await Promise.all([
        evaluationDocumentsService.getAllWithDetails(evaluationId),
        evaluationDocumentsService.getSummary(evaluationId),
        evaluationCategoriesService.getAll(evaluationId)
      ]);
      setDocuments(docs);
      setSummary(sum);
      setCategories(cats);
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
    if (!evaluationId || !user?.id) return;
    
    setParsingDocumentId(document.id);
    setParseDocumentName(document.name);
    
    try {
      const result = await aiService.parseDocument(
        document.id,
        evaluationId,
        user.id,
        document.name
      );
      
      if (result.success) {
        setParseResults(result);
        setShowParseReview(true);
        showSuccess(`Extracted ${result.requirements?.length || 0} requirements from document`);
      } else {
        throw new Error(result.error || 'Failed to parse document');
      }
    } catch (error) {
      console.error('Parse error:', error);
      showError(error.message || 'Failed to parse document');
    } finally {
      setParsingDocumentId(null);
    }
  }, [evaluationId, user?.id, showSuccess, showError]);

  const handleImportRequirements = useCallback(async (requirements) => {
    if (!evaluationId || !user?.id || !parseResults?.documentId) return;
    
    try {
      const result = await aiService.importParsedRequirements(
        evaluationId,
        user.id,
        requirements,
        parseResults.documentId,
        categories
      );
      
      showSuccess(`Successfully imported ${result.imported} requirements`);
      
      // Refresh documents to update parse status
      await loadDocuments();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      showError(error.message || 'Failed to import requirements');
      throw error;
    }
  }, [evaluationId, user?.id, parseResults?.documentId, categories, loadDocuments, showSuccess, showError]);

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
          parsingDocumentId={parsingDocumentId}
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

      {/* AI Parsed Requirements Review Modal */}
      <ParsedRequirementsReview
        isOpen={showParseReview}
        onClose={() => {
          setShowParseReview(false);
          setParseResults(null);
        }}
        parseResults={parseResults}
        documentName={parseDocumentName}
        categories={categories}
        onImport={handleImportRequirements}
      />
    </div>
  );
}

export default DocumentsHub;
