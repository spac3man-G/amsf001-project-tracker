# AMSF001 Project Tracker - Configuration & Development Guide

> **Version:** 3.0  
> **Last Updated:** 30 November 2025  

---

## 🔐 Credentials Notice

**API keys and credentials are stored in the Claude Project Knowledge**, not in this file (to avoid exposing them in Git).

When starting a new Claude session, the credentials are automatically available via the Project Knowledge files:
- `AMSF001-Configuration-Guide-v2.md` - Contains all API keys, passwords, and MCP configuration

---

## 📁 Project Overview

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

1. Claude accesses the local repository via the **Filesystem MCP** or **Desktop Commander** tools
2. Git commands are executed via **AppleScript** shell commands or **Desktop Commander**
3. Changes are pushed to GitHub which triggers **automatic Vercel deployments**

This approach is more reliable, provides better error recovery, and gives you full visibility into changes before they go live.

---

## 🛠 Available MCP Connectors

### Core Development Connectors

| Connector | Purpose | Use For |
|-----------|---------|---------|
| **Filesystem MCP** | Read/write files in `/Users/glennnickols/` | File editing, reading code |
| **Desktop Commander** | Advanced file ops, terminal sessions, process management | Complex file operations, running commands, search |
| **Vercel MCP** | Deployment management | Check deployments, view logs, manage projects |
| **Supabase MCP** | Database access via PostgREST | Query/modify database tables |
| **GitHub MCP** | Repository management | View repo info, manage issues/PRs (NOT for file ops) |

### macOS Integration Connectors

| Connector | Purpose | Use For |
|-----------|---------|---------|
| **Control your Mac (osascript)** | Execute AppleScript commands | Git commands, shell scripts |
| **Read and Write Apple Notes** | Apple Notes integration | Quick notes, documentation drafts |
| **Read and Send iMessages** | iMessage integration | Notifications (if needed) |

### Document Processing Connectors

| Connector | Purpose | Use For |
|-----------|---------|---------|
| **PDF Tools** | PDF manipulation | Read/fill forms, extract data, bulk processing |

---

## 🖥 Desktop Commander Reference

Desktop Commander provides powerful file and process management capabilities.

### File Operations

```javascript
// Read a file
Desktop Commander:read_file { path: "/path/to/file" }

// Write a file
Desktop Commander:write_file { path: "/path/to/file", content: "...", mode: "rewrite" }

// Edit a file (surgical replacement)
Desktop Commander:edit_block { file_path: "/path/to/file", old_string: "...", new_string: "..." }

// List directory
Desktop Commander:list_directory { path: "/path/to/dir", depth: 2 }

// Search for files
Desktop Commander:start_search { path: "/path", pattern: "*.jsx", searchType: "files" }

// Search file contents
Desktop Commander:start_search { path: "/path", pattern: "usePermissions", searchType: "content" }
```

### Process/Terminal Operations

```javascript
// Start a process (e.g., git commands)
Desktop Commander:start_process { 
  command: "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status",
  timeout_ms: 10000 
}

// List active terminal sessions
Desktop Commander:list_sessions {}

// Interact with running process
Desktop Commander:interact_with_process { pid: 12345, input: "command" }
```

### When to Use Desktop Commander vs Filesystem MCP

| Task | Recommended Tool |
|------|------------------|
| Simple file read/write | Filesystem MCP |
| Surgical text replacement | Desktop Commander:edit_block |
| Running git commands | Desktop Commander:start_process |
| Searching across files | Desktop Commander:start_search |
| Complex file operations | Desktop Commander |

---

## 📝 Apple Notes Integration

Useful for quick documentation or capturing ideas during development.

### Available Operations

```javascript
// List all notes
Read and Write Apple Notes:list_notes { limit: 20 }

// Get note content
Read and Write Apple Notes:get_note_content { note_name: "My Note" }

// Create a new note
Read and Write Apple Notes:add_note { name: "Note Title", content: "Note content..." }

// Update existing note
Read and Write Apple Notes:update_note_content { note_name: "My Note", new_content: "Updated content" }
```

---

## 📄 PDF Tools Reference

Useful for project certificates, reports, or form processing.

### Available Operations

```javascript
// List PDFs in a directory
PDF Tools:list_pdfs { directory: "~/Documents" }

// Read PDF form fields
PDF Tools:read_pdf_fields { pdf_path: "/path/to/form.pdf" }

// Fill a PDF form
PDF Tools:fill_pdf { 
  pdf_path: "/path/to/form.pdf",
  output_path: "/path/to/filled.pdf",
  field_data: { "field_name": "value" }
}

// Read PDF content (text extraction)
PDF Tools:read_pdf_content { pdf_path: "/path/to/document.pdf" }

// Bulk fill from CSV
PDF Tools:bulk_fill_from_csv {
  pdf_path: "/path/to/template.pdf",
  csv_path: "/path/to/data.csv",
  output_directory: "/path/to/output"
}
```

---

## 💬 iMessage Integration

Available for notifications if needed (likely overkill for this project).

### Available Operations

```javascript
// Search contacts
Read and Send iMessages:search_contacts { query: "John" }

// Send a message
Read and Send iMessages:send_imessage { recipient: "+44...", message: "Hello" }

// Read messages from contact
Read and Send iMessages:read_imessages { phone_number: "+44...", limit: 10 }

// Get unread messages
Read and Send iMessages:get_unread_imessages { limit: 10 }
```

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

### Git Operations

**Using AppleScript (osascript):**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Message'"
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git push origin main"
```

**Using Desktop Commander:**
```javascript
Desktop Commander:start_process { 
  command: "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status",
  timeout_ms: 10000 
}
```

---

## 📋 Development Workflow (Step-by-Step)

### 1. Starting a Development Session

Before making any changes:

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

1. **Read the current file** using Filesystem MCP or Desktop Commander
2. **Make edits** using Filesystem:edit_file or Desktop Commander:edit_block
3. **Verify changes** by reading the file again

### 3. Committing Changes

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description'"
```

### 4. Deploying to Production

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git push origin main"
```

### 5. Verify Deployment

Use Vercel MCP to check deployment status.

---

## 🐙 GitHub Configuration

> **⚠ Note:** GitHub API access via MCP is available but **not recommended** for file operations. Use for viewing repo info, managing issues/PRs only.

| Property | Value |
|----------|-------|
| **Username** | spac3man-G |
| **Repository** | amsf001-project-tracker |
| **Repository URL** | https://github.com/spac3man-G/amsf001-project-tracker |
| **Default Branch** | main |

### GitHub MCP - Recommended Uses

- View repository information
- List/create/update issues
- List/create/review pull requests
- Search code across repositories
- View commit history

### GitHub MCP - NOT Recommended

- Creating or updating files (use local Git instead)
- Pushing changes (use local Git instead)

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

### View Commit History

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git log --oneline -20"
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

### Desktop Commander Issues

| Issue | Solution |
|-------|----------|
| Process timeout | Increase `timeout_ms` parameter |
| File not found | Use absolute paths starting with `/Users/glennnickols/` |
| Search returns no results | Check path and pattern syntax |

---

## 📋 Key File Locations

| File | Location |
|------|----------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Pages** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages` |
| **Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components` |
| **Common Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/common` |
| **Hooks** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks` |
| **Contexts** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |
| **Permissions Library** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissions.js` |
| **Development Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v7.md` |
| **Claude Desktop Config** | `~/Library/Application Support/Claude/claude_desktop_config.json` |

---

## 📝 Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 28 Nov 2025 | Initial document |
| 2.0 | 29 Nov 2025 | Added local Git workflow, removed credentials from Git version |
| **3.0** | **30 Nov 2025** | **Added new MCP connectors: Desktop Commander, PDF Tools, Apple Notes, iMessages** |

---

*Document Version: 3.0*  
*Last Updated: 30 November 2025*
