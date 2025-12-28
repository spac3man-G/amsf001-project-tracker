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

The review will assess implementation status, documentation gaps, testing coverage, and integration points.

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
- [ ] **2.5** Documentation gap analysis
- [ ] **2.6** Testing coverage assessment
- [ ] **2.7** Update CHANGELOG with findings

### Phase 3: Planning Tool Review
- [ ] **3.1** Database schema analysis (plan_items table)
- [ ] **3.2** Service layer review (planItemsService)
- [ ] **3.3** UI/UX review (Planning page, grid)
- [ ] **3.4** AI Assistant review (PlanningAIAssistant)
- [ ] **3.5** Document upload capability assessment
- [ ] **3.6** Documentation gap analysis
- [ ] **3.7** Testing coverage assessment
- [ ] **3.8** Update CHANGELOG with findings

### Phase 4: Estimator Tool Review
- [ ] **4.1** Database schema analysis (estimates tables)
- [ ] **4.2** Service layer review (estimates.service)
- [ ] **4.3** UI/UX review (Estimator page)
- [ ] **4.4** Benchmark rates integration
- [ ] **4.5** Planning tool integration (linked estimates)
- [ ] **4.6** Documentation gap analysis
- [ ] **4.7** Testing coverage assessment
- [ ] **4.8** Update CHANGELOG with findings

### Phase 5: Integration Review
- [ ] **5.1** Planning ↔ Estimator integration
- [ ] **5.2** Estimator ↔ Benchmarking integration
- [ ] **5.3** Navigation and routing review
- [ ] **5.4** Permission/access control review
- [ ] **5.5** Cross-tool data flow verification

### Phase 6: Documentation Updates
- [ ] **6.1** Update TECH-SPEC documents
- [ ] **6.2** Create/update user guides
- [ ] **6.3** Update CHANGELOG with complete status
- [ ] **6.4** Archive planning documents that are now complete
- [ ] **6.5** Create feature documentation

### Phase 7: Final Summary
- [ ] **7.1** Compile findings summary
- [ ] **7.2** Document known issues/bugs
- [ ] **7.3** Identify future enhancements
- [ ] **7.4** Create handover documentation

---

## Session Log

Track each review session here for continuity across chats.

| Session | Date | Sections Completed | Notes |
|---------|------|-------------------|-------|
| 1 | 28 Dec 2025 | Starting Phase 1 | Initial setup |
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

| Service | Methods Count | Has Tests? | Documented? |
|---------|--------------|------------|-------------|
| `benchmarkRates.service.js` | TBD | TBD | TBD |
| `planItemsService.js` | TBD | TBD | TBD |
| `estimates.service.js` | TBD | TBD | TBD |

### 1.4 API Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/planning-ai.js` | AI-assisted planning | TBD |
| (others TBD) | | |

### 1.5 Navigation Integration

| Tool | Nav Path | Allowed Roles | Verified? |
|------|----------|---------------|-----------|
| Benchmarking | `/benchmarking` | TBD | |
| Planning | `/planning` | TBD | |
| Estimator | `/estimator` | TBD | |

---

## Findings Log

Record findings as they are discovered during review.

### Critical Issues
| ID | Tool | Description | Status |
|----|------|-------------|--------|
| | | | |

### Documentation Gaps
| ID | Tool | Missing Documentation | Priority |
|----|------|-----------------------|----------|
| | | | |

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

Prepare CHANGELOG entries as features are verified.

```markdown
## [X.X.X] - 202X-XX-XX

### Added

#### Benchmarking Tool
- (to be documented)

#### Planning Tool
- (to be documented)

#### Estimator Tool
- (to be documented)

### Database Migrations
- (to be documented)
```

---

## Next Steps

After completing each section, update this document and check in for permission to proceed.

**Current Status:** Ready to begin Phase 1.1 - File Inventory

---

## Appendix A: Related Planning Documents

These documents were created during development and should be reconciled with actual implementation:

| Document | Date | Purpose | Reconciled? |
|----------|------|---------|-------------|
| `PLANNING-AI-ASSISTANT-IMPLEMENTATION.md` | Dec 26 | Planning AI implementation plan | |
| `LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md` | Dec 26 | Estimate linking plan | |
| `PLANNING-AI-DOCUMENT-UPLOAD-SCHEDULE.md` | Dec 26 | Document upload enhancement | |
| `SFIA8-IMPLEMENTATION-PLAN.md` | Dec 25 | SFIA8 integration plan | |
| `SFIA8-VALIDATION-REPORT.md` | Dec 25 | Technical validation | |

---

## Appendix B: Review Prompts

Use these prompts to continue in a new chat session:

### Resume Prompt
```
I'm continuing the Systematic Application Review for AMSF001 Project Tracker.

Please read: /Users/glennnickols/Projects/amsf001-project-tracker/docs/SYSTEMATIC-APPLICATION-REVIEW.md

Check the Master Checklist and Session Log to see what's been completed.
Continue from the next unchecked item.
```

---

*Document Version: 1.0*
*Review Framework for Benchmarking, Planning & Estimator Tools*
