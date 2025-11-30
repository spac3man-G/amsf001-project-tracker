# AMSF001 Project Tracker - Configuration Guide

**Version:** 5.0  
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

---

## 2. Supabase Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ltkbfbqfnskqgpcnvdxy |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |

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

---

## 3. Vercel Configuration

### Project Details

| Setting | Value |
|---------|-------|
| Team | Glenn's projects |
| Team ID | team_earXYyEn9jCrxby80dRBGlfP |
| Project | amsf001-project-tracker |
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

---

## 4. GitHub Repository

### Repository Details

| Setting | Value |
|---------|-------|
| Owner | spac3man-G |
| Repository | amsf001-project-tracker |
| Default Branch | main |
| Visibility | Public |

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

### Scripts to Run (in order)

| Script | Purpose | Required |
|--------|---------|----------|
| P1-partners-table.sql | Partners table | ✅ Done |
| P3a-add-partner-id-to-resources.sql | Resource partner link | ✅ Done |
| P4-add-procurement-method-to-expenses.sql | Procurement tracking | ✅ Done |
| add-resource-id-to-expenses.sql | FK to resources | ✅ Done |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Done |
| **P5b-partner-invoices-rls.sql** | Invoice RLS | ⚠️ Run this |
| data-integrity-constraints.sql | NOT NULL, indexes | ✅ Done |

### Running Scripts

1. Go to Supabase Dashboard
2. SQL Editor (left sidebar)
3. New Query
4. Paste script contents
5. Click "Run"
6. Check Results for success

---

## 9. Troubleshooting

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

*End of Configuration Guide v5.0*
