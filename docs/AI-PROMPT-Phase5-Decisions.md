# AI Prompt - Phase 5: Decision Points

**Created:** 2025-12-14  
**Use:** Copy everything below the line into a new Claude chat

---

## Context

I'm completing the AMSF001 Project Tracker state assessment. **Phases 1-4 are complete.**

Please read the project state checklist to understand current progress:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/PROJECT-STATE-ASSESSMENT.md
```

## Assessment Summary

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Git State | ✅ Complete | PR #4 merged, on main branch |
| 2. Supabase State | ✅ Complete | Test project + 7 users configured |
| 3. Test Infrastructure | ✅ Complete | Unit 94.8%, E2E 99.6%, 4 CI workflows |
| 4. Documentation | ✅ Complete | 18 active files, 21 archived |
| **5. Decisions** | 🎯 **Current** | Make decisions on next steps |

## Phase 5 Objective

Work through each decision point, document the decision made, and create an action plan.

---

## Decision Points to Resolve

### 5.1 Test Failures - Fix Strategy

**Context:**
- 27 unit test failures in `usePermissions.test.jsx`
- Root cause: Vitest needs `mode: 'development'` for React Testing Library
- 1 E2E failure: Mobile Chrome sidebar overlaps user menu

**Options:**
| Option | Effort | Impact |
|--------|--------|--------|
| A. Fix unit tests now | 30 min | 94.8% → 100% unit pass rate |
| B. Fix E2E mobile issue | 1-2 hours | 99.6% → 100% E2E pass rate |
| C. Fix both | 2-3 hours | Clean test suite |
| D. Document and defer | 10 min | Technical debt |

**Decision needed:** Which option? Priority?

---

### 5.2 Branch Cleanup

**Context:**
- `main` - Production, current branch ✅
- `develop` - Exists but no recent commits, purpose unclear
- `feature/cloud-testing-infrastructure` - MERGED, can delete
- `test/branching-setup` (remote) - Test branch, can delete
- `dependabot/npm_and_yarn/vite-7.2.6` - Automated security update

**Options:**
| Option | Action |
|--------|--------|
| A. Minimal cleanup | Delete only merged feature branch |
| B. Full cleanup | Delete feature + test branches, decide on develop |
| C. Address Dependabot | Merge or close the Vite update PR |

**Decision needed:** 
1. Delete `feature/cloud-testing-infrastructure`? 
2. Delete `test/branching-setup`?
3. Keep or delete `develop` branch?
4. Handle Dependabot PR?

---

### 5.3 Test Data Seeding

**Context:**
- Test project exists with 7 users
- 5 milestones + 13 deliverables already seeded
- Timesheets/expenses tables cleaned (0 records, ready for seed)
- Seed script ready: `npm run e2e:seed`

**Options:**
| Option | Action |
|--------|--------|
| A. Seed now | Run seed script to populate timesheets/expenses |
| B. Leave as-is | Tests pass without additional seed data |
| C. Enhance seed script | Add more comprehensive test scenarios |

**Decision needed:** Seed additional data now or leave as-is?

---

### 5.4 Legacy Test Users Cleanup

**Context:**
From Phase 2, these legacy users exist in Supabase:
- 5 UAT test users: `uat.admin@`, `uat.supplier.pm@`, `uat.customer.pm@`, `uat.contributor@`, `uat.viewer@`
- 1 orphan: `e2e.test@amsf001.test`

**Options:**
| Option | Action |
|--------|--------|
| A. Delete now | Remove via Supabase dashboard |
| B. Keep for now | May be useful for manual testing |
| C. Mark as inactive | Update `is_test_user` flag |

**Decision needed:** Clean up legacy users?

---

### 5.5 Next Development Priorities

**Context:**
Testing infrastructure is complete. What's next?

**Potential priorities:**
| Priority | Effort | Value |
|----------|--------|-------|
| Fix unit test config | 30 min | Clean CI, developer confidence |
| Fix mobile CSS issue | 1-2 hours | Mobile usability |
| Add page-specific E2E tests | 2-3 hours each | Test coverage for Expenses, Deliverables, etc. |
| New feature development | Variable | Business value |
| Performance optimization | Variable | User experience |

**Decision needed:** Top 3 priorities for next sprint/session?

---

## How to Work Through This

1. **Read each decision point** above
2. **Ask me clarifying questions** if needed
3. **Present options with your recommendation** for each
4. **Document decisions** in PROJECT-STATE-ASSESSMENT.md
5. **Create action plan** with timeline estimates

## Key Files to Reference

```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/PROJECT-STATE-ASSESSMENT.md
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-PROMPT-Project-Context-v2.md
/Users/glennnickols/Projects/amsf001-project-tracker/docs/E2E_TESTING_STATUS_2025-12-14.md
/Users/glennnickols/Projects/amsf001-project-tracker/vite.config.js  (for unit test fix)
/Users/glennnickols/Projects/amsf001-project-tracker/package.json    (for available scripts)
```

## Key URLs

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |
| GitHub Actions | https://github.com/spac3man-G/amsf001-project-tracker/actions |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| Production Site | https://amsf001-project-tracker.vercel.app |
| Dependabot PR | https://github.com/spac3man-G/amsf001-project-tracker/pull/5 (if exists) |

---

## Output Expected

By end of this session, update PROJECT-STATE-ASSESSMENT.md with:

1. ✅ Decision 5.1 - Test fix strategy
2. ✅ Decision 5.2 - Branch cleanup 
3. ✅ Decision 5.3 - Test data seeding
4. ✅ Decision 5.4 - Legacy user cleanup
5. ✅ Decision 5.5 - Next priorities (top 3)
6. 📋 Action plan with owner and timeline
