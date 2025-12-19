# AI Prompt - AMSF001 Project Tracker

Use this prompt to start a new AI chat session for bug fixing or feature work on the AMSF001 Project Tracker.

---

## Copy This Prompt:

```
I'm working on the AMSF001 Project Tracker application and need help with bug fixing/feature development.

## Project Location
- **Local Path:** /Users/glennnickols/Projects/amsf001-project-tracker
- **GitHub:** https://github.com/spac3man-G/amsf001-project-tracker
- **Live App:** https://amsf001-project-tracker.vercel.app
- **Supabase Project:** ljqpmrcqxzgcfojrkxce

## Tech Stack
- **Frontend:** React 18 + Vite + React Router 6
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel (auto-deploys from main branch)
- **AI Integration:** Claude API (chat assistant + receipt OCR)

## Key Documentation (please read as needed)
- `/docs/AMSF001-Technical-Specification.md` - Master reference document
- `/docs/LOCAL-ENV-SETUP.md` - Development environment setup
- `/docs/TECH-SPEC-01` through `TECH-SPEC-08` - Detailed technical specs
- `/docs/WORKFLOW-SYSTEM-DOCUMENTATION.md` - Workflow/notification system

## Architecture Overview
- **28 database tables** with Row Level Security (RLS)
- **5 user roles:** Admin, Supplier PM, Customer PM, Contributor, Viewer
- **Service layer:** Singleton pattern services in `/src/services/`
- **State management:** React Context (Auth, Project, ViewAs, Metrics, Toast, Chat)
- **Multi-tenant:** All data scoped by project_id

## Key Features
- Milestone & Deliverable management with dual-signature workflows
- Time & Expense tracking with approval workflows
- Partner management and invoicing
- Change Control (Variations) with formal approval process
- KPI and Quality Standards tracking with assessments
- RAID log (Risks, Assumptions, Issues, Dependencies)
- AI chat assistant and receipt scanning

## Common File Locations
- `/src/pages/` - Page components
- `/src/components/` - Reusable components
- `/src/services/` - Data services (singleton pattern)
- `/src/contexts/` - React contexts
- `/src/hooks/` - Custom hooks
- `/src/lib/` - Utilities, permissions, formatters
- `/supabase/migrations/` - Database migrations

## Current Task
[Describe your bug or feature here]

## Relevant Screenshots/Error Messages
[Paste any error messages or attach screenshots]
```

---

## Tips for Effective Sessions

### For Bug Fixes:
1. Include the exact error message
2. Describe what you expected vs what happened
3. Mention which page/component is affected
4. Include screenshots if it's a UI issue

### For New Features:
1. Describe the user story or requirement
2. Mention which user roles are affected
3. Note any existing similar features to reference
4. Specify if database changes are needed

### Useful Commands to Share Output:
```bash
# Check for TypeScript/build errors
npm run build

# View recent git changes
git log --oneline -10

# Check current branch status
git status

# Search for code patterns
grep -r "searchTerm" src/
```

---

## Quick Reference

### User Roles & Permissions
| Role | Key Permissions |
|------|----------------|
| Admin | Full access, user management, system settings |
| Supplier PM | Manage resources, partners, billing, deliverables |
| Customer PM | Approve timesheets, validate expenses, sign deliverables |
| Contributor | Submit timesheets, expenses, work on deliverables |
| Viewer | Read-only access to dashboards and reports |

### Workflow Statuses
- **Timesheets:** Draft → Submitted → Approved/Rejected
- **Expenses:** Draft → Submitted → Approved/Rejected → Paid
- **Deliverables:** Not Started → In Progress → Submitted for Review → Review Complete → Delivered
- **Variations:** Draft → Submitted → Awaiting Signatures → Approved → Applied

### Database Tables (Main Ones)
- `projects`, `profiles`, `user_projects` - Core/auth
- `milestones`, `deliverables` - Project structure
- `timesheets`, `expenses` - Time/cost tracking
- `partners`, `partner_invoices` - Partner management
- `variations` - Change control
- `kpis`, `quality_standards` - Quality management
- `raid_items` - Risk management

---

*Last updated: December 2025*
