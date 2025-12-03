# AMSF001 Project Tracker - User Guide

**Last Updated:** 3 December 2025  
**Application Version:** 4.2

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Navigating Tables](#navigating-tables)
4. [Partner Invoicing](#partner-invoicing)
5. [Time & Expense Tracking](#time--expense-tracking)
6. [Projects & Milestones](#projects--milestones)
7. [Reports & Analytics](#reports--analytics)
8. [AI Chat Assistant](#ai-chat-assistant)
9. [Settings & Administration](#settings--administration)
10. [Troubleshooting](#troubleshooting)

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
| **Dashboard** | Overview and quick access |
| **Milestones** | Project milestones and progress |
| **Deliverables** | Deliverable tracking |
| **Resources** | Team member management |
| **Timesheets** | Time entry and validation |
| **Expenses** | Expense tracking |
| **Partners** | Partner organizations and invoicing |
| **Reports** | Analytics and reporting |
| **Settings** | Account and project settings |

### User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access |
| **Supplier PM** | Manage project, validate items |
| **Customer PM** | Approve milestones, view reports |
| **Contributor** | Submit timesheets, expenses, edit deliverables |
| **Viewer** | Read-only access |

---

## Dashboard

### Overview
Your command center showing the most important information at a glance. The dashboard is fully customizable with drag-and-drop widgets.

### Customizing Your Dashboard
1. Click the **Customize** button (top-right)
2. **Drag widgets** to rearrange them
3. **Resize widgets** from the bottom-right corner
4. Your layout **auto-saves** as you make changes
5. Click **Reset to Default** to restore the standard layout

### Available Widgets

| Widget | Description |
|--------|-------------|
| **Project Progress** | Overall completion percentage with progress ring |
| **Budget Summary** | Spend vs budget overview |
| **PMO Cost Tracking** | PMO/Non-PMO breakdown |
| **Key Statistics** | Counts of milestones, deliverables, resources |
| **Milestone Certificates** | Signing status summary |
| **Milestones List** | All milestones with spend visualization |
| **KPIs by Category** | Performance metrics |
| **Quality Standards** | Achievement summary |

---

## Navigating Tables

### Clicking Table Rows
All list pages support **full row clicking** for easy navigation. Simply click anywhere on a row to view details.

| Page | Click Row To... |
|------|-----------------|
| **Milestones** | Open milestone detail page |
| **KPIs** | Open KPI detail page |
| **Quality Standards** | Open quality standard detail page |
| **Resources** | Open resource detail page |
| **Partners** | Open partner detail page |
| **Timesheets** | Open detail modal (Validate/Reject) |
| **Expenses** | Open detail modal (Validate/Reject) |
| **Deliverables** | Open detail modal (workflow actions) |

### Action Buttons
Action buttons (Edit, Delete, View Certificate) work independently - clicking them won't navigate away from the page.

### Visual Indicators
- **Hover effect** - Row highlights when you hover over it
- **Cursor changes** - Pointer cursor indicates clickable rows
- **Blue text** - Reference numbers shown in blue (e.g., MS-001, KPI-001)


---

## Partner Invoicing

### Generating an Invoice

1. Navigate to **Partners** in the menu
2. **Click anywhere on a partner row** to open their detail page
3. In the **Invoice Preview** section:
   - Select the **Period** (month/custom date range)
   - Click **Generate Invoice**

### Understanding the Invoice Summary

The invoice modal displays a comprehensive breakdown:

| Card | Description |
|------|-------------|
| **Timesheets** (Blue) | Total timesheet value - all billable |
| **Expenses Billable** (Green) | Partner expenses chargeable to customer |
| **Expenses Non-Billable** (Red) | Partner expenses not chargeable |
| **Invoice Total** (Purple) | Total to be paid by the partner |

### Expenses Breakdown

| Item | Description |
|------|-------------|
| **Total Expenses** | All expenses in the period |
| **Chargeable to Customer** | Can be passed to customer |
| **Not Chargeable** | Partner absorbs as cost |
| **Paid by Partner** | Included on this invoice |
| **Paid by Supplier** | NOT on this invoice (billed separately) |

### Supplier Expenses
Expenses marked as "Paid by: Supplier" are tracked but **not included** in the partner invoice. These appear in a separate amber section with clear "NOT ON THIS INVOICE" badge.

### Printing / Saving as PDF
1. Click **Print / Save PDF** button at bottom of invoice modal
2. A print preview window opens
3. **All timesheets and expenses** are shown (not truncated)
4. Select **Save as PDF** in your print dialog

---

## Time & Expense Tracking

### Submitting Timesheets

1. Go to **Timesheets**
2. Click **+ New Timesheet**
3. Enter: Date, Hours worked, Description of work
4. Click **Save as Draft** or **Submit for Validation**

### Timesheet Status Workflow

| Status | Meaning |
|--------|---------|
| **Draft** | Editable, not yet submitted |
| **Submitted** | Awaiting validation |
| **Validated** | Ready for invoicing |
| **Rejected** | Returned with comments |

### Reviewing Timesheets (Managers)
1. Go to **Timesheets**
2. **Click any row** to open the detail modal
3. Review the timesheet details
4. Click **Validate** or **Reject**

### Submitting Expenses

1. Go to **Expenses**
2. Click **+ New Expense**
3. Enter:
   - Date and Amount
   - Category (Travel, Sustenance, Equipment, Materials, Other)
   - Description
   - **Procurement Method** (Partner or Supplier)
   - **Chargeable to Customer** (Yes/No)
4. Attach receipt (optional)
5. Click **Save** or **Submit**

### AI Receipt Scanning
1. When adding an expense, click **Scan Receipt**
2. Upload or take a photo of your receipt
3. AI automatically extracts: Date, Amount, Category, Description
4. Review and adjust as needed

---

## Projects & Milestones

### Viewing Milestones
1. Go to **Milestones**
2. **Click any row** to open the milestone detail page
3. View progress, deliverables, and spend breakdown

### Milestone Certificates
Milestone certificates track formal sign-off:
1. Open a milestone detail page
2. Click **Generate Certificate**
3. Fill in sign-off details
4. Both supplier and customer must sign

### Deliverables Workflow
1. Go to **Deliverables**
2. **Click any row** to open the detail modal
3. Available actions:
   - **Submit** - Submit for review
   - **Review** - Mark as reviewed
   - **Deliver** - Mark as delivered

---

## Reports & Analytics

### Available Reports

| Report | Description |
|--------|-------------|
| **Budget Analysis** | Detailed spend breakdown |
| **Resource Utilization** | Team allocation |
| **Timeline Progress** | Milestone completion trends |
| **Financial Summary** | Cost tracking and forecasting |

### Exporting Data
Most tables support CSV export:
1. Click the **Export** button
2. Choose format (CSV)
3. Download file


---

## AI Chat Assistant

### Accessing the Assistant
Click the **AI Chat** icon in the bottom-right corner of any page.

### Example Questions
- "What tasks are due this week?"
- "Show me the budget status for the project"
- "Who has submitted timesheets this month?"
- "What expenses need approval?"
- "Summarize the milestone progress"

### Capabilities
- Query timesheets, expenses, milestones, budgets
- Get personalized action items
- Data analysis and summaries
- Role-aware responses (you only see data you have access to)

---

## Settings & Administration

### Account Settings
- Update your profile information
- Change password
- Notification preferences

### Project Settings (Admin only)
- Project details and configuration
- User management
- Role assignments

---

## Troubleshooting

### Common Issues

**Can't edit a milestone?**
- Check your role permissions (Admin or Supplier PM required)
- Ensure the milestone isn't locked
- Contact your admin if issues persist

**Timesheet not saving?**
- Check all required fields are filled
- Ensure date is within allowed range
- Try refreshing the page

**Can't see certain data?**
- Data visibility is role-based
- Contact your admin to verify permissions

**Invoice shows wrong amounts?**
- Check expense "Paid by" settings (Partner vs Supplier)
- Verify expense "Chargeable" status
- Ensure timesheets are validated

### Getting Help
- Click the **?** help icon for contextual help
- Use the AI Chat Assistant for questions
- Contact your system administrator

---

*AMSF001 Project Tracker User Guide | Last Updated: 3 December 2025*
