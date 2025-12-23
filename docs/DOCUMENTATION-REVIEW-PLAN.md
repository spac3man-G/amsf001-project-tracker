# Documentation Review Plan

**Document:** DOCUMENTATION-REVIEW-PLAN.md  
**Created:** 23 December 2025  
**Purpose:** Systematic review and update of all technical documentation  

---

## Executive Summary

The AMSF001 Project Tracker has 12 core technical documents (~12,000 lines) that were created on 10-17 December 2025. Since then, significant changes have been made including:

- Organisation-level multi-tenancy implementation (22-23 Dec)
- Various bug fixes and enhancements
- New services, components, and database objects

This plan provides a systematic approach to review and update each document.

---

## Documents to Review

### Tier 1: Core Technical Specifications (Priority)

| # | Document | Lines | Focus Area | Est. Impact |
|---|----------|-------|------------|-------------|
| 1 | TECH-SPEC-01-Architecture.md | 495 | Tech stack, infrastructure | Medium |
| 2 | TECH-SPEC-02-Database-Core.md | 921 | Core tables (profiles, projects) | **HIGH** |
| 3 | TECH-SPEC-03-Database-Operations.md | 1395 | Operational tables | Low |
| 4 | TECH-SPEC-04-Database-Supporting.md | 1598 | Supporting tables | Low |
| 5 | TECH-SPEC-05-RLS-Security.md | 981 | RLS policies | **HIGH** |
| 6 | TECH-SPEC-06-API-AI.md | 963 | API layer, AI integration | Medium |
| 7 | TECH-SPEC-07-Frontend-State.md | 1531 | Contexts, state management | **HIGH** |
| 8 | TECH-SPEC-08-Services.md | 1695 | Service layer | **HIGH** |
| 9 | TECH-SPEC-09-Testing-Infrastructure.md | 538 | Testing setup | Medium |

### Tier 2: Reference Documents

| # | Document | Lines | Focus Area | Est. Impact |
|---|----------|-------|------------|-------------|
| 10 | AMSF001-Technical-Specification.md | 763 | Master index/overview | Medium |
| 11 | WORKFLOW-SYSTEM-DOCUMENTATION.md | 497 | Workflow system | Low |
| 12 | TECHNICAL-DEBT-AND-FUTURE-FEATURES.md | 595 | Future work | Medium |

### Tier 3: Supporting Documents (Review Only)

| Document | Notes |
|----------|-------|
| AI-PROMPT-New-Chat.md | May need org context added |
| LOCAL-ENV-SETUP.md | Check for accuracy |
| USER-GUIDE-Team-Members.md | User-facing, lower priority |
| CHANGELOG.md | Should be updated with recent changes |

---

## Review Process

### For Each Document

#### Step 1: Initial Assessment
- [ ] Read document header (version, date, status)
- [ ] Scan table of contents
- [ ] Identify sections likely affected by org multi-tenancy
- [ ] Note current version number

#### Step 2: Cross-Reference with Implementation
- [ ] Compare against actual code files
- [ ] Check database migrations for schema changes
- [ ] Verify service methods exist and match
- [ ] Confirm component/context descriptions

#### Step 3: Document Updates Required
- [ ] List specific sections needing updates
- [ ] Note any new sections to add
- [ ] Identify obsolete content to remove/update

#### Step 4: Make Updates
- [ ] Update version number (increment minor version)
- [ ] Add "Last Updated" date
- [ ] Add organisation-related sections where needed
- [ ] Update existing sections with new information
- [ ] Add cross-references to org-level-multitenancy docs where appropriate

#### Step 5: Verification
- [ ] Re-read updated sections for accuracy
- [ ] Ensure internal links still work
- [ ] Check code examples are current

#### Step 6: Commit
- [ ] Commit document with descriptive message
- [ ] Update this checklist

---

## Document Review Checklist

### TECH-SPEC-01-Architecture.md
**Focus:** Technology stack, infrastructure, directory structure

- [x] Initial Assessment
- [x] Cross-Reference
- [x] List Updates Required
- [x] Make Updates
- [x] Verification
- [x] Commit

**Updates Made (23 Dec 2025):**
- Updated Executive Summary with three-tier multi-tenancy model
- Added OrganisationContext, OrganisationSwitcher, organisation.service.js to project structure
- Major rewrite of Section 7 (Multi-Tenancy Architecture)
- Added context hierarchy diagram
- Added Document History section
- Version: 1.0 → 2.0

---

### TECH-SPEC-02-Database-Core.md
**Focus:** profiles, projects, user_projects tables

- [x] Initial Assessment
- [x] Cross-Reference
- [x] List Updates Required
- [x] Make Updates
- [x] Verification
- [x] Commit

**Updates Made (23 Dec 2025):**
- Added `organisations` table documentation (Section 2)
- Added `user_organisations` table documentation (Section 3)
- Added `organisation_members_with_profiles` view (Section 4)
- Updated `projects` table with `organisation_id` column (Section 5)
- Updated ER diagram with organisation layer (Section 12)
- Renumbered all sections (now 14 sections total)
- Version: 1.0 → 2.0

---

### TECH-SPEC-03-Database-Operations.md
**Focus:** milestones, deliverables, timesheets, expenses, variations

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Probably minimal - operational tables unchanged
- May need note about org-scoping inheritance via projects

---

### TECH-SPEC-04-Database-Supporting.md
**Focus:** partners, resources, KPIs, RAID, quality_standards

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Probably minimal - supporting tables unchanged
- May need note about org-scoping inheritance

---

### TECH-SPEC-05-RLS-Security.md
**Focus:** RLS policies, authentication, authorization

- [x] Initial Assessment
- [x] Cross-Reference
- [x] List Updates Required
- [x] Make Updates
- [x] Verification
- [x] Commit

**Updates Made (23 Dec 2025):**
- Added `organisations` table policies (Section 4.1)
- Added `user_organisations` table policies (Section 4.2)
- Updated `profiles` with `profiles_org_members_can_view` policy (Section 4.3)
- Updated `projects` and `user_projects` policies for org-awareness (Section 4.4-4.5)
- Updated multi-tenancy architecture to three-tier model (Section 2)
- Added org-level helper functions documentation (Section 1.3)
- Updated security layers diagram
- Version: 1.1 → 2.0

---

### TECH-SPEC-06-API-AI.md
**Focus:** API routes, AI integration

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Update create-project.js documentation (org_id parameter)
- Note any new API endpoints needed for orgs

---

### TECH-SPEC-07-Frontend-State.md
**Focus:** React contexts, state management

- [x] Initial Assessment
- [x] Cross-Reference
- [x] List Updates Required
- [x] Make Updates
- [x] Verification
- [x] Commit

**Updates Made (23 Dec 2025):**
- Fixed section numbering (duplicate Section 10 issue)
- Updated Table of Contents with all sections and appendices
- Added ORG_ROLE_CONFIG to Appendix A
- Added useOrganisation import to Appendix B
- Added Document History section
- Pre-existing updates: OrganisationContext (Section 4), Provider Hierarchy, ProjectContext
- Version: 1.1 → 2.0

---

### TECH-SPEC-08-Services.md
**Focus:** Service layer classes and methods

- [x] Initial Assessment
- [x] Cross-Reference
- [x] List Updates Required
- [x] Make Updates
- [x] Verification
- [x] Commit

**Updates Made (23 Dec 2025):**
- Added Section 4: Organisation Services (CRUD, settings, member management)
- Updated file structure listing with organisation.service.js
- Updated service architecture diagram
- Renumbered sections 5-14 (was 4-12)
- Added Document History section
- Version: 1.1 → 2.0

---

### TECH-SPEC-09-Testing-Infrastructure.md
**Focus:** Test setup, E2E tests, unit tests

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Add org permission unit tests
- Update test user setup (org memberships)

---

### AMSF001-Technical-Specification.md
**Focus:** Master reference document

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Add organisation layer to overview
- Update architecture summary
- Add reference to org-level-multitenancy docs

---

### WORKFLOW-SYSTEM-DOCUMENTATION.md
**Focus:** Workflow states, transitions

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Probably minimal - workflows unchanged

---

### TECHNICAL-DEBT-AND-FUTURE-FEATURES.md
**Focus:** Known issues, future work

- [ ] Initial Assessment
- [ ] Cross-Reference
- [ ] List Updates Required
- [ ] Make Updates
- [ ] Verification
- [ ] Commit

**Likely Updates:**
- Remove completed org multi-tenancy items
- Add any new technical debt identified
- Update future features list

---

## Session Management

### Critical: Segmented Approach with Check-ins

**IMPORTANT:** This review will be done in segments with regular check-ins.

#### Process for Each Document:

```
1. Claude announces: "Starting review of [DOCUMENT NAME]"
2. Claude performs Steps 1-3 (Assessment, Cross-Reference, List Updates)
3. Claude presents findings to user: "Here's what needs updating..."
4. User confirms: "Proceed" or provides feedback
5. Claude performs Steps 4-6 (Make Updates, Verify, Commit)
6. Claude announces: "[DOCUMENT NAME] complete. Ready for next?"
7. User confirms: "Continue" or "Stop here"
```

#### Check-in Points:

- ✅ **Before starting each document** - Confirm which document to review
- ✅ **After assessment** - Present findings before making changes
- ✅ **After completion** - Confirm document is done, ask about continuing
- ✅ **If context gets long** - Suggest compacting/new session

#### Segment Size Guidelines:

- Each document = 1 segment
- Maximum 2-3 documents per session recommended
- If a document is very large (>1500 lines), may split into sub-segments

### Memory/Context Guidelines

To prevent context overflow during reviews:

1. **One document per session segment** - Complete one document before starting another
2. **Commit after each document** - Don't accumulate uncommitted changes
3. **Use this checklist** - Check off items as completed
4. **Save progress** - Update checklist in repo after each document

### Progress Tracking

| Document | Status | Date | Notes |
|----------|--------|------|-------|
| TECH-SPEC-01 | ✅ Complete | 23 Dec 2025 | v2.0 - Updated multi-tenancy architecture |
| TECH-SPEC-02 | ✅ Complete | 23 Dec 2025 | v2.0 - Added org tables, updated ER diagram |
| TECH-SPEC-03 | ⬜ Pending | | |
| TECH-SPEC-04 | ⬜ Pending | | |
| TECH-SPEC-05 | ✅ Complete | 23 Dec 2025 | v2.0 - Added org RLS policies, updated multi-tenancy model |
| TECH-SPEC-06 | ⬜ Pending | | |
| TECH-SPEC-07 | ✅ Complete | 23 Dec 2025 | v2.0 - Added OrganisationContext, updated provider hierarchy |
| TECH-SPEC-08 | ✅ Complete | 23 Dec 2025 | v2.0 - Added Organisation Services section |
| TECH-SPEC-09 | ⬜ Pending | | |
| Master Spec | ⬜ Pending | | |
| Workflow | ⬜ Pending | | |
| Tech Debt | ⬜ Pending | | |

---

## Suggested Order

Based on impact and dependencies:

1. **TECH-SPEC-02-Database-Core.md** - Foundation, new tables
2. **TECH-SPEC-05-RLS-Security.md** - Security model changes
3. **TECH-SPEC-07-Frontend-State.md** - Context changes
4. **TECH-SPEC-08-Services.md** - New service
5. **TECH-SPEC-01-Architecture.md** - Overview updates
6. **AMSF001-Technical-Specification.md** - Master document
7. **TECH-SPEC-06-API-AI.md** - API changes
8. **TECH-SPEC-09-Testing-Infrastructure.md** - Test updates
9. **TECHNICAL-DEBT-AND-FUTURE-FEATURES.md** - Cleanup
10. **TECH-SPEC-03-Database-Operations.md** - Minor updates
11. **TECH-SPEC-04-Database-Supporting.md** - Minor updates
12. **WORKFLOW-SYSTEM-DOCUMENTATION.md** - Review only

---

## Ready to Start

To begin the review process:

1. Confirm this plan is acceptable
2. Start with TECH-SPEC-02-Database-Core.md
3. Follow the 6-step process for each document
4. Update progress tracking after each document
5. Commit changes incrementally

---

*This plan will be updated as documents are reviewed.*
