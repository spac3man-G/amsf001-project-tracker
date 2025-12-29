# Local Development Environment Setup Guide

This document describes how to set up a new Mac computer to work on the AMSF001 Project Tracker using a **Claude-first development workflow**. This setup uses Claude Desktop with MCP (Model Context Protocol) servers for AI-assisted full-stack development.

---

## Current Environment Snapshot

**Last Updated:** December 29, 2025

### Core Tools

| Component | Version |
|-----------|---------|
| macOS | 26.1 (Build 25B78) |
| Chip | Apple M4 |
| Node.js | v24.11.1 |
| npm | 11.6.2 |
| Git | 2.50.1 |
| Supabase CLI | 2.67.1 |
| Homebrew | 5.0.5 |
| Python | 3.14.0 |

### Claude Desktop Configuration

| Component | Status |
|-----------|--------|
| Claude Desktop | Installed |
| Desktop Commander (DXT) | Enabled - Filesystem + Terminal |
| GitHub MCP | Configured |
| Supabase MCP | Configured |
| Vercel MCP | Via Claude.ai Connector |

---

## Development Workflow Overview

This environment uses **Claude Desktop as the primary development interface**:

```
┌─────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  You ──▶ Claude Desktop ──▶ MCP Servers ──▶ External Services│
│              │                                               │
│              ├── Desktop Commander (files, terminal)         │
│              ├── GitHub MCP (repos, PRs, issues)            │
│              ├── Supabase MCP (database queries)            │
│              └── Vercel MCP (deployments, logs)             │
│                                                              │
│  Push to GitHub ──▶ Vercel Auto-Deploy ──▶ Production       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- No code editor required (VS Code, Cursor, etc.)
- Claude handles all file operations via Desktop Commander
- Direct database access via Supabase MCP
- Git operations via GitHub MCP
- Deployment monitoring via Vercel connector

---

## Step 1: Install Homebrew

Homebrew is the package manager for macOS.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Add Homebrew to your PATH (Apple Silicon Macs):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

Verify:
```bash
brew --version
```

---

## Step 2: Install Core Tools

### Git
```bash
brew install git
git config --global user.name "spac3man-G"
git config --global user.email "glenn@nickols.com"
```

### Node.js
```bash
brew install node
node --version
npm --version
```

### Supabase CLI
```bash
brew install supabase/tap/supabase
supabase --version
```

---

## Step 3: Install Claude Desktop

1. Download from https://claude.ai/download
2. Install the application
3. Sign in with your Anthropic account

---

## Step 4: Configure MCP Servers

MCP servers give Claude direct access to GitHub, Supabase, and your filesystem.

### 4.1 Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`, `admin:org`, `user`
4. Copy the token

### 4.2 Get Supabase Service Key

1. Go to https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
2. Settings → API
3. Copy the `service_role` key (NOT the anon key)

### 4.3 Edit MCP Configuration

Open the Claude Desktop config file:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add this configuration (replace with your actual keys):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
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
        "your_service_role_key_here",
        "--schema",
        "public"
      ]
    }
  }
}
```

### 4.4 Restart Claude Desktop

Quit Claude Desktop (Cmd+Q) and reopen it for changes to take effect.

---

## Step 5: Install Desktop Extensions (DXT)

Desktop Extensions provide additional Claude capabilities.

### Required: Desktop Commander

1. In Claude Desktop, go to Settings → Extensions
2. Search for "Desktop Commander"
3. Install and enable it

This provides:
- Full filesystem access (read, write, edit files)
- Terminal command execution
- Process management
- File search with regex

### Recommended: osascript

Enables macOS automation (AppleScript execution).

### Optional Extensions

| Extension | Purpose |
|-----------|---------|
| PDF Filler | Fill and manage PDF forms |
| Docling | Document format conversion |
| iMessage | Send/read messages via Claude |
| Notes | Access Apple Notes |

---

## Step 6: Configure Vercel MCP

Vercel access is configured via Claude.ai connectors:

1. Go to https://claude.ai
2. Click Settings → Connectors
3. Connect Vercel
4. Authorize with your Vercel account

This gives Claude access to:
- Deployment status and logs
- Project management
- Documentation search

---

## Step 7: Clone the Project

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker
npm install
```

---

## Step 8: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://ljqpmrcqxzgcfojrkxce.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PROJECT_REF=AMSF001
VITE_DEBUG=false
```

---

## Step 9: Link Supabase Project

```bash
supabase login
cd ~/Projects/amsf001-project-tracker
supabase link
```

Select the project when prompted.

---

## Step 10: Configure Shell Aliases

Add these to `~/.zshrc` for productivity:

```bash
# Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)"

# Project shortcuts
alias proj="cd ~/Projects/amsf001-project-tracker"
alias proj2="cd ~/Projects/resource-capacity-planner"
alias dev="npm run dev"
alias build="npm run build"

# Git shortcuts
alias gs="git status"
alias gp="git push"
alias gl="git log --oneline -10"
alias ga="git add ."
alias gc="git commit -m"

# Supabase shortcuts
alias sb="supabase"
alias sbstatus="supabase status"

# Quick commands
alias ll="ls -la"
alias cls="clear"
```

Reload: `source ~/.zshrc`

---

## Step 11: Verify Setup

### Test in Terminal
```bash
node --version          # v24.x.x
npm --version           # 11.x.x
git --version           # 2.x.x
supabase --version      # 2.67.x
proj && npm run build   # Should complete without errors
```

### Test in Claude Desktop

Start a new conversation and ask:
```
Verify my development environment:
1. List files in ~/Projects/amsf001-project-tracker
2. Query the profiles table in Supabase
3. Show my GitHub repositories
```

All three should work if MCP is configured correctly.

---


## Folder Structure

```
/Users/glennnickols/
├── Projects/
│   ├── amsf001-project-tracker/
│   │   ├── .env.local              # Local environment variables (not in git)
│   │   ├── .git/                   # Git repository
│   │   ├── .github/
│   │   │   └── workflows/          # CI/CD workflows
│   │   ├── api/                    # Vercel serverless functions
│   │   │   ├── chat.js
│   │   │   ├── create-organisation.js
│   │   │   ├── create-project.js
│   │   │   └── ...
│   │   ├── docs/                   # Documentation
│   │   ├── e2e/                    # Playwright E2E tests
│   │   ├── node_modules/           # Dependencies (not in git)
│   │   ├── public/                 # Static assets
│   │   ├── scripts/                # Build and test automation
│   │   ├── src/
│   │   │   ├── components/         # React components
│   │   │   ├── contexts/           # React contexts
│   │   │   ├── hooks/              # Custom hooks
│   │   │   ├── lib/                # Utilities and helpers
│   │   │   ├── pages/              # Page components
│   │   │   └── services/           # API service layer
│   │   ├── supabase/
│   │   │   ├── functions/          # Edge Functions
│   │   │   ├── migrations/         # Database migrations
│   │   │   └── tests/              # RLS policy tests
│   │   ├── package.json
│   │   ├── playwright.config.js
│   │   ├── vercel.json
│   │   └── vite.config.js
│   │
│   └── resource-capacity-planner/  # Second project
│
└── Library/
    └── Application Support/
        └── Claude/
            ├── claude_desktop_config.json    # MCP server config
            └── Claude Extensions/            # DXT extensions
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router |
| **Styling** | Custom CSS, Lucide Icons |
| **State** | React Context |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **API** | Vercel Serverless Functions |
| **Deployment** | Vercel (auto-deploy from GitHub) |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **AI Assistant** | Claude Desktop + MCP |

---

## External Services

| Service | Purpose | URL |
|---------|---------|-----|
| **GitHub** | Source control | https://github.com/spac3man-G |
| **Supabase** | Database & Auth | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| **Vercel** | Hosting & Deploy | https://vercel.com/glenns-projects-56c63cc4 |

---

## CI/CD Pipeline

```
Push to main ──▶ GitHub Actions ──▶ Build + Test ──▶ Vercel Deploy
                      │
                      ├── Unit tests (Vitest)
                      └── Build verification

Pull Request ──▶ GitHub Actions ──▶ Preview Deploy ──▶ Supabase Branch DB
```

---

## Troubleshooting

### MCP Server Not Connecting

1. Verify JSON syntax: 
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```
2. Restart Claude Desktop (Cmd+Q, then reopen)
3. Check for error banner at top of Claude window
4. Clear npx cache: `rm -rf ~/.npm/_npx`

### Desktop Commander Not Working

1. Go to Settings → Extensions
2. Verify Desktop Commander is enabled
3. Try disabling and re-enabling

### "Command not found" Errors

Homebrew not in PATH. Add to `~/.zshrc`:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Git Authentication Issues

Your credentials are stored in macOS Keychain. If issues occur:
```bash
git config --global credential.helper osxkeychain
```

### Supabase Connection Issues

1. Check IP allowlist: Supabase Dashboard → Settings → Database → Network
2. Verify credentials in `.env.local`
3. Test connection: `supabase status`

### npm Install Fails

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Working with Claude

### Starting a Development Session

Share this document at the start of your conversation:

```
Read ~/Projects/amsf001-project-tracker/docs/LOCAL-ENV-SETUP.md 
to understand my environment, then help me with [your task].
```

### What Claude Can Do

With your MCP setup, Claude can:

- **Read/write/edit** any file in your home directory
- **Run terminal commands** (npm, git, supabase, etc.)
- **Query your database** directly via Supabase MCP
- **Manage GitHub** repos, PRs, issues, branches
- **Check Vercel** deployments and logs
- **Search files** with regex patterns
- **Execute scripts** and manage processes

### Example Prompts

```
"Check the latest deployment status for amsf001-project-tracker"

"Query the database to show me all admin users"

"Find all files that import usePermissions hook"

"Create a new migration to add a status column to projects"

"Run the E2E tests and show me any failures"
```

---

## Security Notes

### Credential Storage

| Credential | Location | Security |
|------------|----------|----------|
| GitHub Token | `claude_desktop_config.json` | Local file only |
| Supabase Key | `claude_desktop_config.json` | Local file only |
| Git credentials | macOS Keychain | System secured |
| Vercel | OAuth via Claude.ai | Token managed by Anthropic |

### Recommendations

1. **Don't share your screen** when Claude Desktop settings are visible
2. **Back up credentials** in a password manager
3. **Rotate tokens periodically** (GitHub: Settings → Tokens)
4. Consider moving secrets to environment variables for added security

---

## Backup Checklist

| Item | Backed Up To |
|------|--------------|
| Code | GitHub (commit regularly) |
| `.env.local` values | Password manager |
| MCP config | This document + password manager |
| Database | Supabase automatic backups |

---

## Quick Reference

### Key Commands
```bash
proj                    # Navigate to project
dev                     # Start dev server (localhost:5173)
build                   # Production build
gs                      # Git status
gp                      # Git push
sb status               # Supabase status
```

### Key Files
```
~/.zshrc                                    # Shell config
~/Library/Application Support/Claude/
  └── claude_desktop_config.json            # MCP config
~/Projects/amsf001-project-tracker/
  ├── .env.local                            # Environment vars
  └── supabase/migrations/                  # DB migrations
```

### Key URLs
```
http://localhost:5173                       # Local dev
https://amsf001-project-tracker.vercel.app  # Production
https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce  # Database
https://github.com/spac3man-G/amsf001-project-tracker        # Repo
```

---

*Last verified: December 29, 2025*
