# AI Prompt: Documentation Review Phase 3 & 4

**Created:** 7 January 2026  
**Purpose:** Continue AMSF001 documentation consolidation from Phase 2 findings

---

## Context

I've completed a systematic review of the AMSF001 Project Tracker documentation (Phase 1: Discovery, Phase 2: Content Analysis). All findings are captured in `docs/DOC-REVIEW-CHECKPOINT.md`.

**Key Discovery:** The codebase has grown significantly beyond what's documented. Most critically, the **Evaluator module** (17 database tables, 14 frontend pages, 19 services, 8 API endpoints) is completely undocumented across all TECH-SPEC files.

---

## What Was Reviewed

| Document | Status | Changes Needed |
|----------|--------|----------------|
| TECH-SPEC-01-Architecture.md | ✅ Reviewed | 9 changes |
| TECH-SPEC-02-Database-Core.md | ✅ Reviewed | 7 changes |
| TECH-SPEC-03-Database-Operations.md | ✅ Reviewed | 3 changes |
| TECH-SPEC-04-Database-Supporting.md | ✅ Reviewed | 3 changes |
| TECH-SPEC-05-RLS-Security.md | ✅ Reviewed | 3 changes |
| TECH-SPEC-06-API-AI.md | ✅ Reviewed | 5 changes |
| TECH-SPEC-07-Frontend-State.md | ✅ Reviewed | 4 changes |
| TECH-SPEC-08-Services.md | ✅ Reviewed | 6 changes |
| TECH-SPEC-09-Testing-Infrastructure.md | ⏭️ Skipped | To revisit later |

**Total: 40 specific changes identified with IDs (01-01 through 08-06)**

---

## Critical Finding: Evaluator Module Gap

The Evaluator module is production-ready but has ZERO documentation:

| Layer | Count | Location |
|-------|-------|----------|
| Database tables | 17 | Migrations 202601010001-0019 |
| RLS policies | 17 tables | Same migrations |
| API endpoints | 8 | `/api/evaluator/` |
| Frontend pages | 14 | `/src/pages/evaluator/` |
| Services | 19 | `/src/services/evaluator/` |
| Context | 1 | `EvaluationContext.jsx` |

**Recommendation:** Create **TECH-SPEC-11-Evaluator.md** rather than patching 5+ existing documents.

---

## Your Tasks

### Phase 3: Code Verification

Before making changes, verify key findings against actual code:

1. **Confirm table counts** - Run migration analysis to confirm 45+ tables
2. **Verify Evaluator tables** - List all 17 Evaluator table names from migrations
3. **Check service exports** - Verify services mentioned exist and are exported
4. **Validate API endpoints** - Confirm all `/api/evaluator/` endpoints exist

### Phase 4: Consolidation

Make the documented changes. Start with highest-impact items:

**Priority 1: Create New Documents**
- [ ] TECH-SPEC-11-Evaluator.md (comprehensive Evaluator documentation)
- [ ] TECH-SPEC-00-Overview.md (master index, from AMSF001-Technical-Specification.md)

**Priority 2: Critical Updates**
- [ ] TECH-SPEC-01: Update "28 tables" to "45+ tables" (ID 01-01)
- [ ] TECH-SPEC-01: Add Evaluator module architecture overview (ID 01-08)
- [ ] TECH-SPEC-02: Add missing tables (deliverable_tasks, project_plans, org_invitations)

**Priority 3: Remaining Changes**
- Apply all other changes per checkpoint file (IDs 01-02 through 08-06)

---

## Key Files to Reference

```
/docs/DOC-REVIEW-CHECKPOINT.md     ← Master checkpoint with all findings
/docs/TECH-SPEC-01-Architecture.md
/docs/TECH-SPEC-02-Database-Core.md
/docs/TECH-SPEC-03-Database-Operations.md
/docs/TECH-SPEC-04-Database-Supporting.md
/docs/TECH-SPEC-05-RLS-Security.md
/docs/TECH-SPEC-06-API-AI.md
/docs/TECH-SPEC-07-Frontend-State.md
/docs/TECH-SPEC-08-Services.md

/supabase/migrations/              ← Source of truth for database
/src/services/                     ← All services (34 root + 19 evaluator)
/src/services/evaluator/           ← Evaluator services
/src/pages/evaluator/              ← Evaluator pages
/src/contexts/                     ← All contexts (12 total)
/api/                              ← API endpoints
/api/evaluator/                    ← Evaluator API endpoints
```

---

## Change ID Reference

All changes have unique IDs in format `XX-YY` where XX = document number, YY = change number.

**Quick reference by document:**

| Doc | IDs | Summary |
|-----|-----|---------|
| 01 | 01-01 to 01-09 | Architecture updates, add Evaluator/Planning modules |
| 02 | 02-01 to 02-07 | Add 3 tables, fix org_owner reference, renumber sections |
| 03 | 03-01 to 03-03 | Verify expense_files, add receipt tables to inventory |
| 04 | 04-01 to 04-03 | Add dashboard_layouts, chat views, milestone_certificates |
| 05 | 05-01 to 05-03 | Add Evaluator RLS section, clarify org_owner role |
| 06 | 06-01 to 06-05 | Add manage-project-users, report-ai, 8 Evaluator APIs |
| 07 | 07-01 to 07-04 | Add EvaluationContext, ReportBuilderContext, 14 pages |
| 08 | 08-01 to 08-06 | Add 19 Evaluator services + 4 other services |

---

## Suggested Approach

1. **Read checkpoint file first** - `view /docs/DOC-REVIEW-CHECKPOINT.md`
2. **Start with TECH-SPEC-11** - Create Evaluator documentation from code
3. **Update TECH-SPEC-01** - Fix the architecture overview
4. **Work through remaining changes** - Use change IDs for tracking
5. **Update checkpoint** - Mark completed items

---

## Success Criteria

- [ ] TECH-SPEC-11-Evaluator.md created with full module documentation
- [ ] TECH-SPEC-00-Overview.md created as master index
- [ ] All 40 changes applied to existing TECH-SPEC documents
- [ ] Checkpoint file updated to show Phase 4 complete
- [ ] No undocumented production features remain

---

*This prompt was generated at the end of Phase 2. The checkpoint file contains complete details for all findings.*
