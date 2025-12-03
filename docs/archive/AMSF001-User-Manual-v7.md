# AMSF001 Project Tracker - User Manual v7.0

**Last Updated:** 1 December 2025  
**Version:** 7.0  
**Application Version:** 4.1

---

## What's New in v7.0

### 🧾 Enhanced Partner Invoicing
- **Redesigned Invoice Summary** - Clear breakdown of chargeable vs non-chargeable expenses
- **Expenses Breakdown Panel** - See total expenses, who paid, and what's billable
- **Print to PDF** - Export complete invoice details for records and billing
- **Supplier Expenses Clarity** - Always visible section with clear messaging

### 🤖 AI Chat Assistant (Coming Soon)
- Ask questions about your data in plain English
- "What do I need to do next?" - Get personalised action items
- Query timesheets, expenses, milestones, and budgets
- Role-aware responses scoped to your permissions

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Partner Invoicing](#partner-invoicing)
4. [Time & Expense Tracking](#time--expense-tracking)
5. [Projects & Milestones](#projects--milestones)
6. [Reports & Analytics](#reports--analytics)
7. [AI Chat Assistant](#ai-chat-assistant)
8. [Settings & Administration](#settings--administration)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In
1. Navigate to https://amsf001-project-tracker.vercel.app
2. Enter your email and password
3. Click "Sign In"

### Navigation
The main menu is on the left side:
- **Dashboard** - Overview and quick access
- **Milestones** - Project milestones and progress
- **Deliverables** - Deliverable tracking
- **Resources** - Team member management
- **Timesheets** - Time entry and approval
- **Expenses** - Expense tracking
- **Partners** - Partner organizations and invoicing
- **Reports** - Analytics and reporting
- **Settings** - Account and project settings

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
1. **Project Progress** - Overall completion percentage
2. **Budget Summary** - Spend vs budget overview
3. **PMO Cost Tracking** - PMO/Non-PMO breakdown
4. **Key Statistics** - Counts of milestones, deliverables, resources
5. **Milestone Certificates** - Signing status summary
6. **Milestones List** - All milestones with spend visualization
7. **KPIs by Category** - Performance metrics
8. **Quality Standards** - Achievement summary

---

## Partner Invoicing

### Generating an Invoice

1. Navigate to **Partners** in the menu
2. Click on a partner name to open their detail page
3. In the **Invoice Preview** section:
   - Select the **Period** (month/custom date range)
   - Click **Generate Invoice**

### Understanding the Invoice Summary

The invoice modal displays a comprehensive breakdown:

#### Top Row - Key Totals
| Card | Description |
|------|-------------|
| **Timesheets** (Blue) | Total timesheet value - all billable |
| **Expenses Billable** (Green) | Partner expenses chargeable to customer |
| **Expenses Non-Billable** (Red) | Partner expenses not chargeable |
| **Invoice Total** (Purple) | Total to be paid by the partner |

#### Expenses Breakdown
| Item | Description |
|------|-------------|
| **Total Expenses** | All expenses in the period |
| **Chargeable to Customer** | Can be passed to customer |
| **Not Chargeable** | Partner absorbs as cost |
| **Paid by Partner** | Included on this invoice |
| **Paid by Supplier** | NOT on this invoice (billed separately) |

### Supplier Expenses

Expenses marked as "Paid by: Supplier" are tracked but **not included** in the partner invoice. These appear in a separate amber section with:
- Clear "NOT ON THIS INVOICE" badge
- Guidance that supplier should invoice customer directly
- Breakdown of chargeable vs non-chargeable supplier expenses

### Printing / Saving as PDF

1. Click **Print / Save PDF** button at bottom of invoice modal
2. A print preview window opens
3. **All timesheets and expenses** are shown (not truncated)
4. Select **Save as PDF** in your print dialog
5. Choose location and save

**Tip:** The PDF includes the full expense breakdown and is formatted for A4 paper.

### Invoice Calculations

```
Invoice Total = Timesheets + All Partner Expenses
              = Timesheets + (Chargeable Partner + Non-Chargeable Partner)

Total Chargeable to Customer = Timesheets + Chargeable Partner + Chargeable Supplier
```

**Example:**
- Timesheets: £8,250.00
- Partner Expenses (Chargeable): £2,066.42
- Partner Expenses (Non-Chargeable): £272.34
- **Invoice Total: £10,588.76** (what partner pays)
- **Chargeable to Customer: £10,316.42** (what customer is billed)

---

## Time & Expense Tracking

### Submitting Timesheets

1. Go to **Timesheets**
2. Click **+ New Timesheet**
3. Enter:
   - Date
   - Hours worked
   - Description of work
4. Click **Save as Draft** or **Submit for Approval**

### Status Workflow
- **Draft** → Editable, not yet submitted
- **Submitted** → Awaiting approval
- **Approved** → Ready for invoicing
- **Rejected** → Returned with comments

### Submitting Expenses

1. Go to **Expenses**
2. Click **+ New Expense**
3. Enter:
   - Date
   - Category (Travel, Sustenance, Equipment, Materials, Other)
   - Amount
   - Description
   - **Procurement Method** (Partner or Supplier)
   - **Chargeable to Customer** (Yes/No)
4. Attach receipt (optional)
5. Click **Save** or **Submit**

### Expense Procurement Methods

| Method | Meaning | Invoice Treatment |
|--------|---------|-------------------|
| **Partner** | Partner paid for this expense | Included in partner invoice |
| **Supplier** | Your company paid directly | NOT on partner invoice |

**Important:** Supplier expenses must be reconciled separately. The system tracks them but the supplier should invoice the customer directly.

---

## Projects & Milestones

### Viewing Milestones
1. Go to **Milestones**
2. See all milestones with:
   - Status (Not Started, In Progress, Completed, At Risk)
   - Progress percentage
   - Due date
   - Budget vs spend

### Milestone Status Colors
- 🟢 **Green** - Completed or on track
- 🟡 **Amber** - In progress, needs attention
- 🔴 **Red** - At risk or overdue
- ⚪ **Grey** - Not started

### Deliverables
Each milestone contains deliverables:
1. Click a milestone to see its deliverables
2. Track status: Not Started → In Progress → Completed
3. Mark deliverables complete as work finishes

---

## Reports & Analytics

### Available Reports
- **Budget Summary** - Overall spend vs forecast
- **Timesheet Reports** - Hours by resource, partner, period
- **Expense Reports** - Spend by category, resource
- **Milestone Progress** - Timeline and completion status
- **KPI Dashboard** - Performance metrics

### Generating Reports
1. Click **Reports** in the menu
2. Select report type
3. Set filters (date range, resource, partner)
4. Click **Generate**
5. View on screen or export

---

## AI Chat Assistant

### Overview

The AI Chat Assistant lets you query your project data using natural language. Click the chat icon in the bottom-right corner to ask questions about timesheets, expenses, milestones, budgets, and more.

### How to Use

1. Click the **chat icon** (💬) in the bottom-right corner
2. Type your question in plain English
3. The AI queries your data in real-time
4. Responses show a small database icon (🗄️) when data was queried

### Example Queries

**For Resources:**
- "What timesheets do I need to submit?"
- "Show my timesheets this month"
- "What expenses are waiting for approval?"

**For Partners:**
- "What's our invoice total for November?"
- "Which team members have outstanding timesheets?"
- "What's our spend against budget?"

**For Approvers:**
- "What's waiting for my approval?"
- "Show me submitted expenses over £100"
- "How many timesheets are pending?"

**For Project Managers:**
- "What milestones are at risk?"
- "What's the project spend to date?"
- "What's the budget status?"

**For Everyone:**
- "What do I need to do next?" - Shows your pending actions
- "What can my role do?" - Explains your permissions
- "Show me the KPIs" - Performance indicators

### Data Privacy

All queries respect your role permissions:
- **Resources** see only their own timesheets and expenses
- **Partner users** see only their partner's data
- **Approvers** see items awaiting their approval
- Cost prices are only visible to Admin and Supplier PM roles
4. Receive a clear, conversational response

**Note:** All queries will be scoped to data you have permission to see. Partner users will only see their partner's data, resources will only see their own timesheets and expenses.

---

## Settings & Administration

### Account Settings
1. Click your name in the top-right
2. Select **Account Settings**
3. Update profile, email preferences, password

### User Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Full access to all features and settings |
| **Supplier PM** | Full project visibility, partner management |
| **Partner Admin** | Partner data access, approval capabilities |
| **Partner User** | Partner data access (read/write) |
| **Resource** | Own timesheets and expenses only |
| **Viewer** | Read-only access |

### Audit Log
For admins - view all system activity:
1. Go to **Settings** → **Audit Log**
2. Filter by user, action, date
3. Export for compliance

### Deleted Items Recovery
1. Go to **Settings** → **Deleted Items**
2. View items deleted in last 30 days
3. Select and click **Restore**

---

## Troubleshooting

### Invoice Issues

#### "Invoice shows £0.00 for expenses"
**Cause:** Expenses are likely still in Draft status
**Solution:** Submit or approve expenses before generating invoice

#### "Supplier expenses not appearing"
**Cause:** Supplier expenses are intentionally excluded from partner invoices
**Solution:** This is correct behavior - supplier should bill customer directly

#### "Print shows truncated data"
**Solution:** 
- Use the **Print / Save PDF** button (not browser print)
- Ensure print preview shows all entries
- Try landscape orientation for wide tables

### Dashboard Issues

#### "Widgets won't drag"
**Solution:**
- Click the drag handle (⋮⋮ icon in top-right of widget)
- Refresh the page
- Check screen width (dragging disabled on mobile)

#### "Layout doesn't save"
**Solution:**
- Wait 1-2 seconds after changes
- Check internet connection
- Log out and back in

### Login Issues

#### "Session expired"
**Solution:** Normal after 24 hours - simply log in again

#### "Can't log in"
**Solution:**
- Check email and password
- Try password reset
- Contact administrator

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + H` | Go to Dashboard |
| `Ctrl/Cmd + M` | Go to Milestones |
| `Ctrl/Cmd + T` | Go to Timesheets |
| `Ctrl/Cmd + S` | Save current form |
| `Esc` | Close dialogs |
| `C` | Open Customize panel (Dashboard) |

---

## Getting Help

### In-App Support
- Click the chat icon in the bottom-right corner
- AI assistant can query your data and answer questions

### Documentation
- This user manual
- Tooltips throughout the application
- Context-sensitive help

### Contact
- Administrator: Via Settings → Contact Admin
- Technical Support: GitHub Issues

---

*User Manual Version: 7.0 | Last Updated: 1 December 2025*
