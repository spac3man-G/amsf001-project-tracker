# UAT Discoveries Summary

> **Project:** Tracker by Progressive
> **UAT Version:** 1.0
> **Created:** 17 January 2026
> **Last Updated:** 18 January 2026
> **Total Discoveries:** 16

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| **New Features Discovered** | 0 | - |
| **Documentation Updates Required** | 4 | 4 Pending |
| **Improvement Suggestions** | 12 | 10 Backlog, 1 Under Review, 1 Requires Workshop |
| **Total Discoveries** | 16 | - |

---

## New Features Discovered

Features observed during UAT that are not documented in the User Manual.

| ID | Feature Description | Location | Found At | Priority | Status | Notes |
|----|---------------------|----------|----------|----------|--------|-------|
| NF-001 | _Example: New filter option on Deliverables page_ | _Deliverables > Filters_ | _UAT-05-03-002_ | _Medium_ | _Pending_ | _Needs documentation_ |

---

## Documentation Updates Required

Instances where application behavior differs from what is documented in the User Manual.

| ID | Change Description | Current Documented | Actual Behavior | Manual Section | Status | Notes |
|----|-------------------|-------------------|-----------------|----------------|--------|-------|
| DC-001 | Search bar doesn't exist | "Search bar in top navigation" | No dedicated search bar - search via AI Chat Assistant only | Chapter 1.3 | Pending | Found at UAT-01-03-002 |
| DC-002 | Logo doesn't exist | "Logo - Click to return to Dashboard" in header bar | No logo in header - no click-to-return-to-dashboard element | Chapter 1.3 | Pending | Found at UAT-01-03-003 |
| DC-003 | Breadcrumbs don't exist | "Breadcrumbs show where you are: Home > Milestones > Phase 1" | No breadcrumb navigation - detail panels slide out from right side | Chapter 1.3 | Pending | Found at UAT-01-03-005 |
| DC-004 | Logo upload not available on org creation | "Upload a logo image when creating organisation" | Create Organisation modal only has Name and URL Slug fields - no logo upload option | Chapter 2.1 | Pending | Found at UAT-02-01-001 |

---

## Improvement Suggestions

Enhancement ideas and UX improvements identified during testing.

| ID | Suggestion | Current State | Proposed Enhancement | Priority | Status | Notes |
|----|------------|---------------|---------------------|----------|--------|-------|
| IS-001 | Cross-project landing page | Login takes user directly to default project dashboard | Add a landing page after login that shows relevant information from all projects the user is associated with, before they select a specific project | Medium | Backlog | Found at UAT-01-01-001 |
| IS-002 | Invite-only explanation on login page | Login page has no explanation about access | Add messaging explaining Tracker is invite-only and to contact the relevant project manager for access if users have issues | Low | Backlog | Found at UAT-01-01-002 |
| IS-003 | Community section with shared templates | No community/template sharing exists | Community section with FAQs, shared templates (plan templates, CR templates, workflow templates) shareable across projects and organisations | Low | Backlog | Found at UAT-01-01-002 |
| IS-004 | Customisable dashboard | Dashboard is fixed layout | PM can use/create templates; users can customise preferences; hybrid mandatory + customisable areas; role-based dashboard templates | Medium | Backlog | Found at UAT-01-01-003 |
| IS-005 | AI feature controls in Project Settings | AI features always enabled | PM can enable/disable AI per project (save costs/reduce complexity); granular control for subset of AI features | Medium | Backlog | Found at UAT-01-01-004 |
| IS-006 | Roles and Permissions Review | Current 6-role system | **RUNNING NOTE** - See notes below | Medium | Under Review | Started at UAT-01-02-001 |
| IS-007 | Review search UX | Search only via AI Chat | Should there be a dedicated search bar, or is AI-only sufficient? | Low | Backlog | Found at UAT-01-03-002 |
| IS-008 | Full screen mode for AI Chat | AI Chat opens in small panel in bottom-right | Add option to expand AI Chat to full screen for longer conversations or complex queries | Medium | Backlog | Found at UAT-01-03-004 |
| IS-009 | Review breadcrumbs requirement | Breadcrumbs don't exist (never implemented) | Review whether breadcrumbs are needed or if current navigation (sidebar + slide-out panels) is sufficient | Low | Backlog | Found at UAT-01-03-005 |
| IS-010 | **WORKSHOP REQUIRED:** Magic Link Login & Domain Restrictions | Password-based login, no domain restrictions | **See detailed requirements below** - Magic link login with domain-based access control | **Critical** | Requires Workshop | Found at UAT-02-01-001 |
| IS-011 | Empty organisation dashboard shows infinite skeleton loaders | Dashboard shows skeleton placeholders forever when org has no projects | Show an "empty state" with call-to-action (e.g., "Create your first project") instead of skeleton loaders | Medium | Backlog | Found at UAT-02-01-001 |
| IS-012 | BUG-007 revealed constraint naming inconsistency | DB migration had mismatched constraint names | Review all migrations for constraint naming consistency; add migration testing | Low | Backlog | Fixed at UAT-02-01-001 |

### IS-006 Running Notes: Roles & Permissions Review

| Checkpoint | Note |
|------------|------|
| UAT-01-02-002 | Review the differences each role makes to what users can see and do - specifically navigation items, dashboard content, and available actions |
| UAT-01-03-001 | **BUGS FOUND:** Supplier PM should have access to Finance, Organisation, and Project Roles pages (currently showing Access Denied). See BUG-001 to BUG-004. |

---

### IS-010: Magic Link Login & Domain-Based Access Control

> **Status:** REQUIRES WORKSHOP
> **Priority:** Critical - Security Framework Enhancement
> **Found At:** UAT-02-01-001
> **Complexity:** High - Affects authentication, organisation setup, and role model

#### Overview

Implement a passwordless Magic Link login system with email domain restrictions configured at the organisation and project levels. This creates a robust security framework where access is controlled by email domain and role type.

#### Authentication Requirements

| Requirement | Specification |
|-------------|---------------|
| **Login Method** | Magic Link (passwordless) |
| **Token Expiry** | 15 minutes |
| **Session Duration** | 7 days |
| **MFA** | TBD - Consider as follow-up |

#### Domain Restriction Model

When creating or configuring an organisation, the Supplier PM or Admin specifies which email domains are acceptable and what role types users from each domain can have.

**Example Configuration:**
```
Organisation: Acme Project
Accepted Domains:
├── jtglobal.com      → Supplier roles only
├── acme.com          → Customer roles only
└── progressive.gg    → Third-party roles only
```

#### Role Model Clarification Needed

**Current System (6 roles):**
- supplier_pm
- supplier_finance
- customer_pm
- customer_finance
- contributor
- viewer

**Proposed Role Categories:**

| Category | Description | Example Domains |
|----------|-------------|-----------------|
| **Supplier Roles** | The delivery organisation (your company) | yourcompany.com |
| **Customer Roles** | The client receiving the work | client.com |
| **Third-Party Roles** | External consultants, auditors, partners | partner.com, auditor.com |

#### Workshop Questions to Resolve

1. **Role Mapping:** Which existing roles belong to which category?
   - Supplier: `supplier_pm`, `supplier_finance`, `contributor`?
   - Customer: `customer_pm`, `customer_finance`, `viewer`?
   - Third-party: New role type needed? Or can be any role?

2. **Enforcement Level:** Where are domain restrictions enforced?
   - Organisation level only?
   - Project level overrides?
   - Both with inheritance?

3. **Multi-Domain Users:** What if a user's email matches multiple orgs?

4. **Invitation Flow:** How does invitation work with domain restrictions?
   - Block invite if domain doesn't match?
   - Auto-assign role category based on domain?

5. **Existing Users:** Migration path for current password-based users?

6. **Fallback:** What if magic link email delivery fails?

#### Implementation Phases (Suggested)

| Phase | Scope |
|-------|-------|
| 1 | Magic Link authentication (replace passwords) |
| 2 | Domain whitelist at organisation level |
| 3 | Role category enforcement by domain |
| 4 | Project-level domain overrides |

#### Security Benefits

- **No passwords** - Eliminates password-related vulnerabilities
- **Domain verification** - Only corporate emails accepted
- **Role enforcement** - Prevents role escalation across org boundaries
- **Audit trail** - Every login generates a traceable magic link event
- **Short tokens** - 15-minute expiry limits exposure window

---

## Discoveries by Session

Track when discoveries were made.

| Session | Date | Tester | New Features | Doc Changes | Improvements | Total |
|---------|------|--------|--------------|-------------|--------------|-------|
| 1 | 2026-01-17 | Glenn Nickols | 0 | 3 | 10 | 13 |
| 2 | 2026-01-18 | Glenn Nickols | 0 | 1 | 2 | 3 |

---

## Change Log

| Date | Session | Action | Details |
|------|---------|--------|---------|
| 2026-01-17 | 1 | Added | IS-001: Cross-project landing page suggestion |
| 2026-01-17 | 1 | Added | IS-002: Invite-only explanation on login page |
| 2026-01-17 | 1 | Added | IS-003: Community section with shared templates |
| 2026-01-17 | 1 | Added | IS-004: Customisable dashboard with templates and role-based defaults |
| 2026-01-17 | 1 | Added | IS-005: AI feature controls in Project Settings |
| 2026-01-17 | 1 | Added | IS-006: Roles and Permissions Review (running note) |
| 2026-01-17 | 1 | Updated | IS-006: Added note about role impact on navigation/dashboards/content |
| 2026-01-17 | 1 | Updated | IS-006: Added bugs BUG-001 to BUG-004 (Supplier PM access denied to Finance/Organisation/Project Roles) |
| 2026-01-17 | 1 | Added | DC-001: Search bar documentation mismatch |
| 2026-01-17 | 1 | Added | IS-007: Review search UX (dedicated bar vs AI-only) |
| 2026-01-17 | 1 | Added | DC-002: Logo documentation mismatch (no logo in header) |
| 2026-01-17 | 1 | Added | IS-008: Full screen mode for AI Chat |
| 2026-01-17 | 1 | Added | DC-003: Breadcrumbs documentation mismatch (breadcrumbs don't exist) |
| 2026-01-17 | 1 | Added | IS-009: Review breadcrumbs requirement |
| 2026-01-17 | 1 | Added | IS-010: **WORKSHOP** Magic Link Login & Domain-Based Access Control (Critical) |
| 2026-01-18 | 2 | Added | DC-004: Logo upload not available on org creation |
| 2026-01-18 | 2 | Added | IS-011: Empty organisation dashboard shows infinite skeleton loaders |
| 2026-01-18 | 2 | Added | IS-012: BUG-007 revealed constraint naming inconsistency |

---

## Priority Definitions

| Priority | Description | Action Timeline |
|----------|-------------|-----------------|
| **Critical** | Blocks UAT or affects core functionality | Before UAT sign-off |
| **High** | Significant impact on user experience | Within 1 week |
| **Medium** | Noticeable but not blocking | Within 1 month |
| **Low** | Minor enhancement or nice-to-have | Backlog |

---

## Status Definitions

| Status | Description |
|--------|-------------|
| **Pending** | Identified but not yet actioned |
| **In Progress** | Being addressed |
| **Complete** | Fixed/implemented |
| **Deferred** | Postponed to future release |
| **Won't Fix** | Decided not to implement |

---

_This document is automatically updated during UAT testing sessions._
