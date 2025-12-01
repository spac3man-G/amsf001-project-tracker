# AMSF001 Project Tracker - Configuration Guide

**Version:** 7.0  
**Last Updated:** 30 November 2025  
**Security Note:** This file contains sensitive credentials. Do not commit to public repositories.

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Supabase Configuration](#2-supabase-configuration)
3. [Vercel Configuration](#3-vercel-configuration)
4. [GitHub Repository](#4-github-repository)
5. [Anthropic API](#5-anthropic-api)
6. [Local Development](#6-local-development)
7. [MCP Configuration](#7-mcp-configuration)
8. [SQL Scripts](#8-sql-scripts)
9. [Infrastructure Status](#9-infrastructure-status)
10. [Troubleshooting](#10-troubleshooting)

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

### Current Document Versions

| Document | Version |
|----------|---------|
| Development Playbook | v16.0 |
| User Manual | v5.0 |
| Configuration Guide | v7.0 |
| Claude Session Prompt | v7.0 |

---

## 2. Supabase Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ltkbfbqfnskqgpcnvdxy |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro (daily backups, 7-day retention) |

### API Keys

```
SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
SUPABASE_ANON_KEY=[Your anon key from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Your service role key - DO NOT expose client-side]
```

**To find keys:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "anon public" key for VITE_SUPABASE_ANON_KEY
4. Copy "service_role" key for server-side operations only

### Database Connection

```
Host: db.ltkbfbqfnskqgpcnvdxy.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Your database password]
```

### RLS (Row Level Security)

All tables have RLS enabled. Key policies:

- **profiles**: Users can read/update own profile
- **resources, timesheets, expenses**: Project-scoped access
- **partners**: Admin and Supplier PM only
- **partner_invoices**: Admin and Supplier PM only
- **user_projects**: Users see own, admin manages all
- **audit_log**: Admin only

### Backup Configuration

| Setting | Value |
|---------|-------|
| Backup Type | Automatic daily |
| Retention | 7 days |
| Plan Feature | Pro Plan (included) |
| PITR | Available as add-on |

---

## 3. Vercel Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Team | Glenn's projects |
| Team ID | team_earXYyEn9jCrxby80dRBGlfP |
| Project | amsf001-project-tracker |
| Project ID | prj_vZxrZGvrrPbC81XRF3KdzHpduSGZ |
| Framework | Vite |
| Node Version | 20.x |

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[anon key]
ANTHROPIC_API_KEY=[Anthropic API key for AI chat]
```

### Deployment

- Auto-deploys from GitHub main branch
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

### Analytics & Monitoring (Enabled 30 Nov 2025)

| Feature | Status | Details |
|---------|--------|---------|
| Web Analytics | ✅ Enabled | Page views, visitors, UTM tracking |
| Speed Insights | ✅ Enabled | Core Web Vitals (LCP, FCP, CLS, FID) |
| Spend Management | ✅ Enabled | Alerts at 50%, 75%, 100% thresholds |

**Code Implementation:**
- `@vercel/analytics` package installed
- `@vercel/speed-insights` package installed
- Components added to App.jsx (v10.0)
- Dashboard enabled in Vercel project settings

---

## 4. GitHub Repository

### Repository Details

| Setting | Value |
|---------|-------|
| Owner | spac3man-G |
| Repository | amsf001-project-tracker |
| Default Branch | main |
| Visibility | Public |

### Security Features (Enabled 30 Nov 2025)

| Feature | Status | Description |
|---------|--------|-------------|
| Dependabot Alerts | ✅ Enabled | Vulnerability notifications |
| Dependabot Security Updates | ✅ Enabled | Auto PRs to fix vulnerabilities |
| Secret Scanning | ✅ Enabled | Detects exposed secrets |

### Git Workflow

```bash
# Navigate to project
cd /Users/glennnickols/Projects/amsf001-project-tracker

# Check status
git status

# Add all changes
git add -A

# Commit with message
git commit -m "Your commit message"

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

---

## 5. Anthropic API

### Configuration

The AI Chat uses Claude Haiku via Vercel Edge Function.

```
ANTHROPIC_API_KEY=[Your Anthropic API key]
```

### Edge Function Location

```
/api/chat.js
```

This function:
- Receives chat messages from frontend
- Calls Claude API
- Returns AI responses
- Includes project context for relevant answers
- Rate limited to 20 requests/minute

---

## 6. Local Development

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/spac3man-G/amsf001-project-tracker.git

# Navigate to project
cd amsf001-project-tracker

# Install dependencies
npm install

# Create .env file with:
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[your anon key]

# Start development server
npm run dev
```

### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

### Current Bundle Size

- **Total:** 445KB (gzipped: ~147KB)
- **App Core:** 119KB
- **Vendor Chunks:** Supabase 178KB, React 163KB, Icons 31KB

---

## 7. MCP Configuration

### Claude Desktop MCP Servers

Add to Claude Desktop config for direct database/file access:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://ltkbfbqfnskqgpcnvdxy.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[service role key]"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "[your GitHub PAT]"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/glennnickols/Projects"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| Desktop Commander | File operations, terminal commands |
| Filesystem | Read/write files |
| Supabase | Database queries via PostgREST |
| GitHub | Repository operations |
| Vercel | Deployment management |

---

## 8. SQL Scripts

### Script Location

All SQL scripts are in `/sql/` directory.

### Scripts Run Status

| Script | Purpose | Status |
|--------|---------|--------|
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Done |
| P5b-partner-invoices-rls.sql | Invoice RLS | ✅ Done |
| P6-enhanced-invoice-lines.sql | Enhanced invoice schema | ✅ Done |
| data-integrity-constraints.sql | NOT NULL, indexes | ✅ Done |
| soft-delete-implementation.sql | Soft delete columns | ✅ Done |
| audit-triggers.sql | Audit logging triggers | ✅ Done |
| user_projects table | Multi-tenant foundation | ✅ Done |
| projects.description | Project description column | ✅ Done |

### All Database Migrations Complete

No pending SQL scripts to run.

---

## 9. Infrastructure Status

### Complete Infrastructure Checklist ✅

| Category | Item | Status | Date |
|----------|------|--------|------|
| **Monitoring** | Vercel Web Analytics | ✅ | 30 Nov 2025 |
| **Monitoring** | Vercel Speed Insights | ✅ | 30 Nov 2025 |
| **Security** | GitHub Dependabot Alerts | ✅ | 30 Nov 2025 |
| **Security** | GitHub Security Updates | ✅ | 30 Nov 2025 |
| **Security** | GitHub Secret Scanning | ✅ | 30 Nov 2025 |
| **Security** | Input Sanitisation (XSS) | ✅ | 30 Nov 2025 |
| **Security** | Rate Limiting (AI Chat) | ✅ | 30 Nov 2025 |
| **Data** | Supabase Daily Backups | ✅ | 30 Nov 2025 |
| **Data** | Soft Delete (9 tables) | ✅ | 30 Nov 2025 |
| **Data** | Audit Logging (8 tables) | ✅ | 30 Nov 2025 |
| **Cost** | Vercel Spend Alerts | ✅ | 30 Nov 2025 |

### Spend Management Settings

| Threshold | Notification |
|-----------|-------------|
| 50% | ✅ Web + Email |
| 75% | ✅ Web + Email |
| 100% | ✅ Web + Email |

Note: Vercel provides fixed thresholds only (50/75/100%). Custom thresholds not available.

---

## 10. Troubleshooting

### Build Failures

**"Unterminated regular expression" error:**
- Check for Unicode characters (✓, ✗, →) in JSX
- Replace with ASCII equivalents or remove

**"Module not found" error:**
- Check import paths
- Run `npm install`
- Clear node_modules and reinstall

### Vercel Deployment Errors

1. Check Vercel Dashboard → Deployments
2. Click failed deployment
3. View Build Logs
4. Fix error and push again

### Database Issues

**RLS policy errors:**
- Check profiles table has role column
- Don't reference profiles.project_id (doesn't exist)
- Use simplified role checks in policies

**Data not showing:**
- Check project_id filtering
- Verify RLS policies allow access
- Check browser console for errors
- Check is_deleted = false filter

**Invoice showing £0.00:**
- Check timesheets exist in date range
- Verify resources are linked to partner
- Both Approved AND Submitted timesheets now included

### Common Fixes

```bash
# Clear npm cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install

# Reset local changes
git checkout -- .

# Force rebuild on Vercel
# (Make empty commit)
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

---

## Appendix: Test Accounts

| Email | Role | Purpose |
|-------|------|---------|
| glenn.nickols@progressive.gg | supplier_pm | Supplier PM testing |
| [admin email] | admin | Admin testing |
| [customer email] | customer_pm | Customer PM testing |
| [contributor email] | contributor | Contributor testing |

---

## Appendix: Key Features Summary

### Production Hardening (Complete)

- **Soft Delete**: 9 tables with is_deleted, deleted_at, deleted_by
- **Audit Logging**: 8 tables with full change history
- **Input Sanitisation**: sanitize.js with XSS protection
- **Rate Limiting**: 20 req/min on AI chat
- **Session Management**: 60s checks, auto-refresh
- **Bundle Optimisation**: 445KB (was 821KB)

### Infrastructure Monitoring (Complete)

- **Performance**: Vercel Speed Insights (Core Web Vitals)
- **Usage**: Vercel Web Analytics (page views, visitors)
- **Security**: Dependabot alerts, secret scanning
- **Backups**: Daily with 7-day retention
- **Cost**: Spend alerts at 50/75/100%

---

*End of Configuration Guide v7.0*
