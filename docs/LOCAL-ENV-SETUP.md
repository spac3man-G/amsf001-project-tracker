# Local Development Environment Setup Guide

This document describes how to set up a new Mac computer to work on the AMSF001 Project Tracker. Use this guide if you need to set up a fresh machine or restore your development environment.

---

## Current Environment Snapshot

**Last Updated:** December 2025

| Component | Version |
|-----------|---------|
| macOS | 26.1 (Build 25B78) |
| Node.js | v24.11.1 |
| npm | 11.6.2 |
| Git | 2.50.1 |
| Supabase CLI | 2.65.5 |
| Homebrew | 5.0.5 |

---

## Step 1: Install Homebrew

Homebrew is the package manager for macOS. It installs everything else.

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH. For Apple Silicon Macs (M1/M2/M3/M4):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

Verify it works:

```bash
brew --version
```

---

## Step 2: Install Git

```bash
brew install git
```

Configure Git with your identity:

```bash
git config --global user.name "spac3man-G"
git config --global user.email "glenn@nickols.com"
```

---

## Step 3: Install Node.js

Install Node.js (includes npm):

```bash
brew install node
```

Verify installation:

```bash
node --version
npm --version
```

---

## Step 4: Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

Verify installation:

```bash
supabase --version
```

---

## Step 5: Set Up GitHub Authentication

### Option A: GitHub CLI (Recommended)

```bash
brew install gh
gh auth login
```

Follow the prompts to authenticate via browser.

### Option B: SSH Keys

Generate an SSH key:

```bash
ssh-keygen -t ed25519 -C "glenn@nickols.com"
```

Start the SSH agent and add your key:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Copy the public key:

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

Add it to GitHub:
1. Go to github.com → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the key and save

---

## Step 6: Clone the Project

```bash
cd ~/Projects
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker
```

Or if using SSH:

```bash
git clone git@github.com:spac3man-G/amsf001-project-tracker.git
```

---

## Step 7: Install Project Dependencies

```bash
cd ~/Projects/amsf001-project-tracker
npm install
```

---

## Step 8: Set Up Environment Variables

Create the local environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://ljqpmrcqxzgcfojrkxce.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PROJECT_REF=AMSF001
VITE_DEBUG=false
```

**To get your Supabase anon key:**
1. Go to https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
2. Click "Settings" → "API"
3. Copy the "anon public" key

---

## Step 9: Link Supabase Project

Log in to Supabase CLI:

```bash
supabase login
```

This opens a browser window. Authorize the CLI.

Link your project:

```bash
cd ~/Projects/amsf001-project-tracker
supabase link
```

Select the project when prompted. If asked for database password, you can skip it or reset it in Supabase Dashboard → Settings → Database.

---

## Step 10: Verify Everything Works

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You should see the login page.

---

## Recommended Applications

These are optional but useful applications I use:

| Application | Purpose | Install |
|-------------|---------|---------|
| **iTerm2** | Better terminal | `brew install --cask iterm2` |
| **Claude Desktop** | AI assistant | Download from claude.ai |
| **Comet Browser** | Arc alternative | Download from comet.surf |
| **Raycast** | Spotlight replacement | `brew install --cask raycast` |

---

## Project-Specific Configuration

### Vercel Connection

The project is deployed on Vercel. To manage deployments:

1. Go to https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker
2. Sign in with your GitHub account

The Vercel-GitHub integration handles automatic deployments. No local Vercel CLI setup is needed.

### Supabase Branching

Supabase branching is already configured via the Supabase-Vercel integration. When you create a Pull Request with migration files:

1. Vercel creates a preview deployment
2. Supabase creates a database branch
3. Your preview uses the isolated branch database

No additional local configuration is needed.

---

## Folder Structure After Setup

```
/Users/glennnickols/
└── Projects/
    └── amsf001-project-tracker/
        ├── .env.local          # Your local environment variables (not in git)
        ├── .git/               # Git repository
        ├── docs/               # Documentation
        ├── node_modules/       # Dependencies (not in git)
        ├── public/             # Static assets
        ├── src/                # Source code
        ├── supabase/
        │   └── migrations/     # Database migration files
        ├── package.json
        └── vite.config.js
```

---

## Common Issues & Solutions

### "Command not found: node"

Homebrew might not be in your PATH. Run:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Then add it to your shell profile permanently.

### "Permission denied" when cloning

You haven't authenticated with GitHub. Run:

```bash
gh auth login
```

Or set up SSH keys (see Step 5).

### "Missing Supabase environment variables"

Your `.env.local` file is missing or incomplete. Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.

### Can't connect to Supabase

Check that your IP isn't blocked. Go to Supabase Dashboard → Settings → Database → Network and ensure your IP is allowed (or allow all IPs for development).

### npm install fails

Try clearing the npm cache:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Account Access Required

To work on this project, you need access to:

| Service | Account | URL |
|---------|---------|-----|
| **GitHub** | spac3man-G | https://github.com |
| **Supabase** | glenn@nickols.com | https://supabase.com |
| **Vercel** | glenn@nickols.com | https://vercel.com |

Make sure you can log into all three services before starting.

---

## Quick Verification Checklist

Run these commands to verify your setup is complete:

```bash
# Check all tools are installed
node --version          # Should show v24.x.x or later
npm --version           # Should show 11.x.x or later
git --version           # Should show 2.x.x
supabase --version      # Should show 2.x.x

# Check project is set up
cd ~/Projects/amsf001-project-tracker
cat .env.local          # Should show your Supabase credentials
npm run build           # Should complete without errors

# Check Supabase is linked
supabase status         # Should show project info
```

---

## Getting Help

If you're setting this up with Claude's help, share this document at the start of your conversation:

```
Please read /Users/glennnickols/Projects/amsf001-project-tracker/docs/LOCAL-ENV-SETUP.md 
to understand my development environment, then help me with [your issue].
```

Also share the project context document:

```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-PROMPT-Project-Context.md
```

---

## Backup Recommendations

To avoid losing your setup, regularly back up:

1. **Code** - Already backed up on GitHub (just commit and push regularly)
2. **Environment variables** - Keep `.env.local` values in a password manager (1Password, etc.)
3. **Supabase credentials** - Available in Supabase Dashboard, but save them somewhere safe
4. **SSH keys** - Back up `~/.ssh/` folder to a secure location

---

*Last verified: December 13, 2025*
