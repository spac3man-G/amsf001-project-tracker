# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 2.0  
**Last Updated:** 29 November 2025

---

## How to Use This Prompt

Copy everything below the line into a new Claude chat to start a development session. The Configuration Guide with credentials should be uploaded to your Claude Project Knowledge (not pasted into chat).

---

## PROMPT FOR CLAUDE

---

I need help developing the **AMSF001 Project Tracker** application.

## Project Overview

| Component | Details |
|-----------|---------|
| **Application** | AMSF001 Project Tracker |
| **Tech Stack** | React 18.2 + Vite + Supabase + Vercel |
| **Repository** | github.com/spac3man-G/amsf001-project-tracker |
| **Live Site** | https://amsf001-project-tracker.vercel.app |
| **Local Repo** | `/Users/glennnickols/Projects/amsf001-project-tracker` |

---

## How You Access My System

You have access to my Mac via MCP tools:

| Tool | Purpose |
|------|---------|
| **Filesystem MCP** | Read/write files in `/Users/glennnickols/` |
| **AppleScript (osascript)** | Execute Git commands via shell |
| **Vercel MCP** | Check deployments, view logs |
| **Supabase MCP** | Query/modify database via PostgREST |

**Important:** Do NOT use GitHub API for file operations - use local Git via AppleScript instead.

---

## Key Documents to Read

Before starting work, read the **Development Playbook v6** from my local repository:

```
/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v6.md
```

The playbook contains:
- Current project status and completed phases
- Architecture patterns (AuthContext, usePermissions hook)
- Development phases with priorities
- Code examples and anti-patterns to avoid
- RLS policy documentation

---

## Current Project Status (as of 29 Nov 2025)

### ✅ Completed Phases

| Phase | Description |
|-------|-------------|
| Phase 0 | Foundation: AuthContext, ProjectContext, permissions.js, usePermissions hook |
| Phase 1 | Database: cost_price column, RLS policies for KPIs and Resources |
| Phase 2 | All 10 pages migrated to usePermissions hook |
| Phase 4.3 | Settings page rebuilt and functional |
| Phase 5.1 | KPI Add/Delete UI |
| Phase 5.2 | Cost price and margins UI on Resources page |
| **Phase F1** | **Code cleanup: ProtectedRoute uses AuthContext, Layout uses centralized permissions** |

### ❌ Next Phases (Choose One)

**Option A - Phase F2: Shared Components** (Infrastructure)
- Create reusable UI components (ErrorBoundary, LoadingSpinner, StatCard, etc.)
- Reduces code duplication across pages
- Better long-term maintainability

**Option B - Phase F4: Feature Development** (Visible Features)
- F4.1: Margin Dashboard Card
- F4.2: Reports Page (functional)
- F4.3: Project Members Table (multi-tenancy)
- F4.4: PDF Invoice Generation

---

## Standard Git Workflow

**Check status:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
```

**Commit and deploy:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X: Description' && git push origin main"
```

Pushing to main triggers automatic Vercel deployment.

---

## My Request

[STATE YOUR SPECIFIC REQUEST HERE]

**Examples:**
- "Read the playbook and let's start Phase F2 - create the shared components"
- "Let's implement F4.1 - add the Margin Dashboard Card"
- "I'm seeing an error on [page] - please investigate"
- "Give me a status update on where we are"

---

## END OF PROMPT

---

## Quick Reference: Common Session Starters

### For Development Tasks
```
Read the playbook at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v6.md and let's implement [PHASE/TASK].
```

### For Bug Fixes
```
I'm seeing an error on the [PAGE] page when I [ACTION]. Please investigate and fix it.
```

### For Status Check
```
Read the playbook and give me a summary of what's completed and what the next priorities are.
```

### To Continue Where We Left Off
```
Read the playbook and continue with the next task in the current phase.
```

---

## Notes

- **Credentials:** Stored in Claude Project Knowledge (AMSF001-Configuration-Guide.md)
- **Playbook Location:** `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v6.md`
- **Testing:** Deploy to Vercel and test on live site (no local dev server)
- **Git:** Always use AppleScript shell commands, not GitHub API
