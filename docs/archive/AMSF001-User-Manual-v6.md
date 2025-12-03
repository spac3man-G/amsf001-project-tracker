# AMSF001 Project Tracker - User Manual v6.0

**Last Updated:** 1 December 2025  
**Version:** 6.0  
**Application Version:** 4.0

---

## What's New in v6.0

### 🎉 Interactive Dashboard
- **Drag-and-Drop Widgets** - Rearrange your dashboard by dragging widgets
- **Resize Widgets** - Adjust widget sizes to your preference
- **Auto-Save** - Your layout automatically saves as you customize
- **Visual Feedback** - See exactly where widgets will land
- **Mobile Friendly** - Adapts to any screen size

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Customizing Your Dashboard](#customizing-your-dashboard)
4. [Projects & Milestones](#projects--milestones)
5. [Resources & Time Tracking](#resources--time-tracking)
6. [Financial Management](#financial-management)
7. [Reports & Analytics](#reports--analytics)
8. [Settings & Administration](#settings--administration)

---

## Getting Started

### Logging In
1. Navigate to https://amsf001.vercel.app
2. Enter your email and password
3. Click "Sign In"

### First Time Setup
1. Complete your profile
2. Select your default project
3. Familiarize yourself with the dashboard
4. Customize your widget layout

### Navigation
The main menu is on the left side:
- **Dashboard** - Overview and quick access
- **Milestones** - Project milestones and progress
- **Deliverables** - Deliverable tracking
- **Resources** - Team member management
- **Timesheets** - Time entry and approval
- **Expenses** - Expense tracking
- **Partners** - Partner organizations
- **Reports** - Analytics and reporting
- **Settings** - Account and project settings

---

## Dashboard

### Overview
The Dashboard is your command center, showing the most important information at a glance. As of v4.0, you can now fully customize the layout by dragging, dropping, and resizing widgets.

### Available Widgets

#### 1. Project Progress
**What it shows:** Overall project completion percentage

**Key information:**
- Current completion %
- Progress visualization
- Status indicator

**Size:** Full width, adjustable height

#### 2. Budget Summary
**What it shows:** Total budget and spend to date

**Key information:**
- Total budget allocated
- Amount spent
- Remaining budget
- Spend percentage

**Size:** Half width minimum, adjustable

#### 3. PMO Cost Tracking
**What it shows:** PMO vs Non-PMO budget breakdown

**Key information:**
- PMO costs
- Non-PMO costs
- Budget allocations
- Percentage splits

**Size:** Half width minimum, adjustable

#### 4. Key Statistics
**What it shows:** Count of major items

**Key information:**
- Total milestones
- Total deliverables
- Active resources
- KPI count
- Quality standards count

**Size:** Full width, adjustable height

#### 5. Milestone Certificates
**What it shows:** Certificate signing status summary

**Key information:**
- Certificates pending signature
- Certificates completed
- Signature progress
- Recent activity

**Size:** Full width, adjustable height

#### 6. Milestones List
**What it shows:** All project milestones with spend visualization

**Key information:**
- Milestone name and status
- Billable amount
- Actual spend
- Visual bar chart comparison
- Due dates

**Size:** Minimum 8 columns, 3 rows tall

#### 7. KPIs by Category
**What it shows:** KPI performance grouped by category

**Key information:**
- KPI categories
- Performance metrics
- Trend indicators
- Status by category

**Size:** Half width minimum, adjustable

#### 8. Quality Standards
**What it shows:** Quality standard achievement summary

**Key information:**
- Standards defined
- Standards achieved
- Achievement progress
- Category breakdown

**Size:** Half width minimum, adjustable

### Quick Links
At the top of the dashboard, you'll find quick access to:
- Add Milestone
- Add Deliverable
- Add Resource
- Enter Time
- Submit Expense
- View Reports

---

## Customizing Your Dashboard

### Opening the Customization Panel

1. Look for the **"Customize"** button in the top-right corner of the Dashboard
2. Click the button to open the customization panel
3. The panel slides in from the right side

### Showing/Hiding Widgets

#### To Hide a Widget:
1. Open the customization panel
2. Find the widget in the list
3. Click the eye icon (👁️) next to the widget name
4. The icon changes to a crossed-out eye
5. Click "Apply Changes" at the bottom
6. The widget disappears from your dashboard

#### To Show a Widget:
1. Open the customization panel
2. Find the hidden widget (with crossed-out eye icon)
3. Click the icon to show the widget
4. Click "Apply Changes"
5. The widget appears on your dashboard

### Drag-and-Drop Layout

#### Moving a Widget:

1. **Locate the Drag Handle**
   - Hover over any widget
   - A small grip icon (⋮⋮) appears in the top-right corner
   - This is your drag handle

2. **Start Dragging**
   - Click and hold the drag handle
   - The widget becomes slightly transparent
   - A blue dashed outline shows where the widget will land

3. **Move to New Position**
   - Drag the widget to your desired location
   - Other widgets automatically move out of the way
   - The blue outline follows your cursor

4. **Drop the Widget**
   - Release the mouse button
   - The widget snaps into place
   - Other widgets rearrange to fit
   - Your layout auto-saves after 1 second

#### Tips for Dragging:
- **Only use the drag handle** - Clicking elsewhere won't drag
- **Watch the blue outline** - It shows exactly where the widget will go
- **Other widgets move** - They automatically rearrange as you drag
- **Auto-save** - Wait 1 second after dropping for auto-save

### Resizing Widgets

#### Making a Widget Bigger or Smaller:

1. **Locate the Resize Handle**
   - Hover over the bottom-right corner of any widget
   - Small gray lines appear in the corner
   - This is your resize handle

2. **Start Resizing**
   - Click and hold the resize handle
   - The widget highlights slightly

3. **Adjust Size**
   - Drag to make the widget larger
   - Drag back to make it smaller
   - Widgets have minimum and maximum sizes

4. **Release to Finalize**
   - Release the mouse button
   - The widget locks to grid size
   - Your layout auto-saves after 1 second

#### Size Constraints:

Each widget has limits to ensure readability:

| Widget | Min Width | Min Height | Max Height |
|--------|-----------|------------|------------|
| Progress Hero | 6 columns | 2 rows | 3 rows |
| Budget Summary | 4 columns | 2 rows | 3 rows |
| PMO Tracking | 6 columns | 2 rows | 4 rows |
| Stats Grid | 8 columns | 2 rows | 3 rows |
| Certificates | 6 columns | 2 rows | 3 rows |
| Milestones List | 8 columns | 3 rows | 6 rows |
| KPIs by Category | 4 columns | 3 rows | 5 rows |
| Quality Standards | 4 columns | 3 rows | 5 rows |

**Grid System:**
- Dashboard uses a 12-column grid
- Each row is 100 pixels tall
- Minimum widget width is practical for content display

### Resetting to Defaults

#### When to Reset:
- You want to start fresh
- Layout became messy
- You want the recommended layout for your role

#### How to Reset:

1. Open the customization panel
2. Click **"Reset to Default"** button at the bottom
3. A confirmation dialog appears:
   - "Are you sure you want to reset to default layout?"
4. Click **"Reset"** to confirm
5. Your dashboard returns to the role-based default
6. All positions and visibility reset

#### Default Layouts by Role:

**Admin:**
- All 8 widgets visible
- Optimized comprehensive layout
- Full-width hero and stats
- Side-by-side budget cards

**Supplier PM:**
- 6 widgets visible (budget-focused)
- Progress, budget, PMO tracking prominent
- Stats and milestones included
- KPIs and quality standards hidden by default

**Customer PM:**
- 6 widgets visible (quality-focused)
- Progress and quality standards prominent
- KPIs and certificates included
- Budget widgets hidden by default

**Contributor:**
- 4 widgets visible (simplified)
- Progress, stats, and milestones only
- Budget and compliance widgets hidden
- Clean, focused view

**Viewer:**
- Same as Contributor
- Read-only access to all features

### Auto-Save Behavior

#### How Auto-Save Works:
- **1-Second Delay** - System waits 1 second after you stop moving/resizing
- **Background Save** - Saves silently without interrupting you
- **Visual Indicator** - "Saving..." appears briefly in the panel
- **Confirmation** - "Saved" appears when complete
- **Timestamp** - Shows "Last saved at HH:MM AM/PM"

#### What Gets Saved:
- Widget positions (x, y coordinates)
- Widget sizes (width, height)
- Widget visibility (shown/hidden)
- Per user, per project

#### What Doesn't Get Saved:
- Widget content (always live data)
- Filters or sort orders (separate settings)
- Chart selections (reset on reload)

### Mobile Experience

#### On Tablets (768px - 996px):
- Widgets stack in fewer columns
- Drag-and-drop still works
- Resize handles still available
- Touch-friendly interface

#### On Mobile Phones (< 768px):
- Widgets stack in a single column
- Drag-and-drop disabled (performance)
- Resize disabled (too small)
- Optimized vertical scrolling
- All widgets full-width

#### Switching Devices:
- Your layout saves per device type
- Desktop layout remains on desktop
- Mobile always uses simplified view
- Tablet uses responsive grid

---

## Projects & Milestones

### Viewing Milestones
1. Click **Milestones** in the left menu
2. View list of all project milestones
3. See status, progress, and spend for each

### Adding a Milestone
1. Click **"+ Add Milestone"** button
2. Fill in the form:
   - Milestone Name
   - Description
   - Due Date
   - Billable Amount
   - Status
3. Click **"Create Milestone"**
4. Milestone appears in the list

### Editing a Milestone
1. Find the milestone in the list
2. Click the **Edit** button (pencil icon)
3. Update the information
4. Click **"Save Changes"**

### Milestone Progress
- Progress is calculated automatically from:
  - Deliverable completion
  - Time logged
  - Expenses recorded
- View progress in:
  - Dashboard widgets
  - Milestone list
  - Gantt chart
  - Reports

### Deliverables
Each milestone can have multiple deliverables:

1. Click on a milestone to view details
2. Click the **"Deliverables"** tab
3. See all deliverables for that milestone
4. Add new deliverables with **"+ Add Deliverable"**

---

## Resources & Time Tracking

### Managing Resources
1. Click **Resources** in the menu
2. View all team members and contractors
3. See allocation and utilization

### Adding a Resource
1. Click **"+ Add Resource"** button
2. Enter details:
   - Name
   - Email
   - Role
   - Hourly Rate (if applicable)
   - PMO flag (yes/no)
3. Click **"Create Resource"**

### Timesheet Entry
1. Click **Timesheets** in the menu
2. Click **"+ New Timesheet"** button
3. Select:
   - Resource (yourself or team member)
   - Milestone
   - Date
   - Hours worked
   - Description of work
4. Click **"Submit"**

### Timesheet Approval
For managers and PMs:
1. View pending timesheets
2. Review hours and descriptions
3. Click **"Approve"** or **"Reject"**
4. Add comments if rejecting

---

## Financial Management

### Budget Tracking
View budget status in:
- **Dashboard** - Budget Summary widget
- **Milestones** - Individual milestone budgets
- **Reports** - Detailed financial reports

### Expense Tracking
1. Click **Expenses** in the menu
2. Click **"+ New Expense"** button
3. Enter details:
   - Date
   - Amount
   - Category
   - Description
   - Receipt (upload)
4. Click **"Submit"**

### Partner Invoices
1. Click **Partners** in the menu
2. Select a partner
3. Click **"Invoices"** tab
4. View all invoices for that partner
5. Add new invoice with **"+ New Invoice"**

### Invoice Details
View detailed breakdown:
- Timesheet hours by resource
- Expenses by category
- Milestone allocations
- Totals and subtotals
- Payment status

---

## Reports & Analytics

### Executive Summary
High-level overview including:
- Project status
- Budget summary
- Resource utilization
- Key risks and issues

### Financial Reports
- Budget vs Actual by Milestone
- Spend Analysis
- PMO vs Non-PMO Costs
- Partner Invoicing Summary

### Resource Reports
- Utilization by Resource
- Time Distribution
- Allocation Tracking
- Availability Forecast

### Performance Reports
- KPI Tracking
- Quality Standards Achievement
- Milestone Progress
- Deliverable Status

### Generating Reports
1. Click **Reports** in the menu
2. Select report type
3. Set date range and filters
4. Click **"Generate"**
5. View or download results

---

## Settings & Administration

### Account Settings
1. Click your name in the top-right
2. Select **"Account Settings"**
3. Update:
   - Profile information
   - Email preferences
   - Password
   - Notification settings

### Project Settings
For admins and PMs:
1. Click **Settings** in the menu
2. Select **"Project Settings"**
3. Configure:
   - Project details
   - Budget allocations
   - Team access
   - Workflow rules

### User Management
For admins only:
1. Go to **Settings** → **"Users"**
2. View all users
3. Add users with **"+ Invite User"**
4. Assign roles:
   - Admin
   - Supplier PM
   - Customer PM
   - Contributor
   - Viewer

### Audit Log
For admins:
1. Go to **Settings** → **"Audit Log"**
2. View all system activity
3. Filter by:
   - User
   - Action type
   - Date range
   - Entity type
4. Export for compliance

### Deleted Items Recovery
1. Go to **Settings** → **"Deleted Items"**
2. View items deleted in last 30 days
3. Select item to restore
4. Click **"Restore"**
5. Item returns to original location

---

## Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + H` - Go to Dashboard
- `Ctrl/Cmd + M` - Go to Milestones
- `Ctrl/Cmd + R` - Go to Resources
- `Ctrl/Cmd + T` - Go to Timesheets

### Actions
- `Ctrl/Cmd + N` - New item (context-dependent)
- `Ctrl/Cmd + S` - Save current form
- `Esc` - Close dialogs/panels
- `Ctrl/Cmd + ,` - Open Settings

### Dashboard
- `C` - Open Customize panel
- `R` - Reset to default (when panel open)
- `Esc` - Close Customize panel

---

## Troubleshooting

### Dashboard Issues

#### "Widgets not moving when I drag"
**Solution:**
- Make sure you're clicking the drag handle (⋮⋮ icon in top-right)
- Try refreshing the page
- Check if you're on mobile (dragging disabled < 996px)

#### "My layout doesn't save"
**Solution:**
- Wait 1-2 seconds after making changes
- Check for "Saved" confirmation in customize panel
- Check your internet connection
- Try logging out and back in

#### "Widgets look squished"
**Solution:**
- Try resizing the widget from the bottom-right corner
- Reset to default layout
- Check your screen resolution
- Try zooming out in your browser (Ctrl/Cmd + -)

#### "Customize button missing"
**Solution:**
- Refresh the page
- Clear browser cache
- Check if you're on the Dashboard page
- Try a different browser

### Login Issues

#### "Can't log in"
**Solution:**
- Check username and password
- Try password reset
- Check caps lock is off
- Contact administrator

#### "Session expired"
**Solution:**
- This is normal after 24 hours
- Simply log in again
- Your work is auto-saved

### Performance Issues

#### "Dashboard loading slowly"
**Solution:**
- Check internet connection
- Try refreshing the page
- Clear browser cache
- Close other browser tabs
- Check with IT if persistent

#### "Drag-and-drop is laggy"
**Solution:**
- Close unused widgets (hide them)
- Refresh the page
- Use a supported browser (Chrome, Firefox, Safari, Edge)
- Check computer performance

---

## Best Practices

### Dashboard Organization

**Recommended Layouts:**

1. **Start with defaults** - Use role-based preset first
2. **Most important on top** - Progress and budget usually go first
3. **Group related widgets** - Put budget widgets side-by-side
4. **Full-width for lists** - Milestones and tables need space
5. **Adjust to your workflow** - Customize for your daily tasks

### Timesheet Entry

1. **Enter daily** - Don't wait until end of week
2. **Be specific** - Describe what you worked on
3. **Round to nearest 15 min** - Keeps tracking simple
4. **Tag properly** - Link to correct milestone
5. **Submit promptly** - Don't delay approval

### Expense Management

1. **Upload receipts** - Always attach receipt image
2. **Categorize correctly** - Choose right expense type
3. **Add context** - Brief description helps approval
4. **Submit promptly** - Don't let receipts pile up
5. **Check policy** - Ensure expense is allowed

### Data Quality

1. **Update regularly** - Keep milestone status current
2. **Complete profiles** - Fill in all resource details
3. **Accurate budgets** - Enter correct amounts
4. **Track progress** - Mark deliverables complete
5. **Review reports** - Check data makes sense

---

## Support & Help

### Getting Help

**In-App:**
- Hover over ? icons for tooltips
- Click "Help" in any form
- Check validation messages

**Documentation:**
- User Manual (this document)
- Quick Start Guide
- Video tutorials (coming soon)

**Contact:**
- Email: support@example.com
- Phone: +44 123 456 7890
- Hours: Mon-Fri, 9 AM - 5 PM GMT

### Reporting Issues

When reporting a problem, include:
1. What you were trying to do
2. What happened instead
3. Screenshot if applicable
4. Browser and device type
5. Time issue occurred

### Feature Requests

We welcome suggestions:
1. Email your idea to support
2. Describe the problem it solves
3. Explain your use case
4. Vote on existing requests

---

## Glossary

**Dashboard** - Main overview page showing widgets and quick links

**Widget** - Individual component on dashboard showing specific data

**Drag Handle** - The ⋮⋮ icon used to move widgets around

**Resize Handle** - Corner control for changing widget size

**Milestone** - Major project checkpoint with deliverables

**Deliverable** - Specific output required for milestone completion

**Resource** - Team member or contractor assigned to project

**PMO** - Project Management Office (tracked separately in budgets)

**KPI** - Key Performance Indicator (measurable goal)

**Quality Standard** - Defined quality requirement or metric

**Timesheet** - Record of hours worked on project

**Expense** - Cost incurred for project (travel, materials, etc.)

**Partner** - External organization providing services

**Invoice** - Bill from partner for services rendered

**RLS** - Row Level Security (database access control)

**Audit Log** - Record of all system activity

**Deleted Items** - Temporary storage for removed items (30 days)

---

## Quick Reference Card

### Dashboard Quick Keys
- `C` - Customize
- `R` - Reset (when panel open)
- `Esc` - Close panel

### Widget Actions
- **Hover top-right** - Show drag handle
- **Hover bottom-right** - Show resize handle
- **Drag handle** - Move widget
- **Resize handle** - Change size

### Customization Steps
1. Click "Customize" button
2. Toggle eye icons for visibility
3. Drag widgets to rearrange
4. Resize from corners
5. Click "Apply Changes"
6. Wait for "Saved" confirmation

### Role Defaults
- **Admin** - All 8 widgets
- **Supplier PM** - 6 widgets (budget focus)
- **Customer PM** - 6 widgets (quality focus)
- **Contributor** - 4 widgets (simplified)
- **Viewer** - 4 widgets (read-only)

### Auto-Save
- **Delay** - 1 second
- **Trigger** - After drag or resize
- **Indicator** - "Saving..." then "Saved"
- **Scope** - Per user, per project

---

**Manual Version:** 6.0  
**Last Updated:** 1 December 2025  
**Next Review:** 8 December 2025

---

*For technical documentation, see the Developer Guide and Master Document.*
