# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 3.0  
**Last Updated:** 30 November 2025

---

## How to Use This Document

**Upload this file along with `AI_AMSF001-Configuration-Guide.md` when starting a new Claude session or adding to a Claude Project.**

The Configuration Guide contains all credentials and setup information. This prompt tells Claude how to work with your project.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded `AI_AMSF001-Configuration-Guide.md` with this prompt.** It contains:
- All API keys and credentials (Supabase, GitHub, Vercel, Anthropic)
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
| AI Chat | Claude API (Haiku) via Vercel Edge Function |
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
| **API Functions** | `/Users/glennnickols/Projects/amsf001-project-tracker/api` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v8.md` |
| **Shared Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/common` |
| **Chat Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/chat` |
| **Services (Planned)** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/services` |

---

## Read the Development Playbook

**Before doing any development work, read the playbook from my local repository:**

```
/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v8.md
```

The playbook contains:
- Current project status and what's completed
- Remaining tasks with priorities
- Architecture patterns (usePermissions hook, AuthContext, ProjectContext, ChatContext)
- Shared components reference
- Services layer design (planned)
- Partners & Resource Types feature specification

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

## Current Project Status (as of 30 Nov 2025)

### ✅ Recently Completed
- **AI Chat Assistant** - Floating chat widget with Claude Haiku integration
- **Phase F1:** Code cleanup complete
- **Phase F2:** All 7 shared components created
- **Phase F2 Integration:** LoadingSpinner in all pages, Dashboard fully integrated

### 🟡 In Progress
- **Partners & Resource Types** - Feature design complete, ready for implementation

### 🔜 Next Priorities (Foundation First Approach)
1. **Phase F3:** Services Layer Foundation
   - Create `base.service.js` with common CRUD patterns
   - Create `partners.service.js` as first implementation
   
2. **Phase P1:** Database Schema
   - Create `partners` table
   - Update `resources` table (resource_type, partner_id)
   - Update `expenses` table (procurement_method)

3. **Phase P2-P6:** Partners feature implementation

### 📋 Feature: Partners & Resource Types

**Purpose:** Differentiate between supplier resources, third-party partner resources, and customer resources for invoicing and expense management.

**Key Concepts:**
- **Resource Types:** `supplier` | `partner` | `customer`
- **Partners:** Third-party companies (e.g., Agilisys, CGI)
- **Procurement Method:** For expenses - `supplier` (JT paid) | `partner` (partner paid)
- **Invoice Generation:** Partner invoices exclude supplier-procured expenses from total

### 🚀 Current Deployment
- **URL:** https://amsf001-project-tracker.vercel.app
- **Status:** ✅ READY
- **AI Chat:** ✅ Functional (ANTHROPIC_API_KEY configured)

---

## My Request

[STATE YOUR SPECIFIC REQUEST HERE]

Examples:
- "Let's start implementing the Services Layer (Phase F3)"
- "Please read the playbook and summarize the Partners feature plan"
- "Let's create the partners database table"
- "I'm seeing an error on [page] - please investigate"
- "Let's continue with Phase P2: Partners page"

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

Please read the Development Playbook at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v8.md and then let's implement [TASK].
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

### For New Features
```
[Upload both files, then say:]

Let's start working on [FEATURE]. Check the playbook for the implementation plan.
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

import { ChatWidget } from '../components/chat';
```

### Use Permissions Hook
```javascript
import { usePermissions } from '../hooks/usePermissions';

const { canAddTimesheet, canEditExpense, canManagePartners, hasRole } = usePermissions();
```

### Use Contexts
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useChat } from '../contexts/ChatContext';

const { user, role } = useAuth();
const { projectId } = useProject();
const { sendMessage, isOpen } = useChat();
```

### Use Services (Planned)
```javascript
import { partnersService, resourcesService } from '../services';

const partners = await partnersService.getAll(projectId);
await partnersService.create({ name: 'Acme Corp', ... });
```

---

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| F1 | Code Cleanup | ✅ Complete |
| F2 | Shared Components | ✅ Complete |
| AI | Chat Assistant | ✅ Complete |
| F3 | Services Layer | 🔜 Next |
| P1 | Database Schema | 🔜 Planned |
| P2 | Partners Page | 🔜 Planned |
| P3 | Resources Enhancement | 🔜 Planned |
| P4 | Expenses Enhancement | 🔜 Planned |
| P5 | Partner Invoicing | 🔜 Planned |
| P6 | Reporting | 🔜 Planned |
