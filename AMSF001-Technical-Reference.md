# AMSF001 Project Tracker - Technical Reference

**Last Updated:** 6 December 2025  
**Version:** 3.0  
**Production Readiness:** 100%

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Architecture Overview](#2-architecture-overview)
3. [Shared Utilities Architecture](#3-shared-utilities-architecture)
4. [Dual-Signature Workflows](#4-dual-signature-workflows)
5. [Apple Design System](#5-apple-design-system)
6. [Supabase Configuration](#6-supabase-configuration)
7. [Vercel Configuration](#7-vercel-configuration)
8. [Service Layer](#8-service-layer)
9. [UI Component Patterns](#9-ui-component-patterns)
10. [AI Chat System](#10-ai-chat-system)
11. [In-App Help System](#11-in-app-help-system)
12. [SQL Migrations](#12-sql-migrations)
13. [Local Development](#13-local-development)
14. [Recent Changes](#14-recent-changes)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Quick Reference

### Key URLs

| Service | URL |
|---------|-----|
| Live Application | https://amsf001-project-tracker.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |

### Local Paths

| Item | Path |
|------|------|
| Project Root | /Users/glennnickols/Projects/amsf001-project-tracker |
| Source Code | /Users/glennnickols/Projects/amsf001-project-tracker/src |
| SQL Scripts | /Users/glennnickols/Projects/amsf001-project-tracker/sql |
| API Functions | /Users/glennnickols/Projects/amsf001-project-tracker/api |
| Help Content | /Users/glennnickols/Projects/amsf001-project-tracker/src/help |

### Key Commands

```bash
# Start development
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Deploy (automatic via git push)
git add -A && git commit -m "message" && git push
```

---

## 2. Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Apple Design System (Custom CSS) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (Pro) |
| AI | Anthropic Claude 4.5 Sonnet/Haiku |

### Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Core UI (ActionButtons, Card, FilterBar)
│   ├── common/             # Shared components (SignatureBox, LoadingSpinner)
│   ├── chat/               # AI Chat components
│   ├── help/               # Help drawer and button
│   ├── timesheets/         # Timesheet components + modal
│   ├── expenses/           # Expense components + modal
│   ├── deliverables/       # Deliverable components + modal
│   ├── milestones/         # Milestone table component
│   └── networkstandards/   # Network standards + modal
├── contexts/               # React contexts (Auth, Project, Toast, Help)
├── hooks/                  # Custom hooks (usePermissions, useMilestonePermissions, useDeliverablePermissions)
├── lib/                    # Utilities (supabase, permissions, calculations, formatters)
├── help/                   # Help content definitions
├── pages/                  # Page components (with dedicated CSS)
├── services/               # Data service layer (18 services)
└── styles/                 # Global CSS
```

### Role Hierarchy

| Role | Level | Capabilities |
|------|-------|--------------|
| admin | 5 | Full system access, no workflow notifications |
| supplier_pm | 4 | Full access + validates timesheets/expenses |
| customer_pm | 3 | Reviews deliverables, validates timesheets |
| contributor | 2 | Submits timesheets & expenses, edits deliverable progress |
| viewer | 1 | Read-only dashboard access |

---

## 3. Shared Utilities Architecture

### Overview

The application uses centralised utility modules to eliminate code duplication and ensure consistent business logic across components.

### Calculation Modules

| File | Purpose |
|------|---------|
| `src/lib/milestoneCalculations.js` | Milestone status, progress, financial calculations |
| `src/lib/deliverableCalculations.js` | Deliverable status, workflow state, sign-off logic |
| `src/lib/formatters.js` | Date, currency, and number formatting |
| `src/lib/metricsConfig.js` | Hour-to-day conversions, financial metrics |

### milestoneCalculations.js

```javascript
// Status constants
export const MILESTONE_STATUS = { NOT_STARTED, IN_PROGRESS, COMPLETED };
export const COMMITMENT_STATUS = { NOT_SIGNED, AWAITING_SUPPLIER, AWAITING_CUSTOMER, COMMITTED };
export const CERTIFICATE_STATUS = { NONE, PENDING, AWAITING_SUPPLIER, AWAITING_CUSTOMER, BOTH_SIGNED };

// Core functions
export function calculateMilestoneStatus(progress);
export function calculateCommitmentStatus(milestone);
export function calculateCertificateStatus(certificate);
export function calculateProgressFromDeliverables(deliverables);
export function canSupplierSign(milestone);
export function canCustomerSign(milestone);
```

### deliverableCalculations.js

```javascript
// Status constants
export const DELIVERABLE_STATUS = { 
  NOT_STARTED, IN_PROGRESS, SUBMITTED_FOR_REVIEW, 
  RETURNED_FOR_MORE_WORK, REVIEW_COMPLETE, DELIVERED 
};
export const SIGN_OFF_STATUS = { NOT_SIGNED, AWAITING_SUPPLIER, AWAITING_CUSTOMER, SIGNED };

// Core functions
export function getStatusConfig(status);           // Returns { bg, color, icon }
export function getAutoTransitionStatus(current, progress);
export function isProgressSliderDisabled(status);
export function canSubmitForReview(deliverable);
export function canReviewDeliverable(deliverable);
export function canStartDeliverySignOff(deliverable);
export function isDeliverableComplete(deliverable);
export function calculateSignOffStatus(deliverable);
export function canSupplierSign(deliverable);
export function canCustomerSign(deliverable);
```

### formatters.js

```javascript
export function formatDate(dateString);           // "15 Jan 2025"
export function formatDateTime(dateString);       // "15 Jan 2025, 14:30"
export function formatCurrency(amount, symbol);   // "£1,234.56"
export function formatNumber(num, decimals);      // "1,234.56"
export function formatPercentage(value);          // "85%"
```

### Permission Hooks

| Hook | Purpose |
|------|---------|
| `usePermissions` | General role-based permissions |
| `useMilestonePermissions` | Milestone-specific actions (sign, edit, delete) |
| `useDeliverablePermissions` | Deliverable-specific actions (submit, review, sign) |

### useDeliverablePermissions Hook

```javascript
const {
  // Role checks
  isAdmin, isSupplierPM, isCustomerPM, isContributor,
  
  // Basic permissions
  canCreate, canEdit, canDelete,
  
  // Workflow permissions
  canSubmit, canReview, canAcceptReview, canRejectReview,
  
  // Dual-signature permissions
  canSignAsSupplier, canSignAsCustomer, isFullySigned
} = useDeliverablePermissions(deliverable);
```

### Field-Level Edit Permissions (Deliverables)

| Field | Who Can Edit |
|-------|-------------|
| Name | Supplier PM, Admin |
| Milestone | Supplier PM, Admin |
| Description | Supplier PM, Admin, Contributor |
| Progress | Supplier PM, Admin, Contributor |

---

## 4. Dual-Signature Workflows

### Overview

Critical project agreements require both Supplier PM and Customer PM signatures. This ensures mutual commitment before work begins or payments are triggered.

### Workflow Types

| Workflow | When Used | Trigger |
|----------|-----------|---------|
| Baseline Commitment | Before milestone work begins | Locks baseline dates and budget |
| Acceptance Certificate | When milestone reaches 100% | Authorises billing |
| Deliverable Sign-off | When deliverable review is complete | Marks deliverable as Delivered |

### Signature Flow

```
                 Either party can sign first
                          │
           ┌──────────────┴──────────────┐
           ▼                              ▼
    ┌─────────────┐                ┌─────────────┐
    │  Supplier   │                │  Customer   │
    │  PM Signs   │                │  PM Signs   │
    └──────┬──────┘                └──────┬──────┘
           │                              │
           ▼                              ▼
    ┌─────────────┐                ┌─────────────┐
    │  Awaiting   │                │  Awaiting   │
    │  Customer   │                │  Supplier   │
    └──────┬──────┘                └──────┬──────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
                 ┌─────────────────┐
                 │   BOTH SIGNED   │
                 │  (Action fires) │
                 └─────────────────┘
```

### Database Columns (Deliverables)

```sql
-- Added by P10-deliverable-signatures.sql
supplier_pm_id UUID,
supplier_pm_name TEXT,
supplier_pm_signed_at TIMESTAMPTZ,
customer_pm_id UUID,
customer_pm_name TEXT,
customer_pm_signed_at TIMESTAMPTZ,
sign_off_status TEXT DEFAULT 'Not Signed'
```

### Sign-Off Status Values

| Status | Meaning |
|--------|---------|
| Not Signed | No signatures yet |
| Awaiting Supplier | Customer signed, waiting for Supplier |
| Awaiting Customer | Supplier signed, waiting for Customer |
| Signed | Both parties have signed |

### Service Method: signDeliverable

```javascript
// src/services/deliverables.service.js
async signDeliverable(deliverableId, signerRole, userId, userName) {
  // 1. Get current deliverable
  // 2. Update appropriate signature fields
  // 3. Calculate new sign-off status
  // 4. If both signed: status = 'Delivered', progress = 100
  // 5. Return updated deliverable
}
```

### Shared Component: SignatureBox

```jsx
// src/components/common/SignatureBox.jsx
<DualSignature
  supplier={{
    signedBy: milestone.supplier_pm_name,
    signedAt: milestone.supplier_pm_signed_at,
    canSign: permissions.canSignAsSupplier,
    onSign: handleSupplierSign
  }}
  customer={{
    signedBy: milestone.customer_pm_name,
    signedAt: milestone.customer_pm_signed_at,
    canSign: permissions.canSignAsCustomer,
    onSign: handleCustomerSign
  }}
  saving={isSaving}
/>
```

---

## 5. Apple Design System

### Overview

The application uses a custom Apple-inspired design system implemented consistently across all pages. Each page has its own CSS file with shared design tokens.

### Design Tokens

```css
/* Color Palette */
--color-primary: #007aff;      /* Blue - actions */
--color-success: #34c759;      /* Green - positive */
--color-warning: #ff9500;      /* Orange - caution */
--color-danger: #ff3b30;       /* Red - destructive */
--color-purple: #af52de;       /* Purple - special */
--color-teal: #0d9488;         /* Teal - primary accent */

/* Text Colors */
--color-text-primary: #1d1d1f;
--color-text-secondary: #86868b;
--color-text-tertiary: #aeaeb2;

/* Background Colors */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f5f5f7;
--color-bg-tertiary: #fafafa;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
```

### Design Principles

1. **Clean Headers** - Sticky with backdrop blur, icon + title + subtitle
2. **No Dashboard Cards on List Pages** - Stats/metrics only on Dashboard
3. **Click-to-Navigate** - Full row clickability, no separate "view" buttons
4. **Inline Actions Only** - Status toggles use stopPropagation
5. **Consistent Tables** - Clean borders, hover states, proper spacing

---

## 6. Supabase Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ljqpmrcqxzgcfojrkxce |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro |

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| milestones | All auth users | Admin, Supplier PM | Admin, Supplier PM | Admin, Supplier PM |
| deliverables | All auth users | Admin, Supplier PM | Admin, Supplier PM, Contributors | Admin, Supplier PM |
| timesheets | All auth users | All (own) | Own or Admin/PM | Own Draft or Admin |
| expenses | All auth users | All (own) | Own or Admin/PM | Own Draft or Admin |

### Permission Matrix

The application uses a centralized Permission Matrix (`src/lib/permissionMatrix.js`) as the **single source of truth** for role-based access control.

---

## 7. Vercel Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-project-tracker |
| Framework | Vite |
| Node Version | 22.x |
| Team ID | team_earXYyEn9jCrxby80dRBGlfP |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| VITE_SUPABASE_URL | Supabase project URL | Yes |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| ANTHROPIC_API_KEY | Claude AI API key | For AI features |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | For AI Chat |

---

## 8. Service Layer

### Services (18 total)

```
src/services/
├── index.js                    # Barrel export
├── base.service.js             # Base CRUD operations
├── deliverables.service.js     # Deliverables + signDeliverable()
├── milestones.service.js       # Milestones + certificates
├── timesheets.service.js       # Timesheets + submit/validate
├── expenses.service.js         # Expenses + submit/validate
└── ... (14 more services)
```

### Key Service Methods

**deliverablesService:**
- `signDeliverable(id, role, userId, userName)` - Record dual signature
- `syncKPILinks(id, kpiIds)` - Link KPIs to deliverable
- `syncQSLinks(id, qsIds)` - Link Quality Standards
- `upsertKPIAssessments(id, assessments, userId)` - Record KPI results
- `upsertQSAssessments(id, assessments, userId)` - Record QS results

**milestonesService:**
- `signBaseline(id, role, userId, userName)` - Sign baseline commitment
- `createCertificate(milestoneId, data)` - Create acceptance certificate
- `signCertificate(certId, role, userId, userName)` - Sign certificate

---

## 9. UI Component Patterns

### Detail Modal Components

```
src/components/
├── deliverables/DeliverableDetailModal.jsx  # View, edit, workflow, sign-off
├── timesheets/TimesheetDetailModal.jsx      # Validate/Reject
├── expenses/ExpenseDetailModal.jsx          # Validate/Reject
└── common/SignatureBox.jsx                  # Shared signature UI
```

### DeliverableDetailModal Features

- **View Mode**: Shows milestone, due date, progress, KPIs, QS, sign-off status
- **Edit Mode**: Field-level permissions (name/milestone: Supplier PM only)
- **Workflow Actions**: Submit for Review, Accept/Reject Review
- **Dual-Signature**: Sign as Supplier PM or Customer PM
- **Status Display**: Auto-generated badges with icons

---

## 10. AI Chat System

### Three-Tier Architecture

| Tier | Response Time | Model | Purpose |
|------|---------------|-------|---------|
| 1 | ~100ms | None (local) | Pre-fetched context answers |
| 2 | 1-2s | Haiku (streaming) | Simple queries |
| 3 | 3-5s | Sonnet (tools) | Complex database queries |

---

## 11. In-App Help System

### Architecture

| Layer | File | Purpose |
|-------|------|---------|
| Content | `src/help/helpContent.js` | Page-specific help definitions |
| State | `src/contexts/HelpContext.jsx` | Open/close state, keyboard shortcuts |
| UI | `src/components/help/HelpDrawer.jsx` | Slide-out drawer component |
| Trigger | `src/components/help/HelpButton.jsx` | Floating action button |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` or `F1` | Toggle help drawer |
| `Escape` | Close help drawer |

### Help Content Structure

```javascript
{
  title: 'Page Title',
  icon: LucideIconComponent,
  description: 'Brief description of the page',
  sections: [
    { heading: 'Section', type: 'list', content: ['Item 1', 'Item 2'] },
    { heading: 'Section', type: 'text', content: 'Paragraph text' }
  ],
  tips: ['Tip 1', 'Tip 2'],
  relatedTopics: ['otherPage', 'anotherPage']
}
```

### Route-to-Help Mapping

| Route | Help Key |
|-------|----------|
| `/dashboard` | dashboard |
| `/milestones` | milestones |
| `/milestones/:id` | milestoneDetail |
| `/deliverables` | deliverables |
| `/resources` | resources |
| `/timesheets` | timesheets |
| `/expenses` | expenses |

---

## 12. SQL Migrations

### Migration Status

| Script | Purpose | Status |
|--------|---------|--------|
| P3a-add-partner-id-to-resources.sql | Link resources to partners | ✅ Deployed |
| P4-add-procurement-method-to-expenses.sql | Expense tracking | ✅ Deployed |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Deployed |
| P5b-partner-invoices-rls.sql | Invoice RLS policies | ✅ Deployed |
| P6-enhanced-invoice-lines.sql | Invoice line items | ✅ Deployed |
| P7-receipt-scanner.sql | Receipt scanner tables | ✅ Deployed |
| P8-deliverables-contributor-access.sql | Contributors edit | ✅ Deployed |
| P9-milestone-update-rls.sql | Milestone RLS | ✅ Deployed |
| P10-deliverable-signatures.sql | Deliverable dual-signature | ⏳ Pending |
| audit-triggers.sql | Audit logging | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete | ✅ Deployed |

---

## 13. Local Development

### Setup

```bash
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker
npm install
cp .env.example .env  # Edit with your keys
npm run dev
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server (localhost:5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 14. Recent Changes

### 6 December 2025 - Deliverables Phase 3 & Help System

**Deliverable Dual-Signature Workflow**
- Added signature columns to deliverables table (P10 migration)
- Implemented `signDeliverable()` service method
- Updated DeliverableDetailModal with sign-off section
- Field-level edit permissions (name/milestone: Supplier PM only)
- Removed `assigned_to` field (not used in this system)

**In-App Help System**
- Created HelpContext for state management
- Built HelpDrawer slide-out component
- Added floating HelpButton
- Keyboard shortcuts: ? and F1 to toggle, Escape to close
- 13 pages of contextual help content
- Related topics navigation

**Documentation Updates**
- User Guide v6.0 with comprehensive workflow documentation
- Technical Reference v3.0 with shared utilities architecture

### 5 December 2025 - Milestone Refactoring

**Shared Utilities**
- Created `milestoneCalculations.js` for status/progress logic
- Created `formatters.js` for date/currency formatting
- Created `useMilestonePermissions` hook
- Implemented `SignatureBox` shared component

**Apple Design System**
- Completed design system across all pages
- Click-to-navigate pattern everywhere
- Removed dashboard cards from list pages

---

## 15. Troubleshooting

### Build Failures

**Error:** Could not resolve "./PageName.css"
- Create the missing CSS file or remove the import

**Error:** Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Error:** RLS policy violation
- Check user role in profiles table
- Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'tablename'`

### Dual-Signature Not Working

**Symptoms:** Sign button doesn't appear or doesn't work
- Verify user has correct role (Supplier PM or Customer PM)
- Check deliverable is in correct status (Review Complete for sign-off)
- Ensure P10 migration has been applied

---

*AMSF001 Technical Reference | Version 3.0 | 6 December 2025*
