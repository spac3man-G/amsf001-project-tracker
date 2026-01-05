/**
 * BaselineProtectionModal
 * 
 * Modal component that appears when a user attempts to edit a plan item
 * that is linked to a baseline-locked milestone. Provides options to:
 * - Create a Variation (change request)
 * - Discard the proposed changes
 * - Cancel and close the modal
 * 
 * @module components/planning/BaselineProtectionModal
 * @version 1.0.0
 * @created 2026-01-05
 */

import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  ShieldAlert, 
  Calendar, 
  PoundSterling, 
  FileText, 
  X, 
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
}

/**
 * Format currency for display
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Get field display configuration
 * @param {string} field - Field name
 * @returns {Object} Field display config
 */
function getFieldConfig(field) {
  const configs = {
    start_date: {
      label: 'Start Date',
      icon: Calendar,
      format: formatDate
    },
    end_date: {
      label: 'End Date',
      icon: Calendar,
      format: formatDate
    },
    due_date: {
      label: 'Due Date',
      icon: Calendar,
      format: formatDate
    },
    duration: {
      label: 'Duration',
      icon: Calendar,
      format: (v) => `${v} days`
    },
    billable: {
      label: 'Billable Amount',
      icon: PoundSterling,
      format: formatCurrency
    },
    cost: {
      label: 'Cost',
      icon: PoundSterling,
      format: formatCurrency
    }
  };
  
  return configs[field] || {
    label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: FileText,
    format: (v) => String(v)
  };
}

/**
 * Calculate the impact of a change
 * @param {string} field - Field being changed
 * @param {*} oldValue - Previous value
 * @param {*} newValue - New value
 * @returns {Object} Impact description
 */
function calculateImpact(field, oldValue, newValue) {
  const impact = {
    description: '',
    type: 'neutral', // 'positive', 'negative', 'neutral'
    value: null
  };
  
  if (field === 'start_date' || field === 'end_date' || field === 'due_date') {
    if (oldValue && newValue) {
      const oldDate = new Date(oldValue);
      const newDate = new Date(newValue);
      const diffDays = Math.round((newDate - oldDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        impact.description = `+${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        impact.type = field === 'start_date' ? 'neutral' : 'negative'; // Later end = bad
        impact.value = diffDays;
      } else if (diffDays < 0) {
        impact.description = `${diffDays} day${diffDays !== -1 ? 's' : ''}`;
        impact.type = field === 'end_date' ? 'positive' : 'neutral'; // Earlier end = good
        impact.value = diffDays;
      } else {
        impact.description = 'No change';
        impact.type = 'neutral';
      }
    }
  } else if (field === 'billable' || field === 'cost') {
    const oldNum = parseFloat(oldValue) || 0;
    const newNum = parseFloat(newValue) || 0;
    const diff = newNum - oldNum;
    
    if (diff > 0) {
      impact.description = `+${formatCurrency(diff)}`;
      impact.type = 'negative'; // Cost increase = bad
      impact.value = diff;
    } else if (diff < 0) {
      impact.description = formatCurrency(diff);
      impact.type = 'positive'; // Cost decrease = good
      impact.value = diff;
    } else {
      impact.description = 'No change';
      impact.type = 'neutral';
    }
  } else if (field === 'duration') {
    const oldNum = parseInt(oldValue) || 0;
    const newNum = parseInt(newValue) || 0;
    const diff = newNum - oldNum;
    
    if (diff > 0) {
      impact.description = `+${diff} day${diff !== 1 ? 's' : ''}`;
      impact.type = 'negative';
      impact.value = diff;
    } else if (diff < 0) {
      impact.description = `${diff} day${diff !== -1 ? 's' : ''}`;
      impact.type = 'positive';
      impact.value = diff;
    } else {
      impact.description = 'No change';
      impact.type = 'neutral';
    }
  }
  
  return impact;
}

/**
 * BaselineProtectionModal Component
 * 
 * @param {Object} props
 * @param {Object} props.item - The plan item being edited
 * @param {Object} props.milestone - The linked milestone with baseline info
 * @param {Object} props.pendingChange - { field, value, previousValue }
 * @param {Function} props.onClose - Handler for closing/canceling
 * @param {Function} props.onCreateVariation - Handler for creating a variation
 * @param {Function} props.onDiscardChanges - Handler for discarding changes
 */
export default function BaselineProtectionModal({
  item,
  milestone,
  pendingChange,
  onClose,
  onCreateVariation,
  onDiscardChanges
}) {
  
  // Get field configuration
  const fieldConfig = useMemo(() => 
    getFieldConfig(pendingChange?.field), 
    [pendingChange?.field]
  );
  
  // Calculate impact
  const impact = useMemo(() => 
    calculateImpact(
      pendingChange?.field,
      pendingChange?.previousValue,
      pendingChange?.value
    ),
    [pendingChange]
  );
  
  // Get baseline version info
  const baselineVersion = useMemo(() => {
    if (!milestone) return null;
    
    // Try to determine version from signing info
    const supplierSigned = milestone.baseline_supplier_pm_signed_at;
    const customerSigned = milestone.baseline_customer_pm_signed_at;
    
    if (supplierSigned && customerSigned) {
      const lockedDate = new Date(Math.max(
        new Date(supplierSigned),
        new Date(customerSigned)
      ));
      return {
        locked: true,
        lockedAt: lockedDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      };
    }
    
    return { locked: milestone.baseline_locked, lockedAt: 'Unknown' };
  }, [milestone]);
  
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  const FieldIcon = fieldConfig.icon;
  
  return (
    <div 
      className="baseline-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="baseline-modal-title"
    >
      <div className="baseline-modal">
        {/* Header */}
        <div className="baseline-modal-header">
          <div className="baseline-modal-header-content">
            <ShieldAlert size={24} className="baseline-modal-icon-warning" />
            <h2 id="baseline-modal-title" className="baseline-modal-title">
              Baseline Protected
            </h2>
          </div>
          <button 
            className="baseline-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="baseline-modal-body">
          <p className="baseline-modal-description">
            This milestone has a signed baseline and requires a <strong>Variation</strong> (Change Request) to modify.
          </p>
          
          {/* Milestone Info Card */}
          <div className="baseline-modal-card">
            <div className="baseline-modal-card-header">
              <Lock size={16} />
              <span>Protected Milestone</span>
            </div>
            <div className="baseline-modal-card-content">
              <div className="baseline-modal-field">
                <span className="baseline-modal-label">Milestone:</span>
                <span className="baseline-modal-value">{milestone?.name || 'Unknown'}</span>
              </div>
              {item?.wbs && (
                <div className="baseline-modal-field">
                  <span className="baseline-modal-label">WBS:</span>
                  <span className="baseline-modal-value">{item.wbs}</span>
                </div>
              )}
              <div className="baseline-modal-field">
                <span className="baseline-modal-label">Baseline Status:</span>
                <span className="baseline-modal-value baseline-modal-locked">
                  <Lock size={14} />
                  Locked {baselineVersion?.lockedAt && `(${baselineVersion.lockedAt})`}
                </span>
              </div>
            </div>
          </div>
          
          {/* Proposed Change Card */}
          <div className="baseline-modal-card baseline-modal-card-change">
            <div className="baseline-modal-card-header">
              <AlertTriangle size={16} />
              <span>Proposed Change</span>
            </div>
            <div className="baseline-modal-card-content">
              <div className="baseline-modal-change-field">
                <FieldIcon size={18} className="baseline-modal-change-icon" />
                <span className="baseline-modal-change-label">{fieldConfig.label}</span>
              </div>
              
              <div className="baseline-modal-change-comparison">
                <div className="baseline-modal-change-value baseline-modal-change-old">
                  <span className="baseline-modal-change-value-label">Current</span>
                  <span className="baseline-modal-change-value-content">
                    {fieldConfig.format(pendingChange?.previousValue)}
                  </span>
                </div>
                
                <ArrowRight size={20} className="baseline-modal-change-arrow" />
                
                <div className="baseline-modal-change-value baseline-modal-change-new">
                  <span className="baseline-modal-change-value-label">Proposed</span>
                  <span className="baseline-modal-change-value-content">
                    {fieldConfig.format(pendingChange?.value)}
                  </span>
                </div>
              </div>
              
              {impact.description && impact.description !== 'No change' && (
                <div className={`baseline-modal-impact baseline-modal-impact-${impact.type}`}>
                  <span>Impact:</span>
                  <strong>{impact.description}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="baseline-modal-footer">
          <button
            className="baseline-modal-btn baseline-modal-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="baseline-modal-btn baseline-modal-btn-outline"
            onClick={onDiscardChanges}
          >
            Discard Changes
          </button>
          <button
            className="baseline-modal-btn baseline-modal-btn-primary"
            onClick={onCreateVariation}
          >
            <FileText size={16} />
            Create Variation
          </button>
        </div>
      </div>
    </div>
  );
}

BaselineProtectionModal.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    wbs: PropTypes.string,
    item_type: PropTypes.string
  }),
  milestone: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    baseline_locked: PropTypes.bool,
    baseline_start_date: PropTypes.string,
    baseline_end_date: PropTypes.string,
    baseline_billable: PropTypes.number,
    baseline_supplier_pm_signed_at: PropTypes.string,
    baseline_customer_pm_signed_at: PropTypes.string
  }),
  pendingChange: PropTypes.shape({
    id: PropTypes.string,
    field: PropTypes.string.isRequired,
    value: PropTypes.any,
    previousValue: PropTypes.any
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateVariation: PropTypes.func.isRequired,
  onDiscardChanges: PropTypes.func.isRequired
};
