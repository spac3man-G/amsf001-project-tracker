# AI Prompt - Phase 2: Supabase State Assessment

**Created:** 2025-12-14  
**Use:** Copy everything below the line into a new Claude chat

---

## Context

I'm continuing work on my AMSF001 Project Tracker state assessment. **Phase 1 (Git State) is complete.**

Please read the project state checklist to understand current progress:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/PROJECT-STATE-ASSESSMENT.md
```

## Current Status

- ✅ Phase 1 Complete - Git repository synced, docs cleaned, on `main` branch
- 🎯 **Starting Phase 2 - Supabase State**

## Phase 2 Objective

Verify the Supabase database has the correct E2E test infrastructure:
- Test project exists: `[TEST] E2E Test Project` (ID: `6a643018-f250-4f18-aff6-e06c8411d09e`)
- 7 test users exist with correct emails
- Project role assignments are correct
- Resource records are linked

## Key URLs

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |

## What I Need

1. Start from item **2.1** in the checklist
2. Use Filesystem MCP tools to access my project files
3. Validate assumptions before making recommendations
4. Ask for confirmation before taking destructive actions

## Files to Reference

- `/Users/glennnickols/Projects/amsf001-project-tracker/docs/PROJECT-STATE-ASSESSMENT.md` - Progress checklist
- `/Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-PROMPT-Project-Context-v2.md` - Project context with E2E testing info
- `/Users/glennnickols/Projects/amsf001-project-tracker/scripts/e2e/.test-project-id` - Test project UUID
- `/Users/glennnickols/Projects/amsf001-project-tracker/scripts/e2e/verify-test-environment.js` - Verification script

## Note on Supabase Access

I may need to check Supabase directly via the dashboard for some items. If you need me to run queries or check specific tables, tell me what to look for and I'll report back.

Alternatively, if there's a verification script we can run locally, let's use that.
