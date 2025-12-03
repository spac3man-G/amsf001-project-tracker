# AMSF001 Development Playbook v22

**Last Updated:** 3 December 2025  
**Version:** 22.0  
**Production Readiness:** 97%

---

## Recent Updates (3 December 2025)

### ✅ Milestone RLS Policy Fix (COMPLETE)
**Duration:** 30 minutes  
**Status:** ✅ SQL Migration Created - Pending Deployment

#### Issue Identified
Users editing milestones received error: "No record found with id: [uuid]"

**Root Cause:** Missing UPDATE RLS (Row Level Security) policy on the `milestones` table. The frontend permission check passed but the database blocked the actual update.

#### Solution
Created `sql/P9-milestone-update-rls.sql` with comprehensive RLS policies:

| Policy | Command | Roles |
|--------|---------|-------|
| SELECT | All authenticated users can view | All |
| UPDATE | Admin and Supplier PM can update | admin, supplier_pm |
| INSERT | Admin and Supplier PM can insert | admin, supplier_pm |
| DELETE | Admin and Supplier PM can delete | admin, supplier_pm |

#### Files Created
```
sql/P9-milestone-update-rls.sql (114 lines)
```

#### Deployment Required
```sql
-- Run in Supabase Dashboard > SQL Editor
-- See sql/P9-milestone-update-rls.sql for full script
```

#### Git Commits
```
5b863710 - fix: add missing UPDATE RLS policy for milestones table
f3c3f802 - fix: resolve Supabase .single() errors across all services
```

---

### ✅ Supabase .single() Error Resolution (COMPLETE)
**Duration:** 1 hour  
**Status:** ✅ Deployed to Production

#### Issue Identified
Various CRUD operations failed with error: "Cannot coerce the result to a single JSON object"

**Root Cause:** Supabase's `.single()` method fails when RLS policies affect the returned row count.

#### Solution
Replaced all `.single()` calls with `.select()` + array access pattern across all services:

**Before:**
```javascript
const { data, error } = await supabase
  .from('table')
  .update(updates)
  .eq('id', id)
  .single();  // ❌ Fails if RLS blocks return
```

**After:**
```javascript
const { data, error } = await supabase
  .from('table')
  .update(updates)
  .eq('id', id)
  .select();  // ✅ Returns array

return data?.[0];  // Get first result
```

#### Files Modified
```
src/services/base.service.js - update(), create(), restore(), getById()
src/services/dashboard.service.js - saveLayout()
src/services/expenses.service.js - various methods
src/services/invoicing.service.js - various methods
src/services/milestones.service.js - getWithDeliverables(), createCertificate(), updateCertificate()
src/services/partners.service.js - getWithResources()
```

---

## Previous Updates (2 December 2025)

### ✅ Apple Design System Implementation (COMPLETE)
**Status:** ✅ Deployed to Production

- Modern Minimalist design with teal color scheme
- Centralized UI components (ActionButtons, FilterBar, Card, etc.)
- Dashboard redesign with hero metrics and progress ring
- Consistent CSS variables across all components

### ✅ Component Refactoring (COMPLETE)
**Status:** ✅ All major components refactored

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| PartnerDetail.jsx | 1,493 | 585 | 61% |
| Milestones.jsx | 1,274 | 443 | 65% |
| ResourceDetail.jsx | 1,117 | 423 | 62% |
| Expenses.jsx | 1,020 | 399 | 61% |

---

## Previous Updates (1 December 2025)

### ✅ AI Chat Assistant (COMPLETE & VERIFIED)
- 12 database query tools
- Role-based data scoping
- Copy, export, persistence features
- Token usage stats

### ✅ Smart Receipt Scanner (COMPLETE & VERIFIED)
- AI-powered receipt data extraction
- Category classification with learning
- 5+ patterns already learned

### ✅ Partner Invoice UX (COMPLETE)
- Redesigned summary cards
- Print to PDF functionality
- Expenses breakdown panel

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

## Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| Master Document | 6.0 | 3 Dec 2025 |
| User Manual | 7.0 | 1 Dec 2025 |
| Development Playbook | 22.0 | 3 Dec 2025 |
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

*Development Playbook Version: 22.0 | Last Updated: 3 December 2025*
