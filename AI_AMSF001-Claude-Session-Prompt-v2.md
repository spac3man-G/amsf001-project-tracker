# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 2.0  
**Last Updated:** 29 November 2025

---

## How to Use This Document

**Upload this file along with `AMSF001-Configuration-Guide.md` when starting a new Claude session or adding to a Claude Project.**

The Configuration Guide contains all credentials and setup information. This prompt tells Claude how to work with your project.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded `AMSF001-Configuration-Guide.md` with this prompt.** It contains:
- All API keys and credentials (Supabase, GitHub, Vercel)
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
| Build | Vite |
| Backend | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel (auto-deploys from GitHub) |
| Repository | github.com/spac3man-G/amsf001-project-tracker |

---

## How You Access My System

You have access to my Mac via MCP tools:

1. **Filesystem MCP** - Read/write files in `/Users/glennnickols/`
2. **AppleScript (osascript)** - Execute shell commands including Git
3. **Vercel MCP** - Check deployments, view logs
4. **Supabase MCP** - Query/modify database via PostgREST
5. **GitHub MCP** - Available but **DO NOT USE for file operations** (unreliable)

---

## Key File Locations

| Item | Path |
|------|------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v7.md` |
| **Shared Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/common` |

---

## Read the Development Playbook

**Before doing any development work, read the playbook from my local repository:**

```
/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v7.md
```

The playbook contains:
- Current project status and what's completed
- Remaining tasks with priorities
- Architecture patterns (usePermissions hook, AuthContext, ProjectContext)
- Shared components reference
- Code examples and patterns to follow

---

## Standard Workflow

### 1. Check Current State
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
```

### 2. Make Changes
Use Filesystem MCP tools to read and edit files.

### 3. Commit and Deploy
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description' && git push origin main"
```

### 4. Verify Deployment
Use Vercel MCP to check deployment status.

---

## Current Project Status (as of 29 Nov 2025)

### ✅ Recently Completed
- **Phase F1:** Code cleanup complete (ProtectedRoute, Layout permissions, duplicate files)
- **Phase F2:** All 7 shared components created (ErrorBoundary, LoadingSpinner, StatCard, PageHeader, StatusBadge, DataTable, ConfirmDialog)
- **Phase F2 Integration:** LoadingSpinner integrated in all 19 pages
- **Phase F2 Integration:** ErrorBoundary integrated in App.jsx
- **Phase F2 Integration:** Dashboard fully integrated with PageHeader, StatCard, StatusBadge
- **Phase F2 Integration:** All 18 remaining pages have imports ready for components

### 🟡 In Progress
- **Phase F2-Integration:** Continue integrating PageHeader, StatCard, StatusBadge into remaining pages

### ❌ Next Priorities
- **Integration Priority:** KPIs, QualityStandards, Resources pages (have stat cards)
- **Integration Priority:** Milestones, Deliverables pages (have status badges)
- **Future:** Reports page implementation
- **Future:** Services layer (F3)

### 📋 Technical Debt Noted
- Timesheets and Expenses use CSS class-based status badges (`.status-badge .status-approved`) while StatusBadge component uses inline styles - leave as-is for now

### 🚀 Current Deployment
- **URL:** https://amsf001-project-tracker.vercel.app
- **Status:** ✅ READY
- **Last Commit:** `37181dc4` - Phase F2 Integration (Part 2)

---

## My Request

[STATE YOUR SPECIFIC REQUEST HERE]

Examples:
- "Let's continue integrating the shared components into the KPIs page"
- "Please read the playbook and summarize the current status"
- "I'm seeing an error on [page] - please investigate"
- "Let's implement the Reports page"
- "Let's add ConfirmDialog to delete confirmations"

---

## END OF PROMPT

---

## Tips for Best Results

1. **Always upload both files** - This prompt AND the Configuration Guide
2. **Ask Claude to read the playbook first** for any development work
3. **Be specific** about what you want to accomplish
4. **Test incrementally** - deploy after each significant change
5. **Update the playbook** when tasks are completed

---

## Quick Reference: Session Starters

### For Development Tasks
```
[Upload both files, then say:]

Please read the Development Playbook at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v7.md and then let's implement [TASK].
```

### For Bug Fixes
```
[Upload both files, then say:]

I'm seeing an error on the [PAGE] page when I [ACTION]. Please investigate and fix it.
```

### For Status Updates
```
[Upload both files, then say:]

Please read the playbook and give me a summary of what's completed and what the next priorities are.
```

### For Component Integration
```
[Upload both files, then say:]

Let's continue integrating the shared components. Check the playbook for what's done and what's next.
```

---

## Architecture Quick Reference

### Import Shared Components
```javascript
import { 
  LoadingSpinner, 
  PageHeader, 
  StatCard, 
  StatusBadge, 
  DataTable, 
  ConfirmDialog 
} from '../components/common';
```

### Use Permissions Hook
```javascript
import { usePermissions } from '../hooks/usePermissions';

const { canAddTimesheet, canEditExpense, hasRole } = usePermissions();
```

### Use Contexts
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

const { user, role } = useAuth();
const { projectId } = useProject();
```
