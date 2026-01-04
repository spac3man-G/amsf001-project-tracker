/**
 * VendorDocumentUploader Component
 * 
 * Enhanced document upload interface for vendor portal with categorization,
 * required document indicators, and document management.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.6)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  File,
  FileText,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  FolderOpen
} from 'lucide-react';
import './VendorDocumentUploader.css';

/**
 * Document category configuration
 */
export const DOCUMENT_CATEGORIES = {
  technical: { 
    label: 'Technical', 
    color: '#3b82f6', 
    bgColor: '#eff6ff',
    description: 'Technical specifications, architecture docs, API documentation'
  },
  financial: { 
    label: 'Financial', 
    color: '#10b981', 
    bgColor: '#d1fae5',
    description: 'Pricing proposals, cost breakdowns, financial statements'
  },
  legal: { 
    label: 'Legal', 
    color: '#8b5cf6', 
    bgColor: '#ede9fe',
    description: 'Contracts, terms of service, legal agreements'
  },
  reference: { 
    label: 'Reference', 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    description: 'Case studies, customer references, testimonials'
  },
  security: { 
    label: 'Security', 
    color: '#ef4444', 
    bgColor: '#fee2e2',
    description: 'Security certifications, compliance docs, audits'
  },
  compliance: { 
    label: 'Compliance', 
    color: '#06b6d4', 
    bgColor: '#cffafe',
    description: 'Regulatory compliance, industry certifications'
  },
  proposal: { 
    label: 'Proposal', 
    color: '#ec4899', 
    bgColor: '#fce7f3',
    description: 'RFP responses, proposals, executive summaries'
  },
  other: { 
    label: 'Other', 
    color: '#6b7280', 
    bgColor: '#f3f4f6',
    description: 'Other supporting documents'
  }
};

/**
 * Required document types
 */
export const REQUIRED_DOCUMENTS = [
  { category: 'proposal', label: 'Executive Summary' },
  { category: 'technical', label: 'Technical Architecture' },
  { category: 'financial', label: 'Pricing Proposal' }
];

/**
 * VendorDocumentUploader - Main component
 */
function VendorDocumentUploader({ 
  vendorId,
  documents = [],
  onUpload,
  onDelete,
  onCategoryChange,
  requiredCategories = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [categoryModal, setCategoryModal] = useState(null);
  const fileInputRef = useRef(null);

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(doc);
    return acc;
  }, {});

  // Check required documents
  const missingRequired = requiredCategories.filter(cat => 
    !documentsByCategory[cat] || documentsByCategory[cat].length === 0
  );

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Add to uploading list
      const uploadId = `upload-${Date.now()}-${file.name}`;
      setUploadingFiles(prev => [...prev, { 
        id: uploadId, 
        name: file.name, 
        progress: 0 
      }]);

      try {
        // Call upload handler with default category
        await onUpload?.(file, 'other');
        
        // Remove from uploading list
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
      }
    }
  }, [onUpload]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Handle category selection for a document
  const handleCategorySelect = async (documentId, category) => {
    await onCategoryChange?.(documentId, category);
    setCategoryModal(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="vendor-document-uploader">
      {/* Upload Zone */}
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
        <Upload size={32} />
        <h4>Drop files here or click to upload</h4>
        <p>Supports PDF, Word, Excel, and common document formats</p>
      </div>

      {/* Uploading Progress */}
      {uploadingFiles.length > 0 && (
        <div className="uploading-list">
          {uploadingFiles.map(file => (
            <div key={file.id} className="uploading-item">
              <File size={16} />
              <span>{file.name}</span>
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Required Documents Warning */}
      {missingRequired.length > 0 && (
        <div className="required-warning">
          <AlertCircle size={18} />
          <div>
            <strong>Required documents missing:</strong>
            <span>{missingRequired.map(cat => DOCUMENT_CATEGORIES[cat]?.label).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Documents by Category */}
      <div className="document-categories">
        {Object.entries(DOCUMENT_CATEGORIES).map(([catKey, catConfig]) => {
          const catDocs = documentsByCategory[catKey] || [];
          const isRequired = requiredCategories.includes(catKey);
          
          if (catDocs.length === 0 && !isRequired) return null;

          return (
            <div key={catKey} className="document-category">
              <div className="category-header">
                <span 
                  className="category-badge"
                  style={{ 
                    color: catConfig.color, 
                    backgroundColor: catConfig.bgColor 
                  }}
                >
                  <FolderOpen size={14} />
                  {catConfig.label}
                </span>
                {isRequired && (
                  <span className={`required-badge ${catDocs.length > 0 ? 'fulfilled' : ''}`}>
                    {catDocs.length > 0 ? (
                      <>
                        <CheckCircle size={12} />
                        Required
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} />
                        Required
                      </>
                    )}
                  </span>
                )}
                <span className="category-count">{catDocs.length} file(s)</span>
              </div>

              {catDocs.length > 0 && (
                <div className="category-documents">
                  {catDocs.map(doc => (
                    <div key={doc.id} className="document-item">
                      <FileText size={18} />
                      <div className="document-info">
                        <span className="document-name">{doc.file_name || doc.name}</span>
                        <span className="document-meta">
                          {doc.file_size && formatFileSize(doc.file_size)}
                          {doc.uploaded_at && ` • ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                        </span>
                        {doc.notes && (
                          <p className="document-notes">{doc.notes}</p>
                        )}
                      </div>
                      <div className="document-actions">
                        <button 
                          className="action-btn category-btn"
                          onClick={() => setCategoryModal(doc.id)}
                          title="Change category"
                        >
                          <Tag size={14} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => onDelete?.(doc.id)}
                          title="Delete document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {catDocs.length === 0 && isRequired && (
                <div className="category-empty">
                  <p>No {catConfig.label.toLowerCase()} documents uploaded yet</p>
                  <button 
                    className="upload-btn-small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Selection Modal */}
      {categoryModal && (
        <div className="category-modal-overlay" onClick={() => setCategoryModal(null)}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Select Category</h4>
              <button onClick={() => setCategoryModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="category-options">
              {Object.entries(DOCUMENT_CATEGORIES).map(([catKey, catConfig]) => (
                <button
                  key={catKey}
                  className="category-option"
                  onClick={() => handleCategorySelect(categoryModal, catKey)}
                  style={{ borderLeftColor: catConfig.color }}
                >
                  <span className="option-label">{catConfig.label}</span>
                  <span className="option-desc">{catConfig.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDocumentUploader;
