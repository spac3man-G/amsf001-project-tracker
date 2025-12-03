
**Last Updated:** 3 December 2025  
**Version:** 23.0  
**Production Readiness:** 98%

---

## Recent Updates (3 December 2025)

### ✅ UI Consistency - Full Row Clickability (COMPLETE)
**Duration:** 45 minutes  
**Status:** ✅ Deployed to Production

#### Overview
Implemented full table row clickability across all main list pages for improved UX consistency. Previously, only specific cells (like reference numbers) were clickable links.

#### Implementation Pattern
All list pages now follow this consistent pattern:
```jsx
<tr 
  key={item.id} 
  className="table-row-clickable hover:bg-gray-50"
  onClick={() => navigate(`/path/${item.id}`)}
  style={{ cursor: 'pointer' }}
>
  {/* Action cells use stopPropagation */}
  <td onClick={(e) => e.stopPropagation()}>
    <ActionButtons />
  </td>
</tr>
```

#### Pages Updated

| Page | Navigation Target | Special Handling |
|------|-------------------|------------------|
| KPIs.jsx | `/kpis/${id}` | Actions cell stopPropagation |
| QualityStandards.jsx | `/quality-standards/${id}` | Disabled during inline editing |
| MilestoneTable.jsx | `/milestones/${id}` | Certificate + Actions stopPropagation |
| Resources.jsx | `/resources/${id}` | Disabled during inline editing |
| Partners.jsx | `/partners/${id}` | Email link + Status + Actions stopPropagation |

#### Event Handling
`e.stopPropagation()` applied to:
- Action button cells (Edit, Delete, View)
- Status toggle buttons (Partners)
- Email mailto: links (Partners)
- Certificate generation/view buttons (Milestones)
- Inline editing states (Resources, QualityStandards)

#### Visual Consistency
- Reference numbers retain blue link color (`#3b82f6` or `#8b5cf6`)
- Names retain bold/emphasized styling
- Removed redundant ExternalLink icons
- Hover states handled by CSS `.table-row-clickable` class

#### Git Commit
```
f463150b - feat: Make Partners.jsx table rows fully clickable for UI consistency
```

---

### ✅ Detail Modals Implementation (COMPLETE)
**Status:** ✅ Deployed to Production

Added detail modals for workflow items (existing rows already had full row clickability):

| Page | Modal Component | Features |
|------|-----------------|----------|
| Timesheets | TimesheetDetailModal | Validate/Reject workflow |
| Expenses | ExpenseDetailModal | Validate/Reject workflow |
| Deliverables | DeliverableDetailModal | Submit/Review/Deliver workflow |
| NetworkStandards | NetworkStandardDetailModal | Edit status/progress |


---

### ✅ AI Model Upgrade (COMPLETE)
**Status:** ✅ Deployed to Production

Upgraded AI Chat Assistant from Claude 3 Haiku to Claude 4.5 Sonnet:
- Improved reasoning and data analysis
- Better natural language understanding
- More accurate query interpretation
- Cost increase: £5-50/month (from £1-10/month)

### ✅ Terminology Update (COMPLETE)
**Status:** ✅ Deployed to Production

Changed "Approved" → "Validated" across:
- Timesheets workflow
- Expenses workflow  
- UI labels and buttons
- Database status values remain unchanged for compatibility

---

## Previous Updates (3 December 2025 - Earlier)

### ✅ Milestone RLS Policy Fix (COMPLETE)
**Duration:** 30 minutes  
**Status:** ✅ SQL Migration Created - Pending Deployment

#### Issue Identified
Users editing milestones received error: "No record found with id: [uuid]"

**Root Cause:** Missing UPDATE RLS (Row Level Security) policy on the `milestones` table.

#### Solution
Created `sql/P9-milestone-update-rls.sql` with comprehensive RLS policies:

| Policy | Command | Roles |
|--------|---------|-------|
| SELECT | All authenticated users can view | All |
| UPDATE | Admin and Supplier PM can update | admin, supplier_pm |
| INSERT | Admin and Supplier PM can insert | admin, supplier_pm |
| DELETE | Admin and Supplier PM can delete | admin, supplier_pm |

---

### ✅ Supabase .single() Error Resolution (COMPLETE)
**Status:** ✅ Deployed to Production

Replaced all `.single()` calls with `.select()` + array access pattern across all services to fix RLS-related errors.

---

## Current Architecture

### Service Layer (18 Services)
```
src/services/
├── index.js                    # Barrel export
├── base.service.js             # ✨ Updated - .single() fix
├── auth.service.js
├── projects.service.js
├── milestones.service.js       # ✨ Updated - .single() fix
├── deliverables.service.js
├── resources.service.js
├── timesheets.service.js
├── expenses.service.js         # ✨ Updated - .single() fix
├── partners.service.js         # ✨ Updated - .single() fix
├── invoicing.service.js        # ✨ Updated - .single() fix
├── kpis.service.js
├── qualityStandards.service.js
├── dashboard.service.js        # ✨ Updated - .single() fix
├── auditLog.service.js
├── deletedItems.service.js
├── receiptScanner.service.js
└── notifications.service.js
```

### Detail Modal Components
```
src/components/
├── timesheets/
│   └── TimesheetDetailModal.jsx
├── expenses/
│   └── ExpenseDetailModal.jsx
├── deliverables/
│   └── DeliverableDetailModal.jsx
└── networkstandards/
    └── NetworkStandardDetailModal.jsx
```


### SQL Migrations
```
sql/
├── P3a-add-partner-id-to-resources.sql    ✅ Deployed
├── P4-add-procurement-method-to-expenses.sql  ✅ Deployed
├── P5a-partner-invoices-tables.sql        ✅ Deployed
├── P5b-partner-invoices-rls.sql           ✅ Deployed
├── P6-enhanced-invoice-lines.sql          ✅ Deployed
├── P7-receipt-scanner.sql                 ✅ Deployed
├── P8-deliverables-contributor-access.sql ⏳ Pending
├── P9-milestone-update-rls.sql            ⏳ PENDING - Run this!
├── audit-triggers.sql                     ✅ Deployed
├── soft-delete-implementation.sql         ✅ Deployed
└── data-integrity-constraints.sql         ✅ Deployed
```

---

## Pending Deployments

### P9: Milestone RLS Policies (URGENT)
**Status:** SQL created, needs deployment

**Steps:**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
2. Go to SQL Editor
3. Copy contents of `sql/P9-milestone-update-rls.sql`
4. Run the script
5. Verify policies created

### P8: Deliverables Contributor Access
**Status:** SQL created, pending deployment

---

## UI Component Patterns

### Table Row Clickability
All list pages follow this pattern for consistent UX:

```jsx
// Import
import { useNavigate } from 'react-router-dom';

// Hook
const navigate = useNavigate();

// Table row
<tr 
  className="table-row-clickable hover:bg-gray-50"
  onClick={() => navigate(`/path/${item.id}`)}
  style={{ cursor: 'pointer' }}
>
  {/* Data cells - clickable */}
  <td>{item.name}</td>
  
  {/* Action cells - NOT clickable */}
  <td onClick={(e) => e.stopPropagation()}>
    <button onClick={handleEdit}>Edit</button>
  </td>
</tr>
```

### Inline Editing Exception
For pages with inline editing (Resources, QualityStandards):
```jsx
<tr 
  onClick={() => !isEditing && navigate(`/path/${item.id}`)}
  style={{ cursor: isEditing ? 'default' : 'pointer' }}
  className={isEditing ? '' : 'table-row-clickable'}
>
```

---

## Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| Master Document | 6.0 | 3 Dec 2025 |
| User Manual | 8.0 | 3 Dec 2025 |
| Development Playbook | 23.0 | 3 Dec 2025 |
| Configuration Guide | 10.0 | 3 Dec 2025 |
| Roadmap | 2.0 | 3 Dec 2025 |

---

## Quick Reference

### Key Commands
```bash
# Start development
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Deploy (automatic via git push)
git add -A && git commit -m "message" && git push
```

### Key URLs
| Resource | URL |
|----------|-----|
| Live App | https://amsf001-project-tracker.vercel.app |
| Supabase | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| Vercel | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub | https://github.com/spac3man-G/amsf001-project-tracker |

---

*Development Playbook Version: 23.0 | Last Updated: 3 December 2025*
