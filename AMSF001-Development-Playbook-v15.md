# AMSF001 Project Tracker
# Development Playbook & Production Readiness Guide

**Version:** 15.0  
**Created:** 30 November 2025  
**Last Updated:** 30 November 2025  
**Purpose:** Production Readiness Assessment & Delivery Roadmap  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0-14.0 | 28-30 Nov | Foundation through enhanced invoicing |
| **15.0** | **30 Nov** | **Production hardening complete, updated roadmap, assessment** |

---

## Executive Summary

### Production Readiness Score: 78% (was 65%)

| Category | Score | Status |
|----------|-------|--------|
| Security | 85% | ✅ Strong |
| Data Protection | 90% | ✅ Excellent |
| Performance | 70% | 🟡 Good |
| Code Quality | 75% | 🟡 Good |
| Testing | 20% | 🔴 Needs Work |
| Multi-Tenant | 40% | 🟡 Foundation Ready |
| Documentation | 90% | ✅ Excellent |

### What's Deployed (Today)

| Feature | Status | Notes |
|---------|--------|-------|
| Soft Delete | ✅ LIVE | 9 tables, SQL deployed |
| Audit Triggers | ✅ LIVE | 8 tables, automatic logging |
| Input Sanitisation | ✅ LIVE | sanitize.js library |
| Rate Limiting | ✅ LIVE | 20 req/min on AI chat |
| Session Management | ✅ LIVE | 60s checks, expiry warnings |
| Service Layer | ✅ LIVE | All 11 services complete |
| Bundle Optimisation | ✅ LIVE | 119KB app + vendors |

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Production Hardening Status](#2-production-hardening-status)
3. [Immediate Priorities (Week 1)](#3-immediate-priorities-week-1)
4. [Short-Term Roadmap (Weeks 2-4)](#4-short-term-roadmap-weeks-2-4)
5. [Medium-Term Roadmap (Months 2-3)](#5-medium-term-roadmap-months-2-3)
6. [Technical Debt Register](#6-technical-debt-register)
7. [Architecture Overview](#7-architecture-overview)
8. [Best Practices Checklist](#8-best-practices-checklist)
9. [SQL Deployment Status](#9-sql-deployment-status)
10. [Documentation Index](#10-documentation-index)

---

## 1. Current State Assessment

### Build Metrics (30 Nov 2025)

```
Build Time: 1.21s
Total Bundle: 445KB (gzipped: ~147KB)

Breakdown:
├── index.js (app core)      119.70 KB │ gzip: 30.09 KB
├── vendor-supabase.js       178.68 KB │ gzip: 46.13 KB
├── vendor-react.js          163.22 KB │ gzip: 53.21 KB
├── vendor-icons.js           31.28 KB │ gzip:  5.84 KB
└── Page chunks              ~130 KB   │ gzip: ~40 KB
```

**Assessment:** Bundle size reduced from 821KB to 445KB (46% improvement). Code splitting implemented with lazy-loaded page chunks.

### Database State

| Table | Records | Soft Delete | Audit Trigger |
|-------|---------|-------------|---------------|
| timesheets | Active | ✅ | ✅ |
| expenses | Active | ✅ | ✅ |
| resources | Active | ✅ | ✅ |
| partners | Active | ✅ | ✅ |
| milestones | Active | ✅ | ✅ |
| deliverables | Active | ✅ | ✅ |
| kpis | Active | ✅ | ✅ |
| quality_standards | Active | ✅ | ✅ |
| partner_invoices | Active | ✅ | ✅ |
| audit_log | Logging | N/A | N/A |

### Service Layer Coverage

| Service | File | CRUD | Soft Delete | Sanitisation |
|---------|------|------|-------------|--------------|
| BaseService | base.service.js | ✅ | ✅ | ✅ |
| partnersService | partners.service.js | ✅ | ✅ | ✅ |
| resourcesService | resources.service.js | ✅ | ✅ | ✅ |
| timesheetsService | timesheets.service.js | ✅ | ✅ | ✅ |
| expensesService | expenses.service.js | ✅ | ✅ | ✅ |
| milestonesService | milestones.service.js | ✅ | ✅ | ✅ |
| deliverablesService | deliverables.service.js | ✅ | ✅ | ✅ |
| kpisService | kpis.service.js | ✅ | ✅ | ✅ |
| qualityStandardsService | qualityStandards.service.js | ✅ | ✅ | ✅ |
| invoicingService | invoicing.service.js | ✅ | ✅ | ✅ |

---

## 2. Production Hardening Status

### Completed ✅

| Item | Implementation | Date |
|------|----------------|------|
| **Soft Delete** | is_deleted, deleted_at, deleted_by columns on 9 tables | 30 Nov |
| **Audit Logging** | Triggers on 8 tables, captures INSERT/UPDATE/DELETE/SOFT_DELETE/RESTORE | 30 Nov |
| **Input Sanitisation** | sanitize.js with XSS protection, entity configs | 30 Nov |
| **Rate Limiting** | 20 req/min on /api/chat.js | 30 Nov |
| **Session Management** | 60s session checks, expiry warnings, auto-refresh | 30 Nov |
| **Bundle Optimisation** | Code splitting, vendor chunks, lazy loading | 30 Nov |
| **Service Layer** | All 11 services with consistent patterns | 30 Nov |
| **Toast Notifications** | App-wide feedback system | 30 Nov |
| **Form Validation Hook** | Reusable validation patterns | 30 Nov |
| **Error Boundary** | Global error catching | 30 Nov |
| **Delete Warnings** | Cascade impact shown before delete | 30 Nov |

### In Progress 🔄

| Item | Progress | Owner | ETA |
|------|----------|-------|-----|
| Multi-tenant project selector | Database ready, UI pending | Dev | Week 2 |
| CSV export functionality | Not started | Dev | Week 2 |

### Pending 📋

| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Automated testing | HIGH | Medium | Jest + React Testing Library |
| E2E tests | MEDIUM | High | Playwright recommended |
| Error reporting | MEDIUM | Low | Sentry integration |
| Performance monitoring | LOW | Low | Vercel Analytics |

---

## 3. Immediate Priorities (Week 1)

### Priority 1: Update Documentation ✅ (This Document)

- [x] Create v15 playbook with accurate status
- [x] Document SQL deployments completed
- [ ] Update User Manual to v5 with soft delete info
- [ ] Update Configuration Guide to v7

### Priority 2: Admin Audit Log Viewer

**Why:** Audit logs are collecting but no UI to view them.

**Deliverable:** New page `/admin/audit-log` showing:
- Recent activity feed
- Filter by user, table, action type
- Date range filtering
- Drill-down to see old/new data

**Effort:** 4-6 hours

```jsx
// Suggested implementation
import { supabase } from '../lib/supabase';

// Query recent_audit_activity view
const { data } = await supabase
  .from('recent_audit_activity')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

### Priority 3: Deleted Items Recovery UI

**Why:** Soft delete is deployed but no way to view/restore deleted items.

**Deliverable:** Admin page showing:
- deleted_items_summary view
- Restore button per item
- Permanent delete option (after 90 days)

**Effort:** 3-4 hours

### Priority 4: Test Content Cleanup Script

**Why:** Test data needs easy removal before production use.

**Deliverable:** SQL script and admin button to:
- Delete all records where is_test_content = true
- Cascade through related tables properly
- Audit log the cleanup

**Effort:** 2-3 hours

---

## 4. Short-Term Roadmap (Weeks 2-4)

### Week 2: Multi-Tenant Activation

| Task | Description | Effort |
|------|-------------|--------|
| Project selector component | Dropdown in header showing user's projects | 4h |
| Dynamic ProjectContext | Load project from user_projects table | 2h |
| Project switching | Change project without page reload | 2h |
| Default project handling | Auto-select if user has only one | 1h |
| Test multi-project filtering | Verify RLS and data isolation | 3h |

**Database Ready:** user_projects table exists, needs UI.

### Week 3: Export & Reporting

| Task | Description | Effort |
|------|-------------|--------|
| CSV export - Timesheets | Download filtered timesheets as CSV | 3h |
| CSV export - Expenses | Download filtered expenses as CSV | 2h |
| CSV export - Resources | Download resource list as CSV | 2h |
| PDF invoice generation | Generate partner invoices as PDF | 6h |
| Report scheduling | Email weekly/monthly reports | 8h |

### Week 4: Testing Foundation

| Task | Description | Effort |
|------|-------------|--------|
| Jest setup | Configure Jest for React | 2h |
| Service layer tests | Unit tests for all services | 8h |
| Component tests | Test key UI components | 8h |
| Integration tests | Test critical workflows | 6h |
| CI pipeline | GitHub Actions for test runs | 3h |

---

## 5. Medium-Term Roadmap (Months 2-3)

### Month 2: Polish & Performance

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Loading skeletons | MEDIUM | 4h | UX improvement |
| Optimistic updates | MEDIUM | 6h | Faster feel |
| Offline support | LOW | 12h | PWA capability |
| Mobile responsiveness | HIGH | 8h | Broader access |
| Keyboard navigation | LOW | 4h | Accessibility |
| Dark mode | LOW | 6h | User preference |

### Month 3: Advanced Features

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Notification system | MEDIUM | 8h | User engagement |
| Email notifications | MEDIUM | 6h | Approval workflows |
| Document attachments | HIGH | 10h | Evidence storage |
| Advanced search | LOW | 8h | Data discovery |
| Dashboard customisation | LOW | 12h | User personalisation |
| API rate limiting (per user) | MEDIUM | 4h | Fair usage |

---

## 6. Technical Debt Register

### High Priority 🔴

| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| No automated tests | Risk of regressions | Implement Jest suite | 20h |
| Detail pages use direct Supabase | Inconsistent patterns | Migrate to services | 8h |
| Certificate management direct DB | Not using service layer | Create certificate.service.js | 4h |

### Medium Priority 🟡

| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| Hardcoded project ID | Blocks multi-tenant | Dynamic loading | 4h |
| Some N+1 queries | Performance | Batch queries in services | 6h |
| No error reporting | Blind to production issues | Add Sentry | 2h |
| Console.log statements | Dev noise in production | Remove/conditional | 1h |

### Low Priority 🟢

| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| Bundle could be smaller | Load time | Tree-shaking audit | 4h |
| No API versioning | Future breaking changes | Add /api/v1/ prefix | 2h |
| Inconsistent date handling | Edge cases | Use date-fns everywhere | 3h |

---

## 7. Architecture Overview

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (lazy-loaded)                                  │  │
│  │  ├── Dashboard, Timesheets, Expenses, Resources      │  │
│  │  ├── Partners, Milestones, Deliverables, KPIs        │  │
│  │  └── Reports, Settings, Users, Admin                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer (11 services)                        │  │
│  │  ├── CRUD operations with soft delete                │  │
│  │  ├── Input sanitisation via sanitize.js              │  │
│  │  └── Consistent error handling                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Contexts                                             │  │
│  │  ├── AuthContext (session mgmt, 60s checks)          │  │
│  │  ├── ProjectContext (current project)                │  │
│  │  ├── ToastContext (notifications)                    │  │
│  │  └── TestUserContext (test data filtering)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTIONS                          │
│  Vercel Edge Runtime                                        │
│  ├── /api/chat.js (AI chat, rate limited 20 req/min)       │
│  └── Input sanitisation, user context                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  PostgreSQL 15 + Auth + Storage                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS)                            │  │
│  │  ├── Role-based access (admin, supplier_pm, etc)     │  │
│  │  └── Project-scoped data isolation                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Triggers (8 tables)                           │  │
│  │  └── INSERT/UPDATE/DELETE → audit_log                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Soft Delete (9 tables)                              │  │
│  │  └── is_deleted, deleted_at, deleted_by              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Sanitisation → Service → Supabase → RLS Check → DB
     ↓                                    ↓
  Validation                        Audit Trigger
     ↓                                    ↓
Toast Feedback                      audit_log
```

---

## 8. Best Practices Checklist

### Code Quality ✅

- [x] Service layer abstraction
- [x] Consistent error handling
- [x] Input sanitisation
- [x] TypeScript-ready patterns (JSDoc comments)
- [x] ESLint compliance
- [ ] Unit test coverage (>80%)
- [ ] Integration test coverage

### Security ✅

- [x] XSS protection (sanitize.js)
- [x] SQL injection protection (Supabase parameterised)
- [x] CSRF protection (Supabase Auth)
- [x] Rate limiting (AI endpoint)
- [x] Session management
- [x] RLS policies
- [x] Audit logging
- [ ] Content Security Policy headers
- [ ] Dependency vulnerability scanning

### Performance ✅

- [x] Code splitting
- [x] Lazy loading pages
- [x] Vendor chunk separation
- [x] Partial indexes on soft delete
- [ ] Service worker caching
- [ ] Image optimisation (if applicable)
- [ ] Database query analysis

### Data Protection ✅

- [x] Soft delete with recovery
- [x] Audit trail
- [x] Delete cascade warnings
- [x] Role-based permissions
- [x] Supabase daily backups
- [ ] PITR (Point-in-Time Recovery) - requires Pro tier

### Documentation ✅

- [x] Development Playbook (v15)
- [x] User Manual (v4)
- [x] Configuration Guide (v6)
- [x] Claude Session Prompt (v6)
- [x] SQL scripts documented
- [ ] API documentation
- [ ] Component storybook

---

## 9. SQL Deployment Status

### Deployed ✅

| Script | Purpose | Deployed |
|--------|---------|----------|
| soft-delete-implementation.sql | Soft delete columns on 9 tables | 30 Nov 2025 |
| audit-triggers.sql | Audit logging on 8 tables | 30 Nov 2025 |
| P5a-partner-invoices-tables.sql | Invoice tables | 30 Nov 2025 |
| P5b-partner-invoices-rls.sql | Invoice RLS policies | 30 Nov 2025 |
| P6-enhanced-invoice-lines.sql | Enhanced invoice schema | 30 Nov 2025 |
| data-integrity-constraints.sql | NOT NULL, indexes | 30 Nov 2025 |

### Verification Queries

```sql
-- Check soft delete columns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'is_deleted';

-- Check audit triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'audit_%';

-- View recent audit activity
SELECT * FROM recent_audit_activity LIMIT 20;

-- View deleted items
SELECT * FROM deleted_items_summary;
```

---

## 10. Documentation Index

### Current Versions

| Document | Version | Location |
|----------|---------|----------|
| Development Playbook | v15.0 | AMSF001-Development-Playbook-v15.md |
| User Manual | v4.0 | AMSF001-User-Manual-v4.md |
| Configuration Guide | v6.0 | AMSF001-Configuration-Guide-v6.md |
| Claude Session Prompt | v6.0 | AI_AMSF001-Claude-Session-Prompt-v6.md |

### File Structure

```
/
├── AMSF001-Development-Playbook-v15.md    ← YOU ARE HERE
├── AMSF001-User-Manual-v4.md
├── AMSF001-Configuration-Guide-v6.md
├── AI_AMSF001-Claude-Session-Prompt-v6.md
├── README.md
├── sql/
│   ├── DEPLOY-INSTRUCTIONS.md
│   ├── soft-delete-implementation.sql      ✅ DEPLOYED
│   ├── audit-triggers.sql                  ✅ DEPLOYED
│   └── [other migration scripts]           ✅ DEPLOYED
└── src/
    ├── services/                           ✅ COMPLETE
    ├── lib/sanitize.js                     ✅ DEPLOYED
    └── [application code]
```

---

## Appendix A: Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview build

# Git workflow
git add -A
git commit -m "message"
git push origin main           # Auto-deploys to Vercel

# Check build size
npm run build 2>&1 | grep -E "\.js|\.css"

# Database (Supabase SQL Editor)
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
SELECT * FROM deleted_items_summary;
```

---

## Appendix B: Contact Points

| Service | Dashboard |
|---------|-----------|
| Vercel | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| Supabase | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
| GitHub | https://github.com/spac3man-G/amsf001-project-tracker |

---

*End of Development Playbook v15.0*
