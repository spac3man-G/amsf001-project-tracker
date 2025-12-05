# AMSF001 Project Tracker - Technical Reference

**Last Updated:** 5 December 2025  
**Version:** 2.0  
**Production Readiness:** 100%

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Architecture Overview](#2-architecture-overview)
3. [Apple Design System](#3-apple-design-system)
4. [Supabase Configuration](#4-supabase-configuration)
5. [Vercel Configuration](#5-vercel-configuration)
6. [Service Layer](#6-service-layer)
7. [UI Component Patterns](#7-ui-component-patterns)
8. [AI Chat System](#8-ai-chat-system)
9. [SQL Migrations](#9-sql-migrations)
10. [Local Development](#10-local-development)
11. [Recent Changes](#11-recent-changes)
12. [Troubleshooting](#12-troubleshooting)

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
| Styling | Apple Design System (Custom CSS) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (Pro) |
| AI | Anthropic Claude 4.5 Sonnet/Haiku |

### Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Core UI (ActionButtons, Card, FilterBar)
│   ├── common/             # Shared components (LoadingSpinner, etc.)
│   ├── chat/               # AI Chat components
│   ├── timesheets/         # Timesheet components + modal
│   ├── expenses/           # Expense components + modal
│   ├── deliverables/       # Deliverable components + modal
│   ├── milestones/         # Milestone table component
│   └── networkstandards/   # Network standards + modal
├── contexts/               # React contexts (Auth, Project, Toast)
├── hooks/                  # Custom hooks (usePermissions, useFormValidation)
├── lib/                    # Utilities (supabase client, permissions)
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
| contributor | 2 | Submits timesheets & expenses |
| viewer | 1 | Read-only dashboard access |

---

## 3. Apple Design System

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

/* Border Colors */
--color-border: #d2d2d7;
--color-border-light: #e8e8ed;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Typography */
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', SFMono-Regular, Consolas, monospace;
```

### Page CSS Files

| Page | CSS File | Accent Color |
|------|----------|--------------|
| Milestones | Milestones.css | Teal (#0d9488) |
| Deliverables | Deliverables.css | Blue (#007aff) |
| Resources | Resources.css | Teal (#0d9488) |
| Expenses | Expenses.css | Teal (#0d9488) |
| Partners | Partners.css | Teal (#0d9488) |
| Timesheets | Timesheets.css | Teal (#0d9488) |
| KPIs | KPIs.css | Teal (#0d9488) |
| Quality Standards | QualityStandards.css | Teal (#0d9488) |
| Users | Users.css | Purple (#af52de) |
| RAID Log | RaidLog.css | Red/Orange (#ef4444) |

### Design Principles

1. **Clean Headers** - Sticky with backdrop blur, icon + title + subtitle
2. **No Dashboard Cards on List Pages** - Stats/metrics only on Dashboard
3. **Click-to-Navigate** - Full row clickability, no separate "view" buttons
4. **Inline Actions Only** - Status toggles use stopPropagation
5. **Consistent Tables** - Clean borders, hover states, proper spacing

### Header Pattern

```jsx
<header className="page-header">
  <div className="header-content">
    <div className="header-title">
      <Icon size={28} strokeWidth={1.5} />
      <div>
        <h1>Page Title</h1>
        <p>{count} item{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
    <div className="header-actions">
      <button className="btn-primary">
        <Plus size={16} /> Add New
      </button>
    </div>
  </div>
</header>
```

### Table Pattern

```jsx
<div className="table-card">
  <table>
    <thead>
      <tr>
        <th>Column</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr 
          key={item.id}
          onClick={() => navigate(`/path/${item.id}`)}
        >
          <td>{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 4. Supabase Configuration

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

## 5. Vercel Configuration

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

## 6. Service Layer

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

## 7. UI Component Patterns

### Click-to-Navigate Pattern

All list pages use full row clickability - **no separate view/edit/delete buttons in tables**:

```jsx
<tr 
  onClick={() => navigate(`/path/${item.id}`)}
  style={{ cursor: 'pointer' }}
>
  <td>{item.name}</td>
  <td>{item.status}</td>
</tr>
```

### Pages Following This Pattern

| Page | Navigation Target | Notes |
|------|-------------------|-------|
| Milestones | /milestones/:id | Certificate badge inline |
| Deliverables | /deliverables/:id | Status badge inline |
| Resources | /resources/:id | Utilization bar inline |
| Partners | /partners/:id | Status toggle with stopPropagation |
| Expenses | Detail Modal | Filter bar retained |
| Timesheets | Detail Modal | Filter bar retained |
| KPIs | /kpis/:id | Category badges inline |
| Quality Standards | /quality-standards/:id | Status badges inline |
| Users | N/A (inline editing) | Role dropdown inline |

### Inline Actions with stopPropagation

For actions that shouldn't navigate:

```jsx
<td onClick={(e) => e.stopPropagation()}>
  <button onClick={() => toggleStatus(item.id)}>
    Toggle
  </button>
</td>
```

### Detail Modal Components

```
src/components/
├── timesheets/TimesheetDetailModal.jsx    # Validate/Reject
├── expenses/ExpenseDetailModal.jsx        # Validate/Reject
├── deliverables/DeliverableDetailModal.jsx # Submit/Review/Deliver
└── networkstandards/NetworkStandardDetailModal.jsx # Edit status
```

---

## 8. AI Chat System

### Three-Tier Architecture

```
User Question
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ TIER 1: INSTANT (0ms API, ~100ms total)                         │
│ LOCAL_RESPONSE_PATTERNS in ChatContext.jsx                      │
│ Answers from prefetchedContext without any API call             │
└─────────────────────────────────────────────────────────────────┘
    ↓ (if no pattern match)
┌─────────────────────────────────────────────────────────────────┐
│ TIER 2: STREAMING HAIKU (1-2 seconds)                           │
│ /api/chat-stream - STREAMING_PATTERNS check                     │
│ Uses Haiku model with pre-fetched context only                  │
└─────────────────────────────────────────────────────────────────┘
    ↓ (if COMPLEX_PATTERNS detected)
┌─────────────────────────────────────────────────────────────────┐
│ TIER 3: FULL SONNET WITH TOOLS (3-5 seconds)                    │
│ /api/chat - 12 database tools available                         │
│ Parallel execution, 5s timeout, 5min cache                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| api/chat.js | Sonnet with database tools |
| api/chat-stream.js | Streaming Haiku responses |
| api/chat-context.js | Pre-fetch project context |
| src/contexts/ChatContext.jsx | Tier 1 local responses |
| src/components/chat/ChatWidget.jsx | UI component |

### Performance Optimizations

- **Query Timeouts:** 5-second hard limit on database queries
- **Parallel Execution:** Multiple tools run concurrently
- **Extended Cache:** 5-minute TTL for tool results
- **Partial Failures:** Return available data if one tool fails

---

## 9. SQL Migrations

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
| P8-deliverables-contributor-access.sql | Contributors edit | ✅ Deployed |
| P9-milestone-update-rls.sql | Milestone RLS | ✅ Deployed |
| audit-triggers.sql | Audit logging | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete | ✅ Deployed |
| data-integrity-constraints.sql | Data validation | ✅ Deployed |

---

## 10. Local Development

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

## 11. Recent Changes

### 5 December 2025 - Apple Design System Complete

**UI Cleanup - All List Pages**
- Removed dashboard summary cards from all list pages
- Removed edit/delete action columns from all tables
- Implemented click-to-navigate pattern consistently
- Created dedicated CSS files with Apple design tokens

**Pages Updated:**
- Milestones.jsx/css - Clean table, certificate badges
- Deliverables.jsx/css - Status badges, click to detail
- Resources.jsx/css - Utilization bars, type filter retained
- Expenses.jsx/css - Filter bar retained, no action column
- Partners.jsx/css - Status toggle inline with stopPropagation
- Timesheets.jsx/css - Filter bar, detail modal
- KPIs.jsx/css - Category badges
- QualityStandards.jsx/css - Status badges
- Users.jsx/css - Inline role editing (clickable badge)
- RaidLog.jsx/css - Risk/Issue tabs, priority badges

**AI Chat Performance**
- Added query timeouts (5s hard limit)
- Implemented parallel tool execution
- Extended cache TTL to 5 minutes
- Added partial failure handling
- Fixed field name mismatches in API queries

**Commits:**
- `5d83ca3c` - Apple design for Users page
- `14cb1b65` - Fix missing Expenses.css
- `33df7469` - Apple design for all list pages
- `26a93a62` - Chat API field name audit
- `cae0ffc6` - Chat performance improvements
- `4b31f719` - Context loading indicator

### 4 December 2025

**Financial Calculations Refactoring**
- Centralized hour-to-day calculations in metricsConfig.js
- Renamed database columns: daily_rate → sell_price, budget → billable

**Dashboard Widgets**
- Added TimesheetsWidget and ExpensesWidget
- Updated grid from 3 to 4 columns

### 3 December 2025

**UI Consistency**
- Implemented full row clickability across all list pages
- Added detail modals for Timesheets, Expenses, Deliverables

**AI Model Upgrade**
- Upgraded to Claude 4.5 Sonnet

**Terminology**
- Changed "Approved" → "Validated" throughout

---

## 12. Troubleshooting

### Build Failures

**Error:** Could not resolve "./PageName.css"
- **Cause:** CSS file referenced but doesn't exist
- **Solution:** Create the missing CSS file or remove the import

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

### Documentation Files

| File | Purpose |
|------|---------|
| README.md | Project overview |
| AMSF001-Technical-Reference.md | This document |
| AMSF001-User-Guide.md | End-user documentation |
| AI-CHAT-ASSISTANT-SPEC.md | AI assistant specification |
| SMART-RECEIPT-SCANNER-SPEC.md | Receipt scanner spec |
| DASHBOARD-CUSTOMIZATION-SPEC.md | Dashboard drag-and-drop |
| ROADMAP-2025-12.md | Development roadmap |
| SESSION-SUMMARY-2025-12-*.md | Daily session summaries |

### Page CSS Files

| File | Page |
|------|------|
| src/pages/Milestones.css | Milestones list |
| src/pages/Deliverables.css | Deliverables list |
| src/pages/Resources.css | Resources list |
| src/pages/Expenses.css | Expenses list |
| src/pages/Partners.css | Partners list |
| src/pages/Timesheets.css | Timesheets list |
| src/pages/KPIs.css | KPIs list |
| src/pages/QualityStandards.css | Quality standards list |
| src/pages/Users.css | User management |
| src/pages/RaidLog.css | RAID log |

---

*AMSF001 Technical Reference | Version 2.0 | 5 December 2025*
