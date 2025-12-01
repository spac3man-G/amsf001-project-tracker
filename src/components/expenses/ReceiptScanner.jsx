/**
 * ReceiptScanner Component
 * 
 * Smart receipt scanning with AI-powered data extraction and classification.
 * Provides an alternative expense entry method using receipt photos.
 * 
 * @version 1.0
 * @created 2 December 2025
 * @phase Phase 2 - Smart Receipt Scanner
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, X, Check, AlertCircle, Loader2,
  Receipt, Edit2, Sparkles, RotateCcw, ZoomIn,
  Car, Home, Utensils, HelpCircle, ChevronDown
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

// Processing steps
const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  REVIEW: 'review',
  COMPLETE: 'complete'
};

export default function ReceiptScanner({ 
  onExpenseCreated, 
  onCancel,
  resources = [],
  defaultResourceId = null
}) {
  const { user } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  
  // Component state
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanId, setScanId] = useState(null);
  
  // Form state for review/edit
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    resource_id: defaultResourceId || '',
    reason: '',
    chargeable: true,
    procurement: 'supplier',
    notes: ''
  });
  
  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // =====================================================
  // IMAGE HANDLING
  // =====================================================

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showError('Image too large. Maximum size is 10MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, [showError]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      // Simulate file input event
      handleFileSelect({ target: { files: [file] } });
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  // =====================================================
  // PROCESSING
  // =====================================================

  // Helper to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve({
          data: base64,
          mediaType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processReceipt = useCallback(async () => {
    if (!imageFile || !projectId || !user?.id) {
      showError('Missing required data for processing');
      return;
    }

    setCurrentStep(STEPS.PROCESSING);
    setIsProcessing(true);
    setProcessingMessage('Preparing image...');

    try {
      // Step 1: Convert file to base64 FIRST (before upload)
      const imageData = await fileToBase64(imageFile);
      
      // Step 2: Upload image to storage (for record keeping)
      setProcessingMessage('Uploading image...');
      const { path, url } = await receiptScannerService.uploadImage(imageFile, user.id);
      
      // Step 3: Process with AI using base64 data directly
      setProcessingMessage('Analyzing receipt with AI...');
      const result = await receiptScannerService.processReceipt(imageData, projectId);
      setProcessingMessage('Extracting data...');

      // Step 3: Save scan record
      const scan = await receiptScannerService.createScan({
        projectId,
        userId: user.id,
        imageUrl: url,
        imagePath: path,
        ...result
      });

      setScanId(scan.id);
      setScanResult(result);

      // Pre-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        merchant: result.merchant || '',
        amount: result.amount?.toString() || '',
        date: result.date || new Date().toISOString().split('T')[0],
        category: result.suggestedCategory || '',
        reason: result.merchant ? `Receipt from ${result.merchant}` : ''
      }));

      setCurrentStep(STEPS.REVIEW);
      
      if (result.confidence >= 0.8) {
        showSuccess('Receipt scanned successfully!');
      } else if (result.confidence >= 0.5) {
        showWarning('Receipt scanned - please verify the details');
      } else {
        showWarning('Could not extract all data - please fill in missing fields');
      }

    } catch (error) {
      console.error('Error processing receipt:', error);
      showError('Failed to process receipt: ' + error.message);
      setCurrentStep(STEPS.UPLOAD);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [imageFile, projectId, user, showError, showSuccess, showWarning]);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setWasEdited(true);
    
    // Track if category was changed from AI suggestion
    if (field === 'category' && value !== scanResult?.suggestedCategory) {
      setIsEditing(true);
    }
  }, [scanResult]);

  const selectCategory = useCallback((categoryId) => {
    handleFormChange('category', categoryId);
    setShowCategoryDropdown(false);
  }, [handleFormChange]);

  // =====================================================
  // SUBMISSION
  // =====================================================

  const handleSubmit = useCallback(async () => {
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
        const wasCorrection = isEditing && scanResult?.suggestedCategory !== formData.category;
        await receiptScannerService.learnFromCorrection(
          projectId,
          formData.merchant,
          formData.category,
          user.id,
          wasCorrection
        );
      }

      // Update scan with final classification
      if (scanId) {
        await receiptScannerService.updateScanClassification(
          scanId,
          formData.category,
          isEditing
        );
      }

      // Prepare expense data for parent component
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
        // Link to receipt scan
        receipt_scan_id: scanId,
        receipt_image_url: scanResult?.imageUrl
      };

      setCurrentStep(STEPS.COMPLETE);
      
      // Callback to parent to create expense
      if (onExpenseCreated) {
        onExpenseCreated(expenseData);
      }

      showSuccess('Expense created from receipt!');

    } catch (error) {
      console.error('Error submitting expense:', error);
      showError('Failed to create expense: ' + error.message);
    }
  }, [formData, scanId, scanResult, projectId, user, resources, isEditing, onExpenseCreated, showSuccess, showError, showWarning]);

  const handleReset = useCallback(() => {
    setCurrentStep(STEPS.UPLOAD);
    setImageFile(null);
    setImagePreview(null);
    setScanResult(null);
    setScanId(null);
    setFormData({
      merchant: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      resource_id: defaultResourceId || '',
      reason: '',
      chargeable: true,
      procurement: 'supplier',
      notes: ''
    });
    setWasEdited(false);
    setIsEditing(false);
  }, [defaultResourceId]);

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getCategoryConfig = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || null;
  };

  const renderConfidenceBadge = () => {
    if (!scanResult?.confidence) return null;
    
    const confidence = scanResult.confidence;
    let color, label;
    
    if (confidence >= 0.8) {
      color = '#10b981';
      label = 'High confidence';
    } else if (confidence >= 0.5) {
      color = '#f59e0b';
      label = 'Medium confidence';
    } else {
      color = '#ef4444';
      label = 'Low confidence';
    }

    return (
      <div className="confidence-badge" style={{ color, borderColor: color }}>
        <Sparkles size={14} />
        {label} ({Math.round(confidence * 100)}%)
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="receipt-scanner">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title">
          <Receipt size={24} />
          <div>
            <h3>Smart Receipt Scanner</h3>
            <p>Upload a receipt photo to auto-fill expense details</p>
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
        <div className={`step ${currentStep === STEPS.PROCESSING ? 'active' : [STEPS.REVIEW, STEPS.COMPLETE].includes(currentStep) ? 'complete' : ''}`}>
          <div className="step-dot">2</div>
          <span>Scan</span>
        </div>
        <div className="step-line" />
        <div className={`step ${currentStep === STEPS.REVIEW ? 'active' : currentStep === STEPS.COMPLETE ? 'complete' : ''}`}>
          <div className="step-dot">3</div>
          <span>Review</span>
        </div>
      </div>

      {/* Content based on step */}
      <div className="scanner-content">
        
        {/* STEP 1: Upload */}
        {currentStep === STEPS.UPLOAD && (
          <div className="upload-section">
            {!imagePreview ? (
              <div 
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="drop-icon" />
                <p className="drop-text">Drag & drop a receipt image</p>
                <p className="drop-subtext">or click to browse</p>
                
                <div className="upload-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={18} /> Choose File
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
            ) : (
              <div className="image-preview-section">
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Receipt preview" 
                    className="image-preview"
                  />
                  <button 
                    className="clear-image-btn"
                    onClick={clearImage}
                    title="Remove image"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="preview-actions">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={processReceipt}
                  >
                    <Sparkles size={20} /> Scan Receipt
                  </button>
                  <button 
                    className="btn btn-ghost"
                    onClick={clearImage}
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
            )}

            <div className="scanner-tips">
              <h4><HelpCircle size={16} /> Tips for best results</h4>
              <ul>
                <li>Ensure the receipt is flat and well-lit</li>
                <li>Include the full receipt in frame</li>
                <li>Avoid shadows and glare</li>
                <li>Text should be clearly readable</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: Processing */}
        {currentStep === STEPS.PROCESSING && (
          <div className="processing-section">
            <div className="processing-animation">
              <Loader2 size={48} className="spinner" />
            </div>
            <p className="processing-message">{processingMessage}</p>
            <p className="processing-subtext">This usually takes a few seconds...</p>
            
            {imagePreview && (
              <div className="processing-preview">
                <img src={imagePreview} alt="Processing" />
                <div className="scan-overlay" />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Review */}
        {currentStep === STEPS.REVIEW && (
          <div className="review-section">
            {/* Extracted data summary */}
            <div className="extraction-summary">
              <div className="summary-header">
                <h4>Extracted Information</h4>
                {renderConfidenceBadge()}
              </div>

              {scanResult?.ruleBasedClassification && (
                <div className="rule-notice">
                  <Sparkles size={14} />
                  Category auto-selected based on previous {formData.merchant} receipts
                </div>
              )}
            </div>

            {/* Form */}
            <div className="review-form">
              {/* Resource selector */}
              <div className="form-group">
                <label className="form-label">Resource *</label>
                <select
                  className="form-input"
                  value={formData.resource_id}
                  onChange={(e) => handleFormChange('resource_id', e.target.value)}
                >
                  <option value="">Select resource...</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Category selector */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div className="category-selector">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          '--cat-color': cat.color,
                          '--cat-bg': cat.bg
                        }}
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

              {/* Merchant & Amount row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Merchant</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.merchant}
                    onChange={(e) => handleFormChange('merchant', e.target.value)}
                    placeholder="Store/vendor name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date & Reason row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Reason/Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Brief description of expense"
                  />
                </div>
              </div>

              {/* Options row */}
              <div className="form-row options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.chargeable}
                    onChange={(e) => handleFormChange('chargeable', e.target.checked)}
                  />
                  <span>Chargeable to Customer</span>
                </label>

                <div className="procurement-toggle">
                  <span>Paid by:</span>
                  <select
                    className="form-input-sm"
                    value={formData.procurement}
                    onChange={(e) => handleFormChange('procurement', e.target.value)}
                  >
                    <option value="supplier">Supplier (JT)</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Any additional information..."
                />
              </div>
            </div>

            {/* Receipt preview thumbnail */}
            {imagePreview && (
              <div className="receipt-thumbnail">
                <img src={imagePreview} alt="Receipt" />
                <span>Receipt attached</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="review-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                <RotateCcw size={18} /> Start Over
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
                <Check size={18} /> Create Expense
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Complete */}
        {currentStep === STEPS.COMPLETE && (
          <div className="complete-section">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>Expense Created!</h3>
            <p>Your expense has been saved successfully.</p>
            
            <div className="complete-actions">
              <button className="btn btn-primary" onClick={handleReset}>
                <Camera size={18} /> Scan Another Receipt
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
