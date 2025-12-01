/**
 * ReceiptScanner Component
 * 
 * Smart receipt scanning with AI-powered data extraction and classification.
 * Supports batch scanning - upload multiple receipts at once.
 * 
 * @version 2.0
 * @updated 2 December 2025
 * @phase Phase 2 - Smart Receipt Scanner
 * 
 * Features:
 * - Multi-file upload support
 * - Batch AI processing with progress
 * - Step-through review interface
 * - Individual expense submission
 * - Learning from user corrections
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  Receipt, Sparkles, RotateCcw, ChevronLeft, ChevronRight,
  Car, Home, Utensils, HelpCircle, Trash2, ImageIcon
} from 'lucide-react';
import { receiptScannerService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import './ReceiptScanner.css';

// Category configuration
const CATEGORIES = [
  { id: 'Travel', label: 'Travel', icon: Car, color: '#2563eb', bg: '#dbeafe' },
  { id: 'Accommodation', label: 'Accommodation', icon: Home, color: '#7c3aed', bg: '#f3e8ff' },
  { id: 'Sustenance', label: 'Sustenance', icon: Utensils, color: '#ea580c', bg: '#ffedd5' }
];

// Receipt status
const RECEIPT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READY: 'ready',
  SUBMITTED: 'submitted',
  ERROR: 'error'
};

// Processing steps
const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  REVIEW: 'review'
};

export default function ReceiptScanner({ 
  onExpenseCreated, 
  onCancel,
  resources = [],
  defaultResourceId = null
}) {
  const { user } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Main state
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [receipts, setReceipts] = useState([]); // Array of receipt objects
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Get current receipt being reviewed
  const currentReceipt = receipts[currentIndex];
  
  // Count receipts by status
  const readyCount = receipts.filter(r => r.status === RECEIPT_STATUS.READY).length;
  const submittedCount = receipts.filter(r => r.status === RECEIPT_STATUS.SUBMITTED).length;
  const pendingCount = receipts.filter(r => r.status === RECEIPT_STATUS.PENDING || r.status === RECEIPT_STATUS.PROCESSING).length;

  // =====================================================
  // HELPERS
  // =====================================================

  // Compress image to reduce payload size (max 1500px, quality 0.8)
  const compressImage = (file, maxSize = 1500, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fileToBase64 = async (file) => {
    // Compress image first to avoid 413 Payload Too Large errors
    const compressedBlob = await compressImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          data: reader.result.split(',')[1],
          mediaType: 'image/jpeg', // Always JPEG after compression
          preview: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(compressedBlob);
    });
  };

  const createReceiptObject = (file, preview) => ({
    id: `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    preview,
    status: RECEIPT_STATUS.PENDING,
    scanResult: null,
    scanId: null,
    imageUrl: null,
    formData: {
      merchant: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      resource_id: defaultResourceId || '',
      reason: '',
      chargeable: true,
      procurement: 'supplier',
      notes: ''
    },
    wasEdited: false
  });

  // =====================================================
  // FILE HANDLING
  // =====================================================

  const handleFileSelect = useCallback(async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    const validFiles = [];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showWarning(`Skipped ${file.name} - invalid file type`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        showWarning(`Skipped ${file.name} - file too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create receipt objects with previews
    const newReceipts = await Promise.all(
      validFiles.map(async (file) => {
        const { preview } = await fileToBase64(file);
        return createReceiptObject(file, preview);
      })
    );

    setReceipts(prev => [...prev, ...newReceipts]);
    showInfo(`Added ${newReceipts.length} receipt${newReceipts.length > 1 ? 's' : ''}`);
  }, [showWarning, showInfo, defaultResourceId]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const removeReceipt = useCallback((id) => {
    setReceipts(prev => {
      const newReceipts = prev.filter(r => r.id !== id);
      if (currentIndex >= newReceipts.length && newReceipts.length > 0) {
        setCurrentIndex(newReceipts.length - 1);
      }
      return newReceipts;
    });
  }, [currentIndex]);

  const clearAllReceipts = useCallback(() => {
    setReceipts([]);
    setCurrentIndex(0);
    setCurrentStep(STEPS.UPLOAD);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // =====================================================
  // BATCH PROCESSING
  // =====================================================

  const processAllReceipts = useCallback(async () => {
    if (receipts.length === 0 || !projectId || !user?.id) {
      showError('No receipts to process');
      return;
    }

    setCurrentStep(STEPS.PROCESSING);
    setProcessingProgress({ current: 0, total: receipts.length });

    const updatedReceipts = [...receipts];

    for (let i = 0; i < updatedReceipts.length; i++) {
      const receipt = updatedReceipts[i];
      
      // Skip already processed
      if (receipt.status === RECEIPT_STATUS.READY || receipt.status === RECEIPT_STATUS.SUBMITTED) {
        setProcessingProgress({ current: i + 1, total: receipts.length });
        continue;
      }

      // Update status to processing
      updatedReceipts[i] = { ...receipt, status: RECEIPT_STATUS.PROCESSING };
      setReceipts([...updatedReceipts]);

      try {
        // Convert to base64
        const imageData = await fileToBase64(receipt.file);
        
        // Upload image
        const { path, url } = await receiptScannerService.uploadImage(receipt.file, user.id);
        
        // Process with AI
        const result = await receiptScannerService.processReceipt(imageData, projectId);
        
        // Save scan record
        const scan = await receiptScannerService.createScan({
          projectId,
          userId: user.id,
          imageUrl: url,
          imagePath: path,
          ...result
        });

        // Update receipt with results
        updatedReceipts[i] = {
          ...updatedReceipts[i],
          status: RECEIPT_STATUS.READY,
          scanResult: result,
          scanId: scan.id,
          imageUrl: url,
          formData: {
            ...updatedReceipts[i].formData,
            merchant: result.merchant || '',
            amount: result.amount?.toString() || '',
            date: result.date || new Date().toISOString().split('T')[0],
            category: result.suggestedCategory || '',
            reason: result.merchant ? `Receipt from ${result.merchant}` : ''
          }
        };

      } catch (error) {
        console.error(`Error processing receipt ${i + 1}:`, error);
        updatedReceipts[i] = {
          ...updatedReceipts[i],
          status: RECEIPT_STATUS.ERROR,
          error: error.message
        };
      }

      setReceipts([...updatedReceipts]);
      setProcessingProgress({ current: i + 1, total: receipts.length });
    }

    // Move to review step
    setCurrentStep(STEPS.REVIEW);
    
    // Find first receipt that needs review
    const firstReadyIndex = updatedReceipts.findIndex(r => r.status === RECEIPT_STATUS.READY);
    if (firstReadyIndex >= 0) {
      setCurrentIndex(firstReadyIndex);
    }

    const successCount = updatedReceipts.filter(r => r.status === RECEIPT_STATUS.READY).length;
    const errorCount = updatedReceipts.filter(r => r.status === RECEIPT_STATUS.ERROR).length;
    
    if (errorCount > 0) {
      showWarning(`Processed ${successCount} receipts, ${errorCount} failed`);
    } else {
      showSuccess(`Successfully scanned ${successCount} receipt${successCount > 1 ? 's' : ''}!`);
    }
  }, [receipts, projectId, user, showError, showSuccess, showWarning]);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const updateCurrentReceipt = useCallback((field, value) => {
    setReceipts(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        formData: {
          ...updated[currentIndex].formData,
          [field]: value
        },
        wasEdited: true
      };
      return updated;
    });
  }, [currentIndex]);

  const selectCategory = useCallback((categoryId) => {
    updateCurrentReceipt('category', categoryId);
  }, [updateCurrentReceipt]);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToReceipt = useCallback((index) => {
    if (index >= 0 && index < receipts.length) {
      setCurrentIndex(index);
    }
  }, [receipts.length]);

  const goToPrevious = useCallback(() => {
    // Find previous receipt that's ready for review
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (receipts[i].status === RECEIPT_STATUS.READY) {
        setCurrentIndex(i);
        return;
      }
    }
  }, [currentIndex, receipts]);

  const goToNext = useCallback(() => {
    // Find next receipt that's ready for review
    for (let i = currentIndex + 1; i < receipts.length; i++) {
      if (receipts[i].status === RECEIPT_STATUS.READY) {
        setCurrentIndex(i);
        return;
      }
    }
  }, [currentIndex, receipts]);

  const hasPrevious = receipts.slice(0, currentIndex).some(r => r.status === RECEIPT_STATUS.READY);
  const hasNext = receipts.slice(currentIndex + 1).some(r => r.status === RECEIPT_STATUS.READY);

  // =====================================================
  // SUBMISSION
  // =====================================================

  const submitCurrentReceipt = useCallback(async () => {
    const receipt = currentReceipt;
    if (!receipt || receipt.status !== RECEIPT_STATUS.READY) return;

    const { formData } = receipt;

    // Validation
    if (!formData.resource_id) {
      showWarning('Please select a resource');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showWarning('Please enter a valid amount');
      return;
    }
    if (!formData.category) {
      showWarning('Please select a category');
      return;
    }
    if (!formData.reason) {
      showWarning('Please enter a reason/description');
      return;
    }

    try {
      // Learn from user's category selection
      if (formData.merchant && formData.category) {
        const wasCorrection = receipt.wasEdited && receipt.scanResult?.suggestedCategory !== formData.category;
        await receiptScannerService.learnFromCorrection(
          projectId,
          formData.merchant,
          formData.category,
          user.id,
          wasCorrection
        );
      }

      // Update scan with final classification
      if (receipt.scanId) {
        await receiptScannerService.updateScanClassification(
          receipt.scanId,
          formData.category,
          receipt.wasEdited
        );
      }

      // Prepare expense data
      const expenseData = {
        category: formData.category,
        resource_id: formData.resource_id,
        resource_name: resources.find(r => r.id === formData.resource_id)?.name,
        expense_date: formData.date,
        reason: formData.reason,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        chargeable_to_customer: formData.chargeable,
        procurement_method: formData.procurement,
        receipt_scan_id: receipt.scanId,
        receipt_image_url: receipt.imageUrl
      };

      // Mark as submitted
      setReceipts(prev => {
        const updated = [...prev];
        updated[currentIndex] = { ...updated[currentIndex], status: RECEIPT_STATUS.SUBMITTED };
        return updated;
      });

      // Callback to parent
      if (onExpenseCreated) {
        onExpenseCreated(expenseData);
      }

      showSuccess(`Expense created: ${formData.merchant || 'Receipt'} - £${formData.amount}`);

      // Auto-advance to next unsubmitted receipt
      const nextReadyIndex = receipts.findIndex((r, i) => 
        i > currentIndex && r.status === RECEIPT_STATUS.READY
      );
      if (nextReadyIndex >= 0) {
        setCurrentIndex(nextReadyIndex);
      }

    } catch (error) {
      console.error('Error submitting expense:', error);
      showError('Failed to create expense: ' + error.message);
    }
  }, [currentReceipt, currentIndex, receipts, projectId, user, resources, onExpenseCreated, showSuccess, showError, showWarning]);

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderConfidenceBadge = (confidence) => {
    if (!confidence) return null;
    
    let color, label;
    if (confidence >= 0.8) {
      color = '#10b981';
      label = 'High';
    } else if (confidence >= 0.5) {
      color = '#f59e0b';
      label = 'Medium';
    } else {
      color = '#ef4444';
      label = 'Low';
    }

    return (
      <div className="confidence-badge" style={{ color, borderColor: color }}>
        <Sparkles size={14} />
        {label} confidence ({Math.round(confidence * 100)}%)
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case RECEIPT_STATUS.PENDING:
        return <div className="status-dot pending" />;
      case RECEIPT_STATUS.PROCESSING:
        return <Loader2 size={14} className="spinner" />;
      case RECEIPT_STATUS.READY:
        return <div className="status-dot ready" />;
      case RECEIPT_STATUS.SUBMITTED:
        return <Check size={14} className="status-check" />;
      case RECEIPT_STATUS.ERROR:
        return <AlertCircle size={14} className="status-error" />;
      default:
        return null;
    }
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="receipt-scanner batch-mode">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title">
          <Receipt size={24} />
          <div>
            <h3>Smart Receipt Scanner</h3>
            <p>
              {currentStep === STEPS.UPLOAD && 'Upload one or more receipt photos'}
              {currentStep === STEPS.PROCESSING && `Processing ${processingProgress.current} of ${processingProgress.total}...`}
              {currentStep === STEPS.REVIEW && `Reviewing ${currentIndex + 1} of ${receipts.length} receipts`}
            </p>
          </div>
        </div>
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="scanner-steps">
        <div className={`step ${currentStep === STEPS.UPLOAD ? 'active' : currentStep !== STEPS.UPLOAD ? 'complete' : ''}`}>
          <div className="step-dot">1</div>
          <span>Upload</span>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep === STEPS.PROCESSING ? 'active' : currentStep === STEPS.REVIEW ? 'complete' : ''}`}>
          <div className="step-dot">2</div>
          <span>Scan All</span>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep === STEPS.REVIEW ? 'active' : ''}`}>
          <div className="step-dot">3</div>
          <span>Review</span>
        </div>
      </div>

      <div className="scanner-content">
        
        {/* STEP 1: Upload */}
        {currentStep === STEPS.UPLOAD && (
          <div className="upload-section">
            <div 
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="drop-icon" />
              <p className="drop-text">Drag & drop receipt images</p>
              <p className="drop-subtext">or click to browse (select multiple)</p>
              
              <div className="upload-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={18} /> Choose Files
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera size={18} /> Take Photo
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Queued receipts */}
            {receipts.length > 0 && (
              <div className="receipt-queue">
                <div className="queue-header">
                  <h4><ImageIcon size={18} /> {receipts.length} Receipt{receipts.length > 1 ? 's' : ''} Ready</h4>
                  <button className="btn btn-ghost btn-sm" onClick={clearAllReceipts}>
                    <Trash2 size={16} /> Clear All
                  </button>
                </div>
                <div className="queue-grid">
                  {receipts.map((receipt, index) => (
                    <div key={receipt.id} className="queue-item">
                      <img src={receipt.preview} alt={`Receipt ${index + 1}`} />
                      <button 
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReceipt(receipt.id);
                        }}
                      >
                        <X size={14} />
                      </button>
                      <span className="queue-number">{index + 1}</span>
                    </div>
                  ))}
                  <div 
                    className="queue-item add-more"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} />
                    <span>Add More</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary btn-lg scan-all-btn"
                  onClick={processAllReceipts}
                >
                  <Sparkles size={20} /> Scan All {receipts.length} Receipt{receipts.length > 1 ? 's' : ''}
                </button>
              </div>
            )}

            <div className="scanner-tips">
              <h4><HelpCircle size={16} /> Tips for best results</h4>
              <ul>
                <li>Ensure receipts are flat and well-lit</li>
                <li>Include the full receipt in frame</li>
                <li>Avoid shadows and glare</li>
                <li>You can select multiple files at once</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Processing */}
        {currentStep === STEPS.PROCESSING && (
          <div className="processing-section batch-processing">
            <div className="processing-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                Processing receipt {processingProgress.current} of {processingProgress.total}
              </span>
            </div>

            <div className="processing-grid">
              {receipts.map((receipt, index) => (
                <div 
                  key={receipt.id} 
                  className={`processing-item ${receipt.status}`}
                >
                  <img src={receipt.preview} alt={`Receipt ${index + 1}`} />
                  <div className="processing-overlay">
                    {receipt.status === RECEIPT_STATUS.PROCESSING && (
                      <Loader2 size={24} className="spinner" />
                    )}
                    {receipt.status === RECEIPT_STATUS.READY && (
                      <Check size={24} className="success-icon" />
                    )}
                    {receipt.status === RECEIPT_STATUS.ERROR && (
                      <AlertCircle size={24} className="error-icon" />
                    )}
                  </div>
                  <span className="item-number">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {currentStep === STEPS.REVIEW && currentReceipt && (
          <div className="review-section batch-review">
            {/* Receipt sidebar */}
            <div className="receipt-sidebar">
              <div className="sidebar-header">
                <h4>Receipts</h4>
                <span className="sidebar-count">
                  {submittedCount}/{receipts.length} submitted
                </span>
              </div>
              <div className="sidebar-list">
                {receipts.map((receipt, index) => (
                  <div
                    key={receipt.id}
                    className={`sidebar-item ${index === currentIndex ? 'active' : ''} ${receipt.status}`}
                    onClick={() => receipt.status === RECEIPT_STATUS.READY && goToReceipt(index)}
                  >
                    <img src={receipt.preview} alt={`Receipt ${index + 1}`} />
                    <div className="sidebar-item-info">
                      <span className="item-merchant">
                        {receipt.formData.merchant || `Receipt ${index + 1}`}
                      </span>
                      <span className="item-amount">
                        {receipt.formData.amount ? `£${receipt.formData.amount}` : '—'}
                      </span>
                    </div>
                    <div className="sidebar-item-status">
                      {getStatusIcon(receipt.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main review panel */}
            <div className="review-main">
              {currentReceipt.status === RECEIPT_STATUS.READY ? (
                <>
                  {/* Header with navigation */}
                  <div className="review-header">
                    <button 
                      className="btn btn-ghost"
                      onClick={goToPrevious}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft size={20} /> Previous
                    </button>
                    <div className="review-position">
                      Receipt {currentIndex + 1} of {receipts.length}
                    </div>
                    <button 
                      className="btn btn-ghost"
                      onClick={goToNext}
                      disabled={!hasNext}
                    >
                      Next <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Extraction summary */}
                  <div className="extraction-summary">
                    <div className="summary-header">
                      <h4>Extracted Information</h4>
                      {renderConfidenceBadge(currentReceipt.scanResult?.confidence)}
                    </div>
                    {currentReceipt.scanResult?.ruleBasedClassification && (
                      <div className="rule-notice">
                        <Sparkles size={14} />
                        Category auto-selected based on previous receipts
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <div className="review-form">
                    <div className="form-group">
                      <label className="form-label">Resource *</label>
                      <select
                        className="form-input"
                        value={currentReceipt.formData.resource_id}
                        onChange={(e) => updateCurrentReceipt('resource_id', e.target.value)}
                      >
                        <option value="">Select resource...</option>
                        {resources.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <div className="category-selector">
                        {CATEGORIES.map(cat => {
                          const Icon = cat.icon;
                          const isSelected = currentReceipt.formData.category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={`category-btn ${isSelected ? 'selected' : ''}`}
                              style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                              onClick={() => selectCategory(cat.id)}
                            >
                              <Icon size={20} />
                              {cat.label}
                              {isSelected && <Check size={16} className="check-icon" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Merchant</label>
                        <input
                          type="text"
                          className="form-input"
                          value={currentReceipt.formData.merchant}
                          onChange={(e) => updateCurrentReceipt('merchant', e.target.value)}
                          placeholder="Store/vendor name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (£) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={currentReceipt.formData.amount}
                          onChange={(e) => updateCurrentReceipt('amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={currentReceipt.formData.date}
                          onChange={(e) => updateCurrentReceipt('date', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Reason/Description *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={currentReceipt.formData.reason}
                          onChange={(e) => updateCurrentReceipt('reason', e.target.value)}
                          placeholder="Brief description of expense"
                        />
                      </div>
                    </div>

                    <div className="form-row options-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={currentReceipt.formData.chargeable}
                          onChange={(e) => updateCurrentReceipt('chargeable', e.target.checked)}
                        />
                        <span>Chargeable to Customer</span>
                      </label>
                      <div className="procurement-toggle">
                        <span>Paid by:</span>
                        <select
                          className="form-input-sm"
                          value={currentReceipt.formData.procurement}
                          onChange={(e) => updateCurrentReceipt('procurement', e.target.value)}
                        >
                          <option value="supplier">Supplier (JT)</option>
                          <option value="partner">Partner</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Additional Notes</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={currentReceipt.formData.notes}
                        onChange={(e) => updateCurrentReceipt('notes', e.target.value)}
                        placeholder="Any additional information..."
                      />
                    </div>
                  </div>

                  {/* Receipt thumbnail */}
                  <div className="receipt-thumbnail">
                    <img src={currentReceipt.preview} alt="Receipt" />
                    <span>Receipt attached</span>
                  </div>

                  {/* Actions */}
                  <div className="review-actions">
                    <button className="btn btn-secondary" onClick={() => setCurrentStep(STEPS.UPLOAD)}>
                      <RotateCcw size={18} /> Back to Upload
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={submitCurrentReceipt}>
                      <Check size={18} /> Submit Expense
                      {hasNext && ' & Next'}
                    </button>
                  </div>
                </>
              ) : currentReceipt.status === RECEIPT_STATUS.SUBMITTED ? (
                <div className="submitted-message">
                  <div className="success-icon-large">
                    <Check size={48} />
                  </div>
                  <h3>Expense Submitted</h3>
                  <p>{currentReceipt.formData.merchant} - £{currentReceipt.formData.amount}</p>
                  {hasNext && (
                    <button className="btn btn-primary" onClick={goToNext}>
                      Review Next Receipt <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              ) : currentReceipt.status === RECEIPT_STATUS.ERROR ? (
                <div className="error-message">
                  <AlertCircle size={48} className="error-icon" />
                  <h3>Processing Failed</h3>
                  <p>{currentReceipt.error || 'Unable to process this receipt'}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* All done state */}
        {currentStep === STEPS.REVIEW && submittedCount === receipts.length && receipts.length > 0 && (
          <div className="complete-section">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>All Receipts Submitted!</h3>
            <p>{submittedCount} expense{submittedCount > 1 ? 's' : ''} created successfully.</p>
            
            <div className="complete-actions">
              <button className="btn btn-primary" onClick={clearAllReceipts}>
                <Camera size={18} /> Scan More Receipts
              </button>
              {onCancel && (
                <button className="btn btn-secondary" onClick={onCancel}>
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
