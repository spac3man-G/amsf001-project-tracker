# AMSF001 Project Tracker - Development Roadmap

**Version:** 3.0  
**Last Updated:** 6 December 2025  
**Current Production Readiness:** 100%

---

## Executive Summary

This roadmap outlines technical debt, improvements, and pending features for the AMSF001 Project Tracker. Items are prioritized by business value and technical risk.

---

## ✅ Recently Completed (6 December 2025)

### View As Role Impersonation
**Status:** ✅ Deployed to Production

Allows admin and supplier_pm users to preview the application as different roles without logging out.

**New Files:**
- `src/contexts/ViewAsContext.jsx` - Session-scoped role impersonation
- `src/components/ViewAsBar.jsx` - Compact dropdown selector

**Key Features:**
- Session storage persistence (survives refresh, clears on browser close)
- Only visible to admin/supplier_pm roles
- UI reflects impersonated role, data access unchanged
- Yellow/amber styling when impersonating

**Commit:** `c7c5650d`

### Mobile Chat Page
**Status:** ✅ Deployed to Production

Full-screen mobile AI assistant at `/chat` route, optimized for touch devices.

**New Files:**
- `src/pages/MobileChat.jsx` - Full-screen chat page
- `src/pages/MobileChat.css` - Touch-optimized styles

**Key Features:**
- 8 quick action buttons for common queries
- Full viewport height (`100dvh`)
- Safe area support for notched phones
- 44px+ touch targets
- Desktop fallback (centered 420×700px card)
- Auto-hides floating ChatWidget on /chat route

**Commit:** `cafa5a67`

---

## ✅ Recently Completed (5 December 2025)

### Apple Design System Implementation
**Status:** ✅ Deployed to Production

All list pages now follow consistent Apple design principles:
- No dashboard cards on list pages
- Click-to-navigate (full row clickability)
- Clean tables with minimal columns
- Consistent styling with shared CSS tokens

**Pages Updated:** Milestones, Deliverables, Resources, Expenses, Partners, Timesheets, KPIs, Quality Standards, Users, RAID Log

### AI Chat Performance Optimization
**Status:** ✅ Deployed to Production

- Query timeouts (5-second hard limit)
- Parallel tool execution with `Promise.all()`
- Extended cache TTL (1 min → 5 min)
- Partial failure handling
- Context loading indicator

---

## ✅ Previously Completed (December 2025)

### Financial Calculations Refactoring (Phases I-III)
- Centralized calculations in `metricsConfig.js`
- Database column renames (daily_rate → sell_price, budget → billable)
- Removed unused columns (discount_percent, discounted_rate, payment_percent)

### Dashboard Widgets
- TimesheetsWidget with Submitted/Validated counts
- ExpensesWidget with Chargeable/Non-Chargeable breakdown
- 4-column responsive grid

### Smart Receipt Scanner
- Receipt image upload with AI extraction
- Category classification with learning
- 5+ patterns learned

### AI Chat Assistant
- 12 database query tools
- Role-based data scoping
- Conversation persistence, export, copy features
- Three-tier response architecture (Instant, Streaming, Full)

### Component Refactoring
- PartnerDetail.jsx: 61% reduction
- Milestones.jsx: 65% reduction
- ResourceDetail.jsx: 62% reduction
- Expenses.jsx: 61% reduction

---

## 🔴 Priority 1: Pending Database Migrations

### 1.1 P9: Milestone RLS Policies ⚠️ URGENT
**Status:** SQL Created - Awaiting Deployment  
**Issue:** Milestone edits fail with "No record found" error

**Deployment Steps:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `sql/P9-milestone-update-rls.sql`

### 1.2 P8: Deliverables Contributor Access
**Status:** SQL Created - Pending Deployment  
**Purpose:** Allow contributors to edit deliverables assigned to them

---

## 🟠 Priority 2: Technical Debt (Short-term)

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

## 🟡 Priority 3: Feature Enhancements (Medium-term)

### 3.1 AI Chat Improvements
- [x] Suggested follow-up questions ✅
- [x] Date range picker for queries ✅
- [x] Natural language date parsing ✅
- [x] Mobile-optimized chat page ✅

### 3.2 Admin Tools
- [x] View As role impersonation ✅
- [ ] Audit log viewer
- [ ] Bulk user management

### 3.3 Reporting System
- [ ] Monthly Status Report (PDF)
- [ ] Partner Statement (PDF)
- [ ] Resource Utilisation Report

### 3.4 Notification System
- [ ] Email notifications
- [ ] In-app notification center
- [ ] Configurable preferences

---

## 🟢 Priority 4: Quality & Testing

### 4.1 Test Coverage
**Current:** ~0% | **Target:** 70%+

- [ ] Jest unit tests for services
- [ ] React Testing Library for components
- [ ] Playwright E2E tests

### 4.2 Accessibility Audit
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader testing

---

## 🔵 Priority 5: Future Features (Long-term)

### Q1 2026
- PWA support for mobile
- Offline capability for timesheets

### Q2 2026
- Calendar sync integrations
- Advanced AI features (forecasting, anomalies)

### Q3-Q4 2026
- External integrations (Slack, accounting)
- Multi-project support

---

## Implementation Schedule

### December 2025
| Week | Focus | Status |
|------|-------|--------|
| 1 | AI Chat, Receipt Scanner, Design System | ✅ Complete |
| 2 | View As, Mobile Chat, Documentation | ✅ Complete |
| 3 | Bug fixes, P9 migration | ⏳ In Progress |
| 4 | Buffer, holidays | Planned |

### January 2026
| Week | Focus |
|------|-------|
| 1 | Testing infrastructure (Jest setup) |
| 2 | Reporting system |
| 3 | Notification system |
| 4 | Polish and optimization |

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Production readiness | 100% | 100% |
| Test coverage | 0% | 70% |
| Lighthouse score | 90+ | 95+ |
| Bundle size (main) | 213KB | <200KB |

---

## Next Actions

**Immediate:**
1. ⚠️ Run P9-milestone-update-rls.sql in Supabase
2. Test View As feature with real admin users
3. Test Mobile Chat on iOS/Android devices

**This Week:**
1. Run P8 migration for contributor access
2. Consider adding Mobile Chat link to navigation

**This Month:**
1. Set up Jest testing
2. Begin reporting system design

---

*Roadmap Version: 3.0 | Last Updated: 6 December 2025*
