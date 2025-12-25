# AMSF001 Multi-Tenant SaaS Implementation Guide

> **Version:** 2.0  
> **Created:** 24 December 2025  
> **Last Updated:** 24 December 2025  
> **Purpose:** Master reference document for implementing full multi-tenancy SaaS capabilities

---

## How to Use This Document

When starting a new chat session for implementation work, point Claude to this file:

```
Please read /Users/glennnickols/Projects/amsf001-project-tracker/docs/MULTI-TENANCY-IMPLEMENTATION-GUIDE.md 
and help me with task [ID]: [description]
```

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Architecture Overview](#2-architecture-overview)
3. [Security Issues (P0 - Fix First)](#3-security-issues-p0---fix-first)
4. [Implementation Checklist](#4-implementation-checklist)
5. [Detailed Task Specifications](#5-detailed-task-specifications)
6. [Database Reference](#6-database-reference)
7. [File Locations Reference](#7-file-locations-reference)

---

## 1. Current State Assessment

### What's Working Well ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | `organisations`, `user_organisations`, `org_invitations` tables |
| RLS Policies | ✅ 147 policies | `can_access_project()` is primary helper |
| Three-Tier Roles | ✅ Working | System → Organisation → Project |
| Organisation Context | ✅ Implemented | `OrganisationContext.jsx` handles org switching |
| Invitation System | ✅ Functional | Token-based with 7-day expiry |
| Project Creation API | ✅ Org-aware | Validates org membership |
| Data Integrity | ✅ Clean | Zero orphan records (verified 24 Dec 2025) |
| **Security Hardening** | ✅ Phase 1 Complete | User queries org-filtered, API auth fixed |
| **Self-Service Orgs** | ✅ Phase 2 Complete | Signup flow, onboarding wizard, invitation UI |
| **Subscription System** | ✅ Phase 3 Complete | Tier definitions, limit checking (free unlimited) |
| **Landing Page** | ✅ Complete | Public marketing page at `/` |

### What's Remaining ⚠️

| Gap | Priority | Impact |
|-----|----------|--------|
| No billing/Stripe integration | 🟡 P2 | Revenue (not needed while free tier unlimited) |
| Organisation settings page incomplete | 🟡 P2 | UX |
| Organisation deletion flow | 🟡 P2 | Lifecycle |
| Audit logging for org events | 🟢 P3 | Compliance |

### Implementation Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Security Hardening | ✅ **Complete** | 12/15 tasks (3 manual tests pending) |
| Phase 2: Self-Service Orgs | ✅ **Complete** | 22/25 tasks (3 manual tests pending) |
| Phase 3: Subscription System | ✅ **Complete** | 17/19 tasks (2 manual tests pending) |
| Phase 4: Billing/Stripe | ⏳ Not Started | 0/15 tasks |
| Phase 5: Org Lifecycle | ⏳ Not Started | 0/? tasks |
| Phase 6: Polish & Launch | ⏳ Not Started | 0/? tasks |

---

## 2. Architecture Overview

### Three-Tier Role System

```
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM LEVEL (profiles.role)                                │
│   • admin - Full system access, can see all orgs            │
│   • viewer/contributor - Default for new users              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ ORGANISATION LEVEL (user_organisations.org_role)            │
│   • org_admin - Manage org members, projects, settings      │
│   • org_member - Access org's projects (if assigned)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PROJECT LEVEL (user_projects.role)                          │
│   • admin, supplier_pm, supplier_finance                    │
│   • customer_pm, customer_finance                           │
│   • contributor, viewer                                     │
└─────────────────────────────────────────────────────────────┘
```

### Access Control Logic (can_access_project function)

```
Access granted if ANY of:
1. User is system admin (profiles.role = 'admin')
2. User is org_admin of project's organisation
3. User has BOTH:
   - Active org membership (user_organisations.is_active = true)
   - Project membership (user_projects record exists)
```

### Data Flow

```
New visitor hits /
    ↓
Landing Page (unauthenticated) OR Dashboard (authenticated)
    ↓
User signs up (/login?mode=signup)
    ↓
Creates Organisation (/onboarding/create-organisation)
    ↓
Onboarding Wizard (/onboarding/wizard)
    ↓
Dashboard - Can invite team, create projects
    ↓
Org Admin invites to projects OR assigns to projects
    ↓
User accesses project data (filtered by RLS)
```

### Public Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `LandingPage` | Marketing page for new visitors |
| `/login` | `Login` | Sign in form |
| `/login?mode=signup` | `Login` | Sign up form (pre-selected) |
| `/accept-invitation/:token` | `AcceptInvitation` | Accept org invitation |

### Protected Routes (Onboarding)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/onboarding/create-organisation` | `CreateOrganisation` | New org setup |
| `/onboarding/wizard` | `OnboardingWizardPage` | 4-step org onboarding |

---

## 3. Security Issues (P0 - ✅ ALL FIXED)

> **Status:** All P0 security issues were fixed in Phase 1 (24 December 2025)

### Issue 1: User List Cross-Org Exposure ✅ FIXED

**Location:** `src/lib/queries.js` (new centralised helper)  
**Updated:** `src/pages/admin/ProjectManagement.jsx`, `src/pages/TeamMembers.jsx`

**Solution:** Created `getOrgMembers()` helper that filters users by organisation membership.

```javascript
// src/lib/queries.js
export async function getOrgMembers(organisationId, options = {}) {
  const { data } = await supabase
    .from('user_organisations')
    .select(`user_id, org_role, profiles:user_id (id, email, full_name)`)
    .eq('organisation_id', organisationId)
    .eq('is_active', true);
  // ... filter and return
}
```

### Issue 2: Weak API Authorization ✅ FIXED

**Location:** `api/manage-project-users.js`

**Solution:** Added `isOrgAdminForProject()` helper and updated all actions to check against the TARGET project.

### Issue 3: Missing Org Membership Validation ✅ FIXED

**Location:** `api/manage-project-users.js` + Database trigger

**Solution:** 
1. API checks user is org member before project assignment
2. Database trigger `check_user_org_membership()` prevents direct SQL bypasses

---

## 4. Implementation Checklist

### Phase 1: Security Hardening (P0 - Do First)
**Estimated: 12-16 hours**

#### 1.1 Fix User List Cross-Org Exposure
- [x] **1.1.1** Create org-filtered user query helper - `src/lib/queries.js` (new) - 30m
- [x] **1.1.2** Update ProjectManagement.jsx fetchData() - `src/pages/admin/ProjectManagement.jsx` - 30m
- [x] **1.1.3** Update TeamMembers.jsx fetchAvailableUsers() - `src/pages/TeamMembers.jsx` - 30m
- [x] **1.1.4** Add OrganisationContext import to TeamMembers - `src/pages/TeamMembers.jsx` - 15m
- [ ] **1.1.5** Test: Verify user dropdowns only show org members - Manual testing - 30m

#### 1.2 Fix API Authorization
- [x] **1.2.1** Add isOrgAdminForProject() helper - `api/manage-project-users.js` - 30m
- [x] **1.2.2** Update ADD action authorization - `api/manage-project-users.js` - 30m
- [x] **1.2.3** Update REMOVE action authorization - `api/manage-project-users.js` - 30m
- [x] **1.2.4** Update UPDATE_ROLE authorization - `api/manage-project-users.js` - 30m
- [ ] **1.2.5** Test: PM on Project A cannot manage Project B - Manual testing - 30m

#### 1.3 Add Org Membership Validation
- [x] **1.3.1** Add org check before project assignment - `api/manage-project-users.js` - 30m
- [x] **1.3.2** Return clear error when user not in org - `api/manage-project-users.js` - 15m
- [ ] **1.3.3** Test: Cannot add user without org membership - Manual testing - 30m

#### 1.4 Database Constraint
- [x] **1.4.1** Create migration file for trigger - `supabase/migrations/` - 30m
- [x] **1.4.2** Write check_user_org_membership() function - Migration file - 30m
- [x] **1.4.3** Create trigger on user_projects table - Migration file - 15m
- [x] **1.4.4** Apply migration to dev database - Supabase CLI - 15m
- [ ] **1.4.5** Test: Direct SQL insert without org membership fails - SQL Editor - 15m

---

### Phase 2: Self-Service Organisation Flow
**Estimated: 16-24 hours | Depends on: Phase 1**

#### 2.1 Signup Flow Updates
- [x] **2.1.1** Create /api/create-organisation.js endpoint - `api/` (new) - 1h
- [x] **2.1.2** Update signup handler for org creation prompt - `src/App.jsx` (ProtectedRoute) - 30m
- [x] **2.1.3** Create CreateOrganisation.jsx page - `src/pages/onboarding/` - 1h
- [x] **2.1.4** Add route /onboarding/create-organisation - `src/App.jsx` - 15m
- [ ] **2.1.5** Test: New signup creates user + prompts for org - Manual testing - 30m

#### 2.2 Onboarding Wizard
- [x] **2.2.1** Create OnboardingWizard.jsx component - `src/components/onboarding/` - 2h
- [x] **2.2.2** Create Step1OrgDetails.jsx - `src/components/onboarding/` - 45m
- [x] **2.2.3** Create Step2InviteTeam.jsx - `src/components/onboarding/` - 45m
- [x] **2.2.4** Create Step3FirstProject.jsx - `src/components/onboarding/` - 45m
- [x] **2.2.5** Create Step4Complete.jsx - `src/components/onboarding/` - 30m
- [x] **2.2.6** Add onboarding_completed to organisations.settings - Already in JSONB (no migration needed) - 15m
- [x] **2.2.7** Add route /onboarding/wizard - `src/App.jsx` - 15m
- [x] **2.2.8** Redirect new orgs to wizard if not completed - `OnboardingWizardPage.jsx` - 30m
- [ ] **2.2.9** Test: Complete onboarding flow end-to-end - Manual testing - 30m

#### 2.3 Invitation UI Completion
- [x] **2.3.1** Add pending invitations section - `src/pages/admin/OrganisationMembers.jsx` - 1h
- [x] **2.3.2** Create PendingInvitationCard.jsx - `src/components/organisation/` - 45m
- [x] **2.3.3** Add resend invitation functionality - `src/services/invitation.service.js` (already existed) - 30m
- [x] **2.3.4** Add revoke invitation functionality - `src/services/invitation.service.js` (already existed) - 30m
- [x] **2.3.5** Add copy invite link button - `OrganisationMembers.jsx` - 15m
- [x] **2.3.6** Show invitation expiry countdown - `PendingInvitationCard.jsx` - 30m
- [ ] **2.3.7** Test: Full invitation lifecycle - Manual testing - 30m

#### 2.4 SystemUsers Page Decision
- [x] **2.4.1** Add system-admin-only guard to SystemUsers route - `src/App.jsx` (already in place) - 15m
- [x] **2.4.2** Update navigation to hide SystemUsers from org admins - `Layout.jsx` (already in place) - 15m
- [x] **2.4.3** Add explanatory text about scope to admin pages - Various (already documented) - 30m

---

### Phase 3: Subscription & Limits System
**Estimated: 20-28 hours | Depends on: Phase 2**

#### 3.1 Tier Definitions
- [x] **3.1.1** Create subscriptionTiers.js - `src/lib/` (new) - 30m
- [x] **3.1.2** Define free tier (3 members, 1 project, 100MB) - `subscriptionTiers.js` - 15m
- [x] **3.1.3** Define starter tier (10 members, 5 projects, 1GB) - `subscriptionTiers.js` - 15m
- [x] **3.1.4** Define professional tier (50 members, 25 projects) - `subscriptionTiers.js` - 15m
- [x] **3.1.5** Define enterprise tier (unlimited) - `subscriptionTiers.js` - 15m
- [x] **3.1.6** Define feature flags per tier - `subscriptionTiers.js` - 30m

#### 3.2 Subscription Service
- [x] **3.2.1** Create subscription.service.js - `src/services/` (new) - 30m
- [x] **3.2.2** Implement checkLimit(orgId, limitType) - `subscription.service.js` - 45m
- [x] **3.2.3** Implement getMemberCount(orgId) - `subscription.service.js` - 30m
- [x] **3.2.4** Implement getProjectCount(orgId) - `subscription.service.js` - 30m
- [x] **3.2.5** Implement hasFeature(orgId, feature) - `subscription.service.js` - 30m
- [x] **3.2.6** Add getCurrentUsage(orgId) for dashboard - `subscription.service.js` - 30m
- [ ] **3.2.7** Test: Limit checks return correct values - Unit tests - 30m

#### 3.3 Enforce Limits
- [x] **3.3.1** Add limit check to /api/create-project.js - `api/create-project.js` - 30m
- [x] **3.3.2** Add limit check to organisation.service.addMember() - `organisation.service.js` - 30m
- [x] **3.3.3** Add limit check to invitation.service.createInvitation() - `invitation.service.js` - 30m
- [x] **3.3.4** Return structured error with upgrade prompt - All limit locations - 30m
- [ ] **3.3.5** Test: Cannot exceed limits for each tier - Manual testing - 45m

#### 3.4 Upgrade Prompts UI
- [x] **3.4.1** Create UpgradePrompt.jsx component - `src/components/common/` - 45m
- [x] **3.4.2** Create UsageMeter.jsx component - `src/components/common/` - 30m
- [x] **3.4.3** Add usage display to organisation dashboard - `Dashboard.jsx` + `OrganisationUsageWidget.jsx` - 30m
- [x] **3.4.4** Show upgrade prompt when limit reached - Integrated in OrganisationUsageWidget - 30m

---

### Phase 4: Billing & Stripe Integration
**Estimated: 16-24 hours | Depends on: Phase 3**

#### 4.1 Database Updates
- [ ] **4.1.1** Create migration for Stripe columns - `supabase/migrations/` - 15m
- [ ] **4.1.2** Add stripe_customer_id column - Migration file - 10m
- [ ] **4.1.3** Add stripe_subscription_id column - Migration file - 10m
- [ ] **4.1.4** Add subscription_status column - Migration file - 10m
- [ ] **4.1.5** Apply migration to database - Supabase CLI - 15m

#### 4.2 Stripe Account Setup
- [ ] **4.2.1** Create Stripe account (if needed) - Stripe Dashboard - 15m
- [ ] **4.2.2** Create products for each tier - Stripe Dashboard - 30m
- [ ] **4.2.3** Create monthly prices - Stripe Dashboard - 15m
- [ ] **4.2.4** Create annual prices (optional) - Stripe Dashboard - 15m
- [ ] **4.2.5** Store API keys in environment variables - `.env` files - 15m

#### 4.3 Stripe API Endpoints
- [ ] **4.3.1** Create create-checkout-session.js - `api/stripe/` (new) - 1h
- [ ] **4.3.2** Create create-portal-session.js - `api/stripe/` - 45m
- [ ] **4.3.3** Create webhook.js - `api/stripe/` - 1.5h
- [ ] **4.3.4** Handle checkout.session.completed - `webhook.js` - 30m
- [ ] **4.3.5** Handle subscription.updated - `webhook.js` - 30m
- [ ] **4.3.6** Handle subscription.deleted - `webhook.js` - 30m
- [ ] **4.3.7** Configure webhook endpoint in Stripe - Stripe Dashboard - 15m

#### 4.4 Billing UI
- [ ] **4.4.1** Create Billing.jsx page - `src/pages/admin/` - 2h
- [ ] **4.4.2** Show current plan and usage - `Billing.jsx` - 30m
- [ ] **4.4.3** Add plan comparison/upgrade buttons - `Billing.jsx` - 45m
- [ ] **4.4.4** Add manage subscription button - `Billing.jsx` - 30m
- [ ] **4.4.5** Add route /admin/billing - `src/App.jsx` - 15m
- [ ] **4.4.6** Add Billing link to admin navigation - `Sidebar.jsx` - 15m
- [ ] **4.4.7** Test: Complete upgrade flow with test cards - Manual testing - 45m

---

### Phase 5: Organisation Lifecycle
**Estimated: 12-16 hours | Depends on: Phase 2**

#### 5.1 Organisation Settings Page
- [ ] **5.1.1** Create OrganisationSettings.jsx page - `src/pages/admin/` - 1h
- [ ] **5.1.2** Add General section (name, slug, description) - `OrganisationSettings.jsx` - 45m
- [ ] **5.1.3** Add Branding section (logo, primary color) - `OrganisationSettings.jsx` - 1h
- [ ] **5.1.4** Add organisation.service.updateSettings() - `organisation.service.js` - 30m
- [ ] **5.1.5** Add route /admin/organisation/settings - `src/App.jsx` - 15m
- [ ] **5.1.6** Add Settings link to admin navigation - `Sidebar.jsx` - 15m

#### 5.2 Organisation Deletion
- [ ] **5.2.1** Add Danger Zone section - `OrganisationSettings.jsx` - 30m
- [ ] **5.2.2** Create DeleteOrganisationModal.jsx - `src/components/` - 45m
- [ ] **5.2.3** Add organisation.service.requestDeletion() - `organisation.service.js` - 45m
- [ ] **5.2.4** Set 30-day grace period - `organisation.service.js` - 30m
- [ ] **5.2.5** Create data export function - `organisation.service.js` - 1h
- [ ] **5.2.6** Send notification emails to members - Email service - 45m
- [ ] **5.2.7** Add cancel deletion option - `OrganisationSettings.jsx` - 30m
- [ ] **5.2.8** Test: Full deletion flow - Manual testing - 30m

---

### Phase 6: Polish & Launch Prep
**Estimated: 8-12 hours | Depends on: All phases**

#### 6.1 Audit Logging
- [ ] **6.1.1** Extend audit_log for org events - Database migration - 30m
- [ ] **6.1.2** Add logging to organisation.service - `organisation.service.js` - 45m
- [ ] **6.1.3** Add logging to invitation.service - `invitation.service.js` - 30m
- [ ] **6.1.4** Add logging to subscription changes - Stripe webhook - 30m

#### 6.2 Organisation Switching
- [ ] **6.2.1** Add org switcher dropdown to header - `Header.jsx` - 45m
- [ ] **6.2.2** Show org logo/name in switcher - `Header.jsx` - 30m
- [ ] **6.2.3** Add 'Create new organisation' option - `Header.jsx` - 30m
- [ ] **6.2.4** Remember last org in localStorage - `OrganisationContext.jsx` - 30m

#### 6.3 Documentation & Legal
- [ ] **6.3.1** Create Terms of Service page - `src/pages/legal/` - 30m
- [ ] **6.3.2** Create Privacy Policy page - `src/pages/legal/` - 30m
- [ ] **6.3.3** Add legal links to footer - Footer component - 15m
- [ ] **6.3.4** Update TECH-SPEC-02 with missing columns - `docs/TECH-SPEC-02.md` - 30m

#### 6.4 Final Testing
- [ ] **6.4.1** E2E: Signup → org creation → onboarding - Manual testing - 30m
- [ ] **6.4.2** E2E: Invite user → accept → access project - Manual testing - 30m
- [ ] **6.4.3** E2E: Hit limit → upgrade → continue - Manual testing - 30m
- [ ] **6.4.4** Cross-org isolation test - Manual testing - 45m
- [ ] **6.4.5** Run orphan check query (expect 0 rows) - SQL Editor - 15m
- [ ] **6.4.6** Performance test with realistic data - Manual testing - 30m

---

## 5. Detailed Task Specifications

### Task 1.1.1: Create Org-Filtered User Query Helper

**File:** `src/lib/queries.js` (create new file)

```javascript
import { supabase } from './supabase';

/**
 * Get users who are members of a specific organisation
 * @param {string} organisationId - The organisation UUID
 * @param {Object} options - Query options
 * @param {boolean} options.includeTestUsers - Include test users (default: true)
 * @param {string[]} options.excludeUserIds - User IDs to exclude
 * @returns {Promise<Array>} Array of user objects
 */
export async function getOrgMembers(organisationId, options = {}) {
  const { includeTestUsers = true, excludeUserIds = [] } = options;

  const { data, error } = await supabase
    .from('user_organisations')
    .select(`
      user_id,
      org_role,
      profiles:user_id (
        id,
        email,
        full_name,
        is_test_user
      )
    `)
    .eq('organisation_id', organisationId)
    .eq('is_active', true);

  if (error) throw error;

  let users = (data || [])
    .filter(m => m.profiles)
    .map(m => ({
      id: m.profiles.id,
      email: m.profiles.email,
      full_name: m.profiles.full_name,
      is_test_user: m.profiles.is_test_user,
      org_role: m.org_role
    }));

  // Filter test users if needed
  if (!includeTestUsers) {
    users = users.filter(u => !u.is_test_user);
  }

  // Exclude specific users
  if (excludeUserIds.length > 0) {
    users = users.filter(u => !excludeUserIds.includes(u.id));
  }

  return users;
}
```

### Task 2.1.1: Create Organisation API

**File:** `api/create-organisation.js`

```javascript
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { name, slug, description, adminToken } = await req.json();

  if (!name) {
    return new Response(JSON.stringify({ error: 'Organisation name is required' }), { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser(adminToken);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Generate slug if not provided
  const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('organisations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ error: 'Organisation slug already exists' }), { status: 409 });
  }

  // Create organisation
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({
      name,
      slug: orgSlug,
      description: description || null,
      subscription_tier: 'free',
      is_active: true,
      settings: { onboarding_completed: false }
    })
    .select()
    .single();

  if (orgError) {
    return new Response(JSON.stringify({ error: orgError.message }), { status: 500 });
  }

  // Add creator as org_admin
  const { error: memberError } = await supabase
    .from('user_organisations')
    .insert({
      user_id: user.id,
      organisation_id: org.id,
      org_role: 'org_admin',
      is_active: true,
      is_default: true
    });

  if (memberError) {
    // Rollback org creation
    await supabase.from('organisations').delete().eq('id', org.id);
    return new Response(JSON.stringify({ error: memberError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, organisation: org }), { status: 200 });
}
```

### Task 1.4.1-1.4.3: Database Migration for Org Membership Constraint

**File:** `supabase/migrations/YYYYMMDD_add_org_membership_constraint.sql`

```sql
-- Function to check org membership before allowing project assignment
CREATE OR REPLACE FUNCTION check_user_org_membership()
RETURNS TRIGGER AS $$
DECLARE
  project_org_id UUID;
BEGIN
  -- Get the project's organisation
  SELECT organisation_id INTO project_org_id
  FROM projects
  WHERE id = NEW.project_id;

  -- If project has no organisation, allow (legacy support)
  IF project_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user is an active member of the organisation
  IF NOT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = NEW.user_id
    AND organisation_id = project_org_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User must be an active organisation member before being assigned to a project';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_projects
DROP TRIGGER IF EXISTS ensure_org_membership ON user_projects;
CREATE TRIGGER ensure_org_membership
  BEFORE INSERT ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION check_user_org_membership();

-- Add comment
COMMENT ON FUNCTION check_user_org_membership() IS 
  'Ensures user is an org member before allowing project assignment. Added for multi-tenancy security.';
```

---

## 6. Database Reference

### Core Tables

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `organisations` | id, name, slug, subscription_tier, settings, is_active | Organisation records |
| `user_organisations` | user_id, organisation_id, org_role, is_active, is_default | Org membership |
| `org_invitations` | email, organisation_id, token, org_role, status, expires_at | Pending invites |
| `projects` | id, name, reference, organisation_id | Projects (org-scoped) |
| `user_projects` | user_id, project_id, role, is_default | Project membership |
| `profiles` | id, email, role, full_name | User profiles |

### Key RLS Helper Functions

| Function | Purpose |
|----------|---------|
| `is_system_admin()` | Check if user is system admin |
| `is_org_member(org_id)` | Check if user is member of org |
| `is_org_admin(org_id)` | Check if user is admin of org |
| `can_access_project(project_id)` | Primary access check for all project data |

### Subscription Tiers (To Be Implemented)

| Tier | Members | Projects | Storage | Price |
|------|---------|----------|---------|-------|
| Free | 3 | 1 | 100 MB | $0 |
| Starter | 10 | 5 | 1 GB | $29/mo |
| Professional | 50 | 25 | 10 GB | $99/mo |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

---

## 7. File Locations Reference

### Services
- `src/services/organisation.service.js` - Organisation CRUD operations
- `src/services/invitation.service.js` - Invitation management
- `src/services/subscription.service.js` - Subscription limits (to create)

### Contexts
- `src/contexts/AuthContext.jsx` - Authentication state
- `src/contexts/OrganisationContext.jsx` - Current organisation state
- `src/contexts/ProjectContext.jsx` - Current project state

### API Endpoints
- `api/create-project.js` - Project creation (org-aware)
- `api/manage-project-users.js` - User assignment (needs fixes)
- `api/create-organisation.js` - Org creation (to create)
- `api/stripe/` - Stripe endpoints (to create)

### Admin Pages
- `src/pages/admin/ProjectManagement.jsx` - Project management (needs fix)
- `src/pages/admin/OrganisationMembers.jsx` - Org member management
- `src/pages/admin/SystemUsers.jsx` - System-wide user management
- `src/pages/TeamMembers.jsx` - Project team management (needs fix)

### Documentation
- `docs/TECH-SPEC-02-Database-Schema.md` - Database schema spec
- `docs/TECH-SPEC-05-RLS-Security.md` - RLS policy documentation

---

## Progress Tracking

**Last Updated:** 24 December 2025

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Security | 🔴 Not Started | 0/18 tasks |
| Phase 2: Self-Service | 🔴 Not Started | 0/22 tasks |
| Phase 3: Subscriptions | 🔴 Not Started | 0/19 tasks |
| Phase 4: Billing | 🔴 Not Started | 0/16 tasks |
| Phase 5: Org Lifecycle | 🔴 Not Started | 0/14 tasks |
| Phase 6: Launch Prep | 🔴 Not Started | 0/12 tasks |

**Total: 0/101 tasks complete**

---

## Verification Queries

### Orphan Check (Run Periodically)
```sql
-- Should return 0 rows
SELECT up.user_id, p.name as project_name, o.name as org_name
FROM user_projects up
JOIN projects p ON p.id = up.project_id
LEFT JOIN organisations o ON o.id = p.organisation_id
WHERE p.organisation_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_organisations uo 
  WHERE uo.user_id = up.user_id 
  AND uo.organisation_id = p.organisation_id
  AND uo.is_active = true
);
```

### Check RLS Policy Count
```sql
SELECT COUNT(*) as policy_count FROM pg_policies;
-- Expected: 147 policies
```

---

*End of Implementation Guide*
