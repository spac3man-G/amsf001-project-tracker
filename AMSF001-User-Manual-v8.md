
**Last Updated:** 3 December 2025  
**Version:** 8.0  
**Application Version:** 4.2

---

## What's New in v8.0

### 🖱️ Improved Table Navigation
- **Click anywhere on a row** to view details - no need to find specific links
- Works on all list pages: Milestones, KPIs, Quality Standards, Resources, Partners
- Action buttons (Edit, Delete) still work independently

### 📋 Detail Modals for Workflow Items
- **Timesheets** - Click any row to see full details and Validate/Reject
- **Expenses** - Click any row to review and Validate/Reject
- **Deliverables** - Click any row for Submit/Review/Deliver workflow
- **Network Standards** - Click any row to view and edit status

### ✅ Terminology Update
- "Approved" is now "Validated" throughout the application
- Clearer distinction between approval and validation workflows

### 🤖 AI Assistant Upgrade
- Upgraded to Claude 4.5 Sonnet for better responses
- Improved understanding of complex queries
- More accurate data analysis

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
- **Dashboard** - Overview and quick access
- **Milestones** - Project milestones and progress
- **Deliverables** - Deliverable tracking
- **Resources** - Team member management
- **Timesheets** - Time entry and validation
- **Expenses** - Expense tracking
- **Partners** - Partner organizations and invoicing
- **Reports** - Analytics and reporting
- **Settings** - Account and project settings

---

## Navigating Tables

### Clicking Table Rows
All list pages support **full row clicking** for easy navigation:

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
2. **Click anywhere on a partner row** to open their detail page
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

### Printing / Saving as PDF

1. Click **Print / Save PDF** button at bottom of invoice modal
2. A print preview window opens
3. **All timesheets and expenses** are shown (not truncated)
4. Select **Save as PDF** in your print dialog
5. Choose location and save

---

## Time & Expense Tracking

### Submitting Timesheets

1. Go to **Timesheets**
2. Click **+ New Timesheet**
3. Enter:
   - Date
   - Hours worked
   - Description of work
4. Click **Save as Draft** or **Submit for Validation**

### Status Workflow
- **Draft** → Editable, not yet submitted
- **Submitted** → Awaiting validation
- **Validated** → Ready for invoicing
- **Rejected** → Returned with comments

### Reviewing Timesheets (Managers)
1. Go to **Timesheets**
2. **Click any row** to open the detail modal
3. Review the timesheet details
4. Click **Validate** or **Reject**
5. Add comments if rejecting

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

### AI Receipt Scanning
1. When adding an expense, click **Scan Receipt**
2. Upload or take a photo of your receipt
3. AI automatically extracts:
   - Date
   - Amount
   - Category suggestion
   - Description
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

### Deliverables
1. Go to **Deliverables**
2. **Click any row** to open the detail modal
3. Workflow actions available:
   - **Submit** - Submit for review
   - **Review** - Mark as reviewed
   - **Deliver** - Mark as delivered

---

## Reports & Analytics

### Available Reports
- **Budget Analysis** - Detailed spend breakdown
- **Resource Utilization** - Team allocation
- **Timeline Progress** - Milestone completion trends
- **Financial Summary** - Cost tracking and forecasting

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
- Role-aware responses (you only see your data)

---

## Settings & Administration

### Account Settings
- Update your profile
- Change password
- Notification preferences

### Project Settings (Admin only)
- Project details
- User management
- Role assignments

---

## Troubleshooting

### Common Issues

**Can't edit a milestone?**
- Check your role permissions
- Ensure the milestone isn't locked
- Contact your admin if issues persist

**Timesheet not saving?**
- Check all required fields are filled
- Ensure date is within allowed range
- Try refreshing the page

**Can't see certain data?**
- Data visibility is role-based
- Contact your admin to verify permissions

### Getting Help
- Click the **?** help icon for contextual help
- Use the AI Chat Assistant for questions
- Contact your system administrator

---

*User Manual Version: 8.0 | Last Updated: 3 December 2025*
