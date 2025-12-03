# AMSF001 Project Tracker - Configuration & Development Guide

> **Version:** 2.0  
> **Last Updated:** 29 November 2025  

---

## 🔐 Credentials Notice

**API keys and credentials are stored in the Claude Project Knowledge**, not in this file (to avoid exposing them in Git).

When starting a new Claude session, the credentials are automatically available via the Project Knowledge files:
- `AMSF001-Configuration-Guide-v2.md` - Contains all API keys, passwords, and MCP configuration

---

## 🔐 Project Overview

| Property | Value |
|----------|-------|
| **Project Name** | AMSF001 Network Standards and Design Architectural Services |
| **Application** | AMSF001 Project Tracker |
| **Production URL (Primary)** | https://amsf001-project-tracker.vercel.app |
| **Repository** | https://github.com/spac3man-G/amsf001-project-tracker |
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Framework** | React + Vite |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |

---

## 🔧 Development Workflow Overview

### Why Local Git Instead of GitHub API?

Through development experience, we've learned that the **GitHub API MCP should not be trusted for reliable file operations**. Issues encountered include:

- File upload failures and corrupted uploads
- Inconsistent state between what the API reports and actual repository contents
- Difficulty recovering from failed multi-file operations
- Complex conflict resolution when API operations partially succeed

**Solution:** We now use a **local Git workflow** where:

1. Claude accesses the local repository via the **Filesystem MCP** tools
2. Git commands are executed via **AppleScript** shell commands
3. Changes are pushed to GitHub which triggers **automatic Vercel deployments**

This approach is more reliable, provides better error recovery, and gives you full visibility into changes before they go live.

---

## 💻 Local Git Repository Setup

### Repository Location

```
/Users/glennnickols/Projects/amsf001-project-tracker
```

### Current Status

| Property | Value |
|----------|-------|
| **Branch** | main |
| **Remote** | origin → github.com/spac3man-G/amsf001-project-tracker |
| **Auto-deploy** | Enabled - pushes to main automatically deploy to Vercel |

---

## 🛠 How Claude Works with Local Git

### Available Tools

Claude uses these tools to interact with your local Git repository:

| Tool | Purpose |
|------|---------|
| **Filesystem MCP** | Read/write files in `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **AppleScript (osascript)** | Execute Git commands via `do shell script` |
| **Vercel MCP** | Check deployment status, view logs, manage Vercel projects |
| **Supabase MCP** | Query and modify database directly |

### Common Git Operations via AppleScript

**Check status:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
```

**View recent commits:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git log --oneline -10"
```

**Stage and commit changes:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Your commit message'"
```

**Push to GitHub (triggers Vercel deploy):**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git push origin main"
```

**Pull latest changes:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git pull origin main"
```

---

## 📋 Development Workflow (Step-by-Step)

### 1. Starting a Development Session

Before making any changes, Claude should:

1. **Check current status:**
   ```applescript
   do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
   ```

2. **Pull latest changes (if needed):**
   ```applescript
   do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git pull origin main"
   ```

3. **Review recent commits:**
   ```applescript
   do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git log --oneline -5"
   ```

### 2. Making Changes

1. **Read the current file** using Filesystem tools
2. **Make edits** using Filesystem:edit_file or Filesystem:write_file
3. **Verify changes** by reading the file again

### 3. Committing Changes

After changes are verified locally:

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description of changes'"
```

### 4. Deploying to Production

Push to GitHub - Vercel will automatically deploy:

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git push origin main"
```

### 5. Verify Deployment

Use Vercel MCP to check deployment status.

---

## 🔑 MCP Configuration

**Config File Location (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`

The MCP configuration with actual API keys is stored in the **Claude Project Knowledge** (`AMSF001-Configuration-Guide-v2.md`).

Key MCPs configured:
- **Supabase MCP** - Database access via PostgREST
- **Filesystem MCP** - Local file access
- **Vercel MCP** - OAuth authenticated, enabled in Claude Desktop settings
- **GitHub MCP** - Available but NOT recommended for file operations

---

## 🐙 GitHub Configuration

> **⚠ Note:** GitHub API access via MCP is available but **not recommended** for file operations.

| Property | Value |
|----------|-------|
| **Username** | spac3man-G |
| **Repository** | amsf001-project-tracker |
| **Repository URL** | https://github.com/spac3man-G/amsf001-project-tracker |
| **Default Branch** | main |

---

## 🗄 Supabase Configuration

| Property | Value |
|----------|-------|
| **Project Name** | amsf001-tracker |
| **Project ID** | `ljqpmrcqxzgcfojrkxce` |
| **Dashboard URL** | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |

### API Endpoints

| Endpoint Type | URL |
|---------------|-----|
| **REST API** | `https://ljqpmrcqxzgcfojrkxce.supabase.co/rest/v1` |
| **Auth API** | `https://ljqpmrcqxzgcfojrkxce.supabase.co/auth/v1` |

### Database Tables (22 tables)

**Core Tables:**
- `projects` - Project metadata and budgets
- `milestones` - Project milestones with dates and payments
- `deliverables` - Deliverable items linked to milestones
- `resources` - Team members with rates and allocations
- `timesheets` - Time entries and approval workflow
- `expenses` - Expense claims with categories
- `kpis` - Key performance indicators
- `profiles` - User profiles and roles

**Supporting Tables:**
- `notifications`, `milestone_certificates`, `quality_standards`, `quality_checks`
- `network_standards`, `audit_log`, `expense_files`, `user_notification_preferences`
- Junction tables: `deliverable_quality_standards`, `deliverable_kpis`, `deliverable_qs_assessments`, `deliverable_kpi_assessments`
- `workflow_summary` - Workflow view

### MCP Limitations

The Supabase MCP can only perform CRUD operations via PostgREST:
- ✅ SELECT, INSERT, UPDATE, DELETE
- ❌ CREATE TABLE, ALTER TABLE, DROP (use Supabase Dashboard SQL Editor)

---

## ▲ Vercel Configuration

| Property | Value |
|----------|-------|
| **Team Name** | Glenn's projects |
| **Team Slug** | glenns-projects-56c63cc4 |
| **Project Name** | amsf001-project-tracker |
| **Dashboard** | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |

### Production Domains

1. `https://amsf001-project-tracker.vercel.app` ← **Primary**
2. `https://amsf001-project-tracker-glennsprojects-56c63cc4.vercel.app`

### Build Settings

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node Version** | 22.x |
| **Auto-deploy** | Enabled on push to `main` |

### Deployment Flow

```
Local Changes → git push origin main → GitHub → Vercel Auto-Deploy → Live Site
```

---

## 🔄 Rollback Procedures

### Revert Last Commit (Not Yet Pushed)

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git reset --soft HEAD~1"
```

### Revert Last Commit (Already Pushed)

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git revert HEAD --no-edit && git push origin main"
```

---

## 🔧 Troubleshooting

### Supabase MCP Not Working

| Issue | Solution |
|-------|----------|
| Wrong Project ID | Ensure URL contains `ljqpmrcqxzgcfojrkxce` |
| Wrong API key | Check Claude Project Knowledge for correct key |
| Tool execution failed | Restart Claude Desktop after config changes |

### Local Git Not Working

| Issue | Solution |
|-------|----------|
| "Not a git repository" | Verify path: `/Users/glennnickols/Projects/amsf001-project-tracker` |
| "Authentication failed" | Check GitHub credentials in macOS Keychain |
| Merge conflicts | Run `git status` to see conflicting files |

### Vercel MCP Not Working

| Issue | Solution |
|-------|----------|
| Not authenticated | Re-connect OAuth in Claude settings |
| Deployment not triggering | Check GitHub webhook in repo settings |

---

## 📋 Key File Locations

| File | Location |
|------|----------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Pages** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages` |
| **Hooks** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks` |
| **Contexts** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |
| **Permissions Library** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissions.js` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v5.md` |
| **Claude Desktop Config** | `~/Library/Application Support/Claude/claude_desktop_config.json` |

---

*Document Version: 2.0*  
*Last Updated: 29 November 2025*
