# AMSF001 Project Tracker - Development Roadmap

**Version:** 4.0  
**Last Updated:** 7 December 2025  
**Current Production Readiness:** 100%

---

## Executive Summary

This roadmap outlines technical debt, improvements, and pending features for the AMSF001 Project Tracker. Items are prioritized by business value and technical risk.

---

## ✅ Recently Completed (7 December 2025)

### Multi-Tenancy RLS Migration
**Status:** ✅ Deployed to Production

Comprehensive Row Level Security migration transforming all database policies from global roles (profiles table) to project-scoped roles (user_projects table).

**Migration Files:**
- `sql/rls-migration/phase-1-junction-tables.sql`
- `sql/rls-migration/phase-2-main-entities.sql`
- `sql/rls-migration/phase-3-additional-tables.sql`
- `sql/rls-migration/phase-4-verification.sql`

**Key Outcomes:**
- 28 tables migrated with ~102 consistent policies
- All policies now use `user_projects.role` for authorization
- Proper project scoping for all data access
- Consistent naming pattern: `{table}_{operation}_policy`

---

## ✅ Recently Completed (6 December 2025)

### Resources & Timesheets Utilities Centralization
**Status:** ✅ Deployed to Production

Following the established patterns from Milestones and Deliverables refactoring.

**New Files:**
- `src/lib/resourceCalculations.js` - Resource type, SFIA levels, margin calculations
- `src/lib/timesheetCalculations.js` - Status, workflow, validation logic
- `src/hooks/useResourcePermissions.js` - Financial visibility, partner linking
- `src/hooks/useTimesheetPermissions.js` - Submit/validate workflow permissions

### View As Role Impersonation
**Status:** ✅ Deployed to Production

Allows admin and supplier_pm users to preview the application as different roles.

**New Files:**
- `src/contexts/ViewAsContext.jsx` - Session-scoped role impersonation
- `src/components/ViewAsBar.jsx` - Compact dropdown selector

### Mobile Chat Page
**Status:** ✅ Deployed to Production

Full-screen mobile AI assistant at `/chat` route.

**New Files:**
- `src/pages/MobileChat.jsx` - Full-screen chat page
- `src/pages/MobileChat.css` - Touch-optimized styles

---

## ✅ Previously Completed (December 2025)

### Shared Utilities Architecture (Complete)

| File | Purpose | Created |
|------|---------|---------|
| `src/lib/milestoneCalculations.js` | Status, progress, certificate logic | 5 Dec |
| `src/lib/deliverableCalculations.js` | Status, workflow, sign-off logic | 6 Dec |
| `src/lib/resourceCalculations.js` | Type, SFIA, margins | 6 Dec |
| `src/lib/timesheetCalculations.js` | Status, validation | 6 Dec |
| `src/lib/formatters.js` | Date, currency formatting | 5 Dec |

### Permission Hooks (Complete)

| Hook | Purpose | Created |
|------|---------|---------|
| `useMilestonePermissions` | Signing, editing baselines | 5 Dec |
| `useDeliverablePermissions` | Submit, review, sign-off | 6 Dec |
| `useResourcePermissions` | Financial visibility | 6 Dec |
| `useTimesheetPermissions` | Submit, validate workflow | 6 Dec |

### Database Migrations (Complete)

| Script | Purpose | Status |
|--------|---------|--------|
| P8 | Deliverables contributor access | ✅ Deployed |
| P9 | Milestone update RLS | ✅ Deployed |
| P10 | Deliverable signatures | ✅ Deployed |
| P11 | Timesheets RLS fix | ✅ Deployed |
| P12 | Expenses RLS fix | ✅ Deployed |
| RLS Migration | Multi-tenancy (28 tables) | ✅ Deployed |

### Other Completed Items
- Apple Design System across all list pages
- AI Chat with 12 database query tools
- Smart Receipt Scanner with AI extraction
- Dashboard widgets (Timesheets, Expenses)
- In-App Help System with keyboard shortcuts
- Financial calculations refactoring
- Dual-signature workflows (Milestones & Deliverables)

---

## 🟠 Priority 1: Multi-Tenancy Gaps

### 1.1 Frontend Project Context
**Status:** Analysis Required  
**Effort:** 2-4 hours

The frontend currently hardcodes project selection to "AMSF001":

```javascript
// src/contexts/ProjectContext.jsx
.eq('reference', 'AMSF001')
```

**Required Changes:**
- [ ] Add project selector UI for users with multiple projects
- [ ] Store selected project in localStorage
- [ ] Update ProjectContext to use user's default/selected project
- [ ] Fetch user's available projects from user_projects

### 1.2 Auth Context Role Source
**Status:** Analysis Required  
**Effort:** 1-2 hours

The AuthContext still reads role from `profiles.role` (global):

```javascript
// src/contexts/AuthContext.jsx
role: profile?.role || 'viewer'
```

**Required Changes:**
- [ ] Fetch role from user_projects for current project
- [ ] Handle users with no project assignment gracefully
- [ ] Consider caching project-role mapping

---

## 🟡 Priority 2: Technical Debt (Short-term)

### 2.1 Dependency Updates
**Effort:** 1-2 hours  
**Risk:** Medium

**Safe Updates:**
```bash
npm update @vercel/speed-insights lucide-react
```

**Deferred (Breaking Changes):**
- React 19, React Router 7, Vite 7
- date-fns 4, recharts 3

### 2.2 Dashboard Performance
**Effort:** 2 hours

- [x] Add loading skeletons for widgets ✅
- [ ] Implement widget-level data caching
- [ ] Lazy load non-visible widgets

---

## 🟢 Priority 3: Feature Enhancements (Medium-term)

### 3.1 Admin Tools
- [x] View As role impersonation ✅
- [ ] Audit log viewer
- [ ] Bulk user management

### 3.2 Reporting System
- [ ] Monthly Status Report (PDF)
- [ ] Partner Statement (PDF)
- [ ] Resource Utilisation Report

### 3.3 Notification System
- [ ] Email notifications
- [ ] In-app notification center
- [ ] Configurable preferences

---

## 🔵 Priority 4: Quality & Testing

### 4.1 Test Coverage
**Current:** ~0% | **Target:** 70%+

- [ ] Jest unit tests for calculation utilities
- [ ] React Testing Library for permission hooks
- [ ] Playwright E2E tests for workflows

### 4.2 Accessibility Audit
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader testing

---

## 🟣 Priority 5: Future Features (Long-term)

### Q1 2026
- PWA support for mobile
- Offline capability for timesheets
- Project switching UI

### Q2 2026
- Calendar sync integrations
- Advanced AI features (forecasting, anomalies)

### Q3-Q4 2026
- External integrations (Slack, accounting)
- True multi-project support (user works on multiple projects)

---

## Implementation Schedule

### December 2025
| Week | Focus | Status |
|------|-------|--------|
| 1 | AI Chat, Receipt Scanner, Design System | ✅ Complete |
| 2 | View As, Mobile Chat, Utilities | ✅ Complete |
| 3 | RLS Migration, Documentation | ✅ Complete |
| 4 | Buffer, holidays | Planned |

### January 2026
| Week | Focus |
|------|-------|
| 1 | Multi-tenancy frontend gaps |
| 2 | Testing infrastructure (Jest setup) |
| 3 | Reporting system |
| 4 | Notification system |

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Production readiness | 100% | 100% |
| Test coverage | 0% | 70% |
| Lighthouse score | 90+ | 95+ |
| Bundle size (main) | 213KB | <200KB |
| RLS policy coverage | 100% | 100% |

---

## Next Actions

**Immediate:**
1. Complete multi-tenancy analysis
2. Document frontend gaps for project switching

**This Week:**
1. Update AuthContext to use project-scoped roles
2. Add project selector for multi-project users

**This Month:**
1. Set up Jest testing
2. Begin reporting system design

---

*Roadmap Version: 4.0 | Last Updated: 7 December 2025*
