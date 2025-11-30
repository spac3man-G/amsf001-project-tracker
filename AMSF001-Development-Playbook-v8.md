# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 8.0  
**Created:** 29 November 2025  
**Last Updated:** 30 November 2025  
**Purpose:** Foundation-first approach with Services Layer and Partners feature  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 28 Nov 2025 | Initial playbook created |
| 2.0 | 28 Nov 2025 | Added Phase 0 (Foundation), centralised permissions utility |
| 3.0 | 28 Nov 2025 | Added risk mitigations, copy-ready code, testing scripts |
| 4.0 | 29 Nov 2025 | Complete rewrite: Foundation First approach, multi-tenancy support |
| 5.0 | 29 Nov 2025 | Major progress update: usePermissions hook created, all pages migrated |
| 5.1 | 29 Nov 2025 | Added RLS Policy documentation, fixed Resources RLS policy |
| 6.0 | 29 Nov 2025 | Complete restructure: Foundation Consolidation phases, technical debt cleanup |
| 7.0 | 29 Nov 2025 | Phase F1 & F2 complete, shared components created and integrated |
| **8.0** | **30 Nov 2025** | **AI Chat Assistant added, Services Layer planned, Partners & Resource Types feature defined** |

---

## What's New in Version 8.0

### AI Chat Assistant Implemented ✅

A floating AI chat widget has been added to the application:

| Component | Description |
|-----------|-------------|
| **Chat Widget** | Floating button (bottom-right) with expandable chat panel |
| **AI Model** | Claude 3 Haiku (claude-3-haiku-20240307) |
| **Backend** | Vercel Edge Function (`/api/chat.js`) |
| **Context** | ChatContext.jsx for state management |
| **Features** | User context awareness, permission-aware data queries, markdown formatting |

**Files Added:**
- `api/chat.js` - Vercel Edge Function for Claude API
- `src/contexts/ChatContext.jsx` - Chat state management
- `src/components/chat/ChatWidget.jsx` - Chat UI component
- `src/components/chat/ChatWidget.css` - Styling
- `src/components/chat/index.js` - Barrel export

**Environment Variable Required:**
- `ANTHROPIC_API_KEY` - Must be set in Vercel Environment Variables

### New Feature: Partners & Resource Types (Planned)

A comprehensive feature for managing third-party partners and resource categorisation has been designed and is ready for implementation. See Phase F3 and P1-P6 below.

### Current Deployment Status

| Item | Status |
|------|--------|
| **Live URL** | https://amsf001-project-tracker.vercel.app |
| **Build Status** | ✅ READY |
| **Last Deployment** | 30 November 2025 |
| **AI Chat** | ✅ Functional (requires ANTHROPIC_API_KEY) |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File Structure](#3-file-structure)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Permissions & Security](#5-permissions--security)
6. [Development Phases](#6-development-phases)
7. [Phase Details](#7-phase-details)
8. [Working with Claude](#8-working-with-claude)
9. [Deployment Procedures](#9-deployment-procedures)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Project Overview

### What is AMSF001 Project Tracker?

A web-based project management tool for tracking the Network Standards and Design Architectural Services contract between Government of Jersey (customer) and JT Telecom (supplier).

**Key Features:**
- **Timesheets** - Billable hours tracking with approval workflows
- **Expenses** - Travel, accommodation, sustenance with chargeable/non-chargeable separation
- **Milestones** - Project phases with budget allocations
- **Deliverables** - Specific outputs tied to milestones with review workflow
- **KPIs & Quality Standards** - Performance metrics per SOW requirements
- **Certificates** - Milestone acceptance documentation with dual signatures
- **Resources** - Team members with rates, cost prices, and margin tracking
- **AI Chat Assistant** - Context-aware help and data queries

### User Roles

| Role | Primary Purpose | Key Permissions |
|------|-----------------|-----------------|
| **Viewer** | Read-only stakeholder access | View all data |
| **Contributor** | Team member | Log time/expenses for self |
| **Customer PM** | GoJ representative | Approve timesheets, validate chargeable expenses |
| **Supplier PM** | JT representative | Manage delivery, validate non-chargeable expenses, see costs/margins |
| **Admin** | Full system access | All permissions |

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | 6.x |
| Build Tool | Vite | 5.x |
| Icons | Lucide React | 0.294 |
| Charts | Recharts | 2.10 |
| Date Handling | date-fns | 3.0 |
| Backend | Supabase | 2.39 |
| Database | PostgreSQL | (via Supabase) |
| AI | Claude API | Haiku |
| Hosting | Vercel | - |
| Source Control | GitHub | - |

---

## 3. File Structure

### Current Structure (Post v8.0)

```
/
├── api/
│   └── chat.js                # ✅ NEW - Vercel Edge Function for AI chat
├── src/
│   ├── App.jsx                # ✅ Routes with context providers (v8.0)
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── components/
│   │   ├── common/            # ✅ Shared UI components
│   │   │   ├── index.js       # Barrel export file
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── DataTable.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── chat/              # ✅ NEW - AI Chat components
│   │   │   ├── index.js       # Barrel export
│   │   │   ├── ChatWidget.jsx # Chat UI component
│   │   │   └── ChatWidget.css # Chat styling
│   │   ├── Layout.jsx
│   │   ├── NotificationBell.jsx
│   │   └── NotificationPreferences.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx    # User, profile, role, linkedResource
│   │   ├── ProjectContext.jsx # Current project, multi-tenancy ready
│   │   ├── ChatContext.jsx    # ✅ NEW - AI chat state
│   │   ├── NotificationContext.jsx
│   │   └── TestUserContext.jsx
│   ├── hooks/
│   │   └── usePermissions.js  # Pre-bound permission functions
│   ├── lib/
│   │   ├── permissions.js     # 40+ permission functions
│   │   └── supabase.js        # Supabase client
│   ├── services/              # 🔜 PLANNED - Services layer
│   │   └── (to be created)
│   └── pages/
│       ├── Dashboard.jsx      # ✅ Fully integrated
│       ├── Timesheets.jsx
│       ├── Expenses.jsx
│       ├── Milestones.jsx
│       ├── MilestoneDetail.jsx
│       ├── Deliverables.jsx
│       ├── Resources.jsx
│       ├── KPIs.jsx
│       ├── KPIDetail.jsx
│       ├── QualityStandards.jsx
│       ├── QualityStandardDetail.jsx
│       ├── Settings.jsx
│       ├── Users.jsx
│       ├── Gantt.jsx
│       ├── NetworkStandards.jsx
│       ├── Standards.jsx
│       ├── WorkflowSummary.jsx
│       ├── AccountSettings.jsx
│       ├── ResetPassword.jsx
│       ├── Reports.jsx        # ❌ Still placeholder
│       └── Partners.jsx       # 🔜 PLANNED
└── vercel.json                # Vercel configuration with API routes
```

---

## 4. Architecture Patterns

### 4.1 Context Pattern

All pages use shared contexts for auth, project, and chat:

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useChat } from '../contexts/ChatContext';

export default function SomePage() {
  const { user, role, linkedResource } = useAuth();
  const { projectId, currentProject } = useProject();
  const { isOpen, sendMessage } = useChat();
}
```

### 4.2 usePermissions Hook Pattern

```javascript
import { usePermissions } from '../hooks/usePermissions';

export default function SomePage() {
  const { 
    canAddTimesheet,      // Boolean - no parentheses
    canEditExpense,       // Function - pass object
    hasRole               // Utility function
  } = usePermissions();

  return (
    <>
      {canAddTimesheet && <button>Add</button>}
      {canEditExpense(expense) && <button>Edit</button>}
      {hasRole(['admin', 'supplier_pm']) && <AdminPanel />}
    </>
  );
}
```

### 4.3 Shared Components Pattern

```javascript
import { 
  LoadingSpinner, 
  PageHeader, 
  StatCard, 
  StatusBadge, 
  DataTable, 
  ConfirmDialog,
  ErrorBoundary 
} from '../components/common';

import { ChatWidget } from '../components/chat';
```

### 4.4 Services Pattern (Planned)

```javascript
// Future pattern for data operations
import { partnersService, resourcesService } from '../services';

// In component
const partners = await partnersService.getAll(projectId);
await partnersService.create({ name: 'Acme Corp', ... });
```

---

## 5. Permissions & Security

### 5.1 Role Permission Matrix

| Action | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| **Timesheets** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Approve | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Expenses** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resources** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| See cost price | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Partners** (Planned) |
| View | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Partner Invoicing** (Planned) |
| Generate | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Settings** |
| Access | ❌ | ❌ | ❌ | ✅ | ✅ |

### 5.2 RLS Policies

Row Level Security (RLS) policies control database access. See Supabase Dashboard for current policies.

Standard policy template:
```sql
CREATE POLICY "Authenticated users can view table_name" 
ON table_name FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Supplier PM can manage table_name" 
ON table_name FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'supplier_pm')
  )
);
```

---

## 6. Development Phases

### Phase Overview

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| **F1** | Code Cleanup & Consolidation | ✅ Complete | - |
| **F2** | Shared Components | ✅ Complete | - |
| **F2-Int** | Component Integration | 🟡 In Progress | Medium |
| **AI** | AI Chat Assistant | ✅ Complete | - |
| **F3** | Services Layer Foundation | 🔜 Next | High |
| **P1** | Database Schema (Partners) | 🔜 Planned | High |
| **P2** | Partners Page | 🔜 Planned | High |
| **P3** | Resources Enhancement | 🔜 Planned | High |
| **P4** | Expenses Enhancement | 🔜 Planned | High |
| **P5** | Partner Invoicing | 🔜 Planned | High |
| **P6** | Reporting & Documentation | 🔜 Planned | Medium |
| **F4** | Reports Page | ❌ Not Started | Low |

### Completed Work Summary

| Phase | Task | Status | Date |
|-------|------|--------|------|
| F1 | Code cleanup complete | ✅ | 29 Nov |
| F2 | All 7 shared components created | ✅ | 29 Nov |
| F2-Int | LoadingSpinner in all 19 pages | ✅ | 29 Nov |
| F2-Int | Dashboard fully integrated | ✅ | 29 Nov |
| **AI** | **AI Chat Assistant implemented** | ✅ | **30 Nov** |

---

## 7. Phase Details

### Phase F3: Services Layer Foundation

**Goal:** Establish the services pattern for all data operations.

**New Structure:**
```
src/services/
├── index.js              # Barrel export
├── base.service.js       # Base class with CRUD
├── partners.service.js   # Partners operations
├── resources.service.js  # Resources operations
├── expenses.service.js   # Expenses operations
└── invoicing.service.js  # Invoice generation
```

**Base Service Pattern:**
```javascript
// src/services/base.service.js
import { supabase } from '../lib/supabase';

export class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async getAll(projectId, options = {}) {
    let query = supabase
      .from(this.tableName)
      .select(options.select || '*')
      .eq('project_id', projectId);
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getById(id) { /* ... */ }
  async create(record) { /* ... */ }
  async update(id, updates) { /* ... */ }
  async delete(id) { /* ... */ }
}
```

**Deliverables:**
- [ ] `base.service.js` created
- [ ] `partners.service.js` created
- [ ] `index.js` barrel export
- [ ] Documentation updated

---

### Phase P1: Database Schema & Migrations

**New Table: partners**
```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);
```

**Modify resources table:**
```sql
ALTER TABLE resources 
  ADD COLUMN partner_id UUID REFERENCES partners(id),
  ADD CONSTRAINT resources_resource_type_check 
    CHECK (resource_type IN ('supplier', 'partner', 'customer'));
```

**Modify expenses table:**
```sql
ALTER TABLE expenses
  ADD COLUMN procurement_method TEXT DEFAULT 'supplier'
    CHECK (procurement_method IN ('supplier', 'partner'));
```

**Data Migration:**
- `internal` → `supplier`
- `third_party` → `partner`

---

### Phase P2: Partners Page

**New Files:**
- `src/pages/Partners.jsx` - Partners list with CRUD
- `src/services/partners.service.js` - Partners service

**Layout Update:**
Add Partners to sidebar (Admin/Supplier PM only)

**Permissions:**
- `canManagePartners()`
- `canViewPartners()`

---

### Phase P3: Resources Enhancement

**Changes:**
1. `resource_type`: `supplier` | `partner` | `customer`
2. Partner dropdown (when type = partner)
3. Customer defaults to £0 rates
4. Use `resources.service.js`

---

### Phase P4: Expenses Enhancement

**Changes:**
1. Add `procurement_method` field
2. Update summaries with chargeable/procurement breakdown
3. Role-appropriate views
4. Use `expenses.service.js`

---

### Phase P5: Partner Invoicing

**New Page:** `src/pages/PartnerInvoicing.jsx`

**Features:**
- Date range filter
- Partner/resource selection
- Content type (timesheets/expenses/both)
- Invoice preview with:
  - Timesheets total (at cost rate)
  - Partner-procured expenses (included in total)
  - Supplier-procured expenses (for reference, NOT in total)
- Export to PDF/CSV

**Invoice Output:**
```
PARTNER INVOICE SUMMARY
Partner: [Name]
Period: [Start] to [End]

TIMESHEETS
[Resource] | [Hours] | [Cost Rate] | [Total]
                     Timesheet Total: £X,XXX

EXPENSES (Partner-Procured) - INCLUDED IN TOTAL DUE
[Details...]
                     Partner-Procured Total: £X,XXX

EXPENSES (Supplier-Procured) - FOR REFERENCE ONLY
[Details...]
                     Supplier-Procured Total: £X,XXX (not invoiced)

SUMMARY
Timesheets:                    £X,XXX
Expenses (Partner-Procured):   £X,XXX
─────────────────────────────────────
TOTAL DUE:                     £X,XXX
```

---

### Phase P6: Reporting & Documentation

- Reports page: Add resource type filters
- Dashboard: Consider partner cost breakdown card
- Playbook v9: Final documentation
- Database schema sync

---

## 8. Working with Claude

### Starting a New Session

Upload these files:
1. `AI_AMSF001-Claude-Session-Prompt-v3.md`
2. `AI_AMSF001-Configuration-Guide.md`

Then ask Claude to read the Development Playbook from the repository.

### Standard Workflow

```applescript
-- Check status
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"

-- Commit and deploy
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X: Description' && git push origin main"
```

---

## 9. Deployment Procedures

### Automatic Deployment

Push to `main` branch triggers automatic Vercel deployment.

### Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | **Required for AI Chat** |

### Production URLs

- **Primary:** https://amsf001-project-tracker.vercel.app
- **GitHub:** https://github.com/spac3man-G/amsf001-project-tracker
- **Supabase:** https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce

---

## 10. Troubleshooting

### AI Chat Not Working

| Issue | Solution |
|-------|----------|
| "Failed to send message" | Check ANTHROPIC_API_KEY in Vercel |
| No response | Redeploy after adding API key |
| Model error | Verify model name: `claude-3-haiku-20240307` |

### Common Issues

| Issue | Solution |
|-------|----------|
| RLS blocking operations | Check policy matches role |
| "canXxx is not a function" | Boolean vs function usage |
| Update doesn't persist | Silent RLS failure - check policies |

---

## Appendix A: AI Chat Reference

### Files

| File | Purpose |
|------|---------|
| `api/chat.js` | Vercel Edge Function |
| `src/contexts/ChatContext.jsx` | State management |
| `src/components/chat/ChatWidget.jsx` | UI component |
| `src/components/chat/ChatWidget.css` | Styling |

### API Endpoint

**POST /api/chat**

Request:
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "userContext": { "name": "...", "role": "...", ... },
  "dataContext": "Project summary..."
}
```

Response:
```json
{
  "message": "AI response...",
  "usage": { "input_tokens": 0, "output_tokens": 0 }
}
```

### Cost Estimate

~£10-15/month for typical usage (100 queries/day)

---

## Appendix B: Partners Feature Data Model

```
┌─────────────────┐
│    Partners     │
├─────────────────┤
│ id              │
│ project_id      │──┐
│ name            │  │
│ contact_name    │  │
│ contact_email   │  │
│ payment_terms   │  │
│ is_active       │  │
└────────┬────────┘  │
         │           │
         │           │
┌────────▼────────┐  │
│   Resources     │  │
├─────────────────┤  │
│ resource_type   │ ←── 'supplier' | 'partner' | 'customer'
│ partner_id      │ ←── FK (when type='partner')
│ daily_rate      │  │
│ cost_price      │  │
│ project_id      │──┘
└────────┬────────┘
         │
┌────────▼────────┐
│    Expenses     │
├─────────────────┤
│ resource_id     │
│ is_chargeable   │
│ procurement_method │ ←── 'supplier' | 'partner'
│ amount          │
└─────────────────┘
```

---

## Appendix C: Next Steps Checklist

### Immediate (Next Session)

- [ ] Phase F3: Create Services Layer foundation
- [ ] Create `base.service.js`
- [ ] Create `partners.service.js`

### Short Term

- [ ] Phase P1: Database schema changes
- [ ] Phase P2: Partners page
- [ ] Phase P3: Resources enhancement

### Medium Term

- [ ] Phase P4: Expenses enhancement
- [ ] Phase P5: Partner invoicing
- [ ] Phase P6: Reporting updates

---

*Document Version: 8.0*  
*Last Updated: 30 November 2025*
