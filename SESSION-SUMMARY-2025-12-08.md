# AMSF001 Project Tracker - Session Summary

**Date:** 8 December 2025  
**Session Focus:** Resource Availability Calendar  
**Status:** ✅ Implementation Complete (Pending Database Migration)

---

## Executive Summary

This session implemented a new **Resource Availability Calendar** feature that allows team members to mark their working status (Out of Office, Remote, On-Site) for any date. The calendar supports both week and month views, colour-coded status badges, and filtering by resource.

---

## What Was Built

### 1. Database Migration (`sql/P13-resource-availability.sql`)

New table structure:
```sql
resource_availability
├── id (UUID, primary key)
├── project_id (UUID, FK to projects)
├── user_id (UUID, FK to auth.users)
├── date (DATE)
├── status (TEXT: 'out_of_office' | 'remote' | 'on_site')
├── notes (TEXT, optional)
├── created_at, updated_at, created_by
└── UNIQUE(project_id, user_id, date)
```

RLS Policies:
- **SELECT:** Any project member can view availability
- **INSERT:** Users can only add their own entries
- **UPDATE/DELETE:** Users can modify their own; admins can modify any

### 2. Service Layer (`src/services/availability.service.js`)

Methods:
- `getByDateRange(projectId, startDate, endDate, userId?)` - Fetch entries
- `setAvailability(projectId, userId, date, status, notes)` - Create/update (upsert)
- `setBulkAvailability(projectId, userId, entries[])` - Batch create/update
- `clearAvailability(projectId, userId, date)` - Remove entry
- `getProjectMembers(projectId)` - Get team for dropdown
- `getSummary(projectId, startDate, endDate)` - Stats by status

Exports:
- `AVAILABILITY_STATUS` - Status constants
- `STATUS_CONFIG` - Display config (colours, labels, icons)

### 3. UI Components (`src/pages/Availability.jsx` + `.css`)

Features:
- **Week View:** Shows 7-day grid with full status badges
- **Month View:** Shows full month grid with mini badges
- **Navigation:** Previous/next week/month, "Today" button
- **Filter:** All resources or specific resource dropdown
- **Legend:** Visual guide to status colours
- **Edit Modal:** Click your row to set availability

Colour Coding:
| Status | Colour | Badge |
|--------|--------|-------|
| Out of Office | 🔴 Red (#EF4444) | OOO |
| Remote | 🟡 Amber (#F59E0B) | Remote |
| On Site | 🟢 Green (#10B981) | On-Site |

Permissions:
- All project members can **view** the calendar
- Users can only **edit** their own availability
- Viewers have read-only access

### 4. Routing (`src/App.jsx` v14.0)

Added route:
```jsx
<Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
```

### 5. Navigation (`src/lib/navigation.js`)

Added to all roles:
- **Admin/Supplier PM:** After Resources
- **Customer PM:** After RAID Log
- **Contributor:** After Workflow Summary (prominent position)
- **Viewer:** At the end (read-only)

---

## Files Changed/Created

| File | Action | Version |
|------|--------|---------|
| `sql/P13-resource-availability.sql` | Created | New |
| `src/services/availability.service.js` | Created | 1.0 |
| `src/services/index.js` | Modified | 2.1 |
| `src/pages/Availability.jsx` | Created | 1.0 |
| `src/pages/Availability.css` | Created | 1.0 |
| `src/App.jsx` | Modified | 14.0 |
| `src/lib/navigation.js` | Modified | 2.1 |

---

## Deployment Steps

### Step 1: Run Database Migration

Execute in Supabase SQL Editor:
```sql
-- Run the entire contents of: sql/P13-resource-availability.sql
```

### Step 2: Deploy Frontend

```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
git add -A
git commit -m "feat: Add resource availability calendar with week/month views"
git push origin main
```

Vercel will auto-deploy.

---

## User Guide

### Viewing Availability
1. Navigate to **Availability** in the sidebar
2. Use Week/Month toggle to switch views
3. Use navigation arrows to move between periods
4. Use dropdown to filter by specific resource

### Setting Your Availability
1. Click on any cell in **your row** (identified by your name)
2. Select status: Out of Office, Remote, or On Site
3. Optionally add notes
4. Click **Save**

### Clearing Availability
1. Click on your cell with existing status
2. Click **Clear** button in modal

---

## Technical Notes

### Why Upsert?
The service uses PostgreSQL upsert (`ON CONFLICT ... DO UPDATE`) to handle the case where a user changes their status for a date they've already set. This avoids unique constraint violations and simplifies the logic.

### Date Handling
All dates are stored and transmitted as `YYYY-MM-DD` strings to avoid timezone confusion. The UI displays dates in the user's local timezone.

### RLS Security
The table is protected by Row Level Security policies that:
- Scope all queries to the user's project assignments
- Prevent users from creating entries for other users
- Allow admins to manage any entry in their projects

---

## Future Enhancements (Not In Scope)

1. **Bulk entry mode** - Set status for date range
2. **Recurring patterns** - "Every Monday remote"
3. **Calendar sync** - Import from Google/Outlook
4. **Dashboard widget** - Show who's out today
5. **Team summary** - Capacity planning view
6. **Notifications** - Alert when key person is OOO

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Calendar loads and shows week view by default
- [ ] Week/Month toggle works
- [ ] Navigation (prev/next/today) works
- [ ] Resource filter dropdown populates
- [ ] Clicking own row opens modal
- [ ] Setting status saves correctly
- [ ] Status badge displays in cell
- [ ] Clearing status removes entry
- [ ] Other users' rows are not editable
- [ ] Viewer role can see but not edit
- [ ] Mobile responsive layout works

---

*Session Summary | 8 December 2025 | Availability Calendar Implementation Complete*
