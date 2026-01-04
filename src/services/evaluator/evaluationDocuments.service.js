/**
 * Evaluation Documents Service
 * 
 * Handles document upload, storage, and management for evaluation projects.
 * Supports file uploads to Supabase Storage with metadata tracking.
 * Includes placeholder for AI parsing (implemented in Phase 8).
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4C)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Document type definitions
 */
export const DOCUMENT_TYPES = {
  STRATEGY_DOC: 'strategy_doc',
  EXISTING_RFP: 'existing_rfp',
  REQUIREMENTS_DOC: 'requirements_doc',
  PROCESS_DOC: 'process_doc',
  TECHNICAL_SPEC: 'technical_spec',
  VENDOR_MATERIAL: 'vendor_material',
  MEETING_NOTES: 'meeting_notes',
  OTHER: 'other'
};

/**
 * Document type configuration for UI display
 */
export const DOCUMENT_TYPE_CONFIG = {
  [DOCUMENT_TYPES.STRATEGY_DOC]: {
    label: 'Strategy Document',
    description: 'Client strategy and vision documents',
    icon: 'FileText',
    color: 'blue'
  },
  [DOCUMENT_TYPES.EXISTING_RFP]: {
    label: 'Existing RFP',
    description: 'Previous RFP or tender documents',
    icon: 'FileQuestion',
    color: 'purple'
  },
  [DOCUMENT_TYPES.REQUIREMENTS_DOC]: {
    label: 'Requirements Document',
    description: 'Existing requirements documentation',
    icon: 'ClipboardList',
    color: 'green'
  },
  [DOCUMENT_TYPES.PROCESS_DOC]: {
    label: 'Process Document',
    description: 'Process or workflow documentation',
    icon: 'GitBranch',
    color: 'orange'
  },
  [DOCUMENT_TYPES.TECHNICAL_SPEC]: {
    label: 'Technical Specification',
    description: 'Technical specifications and architecture',
    icon: 'Code',
    color: 'gray'
  },
  [DOCUMENT_TYPES.VENDOR_MATERIAL]: {
    label: 'Vendor Material',
    description: 'Materials received from vendors',
    icon: 'Building',
    color: 'teal'
  },
  [DOCUMENT_TYPES.MEETING_NOTES]: {
    label: 'Meeting Notes',
    description: 'Meeting or workshop notes',
    icon: 'Users',
    color: 'pink'
  },
  [DOCUMENT_TYPES.OTHER]: {
    label: 'Other',
    description: 'Uncategorized documents',
    icon: 'File',
    color: 'slate'
  }
};

/**
 * Parse status definitions
 */
export const PARSE_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

/**
 * Parse status configuration for UI display
 */
export const PARSE_STATUS_CONFIG = {
  [PARSE_STATUSES.PENDING]: {
    label: 'Pending',
    description: 'Awaiting AI parsing',
    color: 'gray',
    icon: 'Clock'
  },
  [PARSE_STATUSES.PROCESSING]: {
    label: 'Processing',
    description: 'AI parsing in progress',
    color: 'blue',
    icon: 'Loader'
  },
  [PARSE_STATUSES.COMPLETE]: {
    label: 'Complete',
    description: 'AI parsing completed',
    color: 'green',
    icon: 'CheckCircle'
  },
  [PARSE_STATUSES.FAILED]: {
    label: 'Failed',
    description: 'AI parsing failed',
    color: 'red',
    icon: 'XCircle'
  },
  [PARSE_STATUSES.SKIPPED]: {
    label: 'Skipped',
    description: 'Parsing skipped',
    color: 'slate',
    icon: 'MinusCircle'
  }
};

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': { ext: 'pdf', maxSize: 50 * 1024 * 1024 }, // 50MB
  'application/msword': { ext: 'doc', maxSize: 25 * 1024 * 1024 }, // 25MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', maxSize: 25 * 1024 * 1024 },
  'application/vnd.ms-excel': { ext: 'xls', maxSize: 25 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', maxSize: 25 * 1024 * 1024 },
  'application/vnd.ms-powerpoint': { ext: 'ppt', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', maxSize: 50 * 1024 * 1024 },
  // Text
  'text/plain': { ext: 'txt', maxSize: 10 * 1024 * 1024 },
  'text/csv': { ext: 'csv', maxSize: 10 * 1024 * 1024 },
  'text/markdown': { ext: 'md', maxSize: 10 * 1024 * 1024 },
  // Images (for diagrams, screenshots)
  'image/png': { ext: 'png', maxSize: 10 * 1024 * 1024 },
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024 },
  'image/gif': { ext: 'gif', maxSize: 10 * 1024 * 1024 }
};

/**
 * Storage bucket name for evaluation documents
 */
const STORAGE_BUCKET = 'evaluation-documents';

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class EvaluationDocumentsService extends EvaluatorBaseService {
  constructor() {
    super('evaluation_documents', {
      supportsSoftDelete: true,
      sanitizeConfig: 'evaluationDocument'
    });
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  /**
   * Get all documents for an evaluation project with uploader details
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          uploaded_by_profile:profiles!uploaded_by(id, full_name, email, avatar_url)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order(options.orderBy?.column || 'created_at', { 
          ascending: options.orderBy?.ascending ?? false 
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('EvaluationDocumentsService getAllWithDetails error:', error);
      throw error;
    }
  }

  /**
   * Get documents by type
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} documentType - Document type filter
   * @returns {Promise<Array>} Array of documents
   */
  async getByType(evaluationProjectId, documentType) {
    return this.getAll(evaluationProjectId, {
      filters: [{ column: 'document_type', operator: 'eq', value: documentType }],
      orderBy: { column: 'created_at', ascending: false }
    });
  }

  /**
   * Get documents by parse status
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} parseStatus - Parse status filter
   * @returns {Promise<Array>} Array of documents
   */
  async getByParseStatus(evaluationProjectId, parseStatus) {
    return this.getAll(evaluationProjectId, {
      filters: [{ column: 'parse_status', operator: 'eq', value: parseStatus }],
      orderBy: { column: 'created_at', ascending: false }
    });
  }

  /**
   * Get documents pending AI parsing
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of documents
   */
  async getPendingParse(evaluationProjectId) {
    return this.getByParseStatus(evaluationProjectId, PARSE_STATUSES.PENDING);
  }

  /**
   * Get document summary/counts for dashboard
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(evaluationProjectId) {
    try {
      const documents = await this.getAll(evaluationProjectId);
      
      // Count by type
      const byType = {};
      Object.values(DOCUMENT_TYPES).forEach(type => {
        byType[type] = documents.filter(d => d.document_type === type).length;
      });

      // Count by parse status
      const byParseStatus = {};
      Object.values(PARSE_STATUSES).forEach(status => {
        byParseStatus[status] = documents.filter(d => d.parse_status === status).length;
      });

      // Total size
      const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);

      return {
        total: documents.length,
        byType,
        byParseStatus,
        totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize)
      };
    } catch (error) {
      console.error('EvaluationDocumentsService getSummary error:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // FILE UPLOAD METHODS
  // --------------------------------------------------------------------------

  /**
   * Validate a file before upload
   * @param {File} file - File to validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateFile(file) {
    // Check if file type is allowed
    const typeConfig = ALLOWED_FILE_TYPES[file.type];
    if (!typeConfig) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: PDF, Word, Excel, PowerPoint, Text, CSV, Markdown, PNG, JPEG, GIF`
      };
    }

    // Check file size
    if (file.size > typeConfig.maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(typeConfig.maxSize)})`
      };
    }

    // Check file name length
    if (file.name.length > 255) {
      return {
        valid: false,
        error: 'File name is too long (max 255 characters)'
      };
    }

    return { valid: true };
  }

  /**
   * Generate a unique storage path for a file
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {File} file - File object
   * @returns {string} Storage path
   */
  generateStoragePath(evaluationProjectId, file) {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${evaluationProjectId}/${timestamp}-${sanitizedName}`;
  }

  /**
   * Upload a document file to storage and create database record
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata
   * @param {string} metadata.name - Display name for the document
   * @param {string} metadata.description - Document description
   * @param {string} metadata.document_type - Document type classification
   * @param {string} userId - User uploading the file
   * @returns {Promise<Object>} Created document record
   */
  async uploadDocument(evaluationProjectId, file, metadata, userId) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate storage path
      const filePath = this.generateStoragePath(evaluationProjectId, file);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL (or signed URL if bucket is private)
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl || filePath;

      // Create database record
      const documentRecord = {
        evaluation_project_id: evaluationProjectId,
        name: metadata.name || file.name,
        description: metadata.description || null,
        document_type: metadata.document_type || DOCUMENT_TYPES.OTHER,
        file_url: fileUrl,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        parse_status: PARSE_STATUSES.PENDING,
        uploaded_by: userId
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(documentRecord)
        .select(`
          *,
          uploaded_by_profile:profiles!uploaded_by(id, full_name, email, avatar_url)
        `);

      if (error) {
        // If database insert fails, try to clean up the uploaded file
        await this.deleteStorageFile(filePath);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('EvaluationDocumentsService uploadDocument error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple documents
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Array<{file: File, metadata: Object}>} uploads - Array of file/metadata pairs
   * @param {string} userId - User uploading the files
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} Results { successful: [], failed: [] }
   */
  async uploadMultipleDocuments(evaluationProjectId, uploads, userId, onProgress = null) {
    const results = {
      successful: [],
      failed: []
    };

    for (let i = 0; i < uploads.length; i++) {
      const { file, metadata } = uploads[i];
      
      try {
        const document = await this.uploadDocument(evaluationProjectId, file, metadata, userId);
        results.successful.push({ file: file.name, document });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: uploads.length,
            file: file.name,
            status: 'success'
          });
        }
      } catch (error) {
        results.failed.push({ file: file.name, error: error.message });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: uploads.length,
            file: file.name,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // FILE DOWNLOAD/PREVIEW METHODS
  // --------------------------------------------------------------------------

  /**
   * Get a signed URL for downloading a document
   * @param {string} filePath - Storage path of the file
   * @param {number} expiresIn - URL expiration in seconds (default 1 hour)
   * @returns {Promise<string>} Signed URL
   */
  async getDownloadUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data?.signedUrl;
    } catch (error) {
      console.error('EvaluationDocumentsService getDownloadUrl error:', error);
      throw error;
    }
  }

  /**
   * Download a document file as blob
   * @param {string} filePath - Storage path of the file
   * @returns {Promise<Blob>} File blob
   */
  async downloadFile(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('EvaluationDocumentsService downloadFile error:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists in storage
   * @param {string} filePath - Storage path of the file
   * @returns {Promise<boolean>} Exists status
   */
  async fileExists(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) return false;
      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // DOCUMENT UPDATE & DELETE METHODS
  // --------------------------------------------------------------------------

  /**
   * Update document metadata
   * @param {string} documentId - Document UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated document
   */
  async updateMetadata(documentId, updates) {
    // Only allow updating certain fields
    const allowedFields = ['name', 'description', 'document_type'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return this.update(documentId, filteredUpdates);
  }

  /**
   * Delete storage file
   * @param {string} filePath - Storage path of the file
   * @returns {Promise<boolean>} Success status
   */
  async deleteStorageFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('EvaluationDocumentsService deleteStorageFile error:', error);
      return false;
    }
  }

  /**
   * Delete document (soft delete record, optionally delete storage file)
   * @param {string} documentId - Document UUID
   * @param {string} userId - User performing the delete
   * @param {boolean} deleteFile - Whether to delete the storage file (default false)
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(documentId, userId, deleteFile = false) {
    try {
      // Get document first to get file path
      const document = await this.getById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Optionally delete storage file
      if (deleteFile && document.file_path) {
        await this.deleteStorageFile(document.file_path);
      }

      // Soft delete the record
      return this.delete(documentId, userId);
    } catch (error) {
      console.error('EvaluationDocumentsService deleteDocument error:', error);
      throw error;
    }
  }

  /**
   * Hard delete document and storage file
   * @param {string} documentId - Document UUID
   * @returns {Promise<boolean>} Success status
   */
  async hardDeleteDocument(documentId) {
    try {
      // Get document first to get file path
      const document = await this.getById(documentId, { includeDeleted: true });
      if (!document) {
        return true; // Already doesn't exist
      }

      // Delete storage file
      if (document.file_path) {
        await this.deleteStorageFile(document.file_path);
      }

      // Hard delete the record
      return this.hardDelete(documentId);
    } catch (error) {
      console.error('EvaluationDocumentsService hardDeleteDocument error:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // AI PARSING METHODS (Placeholder for Phase 8)
  // --------------------------------------------------------------------------

  /**
   * Queue document for AI parsing
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object>} Updated document
   */
  async queueForParsing(documentId) {
    return this.update(documentId, {
      parse_status: PARSE_STATUSES.PENDING
    });
  }

  /**
   * Skip AI parsing for a document
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object>} Updated document
   */
  async skipParsing(documentId) {
    return this.update(documentId, {
      parse_status: PARSE_STATUSES.SKIPPED
    });
  }

  /**
   * Update parse status (called by AI parsing job)
   * @param {string} documentId - Document UUID
   * @param {string} status - New parse status
   * @param {Object} results - Parse results (for complete status)
   * @param {string} error - Error message (for failed status)
   * @returns {Promise<Object>} Updated document
   */
  async updateParseStatus(documentId, status, results = null, error = null) {
    const updates = {
      parse_status: status
    };

    if (status === PARSE_STATUSES.COMPLETE) {
      updates.parsed_at = new Date().toISOString();
      updates.parse_results = results;
      updates.parse_error = null;
    } else if (status === PARSE_STATUSES.FAILED) {
      updates.parse_error = error;
    }

    // Use raw update to bypass sanitization for JSONB fields
    const { data, error: updateError } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', documentId)
      .select();

    if (updateError) throw updateError;
    return data?.[0];
  }

  /**
   * Get parsed requirements from a document
   * @param {string} documentId - Document UUID
   * @returns {Promise<Array>} Extracted requirements (from parse_results)
   */
  async getParsedRequirements(documentId) {
    const document = await this.getById(documentId);
    if (!document || !document.parse_results) {
      return [];
    }

    return document.parse_results.requirements || [];
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from mime type
   * @param {string} mimeType - MIME type
   * @returns {string|null} File extension
   */
  getExtensionFromMimeType(mimeType) {
    return ALLOWED_FILE_TYPES[mimeType]?.ext || null;
  }

  /**
   * Check if mime type is allowed
   * @param {string} mimeType - MIME type
   * @returns {boolean} Is allowed
   */
  isAllowedMimeType(mimeType) {
    return mimeType in ALLOWED_FILE_TYPES;
  }

  /**
   * Get icon name for a document based on mime type
   * @param {string} mimeType - MIME type
   * @returns {string} Icon name
   */
  getDocumentIcon(mimeType) {
    if (mimeType?.startsWith('image/')) return 'Image';
    if (mimeType === 'application/pdf') return 'FileText';
    if (mimeType?.includes('word')) return 'FileText';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'FileSpreadsheet';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'Presentation';
    if (mimeType?.startsWith('text/')) return 'FileText';
    return 'File';
  }

  /**
   * Check if document can be previewed in browser
   * @param {string} mimeType - MIME type
   * @returns {boolean} Can preview
   */
  canPreview(mimeType) {
    const previewableTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'text/plain',
      'text/csv',
      'text/markdown'
    ];
    return previewableTypes.includes(mimeType);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const evaluationDocumentsService = new EvaluationDocumentsService();
export default evaluationDocumentsService;
