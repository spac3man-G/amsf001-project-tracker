# AMSF001 Project Tracker - Configuration Guide

> **Version:** 3.1  
> **Last Updated:** 30 November 2025

---

## 🚀 Standard Deployment Workflow

**This is the primary workflow for all development:**

```
Local Changes → git push origin main → GitHub → Vercel Auto-Deploy → Live Site
```

Push to `main` triggers automatic Vercel deployment. No manual steps needed.

---

## 🔐 Credentials

**API keys and credentials are stored in the Claude Project Knowledge**, not in this file (to avoid exposing them in Git).

When starting a Claude session, upload:
- `AI_AMSF001-Claude-Session-Prompt-v3.md` (from this repo)
- `AMSF001-Configuration-Guide-v2.md` (from Claude Project Knowledge - contains all API keys)

The Project Knowledge document contains:
- Supabase API keys
- GitHub Personal Access Token
- Anthropic API key (for AI Chat)
- Full MCP configuration

---

## 📋 Project Overview

| Property | Value |
|----------|-------|
| **Application** | AMSF001 Project Tracker |
| **Production URL** | https://amsf001-project-tracker.vercel.app |
| **Repository** | https://github.com/spac3man-G/amsf001-project-tracker |
| **Local Path** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Framework** | React + Vite |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |
| **AI Chat** | Claude API (Haiku) |

---

## 🛠 Development Tools

### MCP Tools Available

| Tool | Purpose |
|------|---------|
| **Filesystem MCP** | Read/write local files |
| **AppleScript** | Execute Git commands |
| **Vercel MCP** | Check deployments |
| **Supabase MCP** | Database operations |

### Git Commands (via AppleScript)

```applescript
-- Check status
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"

-- Commit and push
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Message' && git push origin main"
```

---

## 📁 Key File Locations

| File | Location |
|------|----------|
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **API Functions** | `/Users/glennnickols/Projects/amsf001-project-tracker/api` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v8.md` |
| **Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components` |
| **Contexts** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |

---

## 🤖 AI Chat Configuration

The application includes an AI chat assistant. Required environment variable in Vercel:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access for chat feature |

The actual key is stored in Claude Project Knowledge.

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| AI Chat not working | Check ANTHROPIC_API_KEY in Vercel environment variables |
| Deployment not triggering | Check GitHub webhook, verify push succeeded |
| Supabase errors | Check RLS policies match user role |
| Wrong API key | Check Claude Project Knowledge for correct key |

---

## 📝 Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| Development Playbook v8 | Implementation guide | This repo |
| Session Prompt v3 | Claude session starter | This repo |
| Configuration Guide v2 (with keys) | Full credentials | Claude Project Knowledge |

---

*Document Version: 3.1*  
*Last Updated: 30 November 2025*
