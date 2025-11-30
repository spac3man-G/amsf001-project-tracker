# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 4.0  
**Last Updated:** 30 November 2025

---

## How to Use This Document

**Upload this file along with the Configuration Guide when starting a new Claude session.**

The Configuration Guide (in Claude Project Knowledge) contains all credentials and API keys.

---

## PROMPT FOR CLAUDE

---

I need help developing the AMSF001 Project Tracker application. 

## Important: Configuration Document

**I've uploaded the Configuration Guide with this prompt.** It contains:
- All API keys and credentials (Supabase, GitHub, Vercel, Anthropic)
- MCP configuration for Claude Desktop
- AppleScript commands for Git operations

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
2. **Desktop Commander** - Execute shell commands including Git
3. **Vercel MCP** - Check deployments, view logs
4. **Supabase MCP** - Query/modify database via PostgREST
5. **GitHub MCP** - Available but prefer local Git for file operations

---

## Key File Locations

| Item | Path |
|------|------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Services Layer** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/services` |
| **SQL Scripts** | `/Users/glennnickols/Projects/amsf001-project-tracker/sql` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v9.md` |

---

## Read the Development Playbook

**Before doing any development work, read the playbook:**

```
/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v9.md
```

The playbook contains:
- Current project status and completed phases
- Architecture patterns (Services Layer, Contexts, Permissions)
- Database schema and relationships
- Roadmap and next steps

---

## Current Project Status (as of 30 Nov 2025)

### ✅ Completed Features

| Feature | Description |
|---------|-------------|
| **Partners Management** | Full CRUD with Partner Detail page |
| **Resources Enhancement** | Types (supplier/partner/customer), partner links |
| **Services Layer** | BaseService, PartnersService, ResourcesService |
| **Data Integrity** | NOT NULL constraints, foreign keys, indexes |
| **Date Range Filtering** | Month quick-select, custom ranges on Partner Detail |
| **AI Chat Assistant** | Claude Haiku integration |

### 🔜 Next Priorities

1. **Phase P4: Expenses Enhancement**
   - Add `procurement_method` field (supplier/partner)
   - Update forms and summaries

2. **Phase P5: Partner Invoicing**
   - Invoice generation from Partner Detail
   - Date range already implemented
   - Export to PDF/CSV

3. **Phase P6: Reporting**
   - Partner cost breakdowns
   - Resource utilization by type

### 🚀 Current Deployment
- **URL:** https://amsf001-project-tracker.vercel.app
- **Status:** ✅ READY

---

## Architecture Quick Reference

### Services Layer (Use This!)
```javascript
import { partnersService, resourcesService } from '../services';

// All methods include project filtering
const partners = await partnersService.getAll(projectId);
const resources = await resourcesService.getByPartner(partnerId);
```

### Permissions Hook
```javascript
import { usePermissions } from '../hooks/usePermissions';

const { 
  canManagePartners,    // Boolean
  canSeeResourceType,   // Boolean
  canEditExpense,       // Function
  hasRole               // Utility
} = usePermissions();
```

### Contexts
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

const { user, role, linkedResource } = useAuth();
const { projectId } = useProject();
```

### Shared Components
```javascript
import { 
  LoadingSpinner, PageHeader, StatCard, 
  StatusBadge, ConfirmDialog 
} from '../components/common';
```

---

## Standard Workflow

### 1. Check Current State
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker && git status
```

### 2. Make Changes
Use Filesystem MCP or Desktop Commander to read and edit files.

### 3. Commit and Deploy
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Description' && git push origin main
```

### 4. Verify Deployment
Use Vercel MCP to check deployment status.

---

## Database Reference

### Key Tables
- `partners` - Third-party supplier companies
- `resources` - Team members (with `resource_type`, `partner_id`)
- `expenses` - With `resource_id` foreign key
- `timesheets` - Time entries

### Data Integrity
All tables have:
- `project_id NOT NULL`
- Foreign key to `projects(id)` with CASCADE
- Performance indexes

---

## My Request

[STATE YOUR SPECIFIC REQUEST HERE]

Examples:
- "Let's implement Phase P4: Expenses Enhancement"
- "I need to add the procurement_method field to expenses"
- "Please create the partner invoicing feature"
- "There's a bug on [page] - please investigate"
- "Update the documentation to reflect recent changes"

---

## END OF PROMPT

---

## Session Starters

### For Development
```
Please read the Development Playbook at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v9.md and then let's implement [TASK].
```

### For Bug Fixes
```
I'm seeing an error on the [PAGE] page when I [ACTION]. Please investigate and fix it.
```

### For Status Check
```
Please read the playbook and summarize what's completed and what's next.
```

---

## Phase Summary

| Phase | Status |
|-------|--------|
| F1-F3 | ✅ Complete (Foundation) |
| AI | ✅ Complete (Chat) |
| P1-P3 | ✅ Complete (Partners, Resources) |
| P4 | 🔜 Next (Expenses) |
| P5 | 🔜 Planned (Invoicing) |
| P6 | 🔜 Planned (Reporting) |
