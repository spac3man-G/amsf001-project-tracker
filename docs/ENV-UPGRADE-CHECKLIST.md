# Environment Upgrade Implementation Checklist

**Created:** December 29, 2025  
**Purpose:** Step-by-step guide to implement environment improvements  
**Estimated Time:** 30-45 minutes

---

## Pre-Flight Checks

- [ ] **Quit Claude Desktop completely** (Cmd+Q, not just close window)
- [ ] **Open Terminal** (iTerm2)
- [ ] **Navigate to project:** `cd ~/Projects/amsf001-project-tracker`

---

## Phase 1: Add Vercel MCP Server (Priority: HIGH)

This gives Claude direct access to your Vercel deployments, logs, and documentation.

### Step 1.1: Backup Current Config

```bash
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup
```

- [ ] Backup created

### Step 1.2: Edit MCP Configuration

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Replace the entire contents with:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-postgrest",
        "--apiUrl",
        "https://ljqpmrcqxzgcfojrkxce.supabase.co/rest/v1",
        "--apiKey",
        "sb_secret_YOUR_SUPABASE_KEY_HERE",
        "--schema",
        "public"
      ]
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.vercel.com/sse"]
    }
  }
}
```

- [ ] Config file updated with Vercel MCP
- [ ] Saved file

### Step 1.3: Verify JSON is Valid

```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
```

- [ ] JSON validated successfully

---

## Phase 2: Update Supabase CLI

### Step 2.1: Update via Homebrew

```bash
brew upgrade supabase
```

- [ ] Supabase CLI updated

### Step 2.2: Verify Version

```bash
supabase --version
```

Expected: `2.67.x` or higher

- [ ] Version confirmed: ____________

---

## Phase 3: Add Shell Aliases

### Step 3.1: Edit .zshrc

```bash
open ~/.zshrc
```

Replace contents with:

```bash
# Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)"

# ===========================================
# PROJECT SHORTCUTS
# ===========================================

# Quick navigation
alias proj="cd ~/Projects/amsf001-project-tracker"
alias proj2="cd ~/Projects/resource-capacity-planner"

# Development
alias dev="npm run dev"
alias build="npm run build"
alias preview="npm run preview"

# Testing
alias test="npm run test"
alias e2e="npm run e2e"
alias e2eui="npm run e2e:ui"

# ===========================================
# GIT SHORTCUTS
# ===========================================
alias gs="git status"
alias gp="git push"
alias gl="git log --oneline -10"
alias gd="git diff"
alias ga="git add ."
alias gc="git commit -m"
alias gac="git add . && git commit -m"

# ===========================================
# SUPABASE SHORTCUTS
# ===========================================
alias sb="supabase"
alias sblink="supabase link"
alias sbstatus="supabase status"
alias sbdb="supabase db"
alias sbmig="supabase migration"

# ===========================================
# QUICK COMMANDS
# ===========================================
alias cls="clear"
alias ll="ls -la"
alias ..="cd .."
alias ...="cd ../.."
```

- [ ] .zshrc updated

### Step 3.2: Reload Shell Configuration

```bash
source ~/.zshrc
```

- [ ] Shell reloaded

### Step 3.3: Test Aliases

```bash
proj && pwd
```

Expected output: `/Users/glennnickols/Projects/amsf001-project-tracker`

- [ ] Aliases working

---

## Phase 4: Evaluate Existing Extensions

Open Claude Desktop and go to **Settings → Extensions** to review each extension.

### Extension Audit

| Extension | Keep? | Action |
|-----------|-------|--------|
| Desktop Commander | ✅ YES | Essential - do not disable |
| osascript | ✅ YES | Useful for macOS automation |
| PDF Filler | ⬜ ? | Disable if you don't fill PDF forms |
| Docling | ⬜ ? | Disable if you don't convert documents |
| iMessage | ⬜ ? | Disable if you don't send messages via Claude |
| Notes | ⬜ ? | Disable if you don't use Apple Notes |

### Step 4.1: Disable Unused Extensions

For each extension you want to disable:
1. Go to Settings → Extensions
2. Find the extension
3. Toggle OFF

- [ ] Reviewed all extensions
- [ ] Disabled unused extensions (list which ones): ____________________

---

## Phase 5: Restart and Verify

### Step 5.1: Start Claude Desktop

- [ ] Launched Claude Desktop

### Step 5.2: Verify MCP Servers

In a new Claude conversation, ask:
> "List all your available MCP tools and confirm you can access GitHub, Supabase, and Vercel"

- [ ] GitHub MCP confirmed working
- [ ] Supabase MCP confirmed working
- [ ] Vercel MCP confirmed working (may require OAuth authorization on first use)

### Step 5.3: Authorize Vercel (First Time Only)

When you first use Vercel MCP, Claude will provide an authorization link.

1. Click the authorization link
2. Log in to Vercel
3. Approve the connection
4. Return to Claude

- [ ] Vercel OAuth completed

### Step 5.4: Test Desktop Commander

Ask Claude:
> "Use Desktop Commander to list the contents of ~/Projects"

- [ ] Desktop Commander working

---

## Phase 6: Update Context Document

### Step 6.1: Create Updated LOCAL-ENV-SETUP.md

Ask Claude:
> "Based on my current environment (which you just verified), create an updated LOCAL-ENV-SETUP.md that accurately reflects my setup. Include:
> - Current tool versions
> - MCP server configuration
> - DXT extensions
> - Shell aliases
> - The Claude-first development workflow"

- [ ] New document created

### Step 6.2: Review and Save

- [ ] Reviewed updated document
- [ ] Saved to `~/Projects/amsf001-project-tracker/docs/LOCAL-ENV-SETUP.md`

### Step 6.3: Commit Changes

```bash
cd ~/Projects/amsf001-project-tracker
git add docs/LOCAL-ENV-SETUP.md docs/ENV-UPGRADE-CHECKLIST.md
git commit -m "docs: Update environment setup documentation"
git push
```

- [ ] Changes committed and pushed

---

## Phase 7: Optional Security Improvements

If you want to move secrets to environment variables (recommended if screen sharing):

### Step 7.1: Add Secrets to .zshrc

Add to the TOP of `~/.zshrc` (before other content):

```bash
# API Keys (keep private)
export GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"
export SUPABASE_API_KEY="YOUR_SUPABASE_KEY_HERE"
```

- [ ] Secrets added to .zshrc

### Step 7.2: Update MCP Config to Use Variables

Update `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-postgrest",
        "--apiUrl",
        "https://ljqpmrcqxzgcfojrkxce.supabase.co/rest/v1",
        "--apiKey",
        "${SUPABASE_API_KEY}",
        "--schema",
        "public"
      ]
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.vercel.com/sse"]
    }
  }
}
```

- [ ] Config updated to use environment variables
- [ ] Restarted Claude Desktop
- [ ] Verified MCP servers still work

---

## Verification Checklist

Run these commands to verify your setup:

```bash
# Tool versions
echo "=== Tool Versions ===" && \
node --version && \
npm --version && \
git --version && \
supabase --version && \
python3 --version

# Project setup
echo -e "\n=== Project Check ===" && \
cd ~/Projects/amsf001-project-tracker && \
git status --short && \
echo "Project OK"

# Aliases
echo -e "\n=== Alias Check ===" && \
type proj && \
type dev && \
type gs
```

- [ ] All tool versions confirmed
- [ ] Project status OK
- [ ] Aliases working

---

## Completion Summary

| Phase | Status |
|-------|--------|
| Phase 1: Vercel MCP | ⬜ |
| Phase 2: Supabase Update | ⬜ |
| Phase 3: Shell Aliases | ⬜ |
| Phase 4: Extension Audit | ⬜ |
| Phase 5: Verification | ⬜ |
| Phase 6: Documentation | ⬜ |
| Phase 7: Security (Optional) | ⬜ |

**Environment Upgrade Complete:** ⬜

---

## Troubleshooting

### MCP Server Not Appearing

1. Ensure Claude Desktop is fully quit (not just minimized)
2. Verify JSON syntax is valid
3. Check Console.app for Claude errors
4. Try: `rm -rf ~/.npm/_npx` then restart Claude

### Vercel Authorization Failed

1. Ensure you're logged into correct Vercel account
2. Try in incognito browser window
3. Check Vercel dashboard for pending authorizations

### Aliases Not Working

1. Ensure you ran `source ~/.zshrc`
2. Open new terminal window
3. Check for syntax errors in .zshrc

---

## Post-Upgrade: What You Can Now Do

With your upgraded environment, you can:

1. **Ask Claude about deployments:**
   > "Check the status of my latest Vercel deployment for amsf001-project-tracker"

2. **Debug build failures:**
   > "Fetch the build logs for my failed deployment and tell me what went wrong"

3. **Query Vercel docs:**
   > "How do I configure preview deployments for Supabase branching?"

4. **Full-stack debugging:**
   > "Check the Vercel deployment logs and Supabase database for issues with the milestones feature"

---

*Checklist created: December 29, 2025*
