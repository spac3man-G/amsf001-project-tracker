# Documentation Addendum: December 2025 Updates

**Created:** 24 December 2025
**Last Updated:** 24 December 2025
**Status:** In Progress
**Purpose:** Track all documentation updates from December 2025 development work

---

## Overview

This addendum consolidates all documentation updates required following the December 2025 development sprint. It serves as a guide for updating the main documentation suite once all changes are stable and tested.

**Key Changes:**
1. Organisation Role Simplification (3 → 2 roles)
2. System Admin Page for Organisation Management
3. Organisation Invitation System with Email

---

## Table of Contents

1. [Organisation Role Simplification](#1-organisation-role-simplification)
2. [System Admin Page](#2-system-admin-page)
3. [Invitation System](#3-invitation-system)
4. [Email Service](#4-email-service)
5. [Documents Requiring Updates](#5-documents-requiring-updates)
6. [Database Changes](#6-database-changes)
7. [New Files Created](#7-new-files-created)
8. [Git Commits](#8-git-commits)
9. [Outstanding Items](#9-outstanding-items)

---

## 1. Organisation Role Simplification

**Date:** 23 December 2025

### Summary
Simplified organisation roles from 3 to 2:

| Before | After |
|--------|-------|
| `org_owner` - Full control | `org_admin` - Full control |
| `org_admin` - Manage members/settings | `org_member` - Access projects |
| `org_member` - Access projects | |

### Rationale
- Simpler mental model
- Reduced code complexity  
- No ownership transfer needed
- Multiple admins with equal privileges
- System admin handles org creation

### Migration
- `202512231600_simplify_org_roles.sql`
- All `org_owner` → `org_admin`
- `is_org_owner()` function dropped

### Code Changes
- `permissionMatrix.js` - 2 roles only
- `OrganisationContext.jsx` - Updated context
- `OrganisationMembers.jsx` - Simplified UI
- `organisation.service.js` - Updated methods
- Tests reduced: 118 → 95

---

## 2. System Admin Page

**Date:** 23-24 December 2025
**Route:** `/admin/system`

### Features
- List all organisations with stats (members, admins)
- Create new organisations
- Assign initial admin (existing user or invitation)
- View pending invitations
- Resend/revoke invitations

### Access Control
- Only users with `is_system_admin = true` in profiles
- Protected route with `adminOnly` flag
- Navigation link conditionally shown

### Files
- `src/pages/admin/SystemAdmin.jsx`
- `src/App.jsx` - Route added
- `src/lib/navigation.js` - Nav item added
- `src/components/Layout.jsx` - Conditional link

---

## 3. Invitation System

**Date:** 24 December 2025

### Overview
Custom invitation system for inviting users who don't yet have accounts.

### User Flow
```
Admin creates org/invites member with email
        ↓
User exists? ──YES──→ Add directly as member
        │
        NO
        ↓
Create invitation record
        ↓
Send invitation email
        ↓
User clicks link → /accept-invite?token=xxx
        ↓
User creates account (name + password)
        ↓
Invitation accepted → user_organisations record created
        ↓
Redirect to dashboard
```

### Database Table: `org_invitations`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organisation_id | uuid | FK to organisations |
| email | text | Invitee email |
| org_role | text | Role to assign |
| token | text | 64-char secure token |
| invited_by | uuid | FK to profiles |
| invited_at | timestamptz | When invited |
| expires_at | timestamptz | Token expiry (7 days) |
| accepted_at | timestamptz | When accepted |
| status | text | pending/accepted/expired/revoked |

### Database Functions
- `get_invitation_by_token(token)` - Retrieve valid invitation
- `accept_invitation(token, user_id)` - Accept and create membership

### Service Methods (invitation.service.js)
- `createInvitation()` - Create invite with token
- `getInvitationByToken()` - Validate token
- `acceptInvitation()` - Complete invitation
- `revokeInvitation()` - Cancel invitation
- `resendInvitation()` - New token + extend expiry
- `listPendingInvitations()` - List for org
- `getAcceptUrl()` - Build invitation link

### Accept Invitation Page
- Route: `/accept-invite?token=xxx`
- Validates token on load
- Shows org name, role, inviter
- Signup form (email pre-filled, read-only)
- Creates Supabase auth account
- Accepts invitation
- Redirects to dashboard

---

## 4. Email Service

**Date:** 24 December 2025

### Provider
- **Resend** (resend.com)
- Domain: `progressive.gg`
- From: `noreply@progressive.gg`
- Region: Ireland (eu-west-1)

### Implementation
- Supabase Edge Function: `send-invitation`
- API key stored as Supabase secret: `RESEND_API_KEY`
- Frontend service: `email.service.js`

### Email Template
HTML-formatted invitation email with:
- Organisation name and display name
- Role being assigned
- Inviter name
- Accept button with link
- 7-day expiry notice
- Plain text fallback

---

## 5. Documents Requiring Updates

### TECH-SPEC-02-Database-Core.md
- [x] Update `user_organisations.org_role` constraint (3→2 roles)
- [x] Update Section 3.3 Organisation Role Values
- [x] Remove `org_owner` role references
- [ ] Add `org_invitations` table documentation
- [ ] Document `get_invitation_by_token()` function
- [ ] Document `accept_invitation()` function

### TECH-SPEC-05-RLS-Security.md
- [x] Update RLS policies for 2-role model
- [x] Update access hierarchy diagram
- [x] Remove `is_org_owner()` documentation
- [x] Document can_access_project() as primary helper (33 policies)
- [ ] Add `org_invitations` RLS policies
- [ ] Add public token validation policy

### TECH-SPEC-07-Frontend-State.md
- [x] Update ViewAsContext v3.0 (org admin hierarchy)
- [x] Update usePermissions v5.0 (isOrgLevelAdmin export)
- [x] Update Role Resolution Flow diagram
- [ ] Add invitation service documentation
- [ ] Add email service documentation

### TECH-SPEC-08-Services.md
- [ ] Update OrganisationService (2-role model)
- [ ] Add InvitationService documentation
- [ ] Add EmailService documentation

### TECH-SPEC-09-Testing-Infrastructure.md
- [ ] Update test count (118 → 95)
- [ ] Document invitation system tests (if added)

### AMSF001-Technical-Specification.md
- [ ] Update organisation roles section
- [ ] Add invitation system overview
- [ ] Add email integration section

---

## 6. Database Changes

### Migrations Applied

| Migration | Description |
|-----------|-------------|
| `202512231600_simplify_org_roles.sql` | Simplify org roles 3→2 |
| `202512241000_create_org_invitations.sql` | Create invitation system |

### Functions Changed/Added

| Function | Change |
|----------|--------|
| `is_org_owner()` | **DROPPED** |
| `is_org_admin()` | Updated - checks single role |
| `can_access_project()` | Updated - uses org_admin |
| `can_manage_project()` | Updated - uses org_admin |
| `get_invitation_by_token()` | **NEW** |
| `accept_invitation()` | **NEW** |

### Tables Changed/Added

| Table | Change |
|-------|--------|
| `user_organisations` | CHECK constraint updated |
| `org_invitations` | **NEW** |

---

## 7. New Files Created

### Database
- `supabase/migrations/202512231600_simplify_org_roles.sql`
- `supabase/migrations/202512241000_create_org_invitations.sql`

### Supabase Functions
- `supabase/functions/send-invitation/index.ts`

### Frontend Pages
- `src/pages/admin/SystemAdmin.jsx`
- `src/pages/AcceptInvitation.jsx`

### Services
- `src/services/invitation.service.js`
- `src/services/email.service.js`

### Documentation
- `docs/ADDENDUM-Role-Simplification.md`
- `docs/ADDENDUM-December-2025.md` (this file)
- `docs/IMPLEMENTATION-PLAN-Invitation-System.md`

---

## 8. Git Commits

### Role Simplification (23 Dec 2025)
| Commit | Description |
|--------|-------------|
| `c7282edf` | db: Simplify org roles (3→2) - migration |
| `6cb8a86e` | refactor: Simplify org roles in permission matrix |
| `5165cbe9` | test: Update org-permissions tests for 2-role model |
| `1227aad2` | refactor: Update frontend components for 2-role model |

### System Admin & Invitations (24 Dec 2025)
| Commit | Description |
|--------|-------------|
| `4940531e` | feat: Add System Admin page for organisation management |
| `5a0a5b7f` | fix: Simplify SystemAdmin query to avoid RLS issues |
| `8f07203c` | docs: Add implementation plan for invitation system |
| `27633b58` | db: Create org_invitations table for invitation system |
| `fdab49bf` | feat: Add invitation service for org invitations |
| `c3337783` | feat: Add Accept Invitation page |
| `ec066e58` | feat: Add email service with Supabase Edge Function + Resend |
| `85f1d6f6` | feat: Update Create Organisation to support invitations |
| `fbe85cda` | feat: Add Pending Invitations UI to System Admin |
| `22177e58` | feat: Add invitation support to Org Members page |

---

## 9. Outstanding Items

### Testing Required
- [ ] Create organisation with existing user
- [ ] Create organisation with new user (invitation)
- [ ] Accept invitation flow end-to-end
- [ ] Email delivery verification
- [ ] Resend invitation
- [ ] Revoke invitation
- [ ] Expired token handling
- [ ] Org Members page invitation flow

### Future Enhancements
- [ ] Edit organisation (name, settings)
- [ ] Deactivate/delete organisation
- [ ] System-wide user management
- [ ] Invitation expiry cleanup job
- [ ] Email notification preferences
- [ ] Bulk invitation import (CSV)

### Documentation
- [ ] Update all tech specs listed above
- [ ] Create user guide for invitation flow
- [ ] Update API documentation

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 24 Dec 2025 | 1.0 | Initial addendum - consolidated all December changes |

---

## Related Documents

- `docs/ADDENDUM-Role-Simplification.md` - Detailed role simplification notes
- `docs/IMPLEMENTATION-PLAN-Invitation-System.md` - Invitation implementation plan
