# AMSF001 Project Tracker - User Guide

**Last Updated:** 5 December 2025  
**Application Version:** 5.0

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Navigating the Application](#navigating-the-application)
4. [Projects & Milestones](#projects--milestones)
5. [Time & Expense Tracking](#time--expense-tracking)
6. [Partner Management & Invoicing](#partner-management--invoicing)
7. [AI Chat Assistant](#ai-chat-assistant)
8. [User Administration](#user-administration)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In
1. Navigate to https://amsf001-project-tracker.vercel.app
2. Enter your email and password
3. Click "Sign In"

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
| **Partners** | Partner organizations and invoicing |
| **KPIs** | Key Performance Indicators |
| **Quality Standards** | Quality metrics tracking |
| **RAID Log** | Risks, Assumptions, Issues, Dependencies |
| **Users** | User management (Admin only) |

### User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access |
| **Supplier PM** | Manage project, validate timesheets/expenses |
| **Customer PM** | Review deliverables, validate timesheets |
| **Contributor** | Submit timesheets, expenses, edit deliverables |
| **Viewer** | Read-only access |

---

## Dashboard

### Overview
Your command center showing the most important information at a glance. The dashboard displays KPIs, financial metrics, and project progress - all in one place.

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

### Customizing Your Dashboard
1. Click the **Customize** button (top-right)
2. **Drag widgets** to rearrange them
3. **Resize widgets** from corners
4. Your layout **auto-saves**
5. Click **Reset to Default** to restore

---

## Navigating the Application

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
| **Deliverables** | Open deliverable detail page |
| **Resources** | Open resource detail page |
| **Partners** | Open partner detail page |
| **KPIs** | Open KPI detail page |
| **Quality Standards** | Open quality standard detail |
| **Timesheets** | Open validation modal |
| **Expenses** | Open detail modal |

### Editing Items

To edit an item:
1. **Click the row** to open the detail page
2. On the detail page, click **Edit** to modify
3. Make your changes
4. Click **Save**

This keeps list views clean and focused on information.

---

## Projects & Milestones

### Viewing Milestones
1. Click **Milestones** in the menu
2. See all milestones with progress, dates, and status
3. **Click any row** to view full details

### Milestone Information

| Field | Description |
|-------|-------------|
| **Reference** | Unique identifier (MS-001) |
| **Name** | Milestone title |
| **Start/End Date** | Planned timeline |
| **Progress** | Completion percentage |
| **Status** | Not Started, In Progress, Completed |
| **Certificate** | Signing status badge |

### Certificate Badges

| Badge | Meaning |
|-------|---------|
| ✓ Both Signed | Customer and supplier signed |
| Pending | Awaiting signatures |
| – | No certificate yet |

### Deliverables

Each milestone contains deliverables - the actual work items:

1. From **Milestones**, click a milestone
2. View its deliverables in the detail page
3. Or go to **Deliverables** for a full list
4. **Click any deliverable row** to see details

---

## Time & Expense Tracking

### Submitting Timesheets

1. Go to **Timesheets**
2. Click **+ Add Timesheet**
3. Select the resource, date, and hours
4. Add a description
5. Click **Save** (Draft) or **Submit**

### Timesheet Status

| Status | Meaning |
|--------|---------|
| **Draft** | Editable, not yet submitted |
| **Submitted** | Awaiting validation |
| **Validated** | Approved for invoicing |
| **Rejected** | Returned with comments |

### Validating Timesheets (Managers)

1. Go to **Timesheets**
2. Use filters to find **Submitted** timesheets
3. **Click the row** to open the detail modal
4. Review the information
5. Click **Validate** or **Reject**

### Submitting Expenses

1. Go to **Expenses**
2. Click **+ Add Expense**
3. Fill in: Date, Amount, Category, Description
4. Set **Chargeable to Customer** (Yes/No)
5. Attach a receipt if needed
6. Click **Save** or **Submit**

### AI Receipt Scanning

1. When adding an expense, click **Scan Receipt**
2. Upload or photograph your receipt
3. AI extracts: Date, Amount, Category, Description
4. Review and adjust as needed
5. Save the expense

### Expense Categories

| Category | Examples |
|----------|----------|
| Travel | Flights, trains, taxis, mileage |
| Accommodation | Hotels, rentals |
| Sustenance | Meals, refreshments |
| Equipment | Hardware, software |
| Materials | Supplies, consumables |
| Other | Miscellaneous items |

---

## Partner Management & Invoicing

### Viewing Partners

1. Go to **Partners** in the menu
2. See all partners with status (Active/Inactive)
3. **Click any row** to open the partner detail page

### Partner Detail Page

The partner detail page shows:
- Contact information
- Linked resources
- Timesheet history
- Expense history
- Invoice generation

### Generating Invoices

1. **Click a partner row** to open their detail page
2. In the **Invoice Preview** section:
   - Select the period (month or date range)
   - Click **Generate Invoice**
3. Review the invoice breakdown:
   - **Timesheets** - Billable work hours
   - **Expenses (Chargeable)** - Pass-through costs
   - **Expenses (Non-Chargeable)** - Partner costs
   - **Total** - Amount payable

### Saving Invoices

1. Click **Print / Save PDF** at the bottom
2. Use your browser's print dialog
3. Select **Save as PDF**

---

## AI Chat Assistant

### Opening the Assistant

Click the **chat bubble icon** in the bottom-right corner to open the AI assistant.

### What You Can Ask

| Question Type | Example |
|--------------|---------|
| Budget queries | "What's the remaining budget?" |
| Progress updates | "How many milestones are completed?" |
| Resource info | "Who is allocated to MS-002?" |
| Expense summaries | "Show me expenses for November" |
| Timesheet status | "What timesheets need validation?" |

### Response Times

| Query Type | Speed |
|------------|-------|
| Simple questions | ~100ms (instant) |
| Summary queries | 1-2 seconds |
| Complex analysis | 3-5 seconds |

### Tips for Best Results

- Be specific: "What's the budget for MS-003?" vs "Tell me about budgets"
- Ask one thing at a time
- Use natural language - no special syntax needed

---

## User Administration

### Accessing User Management

1. Log in as Admin or Supplier PM
2. Go to **Users** in the menu

### User List

The user list shows:
- User name and avatar
- Email address
- Linked resource (if any)
- Role
- Created date

### Changing a User's Role

1. Find the user in the list
2. **Click their role badge** (e.g., "Contributor")
3. Select the new role from the dropdown
4. Changes save automatically

### Linking Users to Resources

Users can be linked to resources for time/expense tracking:

1. Find the user in the list
2. Click **Link resource** in the "Linked Resource" column
3. Select a resource from the dropdown
4. Click the save icon

### Creating New Users

1. Click **+ Add User** in the header
2. Fill in:
   - Email address
   - Password
   - Full name
   - Role
3. Click **Create User**

### Test Users

Admins can toggle test user visibility:
1. Click **Show Test** in the header
2. Test users appear with amber highlighting
3. Click **Hide Test** to hide them again

---

## Troubleshooting

### Can't Log In

- Verify your email is correct
- Check for caps lock
- Contact your administrator for password reset

### Page Won't Load

1. Refresh the page (Ctrl/Cmd + R)
2. Clear browser cache
3. Try a different browser
4. Check your internet connection

### Data Not Saving

- Ensure all required fields are filled
- Check you have permission to edit
- Look for error messages in red

### AI Chat Not Responding

- Wait a few seconds - complex queries take longer
- Try refreshing the page
- Contact support if issues persist

### Need More Help?

Contact your system administrator or the project team.

---

*AMSF001 User Guide | Version 5.0 | 5 December 2025*
