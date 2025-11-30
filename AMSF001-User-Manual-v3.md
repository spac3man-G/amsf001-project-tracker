# AMSF001 Project Tracker
# User Manual

**Version:** 3.0  
**Last Updated:** 30 November 2025  
**Application:** https://amsf001-project-tracker.vercel.app

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Timesheets](#4-timesheets)
5. [Expenses](#5-expenses)
6. [Resources](#6-resources)
7. [Partners](#7-partners)
8. [Milestones & Deliverables](#8-milestones--deliverables)
9. [KPIs & Quality Standards](#9-kpis--quality-standards)
10. [Reports](#10-reports)
11. [AI Chat Assistant](#11-ai-chat-assistant)
12. [User Roles & Permissions](#12-user-roles--permissions)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 30 Nov 2025 | Initial release |
| 2.0 | 30 Nov 2025 | Added procurement method, per-category expense settings, invoice preview |
| **3.0** | **30 Nov 2025** | **Added delete warnings, date filtering on resources, complete feature documentation** |

---

## 1. Introduction

### What is AMSF001 Project Tracker?

The AMSF001 Project Tracker is a web-based application for managing the Network Standards and Design Architectural Services project between Government of Jersey (customer) and JT Telecom (supplier).

### Key Features

- **Time Tracking** - Log and approve billable hours
- **Expense Management** - Track travel, accommodation, and sustenance costs
- **Resource Management** - Manage team members and third-party partners
- **Partner Management** - Track third-party suppliers and generate invoices
- **Milestone Tracking** - Monitor project phases and deliverables
- **Performance Metrics** - Track KPIs and quality standards
- **AI Assistant** - Get help and query project data
- **Delete Warnings** - See impact before deleting records

---

## 2. Getting Started

### Accessing the Application

1. Navigate to https://amsf001-project-tracker.vercel.app
2. Log in with your email and password
3. You'll be directed to the Dashboard

### Navigation

The left sidebar provides access to all features:

- **Dashboard** - Overview and key metrics
- **Gantt Chart** - Visual project timeline
- **Reports** - Detailed project reports
- **Quality Standards** - Quality metrics
- **KPIs** - Key performance indicators
- **Milestones** - Project phases
- **Expenses** - Expense tracking
- **Deliverables** - Project outputs
- **Resources** - Team members
- **Timesheets** - Time tracking
- **Users** - User management (admin only)
- **Settings** - Project configuration
- **Workflow Summary** - Process overview
- **Partners** - Third-party management

---

## 3. Dashboard

The Dashboard provides an at-a-glance view of project status.

### Key Metrics

- **Total Budget** - Overall project budget
- **Budget Used** - Percentage consumed
- **Active Resources** - Current team size
- **Upcoming Milestones** - Next deadlines

### Quick Actions

- View pending approvals
- Access recent timesheets
- Check expense status

---

## 4. Timesheets

### Viewing Timesheets

The Timesheets page displays all time entries with:
- Date and resource
- Hours worked
- Milestone (if linked)
- Status (Draft, Submitted, Approved, Rejected)

### Adding Time Entries

1. Click **"+ Add Timesheet"**
2. Select resource (or auto-fills if you're a contributor)
3. Choose entry mode:
   - **Daily Entry** - Single day, specific hours
   - **Weekly Entry** - Full week summary
4. Enter hours worked
5. Add description (optional)
6. Link to milestone (recommended)
7. Click **Save**

### Submitting for Approval

1. Find your Draft timesheet
2. Click the **Send icon (→)** to submit
3. Status changes to "Submitted"
4. Customer PM will review

### Approving Timesheets (Customer PM)

1. View Submitted timesheets
2. Click **checkmark (✓)** to approve
3. Click **X** to reject (provide reason)

### Deleting Timesheets

When you delete a timesheet, a warning shows:
- Resource name and date
- Hours and days being removed
- Cost impact (calculated from resource cost)
- Warning about report/invoice impact

**Who can delete:**
- Admin/Supplier PM: Any timesheet
- Contributor: Own Draft timesheets only

---

## 5. Expenses

### Expense Categories

- **Travel** - Transport costs (trains, flights, fuel)
- **Accommodation** - Hotel and lodging
- **Sustenance** - Meals and refreshments

### Adding Expenses

1. Click **"+ Add Expense"**
2. Select resource
3. Enter date
4. For each category with costs:
   - Enter amount
   - Add reason/description
   - Set **Chargeable to Customer** (checkbox)
   - Set **Paid by** (Supplier or Partner)
5. Click **Save**

### Per-Category Settings

Each expense category has independent settings:
- **Chargeable to Customer**: Whether the customer pays
- **Procurement Method**: Who paid initially (Supplier or Partner)

Example: Travel might be chargeable and supplier-paid, while accommodation is non-chargeable and partner-paid.

### Procurement Filter

Use the "All Procurement" dropdown to filter:
- **Supplier** - JT paid expenses
- **Partner** - Third-party paid expenses

### Procurement Stats

The stat cards show expense breakdown:
- Total by procurement type
- Amounts awaiting reimbursement

### Submitting Expenses

1. Click the **Send icon (→)** on Draft expenses
2. Status changes to "Submitted"
3. Validation depends on chargeable status:
   - Chargeable → Customer PM validates
   - Non-chargeable → Supplier PM validates

### Deleting Expenses

Delete warning shows:
- Resource and date
- Amount breakdown by category
- Chargeable status
- Procurement method
- Warning about report/invoice impact

---

## 6. Resources

### Viewing Resources

The Resources page shows all team members with:
- Name and role
- Daily rate
- Resource type (Supplier/Partner/Customer)
- Partner association (if third-party)
- Allocation and utilization

### Resource Types

| Type | Description |
|------|-------------|
| **Supplier** | JT internal staff |
| **Partner** | Third-party contractor |
| **Customer** | Government of Jersey staff |

### Adding Resources

1. Click **"+ Add Resource"**
2. Enter details:
   - Name, email, role
   - SFIA level
   - Daily rate
   - Days allocated
3. For third-party resources:
   - Set type to "Partner"
   - Select partner from dropdown
4. Click **Save**

### Resource Detail Page

Click a resource name to view:
- Full resource information
- Cost price and margin (Supplier PM/Admin only)
- Allocation progress bar
- Timesheets for this resource
- Expenses for this resource

### Date Filtering on Resource Detail

Filter timesheets and expenses by date:
1. Use **Month dropdown** for quick selection
2. Or use **custom date pickers** for specific range
3. Click **Clear** to show all time
4. Entry counts update to show filtered results

### Deleting Resources

Delete warning shows count of:
- Timesheets that will be deleted
- Expenses that will be deleted

---

## 7. Partners

### What are Partners?

Partners are third-party companies that provide resources to the project. They need to be invoiced for work done by their staff.

### Viewing Partners

The Partners page shows:
- Company name
- Contact details
- Payment terms
- Number of linked resources
- Active status

### Adding Partners

1. Click **"+ Add Partner"**
2. Enter company name
3. Add contact name and email
4. Set payment terms (default: Net 30)
5. Add notes (optional)
6. Click **Save**

### Partner Detail Page

Click a partner name to access:
- Partner information
- Linked resources list
- Timesheet summary (approved + pending)
- Expense summary (partner-procured only)
- Invoice preview
- Recent invoices

### Date Range Filtering

Filter data by period:
1. Select month from dropdown, OR
2. Enter custom start/end dates
3. Stats and tables update automatically
4. Invoice Preview shows filtered totals

### Invoice Preview Panel

When a date range is selected, you'll see:
- **Timesheets (at cost)**: Total cost for approved timesheets
- **Partner Expenses**: Total partner-procured expenses
- **Invoice Total**: Sum of both

### Generating Invoices

1. Select a date range
2. Review the Invoice Preview totals
3. Click **"Generate Invoice for [Period]"**
4. Invoice is created with:
   - Auto-generated number (INV-2025-001)
   - Line items for each timesheet/expense
   - Totals calculated
5. Modal shows invoice summary
6. Invoice appears in Recent Invoices table

### Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Just created, can be edited |
| Sent | Sent to partner for payment |
| Paid | Partner has paid |
| Cancelled | Voided, not payable |

### Deleting Partners

Delete warning shows:
- Linked resources (will be unlinked, not deleted)
- Timesheets affected
- Expenses affected
- Invoices that will be deleted

---

## 8. Milestones & Deliverables

### Milestones

Project phases with:
- Reference number
- Name and description
- Start/end dates
- Status (Not Started, In Progress, Completed)
- Completion percentage

### Deliverables

Project outputs linked to milestones:
- Reference number
- Name and description
- Due date
- Status
- Associated milestone

---

## 9. KPIs & Quality Standards

### KPIs

Key Performance Indicators tracked:
- Target vs actual values
- Trend indicators
- RAG status (Red/Amber/Green)

### Quality Standards

Quality metrics including:
- Standard name
- Target value
- Current status
- Measurement frequency

---

## 10. Reports

The Reports page provides:
- Financial summaries
- Resource utilization
- Milestone progress
- Expense breakdowns

---

## 11. AI Chat Assistant

### Accessing the Assistant

Click the chat bubble icon (bottom-right corner) to open the AI assistant.

### Capabilities

- Answer questions about your project
- Explain features and functionality
- Help with data interpretation
- Provide guidance on workflows

### Example Questions

- "What's my utilization this month?"
- "How do I submit a timesheet?"
- "Show me pending expenses"
- "Explain the approval process"

---

## 12. User Roles & Permissions

### Role Overview

| Role | Description |
|------|-------------|
| **Admin** | Full system access, user management |
| **Supplier PM** | JT Programme Manager - manage resources, partners, invoices |
| **Customer PM** | Government PM - approve timesheets, validate chargeable expenses |
| **Contributor** | Team member - submit own time/expenses |

### Permission Matrix

| Action | Admin | Supplier PM | Customer PM | Contributor |
|--------|-------|-------------|-------------|-------------|
| View all data | ✓ | ✓ | ✓ | Own only |
| Add timesheets | ✓ | ✓ | - | Own only |
| Submit timesheets | ✓ | ✓ | - | Own only |
| Approve timesheets | ✓ | - | ✓ | - |
| Delete timesheets | Any | Any | - | Own Draft |
| Add expenses | ✓ | ✓ | - | Own only |
| Validate chargeable | - | - | ✓ | - |
| Validate non-chargeable | ✓ | ✓ | - | - |
| Delete expenses | Any | Any | - | Own Draft |
| Manage resources | ✓ | ✓ | - | - |
| See cost prices | ✓ | ✓ | - | - |
| Manage partners | ✓ | ✓ | - | - |
| Generate invoices | ✓ | ✓ | - | - |
| Manage users | ✓ | - | - | - |

---

## Appendix A: Status Definitions

### Timesheet Statuses

| Status | Description |
|--------|-------------|
| Draft | Created but not submitted |
| Submitted | Awaiting Customer PM approval |
| Approved | Approved, billable to customer |
| Rejected | Rejected, needs revision |

### Expense Statuses

| Status | Description |
|--------|-------------|
| Draft | Created but not submitted |
| Submitted | Awaiting validation |
| Approved (Validated) | Validated and approved |
| Rejected | Rejected, needs revision |

### Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Created, pending review |
| Sent | Sent to partner |
| Paid | Payment received |
| Cancelled | Voided |

---

## Appendix B: Partner Invoice Workflow

| Step | Action | Performed By |
|------|--------|--------------|
| 1 | Resources submit timesheets | Contributors |
| 2 | Customer PM approves timesheets | Customer PM |
| 3 | Expenses recorded with "Partner" procurement | Contributors |
| 4 | Select date range on Partner Detail | Supplier PM |
| 5 | Review Invoice Preview totals | Supplier PM |
| 6 | Click "Generate Invoice" | Supplier PM |
| 7 | Review invoice summary | Supplier PM |
| 8 | Mark invoice as Sent | Supplier PM |
| 9 | Partner pays invoice | Partner |
| 10 | Mark invoice as Paid | Supplier PM |

---

## Appendix C: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Esc | Close modals and dialogs |
| Enter | Confirm dialog actions |
| Tab | Navigate between fields |

---

## Appendix D: Troubleshooting

### Common Issues

**Can't see Partners menu:**
- Only visible to Admin and Supplier PM roles

**Expense not appearing in Invoice Preview:**
- Check procurement method is set to "Partner"
- Check expense is within selected date range
- Check expense status is "Approved"

**Timesheet not in partner summary:**
- Resource must be linked to the partner
- Timesheet must be "Approved" status
- Date must be within selected range

**Delete button not showing:**
- Check your role permissions
- Contributors can only delete own Draft items

---

*End of User Manual v3.0*
