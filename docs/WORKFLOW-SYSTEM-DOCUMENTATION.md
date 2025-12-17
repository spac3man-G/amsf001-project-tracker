# Workflow System Documentation

**Document:** WORKFLOW-SYSTEM-DOCUMENTATION.md  
**Type:** Feature Documentation  
**Version:** 1.0  
**Created:** 16 December 2025  
**Status:** Active

---

## Overview

The Workflow System provides a centralised mechanism for tracking and managing pending actions across all entity types in the AMSF001 Project Tracker. It enables role-based filtering, accurate timestamp tracking, and deep linking to specific items.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow System                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────────┐                │
│  │  WorkflowService │◄───│  NotificationContext │                │
│  └────────┬────────┘    └──────────┬───────────┘                │
│           │                        │                             │
│           ▼                        ▼                             │
│  ┌────────────────┐       ┌────────────────┐                    │
│  │ WorkflowSummary│       │NotificationBell│                    │
│  │     Page       │       │   Component    │                    │
│  └────────────────┘       └────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `WorkflowService` | `src/services/workflow.service.js` | Centralised data fetching and business logic |
| `NotificationContext` | `src/contexts/NotificationContext.jsx` | React context for notification state |
| `WorkflowSummary` | `src/pages/WorkflowSummary.jsx` | Full workflow dashboard page |
| `NotificationBell` | `src/components/NotificationBell.jsx` | Header notification dropdown |

---

## Workflow Categories

The system tracks **13 workflow categories** across **7 entity types**:

### Timesheets (1 category)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `timesheet` | Timesheet Approval | `status = 'Submitted'` | Customer PM |

### Expenses (2 categories)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `expense_chargeable` | Expense Validation (Chargeable) | `status = 'Submitted' AND chargeable_to_customer = true` | Customer PM |
| `expense_non_chargeable` | Expense Validation (Non-Chargeable) | `status = 'Submitted' AND chargeable_to_customer = false` | Supplier PM |

### Deliverables (3 categories)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `deliverable_review` | Deliverable Review | `status = 'Submitted for Review'` | Customer PM |
| `deliverable_sign_supplier` | Deliverable Sign-off (Supplier) | `status = 'Review Complete' AND supplier_pm_signed_at IS NULL` | Supplier PM |
| `deliverable_sign_customer` | Deliverable Sign-off (Customer) | `status = 'Review Complete' AND customer_pm_signed_at IS NULL` | Customer PM |

### Variations (3 categories)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `variation_submitted` | Variation Submitted | `status = 'submitted'` | Customer PM |
| `variation_awaiting_supplier` | Variation Awaiting Supplier | `status = 'awaiting_supplier'` | Supplier PM |
| `variation_awaiting_customer` | Variation Awaiting Customer | `status = 'awaiting_customer'` | Customer PM |

### Certificates (2 categories)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `certificate_pending_supplier` | Certificate Pending Supplier | `status = 'Pending Supplier Signature'` | Supplier PM |
| `certificate_pending_customer` | Certificate Pending Customer | `status IN ('Pending Customer Signature', 'Submitted')` | Customer PM |

### Baselines (2 categories)

| Category ID | Label | Database Condition | Actionable By |
|-------------|-------|-------------------|---------------|
| `baseline_awaiting_supplier` | Baseline Awaiting Supplier | `baseline_locked = false AND baseline_supplier_pm_signed_at IS NULL` | Supplier PM |
| `baseline_awaiting_customer` | Baseline Awaiting Customer | `baseline_locked = false AND baseline_customer_pm_signed_at IS NULL AND baseline_supplier_pm_signed_at IS NOT NULL` | Customer PM |

---

## Role Permission Matrix

| Category | Customer PM | Supplier PM | Admin |
|----------|-------------|-------------|-------|
| `timesheet` | ✅ Act | ❌ View | ✅ Act |
| `expense_chargeable` | ✅ Act | ❌ View | ✅ Act |
| `expense_non_chargeable` | ❌ View | ✅ Act | ✅ Act |
| `deliverable_review` | ✅ Act | ❌ View | ✅ Act |
| `deliverable_sign_supplier` | ❌ View | ✅ Act | ✅ Act |
| `deliverable_sign_customer` | ✅ Act | ❌ View | ✅ Act |
| `variation_submitted` | ✅ Act | ❌ View | ✅ Act |
| `variation_awaiting_supplier` | ❌ View | ✅ Act | ✅ Act |
| `variation_awaiting_customer` | ✅ Act | ❌ View | ✅ Act |
| `certificate_pending_supplier` | ❌ View | ✅ Act | ✅ Act |
| `certificate_pending_customer` | ✅ Act | ❌ View | ✅ Act |
| `baseline_awaiting_supplier` | ❌ View | ✅ Act | ✅ Act |
| `baseline_awaiting_customer` | ✅ Act | ❌ View | ✅ Act |

---

## Workflow Service API

### Constants

```javascript
import { ROLES, WORKFLOW_CATEGORIES } from '../services/workflow.service';

// Available roles
ROLES.SUPPLIER_PM  // 'Supplier PM'
ROLES.CUSTOMER_PM  // 'Customer PM'
ROLES.ADMIN        // 'Admin'

// Category definitions (example)
WORKFLOW_CATEGORIES.TIMESHEET = {
  id: 'timesheet',
  label: 'Timesheet Approval',
  entity: 'timesheets',
  group: 'timesheets',
  icon: 'Clock',
  color: '#3b82f6',
  actionableBy: [ROLES.CUSTOMER_PM, ROLES.ADMIN]
};
```

### Methods

#### `getAllPendingItems(projectId, options)`

Fetches all pending workflow items for a project.

```javascript
import { workflowService } from '../services';

const items = await workflowService.getAllPendingItems(projectId, {
  includeRole: 'Customer PM'  // Optional: determine canAct flag
});

// Returns array of workflow items:
[
  {
    id: 'uuid',
    type: 'timesheet',
    category: 'timesheet',
    title: 'Week of 2025-12-09 - John Smith',
    subtitle: 'Submitted 2025-12-10',
    status: 'Submitted',
    submitted_at: '2025-12-10T14:30:00Z',
    daysPending: 6,
    action_url: '/timesheets?highlight=uuid',
    canAct: true,
    isUrgent: true,
    entity: { /* full entity data */ }
  },
  // ...more items
]
```

#### `getItemsForRole(projectId, role)`

Fetches only items that the specified role can act on.

```javascript
const actionableItems = await workflowService.getItemsForRole(
  projectId, 
  ROLES.CUSTOMER_PM
);
```

#### `getItemsVisibleToRole(projectId, role)`

Fetches all items visible to the role (both actionable and info-only).

```javascript
const allVisibleItems = await workflowService.getItemsVisibleToRole(
  projectId,
  ROLES.CUSTOMER_PM
);
```

#### `getCountsByCategory(projectId)`

Gets counts for each workflow category (used for stat cards).

```javascript
const counts = await workflowService.getCountsByCategory(projectId);

// Returns:
{
  total: 15,
  timesheets: 3,
  expenses: 4,
  deliverables: 5,
  variations: 2,
  baselines: 0,
  certificates: 1,
  urgent: 3
}
```

#### `getUrgentItems(projectId, daysThreshold = 5)`

Gets items pending longer than the specified threshold.

```javascript
const urgentItems = await workflowService.getUrgentItems(projectId, 5);
```

---

## NotificationContext API

### Hook Usage

```javascript
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const { 
    notifications,     // Array of notification items
    unreadCount,       // Total unread count
    actionCount,       // Actionable items count (for current role)
    loading,           // Loading state
    markAsRead,        // Function to mark item as read
    markAsActioned,    // Function to mark item as actioned
    markAllAsRead,     // Function to mark all as read
    dismissNotification // Function to dismiss a notification
  } = useNotifications();
  
  // ...
}
```

### Notification Item Structure

```javascript
{
  id: 'uuid',
  type: 'timesheet',           // Category type
  title: 'Timesheet Approval',
  message: 'Week of 2025-12-09 - John Smith',
  created_at: '2025-12-10T14:30:00Z',
  read: false,
  actionable: true,            // Can current user act?
  isUrgent: true,              // > 5 days pending
  action_url: '/timesheets?highlight=uuid'
}
```

---

## Deep Linking

The workflow system supports deep linking to specific items via URL parameters.

### URL Pattern

```
/{entity-list}?highlight={item-uuid}
```

### Examples

| Entity | URL Pattern |
|--------|-------------|
| Timesheet | `/timesheets?highlight=abc-123` |
| Expense | `/expenses?highlight=def-456` |
| Deliverable | `/deliverables?highlight=ghi-789` |
| Variation | `/variations?highlight=jkl-012` |
| Milestone | `/milestones/mno-345` (direct link) |
| Certificate | `/milestones/pqr-678` (direct link) |

### Implementation

Target list pages should read the `highlight` parameter and auto-open the detail modal:

```javascript
import { useSearchParams } from 'react-router-dom';

function TimesheetsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  useEffect(() => {
    if (highlightId) {
      // Find and open the item
      const item = items.find(i => i.id === highlightId);
      if (item) {
        setSelectedItem(item);
        setShowModal(true);
      }
    }
  }, [highlightId, items]);
}
```

---

## Visual Indicators

### Badge Colors

| Condition | Badge Color | Priority |
|-----------|-------------|----------|
| Urgent + Actionable | Red (#dc2626) | Highest |
| Actionable | Green (#22c55e) | High |
| Urgent + Info Only | Amber (#f59e0b) | Medium |
| Info Only | Blue (#3b82f6) | Low |

### Row Styling

| Condition | Background | Button Style |
|-----------|------------|--------------|
| Actionable | Light green (`bg-green-50`) | Green "Act" button |
| Info Only | Default white | Blue "View" button |

### Icons by Category

| Category Group | Icon | Color |
|----------------|------|-------|
| Timesheets | Clock | #3b82f6 |
| Expenses | Receipt | #10b981 |
| Deliverables | FileText | #f59e0b |
| Variations | GitBranch | #8b5cf6 |
| Baselines | Lock | #06b6d4 |
| Certificates | Award | #ec4899 |
| Urgent | AlertCircle | #dc2626 |

---

## Database Schema Reference

### Timesheets

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | 'Draft' \| 'Submitted' \| 'Approved' \| 'Rejected' |
| `submitted_date` | TIMESTAMPTZ | When submitted for approval |
| `resource_id` | UUID | Links to resources table |
| `user_id` | UUID | User who created the timesheet |

### Expenses

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | 'Draft' \| 'Submitted' \| 'Approved' \| 'Rejected' |
| `submitted_date` | TIMESTAMPTZ | When submitted for validation |
| `chargeable_to_customer` | BOOLEAN | Determines who validates |
| `resource_name` | TEXT | Denormalised resource name |

### Deliverables

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | Workflow status |
| `updated_at` | TIMESTAMPTZ | Use for submission time |
| `sign_off_status` | TEXT | 'Not Signed' \| 'Awaiting Supplier' \| 'Awaiting Customer' \| 'Signed' |
| `supplier_pm_signed_at` | TIMESTAMPTZ | Supplier sign timestamp |
| `customer_pm_signed_at` | TIMESTAMPTZ | Customer sign timestamp |

### Variations

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | 'draft' \| 'submitted' \| 'awaiting_customer' \| 'awaiting_supplier' \| ... |
| `submitted_at` | TIMESTAMPTZ | When submitted |
| `variation_ref` | TEXT | Reference code |

### Milestone Certificates

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | 'Draft' \| 'Submitted' \| 'Pending Supplier Signature' \| ... |
| `supplier_pm_signed_at` | TIMESTAMPTZ | Supplier sign timestamp |
| `customer_pm_signed_at` | TIMESTAMPTZ | Customer sign timestamp |

### Milestones (Baselines)

| Column | Type | Purpose |
|--------|------|---------|
| `baseline_locked` | BOOLEAN | Whether baseline is locked |
| `baseline_supplier_pm_signed_at` | TIMESTAMPTZ | Supplier baseline sign |
| `baseline_customer_pm_signed_at` | TIMESTAMPTZ | Customer baseline sign |

---

## Usage Examples

### Example 1: Display actionable count for current user

```javascript
import { useNotifications } from '../contexts/NotificationContext';

function Header() {
  const { actionCount, loading } = useNotifications();
  
  return (
    <div className="badge">
      {loading ? '...' : actionCount}
    </div>
  );
}
```

### Example 2: Fetch and filter workflow items

```javascript
import { workflowService, ROLES } from '../services';

async function loadWorkflowData(projectId, userRole) {
  // Get all items with canAct flag
  const items = await workflowService.getAllPendingItems(projectId, {
    includeRole: userRole
  });
  
  // Filter to only actionable items
  const myActions = items.filter(item => item.canAct);
  
  // Get counts for stat cards
  const counts = await workflowService.getCountsByCategory(projectId);
  
  return { items, myActions, counts };
}
```

### Example 3: Navigate from notification to item

```javascript
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

function NotificationItem({ notification }) {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();
  
  const handleClick = () => {
    markAsRead(notification.id);
    navigate(notification.action_url);
  };
  
  return (
    <button onClick={handleClick}>
      {notification.title}
    </button>
  );
}
```

---

## Troubleshooting

### Issue: "Just now" timestamps

**Cause:** Using `new Date()` instead of database timestamps.  
**Solution:** Ensure `submitted_at`, `submitted_date`, or `updated_at` from database is used.

### Issue: Missing workflow categories

**Cause:** Direct Supabase queries instead of using workflowService.  
**Solution:** Use `workflowService.getAllPendingItems()` which fetches all 13 categories.

### Issue: Wrong items marked as actionable

**Cause:** Incorrect role mapping or missing role in WORKFLOW_CATEGORIES.actionableBy.  
**Solution:** Verify role string matches exactly ('Supplier PM', 'Customer PM', 'Admin').

### Issue: Deep link not opening item

**Cause:** Target page not reading `highlight` parameter.  
**Solution:** Add `useSearchParams()` hook and handle highlight parameter on mount.

---

---

*For implementation details, see `/docs/WORKFLOW-IMPLEMENTATION-PROGRESS.md`*  
*For the implementation plan, see `/docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md`*

---

*Part of AMSF001 Technical Documentation — see [AMSF001-Technical-Specification.md](./AMSF001-Technical-Specification.md) for master reference*
