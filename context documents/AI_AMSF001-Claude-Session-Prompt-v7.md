# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 7.0  
**Last Updated:** 30 November 2025

---

## How to Use This Document

**Upload this file along with `AMSF001-Configuration-Guide-v7.md` when starting a new Claude session or adding to a Claude Project.**

The Configuration Guide contains all credentials and setup information. This prompt tells Claude how to work with your project.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded `AMSF001-Configuration-Guide-v7.md` with this prompt.** It contains:
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

### Production Readiness: 82%

The application has completed Phase 1 Stabilisation with full production hardening.

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
| **AI Chat** | Claude Haiku assistant widget (rate limited 20 req/min) |
| **Delete Warnings** | Cascade warnings with cost impact |
| **Date Filtering** | Month select + custom range on detail pages |
| **Toast Notifications** | App-wide success/error/warning messages |
| **Form Validation** | Reusable validation hook |
| **Error Boundary** | Global error catching |
| **Soft Delete** | 9 tables with recovery capability |
| **Audit Logging** | 8 tables with full change history |
| **Input Sanitisation** | XSS protection via sanitize.js |
| **Session Management** | 60s checks, expiry warnings |
| **Bundle Optimisation** | Code splitting, 445KB total (was 821KB) |

### Infrastructure ✅ (Completed 30 Nov 2025)

| Item | Status | Details |
|------|--------|---------|
| **Vercel Analytics** | ✅ Enabled | Page views, visitors, UTM tracking |
| **Vercel Speed Insights** | ✅ Enabled | Core Web Vitals (LCP, FCP, CLS, FID) |
| **GitHub Dependabot** | ✅ Enabled | Alerts + auto security PRs |
| **GitHub Secret Scanning** | ✅ Enabled | Detects exposed secrets |
| **Supabase Backups** | ✅ Verified | Daily, 7-day retention (Pro Plan) |
| **Vercel Spend Alerts** | ✅ Configured | 50/75/100% thresholds |

### Database Tables

- profiles, projects, resources, partners
- timesheets, expenses, milestones, deliverables
- kpis, quality_standards
- partner_invoices, partner_invoice_lines
- user_projects, audit_log

### Services Layer (Complete)

All 11 services with soft delete and sanitisation:
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
2. **profiles table has no project_id column** - RLS uses role checks only
3. **All tables have project_id** with NOT NULL constraint (except profiles)
4. **Soft delete columns** - is_deleted, deleted_at, deleted_by on 9 tables
5. **Audit triggers** - 8 tables log all changes to audit_log

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

// Input sanitisation
import { sanitize, sanitizeEntity } from '../lib/sanitize';
const cleanData = sanitizeEntity(data, 'timesheets');

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
6. Add sanitisation config if new entity
7. Test locally with `npm run dev`
8. Commit and push (auto-deploys to Vercel)

### Database Changes
1. Write SQL script in /sql/ folder
2. Test in Supabase SQL Editor
3. Add soft delete columns if new table
4. Add audit trigger if new table
5. Document in playbook
6. Add RLS policies if needed

### Debug Build Errors
- Check for Unicode characters (✓ ✗) - replace with ASCII
- Verify all imports exist
- Check Vercel deployment logs

---

## Production Roadmap

### Current Phase: Phase 2 - Multi-Tenant & Reporting

**Phase 1 Complete ✅:**
- Toast notifications, form validation, error boundary
- Service layer complete (11 services)
- Soft delete, audit logging
- Input sanitisation, rate limiting
- Session management, bundle optimisation
- Infrastructure monitoring & security

**Phase 2 In Progress:**
- Multi-tenant project selector UI
- CSV export functionality
- Admin audit log viewer
- Deleted items recovery UI

### Upcoming Phases

| Phase | Focus | Priority |
|-------|-------|----------|
| 3 | Testing Foundation | HIGH |
| 4 | Polish & Performance | MEDIUM |
| 5 | Advanced Features | MEDIUM |

### Current Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Bundle Size | 445KB | <400KB |
| Initial Load | ~2s | <2s |
| Production Readiness | 82% | 95% |
| Test Coverage | 20% | >80% |

---

## Documentation Files

| Document | Version | Purpose |
|----------|---------|---------|
| AMSF001-Development-Playbook-v16.md | 16.0 | Technical implementation guide |
| AMSF001-User-Manual-v5.md | 5.0 | End-user documentation |
| AMSF001-Configuration-Guide-v7.md | 7.0 | Credentials and setup |
| AI_AMSF001-Claude-Session-Prompt-v7.md | 7.0 | This file |

---

## Current Priorities

1. Build admin UI for audit log viewing
2. Build deleted items recovery page
3. Add project selector component
4. Implement CSV export
5. Begin testing foundation

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

*End of Claude Session Prompt v7.0*
