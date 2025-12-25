
# User Guide: Signup & Onboarding

**Version:** 1.0  
**Created:** 24 December 2025  
**Last Updated:** 24 December 2025  

---

## Overview

This guide covers the user journey from first visit through to having a fully configured organisation ready for project work.

---

## Table of Contents

1. [New Visitor Journey](#1-new-visitor-journey)
2. [Account Creation](#2-account-creation)
3. [Organisation Creation](#3-organisation-creation)
4. [Onboarding Wizard](#4-onboarding-wizard)
5. [Inviting Team Members](#5-inviting-team-members)
6. [Accepting an Invitation](#6-accepting-an-invitation)
7. [Multi-Organisation Users](#7-multi-organisation-users)

---

## 1. New Visitor Journey

### Landing Page

New visitors arriving at the application see a public landing page at `/`.

**What's on the landing page:**
- Hero section explaining the platform
- Key features overview
- "Get Started Free" and "Sign In" buttons
- Footer with login/signup links

**Navigation options:**
| Action | Destination |
|--------|-------------|
| Click "Get Started Free" | `/login?mode=signup` |
| Click "Sign In" | `/login` |
| Click "Login" (header) | `/login` |

### Already Logged In?

If a user is already authenticated and visits `/`, they are automatically redirected to `/dashboard`.

---

## 2. Account Creation

### Signup Process

**URL:** `/login?mode=signup`

**Required Information:**
- Email address
- Password (minimum 8 characters for initial signup)

**Steps:**
1. Enter email address
2. Enter password
3. Click "Sign Up"
4. Check email for verification link
5. Click verification link to confirm account
6. Redirected to organisation creation

### Password Requirements

Initial signup requires a simple password, but users may be prompted to set a stronger password later:

| Requirement | Initial Signup | Strong Password |
|-------------|----------------|-----------------|
| Minimum length | 8 characters | 12 characters |
| Uppercase | Optional | Required |
| Lowercase | Optional | Required |
| Number | Optional | Required |
| Special character | Optional | Required |

### Email Verification

After signup, users receive an email with a verification link. The email contains:
- Welcome message
- Verification button/link
- Link expiry information

**Note:** Users cannot access the application until their email is verified.

---

## 3. Organisation Creation

### When It Appears

After email verification, if the user has no organisation memberships, they are redirected to `/onboarding/create-organisation`.

### Create Organisation Form

**Required Fields:**
- Organisation Name (e.g., "Acme Corporation")

**Auto-Generated Fields:**
- Slug (URL-friendly identifier, editable)

**Example:**
```
Name: "My Company Ltd"
Slug: "my-company-ltd" (auto-generated, can be edited)
```

### What Happens on Creation

1. Organisation record created with:
   - `subscription_tier: 'free'`
   - `is_active: true`
   - `settings.onboarding_completed: false`

2. User added as `org_admin` with:
   - `is_default: true`
   - Full permissions to manage organisation

3. User redirected to Onboarding Wizard

---

## 4. Onboarding Wizard

### Overview

The onboarding wizard guides new organisation admins through initial setup. It consists of 4 steps, some of which can be skipped.

**URL:** `/onboarding/wizard`

### Step 1: Organisation Details

**Purpose:** Confirm or update organisation information

**Fields:**
- Display Name (how the org appears in the UI)
- Organisation Name (if different)

**Actions:**
- "Continue" → Proceed to Step 2

**Note:** This step cannot be skipped.

### Step 2: Invite Team (Optional)

**Purpose:** Invite team members to join the organisation

**Features:**
- Add up to 5 email addresses
- Select role for each invitation:
  - **Admin** - Full org management
  - **Member** - Access assigned projects only
- Invitations sent immediately on "Continue"

**Actions:**
- "Continue" → Send invitations, proceed to Step 3
- "Skip for now" → Proceed without inviting

**Note:** More team members can be invited later from Organisation Members page.

### Step 3: First Project (Optional)

**Purpose:** Create the organisation's first project

**Fields:**
- Project Name (e.g., "Website Redesign")
- Project Reference (e.g., "WEB-001")
- Description (optional)

**Actions:**
- "Create & Continue" → Create project, proceed to Step 4
- "Skip for now" → Proceed without creating project

**Note:** Projects can be created later from the Projects page.

### Step 4: Complete

**Purpose:** Confirm setup is complete, provide next steps

**Information Shown:**
- Summary of what was created
- Organisation name
- Number of invitations sent
- Project name (if created)

**Next Steps Links:**
- Go to Dashboard
- Invite More Team Members
- Create a Project

**On Completion:**
- `settings.onboarding_completed` set to `true`
- User redirected to Dashboard

---

## 5. Inviting Team Members

### Where to Invite

After onboarding, team members can be invited from:
- **Organisation Members** page (`/admin/organisation/members`)

### Invitation Process

1. Click "Invite Member" button
2. Enter email address
3. Select role (Admin or Member)
4. Click "Send Invitation"

### What the Invitee Receives

Email containing:
- Inviter's name
- Organisation name
- "Accept Invitation" button
- Link expiry (7 days from send)

### Managing Invitations

**Pending Invitations Section** shows:
- Email address
- Role assigned
- Time until expiry
- Status (pending/expired)

**Actions:**
| Action | Description |
|--------|-------------|
| Resend | Generates new token, resets expiry, sends new email |
| Copy Link | Copies invitation URL to clipboard |
| Revoke | Cancels invitation, user cannot accept |

### Invitation Limits

Currently, the free tier has **unlimited** invitations. If paid tiers are enabled:
- Limit counts both active members AND pending invitations
- Error shown if limit reached
- Must upgrade or revoke pending invitations to invite more

---

## 6. Accepting an Invitation

### Invitation Email

Recipients receive an email with:
- Who invited them
- Which organisation
- Accept button (valid for 7 days)

### Accept Flow (New User)

If the invitee does NOT have an account:

1. Click "Accept Invitation" in email
2. Redirected to `/accept-invitation/[token]`
3. Prompted to create account (email pre-filled)
4. After signup, automatically added to organisation
5. Redirected to Dashboard

### Accept Flow (Existing User)

If the invitee already has an account:

1. Click "Accept Invitation" in email
2. Redirected to `/accept-invitation/[token]`
3. If not logged in, prompted to log in
4. After login, automatically added to organisation
5. Redirected to Dashboard

### After Acceptance

- User appears in Organisation Members list
- User can access projects they're assigned to
- If `org_admin`, can access all organisation projects

---

## 7. Multi-Organisation Users

### How It Works

A single user can be a member of multiple organisations. This is common for:
- Consultants working with multiple clients
- Users who belong to multiple companies
- System administrators

### Switching Organisations

**Organisation Switcher** appears in the header/sidebar when user belongs to multiple organisations.

**Behaviour:**
- Shows all organisations user is a member of
- Current organisation highlighted
- Click to switch
- Project list updates to show new organisation's projects

### Default Organisation

- First organisation joined is set as default
- Default org is selected on login
- Can be changed in settings (future feature)

### Organisation-Specific Roles

User can have different roles in different organisations:

| Organisation | Role | Access |
|--------------|------|--------|
| Acme Corp | org_admin | Full access |
| Beta Inc | org_member | Assigned projects only |

### Data Isolation

- Projects from Organisation A are never visible in Organisation B
- Team member lists are organisation-specific
- Switching organisations completely changes the data context

---

## Quick Reference

### URLs

| Page | URL | Access |
|------|-----|--------|
| Landing Page | `/` | Public |
| Login | `/login` | Public |
| Signup | `/login?mode=signup` | Public |
| Accept Invitation | `/accept-invitation/[token]` | Public |
| Create Organisation | `/onboarding/create-organisation` | Authenticated, no org |
| Onboarding Wizard | `/onboarding/wizard` | Authenticated, org admin |
| Dashboard | `/dashboard` | Authenticated |
| Organisation Members | `/admin/organisation/members` | Org Admin |

### Roles

| Role | Level | Permissions |
|------|-------|-------------|
| `org_admin` | Organisation | Full org management, see all projects |
| `org_member` | Organisation | Access assigned projects only |
| `admin` | Project | Full project management |
| `supplier_pm` | Project | Manage timesheets, expenses, team |
| `viewer` | Project | Read-only access |

---

## Troubleshooting

### "No organisation access" Error

**Cause:** User has no organisation memberships

**Solution:** 
- User should be redirected to create organisation
- Or accept a pending invitation

### Invitation Expired

**Cause:** 7-day expiry period passed

**Solution:**
- Ask organisation admin to resend invitation
- New invitation has fresh 7-day expiry

### Can't See Projects

**Cause:** User is `org_member` but not assigned to projects

**Solution:**
- Org admin must assign user to projects
- Or change user role to `org_admin`

### Verification Email Not Received

**Solutions:**
1. Check spam/junk folder
2. Verify email address was entered correctly
3. Use "Resend Verification" option on login page
4. Contact support if issue persists

---

*Document created for AMSF001 Project Tracker - December 2025*
