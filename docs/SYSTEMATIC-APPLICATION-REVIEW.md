# Systematic Application Review: Benchmarking, Planning & Estimator

**Document:** SYSTEMATIC-APPLICATION-REVIEW.md  
**Created:** 28 December 2025  
**Last Updated:** 28 December 2025  
**Status:** In Progress  
**Purpose:** Comprehensive review of three new tools and their integration status

---

## Executive Summary

This document provides a systematic review framework for three interconnected tools in the AMSF001 Project Tracker:

1. **Benchmarking** - UK market rate comparison by role/skill/SFIA level
2. **Planning** - Project planning with AI-assisted structure generation
3. **Estimator** - Cost estimation linked to planning and benchmarks

The review will assess implementation status, documentation gaps, testing coverage, and integration points, and identify which technical specification documents require updates.

---

## Documentation Inventory

### Technical Specification Documents (9 documents)

These are the core technical reference documents that may need updating based on review findings.

| # | Document | Focus Area | Last Updated | Update Needed? |
|---|----------|------------|--------------|----------------|
| 01 | `TECH-SPEC-01-Architecture.md` | Tech stack, infrastructure, directory structure | Dec 23 | TBD |
| 02 | `TECH-SPEC-02-Database-Core.md` | Core tables (profiles, orgs, projects) | Dec 24 | TBD |
| 03 | `TECH-SPEC-03-Database-Operations.md` | Operational tables (milestones, deliverables, etc.) | Dec 23 | TBD |
| 04 | `TECH-SPEC-04-Database-Supporting.md` | Supporting tables (resources, RAID, KPIs) | Dec 23 | TBD |
| 05 | `TECH-SPEC-05-RLS-Security.md` | Row Level Security policies | Dec 24 | TBD |
| 06 | `TECH-SPEC-06-API-AI.md` | API layer, AI integration | Dec 25 | TBD |
| 07 | `TECH-SPEC-07-Frontend-State.md` | Contexts, state management, components | Dec 25 | TBD |
| 08 | `TECH-SPEC-08-Services.md` | Service layer classes and methods | Dec 25 | TBD |
| 09 | `TECH-SPEC-09-Testing-Infrastructure.md` | Testing setup, E2E, unit tests | Dec 23 | TBD |

### Reference Documents

| Document | Purpose | Last Updated | Update Needed? |
|----------|---------|--------------|----------------|
| `AMSF001-Technical-Specification.md` | Master index/overview | Dec 23 | TBD |
| `CHANGELOG.md` | Version history | Dec 24 | **YES** - needs Dec 25-27 work |
| `WORKFLOW-SYSTEM-DOCUMENTATION.md` | Workflow states & transitions | Dec 23 | TBD |
| `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` | Known issues, future work | Dec 23 | TBD |

### User Guides

| Document | Purpose | Last Updated | Update Needed? |
|----------|---------|--------------|----------------|
| `USER-GUIDE-Team-Members.md` | Team member user guide | Dec 17 | TBD |
| `USER-GUIDE-Signup-Onboarding.md` | New user onboarding | Dec 25 | TBD |

### Addendum Documents (Recent Changes)

| Document | Purpose | Date | Status |
|----------|---------|------|--------|
| `ADDENDUM-December-2025.md` | Dec 2025 consolidated changes | Dec 24 | Active |
| `ADDENDUM-Permission-Hierarchy.md` | Permission hierarchy details | Dec 24 | Active |
| `ADDENDUM-Role-Simplification.md` | Org role changes (3→2) | Dec 23 | Active |

### Archived Planning Documents

These documents in `docs/archive/` were used during implementation and should be reconciled:

| Document | Purpose | Reconciled? |
|----------|---------|-------------|
| `PLANNING-AI-ASSISTANT-IMPLEMENTATION.md` | Planning AI implementation plan | TBD |
| `LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md` | Estimate linking plan | TBD |
| `PLANNING-AI-DOCUMENT-UPLOAD-SCHEDULE.md` | Document upload enhancement | TBD |
| `SFIA8-IMPLEMENTATION-PLAN.md` | SFIA8 integration plan | TBD |
| `SFIA8-VALIDATION-REPORT.md` | Technical validation | TBD |
| `DOC-UPDATE-PLAN-24-DEC.md` | Doc update tracking | Complete |
| `MULTI-TENANCY-IMPLEMENTATION-GUIDE.md` | Multi-tenancy guide | TBD |

---

## Documentation Update Tracking

Track which documents need updates based on review findings.

### Documents Requiring Updates After Review

| Document | Section(s) to Update | Priority | Status |
|----------|---------------------|----------|--------|
| `TECH-SPEC-02-Database-Core.md` | Add plan_items, estimates, benchmark_rates tables | High | Pending |
| `TECH-SPEC-06-API-AI.md` | Add /api/planning-ai endpoint | High | Pending |
| `TECH-SPEC-07-Frontend-State.md` | Add Planning, Estimator, Benchmarking components | High | Pending |
| `TECH-SPEC-08-Services.md` | Add planItemsService, estimates.service, benchmarkRates.service | High | Pending |
| `CHANGELOG.md` | Add v0.9.10+ entries for Dec 25-27 work | High | Pending |
| (more to be identified during review) | | | |

### New Documentation to Create

| Document | Purpose | Priority | Status |
|----------|---------|----------|--------|
| Feature doc: Benchmarking | User-facing benchmarking guide | Medium | Pending |
| Feature doc: Planning | User-facing planning guide | Medium | Pending |
| Feature doc: Estimator | User-facing estimator guide | Medium | Pending |

---

## Master Checklist

Use this checklist to track progress across sessions. **Check back after each section for permission to proceed.**

### Phase 1: Discovery & Inventory
- [ ] **1.1** Inventory all files related to each tool
- [ ] **1.2** Document database migrations and their status
- [ ] **1.3** Identify all service layer components
- [ ] **1.4** Map UI components and pages
- [ ] **1.5** Document API endpoints
- [ ] **1.6** Update this plan with discovered scope

### Phase 2: Benchmarking Tool Review
- [ ] **2.1** Database schema analysis (tables, RLS policies)
- [ ] **2.2** Service layer review (methods, patterns)
- [ ] **2.3** UI/UX review (pages, components)
- [ ] **2.4** SFIA8 integration assessment
- [ ] **2.5** Documentation gap analysis - identify TECH-SPEC updates needed
- [ ] **2.6** Testing coverage assessment
- [ ] **2.7** Update CHANGELOG draft with findings

### Phase 3: Planning Tool Review
- [ ] **3.1** Database schema analysis (plan_items table)
- [ ] **3.2** Service layer review (planItemsService)
- [ ] **3.3** UI/UX review (Planning page, grid)
- [ ] **3.4** AI Assistant review (PlanningAIAssistant)
- [ ] **3.5** Document upload capability assessment
- [ ] **3.6** Documentation gap analysis - identify TECH-SPEC updates needed
- [ ] **3.7** Testing coverage assessment
- [ ] **3.8** Update CHANGELOG draft with findings

### Phase 4: Estimator Tool Review
- [ ] **4.1** Database schema analysis (estimates tables)
- [ ] **4.2** Service layer review (estimates.service)
- [ ] **4.3** UI/UX review (Estimator page)
- [ ] **4.4** Benchmark rates integration
- [ ] **4.5** Planning tool integration (linked estimates)
- [ ] **4.6** Documentation gap analysis - identify TECH-SPEC updates needed
- [ ] **4.7** Testing coverage assessment
- [ ] **4.8** Update CHANGELOG draft with findings

### Phase 5: Integration Review
- [ ] **5.1** Planning ↔ Estimator integration
- [ ] **5.2** Estimator ↔ Benchmarking integration
- [ ] **5.3** Navigation and routing review
- [ ] **5.4** Permission/access control review
- [ ] **5.5** Cross-tool data flow verification

### Phase 6: Documentation Updates
- [ ] **6.1** Update TECH-SPEC-02-Database-Core.md (new tables)
- [ ] **6.2** Update TECH-SPEC-06-API-AI.md (new endpoints)
- [ ] **6.3** Update TECH-SPEC-07-Frontend-State.md (new components)
- [ ] **6.4** Update TECH-SPEC-08-Services.md (new services)
- [ ] **6.5** Update CHANGELOG.md with verified features
- [ ] **6.6** Reconcile archived planning docs with implementation
- [ ] **6.7** Create/update user guides if needed

### Phase 7: Final Summary
- [ ] **7.1** Compile findings summary
- [ ] **7.2** Document known issues/bugs
- [ ] **7.3** Identify future enhancements
- [ ] **7.4** Commit all documentation updates
- [ ] **7.5** Create handover summary

---

## Session Log

Track each review session here for continuity across chats.

| Session | Date | Sections Completed | Notes |
|---------|------|-------------------|-------|
| 1 | 28 Dec 2025 | Pre-review setup | Created review plan, fixed archive issues, documented TECH-SPECs |
| | | | |
| | | | |

---

## Phase 1: Discovery & Inventory

### 1.1 File Inventory

#### Benchmarking Tool Files
| Type | Path | Status | Notes |
|------|------|--------|-------|
| Page | `src/pages/benchmarking/Benchmarking.jsx` | Exists | |
| CSS | `src/pages/benchmarking/Benchmarking.css` | Exists | |
| Service | `src/services/benchmarkRates.service.js` | Exists | |
| Reference Data | `src/services/sfia8-reference-data.js` | Exists | |
| Migration | `202512261000_create_benchmark_rates.sql` | TBD | |
| Migration | `202512261001_seed_benchmark_rates.sql` | TBD | |
| Migration | `202512271000_sfia8_benchmark_rates.sql` | TBD | |
| Migration | `202512271001-1005_sfia8_seed_parts.sql` | TBD | 5 seed files |

#### Planning Tool Files
| Type | Path | Status | Notes |
|------|------|--------|-------|
| Page | `src/pages/planning/Planning.jsx` | Exists | |
| CSS | `src/pages/planning/Planning.css` | Exists | |
| AI Assistant | `src/pages/planning/PlanningAIAssistant.jsx` | Exists | |
| AI CSS | `src/pages/planning/PlanningAIAssistant.css` | Exists | |
| Service | `src/services/planItemsService.js` | Exists | |
| Components | `src/components/planning/` | TBD | To be inventoried |
| Migration | `202512251900_create_plan_items.sql` | TBD | |
| API | `api/planning-ai.js` | TBD | To be verified |

#### Estimator Tool Files
| Type | Path | Status | Notes |
|------|------|--------|-------|
| Page | `src/pages/estimator/Estimator.jsx` | Exists | |
| CSS | `src/pages/estimator/Estimator.css` | Exists | |
| Service | `src/services/estimates.service.js` | Exists | |
| Migration | `202512261100_create_estimates.sql` | TBD | |
| Migration | `202512261200_add_estimate_link_to_plan_items.sql` | TBD | |

### 1.2 Database Migrations Status

| Migration File | Created | Applied? | Verified? |
|----------------|---------|----------|-----------|
| `202512251900_create_plan_items.sql` | Dec 25 | TBD | |
| `202512261000_create_benchmark_rates.sql` | Dec 26 | TBD | |
| `202512261001_seed_benchmark_rates.sql` | Dec 26 | TBD | |
| `202512261100_create_estimates.sql` | Dec 26 | TBD | |
| `202512261200_add_estimate_link_to_plan_items.sql` | Dec 26 | TBD | |
| `202512271000_sfia8_benchmark_rates.sql` | Dec 27 | TBD | |
| `202512271001_sfia8_seed_part1.sql` | Dec 27 | TBD | |
| `202512271002_sfia8_seed_part2.sql` | Dec 27 | TBD | |
| `202512271003_sfia8_seed_part3.sql` | Dec 27 | TBD | |
| `202512271004_sfia8_seed_part4.sql` | Dec 27 | TBD | |
| `202512271005_sfia8_seed_part5.sql` | Dec 27 | TBD | |

### 1.3 Service Layer Components

| Service | File | Methods | Has Tests? | In TECH-SPEC-08? |
|---------|------|---------|------------|------------------|
| `benchmarkRates.service.js` | Exists | TBD | TBD | TBD |
| `planItemsService.js` | Exists | TBD | TBD | TBD |
| `estimates.service.js` | Exists | TBD | TBD | TBD |

### 1.4 API Endpoints

| Endpoint | Purpose | Status | In TECH-SPEC-06? |
|----------|---------|--------|------------------|
| `/api/planning-ai.js` | AI-assisted planning | TBD | TBD |
| (others TBD) | | | |

### 1.5 Navigation Integration

| Tool | Nav Path | Allowed Roles | In Navigation.js? |
|------|----------|---------------|-------------------|
| Benchmarking | `/benchmarking` | TBD | TBD |
| Planning | `/planning` | TBD | TBD |
| Estimator | `/estimator` | TBD | TBD |

---

## Findings Log

Record findings as they are discovered during review.

### Critical Issues
| ID | Tool | Description | Status |
|----|------|-------------|--------|
| | | | |

### Documentation Gaps
| ID | Document | Gap Description | Priority |
|----|----------|-----------------|----------|
| DG-001 | TECH-SPEC-02 | Missing plan_items table | High |
| DG-002 | TECH-SPEC-02 | Missing estimates tables | High |
| DG-003 | TECH-SPEC-02 | Missing benchmark_rates table | High |
| DG-004 | TECH-SPEC-08 | Missing planItemsService | High |
| DG-005 | TECH-SPEC-08 | Missing estimates.service | High |
| DG-006 | TECH-SPEC-08 | Missing benchmarkRates.service | High |
| DG-007 | CHANGELOG | Missing Dec 25-27 entries | High |
| (more to be identified) | | | |

### Bugs/Issues
| ID | Tool | Description | Severity |
|----|------|-------------|----------|
| | | | |

### Completed Features (for CHANGELOG)
| Version | Date | Feature | Files |
|---------|------|---------|-------|
| | | | |

---

## CHANGELOG Draft Entries

Prepare CHANGELOG entries as features are verified during review.

```markdown
## [0.9.10] - 2025-12-27

### Added

#### Benchmarking Tool
- (to be documented after Phase 2)

#### Planning Tool  
- (to be documented after Phase 3)

#### Estimator Tool
- (to be documented after Phase 4)

### Database Migrations
- (to be documented after Phase 1.2)

### Changed
- (to be documented)

### Fixed
- (to be documented)
```

---

## Next Steps

After completing each section, update this document and check in for permission to proceed.

**Current Status:** Pre-review setup complete. Ready to begin Phase 1.1 - File Inventory

---

## Appendix A: Resume Prompts

Use these prompts to continue in a new chat session:

### Resume Prompt (General)
```
I'm continuing the Systematic Application Review for AMSF001 Project Tracker.

Please read: /Users/glennnickols/Projects/amsf001-project-tracker/docs/SYSTEMATIC-APPLICATION-REVIEW.md

Check the Master Checklist and Session Log to see what's been completed.
Continue from the next unchecked item.
After each section, update the review document and check back for permission to proceed.
```

### Resume Prompt (Specific Phase)
```
I'm continuing the Systematic Application Review for AMSF001 Project Tracker.

Please read: /Users/glennnickols/Projects/amsf001-project-tracker/docs/SYSTEMATIC-APPLICATION-REVIEW.md

Continue with Phase X: [Phase Name]
Start from item X.X
```

---

## Appendix B: Key File Locations

| Category | Path |
|----------|------|
| Documentation | `/Users/glennnickols/Projects/amsf001-project-tracker/docs/` |
| Source Code | `/Users/glennnickols/Projects/amsf001-project-tracker/src/` |
| Services | `/Users/glennnickols/Projects/amsf001-project-tracker/src/services/` |
| Pages | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/` |
| API | `/Users/glennnickols/Projects/amsf001-project-tracker/api/` |
| Migrations | `/Users/glennnickols/Projects/amsf001-project-tracker/supabase/migrations/` |
| Archive | `/Users/glennnickols/Projects/amsf001-project-tracker/docs/archive/` |

---

*Document Version: 1.1*
*Last Updated: 28 December 2025*
*Review Framework for Benchmarking, Planning & Estimator Tools*
