# AI Prompt: User System Architecture Review

**Document:** AI-PROMPT-User-System-Review.md  
**Created:** 24 December 2025  
**Purpose:** Systematic review of user management architecture for SaaS readiness  
**Estimated Sessions:** 6-8 sessions (2-3 hours each)

---

## Critical Instructions for AI Assistant

### ⚠️ VERIFY EVERYTHING - DO NOT ASSUME

**This is the most important instruction in this document.**

Documentation may be outdated. Code comments may be wrong. Your training data may not reflect the current state. **Always verify assumptions by reading the actual code and querying the actual database.**

#### Before Making Any Claim:
1. **Read the actual source file** - not just docs that describe it
2. **Check the actual database schema** - run SQL queries to verify table structures
3. **Check actual RLS policies** - query `pg_policies` to see what's really enforced
4. **Test your understanding** - if you think X works a certain way, find the code that proves it

#### Verification Queries to Use:
```sql
-- Check actual table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'TABLE_NAME';

-- Check actual RLS policies
SELECT tablename, policyname, cmd, 
       pg_get_expr(polqual, polrelid) as using_expr,
       pg_get_expr(polwithcheck, polrelid) as with_check_expr
FROM pg_policies 
WHERE tablename = 'TABLE_NAME';

-- Check actual foreign keys
SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
       ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'TABLE_NAME';
```

#### When Documenting:
- State what you **verified** vs what you **inferred**
- If docs say X but code says Y, **code is the truth**
- Flag any inconsistencies between docs and implementation
- Ask the user to run verification queries if you can't access the database directly

#### Example of Good vs Bad Analysis:

❌ **Bad:** "Based on the documentation, the profiles table stores the user's global role."

✅ **Good:** "I read `src/hooks/usePermissions.js` lines 45-60 and verified that `userRole` comes from `profile.role`. I also checked `TECH-SPEC-02` which confirms this. However, I notice the code also checks `user_organisations.org_role` in `ViewAsContext.jsx` line 78, which suggests the permission hierarchy is more complex than the docs indicate."

#### Red Flags to Watch For:
- Policy names in docs that don't match actual policy names in database
- Field names in docs that don't exist in actual tables
- Permission checks in frontend that don't have corresponding RLS policies
- "Should work" statements without code evidence

---

## Context for AI Assistant

You are helping review and plan the evolution of a **B2B SaaS Project Tracker** application's user management system. The application is built with:

- **Frontend:** React + Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Current State:** Working multi-tenant system with organisations and projects
- **Goal:** Evolve to production-ready SaaS with proper subscription model

### Project Location
```
/Users/glennnickols/Projects/amsf001-project-tracker/
```

### Key Documentation Files
- `docs/TECH-SPEC-02-Database-Core.md` - Core tables including users, orgs, projects
- `docs/TECH-SPEC-05-RLS-Security.md` - Row Level Security policies
- `docs/TECH-SPEC-07-Frontend-State.md` - Frontend state management
- `docs/ADDENDUM-Permission-Hierarchy.md` - Permission hierarchy implementation
- `docs/org-level-multitenancy/` - Organisation multi-tenancy docs

### Key Source Files
- `src/contexts/AuthContext.jsx` - Authentication state
- `src/contexts/ViewAsContext.jsx` - Role simulation for testing
- `src/hooks/usePermissions.js` - Permission checks
- `src/lib/permissions.js` - Role definitions
- `src/lib/navigation.js` - Role-based navigation
- `src/pages/admin/SystemUsers.jsx` - System user management
- `src/pages/admin/OrganisationMembers.jsx` - Org member management
- `src/services/organisationService.js` - Organisation operations

### Database Tables (User-Related)
- `auth.users` - Supabase authentication (email, password)
- `profiles` - Extended user data (full_name, role - global)
- `organisations` - Tenant organisations
- `user_organisations` - Org membership + org_role
- `projects` - Projects within organisations
- `user_projects` - Project membership + project role

---

## Master Checklist

Use this checklist to track progress across sessions. Copy to a working document and check off items as completed.

### Phase 1: Current State Analysis (Sessions 1-2)
- [ ] **1.1** Document current authentication flow (Supabase Auth)
- [ ] **1.2** Map all user-related database tables and relationships
- [ ] **1.3** Document the three-tier permission model (System → Org → Project)
- [ ] **1.4** Audit all RLS policies affecting user operations
- [ ] **1.5** Document user lifecycle (registration → invitation → roles → deactivation)
- [ ] **1.6** Map frontend user management UIs and their capabilities
- [ ] **1.7** Identify current gaps and bugs in user management
- [ ] **1.8** Create current state architecture diagram

### Phase 2: SaaS Best Practices Research (Session 3)
- [ ] **2.1** Research B2B SaaS user management patterns (Auth0, Clerk, WorkOS)
- [ ] **2.2** Document standard subscription tier models
- [ ] **2.3** Research seat-based vs usage-based licensing
- [ ] **2.4** Document SSO/SAML requirements for enterprise
- [ ] **2.5** Research RBAC vs ABAC permission models
- [ ] **2.6** Document audit logging requirements (SOC2, GDPR)
- [ ] **2.7** Research user provisioning standards (SCIM)
- [ ] **2.8** Create "ideal state" reference architecture

### Phase 3: Gap Analysis (Session 4)
- [ ] **3.1** Compare current vs ideal: Authentication
- [ ] **3.2** Compare current vs ideal: Authorisation
- [ ] **3.3** Compare current vs ideal: User lifecycle management
- [ ] **3.4** Compare current vs ideal: Organisation/tenant management
- [ ] **3.5** Compare current vs ideal: Billing/subscription integration
- [ ] **3.6** Compare current vs ideal: Audit & compliance
- [ ] **3.7** Categorise gaps by severity (Critical/High/Medium/Low)
- [ ] **3.8** Create gap analysis summary document

### Phase 4: Roadmap Development (Session 5)
- [ ] **4.1** Define MVP requirements for paid SaaS launch
- [ ] **4.2** Prioritise gaps into implementation phases
- [ ] **4.3** Estimate effort for each phase (T-shirt sizing)
- [ ] **4.4** Identify dependencies between items
- [ ] **4.5** Define migration strategy for existing users/data
- [ ] **4.6** Plan for backward compatibility during transition
- [ ] **4.7** Create phased roadmap document
- [ ] **4.8** Define success metrics for each phase

### Phase 5: Technical Design (Sessions 6-7)
- [ ] **5.1** Design new database schema changes
- [ ] **5.2** Design API changes for user management
- [ ] **5.3** Design subscription/billing integration (Stripe)
- [ ] **5.4** Design invitation system improvements
- [ ] **5.5** Design admin UI improvements
- [ ] **5.6** Design self-service user management
- [ ] **5.7** Design SSO integration architecture
- [ ] **5.8** Create technical specification documents

### Phase 6: Implementation Planning (Session 8)
- [ ] **6.1** Break roadmap into sprint-sized tasks
- [ ] **6.2** Create migration scripts outline
- [ ] **6.3** Define testing strategy
- [ ] **6.4** Plan rollout strategy (feature flags, gradual release)
- [ ] **6.5** Document rollback procedures
- [ ] **6.6** Create implementation timeline
- [ ] **6.7** Identify risks and mitigations
- [ ] **6.8** Final review and sign-off

---

## Session Templates

### Session 1: Current State - Authentication & Database

**Objective:** Document exactly how users authenticate and where user data lives.

**Start Prompt:**
```
I'm reviewing my SaaS application's user management system. This is Session 1 of a multi-session review.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

⚠️ CRITICAL: Do not assume - verify everything by reading actual code and asking me to run database queries.

Please help me document the current authentication and user database architecture:

1. Read and analyse these files (actually read them, don't assume their contents):
   - src/contexts/AuthContext.jsx
   - src/lib/supabase.js
   - docs/TECH-SPEC-02-Database-Core.md (sections on profiles, user_organisations, user_projects)

2. VERIFY the database schema by asking me to run:
   ```sql
   -- Get actual profiles table structure
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns WHERE table_name = 'profiles';
   
   -- Get actual user_organisations structure
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns WHERE table_name = 'user_organisations';
   
   -- Get actual user_projects structure  
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns WHERE table_name = 'user_projects';
   ```

3. Create a document that covers:
   - How authentication works (Supabase Auth flow) - cite specific code lines
   - The relationship between auth.users and profiles - verified from actual schema
   - All user-related tables and their relationships - verified from actual schema
   - Current user data model diagram
   - Any discrepancies between docs and actual implementation

4. For each claim, state whether it's:
   - VERIFIED (you read the code/saw the query result)
   - INFERRED (logical conclusion from verified facts)
   - ASSUMED (needs verification)

Output a markdown document to: docs/user-system-review/01-current-auth-database.md
```

**Checklist items:** 1.1, 1.2

---

### Session 2: Current State - Permissions & Lifecycle

**Objective:** Document the permission model and user lifecycle.

**Start Prompt:**
```
Continuing user system review - Session 2.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

⚠️ CRITICAL: Do not assume - verify everything by reading actual code and asking me to run database queries.

Reference the previous session output: docs/user-system-review/01-current-auth-database.md

Please analyse the permission system and user lifecycle:

1. Read and analyse these files (actually read them, cite line numbers):
   - src/lib/permissions.js
   - src/hooks/usePermissions.js
   - src/contexts/ViewAsContext.jsx
   - src/hooks/useMilestonePermissions.js

2. VERIFY actual RLS policies by asking me to run:
   ```sql
   -- Get all RLS policies for user-related tables
   SELECT tablename, policyname, cmd,
          pg_get_expr(polqual, polrelid) as using_expr,
          pg_get_expr(polwithcheck, polrelid) as with_check_expr
   FROM pg_policies 
   WHERE tablename IN ('profiles', 'user_organisations', 'user_projects');
   ```

3. Compare docs vs reality:
   - Read docs/ADDENDUM-Permission-Hierarchy.md
   - Read docs/TECH-SPEC-05-RLS-Security.md
   - Flag any differences between what docs say and what code/policies actually do

4. Document (with verification status for each claim):
   - The three-tier permission model (System Admin → Org Admin → Project Role)
   - How permissions are checked in frontend (cite specific functions and lines)
   - How RLS policies enforce permissions in backend (from actual policy query)
   - User lifecycle: registration, invitation, role assignment, deactivation
   - Current bugs or gaps in permission enforcement

5. Read the admin UI files and test what operations actually work:
   - src/pages/admin/SystemUsers.jsx
   - src/pages/admin/OrganisationMembers.jsx  
   - src/pages/admin/ProjectManagement.jsx

6. For each admin operation, document:
   - What the UI allows
   - What RLS policy enforces it
   - Whether it actually works (ask me to test if unsure)

Output to: docs/user-system-review/02-current-permissions-lifecycle.md
```

**Checklist items:** 1.3, 1.4, 1.5, 1.6, 1.7

---

### Session 3: SaaS Best Practices Research

**Objective:** Research and document industry best practices.

**Start Prompt:**
```
Continuing user system review - Session 3.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference previous outputs:
- docs/user-system-review/01-current-auth-database.md
- docs/user-system-review/02-current-permissions-lifecycle.md

This session is about researching B2B SaaS best practices for user management.

Please research and document:

1. **Authentication patterns:**
   - How Auth0, Clerk, WorkOS handle B2B auth
   - SSO/SAML for enterprise customers
   - Magic links vs passwords vs social auth

2. **Subscription models:**
   - Seat-based licensing (per user)
   - Tiered plans (Free/Pro/Enterprise)
   - Organisation-level vs user-level billing

3. **Permission models:**
   - RBAC (Role-Based Access Control)
   - ABAC (Attribute-Based Access Control)
   - Common B2B SaaS role structures

4. **User provisioning:**
   - SCIM for enterprise user sync
   - Just-in-time provisioning
   - Invitation flows

5. **Compliance:**
   - Audit logging requirements
   - GDPR user data requirements
   - SOC2 access control requirements

Create an "ideal state" reference architecture for a B2B SaaS.

Output to: docs/user-system-review/03-saas-best-practices.md
```

**Checklist items:** 2.1 - 2.8

---

### Session 4: Gap Analysis

**Objective:** Compare current state to ideal state and categorise gaps.

**Start Prompt:**
```
Continuing user system review - Session 4.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference all previous outputs:
- docs/user-system-review/01-current-auth-database.md
- docs/user-system-review/02-current-permissions-lifecycle.md
- docs/user-system-review/03-saas-best-practices.md

Perform a comprehensive gap analysis:

1. Create a comparison table for each area:
   - Authentication (Current vs Ideal)
   - Authorisation (Current vs Ideal)
   - User lifecycle (Current vs Ideal)
   - Organisation management (Current vs Ideal)
   - Billing integration (Current vs Ideal)
   - Audit & compliance (Current vs Ideal)

2. For each gap identified:
   - Severity: Critical / High / Medium / Low
   - Impact: What breaks or is limited without this?
   - Effort: T-shirt size estimate (S/M/L/XL)
   - Dependencies: What else needs to be done first?

3. Categorise gaps:
   - Must have for MVP paid launch
   - Should have for competitive product
   - Nice to have for enterprise tier
   - Future consideration

Output to: docs/user-system-review/04-gap-analysis.md
```

**Checklist items:** 3.1 - 3.8

---

### Session 5: Roadmap Development

**Objective:** Create a phased implementation roadmap.

**Start Prompt:**
```
Continuing user system review - Session 5.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference: docs/user-system-review/04-gap-analysis.md

Develop a phased implementation roadmap:

1. **Phase 0: Critical Fixes** (Before anything else)
   - Bugs that break current functionality
   - Security vulnerabilities

2. **Phase 1: MVP for Paid Launch**
   - Minimum viable subscription model
   - Basic self-service user management
   - Essential admin controls

3. **Phase 2: Professional Tier**
   - Enhanced organisation management
   - Better invitation system
   - Audit logging basics

4. **Phase 3: Enterprise Readiness**
   - SSO/SAML integration
   - SCIM provisioning
   - Advanced audit & compliance

For each phase:
- List specific items from gap analysis
- Estimate total effort
- Define success criteria
- Identify risks

Also document:
- Migration strategy for existing users
- Backward compatibility considerations
- Feature flag strategy for gradual rollout

Output to: docs/user-system-review/05-roadmap.md
```

**Checklist items:** 4.1 - 4.8

---

### Session 6: Technical Design - Database & API

**Objective:** Design database and API changes.

**Start Prompt:**
```
Continuing user system review - Session 6.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference: docs/user-system-review/05-roadmap.md

Focus on technical design for Phases 0-2.

1. **Database schema changes:**
   - New tables needed (subscriptions, audit_logs, invitations)
   - Modifications to existing tables
   - Migration scripts outline
   - RLS policy updates

2. **API design:**
   - New endpoints for user management
   - Subscription/billing endpoints
   - Invitation flow endpoints
   - Admin operation endpoints

3. **Service layer changes:**
   - New services needed
   - Modifications to existing services
   - Error handling patterns

Read current service files to understand patterns:
- src/services/organisationService.js
- src/services/userService.js (if exists)

Output to: docs/user-system-review/06-technical-design-backend.md
```

**Checklist items:** 5.1, 5.2, 5.3, 5.4

---

### Session 7: Technical Design - Frontend & Integration

**Objective:** Design frontend and integration changes.

**Start Prompt:**
```
Continuing user system review - Session 7.

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference: docs/user-system-review/06-technical-design-backend.md

Focus on frontend and integration design:

1. **Admin UI improvements:**
   - System Users page enhancements
   - Organisation Members page enhancements
   - New subscription management UI
   - New invitation management UI

2. **Self-service features:**
   - User profile management
   - Organisation settings for org admins
   - Team member invitation (non-admin flow)

3. **Stripe integration design:**
   - Checkout flow
   - Customer portal integration
   - Webhook handling
   - Subscription state sync

4. **SSO integration architecture:**
   - Provider configuration
   - Login flow changes
   - User provisioning on first SSO login

Read current UI files for patterns:
- src/pages/admin/SystemUsers.jsx
- src/pages/admin/OrganisationMembers.jsx
- src/components/Layout.jsx

Output to: docs/user-system-review/07-technical-design-frontend.md
```

**Checklist items:** 5.5, 5.6, 5.7, 5.8

---

### Session 8: Implementation Planning

**Objective:** Create actionable implementation plan.

**Start Prompt:**
```
Continuing user system review - Session 8 (Final).

Project: /Users/glennnickols/Projects/amsf001-project-tracker/

Reference all previous documents in docs/user-system-review/

Create the final implementation plan:

1. **Sprint breakdown:**
   - Break each phase into 1-2 week sprints
   - Define deliverables per sprint
   - Identify dependencies

2. **Migration plan:**
   - Scripts to migrate existing data
   - Communication plan for existing users
   - Rollback procedures

3. **Testing strategy:**
   - Unit tests needed
   - Integration tests needed
   - E2E test scenarios
   - Manual QA checklist

4. **Rollout strategy:**
   - Feature flags to implement
   - Gradual rollout plan
   - Monitoring and alerting

5. **Risk register:**
   - Identified risks
   - Mitigation strategies
   - Contingency plans

6. **Timeline:**
   - Realistic timeline with milestones
   - Go/no-go decision points

Output to: docs/user-system-review/08-implementation-plan.md

Also create a summary document: docs/user-system-review/00-executive-summary.md
```

**Checklist items:** 6.1 - 6.8

---

## Progress Tracking

After each session, update this section:

| Session | Date | Status | Notes |
|---------|------|--------|-------|
| 1 | | Not Started | |
| 2 | | Not Started | |
| 3 | | Not Started | |
| 4 | | Not Started | |
| 5 | | Not Started | |
| 6 | | Not Started | |
| 7 | | Not Started | |
| 8 | | Not Started | |

---

## Quick Reference: Current Known Issues

Capture issues discovered during this session (24 Dec 2025):

1. **System Admin toggle fails** - RLS policy prevents updating profiles.role from UI
2. **Org Admin can't edit baselines** - useMilestonePermissions doesn't recognise org admins
3. **Cross-org data visibility** - Fixed in ProjectManagement.jsx (commit fdb6e468)
4. **Write policies missing org admin** - Fixed with can_write_project() (commit 862f47cc)

---

## Output Location

All session outputs should be saved to:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/user-system-review/
```

Files:
- `00-executive-summary.md` (created in Session 8)
- `01-current-auth-database.md`
- `02-current-permissions-lifecycle.md`
- `03-saas-best-practices.md`
- `04-gap-analysis.md`
- `05-roadmap.md`
- `06-technical-design-backend.md`
- `07-technical-design-frontend.md`
- `08-implementation-plan.md`
