# AMSF001 Project Tracker
# User Manual

**Version:** 2.0  
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
12. [User Roles](#12-user-roles)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 30 Nov 2025 | Initial release |
| **2.0** | **30 Nov 2025** | **Added procurement method, per-category expense settings, invoice preview** |

---

## 1. Introduction

### What is AMSF001 Project Tracker?

The AMSF001 Project Tracker is a web-based application for managing the Network Standards and Design Architectural Services project between Government of Jersey (customer) and JT Telecom (supplier).

### Key Features

- **Time Tracking** - Log and approve billable hours
- **Expense Management** - Track travel, accommodation, and sustenance costs with procurement tracking
- **Resource Management** - Manage team members and third-party partners
- **Milestone Tracking** - Monitor project phases and deliverables
- **Performance Metrics** - Track KPIs and quality standards
- **Partner Management** - Manage third-party suppliers and invoicing
- **AI Assistant** - Get help and query project data

---

## 2. Getting Started

### Logging In

1. Navigate to https://amsf001-project-tracker.vercel.app
2. Enter your email address
3. Enter your password
4. Click "Sign In"

### Navigation

The sidebar on the left provides access to all main features:

- **Dashboard** - Project overview and key metrics
- **Gantt Chart** - Visual project timeline
- **Reports** - Project reports and analytics
- **Quality Standards** - Quality metrics tracking
- **KPIs** - Key performance indicators
- **Milestones** - Project phase management
- **Expenses** - Expense tracking and validation
- **Deliverables** - Milestone outputs
- **Resources** - Team member management
- **Timesheets** - Time entry and approval
- **Partners** - Third-party supplier management (Supplier PM only)

---

## 3. Dashboard

The Dashboard provides an at-a-glance view of project status.

### Key Metrics

- **Project Progress** - Overall completion percentage
- **Budget Status** - Spend vs allocated budget
- **Active Milestones** - Current project phases
- **Pending Approvals** - Items awaiting action

### Quick Actions

- View pending timesheets
- Review expense submissions
- Check upcoming deliverables

---

## 4. Timesheets

### Viewing Timesheets

All users can view timesheet entries. The list shows:
- Date
- Resource name
- Hours worked
- Status (Draft, Submitted, Approved)
- Value

### Adding Time Entries (Contributors, Supplier PM, Admin)

1. Click "Add Timesheet" button
2. Select the date
3. Enter hours worked
4. Add notes (optional)
5. Click "Save"

### Submitting for Approval

1. Find your Draft timesheet entry
2. Click the submit icon (arrow)
3. Entry status changes to "Submitted"

### Approving Timesheets (Customer PM, Admin)

1. View Submitted timesheets
2. Review the entry details
3. Click Approve (✓) or Reject (✗)

---

## 5. Expenses

### Expense Categories

- **Travel** - Flights, trains, taxis, mileage
- **Accommodation** - Hotels, lodging
- **Sustenance** - Meals, refreshments

### Adding Expenses

The expense form allows you to enter multiple categories at once, each with its own settings:

1. Click "Add Expense" button
2. Select the resource name
3. Choose expense date
4. For each category (Travel, Accommodation, Sustenance):
   - Enter the amount (leave blank to skip)
   - Enter a reason/description
   - When an amount is entered, additional options appear:
     - **Chargeable to Customer** - Check if billable to GoJ
     - **Paid by** (Supplier PM only) - Select Supplier (JT) or Partner

5. Add any additional notes
6. Upload receipts if required
7. Click "Save Expenses"

### Per-Category Settings

Each expense category can have different settings. For example:
- Travel: Chargeable, paid by Supplier
- Accommodation: Non-chargeable, paid by Partner
- Sustenance: Chargeable, paid by Partner

This flexibility allows accurate tracking of blended expense claims.

### Procurement Method (Supplier PM only)

Expenses can be marked as:

| Procurement | Description | Invoice Impact |
|-------------|-------------|----------------|
| **Supplier (JT)** | Paid directly by JT Telecom | Not included in partner invoices |
| **Partner** | Paid by partner company | Included in partner invoices for reimbursement |

### Expense Statistics

The Expenses page shows summary cards:
- **Total Budget** - Allocated expense budget
- **Total Claimed** - All expenses submitted
- **Chargeable** - Billable to customer
- **Non-Chargeable** - Internal costs
- **Supplier Procured** - Paid by JT (Supplier PM only)
- **Partner Procured** - Paid by partners (Supplier PM only)

### Filtering Expenses

Filter the expense list by:
- Category (Travel, Accommodation, Sustenance)
- Resource
- Status (Draft, Submitted, Validated, Rejected, Paid)
- Chargeable status
- Procurement method (Supplier PM only)

### Expense Validation

- **Chargeable expenses** - Validated by Customer PM
- **Non-chargeable expenses** - Validated by Supplier PM

### Status Flow

```
Draft → Submitted → Validated/Rejected → Paid
```

---

## 6. Resources

### Viewing Resources

The Resources page shows all team members:
- Name and role
- Daily rate (sell rate)
- Cost price (Supplier PM only)
- Margin percentage (Supplier PM only)
- Resource type (Supplier PM only)

### Resource Types

| Type | Description |
|------|-------------|
| **Supplier** | JT Telecom employees |
| **Partner** | Third-party contractor via partner company |
| **Customer** | Government of Jersey staff |

### Managing Resources (Supplier PM, Admin)

1. Click on a resource name to view details
2. Edit resource information
3. Assign partner (for partner-type resources)
4. Update rates and costs

### Resource Detail Page

Click any resource to see:
- Full contact details
- Rate information
- Partner association (with link to partner)
- Recent timesheets
- Recent expenses
- Edit capabilities

---

## 7. Partners

*Available to Supplier PM and Admin only*

### What are Partners?

Partners are third-party companies that provide resources to the project (e.g., Agilisys, CGI, Progressive).

### Viewing Partners

Navigate to Partners in the sidebar to see:
- Partner company list
- Contact information
- Active/Inactive status
- Number of linked resources

### Adding a Partner

1. Click "Add Partner"
2. Enter company name
3. Add contact name and email
4. Set payment terms (Net 30, Net 45, etc.)
5. Add notes
6. Click "Save"

### Partner Detail Page

Click any partner to see:

**Stats Cards:**
- Linked Resources count
- Days Worked (hours ÷ 8)
- Timesheet Value (at cost price)
- Partner Expenses (partner-procured only)

**Sections:**
- Partner Details: Contact info, payment terms
- Linked Resources: Team members from this partner
- Recent Timesheets: Time entries for partner resources
- Recent Expenses: Expenses for partner resources (with Procured By indicator)

### Date Range Filtering

On the Partner Detail page, filter data by:
- **Month Quick-Select:** Choose from last 12 months
- **Custom Range:** Set specific start and end dates

This filters:
- Stats calculations
- Timesheet list
- Expenses list
- Invoice Preview totals

### Invoice Preview

When a date range is selected, an Invoice Preview panel appears showing:
- **Timesheets (at cost):** Total timesheet value for the period
- **Partner Expenses:** Partner-procured expenses only
- **Invoice Total:** Combined amount payable to partner

### Generate Invoice (Coming Soon)

The "Generate Invoice" button will:
- Create an invoice for the selected period
- Include timesheets at cost rate
- Include partner-procured expenses
- Export to PDF
- Track invoice status

---

## 8. Milestones & Deliverables

### Milestones

Milestones represent major project phases.

Each milestone includes:
- Name and description
- Start and end dates
- Budget allocation
- Status (Not Started, In Progress, Complete)

### Deliverables

Deliverables are specific outputs within milestones.

Each deliverable includes:
- Title and description
- Due date
- Status (Draft, In Review, Accepted)
- Associated milestone

### Review Workflow

```
Draft → Submitted → In Review → Accepted/Rejected
```

---

## 9. KPIs & Quality Standards

### KPIs (Key Performance Indicators)

Track project performance metrics:
- Target values
- Current values
- Status (On Track, At Risk, Off Track)

### Quality Standards

Monitor quality compliance:
- Standard name and description
- Compliance percentage
- Evidence and notes

---

## 10. Reports

### Available Reports

- Project Summary
- Financial Overview
- Resource Utilization
- Milestone Progress

### Export Options

- PDF download
- Excel export (where available)

---

## 11. AI Chat Assistant

### Accessing the Chat

Click the chat bubble icon in the bottom-right corner.

### What You Can Ask

- "What's the project status?"
- "Show me pending timesheets"
- "How much has Glenn logged this month?"
- "What expenses need validation?"
- "Summarize the current milestones"
- "Show partner expenses for Agilisys"

### Tips for Best Results

- Be specific in your questions
- Mention names, dates, or categories when relevant
- Ask follow-up questions to drill down

---

## 12. User Roles

### Role Permissions Summary

| Feature | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|---------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| View timesheets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own timesheets | ❌ | ✅ | ❌ | ✅ | ✅ |
| Approve timesheets | ❌ | ❌ | ✅ | ❌ | ✅ |
| View expenses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own expenses | ❌ | ✅ | ❌ | ✅ | ✅ |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |
| See procurement method | ❌ | ❌ | ❌ | ✅ | ✅ |
| View resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| See cost prices | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage resources | ❌ | ❌ | ❌ | ✅ | ✅ |
| View partners | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage partners | ❌ | ❌ | ❌ | ✅ | ✅ |
| View invoice preview | ❌ | ❌ | ❌ | ✅ | ✅ |
| Access settings | ❌ | ❌ | ❌ | ✅ | ✅ |

### Role Descriptions

**Viewer**
- Read-only access to project data
- Ideal for stakeholders who need visibility

**Contributor**
- Can log own time and expenses
- Typical role for team members

**Customer PM**
- Government of Jersey project manager
- Approves timesheets
- Validates chargeable expenses

**Supplier PM**
- JT Telecom project manager
- Full delivery management
- Manages partners and resources
- Validates non-chargeable expenses
- Access to cost prices and margins
- Views procurement method and invoice previews

**Admin**
- Full system access
- All permissions across all features

---

## Appendix: Quick Reference

### Expense Workflow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Contributor | Creates expense (Draft) |
| 2 | Contributor | Submits for validation |
| 3a | Customer PM | Validates chargeable expenses |
| 3b | Supplier PM | Validates non-chargeable expenses |
| 4 | Finance | Marks as Paid |

### Partner Invoice Workflow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Supplier PM | Selects date range on Partner Detail |
| 2 | Supplier PM | Reviews Invoice Preview totals |
| 3 | Supplier PM | Clicks Generate Invoice |
| 4 | Supplier PM | Downloads PDF |
| 5 | Finance | Processes payment |

---

## Support

For technical issues or questions, contact your system administrator.

---

*User Manual Version: 2.0*  
*Last Updated: 30 November 2025*
