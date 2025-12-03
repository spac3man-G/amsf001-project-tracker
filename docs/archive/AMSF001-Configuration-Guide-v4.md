# AMSF001 Project Tracker - Configuration Guide

> **Version:** 4.0  
> **Last Updated:** 30 November 2025

---

## 🚀 Deployment Workflow

**Primary workflow for all development:**

```
Local Changes → git push origin main → GitHub → Vercel Auto-Deploy → Live
```

Push to `main` triggers automatic Vercel deployment. No manual steps needed.

---

## 🔐 Credentials Note

**API keys and credentials are stored in Claude Project Knowledge**, not in this public file.

When starting a Claude session, ensure you have access to:
- Supabase API keys
- GitHub Personal Access Token (if needed)
- Anthropic API key (for AI Chat)

---

## 📋 Project Overview

| Property | Value |
|----------|-------|
| **Application** | AMSF001 Project Tracker |
| **Production URL** | https://amsf001-project-tracker.vercel.app |
| **Repository** | https://github.com/spac3man-G/amsf001-project-tracker |
| **Local Path** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Framework** | React + Vite |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |
| **AI Chat** | Claude API (Haiku) |

---

## 🛠 MCP Tools Available

| Tool | Purpose |
|------|---------|
| **Filesystem MCP** | Read/write local files |
| **Desktop Commander** | Execute shell commands, Git operations |
| **Vercel MCP** | Check deployments, view logs |
| **Supabase MCP** | Database queries via PostgREST |
| **GitHub MCP** | Repository operations (prefer local Git) |

### Git Commands

```bash
# Check status
cd /Users/glennnickols/Projects/amsf001-project-tracker && git status

# Commit and push
cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Message' && git push origin main
```

---

## 📁 Key File Locations

| File | Location |
|------|----------|
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Services Layer** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/services` |
| **API Functions** | `/Users/glennnickols/Projects/amsf001-project-tracker/api` |
| **SQL Scripts** | `/Users/glennnickols/Projects/amsf001-project-tracker/sql` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v9.md` |

---

## 🗄️ Database Configuration

### Supabase Project
- **Dashboard:** https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
- **Project ID:** ljqpmrcqxzgcfojrkxce

### Key Tables
| Table | Purpose |
|-------|---------|
| `projects` | Multi-tenant project container |
| `profiles` | User profiles with roles |
| `partners` | Third-party suppliers |
| `resources` | Team members |
| `timesheets` | Time entries |
| `expenses` | Expense records |
| `milestones` | Project milestones |
| `deliverables` | Milestone deliverables |

### Data Integrity
All tables enforce:
- `project_id NOT NULL`
- Foreign key constraints with CASCADE
- Performance indexes

---

## 🤖 AI Chat Configuration

| Setting | Value |
|---------|-------|
| **Model** | claude-3-haiku-20240307 |
| **Endpoint** | `/api/chat` (Vercel Edge Function) |
| **Required Env** | `ANTHROPIC_API_KEY` |

---

## 🌐 Vercel Configuration

### Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `ANTHROPIC_API_KEY` | AI Chat functionality |

### Deployment URLs
| Type | URL |
|------|-----|
| Production | https://amsf001-project-tracker.vercel.app |
| Preview | Auto-generated per PR |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| AI Chat not working | Check ANTHROPIC_API_KEY in Vercel |
| Deployment not triggering | Verify push succeeded, check webhook |
| Supabase errors | Check RLS policies match user role |
| Data not appearing | Verify project_id filter in queries |
| Partner dropdown empty | Check canSeeResourceType permission |

---

## 📝 Related Documents

| Document | Version | Purpose |
|----------|---------|---------|
| Development Playbook | v9.0 | Implementation guide |
| Session Prompt | v4.0 | Claude session starter |
| Configuration Guide | v4.0 | This document |

---

## 🚦 Quick Start Checklist

For a new development session:

1. ✅ Upload Session Prompt v4 to Claude
2. ✅ Ensure Configuration Guide is accessible
3. ✅ Ask Claude to read the Development Playbook
4. ✅ State your specific task or question
5. ✅ Test changes locally or via Vercel preview
6. ✅ Commit and deploy via `git push origin main`

---

*Document Version: 4.0*  
*Last Updated: 30 November 2025*
