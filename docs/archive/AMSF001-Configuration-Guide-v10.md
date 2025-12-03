# AMSF001 Project Tracker - Configuration Guide

**Version:** 10.0  
**Last Updated:** 3 December 2025  
**Security Note:** This file contains references to sensitive credentials. Do not commit actual keys to public repositories.

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Supabase Configuration](#2-supabase-configuration)
3. [Vercel Configuration](#3-vercel-configuration)
4. [GitHub Repository](#4-github-repository)
5. [Anthropic API](#5-anthropic-api)
6. [Local Development](#6-local-development)
7. [Document Inventory](#7-document-inventory)
8. [SQL Scripts](#8-sql-scripts)
9. [Troubleshooting](#9-troubleshooting)

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

### Current Document Versions

| Document | Version | File |
|----------|---------|------|
| Master Document | 6.0 | AMSF001-Master-Document-v6.md |
| User Manual | 7.0 | AMSF001-User-Manual-v7.md |
| Development Playbook | 22.0 | AMSF001-Development-Playbook-v22.md |
| Configuration Guide | 10.0 | AMSF001-Configuration-Guide-v10.md |
| Roadmap | 2.0 | ROADMAP-2025-12.md |

---

## 2. Supabase Configuration

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
VITE_SUPABASE_ANON_KEY=[Your anon key from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Your service role key - server-side only]
```

**To find keys:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "anon public" key for `VITE_SUPABASE_ANON_KEY`
4. Copy "service_role" key for server-side operations only

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

### RLS Policies

All tables have Row Level Security enabled. Key policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| milestones | All auth users | Admin, Supplier PM | Admin, Supplier PM | Admin, Supplier PM |
| deliverables | All auth users | Admin, Supplier PM | Admin, Supplier PM, Contributors | Admin, Supplier PM |
| timesheets | All auth users | All (own) | Own or Admin | Own Draft or Admin |
| expenses | All auth users | All (own) | Own or Admin | Own Draft or Admin |

**Note:** P9 migration adds missing UPDATE policy for milestones table.

### Permission Matrix Architecture

The application uses a centralized Permission Matrix (`src/lib/permissionMatrix.js`) as the **single source of truth** for role-based access control.

**Key Files:**
- `src/lib/permissionMatrix.js` - Defines all permissions in one matrix
- `src/lib/permissions.js` - Backward-compatible function exports
- `src/hooks/usePermissions.js` - React hook for component use

**Role Hierarchy:**
| Role | Level | Description |
|------|-------|-------------|
| admin | 5 | Full system access |
| supplier_pm | 4 | Supplier project management |
| customer_pm | 3 | Customer-side approval authority |
| contributor | 2 | Can add timesheets, expenses, edit deliverables |
| viewer | 1 | Read-only access |

---

## 3. Vercel Configuration

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
| SUPABASE_SERVICE_ROLE_KEY | Service role key for AI Chat queries | For AI Chat |

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

## 4. GitHub Repository

### Repository Details

| Setting | Value |
|---------|-------|
| Repository | spac3man-G/amsf001-project-tracker |
| Default Branch | main |
| Plan | Pro |

### Recent Commits (3 December 2025)

```
5b863710 - fix: add missing UPDATE RLS policy for milestones table
f3c3f802 - fix: resolve Supabase .single() errors across all services
f1d0a7f1 - feat: add centralized UI components for Apple design system
bdf4d08d - feat: redesign Dashboard with Apple-inspired premium UX
```

---

## 5. Anthropic API

### Configuration

| Setting | Value |
|---------|-------|
| API Key Location | Vercel Environment Variables |
| Current Model | claude-haiku-4-5-20251001 |
| Use Cases | Chat Assistant, Receipt Scanner |

### Estimated Costs

| Usage Level | Queries/Month | Monthly Cost |
|-------------|---------------|--------------|
| Light | 100 | ~£0.40 |
| Medium | 500 | ~£2.00 |
| Heavy | 1,000 | ~£4.00 |

---

## 6. Local Development

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
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 7. Document Inventory

### Core Documentation

| Document | Version | Purpose |
|----------|---------|---------|
| AMSF001-Master-Document-v6.md | 6.0 | System overview, architecture |
| AMSF001-User-Manual-v7.md | 7.0 | End-user guide |
| AMSF001-Development-Playbook-v22.md | 22.0 | Developer guide, recent changes |
| AMSF001-Configuration-Guide-v10.md | 10.0 | This document |
| ROADMAP-2025-12.md | 2.0 | Development roadmap |

### Feature Specifications

| Document | Purpose |
|----------|---------|
| AI-CHAT-ASSISTANT-SPEC.md | AI assistant requirements |
| SMART-RECEIPT-SCANNER-SPEC.md | Receipt scanner specification |
| DASHBOARD-CUSTOMIZATION-SPEC.md | Dashboard drag-and-drop spec |

---

## 8. SQL Scripts

### Location
`/Users/glennnickols/Projects/amsf001-project-tracker/sql/`

### Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| P3a-add-partner-id-to-resources.sql | Link resources to partners | ✅ Deployed |
| P4-add-procurement-method-to-expenses.sql | Expense procurement tracking | ✅ Deployed |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Deployed |
| P5b-partner-invoices-rls.sql | Invoice RLS policies | ✅ Deployed |
| P6-enhanced-invoice-lines.sql | Invoice line items | ✅ Deployed |
| P7-receipt-scanner.sql | Receipt scanner tables | ✅ Deployed |
| P8-deliverables-contributor-access.sql | Allow contributors to edit | ⏳ Pending |
| **P9-milestone-update-rls.sql** | **Milestone RLS policies** | **⏳ PENDING** |
| audit-triggers.sql | Audit logging triggers | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete system | ✅ Deployed |
| data-integrity-constraints.sql | Data validation | ✅ Deployed |

### Pending Deployment: P9-milestone-update-rls.sql

**Issue:** Milestone edits fail with "No record found" error  
**Cause:** Missing UPDATE RLS policy on milestones table

**To Deploy:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/P9-milestone-update-rls.sql`
3. Run the script
4. Verify with: `SELECT * FROM pg_policies WHERE tablename = 'milestones'`

---

## 9. Troubleshooting

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

---

*Configuration Guide Version: 10.0 | Last Updated: 3 December 2025*
