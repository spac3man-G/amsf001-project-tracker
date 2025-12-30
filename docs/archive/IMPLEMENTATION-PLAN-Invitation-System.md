# Implementation Plan: Organisation Invitation System

**Created:** 24 December 2025
**Completed:** 24 December 2025
**Status:** ✅ Complete
**Actual Time:** ~2.5 hours

---

## Overview

Create a custom invitation system that allows System Admins to invite users who don't yet have accounts. When creating an organisation, if the admin email doesn't exist, an invitation is created and emailed. The invitee clicks a link, creates their account, and is automatically assigned as org admin.

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ SYSTEM ADMIN creates org with admin email                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Does user exist in profiles?  │
                    └───────────────────────────────┘
                         │                    │
                        YES                   NO
                         │                    │
                         ▼                    ▼
              ┌──────────────────┐  ┌──────────────────────────────┐
              │ Assign as admin  │  │ Create invitation record     │
              │ (current flow)   │  │ Generate secure token        │
              └──────────────────┘  │ Send invitation email        │
                                    └──────────────────────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │ Invitee receives email       │
                                    │ Clicks magic link            │
                                    └──────────────────────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │ /accept-invite?token=xxx     │
                                    │ Shows signup form            │
                                    │ Pre-filled email (read-only) │
                                    └──────────────────────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │ User sets password & name    │
                                    │ Account created              │
                                    │ Invitation consumed          │
                                    │ Auto-assigned as org admin   │
                                    │ Redirected to dashboard      │
                                    └──────────────────────────────┘
```

---

## Database Schema

### New Table: `org_invitations`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organisation_id | uuid | FK to organisations |
| email | text | Invitee email (lowercase) |
| org_role | text | Role to assign (org_admin, org_member) |
| token | text | Secure random token (64 chars) |
| invited_by | uuid | FK to profiles (who sent invite) |
| invited_at | timestamptz | When invitation was created |
| expires_at | timestamptz | Token expiry (default: 7 days) |
| accepted_at | timestamptz | When invitation was accepted (null if pending) |
| status | text | pending, accepted, expired, revoked |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Record update |

---

## Implementation Segments

### Segment 1: Database Setup (20 min)
- [ ] Create migration for `org_invitations` table
- [ ] Add indexes (token, email, organisation_id)
- [ ] Add RLS policies
- [ ] Add helper function `get_invitation_by_token()`
- [ ] Apply migration

**Files:**
- `supabase/migrations/202512241000_create_org_invitations.sql`

---

### Segment 2: Invitation Service (25 min)
- [ ] Create `invitation.service.js`
- [ ] `createInvitation(orgId, email, role, invitedBy)` - creates record + token
- [ ] `getInvitationByToken(token)` - validates and returns invitation
- [ ] `acceptInvitation(token, userId)` - marks accepted, creates user_organisations
- [ ] `revokeInvitation(invitationId)` - cancels pending invitation
- [ ] `listPendingInvitations(orgId)` - for admin view
- [ ] Export from services index

**Files:**
- `src/services/invitation.service.js`
- `src/services/index.js` (update)

---

### Segment 3: Email Service Setup (30 min)
- [ ] Choose email provider (Resend, SendGrid, or Supabase Edge Function)
- [ ] Create `email.service.js`
- [ ] `sendInvitationEmail(email, inviterName, orgName, acceptUrl)` 
- [ ] Create email template (HTML + text)
- [ ] Add environment variables for email API key
- [ ] Test email sending

**Files:**
- `src/services/email.service.js`
- `src/lib/emailTemplates.js`
- `.env` (add email API key)

**Note:** For MVP, could use Supabase Edge Function with Resend (free tier: 100 emails/day)

---

### Segment 4: Accept Invitation Page (30 min)
- [ ] Create `/accept-invite` route
- [ ] Create `AcceptInvitation.jsx` page
- [ ] Validate token on page load
- [ ] Show invitation details (org name, role, inviter)
- [ ] Show signup form (email pre-filled, read-only)
- [ ] Handle form submission:
  - Create Supabase auth user
  - Update profile with name
  - Call `acceptInvitation()` service
  - Redirect to dashboard

**Files:**
- `src/pages/AcceptInvitation.jsx`
- `src/App.jsx` (add route)

---

### Segment 5: Update Create Organisation Flow (20 min)
- [ ] Modify `SystemAdmin.jsx` create flow
- [ ] If user exists → current behavior (direct assign)
- [ ] If user doesn't exist → create invitation + send email
- [ ] Show appropriate success message
- [ ] Update UI to show "Invitation sent" vs "Admin assigned"

**Files:**
- `src/pages/admin/SystemAdmin.jsx`

---

### Segment 6: Pending Invitations UI (25 min)
- [ ] Add "Pending Invitations" section to SystemAdmin page
- [ ] List invitations with: email, org, status, invited date, expires
- [ ] Add "Resend" button (creates new token, sends email)
- [ ] Add "Revoke" button (cancels invitation)
- [ ] Show invitation status in org details

**Files:**
- `src/pages/admin/SystemAdmin.jsx`

---

### Segment 7: Org Members Invitation (20 min)
- [ ] Update `OrganisationMembers.jsx` to use invitation flow
- [ ] When inviting member who doesn't exist → create invitation
- [ ] Show pending invitations in members list
- [ ] Allow resend/revoke from members page

**Files:**
- `src/pages/admin/OrganisationMembers.jsx`

---

### Segment 8: Testing & Polish (20 min)
- [ ] Test full flow: create org → invite → accept → login
- [ ] Test edge cases:
  - Expired token
  - Already used token
  - User already exists
  - Revoked invitation
- [ ] Add loading states
- [ ] Add error handling
- [ ] Update addendum documentation

**Files:**
- `docs/ADDENDUM-Role-Simplification.md`
- Various test files if needed

---

## Email Template Preview

```
Subject: You've been invited to join {Organisation Name}

Hi there,

{Inviter Name} has invited you to join {Organisation Name} on AMSF Project Tracker
as an {Role}.

Click the button below to create your account and get started:

[Accept Invitation]

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
AMSF Project Tracker
```

---

## Environment Variables Needed

```env
# Email Service (Resend recommended - free tier)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Or SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# App URL (for invitation links)
VITE_APP_URL=https://amsf001-project-tracker.vercel.app
```

---

## Security Considerations

1. **Token Security**
   - 64-character cryptographically random token
   - Tokens expire after 7 days
   - Single-use (marked as accepted after use)
   - Can be revoked by admin

2. **RLS Policies**
   - System admin can see all invitations
   - Org admin can see invitations for their org
   - Public can validate token (for accept page)
   - Only authenticated can create invitations

3. **Rate Limiting**
   - Consider limiting invitations per org per day
   - Consider limiting resend frequency

---

## Dependencies to Add

```bash
# If using Resend for email
npm install resend

# Or if using SendGrid
npm install @sendgrid/mail

# For generating secure tokens
npm install nanoid
# (or use crypto.randomUUID() which is built-in)
```

---

## Order of Implementation

Recommended order for incremental progress:

1. **Segment 1** - Database (foundation)
2. **Segment 2** - Invitation Service (core logic)
3. **Segment 4** - Accept Page (enables testing)
4. **Segment 3** - Email Service (enables full flow)
5. **Segment 5** - Update Create Org (main use case)
6. **Segment 6** - Pending Invitations UI (admin visibility)
7. **Segment 7** - Org Members (extend to members)
8. **Segment 8** - Testing & Polish

---

## Alternatives Considered

### Supabase Auth Invite
- Pros: Built-in, sends email automatically
- Cons: Requires service role key (security risk if in browser), less control over UX

### Magic Link Only
- Pros: No password needed
- Cons: Less familiar to users, requires email for every login

### Manual Account Creation
- Pros: Simplest
- Cons: Poor UX, admin needs to communicate credentials

**Decision:** Custom invitation system provides best balance of security, UX, and control.

---

## Checklist Summary

- [x] Segment 1: Database Setup
- [x] Segment 2: Invitation Service
- [x] Segment 3: Email Service Setup
- [x] Segment 4: Accept Invitation Page
- [x] Segment 5: Update Create Organisation Flow
- [x] Segment 6: Pending Invitations UI
- [x] Segment 7: Org Members Invitation
- [x] Segment 8: Testing & Polish

---

## Notes

- MVP can skip Segment 6 & 7 initially (add pending invitations UI later)
- Email service is the main external dependency - Resend is recommended for simplicity
- Consider Supabase Edge Functions if you want to keep email API key server-side

---

## Implementation Summary

### Git Commits

| Commit | Description |
|--------|-------------|
| `27633b58` | db: Create org_invitations table for invitation system |
| `fdab49bf` | feat: Add invitation service for org invitations |
| `c3337783` | feat: Add Accept Invitation page |
| `ec066e58` | feat: Add email service with Supabase Edge Function + Resend |
| `85f1d6f6` | feat: Update Create Organisation to support invitations |
| `fbe85cda` | feat: Add Pending Invitations UI to System Admin |
| `22177e58` | feat: Add invitation support to Org Members page |

### Files Created

**Database:**
- `supabase/migrations/202512241000_create_org_invitations.sql`

**Backend Services:**
- `src/services/invitation.service.js`
- `src/services/email.service.js`
- `supabase/functions/send-invitation/index.ts`

**Frontend Pages:**
- `src/pages/AcceptInvitation.jsx`

### Files Modified

- `src/App.jsx` - Added `/accept-invite` route
- `src/services/index.js` - Export invitation and email services
- `src/pages/admin/SystemAdmin.jsx` - Invitation flow + pending invitations UI
- `src/pages/admin/OrganisationMembers.jsx` - Invitation flow for members

### External Services Configured

- **Resend:** Email delivery (noreply@progressive.gg)
- **Supabase Edge Function:** `send-invitation` with RESEND_API_KEY secret

### Key Features Delivered

1. **Invitation Creation** - System admin or org admin can invite users by email
2. **Email Delivery** - HTML-formatted invitation emails via Resend
3. **Accept Invitation Page** - Users create account and auto-join org
4. **Pending Invitations Management** - View, resend, revoke invitations
5. **Graceful Fallbacks** - Shows link if email fails to send

