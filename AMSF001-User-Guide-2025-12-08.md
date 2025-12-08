# AMSF001 Project Tracker - User Guide

**Last Updated:** 7 December 2025  
**Application Version:** 7.0

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Navigating the Application](#3-navigating-the-application)
4. [Project Management (Multi-Tenancy)](#4-project-management-multi-tenancy)
5. [Milestones](#5-milestones)
6. [Deliverables](#6-deliverables)
7. [Time & Expense Tracking](#7-time--expense-tracking)
8. [Partner Management & Invoicing](#8-partner-management--invoicing)
9. [AI Chat Assistant](#9-ai-chat-assistant)
10. [User Administration](#10-user-administration)
11. [Workflows Reference](#11-workflows-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Getting Started

### Logging In

1. Navigate to https://amsf001-project-tracker.vercel.app
2. Enter your email and password
3. Click **Sign In**
4. You'll be taken to the Dashboard for your default project

### Navigation

The main menu is on the left side:

| Menu Item | Purpose |
|-----------|---------|
| **Dashboard** | Overview with KPIs, metrics, and quick stats |
| **Milestones** | Project milestones and completion tracking |
| **Deliverables** | Work items and deliverable management |
| **Resources** | Team members and allocation |
| **Timesheets** | Time entry and validation |
| **Expenses** | Expense claims and validation |
| **Partners** | Partner organisations and invoicing |
| **KPIs** | Key Performance Indicators |
| **Quality Standards** | Quality metrics tracking |
| **RAID Log** | Risks, Assumptions, Issues, Dependencies |
| **Users** | User management (Admin only) |

### Understanding Your Access

Your access is determined by two factors:

1. **Which projects you're assigned to** - You can only see data for projects you're a member of
2. **Your role on each project** - Your permissions may differ between projects

### User Roles

The application uses **project-scoped role-based access control**. This means:

- Your role is specific to each project
- You might be an Admin on one project and a Viewer on another
- Switching projects may change what you can see and do

| Role | Description |
|------|-------------|
| **Admin** | Full system access, can manage users and all data |
| **Supplier PM** | Manages project delivery, validates timesheets/expenses, signs certificates |
| **Customer PM** | Reviews deliverables, validates timesheets, signs acceptance certificates |
| **Contributor** | Submits timesheets and expenses, edits deliverable descriptions and progress |
| **Viewer** | Read-only access to dashboard and reports |

### Role Permissions Summary

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|:-----:|:-----------:|:-----------:|:-----------:|:------:|
| View all data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create milestones | ✓ | ✓ | – | – | – |
| Edit milestones | ✓ | ✓ | – | – | – |
| Sign baseline commitment | ✓ | ✓ | ✓ | – | – |
| Sign acceptance certificate | ✓ | ✓ | ✓ | – | – |
| Create deliverables | ✓ | ✓ | – | – | – |
| Edit deliverables | ✓ | ✓ | – | ✓* | – |
| Submit for review | ✓ | ✓ | – | ✓ | – |
| Accept/reject review | ✓ | – | ✓ | – | – |
| Sign delivery | ✓ | ✓ | ✓ | – | – |
| Submit timesheets | ✓ | ✓ | – | ✓ | – |
| Validate timesheets | ✓ | ✓ | ✓ | – | – |
| Submit expenses | ✓ | ✓ | – | ✓ | – |
| Validate expenses | ✓ | ✓ | ✓ | – | – |
| Use View As feature | ✓ | ✓ | – | – | – |

*Contributors can edit deliverable description and progress, but not name or milestone assignment

---

## 2. Dashboard

### Overview

Your command centre showing the most important information at a glance. The dashboard displays KPIs, financial metrics, and project progress in customisable widgets.

### Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Project Progress** | Overall completion with visual progress ring |
| **Budget Summary** | Spend vs budget overview |
| **PMO Tracking** | PMO/Non-PMO cost breakdown |
| **Key Statistics** | Counts of milestones, deliverables, resources |
| **Timesheets** | Submitted and validated totals |
| **Expenses** | Awaiting and validated amounts |
| **Milestones List** | All milestones with progress bars |

### Customising Your Dashboard

1. Click the **Customise** button (top-right)
2. **Drag widgets** to rearrange them
3. **Resize widgets** from corners
4. Your layout **auto-saves**
5. Click **Reset to Default** to restore the original layout

---

## 3. Navigating the Application

### Click-to-Navigate Pattern

All list pages use a **clean, click-anywhere-to-view** pattern:

- **Click any row** to open the detail page or modal
- **No separate "View" or "Edit" buttons** clutter the table
- **Hover** over a row to see it highlight
- **Cursor changes to pointer** on clickable rows

### Pages and Their Navigation

| Page | Click Row To... |
|------|-----------------|
| **Milestones** | Open milestone detail page |
| **Deliverables** | Open deliverable detail modal |
| **Resources** | Open resource detail page |
| **Partners** | Open partner detail page |
| **KPIs** | Open KPI detail page |
| **Quality Standards** | Open quality standard detail |
| **Timesheets** | Open validation modal |
| **Expenses** | Open detail modal |

### Editing Items

To edit an item:

1. **Click the row** to open the detail page or modal
2. Click the **Edit** button
3. Make your changes
4. Click **Save**

This keeps list views clean and focused on information.

---

## 4. Project Management (Multi-Tenancy)

### Understanding Multi-Project Access

The AMSF001 Project Tracker supports **multi-tenancy**, meaning:

- Users can be members of multiple projects
- Each project has completely separate data
- Your role and permissions are **specific to each project**
- Data from one project cannot be accessed from another

### Switching Projects

If you are assigned to multiple projects, you'll see a **Project Switcher** in the top header bar:

1. **Click the Project Switcher** (shows your current project reference)
2. A dropdown appears showing all your assigned projects
3. Each project shows:
   - **Project Reference** (e.g., AMSF001)
   - **Project Name**
   - **Your Role** on that project
   - **DEFAULT** badge if it's your default project
4. **Click a project** to switch to it
5. The page will reload with data from the selected project

### Project Selection Persistence

- Your project selection is **saved in your browser**
- When you return, you'll be on the same project
- If that project is no longer available, your default project loads

### Different Roles on Different Projects

You may have different roles on different projects. For example:

- **Project A:** Admin (full access)
- **Project B:** Contributor (can only submit timesheets)

When you switch projects:

- Your role badge in the header updates
- Available menu items may change
- Your permissions for actions adjust automatically
- The "View As" feature availability depends on your role

### Single Project Users

If you're only assigned to one project:

- The Project Switcher **does not appear**
- You automatically see data for your assigned project
- No action is needed on your part

### No Project Assignment

If you log in but aren't assigned to any projects:

- You'll see an error message: "No projects assigned"
- Contact your administrator to be added to a project

### Project Role vs Global Role

The application uses **project-scoped roles**:

| Concept | Description |
|---------|-------------|
| **Project Role** | Your role for a specific project (from project assignment) |
| **Effective Role** | The role used for permission checks (may be impersonated via View As) |

Your role badge in the header always shows your **effective role** for the current project.

---

## 5. Milestones

Milestones are the **primary billing units** in the project. They represent major project phases that, when completed, trigger a payment from the customer to the supplier.

### Viewing Milestones

1. Click **Milestones** in the menu
2. See all milestones with progress, dates, and status
3. **Click any row** to view full details

### Milestone Information

| Field | Description |
|-------|-------------|
| **Reference** | Unique identifier (e.g., MS-001) |
| **Name** | Milestone title |
| **Description** | Detailed description of the milestone |
| **Baseline Dates** | Original contracted start and end dates |
| **Forecast Dates** | Current projected start and end dates |
| **Actual Start** | When work actually began |
| **Progress** | Completion percentage (calculated from deliverables) |
| **Status** | Not Started, In Progress, or Completed |

### Financial Structure

Each milestone has a three-tier financial structure:

| Tier | Purpose | When Set |
|------|---------|----------|
| **Baseline** | Original contracted amount | At project start, locked by baseline commitment |
| **Forecast** | Current projected amount | Updated during project as estimates change |
| **Actual** | Final billable amount | Set when milestone is delivered |

This structure allows tracking of budget changes while preserving the original contract values.

### Milestone Status

| Status | Meaning | Progress |
|--------|---------|----------|
| **Not Started** | Work has not begun | 0% |
| **In Progress** | Work is underway | 1-99% |
| **Completed** | All work finished | 100% |

Progress is automatically calculated from the linked deliverables.

### Baseline Commitment (Dual-Signature)

Before work begins, the baseline schedule and budget must be formally agreed by both parties.

**What is locked:**
- Baseline start and end dates
- Baseline billable amount
- Original scope agreement

**Signing the Baseline:**

1. Open the milestone detail page
2. Scroll to the **Baseline Commitment** section
3. If you are the Supplier PM, click **Sign as Supplier PM**
4. If you are the Customer PM, click **Sign as Customer PM**
5. Once both parties have signed, the baseline is locked

**Status Indicators:**

| Status | Meaning |
|--------|---------|
| **Not Signed** | Neither party has signed |
| **Awaiting Customer** | Supplier has signed, waiting for customer |
| **Awaiting Supplier** | Customer has signed, waiting for supplier |
| **Committed** | Both parties have signed, baseline is locked |

Once committed, baseline values cannot be changed. Any changes must go through the change control process.

### Acceptance Certificates

When a milestone is complete, it requires formal acceptance before billing.

**Creating a Certificate:**

1. Ensure milestone progress is 100%
2. Open the milestone detail page
3. Click **Create Certificate** or scroll to the certificate section
4. The certificate is created in draft status

**Signing the Certificate:**

1. **Supplier PM** signs first to confirm delivery
2. **Customer PM** signs to accept the deliverables
3. Once both have signed, the certificate is complete and billing can proceed

**Certificate Status Badges (on Milestones list):**

| Badge | Meaning |
|-------|---------|
| ✓ Both Signed | Certificate complete, ready for billing |
| Awaiting Customer | Supplier signed, customer signature pending |
| Awaiting Supplier | Customer signed, supplier signature pending |
| Pending | Certificate exists but no signatures yet |
| – | No certificate created |

### Linked Deliverables

Each milestone contains one or more deliverables. You can view them:

1. From the milestone detail page, see the **Deliverables** section
2. Or go to **Deliverables** in the menu and filter by milestone

---

## 6. Deliverables

Deliverables are the **work-level tracking units** – discrete outputs (documents, features, components) that contribute to milestone completion.

### Viewing Deliverables

1. Click **Deliverables** in the menu
2. Use filters to narrow by milestone or status
3. **Click any row** to open the detail modal

### Deliverable Information

| Field | Description |
|-------|-------------|
| **Reference** | Unique identifier (e.g., DEL-001) |
| **Name** | Deliverable title |
| **Description** | Detailed description |
| **Milestone** | Parent milestone this belongs to |
| **Due Date** | Derived from the parent milestone's forecast end date |
| **Progress** | Completion percentage (0-100%) |
| **Status** | Current workflow status |

### Deliverable Workflow

Deliverables follow a structured workflow from creation to delivery:

```
Not Started → In Progress → Submitted for Review → Review Complete → Delivered
                                    ↓
                          Returned for More Work
                                    ↓
                            (back to In Progress)
```

### Status Definitions

| Status | Description | Who Acts |
|--------|-------------|----------|
| **Not Started** | Work has not begun | – |
| **In Progress** | Active work underway | Contributor/Supplier |
| **Submitted for Review** | Ready for customer review | Customer PM |
| **Returned for More Work** | Customer requested changes | Contributor/Supplier |
| **Review Complete** | Customer approved, ready for sign-off | Both PMs |
| **Delivered** | Formally accepted and complete | – |

### Working with Deliverables

**Creating a Deliverable:**

1. Go to **Deliverables**
2. Click **+ Add Deliverable**
3. Fill in the reference, name, and description
4. Select the parent milestone
5. Link to relevant KPIs and Quality Standards
6. Click **Save**

**Editing Deliverables (Field-Level Permissions):**

Different roles can edit different fields:

| Field | Who Can Edit |
|-------|-------------|
| **Name** | Supplier PM, Admin |
| **Milestone** | Supplier PM, Admin |
| **Description** | Supplier PM, Admin, Contributor |
| **Progress** | Supplier PM, Admin, Contributor |

When you open edit mode, fields you cannot edit will appear disabled with a note explaining the restriction.

**Updating Progress:**

1. Click the deliverable row to open the detail modal
2. Click **Edit**
3. Adjust the progress slider
4. Status automatically transitions:
   - Progress 0% → "Not Started"
   - Progress 1-99% → "In Progress"
5. Click **Save**

**Submitting for Review:**

1. Complete the work (progress should be 100%)
2. Open the deliverable detail modal
3. Click **Submit for Review**
4. Status changes to "Submitted for Review"
5. Customer PM is now responsible for review

**Customer Review Process:**

1. Customer PM opens the deliverable
2. Reviews the work against requirements
3. Either:
   - Click **Accept Review** → Status becomes "Review Complete"
   - Click **Return for More Work** → Status returns to work state

**Delivery Sign-off (Dual-Signature):**

Once review is complete, both parties sign to formally accept:

1. Open the deliverable (status: "Review Complete")
2. The sign-off section appears
3. **Supplier PM** signs to confirm delivery
4. **Customer PM** signs to accept
5. Once both sign, status becomes "Delivered" and progress locks at 100%

### Linking KPIs and Quality Standards

Deliverables can be linked to KPIs and Quality Standards for tracking:

1. When creating or editing a deliverable
2. Use the **Link to KPIs** selector
3. Use the **Link to Quality Standards** selector
4. Selected items appear as badges on the deliverable

**Assessing KPIs and Quality Standards:**

When marking a deliverable as delivered, you may need to assess whether linked criteria were met:

1. Click **Assess & Sign Off** on a "Review Complete" deliverable
2. For each linked KPI, select **Yes** (criteria met) or **No**
3. For each linked Quality Standard, select **Yes** or **No**
4. Complete the sign-off process

---

## 7. Time & Expense Tracking

### Timesheets

#### Submitting Timesheets

1. Go to **Timesheets**
2. Click **+ Add Timesheet**
3. Select the resource (yourself or a team member)
4. Enter the date and hours worked
5. Add a description of work performed
6. Click **Save** to save as draft, or **Submit** to send for validation

#### Timesheet Status

| Status | Description | Next Action |
|--------|-------------|-------------|
| **Draft** | Saved but not submitted | Edit or Submit |
| **Submitted** | Awaiting validation | Wait for PM review |
| **Validated** | Approved for invoicing | Complete |
| **Rejected** | Returned with comments | Review feedback, resubmit |

#### Filtering Timesheets

Use the filter bar to find timesheets:

- **Quick Select:** This Week, Last Week, This Month, Last Month
- **Month/Year:** Select a specific month
- **Custom Range:** Set specific start and end dates
- **Status:** Filter by Draft, Submitted, Validated, Rejected

#### Validating Timesheets (Managers)

1. Go to **Timesheets**
2. Filter by **Submitted** status
3. **Click the row** to open the detail modal
4. Review: Resource, Date, Hours, Description
5. Click **Validate** to approve or **Reject** with a reason

### Expenses

#### Submitting Expenses

1. Go to **Expenses**
2. Click **+ Add Expense**
3. Fill in:
   - **Date:** When the expense was incurred
   - **Amount:** Cost in pounds
   - **Category:** Travel, Accommodation, Sustenance, Equipment, Materials, Other
   - **Description:** What the expense was for
4. Set **Chargeable to Customer:** Yes if the customer will pay, No if internal
5. Optionally attach a receipt image
6. Click **Save** or **Submit**

#### AI Receipt Scanning

Save time by letting AI extract receipt details:

1. When adding an expense, click **Scan Receipt**
2. Upload or photograph your receipt
3. AI extracts: Date, Amount, Category, Description
4. Review the extracted information
5. Adjust if needed, then save

#### Expense Categories

| Category | Examples |
|----------|----------|
| **Travel** | Flights, trains, taxis, mileage |
| **Accommodation** | Hotels, rentals |
| **Sustenance** | Meals, refreshments during work |
| **Equipment** | Hardware, software, tools |
| **Materials** | Supplies, consumables |
| **Other** | Miscellaneous items |

#### Validating Expenses (Managers)

1. Go to **Expenses**
2. Filter by **Submitted** status
3. **Click the row** to open the detail modal
4. Review details and receipt
5. Click **Validate** or **Reject**

---

## 8. Partner Management & Invoicing

### Viewing Partners

1. Go to **Partners** in the menu
2. See all partners with their status (Active/Inactive)
3. **Click any row** to open the partner detail page

### Partner Information

The partner detail page shows:

- **Contact Details:** Name, email, phone, address
- **Status:** Active or Inactive (toggle inline)
- **Linked Resources:** Team members from this partner
- **Timesheet History:** All timesheets for partner resources
- **Expense History:** All expenses for partner resources

### Generating Invoices

Create invoices for partner work:

1. Open a partner's detail page
2. In the **Invoice Preview** section:
   - Select the period (month or custom date range)
   - Click **Generate Invoice**
3. Review the breakdown:
   - **Timesheets:** Billable work hours × day rate
   - **Expenses (Chargeable):** Pass-through to customer
   - **Expenses (Non-Chargeable):** Partner's internal costs
   - **Total:** Amount payable to partner

### Saving Invoices as PDF

1. Click **Print / Save PDF** at the bottom of the invoice
2. In the browser print dialog, select **Save as PDF**
3. Choose your save location

---

## 9. AI Chat Assistant

### Opening the Assistant

Click the **chat bubble icon** in the bottom-right corner of any page.

### What You Can Ask

| Category | Example Questions |
|----------|-------------------|
| **Budget** | "What's the remaining budget?" |
| | "How much have we spent on MS-002?" |
| **Progress** | "How many milestones are completed?" |
| | "What's the overall project progress?" |
| **Resources** | "Who is allocated to MS-002?" |
| | "Show me resource utilisation" |
| **Expenses** | "Show expenses for November" |
| | "What expenses need validation?" |
| **Timesheets** | "How many hours were logged last week?" |
| | "What timesheets are pending?" |
| **Deliverables** | "Which deliverables are overdue?" |
| | "What's submitted for review?" |
| **Projects** | "What project am I on?" |
| | "What's my role on this project?" |

### Project-Scoped Queries

The AI assistant is **project-aware**:

- All queries are automatically scoped to your current project
- Switching projects changes what data the assistant can access
- The assistant knows your role on the current project

### Response Speed

| Query Type | Typical Speed |
|------------|---------------|
| Simple facts | ~100ms (instant) |
| Summaries | 1-2 seconds |
| Complex analysis | 3-5 seconds |

### Tips for Best Results

- **Be specific:** "What's the budget for MS-003?" works better than "Tell me about budgets"
- **Ask one thing at a time** for clearest responses
- **Use natural language** – no special syntax needed
- **Reference items by name or code** when asking about specifics

---

## 10. User Administration

### Accessing User Management

1. Log in as Admin or Supplier PM
2. Go to **Users** in the menu

### User List

The list shows for each user:

- Avatar and name
- Email address
- Linked resource (if any)
- Role badge
- Account creation date

### Project Assignments

Users are assigned to projects with specific roles. To manage project assignments:

1. This is managed through the database (user_projects table)
2. Each assignment includes:
   - Which project the user can access
   - Their role on that project
   - Whether it's their default project

### Changing a User's Role

Roles are now **project-specific**. To change a user's role on a project:

1. This requires database access or admin tools
2. The change affects only that project
3. The user's role on other projects remains unchanged

### Linking Users to Resources

Link users to resources for time and expense tracking:

1. Find the user in the list
2. In the **Linked Resource** column, click **Link resource**
3. Select a resource from the dropdown
4. Click the save icon

### Creating New Users

1. Click **+ Add User** in the header
2. Fill in:
   - Email address
   - Password
   - Full name
   - Role (this becomes their global role)
3. Click **Create User**
4. Add them to projects via project assignments

### Test Users

Admins can toggle visibility of test accounts:

1. Click **Show Test** in the header
2. Test users appear with amber highlighting
3. Click **Hide Test** to hide them again

Test users are useful for training and demonstrations without affecting real data.

---

## 11. Workflows Reference

### Timesheet Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   DRAFT ──────► SUBMITTED ──────► VALIDATED                    │
│     │               │                                          │
│     │               ▼                                          │
│     │           REJECTED ─────► (edit) ──► SUBMITTED           │
│     │               │                                          │
│     └───────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Actors:
- Contributor: Creates draft, submits
- Supplier PM / Customer PM: Validates or rejects
```

### Expense Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   DRAFT ──────► SUBMITTED ──────► VALIDATED                    │
│     │               │                                          │
│     │               ▼                                          │
│     │           REJECTED ─────► (edit) ──► SUBMITTED           │
│     │               │                                          │
│     └───────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Actors:
- Contributor: Creates draft, submits
- Supplier PM / Customer PM: Validates or rejects
```

### Deliverable Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NOT STARTED ──► IN PROGRESS ──► SUBMITTED FOR REVIEW         │
│                       ▲                    │                    │
│                       │                    ▼                    │
│                       │            ┌──────────────┐             │
│                       │            │   Customer   │             │
│                       │            │   Reviews    │             │
│                       │            └──────┬───────┘             │
│                       │                   │                     │
│                       │         ┌─────────┴─────────┐           │
│                       │         ▼                   ▼           │
│                       │   RETURNED FOR        REVIEW COMPLETE   │
│                       │   MORE WORK                 │           │
│                       │         │                   ▼           │
│                       └─────────┘           ┌──────────────┐    │
│                                             │  Dual Sign   │    │
│                                             │  (Both PMs)  │    │
│                                             └──────┬───────┘    │
│                                                    ▼            │
│                                               DELIVERED         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Actors:
- Contributor/Supplier: Creates, edits, submits for review
- Customer PM: Accepts or returns review
- Both PMs: Sign off on delivery
```

### Milestone Baseline Commitment

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NOT SIGNED ──────────────────────────────────────────────►    │
│       │                                                         │
│       ├──► Supplier PM signs ──► AWAITING CUSTOMER ──┐          │
│       │                                              │          │
│       └──► Customer PM signs ──► AWAITING SUPPLIER ──┤          │
│                                                      │          │
│                                                      ▼          │
│                                                 COMMITTED       │
│                                            (Baseline Locked)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Either party can sign first. Once both have signed, the baseline is locked.
```

### Milestone Acceptance Certificate

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   (Milestone 100% complete)                                     │
│            │                                                    │
│            ▼                                                    │
│   CREATE CERTIFICATE ──► PENDING                                │
│                             │                                   │
│       ┌─────────────────────┴─────────────────────┐             │
│       │                                           │             │
│       ▼                                           ▼             │
│   Supplier signs                             Customer signs     │
│       │                                           │             │
│       ▼                                           ▼             │
│   AWAITING CUSTOMER                      AWAITING SUPPLIER      │
│       │                                           │             │
│       └─────────────────────┬─────────────────────┘             │
│                             ▼                                   │
│                        BOTH SIGNED                              │
│                    (Ready for Billing)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Supplier PM should sign first to confirm delivery.
Customer PM signs to accept and authorise billing.
```

---

## 12. Troubleshooting

### Can't Log In

- Verify your email address is correct
- Check for caps lock on your password
- Contact your administrator for password reset

### No Projects Assigned

If you see "No projects assigned" after logging in:

- Contact your administrator to be added to a project
- You need at least one project assignment to use the application

### Project Switcher Not Appearing

If you don't see the Project Switcher in the header:

- You're only assigned to one project (this is normal)
- Contact your administrator if you should have access to additional projects

### Wrong Role Displayed

If your role seems incorrect for the current project:

- Check you're on the correct project (use Project Switcher)
- Your role is project-specific – you may have different roles on different projects
- Contact your administrator if your role assignment is wrong

### Page Won't Load

1. Refresh the page (Ctrl/Cmd + R)
2. Clear browser cache (Ctrl/Cmd + Shift + Delete)
3. Try a different browser (Chrome, Firefox, Safari)
4. Check your internet connection

### Data Not Saving

- Ensure all required fields (marked *) are filled
- Check you have permission to edit this item
- Look for error messages in red below fields
- Try refreshing and attempting again

### Can't Submit Timesheet/Expense

- Ensure all required fields are complete
- Check you are linked to a resource (ask Admin)
- Verify you have Contributor role or higher on this project

### Can't Sign Certificate/Commitment

- Verify you have Supplier PM or Customer PM role on this project
- Check you're signed in with the correct account
- Ensure the milestone/deliverable is in the correct status

### AI Chat Not Responding

- Wait a few seconds – complex queries take longer
- Try refreshing the page
- Simplify your question
- Contact support if issues persist

### Action Buttons Not Appearing

- Check your role has permission for that action on this project
- Verify the item is in the correct status for that action
- Refresh the page to ensure you have the latest data

### Need More Help?

Contact your system administrator or the project team.

---

*AMSF001 User Guide | Version 7.0 | 7 December 2025*
