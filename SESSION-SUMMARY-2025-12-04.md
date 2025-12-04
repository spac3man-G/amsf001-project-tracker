# AMSF001 Project Tracker - Session Summary

**Date:** 4 December 2025  
**Session Focus:** Financial Calculations Refactoring & Dashboard Widgets  
**Production Readiness:** 98%

---

## Executive Summary

This session completed a three-phase refactoring of the application's financial calculations, improving code maintainability and terminology clarity. Additionally, two new dashboard widgets (Timesheets and Expenses) were implemented with live data.

---

## Changes Implemented

### Phase I: Centralize Hours-to-Days Calculations ✅

**Problem:** 17 hardcoded `/ 8` calculations scattered across 12 files made it difficult to change working hours per day.

**Solution:** Created centralized utility functions in `src/config/metricsConfig.js`:

| Function | Purpose |
|----------|---------|
| `hoursToDays(hours)` | Converts hours to days using `BUDGET_CONFIG.hoursPerDay` |
| `daysToHours(days)` | Converts days to hours |
| `calculateBillableValue(hours, sellPrice)` | Calculates customer charge: days × sell_price |
| `calculateCostValue(hours, costPrice)` | Calculates supplier cost: days × cost_price |

**Files Updated (12):**
- src/config/metricsConfig.js (new functions added)
- src/components/timesheets/TimesheetDetailModal.jsx
- src/components/partners/PartnerDataTables.jsx
- src/pages/Resources.jsx, ResourceDetail.jsx, Timesheets.jsx
- src/pages/PartnerDetail.jsx, MilestoneDetail.jsx
- src/services/timesheets.service.js, milestones.service.js
- src/services/invoicing.service.js, resources.service.js

**Commit:** `55fc0976`

---

### Phase II: Database Column Renames ✅

**Problem:** Column names didn't reflect business terminology:
- `resources.daily_rate` should be `sell_price` (what we charge customers)
- `milestones.budget` should be `billable` (invoice amount, not a budget)

**Database Changes (run in Supabase SQL Editor):**
```sql
ALTER TABLE resources RENAME COLUMN daily_rate TO sell_price;
ALTER TABLE milestones RENAME COLUMN budget TO billable;
-- Views recreated automatically (use SELECT *)
```

**Codebase Updates:**
- 36 references to `daily_rate` → `sell_price`
- 18 references to `milestone.budget` → `milestone.billable`

**Files Updated:**
- All service files referencing these columns
- All components with forms or displays
- Supabase select queries updated

**Commit:** `65d99432`

---

### Phase III: Remove Unused Columns ✅

**Problem:** Three columns had 0 code references - dead weight in the schema.

**Columns Removed:**
| Table | Column | Notes |
|-------|--------|-------|
| resources | discount_percent | Never used |
| resources | discounted_rate | Never used |
| milestones | payment_percent | Never used |

**Database Script:**
```sql
DROP VIEW IF EXISTS active_resources;
DROP VIEW IF EXISTS active_milestones;
ALTER TABLE resources DROP COLUMN IF EXISTS discount_percent;
ALTER TABLE resources DROP COLUMN IF EXISTS discounted_rate;
ALTER TABLE milestones DROP COLUMN IF EXISTS payment_percent;
CREATE VIEW active_resources AS SELECT * FROM resources WHERE is_deleted IS NULL OR is_deleted = false;
CREATE VIEW active_milestones AS SELECT * FROM milestones WHERE is_deleted IS NULL OR is_deleted = false;
```

**Status:** Database-only change, no codebase updates needed.

---

### Dashboard Widgets ✅

**New Components Created:**

#### TimesheetsWidget (`src/components/dashboard/TimesheetsWidget.jsx`)
| Row | Shows |
|-----|-------|
| Submitted | Count + £ value (awaiting Customer PM validation) |
| Validated | Count + £ value (Validated + Approved statuses) |

- Value calculated as: `hours ÷ 8 × sell_price`
- Excludes deleted and rejected timesheets
- Navigates to /timesheets on click

#### ExpensesWidget (`src/components/dashboard/ExpensesWidget.jsx`)
| Row | Shows |
|-----|-------|
| Awaiting Validation | £ value (Submitted status) |
| Validated Total | £ value (Validated + Approved) |
| ↳ Chargeable | £ value (billable to customer) |
| ↳ Non-Chargeable | £ value (absorbed by supplier) |

- Excludes deleted and rejected expenses
- Navigates to /expenses on click

**Commit:** `973d604a`

---

### Dashboard Grid Layout ✅

**Change:** Updated from 3-column to 4-column grid for widgets.

**CSS Changes (`src/pages/Dashboard.css`):**
```css
.dashboard-widgets {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1400px) {
  .dashboard-widgets {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**Responsive Behavior:**
| Screen Width | Columns |
|--------------|---------|
| > 1400px | 4 (all widgets in row) |
| 768px - 1400px | 2 (2×2 grid) |
| < 768px | 1 (stacked) |

**Commit:** `c789bdc8`

---

## Current Dashboard Widgets

| Widget | Data Source | Key Metrics |
|--------|-------------|-------------|
| Milestones | milestonesService | Approved, Awaiting Signatures, Awaiting Certificate, In Progress |
| Deliverables | deliverablesService | Delivered, Review Complete, Awaiting Review, Returned, In Progress, Not Started |
| Timesheets | timesheetsService | Submitted (count + £), Validated (count + £) |
| Expenses | expensesService | Awaiting Validation (£), Validated Total (£), Chargeable (£), Non-Chargeable (£) |

---

## Database Schema Changes Summary

### resources table
| Before | After |
|--------|-------|
| daily_rate | sell_price |
| discount_percent | *(removed)* |
| discounted_rate | *(removed)* |

### milestones table
| Before | After |
|--------|-------|
| budget | billable |
| payment_percent | *(removed)* |

---

## Key Configuration

### BUDGET_CONFIG (`src/config/metricsConfig.js`)
```javascript
export const BUDGET_CONFIG = {
  hoursPerDay: 8,
  currencyCode: 'GBP'
};
```

### VALID_STATUSES (`src/config/metricsConfig.js`)
```javascript
timesheets: {
  contributeToSpend: ['Submitted', 'Validated', 'Approved'],
  excludeFromSpend: ['Draft', 'Rejected']
},
expenses: {
  contributeToSpend: ['Submitted', 'Validated', 'Approved'],
  excludeFromSpend: ['Draft', 'Rejected']
}
```

---

## Files Created/Modified

### New Files
- `src/components/dashboard/TimesheetsWidget.jsx`
- `src/components/dashboard/ExpensesWidget.jsx`

### Modified Files (Key)
- `src/config/metricsConfig.js` - Added 4 utility functions
- `src/components/dashboard/index.js` - Added widget exports
- `src/pages/Dashboard.jsx` - Added widget imports and rendering
- `src/pages/Dashboard.css` - Updated grid to 4 columns
- 12 files updated for Phase I (hours-to-days)
- 15+ files updated for Phase II (column renames)

---

## Testing Checklist

### Financial Calculations
- [ ] Resources page: Days Used displays correctly
- [ ] Partner Detail: Days Worked stat card shows correct value
- [ ] Milestone Detail: Budget & Spend shows hours/days correctly
- [ ] Timesheet deletion: Cost Impact in confirmation dialog is correct

### Dashboard Widgets
- [ ] All 4 widgets display in single row (desktop)
- [ ] Timesheets widget shows correct counts and values
- [ ] Expenses widget shows correct totals and breakdown
- [ ] Clicking widgets navigates to correct pages
- [ ] Deleted items excluded from all widget counts
- [ ] Rejected items excluded from all widget counts

### Database
- [ ] Verify `sell_price` column exists on resources
- [ ] Verify `billable` column exists on milestones
- [ ] Verify removed columns are gone (discount_percent, discounted_rate, payment_percent)

---

## Git Commits (Today)

| Commit | Description |
|--------|-------------|
| `55fc0976` | Phase I: Centralize hours-to-days calculations |
| `65d99432` | Phase II: Rename database columns |
| `973d604a` | Add Timesheets and Expenses widgets |
| `c789bdc8` | Dashboard 4-column grid layout |

---

## Next Session Recommendations

1. **Test the changes** - Verify all financial calculations display correctly
2. **Consider additional widgets** - KPIs, Quality Standards, Partners
3. **Dashboard enhancements** - Loading skeletons, data caching
4. **P9 Migration** - Still pending (milestone RLS policies)

---

*Session Summary | 4 December 2025*
