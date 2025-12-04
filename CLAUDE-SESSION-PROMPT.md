# AMSF001 Project Tracker - Claude AI Session Prompt

**Version:** 4.0  
**Last Updated:** 5 December 2025

---

## How to Use This Prompt

Copy everything below the line into a new Claude chat to start a development session. The Configuration Guide with credentials should be uploaded to your Claude Project Knowledge (not pasted into chat).

---

## PROMPT FOR CLAUDE

---

I need help developing the **AMSF001 Project Tracker** application.

## Project Overview

| Component | Details |
|-----------|---------|
| **Application** | AMSF001 Project Tracker |
| **Tech Stack** | React 18.2 + Vite + Supabase + Vercel |
| **Repository** | github.com/spac3man-G/amsf001-project-tracker |
| **Live Site** | https://amsf001-project-tracker.vercel.app |
| **Local Repo** | `/Users/glennnickols/Projects/amsf001-project-tracker` |

---

## How You Access My System

You have access to my Mac via MCP tools:

| Tool | Purpose |
|------|---------|
| **Filesystem MCP** | Read/write files in `/Users/glennnickols/` |
| **Desktop Commander** | Execute shell commands, search files |
| **Vercel MCP** | Check deployments, view logs |
| **Supabase MCP** | Query/modify database via PostgREST |

**Important:** Use Desktop Commander for Git operations, not GitHub API.

---

## Key Documents to Read

Before starting work, read the relevant session summaries:

```
/Users/glennnickols/Projects/amsf001-project-tracker/SESSION-SUMMARY-2025-12-05.md
/Users/glennnickols/Projects/amsf001-project-tracker/SESSION-SUMMARY-2025-12-04.md
```

For chat-specific work, also read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/AI-CHAT-ASSISTANT-SPEC.md
```

---

## Current Project Status (as of 5 December 2025)

### ✅ Recently Completed

| Date | Work Completed |
|------|----------------|
| 5 Dec | Chat performance: query timeouts, parallel execution, extended cache |
| 5 Dec | Chat UX: context loading indicator |
| 4 Dec | Financial calculations refactoring (Phase I-III) |
| 4 Dec | Dashboard widgets: Timesheets + Expenses |
| 4 Dec | Database column renames (daily_rate→sell_price, budget→billable) |
| 3 Dec | Supabase .single() error fix across all services |
| 3 Dec | UI consistency - full row clickability |

### ✅ AI Chat Architecture (Complete)

The chat has a **three-tier hybrid architecture**:

| Tier | Speed | Model | Implementation |
|------|-------|-------|----------------|
| 1 | ~100ms | None (local) | `generateLocalResponse()` in ChatContext |
| 2 | 1-2s | Haiku (streaming) | `/api/chat-stream` |
| 3 | 3-5s | Sonnet (tools) | `/api/chat` with 12 database tools |

### ❌ Remaining Chat Improvements

| Priority | Item | Description |
|----------|------|-------------|
| Medium | #8 Dashboard Cache Integration | Reuse MetricsContext data in chat |
| Medium | #9 Aggregate Supabase Views | Create project_summary materialized view |
| Low | #11 Vercel KV Cache | Persistent cross-instance caching |
| Low | #12 Pre-computed Summaries | Background job for summary stats |

### ❌ Other Pending Tasks

| Priority | Task | Notes |
|----------|------|-------|
| ⚠️ URGENT | P9: Milestone RLS Policies | SQL ready in `sql/P9-milestone-update-rls.sql` |
| Medium | P8: Deliverables Contributor Access | SQL ready |
| Low | Additional dashboard widgets | KPIs, Quality Standards, Partners |

---

## Standard Git Workflow

**Check status:**
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker && git status
```

**Commit and deploy:**
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Description' && git push
```

Pushing to main triggers automatic Vercel deployment.

---

## My Request

[STATE YOUR SPECIFIC REQUEST HERE]

---

## END OF PROMPT

---

## Quick Reference: Common Session Starters

### Continue Chat Performance Work
```
Read the session summary at /Users/glennnickols/Projects/amsf001-project-tracker/SESSION-SUMMARY-2025-12-05.md to see what was completed on 5 December 2025. Then let's continue with the remaining chat improvements (#8, #9, #11, or #12).
```

### For Other Development Tasks
```
Read the session summaries in /Users/glennnickols/Projects/amsf001-project-tracker/ and let's work on [TASK].
```

### For Bug Fixes
```
I'm seeing an error on the [PAGE] page when I [ACTION]. Please investigate and fix it.
```

### For Status Check
```
Read the recent session summaries and give me an overview of what's been done and what's next.
```

---

## Key Documentation Files

| File | Purpose |
|------|---------|
| `SESSION-SUMMARY-2025-12-05.md` | Chat performance optimisation (5 Dec) |
| `SESSION-SUMMARY-2025-12-04.md` | Financial refactoring + dashboard widgets (4 Dec) |
| `AI-CHAT-ASSISTANT-SPEC.md` | Chat assistant requirements and architecture |
| `AMSF001-Technical-Reference.md` | Architecture, services, troubleshooting |
| `src/config/metricsConfig.js` | Financial calculation utilities |

---

## Chat System Key Files

| File | Purpose |
|------|---------|
| `api/chat.js` | Main chat endpoint (Sonnet + tools) |
| `api/chat-stream.js` | Streaming endpoint (Haiku, no tools) |
| `api/chat-context.js` | Pre-fetch context endpoint |
| `src/contexts/ChatContext.jsx` | Client-side chat state + tier routing |
| `src/components/chat/ChatWidget.jsx` | Chat UI component |
