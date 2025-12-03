# AMSF001 Project Tracker - Development Roadmap

**Version:** 2.0  
**Last Updated:** 3 December 2025  
**Current Production Readiness:** 97%  
**Target Production Readiness:** 98%

---

## Executive Summary

This roadmap outlines technical debt, improvements, and pending features for the AMSF001 Project Tracker. Items are prioritized by business value and technical risk.

---

## 🔴 Priority 1: Pending Database Migrations (Immediate)

### 1.1 P9: Milestone RLS Policies ⚠️ URGENT
**Status:** SQL Created - Awaiting Deployment  
**Issue:** Milestone edits fail with "No record found" error  
**Cause:** Missing UPDATE RLS policy on milestones table

**Deployment Steps:**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
2. Go to SQL Editor
3. Copy contents of `sql/P9-milestone-update-rls.sql`
4. Run the script

**Policies Added:**
- SELECT: All authenticated users
- UPDATE: Admin and Supplier PM
- INSERT: Admin and Supplier PM
- DELETE: Admin and Supplier PM

### 1.2 P8: Deliverables Contributor Access
**Status:** SQL Created - Pending Deployment  
**Purpose:** Allow contributors to edit deliverables assigned to them

---

## ✅ Recently Completed (3 December 2025)

### Supabase .single() Error Resolution
**Status:** ✅ Deployed to Production

Fixed "Cannot coerce the result to a single JSON object" errors across all services by replacing `.single()` with `.select()` + array access pattern.

**Files Modified:**
- base.service.js
- dashboard.service.js
- expenses.service.js
- invoicing.service.js
- milestones.service.js
- partners.service.js

---

## ✅ Previously Completed

### Smart Receipt Scanner ✅
**Status:** Deployed and Verified (1 December 2025)
- Receipt image upload and AI extraction
- Category classification with learning
- 5+ patterns learned

### AI Chat Assistant ✅
**Status:** Deployed and Verified (1 December 2025)
- 12 database query tools
- Role-based data scoping
- Conversation persistence, export, copy features

### Component Refactoring ✅
**Status:** Complete (1-2 December 2025)
- PartnerDetail.jsx: 61% reduction
- Milestones.jsx: 65% reduction
- ResourceDetail.jsx: 62% reduction
- Expenses.jsx: 61% reduction

### Apple Design System ✅
**Status:** Complete (2 December 2025)
- Modern Minimalist design with teal theme
- Centralized UI components
- Dashboard redesign

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

- [ ] Add loading skeletons for widgets
- [ ] Implement widget-level data caching
- [ ] Lazy load non-visible widgets

---

## 🟡 Priority 3: Feature Enhancements (Medium-term)

### 3.1 AI Chat Improvements
- [ ] Suggested follow-up questions
- [ ] Date range picker for queries
- [ ] Natural language date parsing

### 3.2 Reporting System
- [ ] Monthly Status Report (PDF)
- [ ] Partner Statement (PDF)
- [ ] Resource Utilisation Report

### 3.3 Notification System
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

### Q2 2026
- Mobile application (PWA or React Native)
- Calendar sync integrations

### Q3-Q4 2026
- Advanced AI features (forecasting, anomalies)
- External integrations (Slack, accounting)

---

## Implementation Schedule

### December 2025
| Week | Focus |
|------|-------|
| 1 | ✅ AI Chat, Receipt Scanner, Design System |
| 2 | ⏳ Deploy P9 migration, test milestones |
| 3 | Bug fixes, documentation |
| 4 | Buffer, holidays |

### January 2026
| Week | Focus |
|------|-------|
| 1 | Testing infrastructure (Jest setup) |
| 2 | Chat enhancements |
| 3 | Reporting system |
| 4 | Polish and optimization |

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Production readiness | 97% | 98% |
| Test coverage | 0% | 70% |
| Lighthouse score | 90+ | 95+ |
| Bundle size | 495KB | <450KB |

---

## Next Actions

**Immediate:**
1. ⚠️ Run P9-milestone-update-rls.sql in Supabase
2. Verify milestone editing works

**This Week:**
1. Run P8 migration for contributor access
2. Update any remaining documentation

**This Month:**
1. Set up Jest testing
2. Add loading skeletons to Dashboard

---

*Roadmap Version: 2.0 | Last Updated: 3 December 2025*
