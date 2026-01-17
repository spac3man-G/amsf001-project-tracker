# Tracker by Progressive - UAT Checklist

> **Version:** 1.0
> **Created:** 17 January 2026
> **Last Updated:** 17 January 2026
> **Associated Manual:** USER-MANUAL.md (40 chapters, 7 parts)
> **Total Checkpoints:** 190
> **Status:** READY FOR TESTING

---

## Executive Summary Dashboard

### Overall Progress

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Checkpoints** | 190 | 100% |
| **Passed** | 8 | 4% |
| **Failed** | 3 | 2% |
| **Not Tested** | 177 | 93% |
| **Skipped** | 2 | 1% |

### Progress by Part

| Part | Title | Total | Passed | Failed | Not Tested | Progress |
|------|-------|-------|--------|--------|------------|----------|
| 1 | Getting Started | 13 | 8 | 1 | 4 | 69% |
| 2 | Organisation Setup | 18 | 0 | 0 | 18 | 0% |
| 3 | Project Creation | 24 | 0 | 0 | 24 | 0% |
| 4 | Planning Your Project | 36 | 0 | 0 | 36 | 0% |
| 5 | Running Your Project | 44 | 0 | 0 | 44 | 0% |
| 6 | Financial Management | 30 | 0 | 0 | 30 | 0% |
| 7 | Reporting & AI Features | 25 | 0 | 0 | 25 | 0% |

### Session History

| Session | Date | Tester | Start Checkpoint | End Checkpoint | Passed | Failed | Discoveries |
|---------|------|--------|------------------|----------------|--------|--------|-------------|
| 1 | 2026-01-17 | Glenn Nickols | UAT-01-01-001 | UAT-01-03-005 (paused) | 8 | 3 | 13 |

---

# PART 1: GETTING STARTED

---

## Chapter 1.1: Welcome to Tracker

---

### UAT-01-01-001

**Test:** Successfully log in to Tracker using valid credentials

**Manual Reference:** Part 1, Chapter 1.1 - Welcome to Tracker

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Open your browser and navigate to the Tracker URL
2. Enter your email address in the Email field
3. Enter your password in the Password field
4. Click the "Sign In" button
5. Verify the Dashboard page loads successfully

#### Comments

> Login successful. After login, user is taken directly to a default project dashboard rather than a landing page.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-001: Add a cross-project landing page after login that shows relevant information from all projects the user is associated with, before they select a specific project to work on

---

### UAT-01-01-002

**Test:** Successfully reset password using "Forgot Password" feature

**Manual Reference:** Part 1, Chapter 1.1 - Welcome to Tracker

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Navigate to the Tracker login page
2. Click the "Forgot Password" link
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email for the reset link
6. Click the link and set a new password
7. Log in with the new password

#### Comments

> Password reset flow works correctly. **REMINDER:** Review email text and branding for password reset emails and platform invitation emails as part of the workflow review.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-002: Login page should explain that Tracker is an invite-only application and provide guidance to contact the relevant project manager for access if users have issues
- [x] IS-003: Community section with FAQs, shared templates (plan templates, CR templates, workflow templates) shareable across projects and potentially across organisations

---

### UAT-01-01-003

**Test:** After logging in, see the Dashboard page

**Manual Reference:** Part 1, Chapter 1.1 - Welcome to Tracker

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker with valid credentials
2. Verify the Dashboard page loads automatically
3. Confirm you can see project metrics and panels
4. Verify the sidebar navigation is visible

#### Comments

> Dashboard loads correctly with all panels visible. Sidebar navigation is present and functional. **NOTE:** "Failed to generate forecast" error observed in Project Forecast panel - log for AI Features testing (Part 7). AI Insights panel is showing and working.

#### If Failed

**Issue Description:**
> N/A - Test passed (AI forecast error noted for Part 7 testing)

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-004: Customisable dashboard feature - PM can use pre-existing templates or create new ones for the project; users can create their own dashboard preferences; hybrid approach with mandatory areas plus user-customisable areas; role-based dashboard templates with different defaults per role

---

### UAT-01-01-004

**Test:** Locate the AI Chat Assistant in the bottom-right corner

**Manual Reference:** Part 1, Chapter 1.1 - Welcome to Tracker

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Look in the bottom-right corner of the screen
3. Locate the chat icon/button
4. Click to open the AI Chat Assistant
5. Verify the chat interface opens

#### Comments

> AI Chat Assistant found in bottom-right corner. Opens correctly with suggested prompts and "Powered by Claude AI" branding. Interface shows example queries and natural language tip.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-005: AI feature controls in Project Settings - PM should be able to enable/disable AI features per project (to save costs or reduce complexity), with granular control to enable only a subset of AI features as needed

---

## Chapter 1.2: Understanding Your Role

---

### UAT-01-02-001

**Test:** Identify your current role from the user menu

**Manual Reference:** Part 1, Chapter 1.2 - Understanding Your Role

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Click on your user profile/avatar in the top navigation
3. Locate the role indicator in the dropdown menu
4. Verify your role is displayed correctly

#### Comments

> Role correctly displayed. **RUNNING NOTE - ROLES & PERMISSIONS REVIEW:** Collecting feedback on roles throughout UAT testing. Additional comments will be added as testing progresses. See IS-006 for consolidated notes.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-006: Roles and Permissions Review - Running note to collect feedback throughout UAT (comments will be added as testing progresses)

---

### UAT-01-02-002

**Test:** (Supplier PM only) Use "View As" to preview the Contributor role

**Manual Reference:** Part 1, Chapter 1.2 - Understanding Your Role

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in as a Supplier PM
2. Click on your user profile/avatar
3. Find the "View As" dropdown
4. Select "Contributor" from the dropdown
5. Verify the UI changes to show Contributor permissions
6. Verify restricted features are hidden or disabled

#### Comments

> View As feature works correctly. UI updates to show Contributor view. **IS-006 NOTE:** Review the differences each role makes to what users can see and do - specifically navigation items, dashboard content, and available actions.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] Added to IS-006: Review role impact on navigation, dashboards, and content visibility

---

### UAT-01-02-003

**Test:** Verify the sidebar menu shows only features available to your role

**Manual Reference:** Part 1, Chapter 1.2 - Understanding Your Role

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in to Tracker
2. Note your current role
3. Review the sidebar menu items
4. Compare visible items against the role permissions table in the manual
5. Verify only appropriate menu items are shown

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-01-02-004

**Test:** Attempt to access a feature outside your role permissions and see appropriate restriction message

**Manual Reference:** Part 1, Chapter 1.2 - Understanding Your Role

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in with a restricted role (e.g., Viewer)
2. Try to navigate directly to a restricted page (e.g., /settings)
3. Verify an appropriate access denied message appears
4. Verify you are not shown any restricted data

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 1.3: Navigating the Application

---

### UAT-01-03-001

**Test:** Navigate to every main sidebar menu item and verify the page loads

**Manual Reference:** Part 1, Chapter 1.3 - Navigating the Application

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ❌ FAILED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Click each main sidebar menu item in order:
   - Dashboard
   - Planner
   - Milestones
   - Deliverables
   - Task View
   - Calendar
   - RAID Log
   - Timesheets
   - Expenses
   - Reports
   - KPIs
   - Resources
   - Project Settings
3. Verify each page loads without errors
4. Verify the page title matches the menu item

#### Comments

> Most navigation links work correctly. Issues found with Finance, Organisation, and Project Roles pages for Supplier PM role.

#### If Failed

**Issue Description:**
> **BUG-001:** Finance page shows "Access Denied - You need organisation admin permissions" for Supplier PM. Supplier PM should have access.
>
> **BUG-002:** Organisation page shows "Access Denied" for Supplier PM. Supplier PM should have access.
>
> **BUG-003:** "Failed to load projects" error toast appearing on Organisation and Project Roles pages.
>
> **BUG-004:** Project Roles page loads but displays errors. Should work correctly for Supplier PM.

**Severity:** ✅ Major

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] Added to IS-006: Supplier PM should have access to Finance, Organisation, and Project Roles pages

---

### UAT-01-03-002

**Test:** Use the search feature to find a milestone by name

**Manual Reference:** Part 1, Chapter 1.3 - Navigating the Application

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ❌ FAILED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Locate the search bar in the top navigation
3. Enter a known milestone name
4. Verify search results appear
5. Click a result and verify navigation to the correct item

#### Comments

> No dedicated search bar exists in top navigation. Search functionality only available via AI Chat Assistant in bottom-right corner.

#### If Failed

**Issue Description:**
> **BUG-005:** No search bar exists in top navigation as documented. Search is only available through AI Chat Assistant.

**Severity:** ✅ Major

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [x] DC-001: Manual references "search bar in top navigation" but no dedicated search bar exists - search is via AI Chat Assistant only

**Improvement Suggestions:**
- [x] IS-007: Review search UX - should there be a dedicated search bar in addition to AI assistant, or is AI-only sufficient? Consider user expectations and discoverability

---

### UAT-01-03-003

**Test:** Switch between two different projects using the project selector

**Manual Reference:** Part 1, Chapter 1.3 - Navigating the Application

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Locate the project selector in the top navigation
3. Click to open the project dropdown
4. Select a different project
5. Verify the page reloads with the new project's data
6. Verify the project name updates in the header

#### Comments

> Project selector works correctly. Tested switching both organisations and projects successfully. Current organisation only has one project, but switcher functions as expected. Account settings accessible by clicking user ID. **Documentation issues:** Manual describes a logo in header (none exists) and search in header (already logged as DC-001).

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [x] DC-002: Manual describes "Logo - Click to return to Dashboard" in header bar - no logo exists in the application
- [x] DC-001 (existing): Search bar documentation mismatch already logged

**Improvement Suggestions:**
- [ ] _None_

---

### UAT-01-03-004

**Test:** Open the AI Chat Assistant and ask a question about the project

**Manual Reference:** Part 1, Chapter 1.3 - Navigating the Application

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ✅ PASSED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Log in to Tracker
2. Click the AI Chat Assistant button (bottom-right)
3. Type a question like "What is the project health score?"
4. Press Enter or click Send
5. Verify you receive a relevant response

#### Comments

> AI Chat Assistant works correctly. Opens from bottom-right, accepts questions, and provides relevant responses.

#### If Failed

**Issue Description:**
> N/A - Test passed

**Severity:** N/A

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [ ] _None_

**Improvement Suggestions:**
- [x] IS-008: Add full screen mode for AI Chat Assistant

---

### UAT-01-03-005

**Test:** Use breadcrumbs to navigate back from a detail page to a list page

**Manual Reference:** Part 1, Chapter 1.3 - Navigating the Application

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ❌ FAILED |
| **Tested By** | Glenn Nickols |
| **Test Date** | 2026-01-17 |
| **Environment** | Production (tracker.progressive.gg) |

#### Test Steps

1. Navigate to a detail page (e.g., click on a specific milestone)
2. Locate the breadcrumb trail at the top of the page
3. Click on a parent breadcrumb (e.g., "Milestones")
4. Verify navigation returns to the list page

#### Comments

> No breadcrumbs exist in the application. Breadcrumbs were never implemented. Navigation between detail and list pages relies on sidebar menu or browser back button. Detail panel slides out from right side (see milestone detail screenshot).

#### If Failed

**Issue Description:**
> **BUG-006:** Breadcrumbs do not exist in the application. Manual describes breadcrumb navigation (e.g., "Home > Milestones > Phase 1 > Requirements Complete") but this feature was never implemented.

**Severity:** ✅ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _None_

**Documentation Differences:**
- [x] DC-003: Manual describes breadcrumb navigation that doesn't exist in application

**Improvement Suggestions:**
- [x] IS-009: Review whether breadcrumbs are required - decide if this feature should be implemented or if current navigation (sidebar + slide-out panels) is sufficient

---

# PART 2: ORGANISATION SETUP

---

## Chapter 2.1: Creating Your Organisation

---

### UAT-02-01-001

**Test:** Create a new organisation with a name and logo

**Manual Reference:** Part 2, Chapter 2.1 - Creating Your Organisation

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to create new organisation (or use existing org admin access)
2. Enter an organisation name
3. Upload a logo image
4. Click Save/Create
5. Verify the organisation is created successfully

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-01-002

**Test:** Verify the organisation name appears in the header after creation

**Manual Reference:** Part 2, Chapter 2.1 - Creating Your Organisation

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After creating/updating an organisation
2. Look at the application header
3. Verify the organisation name is displayed correctly
4. Navigate to different pages and verify it persists

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-01-003

**Test:** Verify the logo appears in the header after upload

**Manual Reference:** Part 2, Chapter 2.1 - Creating Your Organisation

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Upload a logo to the organisation
2. Refresh the page
3. Verify the logo appears in the header area
4. Verify the logo displays at correct size and quality

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-01-004

**Test:** Confirm the creating user has full administrative access

**Manual Reference:** Part 2, Chapter 2.1 - Creating Your Organisation

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After creating an organisation
2. Navigate to Organisation Admin
3. Verify you can access all admin tabs
4. Verify you can modify organisation settings
5. Verify you can invite/manage members

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 2.2: Managing Organisation Members

---

### UAT-02-02-001

**Test:** Send an invitation to a new team member

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Click "Invite Member" button
3. Enter the new member's email address
4. Select a role for the member
5. Click Send Invitation
6. Verify the invitation is sent successfully

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-02-002

**Test:** Verify the invitee receives the email and can accept

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Send an invitation to a test email
2. Check the inbox for the invitation email
3. Click the acceptance link in the email
4. Complete the account setup if new user
5. Verify the user can now access Tracker

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-02-003

**Test:** Assign an existing member to a project with a specific role

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Find an existing member
3. Expand their row to see project assignments
4. Click "Add to Project"
5. Select a project and role
6. Save the assignment
7. Verify the member can now access the project

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-02-004

**Test:** Change a member's project role

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Expand a member's row
3. Find a project assignment
4. Change the role dropdown to a different role
5. Save the change
6. Verify the new role takes effect

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-02-005

**Test:** Remove a member from a project (not from organisation)

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Expand a member's row
3. Find a project assignment
4. Click the remove button for that project
5. Confirm the removal
6. Verify the member no longer has access to that project
7. Verify the member still has access to other projects

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-02-006

**Test:** Resend an invitation to a pending member

**Manual Reference:** Part 2, Chapter 2.2 - Managing Organisation Members

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Find a member with pending invitation status
3. Click the resend invitation button (mail icon)
4. Verify success message appears
5. Verify the email is received

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 2.3: Organisation Settings

---

### UAT-02-03-001

**Test:** Access Organisation Admin → Settings

**Manual Reference:** Part 2, Chapter 2.3 - Organisation Settings

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click on your user profile/avatar
2. Select "Organisation Admin" from the menu
3. Click the "Settings" tab
4. Verify the settings page loads with all options

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-03-002

**Test:** Change the organisation logo and verify it appears in the header

**Manual Reference:** Part 2, Chapter 2.3 - Organisation Settings

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Settings
2. Find the logo upload section
3. Upload a new logo image
4. Save changes
5. Refresh the page
6. Verify the new logo appears in the header

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-03-003

**Test:** Update the organisation name and verify it displays correctly

**Manual Reference:** Part 2, Chapter 2.3 - Organisation Settings

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Settings
2. Find the organisation name field
3. Update the name
4. Save changes
5. Verify the new name appears in the header
6. Navigate to different pages to confirm it persists

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-03-004

**Test:** Modify a default setting (e.g., working hours) and verify it applies to new projects

**Manual Reference:** Part 2, Chapter 2.3 - Organisation Settings

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Settings
2. Find a default setting (e.g., working hours per day)
3. Change the value
4. Save changes
5. Create a new project
6. Verify the new project inherits the updated default

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 2.4: User Journeys - Organisation Setup

---

### UAT-02-04-001

**Test:** Complete Journey 1 - Create a new organisation and invite team members

**Manual Reference:** Part 2, Chapter 2.4 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new organisation with name and logo
2. Configure basic organisation settings
3. Invite at least 2 team members
4. Assign invited members to appropriate roles
5. Verify all members can access the organisation

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-04-002

**Test:** Complete Journey 2 - Add an external customer PM to a project

**Manual Reference:** Part 2, Chapter 2.4 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to a project's team settings
2. Invite a new external user (customer)
3. Assign them the Customer PM role
4. Verify the invitation is sent
5. Accept the invitation as the customer user
6. Verify the customer can access the project

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-04-003

**Test:** Verify customer PM can see the project but not organisation settings

**Manual Reference:** Part 2, Chapter 2.4 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in as a Customer PM user
2. Verify you can access the assigned project
3. Verify you can see project Dashboard, Milestones, Deliverables
4. Verify you CANNOT access Organisation Admin
5. Verify Organisation Admin menu item is not visible

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-02-04-004

**Test:** Remove a test member from the organisation and verify their access is revoked

**Manual Reference:** Part 2, Chapter 2.4 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Members
2. Find a test member to remove
3. Click the remove/delete button for that member
4. Confirm the removal
5. Have the removed user try to access Tracker
6. Verify they can no longer access the organisation or projects

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# PART 3: PROJECT CREATION

---

## Chapter 3.1: Creating a New Project

---

### UAT-03-01-001

**Test:** Create a new project with all required fields

**Manual Reference:** Part 3, Chapter 3.1 - Creating a New Project

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to create new project (from org admin or dashboard)
2. Enter project name
3. Enter project reference/code
4. Set start and end dates
5. Select project type
6. Click Create
7. Verify project is created successfully

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-01-002

**Test:** Verify the project appears in the project selector after creation

**Manual Reference:** Part 3, Chapter 3.1 - Creating a New Project

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After creating a project
2. Click the project selector dropdown
3. Verify the new project appears in the list
4. Select the new project
5. Verify navigation to the project Dashboard

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-01-003

**Test:** Access the new project's Dashboard

**Manual Reference:** Part 3, Chapter 3.1 - Creating a New Project

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select the new project from the project selector
2. Navigate to Dashboard (if not already there)
3. Verify the Dashboard loads with project data
4. Verify key metrics panels are visible (even if empty)

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-01-004

**Test:** Verify project details in Project Settings match what was entered

**Manual Reference:** Part 3, Chapter 3.1 - Creating a New Project

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings
2. Verify project name matches what was entered
3. Verify project reference/code matches
4. Verify start and end dates match
5. Verify project type matches

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 3.2: Project Templates

---

### UAT-03-02-001

**Test:** Create a new project using an existing template

**Manual Reference:** Part 3, Chapter 3.2 - Project Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Start creating a new project
2. Find the template selection option
3. Select an existing template
4. Complete project creation
5. Verify the template structure is applied

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-02-002

**Test:** Verify the template structure (milestones, deliverables) is copied correctly

**Manual Reference:** Part 3, Chapter 3.2 - Project Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After creating a project from template
2. Navigate to Planner
3. Compare the structure against the original template
4. Verify milestones, deliverables, and tasks match
5. Verify dates are correctly shifted

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-02-003

**Test:** Save an existing project as a new template

**Manual Reference:** Part 3, Chapter 3.2 - Project Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a project with a good structure
2. Navigate to Project Settings
3. Find the "Save as Template" option
4. Enter a template name
5. Save the template
6. Verify success message

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-02-004

**Test:** View the template in Organisation Admin → Templates

**Manual Reference:** Part 3, Chapter 3.2 - Project Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin
2. Click the Templates tab
3. Locate the saved template
4. Verify template name and details are correct

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-02-005

**Test:** Edit a template and verify changes are saved

**Manual Reference:** Part 3, Chapter 3.2 - Project Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Templates
2. Select a template to edit
3. Make a change (e.g., rename or modify structure)
4. Save the template
5. Refresh and verify changes persisted

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 3.3: Project Settings Deep Dive

---

### UAT-03-03-001

**Test:** Access all Project Settings tabs

**Manual Reference:** Part 3, Chapter 3.3 - Project Settings Deep Dive

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings
2. Click on each available tab:
   - General
   - Financial
   - Workflow
   - Notifications
   - Features
3. Verify each tab loads correctly

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-03-002

**Test:** Change the project name and verify it updates in the header

**Manual Reference:** Part 3, Chapter 3.3 - Project Settings Deep Dive

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → General
2. Change the project name
3. Save the changes
4. Verify the project name updates in the header
5. Verify it updates in the project selector

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-03-003

**Test:** Modify a workflow setting (e.g., change sign-off requirement)

**Manual Reference:** Part 3, Chapter 3.3 - Project Settings Deep Dive

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Workflow
2. Find a sign-off requirement setting
3. Change the setting (e.g., enable/disable dual sign-off)
4. Save changes
5. Verify the workflow change takes effect in the UI

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-03-004

**Test:** Disable a feature (e.g., KPIs) and verify it disappears from the sidebar

**Manual Reference:** Part 3, Chapter 3.3 - Project Settings Deep Dive

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Features
2. Find a toggleable feature (e.g., KPIs)
3. Disable the feature
4. Save changes
5. Check the sidebar menu
6. Verify the feature is no longer visible

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-03-005

**Test:** Re-enable the feature and verify it reappears

**Manual Reference:** Part 3, Chapter 3.3 - Project Settings Deep Dive

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Features
2. Find the disabled feature
3. Re-enable the feature
4. Save changes
5. Check the sidebar menu
6. Verify the feature reappears

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 3.4: Adding Team Members to Projects

---

### UAT-03-04-001

**Test:** Add an existing organisation member to the project

**Manual Reference:** Part 3, Chapter 3.4 - Adding Team Members to Projects

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Team
2. Click "Add Team Member"
3. Select an existing organisation member
4. Assign a project role
5. Save the assignment
6. Verify the member appears in the team list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-04-002

**Test:** Invite a new person (not in organisation) to the project

**Manual Reference:** Part 3, Chapter 3.4 - Adding Team Members to Projects

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Team
2. Click "Invite New Member"
3. Enter email address of someone not in the organisation
4. Select a project role
5. Send the invitation
6. Verify invitation is sent

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-04-003

**Test:** Change a team member's role

**Manual Reference:** Part 3, Chapter 3.4 - Adding Team Members to Projects

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Team
2. Find a team member
3. Change their role dropdown
4. Save the change
5. Verify the new role is reflected

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-04-004

**Test:** Remove a team member from the project

**Manual Reference:** Part 3, Chapter 3.4 - Adding Team Members to Projects

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Team
2. Find a team member to remove
3. Click the remove button
4. Confirm the removal
5. Verify the member is removed from the list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-04-005

**Test:** Verify removed member no longer sees the project

**Manual Reference:** Part 3, Chapter 3.4 - Adding Team Members to Projects

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After removing a member from the project
2. Log in as that removed member
3. Check the project selector
4. Verify the project is not visible
5. Try accessing the project URL directly
6. Verify access is denied

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 3.5: User Journeys - Project Creation

---

### UAT-03-05-001

**Test:** Create a fixed-price project with dual sign-off workflow

**Manual Reference:** Part 3, Chapter 3.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new project
2. Set project type to fixed-price
3. Enable dual sign-off in workflow settings
4. Add at least one milestone with payment value
5. Verify the sign-off workflow is configured

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-05-002

**Test:** Create a T&M project with monthly milestone structure

**Manual Reference:** Part 3, Chapter 3.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new project
2. Set project type to time and materials
3. Create monthly milestones for tracking
4. Configure timesheet settings
5. Verify the structure supports T&M billing

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-05-003

**Test:** Create a project from an existing template

**Manual Reference:** Part 3, Chapter 3.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Start creating a new project
2. Select an existing template
3. Complete the project creation
4. Verify the template structure is applied
5. Verify all milestones and deliverables are copied

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-05-004

**Test:** Verify template structure is copied correctly

**Manual Reference:** Part 3, Chapter 3.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Compare new project structure to original template
2. Verify component names match
3. Verify milestone names and order match
4. Verify deliverable structure matches
5. Verify dates are appropriately shifted

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-03-05-005

**Test:** Customise a template-created project (add/remove deliverables)

**Manual Reference:** Part 3, Chapter 3.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a project created from template
2. Navigate to Planner
3. Add a new deliverable
4. Remove an existing deliverable
5. Modify a milestone date
6. Verify all changes are saved

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# PART 4: PLANNING YOUR PROJECT

---

## Chapter 4.1: Introduction to WBS Planning

---

### UAT-04-01-001

**Test:** Access the Planner page from the sidebar

**Manual Reference:** Part 4, Chapter 4.1 - Introduction to WBS Planning

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in to Tracker
2. Select a project
3. Click "Planner" in the sidebar menu
4. Verify the Planner page loads with WBS view

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-01-002

**Test:** Identify the four WBS levels in an existing project

**Manual Reference:** Part 4, Chapter 4.1 - Introduction to WBS Planning

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open Planner for a project with existing structure
2. Identify Components (top level)
3. Identify Milestones (under components)
4. Identify Deliverables (under milestones)
5. Identify Tasks (under deliverables, if "Show Tasks" enabled)

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-01-003

**Test:** Expand and collapse items in the tree view

**Manual Reference:** Part 4, Chapter 4.1 - Introduction to WBS Planning

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In the Planner view, find a collapsed item (chevron pointing right)
2. Click to expand it and see children
3. Click again to collapse it
4. Verify expand/collapse works at all levels

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-01-004

**Test:** Toggle "Show Tasks" and verify the view updates

**Manual Reference:** Part 4, Chapter 4.1 - Introduction to WBS Planning

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find the "Show Tasks" toggle in the Planner toolbar
2. If tasks are hidden, turn on the toggle
3. Verify tasks appear under deliverables
4. Turn off the toggle
5. Verify tasks are hidden

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.2: Creating Components

---

### UAT-04-02-001

**Test:** Create a new component with name, description, and dates

**Manual Reference:** Part 4, Chapter 4.2 - Creating Components

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Planner, click "Add Component" button
2. Enter a component name
3. Enter a description
4. Set start and end dates
5. Save the component
6. Verify it appears in the tree

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-02-002

**Test:** Edit an existing component's properties

**Manual Reference:** Part 4, Chapter 4.2 - Creating Components

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click on an existing component in the tree
2. Edit the name in the side panel
3. Edit the description
4. Change the dates
5. Save changes
6. Verify changes are reflected

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-02-003

**Test:** Reorder components by dragging in the tree

**Manual Reference:** Part 4, Chapter 4.2 - Creating Components

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Have at least 2 components in the project
2. Drag a component to a new position
3. Drop it above or below another component
4. Verify the order changes
5. Refresh and verify order persists

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-02-004

**Test:** Delete a component (before committing)

**Manual Reference:** Part 4, Chapter 4.2 - Creating Components

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a component (in an uncommitted project)
2. Click the delete button
3. Confirm the deletion
4. Verify the component and all children are removed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.3: Defining Milestones

---

### UAT-04-03-001

**Test:** Create a progress milestone with name, dates, and description

**Manual Reference:** Part 4, Chapter 4.3 - Defining Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a component in the Planner
2. Click "Add Milestone"
3. Enter milestone name
4. Set milestone type to "Progress"
5. Enter start and end dates
6. Add a description
7. Save and verify

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-03-002

**Test:** Create a payment milestone with a value

**Manual Reference:** Part 4, Chapter 4.3 - Defining Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a component in the Planner
2. Click "Add Milestone"
3. Enter milestone name
4. Set milestone type to "Payment"
5. Enter a payment value
6. Set dates
7. Save and verify the value displays

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-03-003

**Test:** Set a dependency between two milestones

**Manual Reference:** Part 4, Chapter 4.3 - Defining Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Have at least 2 milestones in the project
2. Select the dependent milestone
3. Find the dependencies/predecessors field
4. Add the other milestone as a predecessor
5. Save and verify the dependency is shown

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-03-004

**Test:** Change a milestone's status through the workflow

**Manual Reference:** Part 4, Chapter 4.3 - Defining Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone in Not Started status
2. Change status to In Progress
3. Verify the status indicator updates
4. Change to Completed
5. Verify workflow progression

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.4: Adding Deliverables

---

### UAT-04-04-001

**Test:** Create a deliverable with name, dates, and acceptance criteria

**Manual Reference:** Part 4, Chapter 4.4 - Adding Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a milestone in the Planner
2. Click "Add Deliverable"
3. Enter deliverable name
4. Set start and end dates
5. Add acceptance criteria
6. Save and verify

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-04-002

**Test:** Assign a deliverable to a team member

**Manual Reference:** Part 4, Chapter 4.4 - Adding Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select or create a deliverable
2. Find the assignee field
3. Select a team member from the dropdown
4. Save the assignment
5. Verify the assignee is displayed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-04-003

**Test:** Add acceptance criteria to a deliverable

**Manual Reference:** Part 4, Chapter 4.4 - Adding Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a deliverable
2. Open the side panel
3. Find the Acceptance Criteria section
4. Add one or more criteria
5. Save and verify criteria are listed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-04-004

**Test:** Change a deliverable's status through the workflow

**Manual Reference:** Part 4, Chapter 4.4 - Adding Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a deliverable in Not Started status
2. Change to In Progress
3. Change to Ready for Review
4. Change to Delivered
5. Verify each status transition works

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-04-005

**Test:** Attach a file to a deliverable

**Manual Reference:** Part 4, Chapter 4.4 - Adding Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a deliverable
2. Open the side panel
3. Find the Attachments section
4. Upload a file
5. Verify the file appears in attachments
6. Verify you can download it

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.5: Breaking Down Tasks

---

### UAT-04-05-001

**Test:** Create a task with name, assignee, and due date

**Manual Reference:** Part 4, Chapter 4.5 - Breaking Down Tasks

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a deliverable
2. Enable "Show Tasks" if needed
3. Click "Add Task"
4. Enter task name
5. Assign to a team member
6. Set due date
7. Save and verify

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-05-002

**Test:** Add a checklist to a task

**Manual Reference:** Part 4, Chapter 4.5 - Breaking Down Tasks

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a task
2. Open the task details
3. Find the Checklist section
4. Add checklist items
5. Save and verify items appear
6. Check off an item and verify it saves

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-05-003

**Test:** Mark a task as complete

**Manual Reference:** Part 4, Chapter 4.5 - Breaking Down Tasks

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a task that is not complete
2. Click the completion checkbox or status change
3. Verify the task shows as complete
4. Verify completion is reflected in parent deliverable progress

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-05-004

**Test:** Reassign a task to a different team member

**Manual Reference:** Part 4, Chapter 4.5 - Breaking Down Tasks

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a task with an assignee
2. Change the assignee to a different team member
3. Save the change
4. Verify the new assignee is displayed
5. Verify the task appears in new assignee's task list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-05-005

**Test:** Use Task View to filter tasks by assignee

**Manual Reference:** Part 4, Chapter 4.5 - Breaking Down Tasks

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Task View from sidebar
2. Find the assignee filter
3. Select a specific team member
4. Verify only their tasks are displayed
5. Clear the filter and verify all tasks return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.6: Committing Your Plan

---

### UAT-04-06-001

**Test:** Commit a project plan

**Manual Reference:** Part 4, Chapter 4.6 - Committing Your Plan

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Ensure project has uncommitted plan
2. Find the "Commit" or "Publish" button
3. Click to commit the plan
4. Confirm the action
5. Verify the plan is now committed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-06-002

**Test:** Verify structural changes are blocked after commit

**Manual Reference:** Part 4, Chapter 4.6 - Committing Your Plan

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After committing a plan
2. Try to delete a milestone
3. Verify deletion is blocked
4. Try to add a new component
5. Verify structural changes require variation

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-06-003

**Test:** Verify tasks can still be added/edited after commit

**Manual Reference:** Part 4, Chapter 4.6 - Committing Your Plan

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In a committed project
2. Add a new task to a deliverable
3. Verify task creation succeeds
4. Edit the task name
5. Verify editing succeeds
6. Delete the task and verify it works

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-06-004

**Test:** Edit a milestone date and verify variance is tracked

**Manual Reference:** Part 4, Chapter 4.6 - Committing Your Plan

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In a baselined project
2. View current baseline dates
3. Change a milestone end date
4. Save the change
5. Verify variance is calculated and displayed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.7: Component Templates

---

### UAT-04-07-001

**Test:** Save an existing component as a template

**Manual Reference:** Part 4, Chapter 4.7 - Component Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a component with milestones and deliverables
2. Find the "Save as Template" option
3. Enter a template name
4. Save the template
5. Verify success message

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-07-002

**Test:** Import a component template into a project

**Manual Reference:** Part 4, Chapter 4.7 - Component Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Planner, find the "Import Template" option
2. Select a component template
3. Import it into the project
4. Verify the structure is created
5. Verify milestones and deliverables match template

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-07-003

**Test:** Verify the imported structure matches the template

**Manual Reference:** Part 4, Chapter 4.7 - Component Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Compare imported component to original template
2. Verify component name (may have suffix)
3. Verify milestone count and names match
4. Verify deliverable count and names match
5. Verify task count and names match

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-07-004

**Test:** Customise an imported component (change dates, add items)

**Manual Reference:** Part 4, Chapter 4.7 - Component Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select an imported component
2. Change the component dates
3. Add a new milestone
4. Remove a deliverable
5. Verify all changes save correctly

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-07-005

**Test:** View and edit templates in Organisation Admin

**Manual Reference:** Part 4, Chapter 4.7 - Component Templates

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin → Templates
2. Find the Component Templates section
3. View a template
4. Edit the template name or structure
5. Save and verify changes

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 4.8: User Journeys - Planning

---

### UAT-04-08-001

**Test:** Create a complete project plan with components, milestones, deliverables, and tasks

**Manual Reference:** Part 4, Chapter 4.8 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new project or use blank project
2. Add at least 2 components
3. Add milestones to each component
4. Add deliverables to milestones
5. Add tasks to deliverables
6. Verify complete hierarchy displays correctly

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-08-002

**Test:** Create a component template from an existing component

**Manual Reference:** Part 4, Chapter 4.8 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create or select a well-structured component
2. Save it as a template
3. Navigate to Organisation Admin → Templates
4. Verify the template appears
5. View template details

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-08-003

**Test:** Import a component template and customise for a specific project

**Manual Reference:** Part 4, Chapter 4.8 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Import a component template
2. Rename the component for this project
3. Adjust dates to match project timeline
4. Add project-specific deliverables
5. Remove unnecessary items
6. Verify final structure

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-08-004

**Test:** Set up milestone dependencies

**Manual Reference:** Part 4, Chapter 4.8 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a chain of dependent milestones
2. Set M1 as predecessor of M2
3. Set M2 as predecessor of M3
4. Verify dependencies display correctly
5. Verify dates make logical sense

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-04-08-005

**Test:** Commit the plan and verify baseline is created

**Manual Reference:** Part 4, Chapter 4.8 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Complete a full project plan
2. Commit/publish the plan
3. Create a baseline
4. Verify baseline dates are captured
5. Verify baseline appears in history

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# PART 5: RUNNING YOUR PROJECT

---

## Chapter 5.1: Dashboard

---

### UAT-05-01-001

**Test:** Open the Dashboard and verify all panels load correctly

**Manual Reference:** Part 5, Chapter 5.1 - Dashboard

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in to Tracker
2. Navigate to the Dashboard (should be default landing page)
3. Verify the Health Score panel loads
4. Verify the Project Forecast panel loads
5. Verify the Anomaly Alerts panel loads
6. Verify all metrics display data

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-01-002

**Test:** Click the health score and view the detailed breakdown

**Manual Reference:** Part 5, Chapter 5.1 - Dashboard

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. On the Dashboard, locate the Health Score panel
2. Click on the health score number or panel
3. Verify a detailed breakdown modal/panel opens
4. Review the component scores that make up the overall health
5. Verify the breakdown explains the scoring methodology

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-01-003

**Test:** Click an anomaly alert and navigate to the affected item

**Manual Reference:** Part 5, Chapter 5.1 - Dashboard

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. On the Dashboard, locate the Anomaly Alerts panel
2. If anomalies exist, click on one
3. Verify navigation to the affected item (milestone, deliverable, etc.)
4. Review the anomaly details
5. If no anomalies exist, note this in comments

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-01-004

**Test:** Refresh the Dashboard and verify data updates

**Manual Reference:** Part 5, Chapter 5.1 - Dashboard

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Make a change to project data (e.g., update a milestone status)
2. Return to the Dashboard
3. Refresh the page (F5 or browser refresh)
4. Verify the Dashboard reflects the updated data
5. Verify no loading errors occur

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.2: Milestones

---

### UAT-05-02-001

**Test:** View the Milestones page and filter by component

**Manual Reference:** Part 5, Chapter 5.2 - Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Milestones from the sidebar
2. Verify all milestones are displayed
3. Find the Component filter dropdown
4. Select a specific component
5. Verify only milestones from that component are shown
6. Clear the filter and verify all milestones return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-02-002

**Test:** Update milestone status from Not Started to In Progress

**Manual Reference:** Part 5, Chapter 5.2 - Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone with "Not Started" status
2. Click on the milestone to open details
3. Change the status to "In Progress"
4. Save the change
5. Verify the status indicator updates
6. Verify the change persists after page refresh

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-02-003

**Test:** Update milestone progress percentage

**Manual Reference:** Part 5, Chapter 5.2 - Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a milestone that is "In Progress"
2. Find the progress percentage field
3. Update the progress value (e.g., from 25% to 50%)
4. Save the change
5. Verify the progress bar/indicator updates
6. Verify the value persists after refresh

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-02-004

**Test:** Complete a milestone and request customer sign-off

**Manual Reference:** Part 5, Chapter 5.2 - Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone that is ready for completion
2. Set progress to 100%
3. Change status to "Completed" or "Ready for Sign-off"
4. Request customer sign-off (if workflow requires)
5. Verify the sign-off request is sent/recorded
6. Verify milestone shows pending sign-off status

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-02-005

**Test:** View a baseline breach warning and understand the cause

**Manual Reference:** Part 5, Chapter 5.2 - Milestones

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone with a baseline breach indicator (or create one)
2. View the breach warning details
3. Identify which deliverable caused the breach
4. Understand the breach reason from the message
5. Note the breach timestamp and responsible user

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.3: Deliverables

---

### UAT-05-03-001

**Test:** View the Deliverables page and filter by milestone

**Manual Reference:** Part 5, Chapter 5.3 - Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Deliverables from the sidebar
2. Verify all deliverables are displayed
3. Find the Milestone filter
4. Select a specific milestone
5. Verify only deliverables from that milestone are shown
6. Clear the filter and verify all deliverables return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-03-002

**Test:** Open a deliverable side panel and review all tabs

**Manual Reference:** Part 5, Chapter 5.3 - Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click on a deliverable to open its side panel
2. Verify the side panel slides in from the right
3. Review the Details tab
4. Review the Tasks/Checklist tab (if available)
5. Review the Attachments tab
6. Review the History/Activity tab

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-03-003

**Test:** Update deliverable status using the quick status update

**Manual Reference:** Part 5, Chapter 5.3 - Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a deliverable in the list view
2. Locate the quick status dropdown/button
3. Change the status (e.g., Not Started to In Progress)
4. Verify the status updates immediately
5. Verify no need to open full detail panel
6. Verify change persists after refresh

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-03-004

**Test:** Mark acceptance criteria as complete

**Manual Reference:** Part 5, Chapter 5.3 - Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a deliverable with acceptance criteria
2. Find the acceptance criteria list
3. Mark one or more criteria as complete (checkbox)
4. Verify the completion is saved
5. Verify progress indicator updates (if applicable)
6. Verify completion persists after refresh

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-03-005

**Test:** Request sign-off on a delivered deliverable

**Manual Reference:** Part 5, Chapter 5.3 - Deliverables

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a deliverable with status "Delivered"
2. Locate the sign-off request button
3. Click to request customer sign-off
4. Add any required notes or comments
5. Submit the request
6. Verify the deliverable shows "Pending Sign-off" status

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.4: Task Management

---

### UAT-05-04-001

**Test:** Open Task View and verify all tasks display

**Manual Reference:** Part 5, Chapter 5.4 - Task Management

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Task View from the sidebar
2. Verify the page loads without errors
3. Verify tasks from all milestones are displayed
4. Verify task details are visible (name, assignee, status)
5. Verify you can sort/filter the task list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-04-002

**Test:** Filter tasks by component using the dropdown

**Manual Reference:** Part 5, Chapter 5.4 - Task Management

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Task View, find the Component filter dropdown
2. Select a specific component
3. Verify only tasks from that component's deliverables are shown
4. Select a different component
5. Verify the filter changes accordingly
6. Clear the filter and verify all tasks return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-04-003

**Test:** Filter tasks by milestone using chips

**Manual Reference:** Part 5, Chapter 5.4 - Task Management

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Task View, find the milestone filter chips
2. Click on a milestone chip
3. Verify only tasks from that milestone are shown
4. Click on additional milestone chips (if multi-select)
5. Verify combined filtering works correctly
6. Clear all chips and verify all tasks return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-04-004

**Test:** Update task status using quick status update

**Manual Reference:** Part 5, Chapter 5.4 - Task Management

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a task in the Task View list
2. Locate the status dropdown or checkbox
3. Change the task status (e.g., To Do to In Progress)
4. Verify the change is saved immediately
5. Mark a task as complete using the checkbox
6. Verify completion is reflected in the UI

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-04-005

**Test:** Reassign a task to a different team member

**Manual Reference:** Part 5, Chapter 5.4 - Task Management

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a task that is assigned to someone
2. Open the task details or use inline edit
3. Change the assignee to a different team member
4. Save the change
5. Verify the new assignee is displayed
6. Verify the task appears in the new assignee's task list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.5: Baselines

---

### UAT-05-05-001

**Test:** View baseline dates on a milestone

**Manual Reference:** Part 5, Chapter 5.5 - Baselines

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to a project with an established baseline
2. Open a milestone that has baseline dates
3. View the baseline start date
4. View the baseline end date
5. Compare baseline dates to current dates
6. Note any variance displayed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-05-002

**Test:** Enable baseline view in the Planner and see variance indicators

**Manual Reference:** Part 5, Chapter 5.5 - Baselines

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to the Planner
2. Find the baseline view toggle/option
3. Enable baseline view
4. Verify baseline dates are displayed alongside current dates
5. Verify variance indicators show (red/green)
6. Identify items that are ahead or behind baseline

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-05-003

**Test:** Identify a baseline breach warning and understand the cause

**Manual Reference:** Part 5, Chapter 5.5 - Baselines

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone with baseline breach indicator
2. View the breach warning message
3. Identify which deliverable date exceeded the baseline
4. Note the breach reason and timestamp
5. Understand the impact on the milestone
6. Review options for resolving the breach

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-05-004

**Test:** View the Variance Report and interpret the data

**Manual Reference:** Part 5, Chapter 5.5 - Baselines

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports section
2. Find and run the Variance Report
3. Review baseline vs current dates for each milestone
4. Identify the variance (days early/late)
5. Review variance trends
6. Export or print the report if needed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-05-005

**Test:** Access baseline history in Project Settings

**Manual Reference:** Part 5, Chapter 5.5 - Baselines

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings
2. Find the Baseline History section/tab
3. View list of all baselines created
4. Note baseline creation dates
5. Note who created each baseline
6. Review any associated variation references

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.6: Variations

---

### UAT-05-06-001

**Test:** Create a draft variation for a timeline change

**Manual Reference:** Part 5, Chapter 5.6 - Variations

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Variations from the sidebar
2. Click "New Variation" or equivalent button
3. Enter variation title and description
4. Specify the timeline change (e.g., extend milestone date)
5. Provide justification for the change
6. Save as draft

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-06-002

**Test:** Submit a variation for approval

**Manual Reference:** Part 5, Chapter 5.6 - Variations

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a draft variation
2. Review all details are complete
3. Click "Submit for Approval"
4. Confirm the submission
5. Verify status changes to "Pending Approval"
6. Verify notification is sent to approvers

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-06-003

**Test:** View the AI Impact Analysis panel

**Manual Reference:** Part 5, Chapter 5.6 - Variations

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a variation (draft or submitted)
2. Locate the AI Impact Analysis panel
3. Review the impact assessment
4. Note affected milestones/deliverables identified
5. Review risk assessment provided by AI
6. Check for recommended actions

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-06-004

**Test:** Approve or reject a variation (as Customer PM)

**Manual Reference:** Part 5, Chapter 5.6 - Variations

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in as Customer PM (or use View As if available)
2. Navigate to pending variations
3. Open a variation pending your approval
4. Review the variation details and impact analysis
5. Click "Approve" or "Reject"
6. Add comments if required
7. Confirm the action

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-06-005

**Test:** Implement an approved variation and verify plan updates

**Manual Reference:** Part 5, Chapter 5.6 - Variations

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open an approved variation
2. Click "Implement" or equivalent button
3. Confirm the implementation
4. Navigate to the affected plan items
5. Verify dates/values have been updated
6. Verify a new baseline was created (if applicable)
7. Verify breach warnings are cleared (if applicable)

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.7: Calendar

---

### UAT-05-07-001

**Test:** Open the Calendar and view the current month

**Manual Reference:** Part 5, Chapter 5.7 - Calendar

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Calendar from the sidebar
2. Verify the current month is displayed
3. Verify milestones appear on their due dates
4. Verify colour coding is applied (if any)
5. Navigate to previous month and verify data
6. Navigate to next month and verify data

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-07-002

**Test:** Switch between Month, Week, and Timeline views

**Manual Reference:** Part 5, Chapter 5.7 - Calendar

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Calendar, find the view switcher
2. Switch to Month view and verify display
3. Switch to Week view and verify display
4. Switch to Timeline view and verify display
5. Verify data consistency across views
6. Verify interactions work in each view

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-07-003

**Test:** Filter the calendar by component

**Manual Reference:** Part 5, Chapter 5.7 - Calendar

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Calendar view, find the component filter
2. Select a specific component
3. Verify only items from that component display
4. Select multiple components (if supported)
5. Verify combined filtering works
6. Clear filter and verify all items return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-07-004

**Test:** Click a milestone and navigate to its detail page

**Manual Reference:** Part 5, Chapter 5.7 - Calendar

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a milestone in the Calendar view
2. Click on the milestone
3. Verify navigation to milestone detail page (or popup)
4. Verify milestone details are correct
5. Navigate back to Calendar
6. Verify you return to the same view/position

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-07-005

**Test:** Export the calendar as an iCal file

**Manual Reference:** Part 5, Chapter 5.7 - Calendar

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Calendar view, find the Export option
2. Select iCal/ICS export format
3. Download the file
4. Open the file in a calendar application
5. Verify milestones appear with correct dates
6. Verify event names match milestone names

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.8: RAID Log

---

### UAT-05-08-001

**Test:** View the RAID log and filter by type

**Manual Reference:** Part 5, Chapter 5.8 - RAID Log

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to RAID Log from the sidebar
2. Verify all RAID items are displayed
3. Find the type filter (Risks, Assumptions, Issues, Decisions)
4. Select "Risks" and verify only risks display
5. Select "Issues" and verify only issues display
6. Clear filter and verify all items return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-08-002

**Test:** Add a new Risk with probability, impact, and mitigation

**Manual Reference:** Part 5, Chapter 5.8 - RAID Log

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click "Add Item" or "New Risk"
2. Select type as "Risk"
3. Enter title and description
4. Set probability level (Low/Medium/High)
5. Set impact level (Low/Medium/High)
6. Enter mitigation strategy
7. Save and verify the risk appears in the log

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-08-003

**Test:** Add a new Issue and assign an owner

**Manual Reference:** Part 5, Chapter 5.8 - RAID Log

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click "Add Item" or "New Issue"
2. Select type as "Issue"
3. Enter title and description
4. Set severity/priority
5. Assign an owner from the team list
6. Set target resolution date
7. Save and verify the issue appears

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-08-004

**Test:** Update a RAID item status and add a note

**Manual Reference:** Part 5, Chapter 5.8 - RAID Log

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select an existing RAID item
2. Open the item for editing
3. Change the status (e.g., Open to In Progress)
4. Add a note/comment in the history
5. Save the changes
6. Verify status update is reflected
7. Verify note appears in history

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-08-005

**Test:** Close a resolved RAID item

**Manual Reference:** Part 5, Chapter 5.8 - RAID Log

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a RAID item that can be closed
2. Open the item
3. Add resolution notes
4. Change status to "Closed" or "Resolved"
5. Save the changes
6. Verify item shows as closed
7. Verify it can be filtered out of active view

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 5.9: User Journeys - Running Your Project

---

### UAT-05-09-001

**Test:** Complete a Dashboard review and address at least one anomaly

**Manual Reference:** Part 5, Chapter 5.9 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open the Dashboard
2. Review the health score
3. Review all anomaly alerts
4. Click on an anomaly to investigate
5. Take action to address the anomaly (update status, add note, etc.)
6. Return to Dashboard and verify anomaly is resolved

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-09-002

**Test:** Review a milestone and request sign-off

**Manual Reference:** Part 5, Chapter 5.9 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to a milestone that is complete or near-complete
2. Review all deliverables under the milestone
3. Verify all deliverables are delivered/approved
4. Set milestone progress to 100%
5. Change status to request sign-off
6. Verify notification is sent to customer

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-09-003

**Test:** Create, submit, approve, and implement a variation

**Manual Reference:** Part 5, Chapter 5.9 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new variation for a scope change
2. Complete all required fields
3. Submit for approval
4. (As approver) Review and approve the variation
5. Implement the approved variation
6. Verify the project plan reflects the changes
7. Verify baseline is updated appropriately

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-09-004

**Test:** Track a RAID item through its lifecycle (open to closed)

**Manual Reference:** Part 5, Chapter 5.9 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new RAID item (Risk or Issue)
2. Set initial status to Open
3. Add initial assessment notes
4. Update to In Progress as work begins
5. Add progress notes at each update
6. Close the item with resolution notes
7. Verify complete history is preserved

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-05-09-005

**Test:** Approve deliverables and sign off a milestone

**Manual Reference:** Part 5, Chapter 5.9 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. (As Customer PM) Navigate to deliverables pending approval
2. Review each deliverable
3. Approve deliverables that meet acceptance criteria
4. Navigate to the parent milestone
5. Sign off on the milestone
6. Verify milestone status changes to Signed Off
7. Verify payment milestone triggers (if applicable)

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# PART 6: FINANCIAL MANAGEMENT

---

## Chapter 6.1: Timesheets

---

### UAT-06-01-001

**Test:** Create a time entry with milestone and description

**Manual Reference:** Part 6, Chapter 6.1 - Timesheets

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Timesheets from the sidebar
2. Click "Add Entry" or select a day to add time
3. Select a milestone from the dropdown
4. Enter hours worked
5. Add a description of work performed
6. Save the entry
7. Verify entry appears in the timesheet

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-01-002

**Test:** Edit an existing time entry

**Manual Reference:** Part 6, Chapter 6.1 - Timesheets

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find an existing time entry (not yet submitted)
2. Click to edit the entry
3. Change the hours
4. Update the description
5. Change the milestone (optional)
6. Save the changes
7. Verify changes are reflected

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-01-003

**Test:** Submit timesheets for approval

**Manual Reference:** Part 6, Chapter 6.1 - Timesheets

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Ensure you have time entries for the period
2. Find the "Submit" button for the week/period
3. Click Submit
4. Confirm the submission
5. Verify status changes to "Pending Approval"
6. Verify entries are now locked from editing

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-01-004

**Test:** View timesheet status after submission

**Manual Reference:** Part 6, Chapter 6.1 - Timesheets

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. After submitting timesheets
2. View the timesheet summary/status page
3. Verify status shows as "Pending Approval"
4. Check for any notification or indicator
5. Wait for approval and verify status changes to "Approved"
6. Verify approved timesheets cannot be edited

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-01-005

**Test:** Use AI chat to submit timesheets

**Manual Reference:** Part 6, Chapter 6.1 - Timesheets

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open the AI Chat Assistant
2. Type a request like "Submit my timesheets"
3. Review the AI's confirmation prompt
4. Confirm the action
5. Verify timesheets are submitted
6. Verify confirmation message from AI

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 6.2: Expenses

---

### UAT-06-02-001

**Test:** Create an expense with receipt attached

**Manual Reference:** Part 6, Chapter 6.2 - Expenses

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Expenses from the sidebar
2. Click "Add Expense"
3. Enter expense details (date, amount, category)
4. Add a description
5. Upload a receipt image
6. Save the expense
7. Verify expense appears with receipt icon

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-02-002

**Test:** Use AI receipt scanning to auto-fill expense details

**Manual Reference:** Part 6, Chapter 6.2 - Expenses

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click "Add Expense"
2. Upload a receipt image first
3. Click "Scan Receipt" or wait for auto-scan
4. Verify AI extracts vendor name
5. Verify AI extracts amount
6. Verify AI extracts date
7. Review and adjust any incorrect values
8. Save the expense

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-02-003

**Test:** Submit expenses for approval

**Manual Reference:** Part 6, Chapter 6.2 - Expenses

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Ensure you have unsubmitted expenses
2. Select expenses to submit (or use bulk submit)
3. Click "Submit for Approval"
4. Confirm the submission
5. Verify status changes to "Pending Approval"
6. Verify submitted expenses are locked

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-02-004

**Test:** Approve an expense (as manager)

**Manual Reference:** Part 6, Chapter 6.2 - Expenses

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Log in as a user with expense approval rights
2. Navigate to pending expense approvals
3. Review an expense claim
4. View the attached receipt
5. Click "Approve"
6. Verify status changes to "Approved"
7. Verify submitter is notified

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-02-005

**Test:** Reject an expense with feedback (as manager)

**Manual Reference:** Part 6, Chapter 6.2 - Expenses

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. As approver, find a pending expense
2. Review the expense details
3. Click "Reject"
4. Enter rejection reason/feedback
5. Confirm the rejection
6. Verify status changes to "Rejected"
7. Verify submitter can see rejection reason

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 6.3: Finance Profiles

---

### UAT-06-03-001

**Test:** View the finance profile assigned to a project

**Manual Reference:** Part 6, Chapter 6.3 - Finance Profiles

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings
2. Find the Financial or Finance Profile section
3. View the assigned finance profile name
4. Review rate card details
5. Note currency and billing terms
6. Verify profile settings are read-only (if not admin)

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-03-002

**Test:** Create a new finance profile with rate card (as Org Admin)

**Manual Reference:** Part 6, Chapter 6.3 - Finance Profiles

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Organisation Admin
2. Find the Finance Profiles section
3. Click "Create New Profile"
4. Enter profile name
5. Set currency
6. Add rate card entries (role + rate)
7. Save the profile
8. Verify profile appears in the list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-03-003

**Test:** Assign a finance profile to a project

**Manual Reference:** Part 6, Chapter 6.3 - Finance Profiles

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Project Settings → Financial
2. Find the finance profile dropdown
3. Select a different profile (or assign one if none)
4. Save the change
5. Verify the profile is now assigned
6. Verify rate calculations use the new profile

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-03-004

**Test:** Create a rate override for a specific role

**Manual Reference:** Part 6, Chapter 6.3 - Finance Profiles

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. In Project Settings → Financial
2. Find the Rate Overrides section
3. Click "Add Override"
4. Select a role/SFIA level
5. Enter the override rate
6. Save the override
7. Verify override takes precedence over profile rate
8. Verify billing calculations use the override

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-03-005

**Test:** View the billing summary for a project

**Manual Reference:** Part 6, Chapter 6.3 - Finance Profiles

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to the billing/financial summary
2. View total hours logged
3. View calculated billing amount
4. Review breakdown by role/person
5. Review breakdown by milestone
6. Verify calculations match rate card

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 6.4: Partners

---

### UAT-06-04-001

**Test:** Add a partner organisation to a project

**Manual Reference:** Part 6, Chapter 6.4 - Partners

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Partners from the sidebar
2. Click "Add Partner"
3. Enter partner organisation name
4. Add contact details
5. Set partner type/role
6. Save the partner
7. Verify partner appears in the list

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-04-002

**Test:** Create a partner invoice with line items

**Manual Reference:** Part 6, Chapter 6.4 - Partners

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a partner
2. Click "Create Invoice"
3. Enter invoice number/reference
4. Set invoice date
5. Add line items with descriptions and amounts
6. Calculate total
7. Save the invoice
8. Verify invoice appears under the partner

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-04-003

**Test:** Attach an invoice document (PDF)

**Manual Reference:** Part 6, Chapter 6.4 - Partners

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open an existing partner invoice
2. Find the attachments section
3. Upload a PDF invoice document
4. Wait for upload to complete
5. Verify the attachment appears
6. Click to download/view and verify it opens correctly

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-04-004

**Test:** Approve a partner invoice

**Manual Reference:** Part 6, Chapter 6.4 - Partners

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a pending partner invoice
2. Review the invoice details and line items
3. View the attached PDF (if any)
4. Click "Approve"
5. Add approval notes if required
6. Confirm the approval
7. Verify status changes to "Approved"

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-04-005

**Test:** View total partner costs for the project

**Manual Reference:** Part 6, Chapter 6.4 - Partners

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Partners summary view
2. Find the total costs display
3. Verify total is sum of all approved invoices
4. View breakdown by partner
5. View breakdown by status (approved vs pending)
6. Compare against project budget if available

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 6.5: Resources

---

### UAT-06-05-001

**Test:** View the Resources page and see team members

**Manual Reference:** Part 6, Chapter 6.5 - Resources

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Resources from the sidebar
2. Verify all team members are listed
3. View each member's role
4. View allocation percentage
5. View assigned tasks/deliverables
6. Verify data is accurate

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-05-002

**Test:** View resource details including allocation

**Manual Reference:** Part 6, Chapter 6.5 - Resources

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click on a team member to view details
2. View their allocation percentage
3. View their SFIA level/role
4. View their rate (if visible)
5. View assigned deliverables/tasks
6. View hours logged to date

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-05-003

**Test:** Update a resource's allocation percentage

**Manual Reference:** Part 6, Chapter 6.5 - Resources

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Select a team member
2. Find the allocation setting
3. Change the allocation percentage (e.g., 50% to 75%)
4. Save the change
5. Verify the new allocation is displayed
6. Verify change persists after refresh

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-05-004

**Test:** Filter resources by role

**Manual Reference:** Part 6, Chapter 6.5 - Resources

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. On the Resources page, find the role filter
2. Select a specific role (e.g., Developer)
3. Verify only team members with that role display
4. Select a different role
5. Verify filter changes accordingly
6. Clear filter and verify all members return

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-05-005

**Test:** View resource utilisation report

**Manual Reference:** Part 6, Chapter 6.5 - Resources

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports or find utilisation view
2. Run the Resource Utilisation report
3. View utilisation percentage for each resource
4. Identify over-allocated resources (>100%)
5. Identify under-utilised resources
6. Export the report if needed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 6.6: User Journeys - Financial Management

---

### UAT-06-06-001

**Test:** Complete a full week of timesheet entries and submit

**Manual Reference:** Part 6, Chapter 6.6 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Timesheets
2. Add time entries for Monday through Friday
3. Assign each entry to appropriate milestones
4. Add descriptions for each entry
5. Review total hours for the week
6. Submit the timesheet
7. Verify submission is successful

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-06-002

**Test:** Create multiple expenses with receipts and submit

**Manual Reference:** Part 6, Chapter 6.6 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create expense #1 with receipt
2. Use AI scanning to populate details
3. Create expense #2 with receipt
4. Create expense #3 (different category)
5. Review all expenses
6. Submit all expenses for approval
7. Verify all are submitted successfully

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-06-003

**Test:** Process a partner invoice from creation to approval

**Manual Reference:** Part 6, Chapter 6.6 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Add a new partner (if needed)
2. Create an invoice for the partner
3. Add line items with amounts
4. Attach the PDF invoice
5. Submit for internal approval
6. (As approver) Review and approve
7. Verify invoice status is Approved
8. Verify it appears in project costs

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-06-004

**Test:** View billing summary and verify calculations

**Manual Reference:** Part 6, Chapter 6.6 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to billing/financial summary
2. Review total hours
3. Calculate expected amount (hours x rate)
4. Verify system calculation matches
5. Review breakdown by role
6. Verify rate card is applied correctly
7. Check for any discrepancies

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-06-06-005

**Test:** Generate a resource utilisation report

**Manual Reference:** Part 6, Chapter 6.6 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports
2. Find Resource Utilisation report
3. Set date range parameters
4. Generate the report
5. Review utilisation percentages
6. Identify any capacity issues
7. Export or share the report

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# PART 7: REPORTING & AI FEATURES

---

## Chapter 7.1: Reports

---

### UAT-07-01-001

**Test:** Run a Milestone Status Report with date filters

**Manual Reference:** Part 7, Chapter 7.1 - Reports

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports from the sidebar
2. Select "Milestone Status Report"
3. Set start date filter
4. Set end date filter
5. Generate the report
6. Verify milestones within date range are shown
7. Verify status information is accurate

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-01-002

**Test:** Export a report as PDF

**Manual Reference:** Part 7, Chapter 7.1 - Reports

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Generate any report
2. Find the Export button
3. Select PDF format
4. Wait for PDF generation
5. Download the PDF
6. Open and verify formatting is correct
7. Verify all data is included

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-01-003

**Test:** Generate an AI Status Report

**Manual Reference:** Part 7, Chapter 7.1 - Reports

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports
2. Find "AI Status Report" option
3. Click to generate
4. Wait for AI analysis
5. Review the generated narrative
6. Verify key project points are covered
7. Edit the report if needed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-01-004

**Test:** Run a Timesheet Summary report

**Manual Reference:** Part 7, Chapter 7.1 - Reports

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports
2. Select "Timesheet Summary"
3. Set date range
4. Select team members (all or specific)
5. Generate the report
6. Review hours by person
7. Review hours by milestone
8. Verify totals are correct

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-01-005

**Test:** View the RAID Summary report

**Manual Reference:** Part 7, Chapter 7.1 - Reports

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports
2. Select "RAID Summary"
3. Generate the report
4. Review count of items by type (R, A, I, D)
5. Review count by status (Open, In Progress, Closed)
6. Review high-priority items highlighted
7. Export if needed

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 7.2: KPIs

---

### UAT-07-02-001

**Test:** View the KPI dashboard and understand status indicators

**Manual Reference:** Part 7, Chapter 7.2 - KPIs

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to KPIs from the sidebar
2. View the KPI dashboard
3. Identify KPIs in green (on target)
4. Identify KPIs in amber (warning)
5. Identify KPIs in red (off target)
6. Understand what each colour means

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-02-002

**Test:** Click a KPI to view historical trend

**Manual Reference:** Part 7, Chapter 7.2 - KPIs

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. On the KPI dashboard, click a KPI card
2. View the trend chart/graph
3. Identify historical values over time
4. Note when KPI changed status
5. Understand the trend direction
6. Close and return to dashboard

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-02-003

**Test:** Create a custom KPI with target and threshold

**Manual Reference:** Part 7, Chapter 7.2 - KPIs

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click "Add KPI" or equivalent
2. Enter KPI name and description
3. Set the target value
4. Set warning threshold
5. Set critical threshold
6. Set measurement frequency
7. Save the KPI
8. Verify it appears on the dashboard

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-02-004

**Test:** Update a manual KPI value

**Manual Reference:** Part 7, Chapter 7.2 - KPIs

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find a KPI that requires manual update
2. Click to edit or update value
3. Enter the new value
4. Add notes about the measurement
5. Save the update
6. Verify the value is recorded
7. Verify status indicator updates accordingly

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-02-005

**Test:** Generate a KPI Summary Report

**Manual Reference:** Part 7, Chapter 7.2 - KPIs

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports or KPI export
2. Select "KPI Summary Report"
3. Generate the report
4. Review all KPIs and their status
5. Review trends and history
6. Export as PDF if needed
7. Verify report is suitable for stakeholders

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 7.3: AI Intelligence

---

### UAT-07-03-001

**Test:** View the Project Forecast panel on the Dashboard

**Manual Reference:** Part 7, Chapter 7.3 - AI Intelligence

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to the Dashboard
2. Locate the Project Forecast panel
3. Review the AI-generated forecast
4. Note the predicted completion date
5. Note the confidence level
6. Understand factors affecting the forecast

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-03-002

**Test:** Review an Anomaly Alert and investigate

**Manual Reference:** Part 7, Chapter 7.3 - AI Intelligence

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Find an anomaly alert on the Dashboard
2. Read the anomaly description
3. Click to investigate the affected item
4. Review the data that triggered the alert
5. Understand the AI's reasoning
6. Take corrective action if needed
7. Verify anomaly resolves after action

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-03-003

**Test:** Use AI categorisation when creating a RAID item

**Manual Reference:** Part 7, Chapter 7.3 - AI Intelligence

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Create a new RAID item
2. Enter a description
3. Wait for AI categorisation suggestion
4. Review suggested type (Risk, Issue, etc.)
5. Review suggested priority/severity
6. Accept or modify the suggestions
7. Save the item

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-03-004

**Test:** Generate an AI Status Report document

**Manual Reference:** Part 7, Chapter 7.3 - AI Intelligence

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Navigate to Reports or AI features
2. Find "Generate AI Status Report"
3. Click to generate
4. Wait for AI processing
5. Review the narrative summary
6. Check for accuracy of facts
7. Edit any incorrect statements
8. Export for stakeholder distribution

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-03-005

**Test:** View the Quality Assessment panel on a deliverable

**Manual Reference:** Part 7, Chapter 7.3 - AI Intelligence

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open a deliverable with attached files
2. Find the Quality Assessment panel
3. Review the AI quality score
4. Understand the factors in the assessment
5. Note any recommendations
6. Verify assessment updates when files change

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 7.4: AI Chat

---

### UAT-07-04-001

**Test:** Open the Chat Assistant and ask a question about project status

**Manual Reference:** Part 7, Chapter 7.4 - AI Chat

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Click the Chat icon in the bottom-right corner
2. Type "What's the project status?"
3. Wait for AI response
4. Review the status summary provided
5. Verify information is accurate
6. Ask a follow-up question

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-04-002

**Test:** Ask for help on how to use a feature

**Manual Reference:** Part 7, Chapter 7.4 - AI Chat

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open the Chat Assistant
2. Ask "How do I create a variation?"
3. Review the AI's help response
4. Verify instructions are accurate
5. Ask another help question
6. Verify responses are helpful

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-04-003

**Test:** Request to submit timesheets and confirm the action

**Manual Reference:** Part 7, Chapter 7.4 - AI Chat

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Ensure you have unsubmitted timesheet entries
2. Open the Chat Assistant
3. Type "Submit my timesheets"
4. Review the AI's confirmation prompt
5. Review the summary of what will be submitted
6. Confirm the action
7. Verify timesheets are submitted

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-04-004

**Test:** Use chat to update a RAID item status

**Manual Reference:** Part 7, Chapter 7.4 - AI Chat

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open the Chat Assistant
2. Type "Update RAID item [name] to In Progress"
3. Review AI's confirmation of the item
4. Confirm the action
5. Verify the RAID item status changed
6. Navigate to RAID log to confirm

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-04-005

**Test:** Cancel an action request before confirmation

**Manual Reference:** Part 7, Chapter 7.4 - AI Chat

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open the Chat Assistant
2. Request an action (e.g., "Submit my timesheets")
3. When AI asks for confirmation
4. Type "Cancel" or click Cancel button
5. Verify the action is cancelled
6. Verify data was not changed
7. Verify you can request another action

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

## Chapter 7.5: User Journeys - Reporting & AI

---

### UAT-07-05-001

**Test:** Generate an AI Status Report and edit for stakeholders

**Manual Reference:** Part 7, Chapter 7.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Generate an AI Status Report
2. Review the generated content
3. Edit any inaccuracies
4. Add additional context where needed
5. Adjust tone/language for stakeholders
6. Export as PDF
7. Verify report is professional quality

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-05-002

**Test:** Investigate an anomaly alert and take action

**Manual Reference:** Part 7, Chapter 7.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Identify an anomaly alert on Dashboard
2. Click to investigate
3. Understand the cause of the anomaly
4. Determine appropriate action
5. Take action (update status, adjust dates, etc.)
6. Return to Dashboard
7. Verify anomaly is resolved or updated

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-05-003

**Test:** Use Chat Assistant to review status and submit timesheets

**Manual Reference:** Part 7, Chapter 7.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Open Chat Assistant
2. Ask "What's my timesheet status this week?"
3. Review the response
4. Ask "Show my pending time entries"
5. Review the entries listed
6. Say "Submit my timesheets"
7. Confirm and verify submission

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-05-004

**Test:** Prepare materials for a status meeting using multiple reports

**Manual Reference:** Part 7, Chapter 7.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Generate AI Status Report
2. Generate Milestone Status Report
3. Generate RAID Summary Report
4. Generate KPI Summary Report
5. Export all reports as PDFs
6. Review all materials together
7. Verify comprehensive coverage for meeting

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

### UAT-07-05-005

**Test:** Complete an end-of-day review using AI features

**Manual Reference:** Part 7, Chapter 7.5 - User Journeys

#### Execution Record

| Field | Value |
|-------|-------|
| **Status** | ⬜ NOT TESTED |
| **Tested By** | |
| **Test Date** | |
| **Environment** | |

#### Test Steps

1. Review Dashboard for anomalies
2. Address any critical anomalies
3. Use Chat to check "What needs my attention today?"
4. Review AI's prioritised list
5. Complete pending actions
6. Submit any pending timesheets via Chat
7. Verify all end-of-day tasks complete

#### Comments

> _Space for tester notes about execution, observations, or context_

#### If Failed

**Issue Description:**
> _Describe what went wrong - expected vs actual behavior_

**Severity:** ⬜ Blocker | ⬜ Critical | ⬜ Major | ⬜ Minor

#### Discoveries During This Test

**New Features Noticed:**
- [ ] _Feature not documented in manual_

**Documentation Differences:**
- [ ] _Behavior differs from what manual describes_

**Improvement Suggestions:**
- [ ] _Enhancement ideas or UX improvements_

---

# CUMULATIVE DISCOVERIES SUMMARY

---

## All New Features Discovered

| Discovery ID | Part | Checkpoint | Feature Description | Impact |
|--------------|------|------------|---------------------|--------|
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

> _Complete this table as you discover features not documented in the manual_

---

## All Documentation Changes Required

| Change ID | Part | Checkpoint | Current Documentation | Actual Behavior | Priority |
|-----------|------|------------|-----------------------|-----------------|----------|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

> _Complete this table when manual documentation differs from actual system behavior_

---

## All Improvement Suggestions

| Suggestion ID | Part | Checkpoint | Suggestion Description | Business Value | Effort Estimate |
|---------------|------|------------|------------------------|----------------|-----------------|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

> _Complete this table with enhancement ideas and UX improvement suggestions_

---

# SIGN-OFF SECTION

---

## UAT Completion Statement

This User Acceptance Testing Checklist documents the testing of Tracker by Progressive against the User Manual version 1.0.

**Testing Summary:**

| Metric | Count |
|--------|-------|
| Total Checkpoints | 190 |
| Passed | ___ |
| Failed | ___ |
| Not Tested | ___ |
| Skipped | ___ |

**Overall Result:** ⬜ PASSED | ⬜ PASSED WITH CONDITIONS | ⬜ FAILED

**Conditions (if applicable):**
> _List any conditions that must be met before final acceptance_

---

## Stakeholder Sign-Off

### Business Owner

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Date | |
| Signature | |

**Comments:**
> _Business owner notes and acceptance statement_

---

### Project Manager

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Date | |
| Signature | |

**Comments:**
> _Project manager notes and acceptance statement_

---

### Technical Lead

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Date | |
| Signature | |

**Comments:**
> _Technical lead notes and acceptance statement_

---

### QA Lead

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Date | |
| Signature | |

**Comments:**
> _QA lead notes and acceptance statement_

---

### Customer Representative

| Field | Value |
|-------|-------|
| Name | |
| Title | |
| Organisation | |
| Date | |
| Signature | |

**Comments:**
> _Customer representative notes and acceptance statement_

---

## Final Acceptance

**Date of Final Acceptance:** _______________

**Accepted By:** _______________

**Notes:**
> _Final acceptance notes and any outstanding items_

---

_End of UAT Checklist Document_
