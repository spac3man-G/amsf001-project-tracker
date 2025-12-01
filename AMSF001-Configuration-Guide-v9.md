# AMSF001 Project Tracker - Configuration Guide

**Version:** 9.0  
**Last Updated:** 1 December 2025  
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
| Supabase Dashboard | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
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
| Master Document | 5.0 | AMSF001-Master-Document-v5.md |
| User Manual | 7.0 | AMSF001-User-Manual-v7.md |
| Development Playbook | 21.0 | AMSF001-Development-Playbook-v21.md |
| Configuration Guide | 9.0 | AMSF001-Configuration-Guide-v9.md |
| AI Chat Assistant Spec | 1.0 | AI-CHAT-ASSISTANT-SPEC.md |
| Receipt Scanner Spec | 1.0 | SMART-RECEIPT-SCANNER-SPEC.md |

---

## 2. Supabase Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ltkbfbqfnskqgpcnvdxy |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro |

### API Keys

```env
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
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
- users, user_projects, audit_logs, deleted_items
- dashboard_layouts, notifications

**AI Feature Tables (pending):**
- receipt_scans, expense_classification_rules

### RLS Policies

All tables have Row Level Security enabled:
- Users can only access data for their assigned projects
- Partner users only see their partner's data
- Resources only see their own timesheets/expenses
- Admins have full access

---

## 3. Vercel Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-project-tracker |
| Framework | Vite |
| Node Version | 18.x |
| Plan | Pro |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| VITE_SUPABASE_URL | Supabase project URL | Yes |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| ANTHROPIC_API_KEY | Claude AI API key | For AI features |
| SUPABASE_SERVICE_ROLE_KEY | Service role key for AI Chat queries | For AI Chat |

**Note:** The `SUPABASE_SERVICE_ROLE_KEY` is used by the chat API to query data on behalf of users. It should be kept secret and only used server-side.

### Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Deployment

Automatic deployment on push to `main` branch via GitHub integration.

---

## 4. GitHub Repository

### Repository Details

| Setting | Value |
|---------|-------|
| Repository | spac3man-G/amsf001-project-tracker |
| Default Branch | main |
| Plan | Pro |

### Branch Strategy

- `main` - Production (auto-deploys to Vercel)
- Feature branches as needed for major changes

### Recent Commits (1 December 2025)

```
3ee21801 - fix: print view now shows all timesheet and expense entries
5557f75d - feat: redesign invoice summary with expenses breakdown and print to PDF
b523fc92 - feat: redesign invoice summary with chargeable breakdown
8382ea5a - feat: improve invoice supplier expenses UI
```

---

## 5. Anthropic API

### Configuration

| Setting | Value |
|---------|-------|
| API Key Location | Vercel Environment Variables |
| Current Model | claude-haiku-4-5-20251001 |
| Use Cases | Chat Assistant, Receipt Scanner |

### Models Used

| Feature | Model | Cost (per 1M tokens) |
|---------|-------|---------------------|
| Chat Assistant | Claude 3.5 Haiku | $0.80 input, $4.00 output |
| Receipt Scanner | Claude 3.5 Haiku | $0.80 input, $4.00 output |

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

### Development URLs

- Local: http://localhost:5173
- Network: http://[your-ip]:5173

---

## 7. Document Inventory

### Core Documentation

| Document | Version | Lines | Purpose |
|----------|---------|-------|---------|
| AMSF001-Master-Document-v4.md | 4.0 | ~460 | System overview, architecture, roadmap |
| AMSF001-User-Manual-v7.md | 7.0 | ~384 | End-user guide |
| AMSF001-Development-Playbook-v20.md | 20.0 | ~311 | Developer guide, recent changes |
| AMSF001-Configuration-Guide-v8.md | 8.0 | ~260 | This document |

### Feature Specifications

| Document | Version | Lines | Purpose |
|----------|---------|-------|---------|
| AI-CHAT-ASSISTANT-SPEC.md | 1.0 | ~693 | AI assistant requirements & technical spec |
| SMART-RECEIPT-SCANNER-SPEC.md | 1.0 | ~200 | Receipt scanner specification |
| DASHBOARD-CUSTOMIZATION-SPEC.md | 1.0 | ~300 | Dashboard drag-and-drop spec |

### Deployment Guides

| Document | Purpose |
|----------|---------|
| RECEIPT-SCANNER-DEPLOYMENT.md | Receipt scanner deployment checklist |
| README.md | Repository overview |

### Archive (Previous Versions)

Previous versions retained in repository root:
- AMSF001-Master-Document-v2.md, v3.md
- AMSF001-User-Manual-v1.md through v6.md
- AMSF001-Development-Playbook-v4.md through v19.md
- AMSF001-Configuration-Guide-v3.md through v7.md

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
| P7-receipt-scanner.sql | Receipt scanner tables | ⏳ Pending |
| audit-triggers.sql | Audit logging triggers | ✅ Deployed |
| soft-delete-implementation.sql | Soft delete system | ✅ Deployed |
| data-integrity-constraints.sql | Data validation | ✅ Deployed |

---

## 9. Troubleshooting

### Build Failures

**Error:** Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error:** Environment variables undefined
- Check `.env` file exists
- Verify variable names start with `VITE_` for client-side access
- Restart dev server after changes

### Database Issues

**Error:** RLS policy violation
- Check user has correct role
- Verify user_projects assignment
- Check Supabase dashboard for policy details

**Error:** Connection refused
- Verify VITE_SUPABASE_URL is correct
- Check Supabase project status
- Verify network connectivity

### Deployment Issues

**Error:** Build timeout on Vercel
- Check for infinite loops
- Verify all imports resolve
- Check bundle size isn't excessive

**Error:** 500 error on API routes
- Check Vercel function logs
- Verify environment variables set in Vercel
- Check ANTHROPIC_API_KEY for AI features

### Print/PDF Issues

**Issue:** Content truncated in print
- Use the "Print / Save PDF" button (not Ctrl+P)
- The print function removes scroll constraints

**Issue:** Styling looks different in print
- Print uses separate CSS defined in handlePrintInvoice()
- Check print preview before saving

---

## Appendix: Key File Locations

### Frontend Components
```
src/pages/PartnerDetail.jsx      # Partner invoicing (1500+ lines)
src/pages/Dashboard.jsx          # Dashboard (637 lines)
src/pages/Expenses.jsx           # Expense management
src/components/expenses/         # Receipt scanner components
```

### Services
```
src/services/invoicing.service.js   # Invoice generation
src/services/dashboard.service.js   # Dashboard layouts
src/services/receiptScanner.service.js  # AI receipt processing
```

### API Functions
```
api/chat.js           # AI Chat (to be enhanced)
api/scan-receipt.js   # Receipt scanner
```

---

*Configuration Guide Version: 8.0 | Last Updated: 1 December 2025*
