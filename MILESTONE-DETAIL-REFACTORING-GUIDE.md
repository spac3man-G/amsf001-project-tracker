# Milestone Detail Page - Refactoring Guide

**Document Version:** 1.0  
**Created:** 5 December 2025  
**Scope:** MilestoneDetail.jsx architectural improvements  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Detailed Findings](#3-detailed-findings)
4. [Recommended Improvements](#4-recommended-improvements)
5. [Implementation Specifications](#5-implementation-specifications)
6. [AI Implementation Prompt](#6-ai-implementation-prompt)
7. [Testing Checklist](#7-testing-checklist)
8. [Appendix: File Inventory](#8-appendix-file-inventory)

---

## 1. Executive Summary

### Overview

The MilestoneDetail page (`src/pages/MilestoneDetail.jsx`) is a 586-line React component that displays milestone information including progress metrics, schedule tracking, deliverables, baseline commitment workflow, and acceptance certificate workflow. While functionally complete, the implementation has accumulated technical debt that impacts maintainability, testability, and scalability.

### Key Issues Identified

| Category | Severity | Issue |
|----------|----------|-------|
| Code Duplication | HIGH | Business logic duplicated across Milestones.jsx and MilestoneDetail.jsx |
| Data Access | MEDIUM-HIGH | Mixed patterns: services vs direct Supabase calls |
| Architecture | MEDIUM | 586-line monolithic component with 15 state variables |
| Consistency | MEDIUM | Utility functions reimplemented across 6+ files |
| Maintainability | MEDIUM | CSS duplication across page stylesheets |
| Type Safety | LOW-MEDIUM | Magic strings for status values throughout |

### Recommended Actions

1. **Immediate (P0):** Extract shared calculation functions to utility library
2. **Immediate (P0):** Move certificate operations to service layer
3. **Short-term (P1):** Create formatters utility library
4. **Short-term (P1):** Add confirmation dialogs for irreversible actions
5. **Short-term (P2):** Extract reusable UI components (SignatureBox, StatusBadge)
6. **Medium-term (P3):** Split page into sub-components with custom hooks

### Expected Outcomes

- **Reduced bug risk:** Single source of truth for calculations
- **Faster development:** Reusable components and utilities
- **Easier testing:** Isolated business logic
- **Better maintainability:** Smaller, focused files

---

## 2. Current State Analysis

### 2.1 File Statistics

| File | Lines | Functions | State Variables |
|------|-------|-----------|-----------------|
| MilestoneDetail.jsx | 586 | 16 | 15 |
| MilestoneDetail.css | 756 | - | - |
| Milestones.jsx | ~350 | 12 | 10 |
| milestones.service.js | 280 | 12 | - |

### 2.2 Component Responsibilities

MilestoneDetail.jsx currently handles:

1. **Data Fetching** - Milestone, deliverables, certificate
2. **State Management** - 15 useState hooks
3. **Business Logic** - Status calculation, progress calculation, permission checks
4. **Workflow Operations** - Baseline signing, certificate generation, certificate signing
5. **UI Rendering** - Header, metrics, schedule, deliverables, baseline, certificate sections
6. **Modal Management** - Edit modal with form state

### 2.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      MilestoneDetail.jsx                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌───────────────────┐   ┌────────────────┐ │
│  │ useParams()  │   │ milestonesService │   │ supabase       │ │
│  │ id           │   │ .getById()        │   │ (direct call)  │ │
│  └──────┬───────┘   │ .update()         │   │ certificates   │ │
│         │           │ .createCertificate│   └───────┬────────┘ │
│         │           │ .updateCertificate│           │          │
│         │           └─────────┬─────────┘           │          │
│         │                     │                     │          │
│         ▼                     ▼                     ▼          │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    Component State                          ││
│  │  milestone, deliverables, certificate, loading, saving...  ││
│  └────────────────────────────────────────────────────────────┘│
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              Computed Values (in render)                    ││
│  │  calculateMilestoneStatus(), calculateMilestoneProgress()  ││
│  │  canEdit, canSignAsSupplier, canSignAsCustomer             ││
│  └────────────────────────────────────────────────────────────┘│
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    UI Sections                              ││
│  │  Header → Metrics → Schedule → Deliverables → Baseline →   ││
│  │  Certificate → EditModal                                    ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Dependencies

```javascript
// External
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lucide-react icons } from 'lucide-react';

// Internal Services
import { milestonesService, deliverablesService } from '../services';
import { supabase } from '../lib/supabase';  // Direct access (problematic)

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Components
import { LoadingSpinner } from '../components/common';
```

---

## 3. Detailed Findings

### 3.1 CRITICAL: Duplicated Business Logic

**Location:** Lines 68-88 in MilestoneDetail.jsx, Lines 77-87 in Milestones.jsx

**Duplicated Functions:**

```javascript
// calculateMilestoneStatus - IDENTICAL in both files
function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) {
    return 'Not Started';
  }
  const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
  const allDelivered = deliverables.every(d => d.status === 'Delivered');
  if (allDelivered) return 'Completed';
  if (allNotStarted) return 'Not Started';
  return 'In Progress';
}

// calculateMilestoneProgress - IDENTICAL in both files
function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
  return Math.round(totalProgress / deliverables.length);
}
```

**Risk Assessment:**
- If progress calculation logic changes (e.g., weight by complexity), both files need updating
- Easy to update one and forget the other
- No single source of truth
- Testing requires testing both implementations

**Also Duplicated Across Multiple Files:**

| Function | Files Where Duplicated |
|----------|------------------------|
| `formatDate()` | MilestoneDetail, Milestones, Partners, Expenses, Timesheets, RaidLog, Dashboard |
| `formatCurrency()` | MilestoneDetail, Milestones, Partners, Expenses, Dashboard, Billing |
| `getStatusClass()` | MilestoneDetail, Milestones, Deliverables, Resources, Partners |

---

### 3.2 HIGH: Inconsistent Data Access Patterns

**Location:** Lines 49-66 in MilestoneDetail.jsx

**Current Implementation:**

```javascript
const fetchMilestoneData = useCallback(async (showRefresh = false) => {
  // Pattern 1: Service layer (CORRECT)
  const milestoneData = await milestonesService.getById(id);
  
  // Pattern 2: Service layer (CORRECT)
  const deliverablesData = await deliverablesService.getAll(milestoneData.project_id, {
    filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
    orderBy: { column: 'deliverable_ref', ascending: true }
  });

  // Pattern 3: Direct Supabase call (INCONSISTENT)
  const { data: certData } = await supabase
    .from('milestone_certificates')
    .select('*')
    .eq('milestone_id', id)
    .limit(1);
}, [id]);
```

**Why This Is Problematic:**

1. **Service layer provides:**
   - Consistent error handling
   - Soft-delete filtering
   - Input sanitization
   - Logging

2. **Direct Supabase calls bypass:**
   - Error handling patterns
   - Soft-delete filters (certificates could show deleted records)
   - Audit logging hooks
   - Future middleware

3. **The service already has certificate methods:**
   ```javascript
   // In milestones.service.js - these exist but aren't used
   async getCertificates(projectId) { ... }
   async createCertificate(certificateData) { ... }
   async updateCertificate(certificateId, updates) { ... }
   ```

**Missing Service Method:**
```javascript
// This method doesn't exist but should
async getCertificateByMilestoneId(milestoneId) { ... }
```

---

### 3.3 MEDIUM-HIGH: Business Logic Embedded in Component

**Location:** Lines 24-30, 115-122 in MilestoneDetail.jsx

**Current Implementation:**

```javascript
// Permission checks scattered in component body
const isAdmin = userRole === 'admin';
const isSupplierPM = userRole === 'supplier_pm';
const isCustomerPM = userRole === 'customer_pm';
const canEdit = isAdmin || isSupplierPM;
const canSignAsSupplier = isAdmin || isSupplierPM;
const canSignAsCustomer = isCustomerPM;

// Additional permission function
function canEditBaseline() {
  if (!milestone) return false;
  if (isAdmin) return true;
  if (milestone.baseline_locked) return false;
  return isSupplierPM;
}
```

**Issues:**

1. **Doesn't use existing permission system:**
   ```javascript
   // permissionMatrix.js exists with structured permissions
   // usePermissions hook exists but isn't used here
   ```

2. **Permission logic will be needed elsewhere:**
   - Gantt chart (editing milestones)
   - Dashboard (showing relevant actions)
   - Bulk operations
   - API validation

3. **Hard to test:**
   - Must render full component to test permission logic
   - No unit tests possible for permission rules

---

### 3.4 MEDIUM: Monolithic Component Structure

**Component Size Analysis:**

| Section | Approximate Lines | Responsibility |
|---------|-------------------|----------------|
| Imports | 15 | Dependencies |
| State declarations | 20 | 15 useState hooks |
| Permission checks | 10 | Role-based access |
| Data fetching | 30 | fetchMilestoneData |
| Helper functions | 50 | Format, calculate, status |
| Action handlers | 120 | Sign, generate, save |
| Loading/Error UI | 20 | Edge cases |
| Main render | 340 | All UI sections |
| **Total** | **586** | Everything |

**Problems:**

1. **Single Responsibility Violation:** One component does data, logic, and UI
2. **Re-render Scope:** Any state change re-renders entire page
3. **Testing Difficulty:** Can't test sections in isolation
4. **Cognitive Load:** 586 lines to understand for any change

---

### 3.5 MEDIUM: CSS Duplication

**File Sizes:**

```
MilestoneDetail.css   756 lines
Milestones.css        450 lines
Partners.css          380 lines
RaidLog.css           420 lines
Deliverables.css      350 lines
```

**Repeated Patterns Found:**

```css
/* .section-card - appears in 6+ files */
.section-card {
  background: white;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
}

/* .signature-grid / .signature-box - appears in 3 files */
.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.25rem 0;
}

/* .modal-overlay / .modal-content - appears in 8+ files */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  /* ... */
}

/* Status badge variations - appears everywhere */
.status-completed { background: #dcfce7; color: #15803d; }
.status-in-progress { background: #dbeafe; color: #1d4ed8; }
.status-not-started { background: #f1f5f9; color: #64748b; }
```

---

### 3.6 LOW-MEDIUM: Magic Strings

**Examples Found:**

```javascript
// Status comparisons
if (d.status === 'Delivered') ...
if (computedStatus === 'Completed') ...
if (certificate.status === 'Signed') ...
if (baselineStatus === 'Locked') ...

// Status assignments
updates.status = 'Pending Customer Signature';
updates.status = 'Draft';

// Role checks
if (userRole === 'admin') ...
if (userRole === 'supplier_pm') ...
```

**Risk:** Typos cause silent failures. `'Deliverd'` won't match anything and won't throw an error.

---

## 4. Recommended Improvements

### 4.1 Priority Matrix

| ID | Task | Priority | Effort | Impact | Dependencies |
|----|------|----------|--------|--------|--------------|
| R1 | Extract calculation functions | P0 | 2h | HIGH | None |
| R2 | Add service method for certificate fetch | P0 | 1h | HIGH | None |
| R3 | Create formatters.js utility | P1 | 2h | MEDIUM | None |
| R4 | Add confirmation dialogs | P1 | 2h | MEDIUM | None |
| R5 | Create constants file | P1 | 1h | MEDIUM | None |
| R6 | Extract SignatureBox component | P2 | 3h | MEDIUM | R3 |
| R7 | Extract StatusBadge component | P2 | 2h | R5 |
| R8 | Create CSS tokens file | P2 | 3h | MEDIUM | None |
| R9 | Create milestone permissions hook | P2 | 2h | MEDIUM | None |
| R10 | Split into sub-components | P3 | 8h | HIGH | R1-R9 |

### 4.2 Implementation Order

```
Phase 1: Foundation (P0) - 3 hours
├── R1: Extract calculation functions
└── R2: Add certificate service method

Phase 2: Utilities (P1) - 5 hours
├── R3: Create formatters.js
├── R4: Add confirmation dialogs
└── R5: Create constants file

Phase 3: Components (P2) - 10 hours
├── R6: Extract SignatureBox
├── R7: Extract StatusBadge
├── R8: Create CSS tokens
└── R9: Create permissions hook

Phase 4: Architecture (P3) - 8 hours
└── R10: Split into sub-components
```

---

## 5. Implementation Specifications

### 5.1 R1: Extract Calculation Functions

**Create File:** `src/lib/milestoneCalculations.js`

```javascript
/**
 * Milestone Calculation Utilities
 * 
 * Single source of truth for all milestone-related calculations.
 * Used by: Milestones.jsx, MilestoneDetail.jsx, Dashboard, Gantt, API
 * 
 * @module milestoneCalculations
 * @version 1.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const MILESTONE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
});

export const DELIVERABLE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DELIVERED: 'Delivered'
});

export const CERTIFICATE_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PENDING_SUPPLIER: 'Pending Supplier Signature',
  PENDING_CUSTOMER: 'Pending Customer Signature',
  SIGNED: 'Signed'
});

export const BASELINE_STATUS = Object.freeze({
  NOT_COMMITTED: 'Not Committed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  LOCKED: 'Locked'
});

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate milestone status from its deliverables
 * 
 * Rules:
 * - No deliverables → Not Started
 * - All deliverables "Delivered" → Completed
 * - All deliverables "Not Started" or null → Not Started
 * - Otherwise → In Progress
 * 
 * @param {Array} deliverables - Array of deliverable objects with status field
 * @returns {string} One of MILESTONE_STATUS values
 */
export function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) {
    return MILESTONE_STATUS.NOT_STARTED;
  }
  
  const allNotStarted = deliverables.every(
    d => d.status === DELIVERABLE_STATUS.NOT_STARTED || !d.status
  );
  const allDelivered = deliverables.every(
    d => d.status === DELIVERABLE_STATUS.DELIVERED
  );
  
  if (allDelivered) return MILESTONE_STATUS.COMPLETED;
  if (allNotStarted) return MILESTONE_STATUS.NOT_STARTED;
  return MILESTONE_STATUS.IN_PROGRESS;
}

/**
 * Calculate milestone progress as average of deliverable progress
 * 
 * Formula: Sum of all deliverable.progress / count of deliverables
 * 
 * @param {Array} deliverables - Array of deliverable objects with progress field
 * @returns {number} Progress percentage (0-100), rounded to nearest integer
 */
export function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  
  const totalProgress = deliverables.reduce(
    (sum, d) => sum + (d.progress || 0), 
    0
  );
  
  return Math.round(totalProgress / deliverables.length);
}

/**
 * Determine baseline commitment status
 * 
 * @param {Object} milestone - Milestone object with baseline signature fields
 * @returns {string} One of BASELINE_STATUS values
 */
export function calculateBaselineStatus(milestone) {
  if (!milestone) return BASELINE_STATUS.NOT_COMMITTED;
  
  if (milestone.baseline_locked) {
    return BASELINE_STATUS.LOCKED;
  }
  
  const supplierSigned = !!milestone.baseline_supplier_pm_signed_at;
  const customerSigned = !!milestone.baseline_customer_pm_signed_at;
  
  if (supplierSigned && customerSigned) return BASELINE_STATUS.LOCKED;
  if (supplierSigned) return BASELINE_STATUS.AWAITING_CUSTOMER;
  if (customerSigned) return BASELINE_STATUS.AWAITING_SUPPLIER;
  
  return BASELINE_STATUS.NOT_COMMITTED;
}

/**
 * Check if certificate can be generated
 * 
 * @param {Object} milestone - Milestone object
 * @param {Array} deliverables - Deliverables for this milestone
 * @param {Object|null} certificate - Existing certificate or null
 * @returns {boolean}
 */
export function canGenerateCertificate(milestone, deliverables, certificate) {
  // Already has certificate
  if (certificate) return false;
  
  // Must be completed (all deliverables delivered)
  const status = calculateMilestoneStatus(deliverables);
  return status === MILESTONE_STATUS.COMPLETED;
}

/**
 * Get certificate status display information
 * 
 * @param {string} status - Certificate status value
 * @returns {Object} { label: string, cssClass: string }
 */
export function getCertificateStatusInfo(status) {
  switch (status) {
    case CERTIFICATE_STATUS.SIGNED:
      return { label: 'Signed', cssClass: 'cert-signed' };
    case CERTIFICATE_STATUS.PENDING_CUSTOMER:
      return { label: 'Awaiting Customer', cssClass: 'cert-pending-customer' };
    case CERTIFICATE_STATUS.PENDING_SUPPLIER:
      return { label: 'Awaiting Supplier', cssClass: 'cert-pending-supplier' };
    case CERTIFICATE_STATUS.DRAFT:
    default:
      return { label: 'Draft', cssClass: 'cert-draft' };
  }
}

/**
 * Calculate financial variance
 * 
 * @param {number} forecast - Forecast billable amount
 * @param {number} baseline - Baseline billable amount
 * @returns {Object} { amount: number, percentage: number, direction: 'over'|'under'|'on' }
 */
export function calculateVariance(forecast, baseline) {
  const forecastVal = forecast || 0;
  const baselineVal = baseline || 0;
  
  if (baselineVal === 0) {
    return { amount: forecastVal, percentage: 0, direction: 'on' };
  }
  
  const amount = forecastVal - baselineVal;
  const percentage = Math.round((amount / baselineVal) * 100);
  
  let direction = 'on';
  if (amount > 0) direction = 'over';
  if (amount < 0) direction = 'under';
  
  return { amount, percentage, direction };
}
```

**Update Milestones.jsx:**

```javascript
// BEFORE
function calculateMilestoneStatus(deliverables) { ... }
function calculateMilestoneProgress(deliverables) { ... }

// AFTER
import { 
  calculateMilestoneStatus, 
  calculateMilestoneProgress,
  MILESTONE_STATUS 
} from '../lib/milestoneCalculations';
```

**Update MilestoneDetail.jsx:**

```javascript
// BEFORE
function calculateMilestoneStatus(deliverables) { ... }
function calculateMilestoneProgress(deliverables) { ... }

// AFTER
import { 
  calculateMilestoneStatus, 
  calculateMilestoneProgress,
  calculateBaselineStatus,
  canGenerateCertificate,
  getCertificateStatusInfo,
  MILESTONE_STATUS,
  BASELINE_STATUS,
  CERTIFICATE_STATUS
} from '../lib/milestoneCalculations';
```

---

### 5.2 R2: Add Certificate Service Method

**Update File:** `src/services/milestones.service.js`

**Add Method:**

```javascript
/**
 * Get certificate for a specific milestone
 * 
 * @param {string} milestoneId - Milestone UUID
 * @returns {Promise<Object|null>} Certificate or null if not found
 */
async getCertificateByMilestoneId(milestoneId) {
  try {
    const { data, error } = await supabase
      .from('milestone_certificates')
      .select('*')
      .eq('milestone_id', milestoneId)
      .limit(1);

    if (error) {
      console.error('MilestonesService getCertificateByMilestoneId error:', error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('MilestonesService getCertificateByMilestoneId failed:', error);
    throw error;
  }
}

/**
 * Sign a certificate as supplier or customer
 * Handles status transitions automatically
 * 
 * @param {string} certificateId - Certificate UUID
 * @param {'supplier'|'customer'} signerRole - Who is signing
 * @param {string} userId - User UUID
 * @param {string} userName - User display name
 * @returns {Promise<Object>} Updated certificate
 */
async signCertificate(certificateId, signerRole, userId, userName) {
  try {
    // Get current certificate state
    const { data: currentData, error: fetchError } = await supabase
      .from('milestone_certificates')
      .select('supplier_pm_signed_at, customer_pm_signed_at')
      .eq('id', certificateId)
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    const current = currentData?.[0];
    if (!current) throw new Error('Certificate not found');
    
    const isSupplier = signerRole === 'supplier';
    const prefix = isSupplier ? 'supplier' : 'customer';
    
    const updates = {
      [`${prefix}_pm_id`]: userId,
      [`${prefix}_pm_name`]: userName,
      [`${prefix}_pm_signed_at`]: new Date().toISOString()
    };
    
    // Determine new status
    const otherSigned = isSupplier 
      ? current.customer_pm_signed_at 
      : current.supplier_pm_signed_at;
    
    if (otherSigned) {
      updates.status = 'Signed';
    } else {
      updates.status = isSupplier 
        ? 'Pending Customer Signature' 
        : 'Pending Supplier Signature';
    }
    
    return this.updateCertificate(certificateId, updates);
  } catch (error) {
    console.error('MilestonesService signCertificate error:', error);
    throw error;
  }
}
```

**Update MilestoneDetail.jsx:**

```javascript
// BEFORE (direct Supabase call)
const { data: certData } = await supabase
  .from('milestone_certificates')
  .select('*')
  .eq('milestone_id', id)
  .limit(1);
setCertificate(certData?.[0] || null);

// AFTER (service layer)
const certData = await milestonesService.getCertificateByMilestoneId(id);
setCertificate(certData);
```

---

### 5.3 R3: Create Formatters Utility

**Create File:** `src/lib/formatters.js`

```javascript
/**
 * Shared Formatting Utilities
 * 
 * Single source of truth for all display formatting.
 * Ensures consistent date, currency, and number formatting across the app.
 * 
 * @module formatters
 * @version 1.0
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format a date string for display
 * 
 * @param {string|Date|null} dateStr - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.fallback - Value to return if date is null/undefined (default: '—')
 * @param {string} options.format - 'short' | 'medium' | 'long' (default: 'medium')
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, options = {}) {
  const { fallback = '—', format = 'medium' } = options;
  
  if (!dateStr) return fallback;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return fallback;
  
  const formats = {
    short: { day: 'numeric', month: 'numeric', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
  };
  
  return date.toLocaleDateString('en-GB', formats[format] || formats.medium);
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * 
 * @param {string|Date|null} dateStr - Date to format
 * @returns {string} ISO date string or empty string
 */
export function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Format a datetime for display
 * 
 * @param {string|Date|null} dateStr - Datetime to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateStr, options = {}) {
  const { fallback = '—' } = options;
  
  if (!dateStr) return fallback;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return fallback;
  
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format a number as currency
 * 
 * @param {number|string|null} value - Value to format
 * @param {Object} options - Formatting options
 * @param {string} options.currency - Currency code (default: 'GBP')
 * @param {boolean} options.showSymbol - Show currency symbol (default: true)
 * @param {number} options.decimals - Decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  const { 
    currency = 'GBP', 
    showSymbol = true,
    decimals = 2 
  } = options;
  
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  if (showSymbol) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numValue);
  }
  
  return numValue.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format a currency value with variance indicator
 * 
 * @param {number} value - Current value
 * @param {number} baseline - Baseline to compare against
 * @returns {Object} { formatted: string, variance: string, direction: 'positive'|'negative'|'neutral' }
 */
export function formatCurrencyWithVariance(value, baseline) {
  const formatted = formatCurrency(value);
  const diff = (value || 0) - (baseline || 0);
  
  if (baseline === 0 || diff === 0) {
    return { formatted, variance: null, direction: 'neutral' };
  }
  
  const direction = diff > 0 ? 'positive' : 'negative';
  const sign = diff > 0 ? '+' : '';
  const variance = `${sign}${formatCurrency(diff)} vs baseline`;
  
  return { formatted, variance, direction };
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format a percentage
 * 
 * @param {number} value - Value (0-100)
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted percentage
 */
export function formatPercent(value, decimals = 0) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 * 
 * @param {number|string} value - Value to format
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 0) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return numValue.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Pluralize a word based on count
 * 
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} Correct form based on count
 */
export function pluralize(count, singular, plural = null) {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Truncate text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
}
```

---

### 5.4 R4: Add Confirmation Dialogs

**Update MilestoneDetail.jsx:**

Add state and handlers for confirmation:

```javascript
// Add to state declarations
const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  action: null,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  confirmVariant: 'primary' // 'primary' | 'danger'
});

// Confirmation dialog handlers
function requestConfirmation(action, title, message, options = {}) {
  setConfirmDialog({
    isOpen: true,
    action,
    title,
    message,
    confirmLabel: options.confirmLabel || 'Confirm',
    confirmVariant: options.confirmVariant || 'primary'
  });
}

async function handleConfirmedAction() {
  const { action } = confirmDialog;
  setConfirmDialog({ ...confirmDialog, isOpen: false });
  
  switch (action) {
    case 'signBaselineSupplier':
      await signBaselineAsSupplier();
      break;
    case 'signBaselineCustomer':
      await signBaselineAsCustomer();
      break;
    case 'resetBaseline':
      await resetBaseline();
      break;
    case 'generateCertificate':
      await generateCertificate();
      break;
    case 'signCertificateSupplier':
      await signCertificateAsSupplier();
      break;
    case 'signCertificateCustomer':
      await signCertificateAsCustomer();
      break;
    default:
      console.warn('Unknown confirmation action:', action);
  }
}

function closeConfirmDialog() {
  setConfirmDialog({ ...confirmDialog, isOpen: false, action: null });
}

// Update sign button handlers to use confirmation
function handleSignBaselineAsSupplier() {
  requestConfirmation(
    'signBaselineSupplier',
    'Confirm Baseline Commitment',
    'Once both parties sign, the baseline dates and billable amount will be locked. This action cannot be undone without admin intervention.',
    { confirmLabel: 'Sign & Commit' }
  );
}

function handleResetBaseline() {
  requestConfirmation(
    'resetBaseline',
    'Reset Baseline Lock',
    'This will remove both signatures and unlock the baseline for editing. The original signatories will not be notified. Are you sure?',
    { confirmLabel: 'Reset Baseline', confirmVariant: 'danger' }
  );
}

function handleGenerateCertificate() {
  requestConfirmation(
    'generateCertificate',
    'Generate Acceptance Certificate',
    `This will create an acceptance certificate for ${milestone.name} with a payment value of ${formatCurrency(milestone.billable)}. The certificate will require signatures from both Supplier PM and Customer PM before the milestone can be billed.`,
    { confirmLabel: 'Generate Certificate' }
  );
}
```

Add to render (before closing div):

```jsx
{/* Confirmation Dialog */}
<ConfirmDialog
  isOpen={confirmDialog.isOpen}
  title={confirmDialog.title}
  message={confirmDialog.message}
  confirmLabel={confirmDialog.confirmLabel}
  confirmVariant={confirmDialog.confirmVariant}
  onConfirm={handleConfirmedAction}
  onCancel={closeConfirmDialog}
  loading={saving}
/>
```

---

### 5.5 R5: Create Constants File

**Create File:** `src/lib/constants.js`

```javascript
/**
 * Application Constants
 * 
 * Centralized constants for status values, roles, and other magic strings.
 * Using these constants prevents typos and enables IDE autocomplete.
 * 
 * @module constants
 * @version 1.0
 */

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  CUSTOMER_PM: 'customer_pm',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
});

export const ROLE_HIERARCHY = Object.freeze({
  [USER_ROLES.ADMIN]: 5,
  [USER_ROLES.SUPPLIER_PM]: 4,
  [USER_ROLES.CUSTOMER_PM]: 3,
  [USER_ROLES.CONTRIBUTOR]: 2,
  [USER_ROLES.VIEWER]: 1
});

// ============================================================================
// ENTITY STATUSES
// ============================================================================

export const MILESTONE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
});

export const DELIVERABLE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DELIVERED: 'Delivered'
});

export const TIMESHEET_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATED: 'Validated',
  REJECTED: 'Rejected'
});

export const EXPENSE_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATED: 'Validated',
  REJECTED: 'Rejected'
});

export const CERTIFICATE_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PENDING_SUPPLIER: 'Pending Supplier Signature',
  PENDING_CUSTOMER: 'Pending Customer Signature',
  SIGNED: 'Signed'
});

export const BASELINE_STATUS = Object.freeze({
  NOT_COMMITTED: 'Not Committed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  LOCKED: 'Locked'
});

export const PARTNER_STATUS = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
});

export const RAID_TYPE = Object.freeze({
  RISK: 'Risk',
  ISSUE: 'Issue'
});

export const RAID_PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
});

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const STATUS_COLORS = Object.freeze({
  // Success states
  completed: { bg: '#dcfce7', text: '#15803d' },
  delivered: { bg: '#dcfce7', text: '#15803d' },
  validated: { bg: '#dcfce7', text: '#15803d' },
  signed: { bg: '#dcfce7', text: '#15803d' },
  active: { bg: '#dcfce7', text: '#15803d' },
  locked: { bg: '#dcfce7', text: '#15803d' },
  
  // In progress states
  'in-progress': { bg: '#dbeafe', text: '#1d4ed8' },
  submitted: { bg: '#dbeafe', text: '#1d4ed8' },
  'under-review': { bg: '#dbeafe', text: '#1d4ed8' },
  
  // Warning states
  'awaiting-customer': { bg: '#fef3c7', text: '#92400e' },
  'awaiting-supplier': { bg: '#fef3c7', text: '#92400e' },
  pending: { bg: '#fef3c7', text: '#92400e' },
  
  // Neutral states
  'not-started': { bg: '#f1f5f9', text: '#64748b' },
  draft: { bg: '#f1f5f9', text: '#64748b' },
  'not-committed': { bg: '#f1f5f9', text: '#64748b' },
  inactive: { bg: '#f1f5f9', text: '#64748b' },
  
  // Error states
  rejected: { bg: '#fee2e2', text: '#dc2626' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
  critical: { bg: '#fee2e2', text: '#dc2626' }
});

/**
 * Get status color configuration
 * @param {string} status - Status value
 * @returns {Object} { bg: string, text: string }
 */
export function getStatusColor(status) {
  const key = status?.toLowerCase().replace(/\s+/g, '-') || 'not-started';
  return STATUS_COLORS[key] || STATUS_COLORS['not-started'];
}

// ============================================================================
// DATE/TIME
// ============================================================================

export const DATE_FORMATS = Object.freeze({
  DISPLAY: { day: 'numeric', month: 'short', year: 'numeric' },
  SHORT: { day: 'numeric', month: 'numeric', year: '2-digit' },
  LONG: { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' },
  ISO: 'yyyy-MM-dd'
});

export const LOCALE = 'en-GB';
export const CURRENCY = 'GBP';
```

---

### 5.6 R6: Extract SignatureBox Component

**Create File:** `src/components/common/SignatureBox.jsx`

```javascript
/**
 * SignatureBox Component
 * 
 * Reusable dual-signature UI component for approval workflows.
 * Used by: Baseline commitment, Certificate signing, Partner contracts
 * 
 * @component
 * @version 1.0
 */

import React from 'react';
import { CheckCircle, PenTool } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import './SignatureBox.css';

/**
 * Individual signature box
 */
export function SignatureBox({
  role,              // Display label: 'Supplier PM' | 'Customer PM'
  signedBy = null,   // { name: string, date: string } or null
  canSign = false,   // Whether current user can sign
  onSign,            // Click handler for sign button
  saving = false,    // Loading state
  variant = 'default' // 'default' | 'customer' (different button color)
}) {
  const isSigned = signedBy?.name && signedBy?.date;
  
  return (
    <div className={`signature-box ${isSigned ? 'signed' : ''}`}>
      <div className="signature-header">
        <span className="signature-role">{role}</span>
        {isSigned && <CheckCircle size={16} className="signed-icon" />}
      </div>
      
      {isSigned ? (
        <div className="signature-info">
          <div className="signature-name-row">
            <PenTool size={14} />
            <span className="signer-name">{signedBy.name}</span>
          </div>
          <span className="signed-date">{formatDate(signedBy.date)}</span>
        </div>
      ) : canSign ? (
        <button 
          className={`sign-button ${variant}`}
          onClick={onSign}
          disabled={saving}
        >
          <PenTool size={14} />
          {saving ? 'Signing...' : 'Sign to Commit'}
        </button>
      ) : (
        <span className="awaiting-text">Awaiting signature</span>
      )}
    </div>
  );
}

/**
 * Grid container for two signature boxes
 */
export function SignatureGrid({ children }) {
  return (
    <div className="signature-grid">
      {children}
    </div>
  );
}

/**
 * Pre-configured dual signature component
 */
export function DualSignature({
  supplierLabel = 'Supplier PM',
  customerLabel = 'Customer PM',
  supplierSignedBy = null,
  customerSignedBy = null,
  canSignAsSupplier = false,
  canSignAsCustomer = false,
  onSignAsSupplier,
  onSignAsCustomer,
  saving = false
}) {
  return (
    <SignatureGrid>
      <SignatureBox
        role={supplierLabel}
        signedBy={supplierSignedBy}
        canSign={canSignAsSupplier}
        onSign={onSignAsSupplier}
        saving={saving}
        variant="default"
      />
      <SignatureBox
        role={customerLabel}
        signedBy={customerSignedBy}
        canSign={canSignAsCustomer}
        onSign={onSignAsCustomer}
        saving={saving}
        variant="customer"
      />
    </SignatureGrid>
  );
}

export default SignatureBox;
```

**Create File:** `src/components/common/SignatureBox.css`

```css
/**
 * SignatureBox Component Styles
 */

.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.25rem 0;
}

.signature-box {
  background: #f9fafb;
  border: 1px solid #e5e5e7;
  border-radius: 10px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.signature-box.signed {
  background: #f0fdf4;
  border-color: #86efac;
}

.signature-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.signature-role {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.signed-icon {
  color: #16a34a;
}

.signature-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.signature-name-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.signature-name-row svg {
  color: #16a34a;
}

.signer-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1d1d1f;
}

.signed-date {
  font-size: 0.75rem;
  color: #64748b;
}

.sign-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 1rem;
  background: #0d9488;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sign-button:hover:not(:disabled) {
  background: #0f766e;
}

.sign-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sign-button.customer {
  background: #2563eb;
}

.sign-button.customer:hover:not(:disabled) {
  background: #1d4ed8;
}

.sign-button svg {
  flex-shrink: 0;
}

.awaiting-text {
  font-size: 0.8rem;
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 0.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .signature-grid {
    grid-template-columns: 1fr;
  }
}
```

**Update exports:** `src/components/common/index.js`

```javascript
// Add to existing exports
export { SignatureBox, SignatureGrid, DualSignature } from './SignatureBox';
```

---

### 5.7 R9: Create Milestone Permissions Hook

**Create File:** `src/hooks/useMilestonePermissions.js`

```javascript
/**
 * useMilestonePermissions Hook
 * 
 * Centralized permission logic for milestone operations.
 * Encapsulates role-based access control for milestone features.
 * 
 * @hook
 * @version 1.0
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../lib/constants';

/**
 * Hook for milestone-specific permissions
 * 
 * @param {Object|null} milestone - Current milestone object (optional)
 * @returns {Object} Permission flags
 */
export function useMilestonePermissions(milestone = null) {
  const { role: userRole } = useAuth();
  
  return useMemo(() => {
    const isAdmin = userRole === USER_ROLES.ADMIN;
    const isSupplierPM = userRole === USER_ROLES.SUPPLIER_PM;
    const isCustomerPM = userRole === USER_ROLES.CUSTOMER_PM;
    const isContributor = userRole === USER_ROLES.CONTRIBUTOR;
    const isViewer = userRole === USER_ROLES.VIEWER;
    
    const isManager = isAdmin || isSupplierPM || isCustomerPM;
    const isEditor = isAdmin || isSupplierPM;
    
    // Baseline state
    const baselineLocked = milestone?.baseline_locked ?? false;
    const baselineSupplierSigned = !!milestone?.baseline_supplier_pm_signed_at;
    const baselineCustomerSigned = !!milestone?.baseline_customer_pm_signed_at;
    
    return {
      // Role shortcuts
      isAdmin,
      isSupplierPM,
      isCustomerPM,
      isContributor,
      isViewer,
      isManager,
      isEditor,
      
      // General milestone permissions
      canView: true, // All authenticated users
      canCreate: isEditor,
      canEdit: isEditor,
      canDelete: isEditor,
      
      // Baseline commitment permissions
      canEditBaseline: isAdmin || (!baselineLocked && isSupplierPM),
      canSignBaselineAsSupplier: (isAdmin || isSupplierPM) && !baselineSupplierSigned && !baselineLocked,
      canSignBaselineAsCustomer: isCustomerPM && !baselineCustomerSigned && !baselineLocked,
      canResetBaseline: isAdmin && baselineLocked,
      
      // Certificate permissions
      canGenerateCertificate: isManager,
      canSignCertificateAsSupplier: isAdmin || isSupplierPM,
      canSignCertificateAsCustomer: isCustomerPM,
      
      // Gantt permissions
      canEditGantt: isEditor,
      canDragMilestones: isEditor && !baselineLocked,
      
      // Financial permissions
      canViewFinancials: isManager,
      canEditBilling: isAdmin || isSupplierPM,
      
      // State flags
      isBaselineLocked: baselineLocked,
      isBaselineFullySigned: baselineSupplierSigned && baselineCustomerSigned
    };
  }, [userRole, milestone?.baseline_locked, milestone?.baseline_supplier_pm_signed_at, milestone?.baseline_customer_pm_signed_at]);
}

export default useMilestonePermissions;
```

**Usage in MilestoneDetail.jsx:**

```javascript
// BEFORE
const isAdmin = userRole === 'admin';
const isSupplierPM = userRole === 'supplier_pm';
const isCustomerPM = userRole === 'customer_pm';
const canEdit = isAdmin || isSupplierPM;
const canSignAsSupplier = isAdmin || isSupplierPM;
const canSignAsCustomer = isCustomerPM;

function canEditBaseline() {
  if (!milestone) return false;
  if (isAdmin) return true;
  if (milestone.baseline_locked) return false;
  return isSupplierPM;
}

// AFTER
import { useMilestonePermissions } from '../hooks/useMilestonePermissions';

// In component:
const permissions = useMilestonePermissions(milestone);

// Usage:
{permissions.canEdit && <button onClick={openEditModal}>Edit</button>}
{permissions.canSignBaselineAsSupplier && <button onClick={handleSignBaseline}>Sign</button>}
{permissions.canEditBaseline && <input disabled={false} />}
```

---

## 6. AI Implementation Prompt

The following prompt can be used to instruct an AI assistant to implement these changes:

---

### IMPLEMENTATION PROMPT

```
# Milestone Detail Refactoring Implementation

## Context

You are working on the AMSF001 Project Tracker, a React + Supabase application. You need to refactor the MilestoneDetail page to improve maintainability, reduce code duplication, and establish better architectural patterns.

## Project Location

/Users/glennnickols/Projects/amsf001-project-tracker

## Key Files to Modify

1. src/pages/MilestoneDetail.jsx (586 lines) - Main component
2. src/pages/Milestones.jsx - Has duplicate functions to remove
3. src/services/milestones.service.js - Add certificate methods

## Key Files to Create

1. src/lib/milestoneCalculations.js - Shared calculation functions
2. src/lib/formatters.js - Shared formatting utilities
3. src/lib/constants.js - Status constants and colors
4. src/hooks/useMilestonePermissions.js - Permission logic hook
5. src/components/common/SignatureBox.jsx - Reusable signature UI
6. src/components/common/SignatureBox.css - Signature styles

## Implementation Tasks

### Task 1: Create milestoneCalculations.js

Create `src/lib/milestoneCalculations.js` with these exports:
- MILESTONE_STATUS, DELIVERABLE_STATUS, CERTIFICATE_STATUS, BASELINE_STATUS (frozen objects)
- calculateMilestoneStatus(deliverables) - returns status string
- calculateMilestoneProgress(deliverables) - returns 0-100 number
- calculateBaselineStatus(milestone) - returns baseline status string
- canGenerateCertificate(milestone, deliverables, certificate) - returns boolean
- getCertificateStatusInfo(status) - returns { label, cssClass }
- calculateVariance(forecast, baseline) - returns { amount, percentage, direction }

The functions must match the exact logic currently in MilestoneDetail.jsx and Milestones.jsx.

### Task 2: Create formatters.js

Create `src/lib/formatters.js` with these exports:
- formatDate(dateStr, options) - format dates for display
- formatDateForInput(dateStr) - format for input fields (YYYY-MM-DD)
- formatDateTime(dateStr, options) - format with time
- formatCurrency(value, options) - format as £X,XXX.XX
- formatCurrencyWithVariance(value, baseline) - with variance indicator
- formatPercent(value, decimals) - format as X%
- formatNumber(value, decimals) - with thousand separators
- pluralize(count, singular, plural) - return correct form

Use 'en-GB' locale and 'GBP' currency as defaults.

### Task 3: Create constants.js

Create `src/lib/constants.js` with:
- USER_ROLES - { ADMIN, SUPPLIER_PM, CUSTOMER_PM, CONTRIBUTOR, VIEWER }
- All status constants (reuse from milestoneCalculations or import from there)
- STATUS_COLORS - mapping status keys to { bg, text } color objects
- getStatusColor(status) - lookup function

### Task 4: Add service methods

Add to `src/services/milestones.service.js`:

```javascript
async getCertificateByMilestoneId(milestoneId) {
  // Query milestone_certificates where milestone_id = milestoneId
  // Return first result or null
}

async signCertificate(certificateId, signerRole, userId, userName) {
  // signerRole is 'supplier' or 'customer'
  // Update appropriate fields and status
  // If other party already signed, set status to 'Signed'
}
```

### Task 5: Create useMilestonePermissions hook

Create `src/hooks/useMilestonePermissions.js`:
- Accept optional milestone parameter
- Use useAuth to get current user role
- Return object with all permission flags
- Include: canView, canEdit, canDelete, canEditBaseline, canSignBaselineAsSupplier, canSignBaselineAsCustomer, canResetBaseline, canGenerateCertificate, canSignCertificateAsSupplier, canSignCertificateAsCustomer, isBaselineLocked

### Task 6: Create SignatureBox component

Create `src/components/common/SignatureBox.jsx`:
- SignatureBox component with props: role, signedBy, canSign, onSign, saving, variant
- SignatureGrid wrapper component
- DualSignature convenience component

Create matching CSS file.

### Task 7: Update MilestoneDetail.jsx

1. Remove local calculation functions (use imports from milestoneCalculations.js)
2. Remove local format functions (use imports from formatters.js)
3. Replace role checks with useMilestonePermissions hook
4. Replace direct supabase certificate call with service method
5. Add confirmation dialogs for signing actions
6. Replace inline signature UI with SignatureBox components

### Task 8: Update Milestones.jsx

1. Remove local calculation functions (use imports)
2. Remove local format functions (use imports)

## Important Constraints

1. Do NOT change any user-facing functionality
2. All status strings must remain exactly the same
3. Progress calculation formula must not change
4. Maintain all existing CSS class names for styling
5. Test that list view and detail view show identical progress values

## Testing Requirements

After implementation:
1. Navigate to Milestones list - verify progress percentages display
2. Click into a milestone detail - verify same progress percentage
3. Test baseline signing flow for supplier_pm role
4. Test baseline signing flow for customer_pm role
5. Test certificate generation when all deliverables delivered
6. Test certificate signing flow
7. Verify edit modal still works with baseline lock respected

## Git Commit Strategy

Make separate commits for:
1. "feat: Add shared milestone calculation utilities"
2. "feat: Add shared formatting utilities"
3. "feat: Add milestone permissions hook"
4. "refactor: Extract SignatureBox component"
5. "feat: Add certificate service methods"
6. "refactor: Update MilestoneDetail to use shared utilities"
7. "refactor: Update Milestones list to use shared utilities"
```

---

## 7. Testing Checklist

### 7.1 Unit Tests (if implemented)

| Test | File | Expected |
|------|------|----------|
| calculateMilestoneStatus with empty array | milestoneCalculations.test.js | 'Not Started' |
| calculateMilestoneStatus with all delivered | milestoneCalculations.test.js | 'Completed' |
| calculateMilestoneStatus with mixed | milestoneCalculations.test.js | 'In Progress' |
| calculateMilestoneProgress with [100, 50, 50] | milestoneCalculations.test.js | 67 |
| formatCurrency(1234.5) | formatters.test.js | '£1,234.50' |
| formatDate(null) | formatters.test.js | '—' |

### 7.2 Integration Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Progress consistency | View milestone in list, click to detail | Same percentage in both |
| Baseline signing | Sign as supplier PM | Shows signed, awaits customer |
| Baseline lock | Both parties sign | Edit baseline fields disabled |
| Certificate generation | All deliverables delivered, click generate | Certificate created with Draft status |
| Certificate completion | Both parties sign certificate | Shows "Ready to bill" |

### 7.3 Manual Testing Checklist

- [ ] Milestones list page loads without errors
- [ ] Milestone detail page loads without errors
- [ ] Progress percentage matches between list and detail
- [ ] Edit modal opens and saves changes
- [ ] Baseline fields disabled when locked
- [ ] Supplier PM can sign baseline
- [ ] Customer PM can sign baseline
- [ ] Admin can reset baseline
- [ ] Certificate generates when all deliverables delivered
- [ ] Supplier PM can sign certificate
- [ ] Customer PM can sign certificate
- [ ] "Ready to bill" shows when certificate fully signed
- [ ] All confirmation dialogs appear for destructive actions
- [ ] Mobile responsive layout works

---

## 8. Appendix: File Inventory

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| src/lib/milestoneCalculations.js | Shared calculation logic | P0 |
| src/lib/formatters.js | Shared formatting | P1 |
| src/lib/constants.js | Status constants | P1 |
| src/hooks/useMilestonePermissions.js | Permission hook | P2 |
| src/components/common/SignatureBox.jsx | Signature UI | P2 |
| src/components/common/SignatureBox.css | Signature styles | P2 |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| src/services/milestones.service.js | Add getCertificateByMilestoneId, signCertificate | P0 |
| src/pages/MilestoneDetail.jsx | Use shared utilities, hooks, components | P0-P2 |
| src/pages/Milestones.jsx | Use shared utilities | P0-P1 |
| src/components/common/index.js | Export SignatureBox | P2 |

### Files for Reference (Read Only)

| File | Contains |
|------|----------|
| src/pages/MilestoneDetail.css | Current styles (756 lines) |
| src/services/base.service.js | Base service patterns |
| src/lib/permissionMatrix.js | Existing permission structure |
| src/hooks/usePermissions.js | Existing permission hook pattern |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 5 Dec 2025 | Claude | Initial document |

---

*End of Milestone Detail Refactoring Guide*
