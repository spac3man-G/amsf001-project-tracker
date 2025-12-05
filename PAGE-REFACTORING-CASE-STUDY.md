# Page Refactoring Case Study: MilestoneDetail

**Document Version:** 1.0  
**Created:** 5 December 2025  
**Purpose:** Template for refactoring other pages in the AMSF001 Project Tracker

---

## Table of Contents

1. [Page Analysis](#1-page-analysis)
2. [Issues Identified](#2-issues-identified)
3. [Improvement Recommendations](#3-improvement-recommendations)
4. [Implementation Details](#4-implementation-details)
5. [Files Created](#5-files-created)
6. [Files Modified](#6-files-modified)
7. [Refactoring Checklist Template](#7-refactoring-checklist-template)

---

## 1. Page Analysis

### 1.1 Page Purpose

**MilestoneDetail.jsx** is a detail page that displays comprehensive information for a single milestone. Milestones are the primary billing units in the project tracker - they represent major project phases that trigger payment events when completed.

### 1.2 Core Functionality

| Feature | Description |
|---------|-------------|
| **Progress Tracking** | Displays milestone progress calculated from linked deliverables |
| **Schedule Display** | Shows baseline, forecast, and actual dates in three columns |
| **Financial Metrics** | Displays billable amounts with variance from baseline |
| **Deliverables List** | Lists all deliverables linked to this milestone with status |
| **Baseline Commitment** | Dual-signature workflow to lock baseline values |
| **Acceptance Certificate** | Dual-signature workflow for billing approval |

### 1.3 User Workflows

**Workflow 1: View Milestone Details**
- User navigates from Milestones list by clicking a row
- Page loads milestone data, deliverables, and certificate
- Displays progress, schedule, financials, and linked deliverables

**Workflow 2: Baseline Commitment**
- Supplier PM signs to commit baseline values
- Customer PM counter-signs to lock the baseline
- Once locked, baseline fields cannot be edited (except by Admin)

**Workflow 3: Certificate Generation & Signing**
- When all deliverables are "Delivered", certificate can be generated
- Supplier PM signs the certificate
- Customer PM counter-signs
- When fully signed, milestone is "Ready to Bill"

### 1.4 Original File Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | 586 |
| Functions | 16 |
| useState Hooks | 15 |
| Direct Supabase Calls | 1 (certificate fetch) |

---

## 2. Issues Identified

### 2.1 Critical: Duplicated Business Logic

**Severity:** HIGH

The same calculation functions existed in multiple files with identical implementations:

```javascript
// Found in BOTH MilestoneDetail.jsx AND Milestones.jsx
function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) return 'Not Started';
  const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
  const allDelivered = deliverables.every(d => d.status === 'Delivered');
  if (allDelivered) return 'Completed';
  if (allNotStarted) return 'Not Started';
  return 'In Progress';
}

function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
  return Math.round(totalProgress / deliverables.length);
}
```

**Risks:**
- Logic changes require updating multiple files
- Easy to update one and forget the other
- Testing requires verifying both implementations
- No single source of truth

### 2.2 High: Inconsistent Data Access Patterns

**Severity:** MEDIUM-HIGH

The page mixed two different patterns for data access:

```javascript
// Pattern 1: Service layer (CORRECT)
const milestoneData = await milestonesService.getById(id);
const deliverablesData = await deliverablesService.getAll(...);

// Pattern 2: Direct Supabase call (INCONSISTENT)
const { data: certData } = await supabase
  .from('milestone_certificates')
  .select('*')
  .eq('milestone_id', id)
  .limit(1);
```

**Risks:**
- Bypasses service layer error handling
- Bypasses any service layer caching
- Makes testing harder (can't mock service)
- Inconsistent patterns confuse developers

### 2.3 Medium: Duplicated Formatting Functions

**Severity:** MEDIUM

Simple utility functions were reimplemented across 6+ files:

| Function | Files Where Duplicated |
|----------|------------------------|
| `formatDate()` | MilestoneDetail, Milestones, Partners, Expenses, Timesheets, RaidLog |
| `formatCurrency()` | MilestoneDetail, Milestones, Partners, Expenses, Dashboard |
| `getStatusClass()` | MilestoneDetail, Milestones, Deliverables, Resources, Partners |

### 2.4 Medium: Inline Permission Checks

**Severity:** MEDIUM

Role-based permissions were checked inline throughout the component:

```javascript
// Scattered throughout the component
const isAdmin = userRole === 'admin';
const isSupplierPM = userRole === 'supplier_pm';
const isCustomerPM = userRole === 'customer_pm';
const canEdit = isAdmin || isSupplierPM;
const canSignAsSupplier = isAdmin || isSupplierPM;
const canSignAsCustomer = isCustomerPM;

// Later in the file
function canEditBaseline() {
  if (!milestone) return false;
  if (isAdmin) return true;
  if (milestone.baseline_locked) return false;
  return isSupplierPM;
}
```

**Risks:**
- Permission logic duplicated in multiple components
- Changes to role permissions require finding all inline checks
- No centralized permission audit trail

### 2.5 Medium: No Confirmation for Destructive Actions

**Severity:** MEDIUM

Actions like "Reset Baseline Lock" happened immediately on button click:

```javascript
async function resetBaseline() {
  // No confirmation - executes immediately!
  await milestonesService.update(id, {
    baseline_locked: false,
    baseline_supplier_pm_id: null,
    // ... clears all signature data
  });
}
```

### 2.6 Low: Duplicated Signature UI

**Severity:** LOW-MEDIUM

The signature box UI pattern was repeated twice in the same file (baseline + certificate) and could be reused across other dual-signature workflows:

```jsx
{/* Repeated pattern for both baseline and certificate */}
<div className={`signature-box ${supplierSigned ? 'signed' : ''}`}>
  <div className="signature-header">
    <span className="signature-role">Supplier PM</span>
    {supplierSigned && <CheckCircle size={16} />}
  </div>
  {supplierSigned ? (
    <div className="signature-info">...</div>
  ) : canSign && (
    <button onClick={signHandler}>Sign</button>
  )}
</div>
```

---

## 3. Improvement Recommendations

### 3.1 Priority 0 (Immediate): Extract Shared Calculations

**Recommendation:** Create `src/lib/milestoneCalculations.js`

**Contents:**
- Status constants (MILESTONE_STATUS, DELIVERABLE_STATUS, etc.)
- `calculateMilestoneStatus(deliverables)` - Single source of truth
- `calculateMilestoneProgress(deliverables)` - Single source of truth
- `calculateBaselineStatus(milestone)` - Derive baseline status
- `canGenerateCertificate(milestone, deliverables, certificate)` - Business rule
- `getCertificateStatusInfo(status)` - Display helper
- `calculateVariance(forecast, baseline)` - Financial calculation

**Benefits:**
- Single source of truth for business logic
- Testable in isolation
- Reusable across list and detail pages

### 3.2 Priority 0 (Immediate): Move Certificate Operations to Service

**Recommendation:** Add methods to `milestones.service.js`

**New Methods:**
```javascript
getCertificateByMilestoneId(milestoneId)  // Replace direct supabase call
signCertificate(certificateId, signerRole, userId, userName)  // Encapsulate signing logic
signBaseline(milestoneId, signerRole, userId, userName)  // Encapsulate signing logic
resetBaseline(milestoneId)  // Encapsulate reset logic
```

**Benefits:**
- Consistent data access patterns
- Business logic in service layer
- Easier to mock for testing

### 3.3 Priority 1 (Short-term): Create Formatters Utility

**Recommendation:** Create `src/lib/formatters.js`

**Contents:**
- `formatDate(dateStr, options)` - Display dates
- `formatDateForInput(dateStr)` - HTML input fields (YYYY-MM-DD)
- `formatDateTime(dateStr, options)` - Include time
- `formatCurrency(value, options)` - £X,XXX.XX format
- `formatCurrencyWithVariance(value, baseline)` - With +/- indicator
- `formatPercent(value, decimals)` - X% format
- `formatNumber(value, decimals)` - Thousand separators
- `pluralize(count, singular, plural)` - Grammar helper

**Benefits:**
- Consistent formatting across app
- Locale configuration in one place
- Reduced code duplication

### 3.4 Priority 1 (Short-term): Add Confirmation Dialogs

**Recommendation:** Wrap destructive actions in ConfirmDialog

**Actions Requiring Confirmation:**
- Reset Baseline Lock (clears signatures, unlocks editing)
- Generate Certificate (creates billing document)

**Implementation:**
```jsx
<ConfirmDialog
  isOpen={confirmDialog.isOpen}
  title="Reset Baseline Lock?"
  message="This will clear all signatures and unlock baseline editing."
  onConfirm={handleResetBaseline}
  onClose={() => setConfirmDialog({ isOpen: false })}
  type="danger"
/>
```

### 3.5 Priority 2 (Short-term): Create Permission Hook

**Recommendation:** Create `src/hooks/useMilestonePermissions.js`

**Returns:**
```javascript
{
  // User identity
  currentUserId, currentUserName, userRole,
  
  // Role checks
  isAdmin, isSupplierPM, isCustomerPM,
  
  // Basic permissions
  canView, canEdit, canDelete,
  
  // Baseline permissions (context-aware)
  canEditBaseline,           // Considers lock status
  canSignBaselineAsSupplier, // Considers existing signatures
  canSignBaselineAsCustomer,
  canResetBaseline,
  
  // Certificate permissions
  canGenerateCertificate,
  canSignCertificateAsSupplier(certificate),
  canSignCertificateAsCustomer(certificate)
}
```

**Benefits:**
- Centralized permission logic
- Context-aware (considers current data state)
- Reusable across milestone-related components

### 3.6 Priority 2 (Short-term): Extract SignatureBox Component

**Recommendation:** Create `src/components/common/SignatureBox.jsx`

**Components:**
- `SignatureBox` - Individual signature slot
- `SignatureGrid` - Layout wrapper for two boxes
- `DualSignature` - Convenience component for supplier + customer
- `SignatureComplete` - "Ready to bill" indicator

**Usage:**
```jsx
<DualSignature
  supplier={{
    signedBy: milestone.baseline_supplier_pm_name,
    signedAt: milestone.baseline_supplier_pm_signed_at,
    canSign: canSignBaselineAsSupplier,
    onSign: handleSignAsSupplier
  }}
  customer={{
    signedBy: milestone.baseline_customer_pm_name,
    signedAt: milestone.baseline_customer_pm_signed_at,
    canSign: canSignBaselineAsCustomer,
    onSign: handleSignAsCustomer
  }}
  saving={saving}
/>
```

**Benefits:**
- Reusable for any dual-signature workflow
- Consistent UI across baseline and certificate
- Reduces component complexity

---

## 4. Implementation Details

### 4.1 Task 1: milestoneCalculations.js

**File:** `src/lib/milestoneCalculations.js`

**Exports:**
```javascript
// Constants (frozen objects)
export const MILESTONE_STATUS = { NOT_STARTED, IN_PROGRESS, COMPLETED };
export const DELIVERABLE_STATUS = { NOT_STARTED, DRAFT, SUBMITTED, IN_REVIEW, DELIVERED, REJECTED };
export const CERTIFICATE_STATUS = { DRAFT, PENDING_SUPPLIER, PENDING_CUSTOMER, SIGNED };
export const BASELINE_STATUS = { NOT_COMMITTED, AWAITING_SUPPLIER, AWAITING_CUSTOMER, LOCKED };

// Calculation functions
export function calculateMilestoneStatus(deliverables);
export function calculateMilestoneProgress(deliverables);
export function calculateBaselineStatus(milestone);
export function isBaselineLocked(milestone);
export function canGenerateCertificate(milestone, deliverables, certificate);
export function getCertificateStatusInfo(status);
export function isCertificateFullySigned(certificate);
export function getNewCertificateStatus(certificate, signerRole);
export function calculateVariance(forecast, baseline);

// CSS helpers
export function getStatusCssClass(status);
export function getBaselineStatusCssClass(status);
```

### 4.2 Task 2: formatters.js

**File:** `src/lib/formatters.js`

**Exports:**
```javascript
// Date formatting
export function formatDate(dateStr, options);
export function formatDateForInput(dateStr);
export function formatDateTime(dateStr, options);
export function formatRelativeDate(dateStr, locale);

// Currency formatting
export function formatCurrency(value, options);
export function formatCurrencyWithVariance(value, baseline, options);

// Number formatting
export function formatNumber(value, options);
export function formatPercent(value, options);

// Text utilities
export function pluralize(count, singular, plural);
export function formatCount(count, singular, plural);
export function truncate(text, maxLength);

// Hours/Days
export function formatHoursAsDays(hours, options);
```

### 4.3 Task 3: Service Methods

**File:** `src/services/milestones.service.js`

**New Methods Added:**
```javascript
async getCertificateByMilestoneId(milestoneId) {
  // Returns certificate object or null
}

async signCertificate(certificateId, signerRole, userId, userName) {
  // signerRole: 'supplier' | 'customer'
  // Handles status transitions automatically
}

async signBaseline(milestoneId, signerRole, userId, userName) {
  // signerRole: 'supplier' | 'customer'
  // Locks baseline when both parties sign
}

async resetBaseline(milestoneId) {
  // Clears all signatures, unlocks baseline
  // Caller must verify admin permission
}
```

### 4.4 Task 4: useMilestonePermissions Hook

**File:** `src/hooks/useMilestonePermissions.js`

**Usage:**
```javascript
import { useMilestonePermissions } from '../hooks/useMilestonePermissions';

function MilestoneDetail() {
  const [milestone, setMilestone] = useState(null);
  
  // Pass milestone for context-aware permissions
  const permissions = useMilestonePermissions(milestone);
  
  const { 
    canEdit,
    canEditBaseline,           // false when locked (unless admin)
    canSignBaselineAsSupplier, // false when already signed
    canSignCertificateAsSupplier,
    currentUserId,
    currentUserName
  } = permissions;
}
```

### 4.5 Task 5: SignatureBox Component

**File:** `src/components/common/SignatureBox.jsx`

**Components:**
```jsx
// Individual signature box
<SignatureBox
  role="Supplier PM"
  signedBy={name}
  signedAt={timestamp}
  canSign={boolean}
  onSign={handler}
  saving={boolean}
  buttonText="Sign to Commit"
/>

// Two boxes side by side
<SignatureGrid>
  <SignatureBox ... />
  <SignatureBox ... />
</SignatureGrid>

// Convenience wrapper
<DualSignature
  supplier={{ signedBy, signedAt, canSign, onSign }}
  customer={{ signedBy, signedAt, canSign, onSign }}
  saving={boolean}
/>

// Completion indicator
<SignatureComplete message="Ready to bill" />
```

### 4.6 Task 6: Update MilestoneDetail.jsx

**Key Changes:**

1. **Remove local calculation functions** - Import from milestoneCalculations.js
2. **Remove local formatters** - Import from formatters.js
3. **Replace role checks** - Use useMilestonePermissions hook
4. **Replace direct supabase call** - Use getCertificateByMilestoneId service method
5. **Replace inline signing logic** - Use signBaseline, signCertificate service methods
6. **Replace signature UI** - Use DualSignature component
7. **Add confirmation dialogs** - For reset baseline and generate certificate

**Before (586 lines):**
```javascript
import { supabase } from '../lib/supabase';

// Local functions duplicated from Milestones.jsx
function calculateMilestoneStatus(deliverables) { ... }
function calculateMilestoneProgress(deliverables) { ... }
function formatDate(dateStr) { ... }
function formatCurrency(value) { ... }

// Inline role checks
const isAdmin = userRole === 'admin';
const canEdit = isAdmin || isSupplierPM;

// Direct supabase call
const { data: certData } = await supabase
  .from('milestone_certificates')
  .select('*')
  .eq('milestone_id', id);

// Inline signature UI (repeated twice)
<div className="signature-box">...</div>
```

**After (~500 lines):**
```javascript
import { useMilestonePermissions } from '../hooks/useMilestonePermissions';
import { DualSignature, ConfirmDialog } from '../components/common';
import { calculateMilestoneStatus, calculateMilestoneProgress, ... } from '../lib/milestoneCalculations';
import { formatDate, formatCurrency } from '../lib/formatters';

// Clean permission access
const { canEdit, canEditBaseline, canSignBaselineAsSupplier, ... } = useMilestonePermissions(milestone);

// Service layer data access
const certData = await milestonesService.getCertificateByMilestoneId(id);

// Service layer operations
await milestonesService.signBaseline(id, 'supplier', currentUserId, currentUserName);

// Reusable signature component
<DualSignature supplier={{...}} customer={{...}} />

// Confirmation for destructive actions
<ConfirmDialog isOpen={...} title="Reset Baseline?" ... />
```

### 4.7 Task 7: Update Milestones.jsx

**Key Changes:**

1. **Remove local calculation functions** - Import from milestoneCalculations.js
2. **Remove local formatters** - Import from formatters.js
3. **Use service method for signing** - Replace inline certificate signing logic

**Before:**
```javascript
function calculateMilestoneStatus(deliverables) { ... }
function calculateMilestoneProgress(deliverables) { ... }

// Inline date formatting
{new Date(milestone.forecast_end_date).toLocaleDateString('en-GB')}

// Inline currency formatting
£{(milestone.billable || 0).toLocaleString()}

// Inline signing logic
const updates = {
  supplier_pm_id: currentUserId,
  supplier_pm_name: currentUserName,
  supplier_pm_signed_at: new Date().toISOString(),
  status: certificate.customer_pm_signed_at ? 'Signed' : 'Pending Customer Signature'
};
await milestonesService.updateCertificate(certificate.id, updates);
```

**After:**
```javascript
import { calculateMilestoneStatus, calculateMilestoneProgress, getCertificateStatusInfo } from '../lib/milestoneCalculations';
import { formatDate, formatCurrency } from '../lib/formatters';

// Use shared functions
const computedStatus = calculateMilestoneStatus(milestoneDeliverables[m.id]);
const computedProgress = calculateMilestoneProgress(milestoneDeliverables[m.id]);

// Consistent formatting
{formatDate(milestone.forecast_end_date)}
{formatCurrency(milestone.billable)}

// Service handles status transitions
await milestonesService.signCertificate(certificate.id, 'supplier', currentUserId, currentUserName);
```

---

## 5. Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/milestoneCalculations.js` | Shared calculation logic | ~250 |
| `src/lib/formatters.js` | Shared formatting utilities | ~200 |
| `src/hooks/useMilestonePermissions.js` | Permission hook | ~120 |
| `src/components/common/SignatureBox.jsx` | Signature UI components | ~130 |
| `src/components/common/SignatureBox.css` | Signature styles | ~80 |

---

## 6. Files Modified

| File | Changes |
|------|---------|
| `src/pages/MilestoneDetail.jsx` | Refactored to use shared utilities, ~80 lines removed |
| `src/pages/Milestones.jsx` | Refactored to use shared utilities, ~30 lines removed |
| `src/services/milestones.service.js` | Added 4 new methods (~100 lines) |
| `src/components/common/index.js` | Added SignatureBox exports |
| `src/hooks/index.js` | Added useMilestonePermissions export |

---

## 7. Refactoring Checklist Template

Use this checklist when refactoring other pages:

### Analysis Phase

- [ ] Document the page's primary purpose
- [ ] List all user workflows the page supports
- [ ] Count lines of code, functions, and state variables
- [ ] Identify any direct database calls (should use service layer)
- [ ] List all local utility functions

### Identify Issues

- [ ] **Duplicated logic?** Check if calculation/business logic exists elsewhere
- [ ] **Duplicated formatters?** Check formatDate, formatCurrency, etc.
- [ ] **Inconsistent data access?** Direct supabase calls vs service layer
- [ ] **Inline permissions?** Role checks scattered through component
- [ ] **Missing confirmations?** Destructive actions without warning
- [ ] **Repeated UI patterns?** Same JSX structure used multiple times

### Plan Improvements

- [ ] List functions to extract to utility libraries
- [ ] List service methods to create
- [ ] List permission checks to centralize
- [ ] List UI patterns to extract as components
- [ ] List actions needing confirmation dialogs
- [ ] Prioritize: P0 (immediate), P1 (short-term), P2 (medium-term)

### Implementation

- [ ] Create utility files with shared functions
- [ ] Add service layer methods
- [ ] Create/update permission hooks
- [ ] Create reusable components
- [ ] Update page to use new utilities
- [ ] Add confirmation dialogs
- [ ] Update related pages that share the same logic

### Verification

- [ ] Run `npm run build` - verify no errors
- [ ] Test all user workflows manually
- [ ] Verify list and detail pages show same calculated values
- [ ] Test permission-restricted actions with different roles
- [ ] Commit with descriptive message

---

## Appendix: Related Pages for Similar Refactoring

Based on this case study, the following pages likely need similar treatment:

| Page | Likely Issues |
|------|---------------|
| **DeliverableDetail.jsx** | Duplicated status calculations, inline formatters |
| **ResourceDetail.jsx** | Utilization calculations may be duplicated |
| **PartnerDetail.jsx** | Invoice calculations, formatters |
| **ExpenseDetail.jsx** | Formatting, status logic |
| **TimesheetDetail.jsx** | Hour calculations, validation logic |

---

*Page Refactoring Case Study | MilestoneDetail | 5 December 2025*
