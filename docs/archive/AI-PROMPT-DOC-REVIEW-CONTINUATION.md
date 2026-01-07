# AI Prompt: Documentation Review Continuation

**Created:** 7 January 2026  
**Purpose:** Continue AMSF001 documentation review in segmented fashion with checkpoints  
**Approach:** Work in small segments, checkpoint after each, survive context limits

---

## Session Startup Instructions

**FIRST:** Read this entire file before starting any work.

**THEN:** Check the Progress Tracker section below to see what's already done and what segment to work on next.

**ALWAYS:** Update the Progress Tracker in this file after completing each segment.

---

## Progress Tracker

### Completed Documents ✅

| Document | Version | Status | Date |
|----------|---------|--------|------|
| TECH-SPEC-01-Architecture.md | v2.3 | ✅ Complete | 7 Jan 2026 |
| TECH-SPEC-02-Database-Core.md | v5.1 | ✅ Complete | 7 Jan 2026 |
| TECH-SPEC-03-Database-Operations.md | v1.2 | ✅ Complete | 7 Jan 2026 |
| TECH-SPEC-04-Database-Supporting.md | v1.3 | ✅ Complete | 7 Jan 2026 |
| TECH-SPEC-05-RLS-Security.md | v4.1 | ✅ Complete | 7 Jan 2026 |
| TECH-SPEC-11-Evaluator.md | v1.0 | ✅ Complete (NEW) | 7 Jan 2026 |

### Remaining Segments

| Segment | Document | Work Required | Status |
|---------|----------|---------------|--------|
| A | TECH-SPEC-06-API-AI.md | Add Evaluator API reference, missing endpoints | ✅ COMPLETE (v1.5) |
| B | TECH-SPEC-07-Frontend-State.md | Add Evaluator context/pages reference | ✅ COMPLETE (v5.3) |
| C | TECH-SPEC-08-Services.md | Add Evaluator services reference | ✅ COMPLETE (v5.1) |
| D | DOC-REVIEW-CHECKPOINT.md | Final status update | ✅ COMPLETE |
| E | TECH-SPEC-00-Overview.md | Create master index (OPTIONAL) | ✅ COMPLETE (v1.0) |

---

## Segment A: TECH-SPEC-06-API-AI.md

### Changes Required (IDs 06-01 through 06-05)

1. **Add to Section 2.1 Endpoint Summary table:**
   - `/api/manage-project-users` - POST - Manage project team membership
   - `/api/report-ai` - POST - AI report generation

2. **Add NEW Section 10: Evaluator API Endpoints**
   Reference TECH-SPEC-11-Evaluator.md for full details, but add summary:
   
   | Endpoint | Method | Purpose |
   |----------|--------|---------|
   | `/api/evaluator/ai-document-parse` | POST | Parse uploaded documents with AI |
   | `/api/evaluator/ai-gap-analysis` | POST | AI gap analysis for requirements |
   | `/api/evaluator/ai-market-research` | POST | AI market research for vendors |
   | `/api/evaluator/ai-requirement-suggest` | POST | AI requirement suggestions |
   | `/api/evaluator/client-portal-auth` | POST | Client portal authentication |
   | `/api/evaluator/create-evaluation` | POST | Create new evaluation project |
   | `/api/evaluator/generate-report` | POST | Generate evaluation report |
   | `/api/evaluator/vendor-portal-auth` | POST | Vendor portal authentication |

3. **Update version header to v1.5** with change notes

4. **Update Document History table**

### Verification Steps
```bash
# Verify endpoints exist
ls -la /Users/glennnickols/Projects/amsf001-project-tracker/api/
ls -la /Users/glennnickols/Projects/amsf001-project-tracker/api/evaluator/
```

### Checkpoint Action
After completing Segment A:
1. Update this file's Progress Tracker (change Segment A status to ✅ COMPLETE)
2. Note the new version number

---

## Segment B: TECH-SPEC-07-Frontend-State.md

### Changes Required (IDs 07-01 through 07-04)

1. **Add to Section 8 (Supporting Contexts) or create Section 15:**
   
   **EvaluationContext** - State management for Evaluator module
   - Location: `/src/contexts/EvaluationContext.jsx`
   - Reference: See TECH-SPEC-11-Evaluator.md Section 4 for full details
   
   **ReportBuilderContext** - State management for report builder
   - Location: `/src/contexts/ReportBuilderContext.jsx`

2. **Add NEW Section 16: Evaluator Frontend**
   Reference to TECH-SPEC-11-Evaluator.md, summary of 15 pages:
   - Location: `/src/pages/evaluator/`
   - Pages: Dashboard, Requirements, Vendors, Workshops, Surveys, Scoring, Reports, etc.

3. **Update version header to v5.3** with change notes

4. **Update Document History table**

### Verification Steps
```bash
# Verify contexts exist
ls -la /Users/glennnickols/Projects/amsf001-project-tracker/src/contexts/
# Verify evaluator pages exist
ls -la /Users/glennnickols/Projects/amsf001-project-tracker/src/pages/evaluator/
```

### Checkpoint Action
After completing Segment B:
1. Update this file's Progress Tracker (change Segment B status to ✅ COMPLETE)
2. Note the new version number

---

## Segment C: TECH-SPEC-08-Services.md

### Changes Required (IDs 08-01 through 08-06)

1. **Add NEW Section 16: Evaluator Services**
   Reference TECH-SPEC-11-Evaluator.md Section 5 for full details.
   
   Summary (18 services in `/src/services/evaluator/`):
   - ai.service.js
   - approvals.service.js
   - base.evaluator.service.js
   - clientPortal.service.js
   - comments.service.js
   - emailNotifications.service.js
   - evaluationCategories.service.js
   - evaluationDocuments.service.js
   - evaluationProjects.service.js
   - evidence.service.js
   - requirements.service.js
   - scores.service.js
   - stakeholderAreas.service.js
   - surveys.service.js
   - traceability.service.js
   - vendorQuestions.service.js
   - vendors.service.js
   - workshops.service.js

2. **Update Section 1.3 File Structure** to include `evaluator/` subfolder

3. **Add to services listing (if not already present):**
   - workflow.service.js
   - email.service.js
   - standards.service.js
   - syncService.js

4. **Update version header to v5.1** with change notes

5. **Update Document History table**

### Verification Steps
```bash
# Verify evaluator services exist
ls -la /Users/glennnickols/Projects/amsf001-project-tracker/src/services/evaluator/
# Count services
ls /Users/glennnickols/Projects/amsf001-project-tracker/src/services/evaluator/ | wc -l
```

### Checkpoint Action
After completing Segment C:
1. Update this file's Progress Tracker (change Segment C status to ✅ COMPLETE)
2. Note the new version number

---

## Segment D: Final Checkpoint Update

### Work Required

Update `/docs/DOC-REVIEW-CHECKPOINT.md`:

1. **Update Phase Status section:**
   - Mark Phase 4 as COMPLETE
   - Add completion date

2. **Update all change IDs with completion status:**
   - 01-01 through 01-09: ✅ COMPLETE (v2.3)
   - 02-01 through 02-07: ✅ COMPLETE (v5.1)
   - 03-01 through 03-03: ✅ COMPLETE (v1.2)
   - 04-01 through 04-03: ✅ COMPLETE (v1.3)
   - 05-01 through 05-03: ✅ COMPLETE (v4.1)
   - 06-01 through 06-05: ✅ COMPLETE (v1.5)
   - 07-01 through 07-04: ✅ COMPLETE (v5.3)
   - 08-01 through 08-06: ✅ COMPLETE (v5.1)

3. **Add Session Log entry:**
   ```
   | 2 | 7 Jan 2026 | TECH-SPEC-06, 07, 08 | Phase 4 complete. All 40 changes applied. TECH-SPEC-11-Evaluator.md created. |
   ```

4. **Update "Undocumented Features Discovered" table** - mark all as documented

### Checkpoint Action
After completing Segment D:
1. Update this file's Progress Tracker (change Segment D status to ✅ COMPLETE)

---

## Segment E: Master Index (OPTIONAL)

### Work Required

Create `/docs/TECH-SPEC-00-Overview.md` as master index:

1. Extract overview content from `AMSF001-Technical-Specification.md`
2. Create navigation index to all TECH-SPEC documents
3. Add quick reference tables for:
   - All database tables by document
   - All services by category
   - All API endpoints
   - All frontend pages

### Checkpoint Action
After completing Segment E:
1. Update this file's Progress Tracker (change Segment E status to ✅ COMPLETE)

---

## Key File Paths

```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/
├── TECH-SPEC-00-Overview.md          ✅ v1.0 (NEW - Master Index)
├── TECH-SPEC-01-Architecture.md      ✅ v2.3
├── TECH-SPEC-02-Database-Core.md     ✅ v5.1
├── TECH-SPEC-03-Database-Operations.md ✅ v1.2
├── TECH-SPEC-04-Database-Supporting.md ✅ v1.3
├── TECH-SPEC-05-RLS-Security.md      ✅ v4.1
├── TECH-SPEC-06-API-AI.md            ✅ v1.5
├── TECH-SPEC-07-Frontend-State.md    ✅ v5.3
├── TECH-SPEC-08-Services.md          ✅ v5.1
├── TECH-SPEC-11-Evaluator.md         ✅ v1.0 (NEW)
├── DOC-REVIEW-CHECKPOINT.md          ✅ Phase 4 COMPLETE
└── AI-PROMPT-DOC-REVIEW-CONTINUATION.md  (this file)

Source code for verification:
/Users/glennnickols/Projects/amsf001-project-tracker/api/
/Users/glennnickols/Projects/amsf001-project-tracker/api/evaluator/
/Users/glennnickols/Projects/amsf001-project-tracker/src/services/
/Users/glennnickols/Projects/amsf001-project-tracker/src/services/evaluator/
/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts/
/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/evaluator/
```

---

## Working Approach

### For Each Segment:

1. **READ** the segment requirements in this file
2. **VERIFY** files exist using the verification commands
3. **READ** the target document header to confirm current version
4. **MAKE** the documented changes
5. **UPDATE** version header and Document History
6. **UPDATE** this file's Progress Tracker
7. **CONFIRM** completion with user

### Context Management Tips:

- Work on ONE segment per message if context is limited
- Always update Progress Tracker before ending session
- If context runs out mid-segment, note where you stopped in Progress Tracker
- The checkpoint file (`DOC-REVIEW-CHECKPOINT.md`) has full details of all required changes

### Version Header Template:

```markdown
> **Version X.X Updates (7 January 2026):**
> - Added reference to TECH-SPEC-11 for Evaluator module documentation
> - [Other specific changes made]
```

---

## Success Criteria

- [x] TECH-SPEC-06 updated to v1.5 with Evaluator API reference
- [x] TECH-SPEC-07 updated to v5.3 with Evaluator frontend reference
- [x] TECH-SPEC-08 updated to v5.1 with Evaluator services reference
- [x] DOC-REVIEW-CHECKPOINT.md shows Phase 4 complete
- [x] All Progress Tracker items marked ✅ COMPLETE (Segments A-E)
- [x] TECH-SPEC-00-Overview.md created (master index)

---

## Session History

| Session | Date | Segments Completed | Notes |
|---------|------|-------------------|-------|
| 1 | 7 Jan 2026 | TECH-SPEC 01-05, 11 | Created TECH-SPEC-11, updated 01-05 |
| 2 | 7 Jan 2026 | Segment A, B | Updated TECH-SPEC-06 to v1.5, TECH-SPEC-07 to v5.3 |
| 3 | 7 Jan 2026 | Segment C | Updated TECH-SPEC-08 to v5.1 |
| 4 | 7 Jan 2026 | Segment D | Final checkpoint update - Phase 4 complete |
| 5 | 7 Jan 2026 | Segment E | Created TECH-SPEC-00-Overview.md master index (477 lines) |

---

*Update this file after each segment completion to maintain persistence across sessions.*
