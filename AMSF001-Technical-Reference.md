# AMSF001 Project Tracker - Technical Reference

**Last Updated:** 4 December 2025  
**Version:** 1.0  
**Production Readiness:** 98%

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Architecture Overview](#2-architecture-overview)
3. [Supabase Configuration](#3-supabase-configuration)
4. [Vercel Configuration](#4-vercel-configuration)
5. [Service Layer](#5-service-layer)
6. [UI Component Patterns](#6-ui-component-patterns)
7. [SQL Migrations](#7-sql-migrations)
8. [Local Development](#8-local-development)
9. [Recent Changes](#9-recent-changes)
10. [Troubleshooting](#10-troubleshooting)

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
| Styling | Tailwind CSS + Custom CSS Variables |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel |
| AI | Anthropic Claude 4.5 Sonnet |

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Core UI (ActionButtons, Card, FilterBar)
│   ├── timesheets/     # Timesheet components + modal
│   ├── expenses/       # Expense components + modal
│   ├── deliverables/   # Deliverable components + modal
│   ├── milestones/     # Milestone table component
│   └── networkstandards/  # Network standards + modal
├── contexts/           # React contexts (Auth, Project, Toast)
├── hooks/              # Custom hooks (usePermissions, useFormValidation)
├── lib/                # Utilities (supabase client, permissions)
├── pages/              # Page components
├── services/           # Data service layer (18 services)
└── styles/             # Global CSS
```

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| admin | 5 | Full system access |
| supplier_pm | 4 | Supplier project management |
| customer_pm | 3 | Customer-side approval authority |
| contributor | 2 | Submit timesheets, expenses, edit deliverables |
| viewer | 1 | Read-only access |


---

## 3. Supabase Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ljqpmrcqxzgcfojrkxce |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro |

### API Keys

```env
VITE_SUPABASE_URL=https://ljqpmrcqxzgcfojrkxce.supabase.co
VITE_SUPABASE_ANON_KEY=[From Supabase Dashboard > Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[Server-side only - for AI Chat queries]
```

### Database Tables (35+)

**Core Tables:**
- projects, milestones, deliverables, milestone_certificates
- resources, timesheets, expenses, resource_allocations
- partners, partner_invoices, partner_invoice_lines
- kpis, quality_standards, risks, issues
- profiles, audit_log, deleted_items
- dashboard_layouts, notifications

**AI Feature Tables:**
- receipt_scans, expense_classification_rules

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| milestones | All auth users | Admin, Supplier PM | Admin, Supplier PM | Admin, Supplier PM |
| deliverables | All auth users | Admin, Supplier PM | Admin, Supplier PM, Contributors | Admin, Supplier PM |
| timesheets | All auth users | All (own) | Own or Admin | Own Draft or Admin |
| expenses | All auth users | All (own) | Own or Admin | Own Draft or Admin |

### Permission Matrix

The application uses a centralized Permission Matrix (`src/lib/permissionMatrix.js`) as the **single source of truth** for role-based access control.

**Key Files:**
- `src/lib/permissionMatrix.js` - Defines all permissions
- `src/lib/permissions.js` - Backward-compatible exports
- `src/hooks/usePermissions.js` - React hook for components

---

## 4. Vercel Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-project-tracker |
| Framework | Vite |
| Node Version | 22.x |
| Plan | Pro |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| VITE_SUPABASE_URL | Supabase project URL | Yes |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| ANTHROPIC_API_KEY | Claude AI API key | For AI features |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | For AI Chat |

### Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

---

## 5. Service Layer

### Services (18 total)

```
src/services/
├── index.js                    # Barrel export
├── base.service.js             # Base CRUD operations
├── auth.service.js             # Authentication
├── projects.service.js         # Project management
├── milestones.service.js       # Milestones
├── deliverables.service.js     # Deliverables
├── resources.service.js        # Resources
├── timesheets.service.js       # Timesheets
├── expenses.service.js         # Expenses
├── partners.service.js         # Partners
├── invoicing.service.js        # Partner invoicing
├── kpis.service.js             # KPIs
├── qualityStandards.service.js # Quality standards
├── dashboard.service.js        # Dashboard layouts
├── auditLog.service.js         # Audit logging
├── deletedItems.service.js     # Soft delete recovery
├── receiptScanner.service.js   # AI receipt scanning
└── notifications.service.js    # Notifications
```

### Important Pattern: Avoid .single()

All services use `.select()` + array access instead of `.single()` to avoid RLS-related errors:

```javascript
// ❌ Don't use - fails with RLS
const { data, error } = await supabase
  .from('table')
  .update(updates)
  .eq('id', id)
  .single();

// ✅ Use this pattern
const { data, error } = await supabase
  .from('table')
  .update(updates)
  .eq('id', id)
  .select();

return data?.[0];
```


---

## 6. UI Component Patterns

### Table Row Clickability

All list pages use full row clickability for consistent UX:

```jsx
// Import
import { useNavigate } from 'react-router-dom';

// Hook
const navigate = useNavigate();

// Table row
<tr 
  className="table-row-clickable hover:bg-gray-50"
  onClick={() => navigate(`/path/${item.id}`)}
  style={{ cursor: 'pointer' }}
>
  {/* Data cells - clickable */}
  <td>{item.name}</td>
  
  {/* Action cells - NOT clickable */}
  <td onClick={(e) => e.stopPropagation()}>
    <button onClick={handleEdit}>Edit</button>
  </td>
</tr>
```

### Inline Editing Exception

For pages with inline editing (Resources, QualityStandards):

```jsx
<tr 
  onClick={() => !isEditing && navigate(`/path/${item.id}`)}
  style={{ cursor: isEditing ? 'default' : 'pointer' }}
  className={isEditing ? '' : 'table-row-clickable'}
>
```

### Pages with Full Row Click

| Page | Target | Special Handling |
|------|--------|------------------|
| KPIs.jsx | `/kpis/${id}` | Actions stopPropagation |
| QualityStandards.jsx | `/quality-standards/${id}` | Disabled during editing |
| MilestoneTable.jsx | `/milestones/${id}` | Certificate + Actions |
| Resources.jsx | `/resources/${id}` | Disabled during editing |
| Partners.jsx | `/partners/${id}` | Email + Status + Actions |

### Detail Modal Components

```
src/components/
├── timesheets/TimesheetDetailModal.jsx    # Validate/Reject
├── expenses/ExpenseDetailModal.jsx        # Validate/Reject
├── deliverables/DeliverableDetailModal.jsx # Submit/Review/Deliver
└── networkstandards/NetworkStandardDetailModal.jsx # Edit status
```

---

## 7. SQL Migrations

### Location
`/Users/glennnickols/Projects/amsf001-project-tracker/sql/`

### Migration Status

| Script | Purpose | Status |
|--------|---------|--------|
| P3a-add-partner-id-to-resources.sql | Link resources to partners | ✅ Deployed |
| P4-add-procurement-method-to-expenses.sql | Expense tracking | ✅ Deployed |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Deployed |
| P5b-partner-invoices-rls.sql | Invoice RLS policies | ✅ Deployed |
| P6-enhanced-invoice-lines.sql | Invoice line items | ✅ Deployed |
| P7-receipt-scanner.sql | Receipt scanner tables | ✅ Deployed |
| P8-deliverables-contributor-access.sql | Contributors edit | ⏳ Pending |
| **P9-milestone-update-rls.sql** | **Milestone RLS** | **⏳ PENDING** |
| audit-triggers.sql | Audit logging | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete | ✅ Deployed |
| data-integrity-constraints.sql | Data validation | ✅ Deployed |

### Deploying P9 (URGENT)

**Issue:** Milestone edits fail with "No record found" error  
**Cause:** Missing UPDATE RLS policy

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/P9-milestone-update-rls.sql`
3. Run the script
4. Verify: `SELECT * FROM pg_policies WHERE tablename = 'milestones'`

---

## 8. Local Development

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase keys

# Start development server
npm run dev
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server (localhost:5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |


---

## 9. Recent Changes

### 4 December 2025

**Phase I-III: Financial Calculations Refactoring**
- Centralized all `/ 8` hour-to-day calculations into `metricsConfig.js`
- Added utility functions: `hoursToDays()`, `daysToHours()`, `calculateBillableValue()`, `calculateCostValue()`
- Renamed database columns: `resources.daily_rate` → `sell_price`, `milestones.budget` → `billable`
- Removed unused columns: `discount_percent`, `discounted_rate`, `payment_percent`
- Commits: `55fc0976`, `65d99432`

**Dashboard Widgets**
- Added TimesheetsWidget (Submitted/Validated counts + £ values)
- Added ExpensesWidget (Awaiting/Validated totals, Chargeable/Non-Chargeable breakdown)
- Updated grid from 3 to 4 columns
- All widgets exclude deleted and rejected items
- Commits: `973d604a`, `c789bdc8`

### 3 December 2025

**UI Consistency - Full Row Clickability**
- Made all list page rows fully clickable
- Added stopPropagation for action buttons
- Removed redundant ExternalLink icons
- Commit: `f463150b`

**Detail Modals**
- Added TimesheetDetailModal, ExpenseDetailModal
- Added DeliverableDetailModal, NetworkStandardDetailModal
- Workflow actions in modals (Validate/Reject, Submit/Review/Deliver)

**AI Model Upgrade**
- Upgraded from Claude 3 Haiku to Claude 4.5 Sonnet
- Improved reasoning and data analysis

**Terminology Update**
- Changed "Approved" → "Validated" throughout application

**Supabase .single() Fix**
- Replaced all `.single()` calls with `.select()` + array access
- Fixes RLS-related "Cannot coerce" errors
- Commit: `f3c3f802`

### 2 December 2025

**Apple Design System**
- Modern Minimalist design with teal color scheme
- Centralized UI components
- Dashboard redesign with hero metrics

**Component Refactoring**
- PartnerDetail.jsx: 1,493 → 585 lines (61% reduction)
- Milestones.jsx: 1,274 → 443 lines (65% reduction)
- ResourceDetail.jsx: 1,117 → 423 lines (62% reduction)

### 1 December 2025

**AI Chat Assistant**
- 12 database query tools
- Role-based data scoping
- Copy, export, persistence features

**Smart Receipt Scanner**
- AI-powered receipt data extraction
- Category classification with learning

---

## 10. Troubleshooting

### Milestone Update Errors

**Error:** "No record found with id: [uuid]"
- **Cause:** Missing RLS UPDATE policy
- **Solution:** Run `sql/P9-milestone-update-rls.sql` in Supabase

**Error:** "Cannot coerce the result to a single JSON object"
- **Cause:** Old code using `.single()` method
- **Solution:** Already fixed in codebase (commit f3c3f802)

### Build Failures

**Error:** Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Error:** RLS policy violation
- Check user has correct role in profiles table
- Verify RLS policies exist for the operation
- Use: `SELECT * FROM pg_policies WHERE tablename = 'tablename'`

### Vercel Deployment Issues

**Error:** Build fails on Vercel but works locally
- Check environment variables are set in Vercel dashboard
- Verify Node.js version matches (22.x)

### AI Features Not Working

**Error:** AI Chat returns errors
- Verify `ANTHROPIC_API_KEY` is set in Vercel
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Check API function logs in Vercel dashboard

---

## Appendix: File Inventory

### Feature Specifications (Root Directory)

| File | Purpose |
|------|---------|
| AI-CHAT-ASSISTANT-SPEC.md | AI assistant requirements |
| SMART-RECEIPT-SCANNER-SPEC.md | Receipt scanner specification |
| DASHBOARD-CUSTOMIZATION-SPEC.md | Dashboard drag-and-drop spec |
| ROADMAP-2025-12.md | Development roadmap |

### Archived Documentation
Old versioned documents are in `/docs/archive/` for reference.

---

*AMSF001 Technical Reference | Last Updated: 3 December 2025*
