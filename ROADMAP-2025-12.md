# AMSF001 Project Tracker - Development Roadmap

**Created:** 1 December 2025  
**Current Production Readiness:** 96%  
**Target Production Readiness:** 98%

---

## Executive Summary

This roadmap outlines technical debt, improvements, and pending features for the AMSF001 Project Tracker. Items are prioritized by business value and technical risk.

---

## ~~🔴 Priority 1: Pending Deployments (Immediate)~~ ✅ COMPLETE

### 1.1 Smart Receipt Scanner Database Migration
**Status:** ✅ Deployed and Verified (1 December 2025)  
**Evidence:** 
- `receipt_scans` table exists with data
- `classification_rules` table exists with 5 learned patterns
- Learning system actively capturing user corrections

**Verified Working:**
- Receipt image upload and storage
- AI-powered data extraction
- Category classification
- Learning from corrections (Guernsey Airport → Travel, Nomu Restaurant → Sustenance, etc.)

---

## 🟠 Priority 2: Technical Debt (Short-term)

### 2.1 Large Component Refactoring
**Effort:** 2-4 hours each  
**Risk:** Medium - improves maintainability

| Component | Lines | Recommended Action |
|-----------|-------|-------------------|
| PartnerDetail.jsx | 1,492 | Extract InvoiceModal, ExpenseTable, TimesheetTable |
| Milestones.jsx | 1,274 | Extract MilestoneForm, MilestoneTable, BudgetChart |
| ResourceDetail.jsx | 1,117 | Extract TimesheetPanel, ExpensePanel, AllocationChart |
| Expenses.jsx | 1,020 | Extract ExpenseForm, ExpenseFilters, ReceiptViewer |

**Refactoring Pattern:**
```
Before: src/pages/PartnerDetail.jsx (1,492 lines)

After:
  src/pages/PartnerDetail.jsx (~400 lines)
  src/components/partners/InvoiceModal.jsx (~500 lines)
  src/components/partners/InvoiceSummaryCards.jsx (~200 lines)
  src/components/partners/PartnerTimesheets.jsx (~200 lines)
  src/components/partners/PartnerExpenses.jsx (~200 lines)
```

### 2.2 Dependency Updates
**Effort:** 1-2 hours  
**Risk:** Medium - some breaking changes

| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|-----------------|
| @vercel/speed-insights | 1.2.0 | 1.3.0 | Minor - safe to update |
| date-fns | 3.6.0 | 4.1.0 | **Major** - API changes |
| lucide-react | 0.294.0 | 0.555.0 | Minor - icon name changes |
| react | 18.3.1 | 19.2.0 | **Major** - wait for ecosystem |
| react-router-dom | 6.30.2 | 7.9.6 | **Major** - loader/action changes |
| recharts | 2.15.4 | 3.5.1 | **Major** - API changes |
| vite | 5.4.21 | 7.2.6 | **Major** - config changes |

**Recommended Updates (safe):**
```bash
npm update @vercel/speed-insights lucide-react
```

**Deferred Updates (breaking):**
- React 19, React Router 7, Vite 7 - defer until ecosystem mature
- date-fns 4, recharts 3 - schedule dedicated update sprint

### 2.3 Chat API Error Handling Enhancement
**Effort:** 1 hour  
**Risk:** Low

Current `api/chat.js` needs:
- [ ] Better error messages for tool failures
- [ ] Retry logic for transient Supabase errors
- [ ] Token usage logging for cost monitoring
- [ ] Rate limit response caching

### 2.4 Dashboard Performance
**Effort:** 2 hours  
**Risk:** Low

- [ ] Add loading skeletons for widgets
- [ ] Implement widget-level data caching
- [ ] Lazy load non-visible widgets
- [ ] Add React.memo to prevent unnecessary re-renders

---

## 🟡 Priority 3: Feature Enhancements (Medium-term)

### 3.1 AI Chat Assistant Improvements
**Effort:** 4-8 hours  
**Business Value:** High

**Phase 1 Enhancements:**
- [ ] Conversation history persistence (store in database)
- [ ] Export chat to document
- [ ] Suggested follow-up questions
- [ ] Date range picker for data queries
- [ ] Natural language date parsing ("last month", "Q3")

**New Tools to Add:**
- [ ] `getProjectSummary` - High-level project overview
- [ ] `compareTimePeriods` - Month-over-month or week-over-week
- [ ] `getAnomalies` - Unusual spending or delays
- [ ] `getApprovalQueue` - Detailed pending items for approvers

### 3.2 Reporting System
**Effort:** 8-16 hours  
**Business Value:** High

**Reports to Implement:**
1. **Monthly Status Report** (PDF export)
   - Milestone progress
   - Budget vs actual
   - KPI dashboard
   - Risks and issues

2. **Partner Statement** (PDF export)
   - Period summary
   - Invoice history
   - Outstanding balance

3. **Resource Utilisation Report**
   - Billable vs non-billable hours
   - Allocation vs actual
   - Forecast vs capacity

### 3.3 Notification System
**Effort:** 4-8 hours  
**Business Value:** Medium

- [ ] Email notifications for approvals
- [ ] In-app notification center
- [ ] Configurable notification preferences
- [ ] Digest emails (daily/weekly summary)

### 3.4 Multi-Tenant Architecture
**Effort:** 16-24 hours  
**Business Value:** High (enables scaling)

**Changes Required:**
- [ ] Organisation/tenant table
- [ ] Tenant-scoped RLS policies
- [ ] Tenant admin role
- [ ] Tenant settings (branding, defaults)
- [ ] Tenant onboarding flow

---

## 🟢 Priority 4: Quality & Testing (Ongoing)

### 4.1 Test Coverage
**Current Coverage:** ~0%  
**Target Coverage:** 70%+

**Testing Strategy:**
```
Unit Tests (Jest):
- Services: invoicing.service.js, expenses.service.js
- Utilities: date helpers, formatters
- Hooks: useDashboardLayout, useProjectContext

Integration Tests (React Testing Library):
- Form submissions
- Data fetching flows
- Role-based visibility

E2E Tests (Playwright):
- Timesheet submission workflow
- Expense approval workflow
- Invoice generation
- Receipt scanning
```

### 4.2 Performance Monitoring
**Effort:** 2-4 hours

- [ ] Set up Vercel Speed Insights alerts
- [ ] Add custom performance markers
- [ ] Monitor API response times
- [ ] Track Core Web Vitals

### 4.3 Accessibility Audit
**Effort:** 4-8 hours

- [ ] WCAG 2.1 AA compliance check
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Color contrast verification
- [ ] Focus management in modals

---

## 🔵 Priority 5: Future Features (Long-term)

### 5.1 Mobile Application (Q2 2026)
- React Native or PWA
- Timesheet entry on-the-go
- Receipt camera capture
- Push notifications

### 5.2 External Integrations (Q2-Q3 2026)
- Calendar sync (Google, Outlook)
- Slack/Teams notifications
- Accounting system export (Xero, QuickBooks)
- SSO (SAML, OIDC)

### 5.3 Advanced AI Features (Q3-Q4 2026)
- Predictive budget forecasting
- Anomaly detection alerts
- Automated monthly reports
- Smart scheduling suggestions

---

## Implementation Schedule

### December 2025
| Week | Focus | Tasks |
|------|-------|-------|
| 1 | ✅ AI Chat | Implemented and verified |
| 2 | Receipt Scanner | Deploy P7 migration, test in production |
| 3 | Refactoring | Extract InvoiceModal from PartnerDetail |
| 4 | Buffer | Bug fixes, documentation |

### January 2026
| Week | Focus | Tasks |
|------|-------|-------|
| 1 | Refactoring | Continue component extraction |
| 2 | Testing | Set up Jest, write service tests |
| 3 | Chat Enhancements | Add conversation history, new tools |
| 4 | Reporting | Monthly status report (PDF) |

### February 2026
| Week | Focus | Tasks |
|------|-------|-------|
| 1 | Multi-Tenant | Database schema, RLS policies |
| 2 | Multi-Tenant | Admin UI, onboarding flow |
| 3 | Notifications | Email integration |
| 4 | Polish | Performance, accessibility |

---

## Quick Wins (< 1 hour each)

These can be done anytime to improve quality:

1. [ ] Add loading skeleton to Dashboard widgets
2. [ ] Update @vercel/speed-insights to 1.3.0
3. [ ] Add token usage logging to chat API
4. [ ] Create CONTRIBUTING.md for documentation
5. [ ] Add health check endpoint (/api/health)
6. [ ] Add Lighthouse CI to GitHub Actions
7. [ ] Create component README files
8. [ ] Add JSDoc comments to services

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 19 breaking changes | High | Wait for stable, test in branch |
| Supabase service limits | Medium | Monitor usage, optimize queries |
| AI API costs | Low | Rate limiting, usage monitoring |
| Large file uploads | Medium | Image compression (implemented) |

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Production readiness | 94% | 98% |
| Test coverage | 0% | 70% |
| Lighthouse score | 90+ | 95+ |
| Bundle size | 495KB | <450KB |
| Page load time | <2s | <1.5s |
| Chat response time | ~3s | <2s |

---

## Next Actions

**Immediate (this week):**
1. ✅ ~~Deploy Smart Receipt Scanner~~ - Already deployed and working!
2. Begin PartnerDetail.jsx refactoring (extract InvoiceModal)

**Short-term (this month):**
1. Extract InvoiceModal from PartnerDetail.jsx
2. Add loading skeletons to Dashboard
3. Set up basic Jest configuration

**Medium-term (next month):**
1. Implement conversation history for chat
2. Create Monthly Status Report
3. Begin multi-tenant architecture design

---

*Document Version: 1.0 | Created: 1 December 2025*
