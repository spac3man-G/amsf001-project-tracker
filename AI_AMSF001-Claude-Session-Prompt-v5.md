# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 5.0  
**Last Updated:** 30 November 2025

---

## How to Use This Document

**Upload this file along with `AMSF001-Configuration-Guide-v5.md` when starting a new Claude session or adding to a Claude Project.**

The Configuration Guide contains all credentials and setup information. This prompt tells Claude how to work with your project.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded `AMSF001-Configuration-Guide-v5.md` with this prompt.** It contains:
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
| **Expenses** | Per-category entry, procurement tracking |
| **Resources** | Types (supplier/partner/customer), partner linking |
| **Partners** | Full CRUD, linked resources, date filtering |
| **Partner Invoicing** | Generate invoices from timesheets/expenses |
| **AI Chat** | Claude Haiku assistant widget |
| **Delete Warnings** | Cascade warnings with cost impact |
| **Date Filtering** | Month select + custom range on detail pages |

### Database Tables

- profiles, projects, resources, partners
- timesheets, expenses, milestones, deliverables
- kpis, quality_standards
- partner_invoices, partner_invoice_lines

### Services Layer

- BaseService (CRUD operations)
- partnersService, resourcesService
- expensesService, invoicingService

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
   - NOT: `travel_amount`, `accommodation_amount`, `sustenance_amount`

2. **profiles table has no project_id column** - RLS uses role checks only

3. **All tables have project_id** with NOT NULL constraint (except profiles)

### Important Code Patterns

```javascript
// Services import
import { partnersService, resourcesService, invoicingService } from '../services';

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
4. Test locally with `npm run dev`
5. Commit and push (auto-deploys to Vercel)

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

## Technical Debt to Be Aware Of

| Issue | Description | Impact |
|-------|-------------|--------|
| Bundle Size | 785KB JS | Consider code splitting |
| No Soft Delete | Hard delete only | No recovery (planned Phase P10) |
| Expense Schema | Form has per-category, DB has single category | Each category = 1 row |

---

## Documentation Files

| Document | Purpose |
|----------|---------|
| AMSF001-Development-Playbook-v13.md | Technical implementation guide |
| AMSF001-User-Manual-v3.md | End-user documentation |
| AMSF001-Configuration-Guide-v5.md | Credentials and setup |
| AI_AMSF001-Claude-Session-Prompt-v5.md | This file |

---

## Current Priorities

1. Run RLS policies for partner_invoices tables (sql/P5b-partner-invoices-rls.sql)
2. Test invoice generation end-to-end
3. Consider soft delete implementation (Phase P10)

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

*End of Claude Session Prompt v5.0*
