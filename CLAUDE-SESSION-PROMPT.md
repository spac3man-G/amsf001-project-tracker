# AMSF001 Project Tracker - Claude Session Starter Prompt

Use this prompt to start a new Claude session for working on the AMSF001 Project Tracker.

---

## COPY THIS PROMPT:

---

I need help developing the AMSF001 Project Tracker application. Here's the setup:

## Project Overview

**AMSF001 Project Tracker** is a React + Vite web application for managing a Government of Jersey / JT Telecom project. It uses:
- **Frontend:** React 18.2 with React Router 6
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Repository:** github.com/spac3man-G/amsf001-project-tracker

## How You Access My System

You have access to my Mac via MCP tools:
1. **Filesystem MCP** - Read/write files in my home directory
2. **AppleScript (osascript)** - Execute shell commands including Git
3. **Vercel MCP** - Check deployments, view logs
4. **Supabase MCP** - Query/modify database via PostgREST
5. **GitHub MCP** - Available but we prefer local Git via AppleScript (more reliable)

## Key File Locations

| Item | Path |
|------|------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v5.md` |
| **Configuration Guide** | Project knowledge (AMSF001-Configuration-Guide-v2.md) |
| **User Manual** | Project knowledge (AMSF001-User-Manual-UPDATED.md) |

## IMPORTANT: Read the Playbook First

Before doing any work, please read the Development Playbook v5:
```
/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v5.md
```

This contains:
- Current project status and what's completed
- Architecture patterns (AuthContext, ProjectContext, usePermissions hook)
- Remaining tasks with priorities
- Code patterns and examples
- Deployment procedures

## Standard Workflow

1. **Check current state:**
   ```applescript
   do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
   ```

2. **Make changes** using Filesystem MCP tools

3. **Commit and deploy:**
   ```applescript
   do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description' && git push origin main"
   ```

4. **Verify deployment** using Vercel MCP

## Current Status (as of 29 Nov 2025)

✅ **Completed:**
- Phase 0: AuthContext, ProjectContext, permissions.js, usePermissions hook
- Phase 2: All 10 pages migrated to usePermissions hook
- Phase 4: Settings page rebuilt and functional
- Various bug fixes (Expenses crash, permission function call bugs)

❌ **Next Priority Tasks:**
- Phase 5.1: KPI Add/Delete UI (no "Add KPI" button exists yet)
- Phase 1.1: Add cost_price column to resources table
- Phase 5.2: Cost price and margins UI

## My Request

[STATE YOUR SPECIFIC REQUEST HERE - e.g., "Let's implement Phase 5.1: Add KPI functionality to the KPIs page"]

---

## END OF PROMPT

---

## Tips for Best Results

1. **Be specific** about what you want to accomplish
2. **Reference the playbook** - it has detailed task breakdowns
3. **Let Claude read files first** before making changes
4. **Test incrementally** - deploy after each significant change
5. **Update the playbook** when tasks are completed

## Example Session Starters

**For KPI Add/Delete:**
```
I need help developing the AMSF001 Project Tracker application. [PASTE FULL PROMPT ABOVE]

My Request: Let's implement Phase 5.1 - add the "Add KPI" button and delete functionality to the KPIs page. Please read the playbook first to understand the current architecture and patterns.
```

**For Database Changes:**
```
I need help developing the AMSF001 Project Tracker application. [PASTE FULL PROMPT ABOVE]

My Request: Let's implement Phase 1.1 - add the cost_price column to the resources table. Please check the current database schema first.
```

**For Bug Fixes:**
```
I need help developing the AMSF001 Project Tracker application. [PASTE FULL PROMPT ABOVE]

My Request: I'm seeing an error on the Expenses page when I try to [describe issue]. Please investigate and fix it.
```

**For Status Check:**
```
I need help developing the AMSF001 Project Tracker application. [PASTE FULL PROMPT ABOVE]

My Request: Please read the playbook and give me a summary of what's completed and what the next priorities are.
```
