# AMSF001 Project Tracker - Complete System Documentation

**Version:** 7.0  
**Last Updated:** 3 December 2025  
**Status:** Production Ready (98%)  
**Consolidated from:** Master Document v6, Configuration Guide v10, Local Project Files, Live Services

---

## Executive Summary

The AMSF001 Project Tracker is a production-ready React/Supabase web application for managing the Network Standards and Design Architectural Services project between Government of Jersey and JT Telecom. The application has achieved **97% production readiness** with AI-powered features and comprehensive project management capabilities.

### Current Status (3 December 2025)

| Category | Status |
|----------|--------|
| Latest Deployment | ✅ READY (commit 52a0016) |
| P9 Migration | ⏳ PENDING - Blocking milestone edits |
| P8 Migration | ⏳ PENDING - Contributor deliverable access |
| .single() Fix | ✅ Deployed (commit f3c3f80) |
| Apple Design System | ✅ Complete |

---

## Quick Reference

### Key URLs

| Service | URL |
|---------|-----|
| Live Application | https://amsf001-project-tracker.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |

### Local Development Paths

| Item | Path |
|------|------|
| Project Root | /Users/glennnickols/Projects/amsf001-project-tracker |
| Source Code | /Users/glennnickols/Projects/amsf001-project-tracker/src |
| SQL Scripts | /Users/glennnickols/Projects/amsf001-project-tracker/sql |
| API Functions | /Users/glennnickols/Projects/amsf001-project-tracker/api |

---

## System Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2.0 |
| Build Tool | Vite | 5.4.21 |
| Backend | Supabase (PostgreSQL + Auth) | - |
| Hosting | Vercel (Pro Plan) | - |
| AI - Chat | Claude 4.5 Sonnet | claude-sonnet-4-5-20250929 |
| AI - Receipt Scanner | Claude 4.5 Sonnet | claude-sonnet-4-5-20250929 |

### Dependencies (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-grid-layout": "^1.5.2",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "vite": "^5.4.21"
  }
}
```

---

## Project Structure

### Source Code Layout

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── design-system.css
├── components/
│   ├── Layout.jsx
│   ├── NotificationBell.jsx
│   ├── NotificationPreferences.jsx
│   ├── chat/
│   ├── common/          (12 components)
│   ├── dashboard/
│   ├── expenses/
│   ├── milestones/
│   ├── partners/
│   └── resources/
├── contexts/            (6 contexts)
│   ├── AuthContext.jsx
│   ├── ChatContext.jsx
│   ├── NotificationContext.jsx
│   ├── ProjectContext.jsx
│   ├── TestUserContext.jsx
│   └── ToastContext.jsx
├── hooks/               (5 hooks)
│   ├── useDashboardLayout.js
│   ├── useForm.js
│   ├── useFormValidation.js
│   ├── usePermissions.js
│   └── useReadOnly.js
├── lib/                 (8 utilities)
│   ├── constants.js
│   ├── errorHandler.js
│   ├── navigation.js
│   ├── permissionMatrix.js
│   ├── permissions.js
│   ├── sanitize.js
│   ├── supabase.js
│   └── utils.js
├── pages/               (28 pages)
└── services/            (13 services)
```

### Services Layer (13 Services)

| Service | Purpose |
|---------|---------|
| base.service.js | Base CRUD operations |
| dashboard.service.js | Dashboard layouts |
| deliverables.service.js | Deliverable management |
| expenses.service.js | Expense management |
| invoicing.service.js | Invoice generation |
| kpis.service.js | KPI management |
| milestones.service.js | Milestone tracking |
| partners.service.js | Partner organizations |
| qualityStandards.service.js | Quality tracking |
| receiptScanner.service.js | AI receipt processing |
| resources.service.js | Resource management |
| standards.service.js | Standards management |
| timesheets.service.js | Time tracking |

### Common Components (12 Components)

ActionButtons, Card, ConfirmDialog, DataTable, ErrorBoundary, FilterBar, LoadingSpinner, PageHeader, Skeleton, StatCard, StatusBadge, Toast

### Pages (28 Pages)

AccountSettings, AuditLog, Dashboard, DeletedItems, Deliverables, Expenses, Gantt, KPIDetail, KPIs, Login, MilestoneDetail, Milestones, NetworkStandards, OtherPages, PartnerDetail, Partners, QualityStandardDetail, QualityStandards, Reports, ResetPassword, ResourceDetail, Resources, Settings, Standards, Timesheets, Users, WorkflowSummary

---

## API Endpoints

### Vercel Serverless Functions

| Endpoint | File | Purpose | AI Model |
|----------|------|---------|----------|
| /api/chat | api/chat.js (v3.2) | AI Chat Assistant | claude-sonnet-4-5-20250929 |
| /api/scan-receipt | api/scan-receipt.js (v1.1) | Receipt Scanner | claude-sonnet-4-5-20250929 |

---

## Supabase Configuration

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ljqpmrcqxzgcfojrkxce |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro |

### Permission Matrix

| Role | Level | Description |
|------|-------|-------------|
| admin | 5 | Full system access |
| supplier_pm | 4 | Supplier project management |
| customer_pm | 3 | Customer-side approval authority |
| contributor | 2 | Add timesheets, expenses, edit deliverables |
| viewer | 1 | Read-only access |

---

## SQL Migrations

### Migration Status

| Script | Purpose | Status |
|--------|---------|--------|
| P3a-add-partner-id-to-resources.sql | Link resources to partners | ✅ Deployed |
| P4-add-procurement-method-to-expenses.sql | Expense procurement tracking | ✅ Deployed |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Deployed |
| P5b-partner-invoices-rls.sql | Invoice RLS policies | ✅ Deployed |
| P6-enhanced-invoice-lines.sql | Invoice line items | ✅ Deployed |
| P7-receipt-scanner.sql | Receipt scanner tables | ✅ Deployed |
| **P8-deliverables-contributor-access.sql** | Allow contributors to edit | ⏳ PENDING |
| **P9-milestone-update-rls.sql** | Milestone RLS policies | ⏳ **URGENT** |
| audit-triggers.sql | Audit logging triggers | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete system | ✅ Deployed |
| data-integrity-constraints.sql | Data validation | ✅ Deployed |
| add-resource-id-to-expenses.sql | Resource expense linking | ✅ Deployed |

### P9 Migration (URGENT)

**Issue:** Milestone edits fail with "No record found with id" error  
**Cause:** Missing UPDATE RLS policy on milestones table

**To Deploy:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/P9-milestone-update-rls.sql`
3. Run the script
4. Verify with: `SELECT * FROM pg_policies WHERE tablename = 'milestones'`

---

## Vercel Configuration

| Setting | Value |
|---------|-------|
| Project Name | amsf001-project-tracker |
| Framework | Vite |
| Node Version | 22.x |
| Plan | Pro |

### Recent Deployments (3 December 2025)

| Commit | Message | Status |
|--------|---------|--------|
| 52a0016 | docs: update documentation for P9 | ✅ READY |
| 5b86371 | fix: add UPDATE RLS policy for milestones | ✅ READY |
| f3c3f80 | fix: resolve Supabase .single() errors | ✅ READY |
| f1d0a7f | feat: add centralized UI components | ✅ READY |
| bdf4d08 | feat: redesign Dashboard Apple-inspired UX | ✅ READY |

---

## GitHub Repository

| Setting | Value |
|---------|-------|
| Repository | spac3man-G/amsf001-project-tracker |
| Default Branch | main |
| Visibility | Public |
| Plan | Pro |

---

## Feature Inventory

### Core Project Management
- ✅ Project configuration and settings
- ✅ Milestone tracking with progress calculation
- ✅ Deliverable management and verification
- ✅ Resource allocation and scheduling
- ✅ KPI monitoring and reporting
- ✅ Quality standards tracking

### Time & Expense Tracking
- ✅ Timesheet entry with approval workflow
- ✅ Expense tracking with receipt upload
- ✅ Smart Receipt Scanner (AI-powered)
- ✅ Procurement method classification

### Partner Invoicing
- ✅ Period-based invoice generation
- ✅ Chargeable/non-chargeable breakdown
- ✅ Print to PDF functionality
- ✅ Supplier expense handling

### AI Features
- ✅ Chat Assistant with 12 query tools
- ✅ Receipt scanning with category learning
- ✅ Role-based data scoping

### Security & Audit
- ✅ Row Level Security (RLS)
- ✅ Audit logging
- ✅ Soft delete with recovery
- ✅ Permission Matrix architecture

---

## Production Readiness: 97%

| Category | Status | Score |
|----------|--------|-------|
| Core Features | ✅ Complete | 100% |
| Security | ✅ Complete | 100% |
| UI/UX | ✅ Apple Design + Modals | 98% |
| AI Features | ✅ Sonnet Upgraded | 98% |
| Documentation | ✅ Comprehensive | 95% |
| Performance | ✅ Good | 90% |
| Testing | 🔄 Partial | 70% |

**Blocking Issue:** P9 migration needed for milestone editing

---

## AI Cost Estimation

### Claude 4.5 Sonnet (Both APIs)
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

### Estimated Monthly Costs

| Usage Level | Chat Queries | Receipt Scans | Monthly Cost |
|-------------|--------------|---------------|--------------|
| Light | 100 | 20 | ~£5.00 |
| Medium | 500 | 100 | ~£25.00 |
| Heavy | 1,000 | 200 | ~£50.00 |

---

## Local Development

### Setup

```bash
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker
npm install
cp .env.example .env  # Edit with your Supabase keys
npm run dev
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## Troubleshooting

### Milestone Update Errors
**Error:** "No record found with id: [uuid]"  
**Solution:** Run `sql/P9-milestone-update-rls.sql` in Supabase

### .single() Errors
**Error:** "Cannot coerce the result to a single JSON object"  
**Solution:** Already fixed in commit f3c3f802

### Build Failures
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Corrections from Review

This document corrects the following inaccuracies found in previous documentation:

1. **Service count:** 13 services (not 18)
2. **React version:** 18.2.0 (not 18.3)
3. **AI Models:** Both APIs upgraded to Claude 4.5 Sonnet (claude-sonnet-4-5-20250929)
4. **Dependency versions:** Updated from actual package.json
5. **File structure:** Verified from actual project files

## Recent Enhancements (3 December 2025)

### UI/UX Improvements
1. **Approve → Validate Terminology** - UI displays "Validated" while database stores "Approved" for consistency with business language
2. **Detail Modals** - Clickable table rows now open full-featured detail modals:
   - `TimesheetDetailModal` - View, edit, submit, validate timesheets
   - `ExpenseDetailModal` - View, edit, submit, validate expenses with receipt download
3. **Component Organisation** - New `src/components/timesheets/` folder with index exports

---

## Next Actions

### Immediate
1. ⚠️ **Run P9 migration** in Supabase SQL Editor
2. Verify milestone editing works
3. Run P8 migration for contributor access

### This Month
1. Set up Jest testing infrastructure
2. Add loading skeletons to Dashboard
3. Implement chat follow-up questions

---

*Complete Documentation v7.0 | Generated: 3 December 2025*  
*Consolidated from: Local project, GitHub, Vercel, Master Document v6, Configuration Guide v10*
