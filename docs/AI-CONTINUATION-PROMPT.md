# AI Chat Continuation Prompt - AMSF001 Project Tracker

**Last Updated:** 24 December 2025

---

## Prompt

```
I'm continuing work on the AMSF001 Project Tracker application. This is a React + Supabase project management application with multi-tenancy (organisations), role-based access control, and various project tracking features.

## Key Context Documents

Please read these documents to understand the current state:

1. **December 2025 Addendum** (MOST IMPORTANT)
   `/Users/glennnickols/Projects/amsf001-project-tracker/docs/ADDENDUM-December-2025.md`
   - Consolidated summary of all recent changes
   - Organisation role simplification (3→2 roles)
   - System Admin page for org management
   - Invitation system with email (Resend)
   - Lists all documents needing updates
   - Outstanding items and future work

2. **Invitation System Implementation Plan**
   `/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-PLAN-Invitation-System.md`
   - Completed implementation details
   - Database schema for org_invitations
   - Service methods and API
   - Git commits reference

3. **Role Simplification Addendum**
   `/Users/glennnickols/Projects/amsf001-project-tracker/docs/ADDENDUM-Role-Simplification.md`
   - Detailed notes on 3→2 role change
   - Code changes per file
   - Test changes

4. **Main Technical Specification**
   `/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Technical-Specification.md`
   - Overall architecture
   - Note: Some sections need updating per addendum

## Project Location
`/Users/glennnickols/Projects/amsf001-project-tracker`

## Tech Stack
- Frontend: React 18, Vite, React Router
- Backend: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- Email: Resend (noreply@progressive.gg)
- Hosting: Vercel
- State: React Context (AuthContext, OrganisationContext)

## Recent Completed Work (24 Dec 2025)
- ✅ Organisation roles simplified (org_owner removed)
- ✅ System Admin page at /admin/system
- ✅ Invitation system with email delivery
- ✅ Accept invitation page at /accept-invite
- ✅ Pending invitations UI with resend/revoke

## What I'd Like to Do
[Describe your next task here]
```

---

## Usage

1. Copy the prompt above
2. Start a new Claude chat
3. Paste the prompt
4. Replace `[Describe your next task here]` with your actual request
5. Claude will read the key documents to understand context

---

## Quick Reference - Key Files

| Purpose | Location |
|---------|----------|
| Current state summary | `docs/ADDENDUM-December-2025.md` |
| Invitation details | `docs/IMPLEMENTATION-PLAN-Invitation-System.md` |
| Role changes | `docs/ADDENDUM-Role-Simplification.md` |
| Main tech spec | `docs/AMSF001-Technical-Specification.md` |
| Database migrations | `supabase/migrations/` |
| Services | `src/services/` |
| Pages | `src/pages/` |
| Contexts | `src/contexts/` |

---

## Notes

- The addendum documents are designed to help update the main documentation suite
- Check `docs/ADDENDUM-December-2025.md` Section 9 for outstanding items
- All recent work is committed and pushed to GitHub
- Vercel auto-deploys from main branch
