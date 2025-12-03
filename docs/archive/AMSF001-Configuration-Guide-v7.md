# AMSF001 Project Tracker - Configuration Guide

**Version:** 7.0  
**Last Updated:** 1 December 2025  
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
10. [Appendix A: MCP Git Timeout Resolution](#appendix-a-mcp-git-timeout-resolution)

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
| Development Playbook | v18.0 |
| User Manual | v6.0 |
| Configuration Guide | v7.0 |
| Master Document | v3.0 |

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
- **user_projects**: Users see own, admin manages all
- **audit_log**: Admin only

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
| Remote URL | https://github.com/spac3man-G/amsf001-project-tracker.git |

### Git Workflow

