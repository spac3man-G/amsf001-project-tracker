# Session Summary - 8 December 2025 (Part 2)

## Feature: Enhanced Project Calendar

### Overview
Expanded the Availability Calendar into a comprehensive **Project Calendar** that combines:
- Team Availability (with half-day/full-day support)
- Milestones (by forecast date)
- Deliverables (by due date)

### Permission Model

| Role | View | Edit Own | Edit Others |
|------|------|----------|-------------|
| **Viewer** | ✅ All | ❌ | ❌ |
| **Contributor** | ✅ All | ✅ | ❌ |
| **Customer PM** | ✅ All | ✅ | ❌ |
| **Supplier PM** | ✅ All | ✅ | ✅ |
| **Admin** | ✅ All | ✅ | ✅ |

- **Anyone** can view the calendar (all team availability, milestones, deliverables)
- **Contributors** can make entries for themselves only
- **Customer PM** can make edits for themselves but view everyone
- **Supplier PM** can edit entries for anyone on the team
- **Admin** has full edit access

### View Types
Users can now select from 5 different calendar views:

| View | Shows | Use Case |
|------|-------|----------|
| **All Events** | Availability + Milestones + Deliverables | Complete project overview |
| **Team Availability** | Only availability entries | Resource planning |
| **Milestones** | Only milestones | Phase tracking |
| **Deliverables** | Only deliverables (list view) | Upcoming work planning |
| **Milestones & Deliverables** | Both, no availability | Schedule overview |

### Availability Enhancements
- **Half-day support**: Can now select Full Day, AM (morning), or PM (afternoon)
- **Status options**: Out of Office, Remote, On-Site
- **Notes**: Optional notes field for context

### Deliverables View Features
- 1/2/3/4 week lookahead selector
- Jump through weeks of the programme
- Shows due date, reference, name, milestone, status
- Overdue items highlighted in red
- Progress indicator for milestones

### Time Navigation
- Week view / Month view toggle
- Previous/Next navigation
- "Today" button to jump to current period
- Date range displayed in header

### File Changes

| File | Change | Version |
|------|--------|---------|
| `src/pages/Calendar.jsx` | **NEW** - Main calendar with role-based permissions | 2.1 |
| `src/pages/Calendar.css` | **NEW** - Complete styling with last-refresh indicator | 2.0 |
| `src/services/calendar.service.js` | **NEW** - Unified calendar service | 1.0 |
| `src/services/index.js` | Updated exports | 2.2 |
| `src/App.jsx` | Changed route from /availability to /calendar | 15.0 |
| `src/lib/navigation.js` | Changed nav item from 'availability' to 'calendar' | 2.1 |
| `sql/P13-resource-availability.sql` | Added `period` column | 1.1 |
| `sql/P13b-add-period-column.sql` | **NEW** - Migration for existing tables | 1.0 |
| `sql/P13c-update-availability-rls.sql` | **NEW** - Updated RLS for Supplier PM/Admin | 1.0 |

### Deleted Files
- `src/pages/Availability.jsx` (replaced by Calendar.jsx)
- `src/pages/Availability.css` (replaced by Calendar.css)
- `src/services/availability.service.js` (replaced by calendar.service.js)

---

## Deployment Instructions

### 1. Database Migration

**Option A: Fresh Install (no existing resource_availability table)**
```sql
-- Run the full P13 migration
-- File: sql/P13-resource-availability.sql
```

**Option B: Upgrade (existing table needs period column)**
```sql
-- Run the upgrade migration
-- File: sql/P13b-add-period-column.sql
```

**Option C: Update RLS Policies (for Supplier PM/Admin edit access)**
```sql
-- Run the RLS update
-- File: sql/P13c-update-availability-rls.sql
```

**For existing installations, run both P13b and P13c.**

### 2. Frontend Deploy
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
git add -A
git commit -m "feat: Enhanced Project Calendar with availability, milestones, deliverables views"
git push origin main
```
Vercel auto-deploys from main branch.

---

## User Guide

### Accessing the Calendar
1. Click **Calendar** in the navigation menu (available to all roles)
2. Default view is "All Events" showing everything

### Switching Views
1. Click the view tabs at the top:
   - **All Events** - Everything together
   - **Team Availability** - Resource availability only
   - **Milestones** - Project milestones only
   - **Deliverables** - Upcoming deliverables list
   - **Milestones & Deliverables** - Combined schedule view

### Setting Your Availability
1. Select "All Events" or "Team Availability" view
2. Click on your row in the calendar grid
3. Select status: Out of Office, Remote, or On-Site
4. Select duration: Full Day, Morning (AM), or Afternoon (PM)
5. Optionally add notes
6. Click Save

### Viewing Upcoming Deliverables
1. Select "Deliverables" view
2. Choose lookahead: 1W, 2W, 3W, or 4W
3. Items grouped by week
4. Click any item to navigate to details

### Navigating Time
- Use **← →** arrows to move between weeks/months
- Click **Today** to return to current period
- Toggle between **Week** and **Month** views

---

## Technical Notes

### Calendar Service API
```javascript
import { calendarService, AVAILABILITY_STATUS, AVAILABILITY_PERIOD } from '../services/calendar.service';

// Get all events for a date range
const events = await calendarService.getAllEvents(projectId, startDate, endDate, {
  showAvailability: true,
  showMilestones: true,
  showDeliverables: true,
  userId: null // or specific user ID
});

// Set availability with period
await calendarService.setAvailability(
  projectId, 
  userId, 
  '2025-12-10', 
  AVAILABILITY_STATUS.REMOTE, 
  AVAILABILITY_PERIOD.AM, 
  'Working from home, afternoon off'
);
```

### Period Values
- `full_day` - Entire day
- `am` - Morning only
- `pm` - Afternoon only

### Status Values
- `out_of_office` - Not available
- `remote` - Working remotely
- `on_site` - Working on-site

---

## Testing Checklist

### Availability
- [ ] Set full-day availability
- [ ] Set AM-only availability
- [ ] Set PM-only availability
- [ ] Clear availability
- [ ] View other team members' availability (read-only)

### Views
- [ ] Switch between all 5 view types
- [ ] Week navigation works
- [ ] Month navigation works
- [ ] Today button works
- [ ] Resource filter works in availability views

### Deliverables View
- [ ] 1W/2W/3W/4W buttons work
- [ ] Items grouped correctly by week
- [ ] Overdue items highlighted
- [ ] Click navigates to deliverables page

### Responsive
- [ ] Works on mobile (768px)
- [ ] Works on tablet (1024px)
- [ ] Works on desktop (1200px+)

---

## Future Enhancements
- Bulk availability entry (select multiple days)
- Recurring patterns (e.g., WFH every Friday)
- Export calendar to iCal
- Dashboard widget showing upcoming week
- Email notifications for availability changes
- Milestone/deliverable due date alerts
