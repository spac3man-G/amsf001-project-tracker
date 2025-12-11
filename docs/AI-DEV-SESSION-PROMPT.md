# AMSF001 Project Tracker - Development Session Prompt

## How to Use This Prompt

Copy everything below the line into a new AI chat session when doing bug fixes or feature development.

---

# START OF PROMPT

## Project Context

I'm working on the **AMSF001 Project Tracker** application and need help with development work (bug fix / feature / enhancement).

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Step 1: Read the Master Technical Specification

Before we begin, please read the master reference document:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md
```

This provides complete context about the system architecture, database design, security model, and all technical details.

## Step 2: Reference Detailed Specs as Needed

Depending on what we're working on, you may need to read the detailed specification:

| If working on... | Read this document |
|------------------|-------------------|
| Project structure, deployment, environment | `TECH-SPEC-01-Architecture.md` |
| Projects, profiles, milestones, deliverables, resources | `TECH-SPEC-02-Database-Core.md` |
| Timesheets, expenses, partners, invoices | `TECH-SPEC-03-Database-Operations.md` |
| KPIs, quality standards, RAID, variations, audit | `TECH-SPEC-04-Database-Supporting.md` |
| RLS policies, authentication, permissions | `TECH-SPEC-05-RLS-Security.md` |
| API endpoints, Claude AI integration | `TECH-SPEC-06-API-AI.md` |
| Contexts, hooks, state management | `TECH-SPEC-07-Frontend-State.md` |
| Service layer, business logic | `TECH-SPEC-08-Services.md` |

All specs are located in: `/Users/glennnickols/Projects/amsf001-project-tracker/docs/`

## Step 3: Confirm Understanding

After reading the relevant documentation, please confirm:
1. You understand the application architecture
2. You've identified which areas of the codebase are relevant to my task
3. You're ready to proceed

## What I Need Help With

[DESCRIBE YOUR TASK HERE]

Examples:
- "Fix a bug where timesheet validation fails for weekend entries"
- "Add a new field to the expenses table for tax category"
- "Implement bulk approval for timesheets"
- "Fix the RLS policy that's blocking customer PM from viewing partner invoices"

---

## Documentation Maintenance Requirements

**CRITICAL: You must update documentation for any changes we make.**

### During Development
- Note what documentation will need updating based on our changes
- Follow existing code patterns documented in the specs
- Respect RLS policies - any database changes need corresponding RLS updates

### Before Ending the Session

Once changes are verified working, you MUST update the relevant documentation:

| If we changed... | Update this document |
|------------------|---------------------|
| Database schema (tables, columns) | `TECH-SPEC-02`, `03`, or `04` (whichever is relevant) |
| RLS policies | `TECH-SPEC-05-RLS-Security.md` |
| API endpoints or AI integration | `TECH-SPEC-06-API-AI.md` |
| Contexts, hooks, or state management | `TECH-SPEC-07-Frontend-State.md` |
| Services or business logic | `TECH-SPEC-08-Services.md` |
| Architecture or deployment | `TECH-SPEC-01-Architecture.md` |
| Significant patterns or new tables | `AMSF001-Technical-Specification.md` (master) |

### End of Session Checklist

Before we end, confirm:
- [ ] All code changes are verified working
- [ ] Relevant TECH-SPEC document(s) updated
- [ ] Master specification updated (if significant changes)
- [ ] Any new SQL files documented

---

## Technology Stack Quick Reference

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Vercel (frontend + serverless functions)
- **AI:** Anthropic Claude (chat + receipt scanning)
- **State:** React Context (Auth, Project, ViewAs, Metrics, Toast, Chat)
- **Services:** Singleton pattern extending BaseService

## Key File Locations

| Purpose | Location |
|---------|----------|
| Documentation | `/docs/` |
| React Components | `/src/components/` |
| Pages | `/src/pages/` |
| Services | `/src/services/` |
| Contexts | `/src/contexts/` |
| Hooks | `/src/hooks/` |
| Utilities | `/src/lib/` |
| API Functions | `/api/` |
| SQL Files | `/sql/` |

## Development Guidelines

1. **Read docs first** - The technical specifications contain crucial context
2. **Follow existing patterns** - Check how similar features are implemented
3. **Respect RLS policies** - All database changes need corresponding RLS policies
4. **Use service layer** - Don't query Supabase directly from components
5. **Test before documenting** - Only document verified working changes

---

# END OF PROMPT
