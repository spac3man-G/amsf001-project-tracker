# AMSF001 Project Tracker
# User Manual

**Version:** 5.0  
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
8. [Partner Invoicing](#8-partner-invoicing)
9. [Milestones & Deliverables](#9-milestones--deliverables)
10. [KPIs & Quality Standards](#10-kpis--quality-standards)
11. [Reports](#11-reports)
12. [AI Chat Assistant](#12-ai-chat-assistant)
13. [User Roles & Permissions](#13-user-roles--permissions)
14. [Admin Features](#14-admin-features)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 30 Nov 2025 | Initial release |
| 2.0 | 30 Nov 2025 | Added procurement method, per-category expense settings |
| 3.0 | 30 Nov 2025 | Added delete warnings, date filtering |
| 3.1 | 30 Nov 2025 | Expense detail modal, in-modal editing |
| 4.0 | 30 Nov 2025 | Enhanced invoicing with full breakdown, toast notifications |
| **5.0** | **30 Nov 2025** | **Production hardening: Audit Log, Deleted Items, soft delete** |

---

## 1. Introduction

### What is AMSF001 Project Tracker?

The AMSF001 Project Tracker is a web-based application for managing the Network Standards and Design Architectural Services project between Government of Jersey (customer) and JT Telecom (supplier).

### Key Features

- **Time Tracking** - Log and approve billable hours
- **Expense Management** - Track travel, accommodation, and sustenance costs
- **Resource Management** - Manage team members and third-party partners
- **Partner Management** - Track third-party suppliers and generate detailed invoices
- **Enhanced Invoicing** - Full breakdown by resource with chargeable tracking
- **Milestone Tracking** - Monitor project phases and deliverables
- **Performance Metrics** - Track KPIs and quality standards
- **AI Assistant** - Get help and query project data
- **Delete Warnings** - See impact before deleting records
- **Soft Delete** - Deleted items can be recovered
- **Audit Trail** - Track all changes to project data
- **Toast Notifications** - Clear feedback for all actions

### What's New in v5.0

- **Audit Log** - View a complete history of all changes made to project data
- **Deleted Items** - Recover accidentally deleted records
- **Soft Delete** - Items are preserved for recovery instead of permanent deletion
- **Input Protection** - Enhanced security against malicious input
- **Session Management** - Automatic session monitoring

---

## 2. Getting Started

### Accessing the Application

1. Navigate to https://amsf001-project-tracker.vercel.app
2. Log in with your email and password
3. You'll be directed to the Dashboard

### Session Timeout

For security, your session is monitored:
- Sessions are checked every 60 seconds
- If your session expires, you'll be redirected to login
- The login page will show "Session expired - please log in again"

### Understanding Notifications

The app shows toast notifications in the top-right corner:
- **Green (Success)** - Action completed successfully
- **Red (Error)** - Something went wrong
- **Amber (Warning)** - Attention needed
- **Blue (Info)** - General information

Notifications auto-dismiss after a few seconds, or click X to close immediately.

### Navigation

The left sidebar provides access to all features. Drag items to reorder (non-viewers only):

**Core Pages:**
- **Workflow Summary** - Pending actions dashboard
- **Dashboard** - Overview and key metrics
- **Reports** - Detailed project reports
- **Gantt Chart** - Visual project timeline

**Project Data:**
- **Milestones** - Project phases
- **Deliverables** - Project outputs
- **KPIs** - Key performance indicators
- **Quality Standards** - Quality metrics

**Resource Management:**
- **Resources** - Team members
- **Timesheets** - Time tracking
- **Expenses** - Expense tracking
- **Partners** - Third-party management

**Admin (Admin/Supplier PM only):**
- **Users** - User management
- **Settings** - Project configuration
- **Audit Log** - Change history
- **Deleted Items** - Recover deleted records

---

## 3. Dashboard

The Dashboard provides an at-a-glance view of your project:
- Overall progress indicator
- Budget vs spend tracking
- Milestone summary
- Upcoming deadlines
- Recent activity

---

## 4. Timesheets

### Submitting Time

1. Navigate to **Timesheets**
2. Click **Add Time Entry**
3. Select resource, date, and hours
4. Add description of work performed
5. Click **Save** (creates draft) or **Save & Submit**

### Approval Workflow

1. Contributor submits timesheet
2. Customer PM reviews submission
3. Customer PM approves or rejects
4. Approved time becomes billable

### Delete Behaviour

- Deleting a timesheet now **soft deletes** it
- Item can be recovered from **Deleted Items** page
- Delete warning shows hours and cost impact

---

## 5. Expenses

### Adding Expenses

1. Navigate to **Expenses**
2. Click **Add Expense**
3. Select resource and category
4. Enter amount and date
5. Set procurement method (Supplier/Partner)
6. Set chargeable status
7. Upload receipt if required

### Viewing Expense Details

Click any expense row to open the detail modal showing:
- Full reference and status
- Category with icon
- Amount (prominently displayed)
- Procurement method with explanation
- Chargeable status
- Full description and notes
- Receipt downloads

### Editing Expenses

In the detail modal:
1. Click **Edit** button
2. Modify fields as needed
3. Click **Save** or **Cancel**

### Delete Behaviour

- Deleting an expense now **soft deletes** it
- Item can be recovered from **Deleted Items** page
- Delete warning shows amount and category

---

## 6. Resources

### Managing Resources

Resources are team members assigned to the project:
- Name and contact details
- Role and SFIA level
- Daily rate and cost price
- Partner association (if third-party)
- Margin calculation

### Resource Types

- **Internal** - JT employees
- **Third-Party** - Partner resources (linked to a Partner)

### Delete Behaviour

- Deleting a resource now **soft deletes** it
- Warning shows dependent timesheets and expenses count

---

## 7. Partners

### Partner Management

Partners are third-party companies providing resources:
- Company name and contact
- Payment terms
- Linked resources
- Invoice history

### Viewing Partner Details

Click a partner row to see:
- Partner information
- Associated resources
- Recent invoices
- Invoice generation tools

---

## 8. Partner Invoicing

### Invoice Generation

1. Go to Partner Detail page
2. Select date range
3. Click **Preview Invoice**
4. Review breakdown:
   - Timesheets by resource
   - Partner-procured expenses
   - Supplier-procured expenses (info only)
5. Click **Generate Invoice**

### Invoice Breakdown

The invoice modal shows:
- **Timesheet Hours**: Resource, date, hours, rate, status
- **Partner Expenses**: Expenses procured by partner
- **Supplier Expenses**: Expenses procured by supplier (not invoiced)
- **Summary Cards**: Total timesheets, expenses, and invoice total

### Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Created, can be edited |
| Sent | Sent to partner for payment |
| Paid | Partner has paid |
| Cancelled | Voided, not payable |

---

## 9. Milestones & Deliverables

### Milestones

Project phases with:
- Reference number
- Name and description
- Start/end dates
- Status (Not Started, In Progress, Completed)
- Billable amount

### Deliverables

Project outputs linked to milestones:
- Reference number
- Name and description
- Due date
- Workflow status
- Associated KPIs and Quality Standards

---

## 10. KPIs & Quality Standards

### KPIs

Key Performance Indicators tracked:
- Target vs actual values
- Trend indicators
- RAG status (Red/Amber/Green)
- Category grouping

### Quality Standards

Quality metrics including:
- Standard name
- Target value
- Current status
- Measurement frequency

---

## 11. Reports

The Reports page provides:
- Financial summaries
- Resource utilization
- Milestone progress
- Expense breakdowns

---

## 12. AI Chat Assistant

### Accessing the Assistant

Click the chat bubble icon (bottom-right corner) to open the AI assistant.

### Rate Limiting

To ensure fair usage, the chat is limited to **20 requests per minute**. If you exceed this, you'll see a message asking you to wait.

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

## 13. User Roles & Permissions

### Role Overview

| Role | Description |
|------|-------------|
| **Admin** | Full system access, user management |
| **Supplier PM** | JT Programme Manager - manage resources, partners, invoices |
| **Customer PM** | Government PM - approve timesheets, validate chargeable expenses |
| **Contributor** | Team member - submit own time/expenses |
| **Viewer** | Read-only access to dashboard and reports |

### Permission Matrix

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add timesheets | ✓ | ✓ | - | Own only | - |
| Approve timesheets | ✓ | - | ✓ | - | - |
| Add expenses | ✓ | ✓ | - | Own only | - |
| Validate chargeable | - | - | ✓ | - | - |
| Manage resources | ✓ | ✓ | - | - | - |
| Manage partners | ✓ | ✓ | - | - | - |
| Generate invoices | ✓ | ✓ | - | - | - |
| View Audit Log | ✓ | ✓ | - | - | - |
| Restore Deleted | ✓ | ✓ | - | - | - |
| Permanent Delete | ✓ | - | - | - | - |
| Manage users | ✓ | - | - | - | - |

---

## 14. Admin Features

### Audit Log

The Audit Log (Admin/Supplier PM only) shows all changes made to project data:

**Accessing:**
1. Navigate to **Audit Log** in the sidebar
2. View list of all changes

**Filtering:**
- By table (Timesheets, Expenses, etc.)
- By action (Created, Updated, Deleted, Restored)
- By user
- By date range

**Viewing Details:**
- Click **View** on any row
- Expand to see previous and new values
- See exactly what changed

**Actions Logged:**
- INSERT - Record created
- UPDATE - Record modified
- DELETE - Record hard deleted
- SOFT_DELETE - Record archived
- RESTORE - Archived record restored

### Deleted Items

The Deleted Items page (Admin/Supplier PM only) shows soft-deleted records:

**Accessing:**
1. Navigate to **Deleted Items** in the sidebar
2. View items grouped by table

**Filtering:**
- By table type
- Show only items older than 30 days

**Restoring Items:**
1. Find the item you want to restore
2. Click **Restore** button
3. Confirm the action
4. Item is now visible in the application again

**Permanent Deletion (Admin Only):**
1. Find a deleted item
2. Click **Purge** button
3. Confirm permanent deletion
4. Item is gone forever - cannot be recovered

**Best Practices:**
- Review deleted items regularly
- Restore accidentally deleted items promptly
- Purge test data when no longer needed
- Consider keeping items for 90 days before purging

### Test Content Management

The app supports marking content as "test" for easy filtering:
- Toggle "Show Test Content" in the interface
- Test content can be bulk deleted using admin scripts
- See sql/cleanup-test-content.sql for purge script

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
| Approved | Validated and approved |
| Rejected | Rejected, needs revision |

### Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Created, pending review |
| Sent | Sent to partner |
| Paid | Payment received |
| Cancelled | Voided |

---

## Appendix B: Soft Delete Behaviour

All main tables now support soft delete:

| Table | Soft Delete | Audit Logged |
|-------|-------------|--------------|
| Timesheets | ✓ | ✓ |
| Expenses | ✓ | ✓ |
| Resources | ✓ | ✓ |
| Partners | ✓ | ✓ |
| Milestones | ✓ | ✓ |
| Deliverables | ✓ | ✓ |
| KPIs | ✓ | ✓ |
| Quality Standards | ✓ | ✓ |
| Partner Invoices | ✓ | ✓ |

**What happens when you delete:**
1. Item is marked with `is_deleted = true`
2. Deletion timestamp recorded
3. User who deleted recorded
4. Audit log entry created
5. Item hidden from normal views
6. Item appears in Deleted Items page

**Restoring:**
1. Go to Deleted Items
2. Find the item
3. Click Restore
4. Item reappears in normal views
5. Audit log entry created

---

## Appendix C: Partner Invoice Workflow

| Step | Action | Performed By |
|------|--------|--------------|
| 1 | Resources submit timesheets | Contributors |
| 2 | Customer PM approves timesheets | Customer PM |
| 3 | Expenses recorded with procurement method | Contributors |
| 4 | Select date range on Partner Detail | Supplier PM |
| 5 | Review Invoice Preview and breakdown | Supplier PM |
| 6 | Click "Generate Invoice" | Supplier PM |
| 7 | Review detailed invoice modal | Supplier PM |
| 8 | Invoice saved with all line items | System |
| 9 | Mark invoice as Sent | Supplier PM |
| 10 | Partner pays invoice | Partner |
| 11 | Mark invoice as Paid | Supplier PM |

---

## Appendix D: Troubleshooting

### Common Issues

**Session Expired:**
- Your login session has timed out
- Log in again to continue

**Rate Limit Exceeded:**
- Too many AI chat requests
- Wait 1 minute and try again

**Can't see Audit Log or Deleted Items:**
- Only visible to Admin and Supplier PM roles

**Deleted item not appearing:**
- Check the table filter
- Ensure "Show only > 30 days" is unchecked

**Can't restore an item:**
- Check your role permissions
- Only Admin and Supplier PM can restore

**Can't permanently delete:**
- Only Admin can purge deleted items

**Expense not appearing in Invoice Preview:**
- Check procurement method is set to "Partner"
- Check expense is within selected date range
- Check expense status

**Delete button not showing:**
- Check your role permissions
- Contributors can only delete own Draft items

---

*End of User Manual v5.0*
