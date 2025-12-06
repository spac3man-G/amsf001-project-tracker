# Multi-Tenancy RLS Implementation Guide

## Document Information
- **Version:** 1.0
- **Created:** 6 December 2025
- **Purpose:** Comprehensive guide for implementing project-scoped Row Level Security (RLS) policies
- **Status:** Ready for implementation

---

## Overview

### Current State
The application has global roles stored in `profiles.role`, but a `user_projects` table exists and is populated with project-scoped roles. RLS policies currently reference `profiles.role` directly, which doesn't support true multi-tenancy.

### Target State
All RLS policies should check `user_projects` for project-scoped role access, enabling users to have different roles on different projects.

---

## Verified Schema Information

### user_projects Table Structure
```
id          UUID PRIMARY KEY
user_id     UUID REFERENCES profiles(id)
project_id  UUID REFERENCES projects(id)
role        TEXT ('admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer')
is_default  BOOLEAN
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Role Values (lowercase, verified from database)
| Role | Description |
|------|-------------|
| `admin` | Full access to project |
| `supplier_pm` | Supplier project manager |
| `customer_pm` | Customer project manager |
| `contributor` | Can add timesheets/expenses, update deliverable progress |
| `viewer` | Read-only access |

### Tables with project_id Column
| Table | Key Columns for RLS |
|-------|---------------------|
| `projects` | `id` |
| `milestones` | `project_id` |
| `deliverables` | `project_id` |
| `resources` | `project_id`, `user_id` |
| `timesheets` | `project_id`, `resource_id`, `status`, `created_by` |
| `expenses` | `project_id`, `status`, `created_by` |
| `kpis` | `project_id` |
| `quality_standards` | `project_id` |
| `partners` | `project_id` |
| `raid_items` | `project_id`, `created_by` |
| `audit_log` | `project_id` |

### Junction Tables (no project_id - join through parent)
| Table | Columns | Parent Table |
|-------|---------|--------------|
| `deliverable_kpis` | `deliverable_id`, `kpi_id` | `deliverables` |
| `deliverable_quality_standards` | `deliverable_id`, `quality_standard_id` | `deliverables` |

---

## Permission Matrix

### Legend
- ✓ = Allowed
- ○ = Conditional (see notes)
- ✗ = Not allowed

### Main Entities

| Entity | Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|--------|-------|-------------|-------------|-------------|--------|
| **projects** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ (global) | ✗ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ |
| | DELETE | ✓ (global) | ✗ | ✗ | ✗ | ✗ |
| **milestones** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✓ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **deliverables** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✓ | ○ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **resources** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **timesheets** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ○ own | ✗ |
| | UPDATE | ✓ | ✓ | ○ validate | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ○ draft | ✗ |
| **expenses** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✓ | ✗ |
| | UPDATE | ✓ | ✓ | ○ validate | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ○ draft | ✗ |
| **kpis** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **quality_standards** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **partners** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **raid_items** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✓ | ✓ | ✗ |
| | UPDATE | ✓ | ✓ | ○ own | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |

### Junction Tables

| Table | Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|-------|--------|-------|-------------|-------------|-------------|--------|
| **deliverable_kpis** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **deliverable_quality_standards** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Implementation Phases

### Phase 1: Junction Tables (Immediate)
Fix the current error blocking KPI/QS editing on deliverables.

**Tables:** `deliverable_kpis`, `deliverable_quality_standards`

### Phase 2: Main Entity Tables
Update core business tables.

**Tables:** `milestones`, `deliverables`, `resources`, `timesheets`, `expenses`, `kpis`, `quality_standards`

### Phase 3: Additional Tables
Update remaining tables.

**Tables:** `partners`, `raid_items`, `projects`, `user_projects`, `audit_log`

### Phase 4: Verification
Audit all policies and test thoroughly.

---

## Notes

### Conditional Permissions Explained

**Contributor on deliverables UPDATE:**
- Can update progress and description fields only
- Cannot change status, milestone assignment, or name

**Contributor on timesheets:**
- INSERT: Only for their own linked resource
- UPDATE: Only their own, and only if status is Draft or Rejected
- DELETE: Only their own, and only if status is Draft

**Contributor on expenses:**
- INSERT: Can create expenses
- UPDATE: Only their own, and only if status is Draft or Rejected
- DELETE: Only their own, and only if status is Draft

**Customer PM on timesheets/expenses UPDATE:**
- Can validate (change status from Submitted to Approved/Rejected)

**RAID items:**
- Owner (created_by) can update their own items
- Only Admin can delete

### Global vs Project Roles

For `projects` INSERT and DELETE, we check `profiles.role = 'admin'` (global admin) because:
- Creating a new project requires global admin rights
- Deleting a project is a global admin action
- Project-level admin can update but not delete the project

---

## Testing Checklist

After each phase, verify:

- [ ] Admin can perform all CRUD operations
- [ ] Supplier PM can manage entities they're allowed to
- [ ] Customer PM can validate timesheets/expenses
- [ ] Customer PM can update milestone/deliverable status
- [ ] Contributor can add own timesheets/expenses
- [ ] Contributor can update own draft items
- [ ] Contributor can update deliverable progress
- [ ] Viewer can only read data
- [ ] Users cannot see data from projects they're not members of
