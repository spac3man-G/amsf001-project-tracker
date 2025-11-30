# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 6.0  
**Last Updated:** 30 November 2025

---

## How to Use This Document

**Upload this file along with `AMSF001-Configuration-Guide-v6.md` when starting a new Claude session or adding to a Claude Project.**

The Configuration Guide contains all credentials and setup information. This prompt tells Claude how to work with your project.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded `AMSF001-Configuration-Guide-v6.md` with this prompt.** It contains:
- All API keys and credentials (Supabase, GitHub, Vercel, Anthropic)
- MCP configuration for Claude Desktop
- Why we use local Git instead of GitHub API
- AppleScript commands for Git operations
- Troubleshooting guides

**Read the Configuration Guide first for credentials and setup details.**

---

## Project Overview

**AMSF001 Project Tracker** is a React + Vite web application for managing a Government of Jersey / JT Telecom project.

| Component | Technology |
|-----------|------------|
| Frontend | React 18.2 + React Router 6 |
| Build | Vite 5.4.21 |
| Backend | Supabase (PostgreSQL 15 + Auth) |
| AI Chat | Claude API (Haiku) via Vercel Edge Function |
| Hosting | Vercel (auto-deploys from GitHub) |
| Repository | github.com/spac3man-G/amsf001-project-tracker |
| Local Path | /Users/glennnickols/Projects/amsf001-project-tracker |

---

## Current Project Status (30 November 2025)

### Completed Features ✅

| Feature | Description |
|---------|-------------|
| **Authentication** | Supabase Auth with role-based access |
| **Multi-tenancy** | Project-scoped data via project_id |
| **Timesheets** | CRUD, submission workflow, approval |
| **Expenses** | Per-category entry, procurement tracking, detail modal |
| **Resources** | Types (supplier/partner/customer), partner linking |
| **Partners** | Full CRUD, linked resources, date filtering |
| **Enhanced Invoicing** | Full breakdown with timesheets by resource, expense separation |
| **AI Chat** | Claude Haiku assistant widget |
| **Delete Warnings** | Cascade warnings with cost impact |
| **Date Filtering** | Month select + custom range on detail pages |
| **Toast Notifications** | App-wide success/error/warning messages |
| **Form Validation** | Reusable validation hook |
| **Error Boundary** | Global error catching |

### Recent Additions (Today)

1. **Enhanced Invoicing (P6)** - Invoice now shows:
   - Timesheets grouped by resource with hours, cost/day, status
   - Partner-procured expenses (on invoice)
   - Supplier-procured expenses (informational, not on invoice)
   - Chargeable totals for customer pass-through

2. **Toast Notifications** - Replace browser alerts:
   - `showSuccess()`, `showError()`, `showWarning()`, `showInfo()`
   - Auto-dismiss with close button

3. **Form Validation Hook** - Reusable validation:
   - Built-in validators: required, email, minLength, etc.
   - Preset rules: ValidationRules.email, ValidationRules.name

4. **Multi-Tenant Foundation** - Database ready:
   - `user_projects` table created
   - `projects.description` column added

### Database Tables

- profiles, projects, resources, partners
- timesheets, expenses, milestones, deliverables
- kpis, quality_standards
- partner_invoices, partner_invoice_lines
- user_projects (NEW), audit_log (existing)

### Services Layer (Complete)

All entities now have services:
- BaseService, partnersService, resourcesService
- timesheetsService, expensesService, invoicingService
- milestonesService, deliverablesService
- kpisService, qualityStandardsService

---

## How You Access My System

You have access via MCP tools:

1. **Desktop Commander** - File operations, terminal commands
2. **Filesystem** - Read/write files on my Mac
3. **GitHub MCP** - Repository operations
4. **Supabase MCP** - Database queries via PostgREST
5. **Vercel MCP** - Deployment management

### File Locations

| Item | Path |
|------|------|
| Project Root | /Users/glennnickols/Projects/amsf001-project-tracker |
| Source Code | /Users/glennnickols/Projects/amsf001-project-tracker/src |
| SQL Scripts | /Users/glennnickols/Projects/amsf001-project-tracker/sql |
| Documentation | /Users/glennnickols/Projects/amsf001-project-tracker/*.md |

---

## Key Technical Details

### User Roles

| Role | Permissions |
|------|-------------|
| admin | Full access to everything |
| supplier_pm | Manage resources, partners, invoices, validate non-chargeable |
| customer_pm | Approve timesheets, validate chargeable expenses |
| contributor | Submit own timesheets/expenses |

### Database Schema Notes

1. **Expenses store one row per category** - not per-category columns
   - Use: `category`, `reason`, `amount`
   - NOT: `travel_amount`, `accommodation_amount`

2. **profiles table has no project_id column** - RLS uses role checks only

3. **All tables have project_id** with NOT NULL constraint (except profiles)

4. **Enhanced invoice_lines** - Now includes:
   - `chargeable_to_customer`, `procurement_method`
   - `expense_category`, `hours`, `cost_price`, `source_status`

### Important Code Patterns

```javascript
// Services import
import { partnersService, invoicingService, timesheetsService } from '../services';

// Toast notifications
import { useToast } from '../contexts/ToastContext';
const { showSuccess, showError, showWarning } = useToast();

// Form validation
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
const { validate, errors, getError } = useFormValidation();

// Date formatting (UK format)
date.toLocaleDateString('en-GB')

// Permission checks
import { usePermissions } from '../hooks/usePermissions';
const { canManageResources, canSeeCostPrice } = usePermissions();
```

---

## Common Tasks

### Add a New Feature
1. Check permissions.js for required permissions
2. Create/update service in src/services/
3. Update page component in src/pages/
4. Use useToast for notifications
5. Use useFormValidation for forms
6. Test locally with `npm run dev`
7. Commit and push (auto-deploys to Vercel)

### Database Changes
1. Write SQL script in /sql/ folder
2. Test in Supabase SQL Editor
3. Document in playbook
4. Add RLS policies if needed

### Debug Build Errors
- Check for Unicode characters (✓ ✗) - replace with ASCII
- Verify all imports exist
- Check Vercel deployment logs

---

## Production Roadmap

### Current Phase: Stabilisation (Phase 1)

**Completed:**
- Toast notifications ✅
- Form validation hook ✅
- Error boundary ✅
- Services layer complete ✅

**In Progress:**
- Service adoption across all pages
- Loading skeletons

### Upcoming Phases

| Phase | Focus | Priority |
|-------|-------|----------|
| 2 | Production Hardening | HIGH |
| 3 | Performance Optimisation | MEDIUM |
| 4 | Multi-Tenant Foundation | HIGH |
| 5 | Enhanced Reporting | MEDIUM |

### Key Metrics to Improve

| Metric | Current | Target |
|--------|---------|--------|
| Bundle Size | 821KB | <500KB |
| Initial Load | ~3s | <2s |
| Code Consistency | ~60% | >90% |

---

## Documentation Files

| Document | Version | Purpose |
|----------|---------|---------|
| AMSF001-Development-Playbook-v14.md | 14.0 | Technical implementation guide |
| AMSF001-User-Manual-v4.md | 4.0 | End-user documentation |
| AMSF001-Configuration-Guide-v6.md | 6.0 | Credentials and setup |
| AI_AMSF001-Claude-Session-Prompt-v6.md | 6.0 | This file |

---

## Current Priorities

1. Continue Phase 1 stabilisation
2. Migrate remaining pages to use services
3. Add loading skeletons for better UX
4. Consider code splitting for bundle size

---

## Quick Commands

```bash
# Start development server
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Build for production
npm run build

# Commit and deploy
git add -A && git commit -m "message" && git push origin main
```

---

*End of Claude Session Prompt v6.0*
