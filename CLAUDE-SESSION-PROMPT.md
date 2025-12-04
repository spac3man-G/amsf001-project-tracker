# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 3.0  
**Last Updated:** 4 December 2025

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

## Current Project Status (as of 4 December 2025)

### ✅ Recently Completed

| Date | Work Completed |
|------|----------------|
| 4 Dec | Financial calculations refactoring (Phase I-III) |
| 4 Dec | Dashboard widgets: Timesheets + Expenses |
| 4 Dec | Database column renames (daily_rate→sell_price, budget→billable) |
| 3 Dec | Supabase .single() error fix across all services |
| 3 Dec | UI consistency - full row clickability |
| 3 Dec | Detail modals for timesheets, expenses, deliverables |
| 2 Dec | Apple Design System implementation |
| 1 Dec | AI Chat Assistant + Smart Receipt Scanner |

### ✅ Completed Phases

| Phase | Description |
|-------|-------------|
| Phase 0 | Foundation: AuthContext, ProjectContext, permissions.js, usePermissions hook |
| Phase 1 | Database: cost_price column, RLS policies for KPIs and Resources |
| Phase 2 | All 10 pages migrated to usePermissions hook |
| Phase 4.3 | Settings page rebuilt and functional |
| Phase 5.1 | KPI Add/Delete UI |
| Phase 5.2 | Cost price and margins UI on Resources page |
| Phase F1 | Code cleanup: ProtectedRoute uses AuthContext |
| Phase I-III | Financial calculations centralization + DB renames |

### ❌ Pending Tasks

| Priority | Task | Notes |
|----------|------|-------|
| ⚠️ URGENT | P9: Milestone RLS Policies | SQL ready in `sql/P9-milestone-update-rls.sql` |
| Medium | P8: Deliverables Contributor Access | SQL ready |
| Low | Additional dashboard widgets | KPIs, Quality Standards, Partners |

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
- **Session Summaries:** Check `SESSION-SUMMARY-2025-12-*.md` files for recent work history
- **Testing:** Deploy to Vercel and test on live site (no local dev server)
- **Git:** Always use AppleScript shell commands, not GitHub API

## Key Documentation Files

| File | Purpose |
|------|---------|
| `AMSF001-Technical-Reference.md` | Architecture, services, troubleshooting |
| `ROADMAP-2025-12.md` | Development priorities and status |
| `SESSION-SUMMARY-2025-12-04.md` | Most recent session work (4 Dec 2025) |
| `src/config/metricsConfig.js` | Financial calculation utilities |
| `src/components/dashboard/` | Dashboard widgets (Milestones, Deliverables, Timesheets, Expenses) |
