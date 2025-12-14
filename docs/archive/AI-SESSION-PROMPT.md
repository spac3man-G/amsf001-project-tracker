# AMSF001 Project Tracker - AI Session Prompt

## How to Use This Prompt

Copy everything below the line into a new AI chat session to begin work on the AMSF001 Project Tracker.

---

# START OF PROMPT

## Project Context

I'm working on the **AMSF001 Project Tracker** application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Initial Discovery Steps

Before we begin any work, please complete these discovery steps:

### Step 1: Read the Master Technical Specification
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md
```
This is the master reference document that provides complete context about the system architecture, database design, security model, and all technical details.

### Step 2: Read the Documentation Approach
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Documentation-Approach-2025-12-10.md
```
This shows the documentation project status, session checklists, and what has been completed.

### Step 3: Check for Session Prompts
Look in the docs folder for any `SESSION-*.md` files that may indicate pending work:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/
```

### Step 4: Review Current State
After reading the documentation, provide me with:
1. A brief summary of what the application is
2. The current documentation status (what's complete, what's pending)
3. Any session prompts found for pending work
4. Confirmation you're ready to proceed

## Documentation Maintenance Requirements

**CRITICAL: You must maintain the documentation set throughout our session.**

### During the Session
- If we make changes to the codebase, note what documentation will need updating
- Track all architectural decisions and code changes

### Before Ending the Session
Once we verify that changes are working correctly, you MUST:

1. **Update Technical Specifications** - If we changed:
   - Database schema → Update relevant TECH-SPEC-02/03/04
   - RLS policies → Update TECH-SPEC-05
   - API endpoints → Update TECH-SPEC-06
   - Frontend/contexts/hooks → Update TECH-SPEC-07
   - Services → Update TECH-SPEC-08
   - Architecture → Update TECH-SPEC-01

2. **Update Master Specification** - If significant changes were made:
   - Update `/docs/AMSF001-Technical-Specification.md` with any new patterns, tables, or architectural changes

3. **Update User Guide** - If we changed user-facing features:
   - Update the relevant `USER-GUIDE-*.md` file

4. **Update Approach Document** - Mark completed sessions:
   - Update checklist status in `AMSF001-Documentation-Approach-2025-12-10.md`

5. **Create Session Prompt** - For next session:
   - If work remains, create a `SESSION-X.X-PROMPT.md` file with context for continuing

### Documentation Update Checklist
Before we end our session, confirm:
- [ ] All code changes are verified working
- [ ] Relevant technical specification documents are updated
- [ ] Master specification updated if needed
- [ ] User guide updated if user-facing changes
- [ ] Approach document checklist updated
- [ ] Next session prompt created (if applicable)

## Technology Stack Reference

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

## What I Need Help With Today

[DESCRIBE YOUR TASK HERE]

Examples:
- "Continue with the next documentation session"
- "Fix a bug in the timesheets validation workflow"
- "Add a new feature for bulk expense upload"
- "Review and update the variation approval process"
- "Help me understand how the RLS policies work"

---

# END OF PROMPT

---

## Quick Start Variants

### Variant A: Continue Documentation Project
```
I'm continuing the AMSF001 documentation project.

Please read:
1. /Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md
2. /Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Documentation-Approach-2025-12-10.md

Check for any SESSION-*.md prompt files, then tell me what the next pending session is and begin that work.

Remember: Update all documentation before we end the session.
```

### Variant B: Bug Fix / Feature Work
```
I'm working on the AMSF001 Project Tracker and need help with [DESCRIBE ISSUE].

Please read the master specification first:
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md

Then help me with: [DESCRIBE TASK]

Remember: Update all relevant documentation once changes are verified working.
```

### Variant C: Code Review / Understanding
```
I need to understand how [FEATURE] works in the AMSF001 Project Tracker.

Please read:
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md

Then examine the relevant code and explain how [FEATURE] is implemented.
```

---

## Notes for AI Assistant

When working on this project:

1. **Always read documentation first** - The technical specifications contain crucial context
2. **Follow existing patterns** - Check how similar features are implemented
3. **Respect RLS policies** - All database changes need corresponding RLS policies
4. **Use service layer** - Don't query Supabase directly from components
5. **Update docs at end** - This is mandatory, not optional
6. **Test before documenting** - Only document verified working changes
7. **Create continuity** - Leave session prompts for incomplete work

The documentation is a living asset that must stay synchronized with the codebase.
