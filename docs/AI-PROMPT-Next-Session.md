# AI Prompt - Next Development Session

**Created:** 2025-12-15  
**Last Updated:** 2025-12-15  
**Use:** Copy everything below the line into a new Claude chat

---

## Context

I'm continuing work on the **AMSF001 Project Tracker**. The Phase 5 state assessment is complete.

Please read these files to understand current state:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/PROJECT-STATE-ASSESSMENT.md
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-PROMPT-Project-Context-v2.md
```

Use the Filesystem MCP tools to access my project files directly.

---

## What Was Completed (2025-12-14/15)

| Task | Status | Details |
|------|--------|---------|
| Unit test fix | ✅ Done | Added `env: { NODE_ENV: 'development' }` to Vitest — now 515/515 passing |
| Branch cleanup | ✅ Done | Deleted `develop`, `feature/cloud-testing-infrastructure`, `test/branching-setup` |
| Workflow documented | ✅ Done | GitHub Flow (trunk-based) documented in AI-PROMPT-Project-Context-v2.md |
| Test seed guidance | ✅ Done | Added "When to Seed Test Data" section to docs |
| Legacy user cleanup | ✅ Done | Deleted 6 UAT/orphan test users from Supabase |
| Vite security investigation | ✅ Done | Confirmed Vite 5.4.21 is patched for all known CVEs; stale Dependabot branch cleaned up |

---

## Current State Summary

| Area | Status |
|------|--------|
| **Git** | Clean — only `main` branch (no other branches) |
| **Unit Tests** | 515/515 passing (100%) |
| **E2E Tests** | 223/224 passing (99.6%) — 1 mobile CSS issue |
| **Supabase** | 7 active e2e.* test users, production data intact |
| **Docs** | 18 active files, 21 archived |
| **Security** | No known vulnerabilities (`npm audit` clean) |

---

## Outstanding Items

### 1. Mobile E2E Test Failure (Low Priority)

One E2E test fails on Mobile Chrome:
- **Issue:** Sidebar overlaps user menu button
- **Impact:** Cosmetic, doesn't affect functionality
- **Fix:** CSS responsive design adjustment

### 2. Future Consideration: Vite 7 Upgrade (Optional)

**Background:** On 2025-12-15, we investigated a GitHub Dependabot security alert for Vite.

**Findings:**
- Vite 5.4.21 (current) is **fully patched** for all known CVEs (CVE-2025-30208, CVE-2025-31125, CVE-2025-46565)
- `npm audit` reports **0 vulnerabilities**
- The vulnerabilities only affected dev servers exposed to the network (`--host` flag), not production builds
- Vite 5.x is now EOL (End of Life) — Vite 7 is the current major version

**Decision:** No immediate action required. The current version is secure.

**Future option:** Upgrade to Vite 7 when convenient to stay on a maintained release. This is a major version upgrade (5 → 7) that may have breaking changes. Test thoroughly on a feature branch before merging.

### 3. Next Development Priorities (Decision 5.5)

What should be the focus for the next sprint? Options include:
- Fix the mobile CSS issue
- Add E2E tests for untested pages (Expenses, Deliverables, KPIs)
- New feature development
- Performance optimization
- Vite 7 upgrade (optional, not urgent)

---

## Recommended Next Steps

1. **Complete Decision 5.5** — define top 3 priorities for next sprint
2. **Update PROJECT-STATE-ASSESSMENT.md** with final decisions
3. **Commit and push** all documentation updates

---

## Key Commands

```bash
# Navigate to project
cd /Users/glennnickols/Projects/amsf001-project-tracker

# Run tests
npm run test          # Unit tests (515 tests)
npm run e2e           # E2E tests (224 tests)

# Git status
git status
git branch -a

# Check for vulnerabilities
npm audit
```

---

## Key URLs

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |
| Production Site | https://amsf001-project-tracker.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| GitHub Actions | https://github.com/spac3man-G/amsf001-project-tracker/actions |

---

## Development Workflow Reminder

This project uses **GitHub Flow** (simple trunk-based):

1. Create feature branch from `main`
2. Develop locally with Claude AI
3. Push and create PR → tests run automatically, Vercel creates preview
4. Review and merge → auto-deploys to production
5. Delete feature branch after merge
