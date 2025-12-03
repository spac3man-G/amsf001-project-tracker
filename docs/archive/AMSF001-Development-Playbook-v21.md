# AMSF001 Development Playbook v21

**Last Updated:** 1 December 2025  
**Version:** 21.0  
**Production Readiness:** 94%

---

## Recent Updates (1 December 2025)

### ✅ AI Chat Assistant Implementation (COMPLETE & VERIFIED)
**Duration:** 1.5 hours  
**Status:** ✅ Deployed to Production ✅ User Tested

#### What Was Built

Full implementation of context-aware AI chat with database query capabilities:

1. **Backend API (api/chat.js v3.0)**
   - 1,281 lines of code
   - Claude Haiku 3.5 with function calling
   - 12 database query tools implemented
   - Role-based data scoping
   - Lazy Supabase client initialization
   - Rate limiting (30 requests/minute)

2. **Tool Functions Implemented**
   - `getUserProfile` - Current user info
   - `getMyPendingActions` - Draft items & approval queue
   - `getRolePermissions` - Explain role capabilities
   - `getTimesheets` / `getTimesheetSummary` - Time entries
   - `getExpenses` / `getExpenseSummary` - Expense entries
   - `getMilestones` / `getDeliverables` - Project progress
   - `getBudgetSummary` - Budget vs actual
   - `getResources` - Team members
   - `getKPIs` - Performance indicators

3. **Frontend Updates**
   - Simplified ChatContext.jsx (backend now handles data)
   - Updated welcome message with example queries
   - Added database query indicator icon
   - New loading text: "Querying data..."

#### Files Modified
```
api/chat.js (rewritten, 1,281 lines)
src/contexts/ChatContext.jsx (simplified, 139 lines)
src/components/chat/ChatWidget.jsx (updated)
src/components/chat/ChatWidget.css (added indicator styles)
```

#### Environment Variables Added
```
SUPABASE_SERVICE_ROLE_KEY - Required for database queries (added to Vercel)
```
⚠️ **Critical:** Without this key, chat displays "Database connection not configured" error.

#### Testing Verified
- ✅ Database connection established
- ✅ Tool calling working correctly
- ✅ Data queries returning results
- ✅ Role-based scoping active

#### Git Commits
```
36421851 - chore: trigger redeploy for env var update
f443f65a - feat: implement AI Chat Assistant with tool calling
```

#### Deployment
- Deployment: dpl_HjiHRXSF6rgPEB2ijADoDsZE77nt
- Status: ✅ READY
- URL: https://amsf001-project-tracker.vercel.app

---

### ✅ Partner Invoice UX Improvements (COMPLETE)
**Duration:** 2 hours  
**Status:** ✅ Deployed to Production

#### What Was Built

1. **Redesigned Invoice Summary**
   - Top row with 4 summary cards:
     - Timesheets (blue) - all billable
     - Expenses Billable (green) - chargeable to customer
     - Expenses Non-Billable (red) - not chargeable
     - Invoice Total (purple) - to be paid by partner
   - Expenses Breakdown panel with 5 metrics:
     - Total Expenses
     - Chargeable to Customer
     - Not Chargeable
     - Paid by Partner (on invoice)
     - Paid by Supplier (not on invoice)

2. **Print to PDF Functionality**
   - Print/Save PDF button added
   - Opens new window with formatted invoice
   - All timesheets and expenses shown (no truncation)
   - Scroll constraints removed programmatically
   - A4 optimized styling

3. **Supplier Expenses Always Visible**
   - Section always renders (even when empty)
   - Clear "NOT ON THIS INVOICE" badge
   - Helpful explanation text
   - Dashed amber border for distinction

#### Files Modified
```
src/pages/PartnerDetail.jsx
- Added Printer icon import
- Added handlePrintInvoice() function with HTML/CSS generation
- Redesigned summary cards (lines ~1105-1210)
- Added invoice-print-content wrapper div
- Added Print/Save PDF button

src/services/invoicing.service.js  
- Fixed procurement_method null handling for backward compatibility
```

#### Git Commits
```
3ee21801 - fix: print view now shows all timesheet and expense entries
5557f75d - feat: redesign invoice summary with expenses breakdown and print to PDF
b523fc92 - feat: redesign invoice summary with chargeable breakdown
8382ea5a - feat: improve invoice supplier expenses UI with always-visible section
```

#### Deployment
- Commit: 3ee21801
- Deployment: Auto-deployed via Vercel Git integration
- URL: https://amsf001-project-tracker.vercel.app

---

### ✅ AI Chat Assistant Specification (IMPLEMENTED)
**Duration:** 1.5 hours  
**Status:** ✅ Specification Approved → ✅ Implemented Same Day

#### What Was Created

Full technical specification for AI Chat Assistant:
- Requirements brief with user personas
- Functional and non-functional requirements
- Tool definitions for 12+ database query functions
- Permission scoping matrix
- System prompt template
- Response examples
- Implementation plan (4 phases)
- Cost analysis (~£0.40/month for 100 queries)

#### Document Created
```
AI-CHAT-ASSISTANT-SPEC.md (693 lines)
```

#### Key Features Specified
1. **Data Queries**
   - Timesheets, expenses, milestones, deliverables
   - Budget summaries, KPIs
   - Resource and partner information

2. **Personal Guidance**
   - "What do I need to do next?" functionality
   - Pending actions summary
   - Role permissions explanation

3. **Technical Approach**
   - Claude Haiku 3.5 with function calling
   - Tool-based database queries
   - Permission scoping at query level
   - Conversation context within sessions

#### Next Steps
- Implementation Phase 1: Core infrastructure (Week 1)
- Implementation Phase 2: Extended tools (Week 2)
- Implementation Phase 3: Polish & testing (Week 3)
- Implementation Phase 4: Documentation & deployment (Week 4)

---

## Previous Updates (2 December 2025)

### ✅ Smart Receipt Scanner Implementation (COMPLETE)
**Status:** ✅ Code Complete - Pending Database Deployment

See `RECEIPT-SCANNER-DEPLOYMENT.md` for deployment checklist.

#### Files Implemented
- `api/scan-receipt.js` - Vercel Edge Function (300 lines)
- `src/services/receiptScanner.service.js` - Service layer (522 lines)
- `src/components/expenses/ReceiptScanner.jsx` - UI component (694 lines)
- `src/components/expenses/ReceiptScanner.css` - Styling (725 lines)
- `sql/P7-receipt-scanner.sql` - Database schema (310 lines)

---

## Previous Updates (1 December 2025)

### ✅ Dashboard Drag-and-Drop Implementation (COMPLETE)
**Status:** ✅ Deployed to Production

#### Files Modified
- Dashboard.jsx v4.0 (637 lines)
- Dashboard.css (137 lines)
- dashboardPresets.js v2.0 (311 lines)
- useDashboardLayout.js v2.0 (254 lines)

---

## Current Architecture

### Service Layer (18 Services)
```
src/services/
├── index.js                    # Barrel export
├── auth.service.js             # Authentication
├── projects.service.js         # Project CRUD
├── milestones.service.js       # Milestone management
├── deliverables.service.js     # Deliverable tracking
├── resources.service.js        # Resource management
├── timesheets.service.js       # Time tracking
├── expenses.service.js         # Expense management
├── partners.service.js         # Partner organizations
├── invoicing.service.js        # Invoice generation ✨ Updated
├── kpis.service.js             # KPI management
├── qualityStandards.service.js # Quality tracking
├── risks.service.js            # Risk management
├── issues.service.js           # Issue tracking
├── dashboard.service.js        # Dashboard layouts
├── auditLog.service.js         # Audit logging
├── deletedItems.service.js     # Soft delete recovery
├── receiptScanner.service.js   # AI receipt processing
└── notifications.service.js    # User notifications
```

### API Layer (Edge Functions)
```
api/
├── chat.js          # AI Chat (to be enhanced for tools)
└── scan-receipt.js  # Receipt Scanner
```

---

## Development Workflow

### Standard Process
1. Create feature branch (if major change)
2. Implement changes
3. Test locally
4. Commit with descriptive message
5. Push to main (auto-deploys via Vercel)
6. Verify deployment
7. Update documentation

### Commit Message Format
```
type: brief description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `docs`, `refactor`, `style`, `test`

---

## Deployment Configuration

### Vercel Settings
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Node Version: 18.x

### Environment Variables
```
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[from Supabase dashboard]
ANTHROPIC_API_KEY=[for AI features]
```

---

## Pending Deployments

### Smart Receipt Scanner
**Status:** Code complete, awaiting database migration

**Steps Required:**
1. Run `sql/P7-receipt-scanner.sql` in Supabase
2. Create `receipt-scans` storage bucket
3. Verify `ANTHROPIC_API_KEY` in Vercel
4. Test in production

### AI Chat Assistant
**Status:** Specification complete, awaiting implementation

**Implementation Order:**
1. Update `api/chat.js` with tool definitions
2. Implement tool execution functions
3. Add user context passing from frontend
4. Test and refine

---

## Technical Debt

### Low Priority
- [ ] Add comprehensive test coverage
- [ ] Implement E2E tests with Playwright
- [ ] Add Storybook for component documentation
- [ ] Performance optimization for large datasets

### Medium Priority
- [ ] Refactor PartnerDetail.jsx (now 1500+ lines)
- [ ] Extract invoice modal to separate component
- [ ] Add loading skeletons for better UX

---

## Performance Metrics

### Current Benchmarks
- Initial Load: < 2 seconds
- Time to Interactive: < 3 seconds
- Lighthouse Score: 90+
- Bundle Size: ~495KB gzipped

### Invoice Modal
- Generation Time: < 1 second
- Print Window Load: < 0.5 seconds

---

## Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| Master Document | 4.0 | 1 Dec 2025 |
| User Manual | 7.0 | 1 Dec 2025 |
| Development Playbook | 20.0 | 1 Dec 2025 |
| Configuration Guide | 8.0 | 1 Dec 2025 |
| AI Chat Assistant Spec | 1.0 | 1 Dec 2025 |
| Receipt Scanner Spec | 1.0 | 2 Dec 2025 |

---

## Quick Reference

### Key Commands
```bash
# Start development
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Build for production
npm run build

# Deploy (automatic via git push)
git add -A && git commit -m "message" && git push
```

### Key URLs
| Resource | URL |
|----------|-----|
| Live App | https://amsf001-project-tracker.vercel.app |
| Supabase | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
| Vercel | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub | https://github.com/spac3man-G/amsf001-project-tracker |

---

*Development Playbook Version: 20.0 | Last Updated: 1 December 2025*
