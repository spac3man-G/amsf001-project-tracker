# AMSF001 Project Tracker
# Master Document: Development Playbook, Configuration & User Guide

**Version:** 1.0  
**Created:** 30 November 2025  
**Last Updated:** 30 November 2025  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document Structure

| Part | Content |
|------|---------|
| **Part 1** | Executive Summary & Production Status |
| **Part 2** | Technical Architecture |
| **Part 3** | Configuration & Credentials |
| **Part 4** | Development Roadmap |
| **Part 5** | Technical Debt & Maintenance |
| **Appendix A** | User Manual |
| **Appendix B** | SQL Deployment Reference |
| **Appendix C** | Quick Reference Cards |

---

# PART 1: EXECUTIVE SUMMARY & PRODUCTION STATUS

## 1.1 Production Readiness Score: 87%

| Category | Score | Status |
|----------|-------|--------|
| Security | 95% | ✅ Excellent |
| Data Protection | 95% | ✅ Excellent |
| Monitoring | 95% | ✅ Excellent |
| Core Features | 100% | ✅ Complete |
| Code Quality | 80% | ✅ Good |
| Multi-Tenant | 40% | 🟡 Backend Ready |
| Export/Reporting | 20% | 🟡 Basic Only |
| Testing | 0% | 🔴 Critical Gap |

## 1.2 What's Deployed (30 November 2025)

### Core Application ✅
| Feature | Status | Implementation |
|---------|--------|----------------|
| Authentication | ✅ LIVE | Supabase Auth + RLS |
| Role-Based Access | ✅ LIVE | 5 roles, 50+ permissions |
| Timesheets | ✅ LIVE | Full CRUD + approval workflow |
| Expenses | ✅ LIVE | Categories, procurement, validation |
| Resources | ✅ LIVE | Partner linking, rates, margins |
| Partners | ✅ LIVE | Third-party management |
| Enhanced Invoicing | ✅ LIVE | Full breakdown by resource |
| Milestones | ✅ LIVE | Dates, budgets, progress |
| Deliverables | ✅ LIVE | Review workflow |
| KPIs | ✅ LIVE | Targets, actuals, RAG |
| Quality Standards | ✅ LIVE | Linked to deliverables |
| AI Chat Assistant | ✅ LIVE | Claude Haiku, rate limited |
| Dashboard | ✅ LIVE | Overview metrics |
| Reports | ✅ LIVE | Basic reporting |

### Production Hardening ✅
| Feature | Status | Implementation |
|---------|--------|----------------|
| Soft Delete | ✅ LIVE | 9 tables, recovery capability |
| Audit Logging | ✅ LIVE | 8 tables, automatic triggers |
| Audit Log Viewer | ✅ LIVE | Admin UI with filtering |
| Deleted Items Recovery | ✅ LIVE | Restore + purge UI |
| Input Sanitisation | ✅ LIVE | XSS protection |
| Rate Limiting | ✅ LIVE | 20 req/min on AI |
| Session Management | ✅ LIVE | 60s checks, auto-refresh |
| Toast Notifications | ✅ LIVE | App-wide feedback |
| Form Validation | ✅ LIVE | Reusable hook |
| Error Boundary | ✅ LIVE | Global error catching |
| Bundle Optimisation | ✅ LIVE | 445KB (was 821KB) |

### Infrastructure ✅
| Feature | Status | Implementation |
|---------|--------|----------------|
| Vercel Analytics | ✅ LIVE | Page views, visitors |
| Speed Insights | ✅ LIVE | Core Web Vitals |
| GitHub Dependabot | ✅ LIVE | Security alerts + PRs |
| Secret Scanning | ✅ LIVE | Exposed secret detection |
| Supabase Backups | ✅ LIVE | Daily, 7-day retention |
| Spend Alerts | ✅ LIVE | 50/75/100% thresholds |

## 1.3 Current Build Metrics

```
Build Time: 1.21s
Total Bundle: 445KB (gzipped: ~147KB)

Breakdown:
├── index.js (app core)      119.70 KB │ gzip: 30.09 KB
├── vendor-supabase.js       178.68 KB │ gzip: 46.13 KB
├── vendor-react.js          163.22 KB │ gzip: 53.21 KB
├── vendor-icons.js           31.28 KB │ gzip:  5.84 KB
└── Page chunks (lazy)       ~130 KB   │ gzip: ~40 KB
```

---

# PART 2: TECHNICAL ARCHITECTURE

## 2.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | 6.20 |
| Build | Vite | 5.4.21 |
| Backend | Supabase | Latest |
| Database | PostgreSQL | 15 |
| AI Chat | Claude Haiku | API |
| Hosting | Vercel | Edge |
| Icons | Lucide React | 0.294 |
| Charts | Recharts | 2.10 |
| Dates | date-fns | 3.0 |

## 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (25 components, lazy-loaded)                  │  │
│  │  ├── Dashboard, Timesheets, Expenses, Resources      │  │
│  │  ├── Partners, Milestones, Deliverables, KPIs        │  │
│  │  ├── Reports, Settings, Users, WorkflowSummary       │  │
│  │  └── AuditLog, DeletedItems (Admin)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer (10 services)                        │  │
│  │  ├── BaseService (CRUD + soft delete + sanitise)     │  │
│  │  ├── partners, resources, timesheets, expenses       │  │
│  │  ├── invoicing, milestones, deliverables             │  │
│  │  └── kpis, qualityStandards                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Contexts (6 providers)                              │  │
│  │  Auth, Project, Toast, TestUser, Notification, Chat  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Monitoring                                          │  │
│  │  @vercel/analytics + @vercel/speed-insights          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION                           │
│  /api/chat.js - Vercel Edge Runtime                         │
│  ├── Claude Haiku integration                               │
│  ├── Rate limiting (20 req/min)                             │
│  ├── Input sanitisation                                     │
│  └── Project context injection                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  PostgreSQL 15 + Auth + Storage                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS)                            │  │
│  │  ├── Role-based access (5 roles)                     │  │
│  │  └── Project-scoped data isolation                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Protection                                     │  │
│  │  ├── Audit Triggers (8 tables) → audit_log          │  │
│  │  ├── Soft Delete (9 tables)                         │  │
│  │  └── Daily Backups (7-day retention)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2.3 Database Tables

### Core Tables
| Table | Soft Delete | Audit Trigger | RLS |
|-------|-------------|---------------|-----|
| profiles | - | - | ✅ |
| projects | - | - | ✅ |
| user_projects | - | - | ✅ |
| timesheets | ✅ | ✅ | ✅ |
| expenses | ✅ | ✅ | ✅ |
| resources | ✅ | ✅ | ✅ |
| partners | ✅ | ✅ | ✅ |
| milestones | ✅ | ✅ | ✅ |
| deliverables | ✅ | ✅ | ✅ |
| kpis | ✅ | ✅ | ✅ |
| quality_standards | ✅ | ✅ | ✅ |
| partner_invoices | ✅ | ✅ | ✅ |
| partner_invoice_lines | - | - | ✅ |
| audit_log | - | - | ✅ |

## 2.4 User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **admin** | Full system access | Everything |
| **supplier_pm** | JT Programme Manager | Resources, partners, invoices, cost prices |
| **customer_pm** | Government PM | Approve timesheets, validate chargeable |
| **contributor** | Team member | Submit own time/expenses |
| **viewer** | Read-only access | Dashboard and reports only |

## 2.5 File Structure

```
/
├── api/
│   └── chat.js                    # Vercel Edge Function
├── sql/
│   ├── soft-delete-implementation.sql
│   ├── audit-triggers.sql
│   └── [other migrations]
├── src/
│   ├── App.jsx                    # v10.0 - Main app
│   ├── components/
│   │   ├── common/                # 9 shared components
│   │   └── chat/                  # AI chat widget
│   ├── contexts/                  # 6 context providers
│   ├── hooks/                     # 4 custom hooks
│   ├── lib/
│   │   ├── permissions.js         # 550 lines, all auth logic
│   │   ├── sanitize.js            # XSS protection
│   │   ├── supabase.js            # DB client
│   │   └── navigation.js          # Nav config
│   ├── pages/                     # 25 page components
│   └── services/                  # 10 service modules
├── package.json
├── vite.config.js
└── vercel.json
```

---

# PART 3: CONFIGURATION & CREDENTIALS

> ⚠️ **SECURITY NOTE:** This section contains sensitive credentials. Do not commit to public repositories or share externally.

## 3.1 Quick Reference URLs

| Service | URL |
|---------|-----|
| Live Application | https://amsf001-project-tracker.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |

## 3.2 Local Development Paths

| Item | Path |
|------|------|
| Project Root | /Users/glennnickols/Projects/amsf001-project-tracker |
| Source Code | /Users/glennnickols/Projects/amsf001-project-tracker/src |
| SQL Scripts | /Users/glennnickols/Projects/amsf001-project-tracker/sql |

## 3.3 Supabase Configuration

### Project Details
| Setting | Value |
|---------|-------|
| Project Name | amsf001-tracker |
| Project ID | ltkbfbqfnskqgpcnvdxy |
| Region | eu-west-2 (London) |
| Database | PostgreSQL 15 |
| Plan | Pro (daily backups, 7-day retention) |

### Environment Variables
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[Your anon key from Supabase dashboard]

# Server-side only (Vercel env vars)
SUPABASE_SERVICE_ROLE_KEY=[Your service role key - NEVER expose client-side]
```

### Database Connection (Direct)
```
Host: db.ltkbfbqfnskqgpcnvdxy.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Your database password]
```

## 3.4 Vercel Configuration

### Project Details
| Setting | Value |
|---------|-------|
| Team | Glenn's projects |
| Team ID | team_earXYyEn9jCrxby80dRBGlfP |
| Project ID | prj_vZxrZGvrrPbC81XRF3KdzHpduSGZ |
| Framework | Vite |
| Node Version | 20.x |

### Environment Variables (Vercel Dashboard)
```bash
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[anon key]
ANTHROPIC_API_KEY=[Anthropic API key for AI chat]
```

### Deployment Settings
- **Auto-deploy:** From GitHub main branch
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

## 3.5 GitHub Repository

| Setting | Value |
|---------|-------|
| Owner | spac3man-G |
| Repository | amsf001-project-tracker |
| Default Branch | main |
| Visibility | Public |

### Security Features Enabled
- ✅ Dependabot Alerts
- ✅ Dependabot Security Updates
- ✅ Secret Scanning

## 3.6 Anthropic API (AI Chat)

```bash
ANTHROPIC_API_KEY=[Your Anthropic API key]
```

Edge function location: `/api/chat.js`

Configuration:
- Model: `claude-3-haiku-20240307`
- Max tokens: 1024
- Rate limit: 20 requests/minute

## 3.7 MCP Configuration (Claude Desktop)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://ltkbfbqfnskqgpcnvdxy.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[service role key]"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "[your GitHub PAT]"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/glennnickols/Projects"
      }
    }
  }
}
```

## 3.8 Local Development Setup

```bash
# Clone repository
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker

# Install dependencies
npm install

# Create .env file
echo "VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=[your anon key]" >> .env

# Start development server
npm run dev
```

### Build Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## 3.9 Test Accounts

| Email | Role | Purpose |
|-------|------|---------|
| glenn.nickols@progressive.gg | supplier_pm | Supplier PM testing |
| [admin email] | admin | Admin testing |
| [customer email] | customer_pm | Customer PM testing |
| [contributor email] | contributor | Contributor testing |

---

# PART 4: DEVELOPMENT ROADMAP

## 4.1 Phase Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Stabilisation | ✅ COMPLETE | 100% |
| Phase 2: Multi-Tenant & Export | 🟡 IN PROGRESS | 40% |
| Phase 3: Testing Foundation | ⬚ NOT STARTED | 0% |
| Phase 4: Polish & Performance | ⬚ NOT STARTED | 0% |
| Phase 5: Advanced Features | ⬚ NOT STARTED | 0% |
| Phase 6: Enterprise | ⬚ NOT STARTED | 0% |

---

## 4.2 Phase 1: Stabilisation - COMPLETE ✅

**Delivered:** 30 November 2025

All stabilisation and production hardening items are deployed and verified.

| Deliverable | Implementation | Verified |
|-------------|----------------|----------|
| Toast Notifications | ToastContext.jsx | ✅ |
| Form Validation Hook | useFormValidation.js | ✅ |
| Error Boundary | ErrorBoundary.jsx | ✅ |
| Service Layer | 10 services in /services | ✅ |
| Soft Delete | 9 tables, SQL deployed | ✅ |
| Audit Logging | 8 tables, triggers active | ✅ |
| Audit Log Viewer | AuditLog.jsx (290 lines) | ✅ |
| Deleted Items Recovery | DeletedItems.jsx (330 lines) | ✅ |
| Input Sanitisation | sanitize.js (282 lines) | ✅ |
| Rate Limiting | api/chat.js (20 req/min) | ✅ |
| Session Management | AuthContext.jsx (60s checks) | ✅ |
| Bundle Optimisation | vite.config.js (445KB total) | ✅ |
| Vercel Analytics | @vercel/analytics | ✅ |
| Vercel Speed Insights | @vercel/speed-insights | ✅ |
| GitHub Dependabot | Settings enabled | ✅ |
| GitHub Secret Scanning | Settings enabled | ✅ |
| Supabase Backups | Pro Plan verified | ✅ |
| Vercel Spend Alerts | 50/75/100% configured | ✅ |

---

## 4.3 Phase 2: Multi-Tenant & Export - IN PROGRESS

### Completed ✅
| Item | Implementation | Date |
|------|----------------|------|
| Audit Log Viewer | AuditLog.jsx | 30 Nov |
| Deleted Items Recovery | DeletedItems.jsx | 30 Nov |
| user_projects Table | SQL deployed | 30 Nov |
| switchProject() Function | ProjectContext.jsx | 30 Nov |

### Remaining Work

#### Priority 1: Project Selector (HIGH)
| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| Project selector component | Dropdown in header showing user's projects | 3h | ⬚ |
| Dynamic project loading | Load from user_projects on login | 2h | ⬚ |
| Project switching | Change project without page reload | 2h | ⬚ |
| Default project handling | Auto-select if user has only one | 1h | ⬚ |
| Test data isolation | Verify RLS enforces project scope | 2h | ⬚ |

**Total: ~10 hours**

**Technical Notes:**
- Backend ready: `user_projects` table exists
- Backend ready: `switchProject()` function exists in ProjectContext.jsx
- Need: UI component to list and select projects
- Need: Header integration showing current project
- Need: Remove hardcoded `AMSF001` from ProjectContext.jsx line 20

#### Priority 2: CSV Export (MEDIUM)
| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| Export utility | Generic CSV generator function | 2h | ⬚ |
| Timesheets export | Download filtered timesheet data | 2h | ⬚ |
| Expenses export | Download filtered expense data | 1.5h | ⬚ |
| Resources export | Download resource list | 1h | ⬚ |
| Export button component | Reusable button with download | 1h | ⬚ |

**Total: ~7.5 hours**

**Technical Notes:**
- No external library needed (native Blob + URL.createObjectURL)
- Include date range filtering
- Include status filtering
- Export visible columns only

#### Priority 3: PDF Invoice (MEDIUM)
| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| Install jspdf + jspdf-autotable | PDF generation library | 0.5h | ⬚ |
| Invoice template | Design PDF layout | 2h | ⬚ |
| Generate PDF function | Convert invoice data to PDF | 4h | ⬚ |
| Download button | Add to invoice modal | 1h | ⬚ |
| Print styling | CSS for print media | 1h | ⬚ |

**Total: ~8.5 hours**

### Phase 2 Summary
| Category | Hours | Status |
|----------|-------|--------|
| Already Complete | 0 | ✅ |
| Project Selector | 10 | ⬚ |
| CSV Export | 7.5 | ⬚ |
| PDF Invoice | 8.5 | ⬚ |
| **Total Remaining** | **26** | |

---

## 4.4 Phase 3: Testing Foundation - NOT STARTED

**Priority:** HIGH (Technical Debt)

| Task | Description | Effort |
|------|-------------|--------|
| Install test framework | Vitest + React Testing Library | 2h |
| Configure test environment | Setup, mocks, utilities | 2h |
| Service layer tests | Unit tests for all 10 services | 10h |
| Hook tests | Test usePermissions, useFormValidation | 4h |
| Component tests | Key UI components | 8h |
| Integration tests | Critical workflows (login, timesheet submit) | 6h |
| CI pipeline | GitHub Actions for automated testing | 3h |

**Total: ~35 hours**

### Test Coverage Targets
| Layer | Current | Target |
|-------|---------|--------|
| Services | 0% | 90% |
| Hooks | 0% | 80% |
| Components | 0% | 70% |
| Integration | 0% | 50% |

---

## 4.5 Phase 4: Polish & Performance - NOT STARTED

**Priority:** MEDIUM

| Task | Description | Effort |
|------|-------------|--------|
| Loading skeletons | Consistent loading states | 4h |
| Optimistic updates | Instant UI feedback | 6h |
| Mobile responsiveness | Full mobile support | 10h |
| Keyboard navigation | Accessibility improvements | 4h |
| Dark mode | Theme switching | 6h |
| Performance audit | Lighthouse optimisation | 4h |

**Total: ~34 hours**

---

## 4.6 Phase 5: Advanced Features - NOT STARTED

**Priority:** MEDIUM

| Task | Description | Effort |
|------|-------------|--------|
| Customizable Dashboard | **NEW** Drag-drop widget layout, role-based presets, user preferences | 12-16h |
| Email notifications | Approval/rejection alerts | 8h |
| Document attachments | File upload to Supabase Storage | 12h |
| Advanced search | Full-text search across entities | 8h |
| Bulk operations | Multi-select actions | 6h |

**Total: ~46-50 hours**

### Customizable Dashboard (Detailed Spec)

**User Story:** As a user, I want to customize my dashboard layout so I can see the information most relevant to my role and preferences.

**Features:**
- Drag-and-drop widget repositioning
- Resize widgets to preferred size
- Show/hide widgets based on preference
- Save layout preferences per user per project
- Reset to role-based default layouts
- Edit mode toggle for customization

**Technical Approach:**
- Library: react-grid-layout (~200KB)
- Storage: New `dashboard_layouts` table with JSONB config
- 5 role-based presets (admin, supplier_pm, customer_pm, contributor, viewer)
- Responsive: Desktop only, fallback to fixed layout on mobile

**Implementation Phases:**
1. Foundation: Widget registry + drag-drop (4-5h)
2. Persistence: Database + save/load (3-4h)
3. Polish: Edit mode UI + controls (3-4h)
4. Mobile: Responsive behavior (2-3h)

**Alternative (Simpler):** Widget visibility toggle only (no dragging) - 6-8h for 60% of value

---

## 4.7 Phase 6: Enterprise - NOT STARTED

**Priority:** LOW (Future)

| Task | Description | Effort |
|------|-------------|--------|
| SSO integration | SAML/OIDC support | 20h |
| Custom reports builder | User-defined reports | 16h |
| API for integrations | REST API endpoints | 24h |
| Webhook notifications | External system integration | 12h |
| Mobile app | React Native or PWA | 60h+ |

**Total: ~130+ hours**

---

## 4.8 Recommended Completion Plan

### Immediate (This Week)
| Day | Task | Hours |
|-----|------|-------|
| 1 | Project Selector UI component | 4h |
| 1 | Header integration | 2h |
| 2 | Project switching logic | 3h |
| 2 | Testing & verification | 2h |

**Outcome:** Multi-tenant ready, users can switch projects

### Week 2
| Day | Task | Hours |
|-----|------|-------|
| 1-2 | CSV Export utility + Timesheets | 4h |
| 2-3 | CSV Expenses + Resources | 3h |
| 3-4 | PDF Invoice setup | 4h |
| 4-5 | PDF Invoice completion | 4h |

**Outcome:** Full export capability, Phase 2 complete

### Week 3-4
| Focus | Hours |
|-------|-------|
| Test infrastructure setup | 4h |
| Service layer tests | 10h |
| Component tests | 8h |
| CI pipeline | 3h |

**Outcome:** 60%+ test coverage, Phase 3 substantially complete

### Month 2
- Complete testing (Phase 3)
- Begin polish work (Phase 4)
- Mobile responsiveness

### Month 3+
- Advanced features (Phase 5)
- Enterprise features as needed (Phase 6)

---

# PART 5: TECHNICAL DEBT & MAINTENANCE

## 5.1 Technical Debt Register

### Critical 🔴
| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| No automated tests | Regression risk | Phase 3 | 35h |
| Hardcoded project ID | Blocks multi-tenant | Phase 2 | 2h |

### High 🟡
| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| Some pages use direct Supabase | Inconsistent patterns | Migrate to services | 8h |
| No error reporting service | Blind spots in production | Add Sentry | 3h |
| Detail pages bypass service layer | Maintenance burden | Refactor | 6h |

### Medium 🟢
| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| No API versioning | Future changes harder | Add /api/v1/ prefix | 2h |
| Inconsistent date handling | Edge case bugs | Standardise with date-fns | 3h |
| Some N+1 queries | Performance | Batch in services | 4h |

### Low ⚪
| Issue | Impact | Resolution | Effort |
|-------|--------|------------|--------|
| Old documentation versions | Clutter | Archive to /docs | 0.5h |
| No component storybook | Documentation | Add Storybook | 8h |
| No API documentation | Developer experience | Generate from code | 4h |

## 5.2 Maintenance Tasks

### Weekly
- Check Dependabot alerts
- Review Vercel analytics
- Check error logs

### Monthly
- Update dependencies (minor versions)
- Review audit logs for anomalies
- Check bundle size trends
- Review backup status

### Quarterly
- Security audit
- Performance review
- Dependency major updates
- Documentation review

## 5.3 Troubleshooting Guide

### Build Failures

**"Unterminated regular expression" error:**
- Check for Unicode characters (✓, ✗, →) in JSX
- Replace with ASCII equivalents

**"Module not found" error:**
- Check import paths
- Run `npm install`
- Clear node_modules: `rm -rf node_modules && npm install`

### Deployment Issues

**Vercel build fails:**
1. Check Vercel Dashboard → Deployments → Build Logs
2. Common causes: missing env vars, TypeScript errors
3. Fix locally, push again

**Environment variables not working:**
- Ensure VITE_ prefix for frontend vars
- Redeploy after adding vars

### Database Issues

**RLS policy errors:**
- Check user has profile record
- Verify role is set correctly
- Don't reference profiles.project_id (doesn't exist)

**Data not showing:**
- Check project_id filtering
- Check is_deleted = false filter
- Verify RLS allows access

**Invoice showing £0.00:**
- Check timesheets exist in date range
- Verify resources linked to partner
- Check status is Approved or Submitted

### Session Issues

**Unexpected logout:**
- Session expires after inactivity
- Check AuthContext session management
- Verify Supabase Auth settings

---

# APPENDIX A: USER MANUAL

## A.1 Introduction

### What is AMSF001 Project Tracker?

The AMSF001 Project Tracker is a web-based application for managing the Network Standards and Design Architectural Services project between Government of Jersey (customer) and JT Telecom (supplier).

### Key Features

- **Time Tracking** - Log and approve billable hours
- **Expense Management** - Track travel, accommodation, and sustenance costs
- **Resource Management** - Manage team members and third-party partners
- **Partner Management** - Track third-party suppliers and generate detailed invoices
- **Enhanced Invoicing** - Full breakdown by resource with chargeable tracking
- **Milestone Tracking** - Monitor project phases and deliverables
- **Performance Metrics** - Track KPIs and quality standards
- **AI Assistant** - Get help and query project data
- **Audit Trail** - Track all changes to project data
- **Soft Delete** - Deleted items can be recovered

---

## A.2 Getting Started

### Accessing the Application

1. Navigate to https://amsf001-project-tracker.vercel.app
2. Log in with your email and password
3. You'll be directed to the Dashboard

### Session Security

- Sessions are checked every 60 seconds
- Expired sessions redirect to login
- Activity keeps your session alive

### Toast Notifications

The app shows notifications in the top-right corner:
- **Green** - Success
- **Red** - Error
- **Amber** - Warning
- **Blue** - Info

### Navigation

The left sidebar provides access to all features:

**Core Pages:**
- Workflow Summary, Dashboard, Reports, Gantt Chart

**Project Data:**
- Milestones, Deliverables, KPIs, Quality Standards

**Resource Management:**
- Resources, Timesheets, Expenses, Partners

**Admin (Admin/Supplier PM only):**
- Users, Settings, Audit Log, Deleted Items

---

## A.3 Timesheets

### Submitting Time

1. Navigate to **Timesheets**
2. Click **Add Time Entry**
3. Select resource, date, and hours
4. Add description of work performed
5. Click **Save** or **Save & Submit**

### Approval Workflow

| Status | Description |
|--------|-------------|
| Draft | Created but not submitted |
| Submitted | Awaiting Customer PM approval |
| Approved | Billable to customer |
| Rejected | Needs revision |

### Who Can Do What

- **Contributors** submit their own timesheets
- **Customer PM** approves/rejects timesheets
- **Admin** can do everything

---

## A.4 Expenses

### Adding Expenses

1. Navigate to **Expenses**
2. Click **Add Expense**
3. Select resource and category
4. Enter amount and date
5. Set procurement method (Supplier/Partner)
6. Set chargeable status
7. Upload receipt if required

### Expense Categories

- Travel
- Accommodation
- Sustenance

### Procurement Methods

- **Supplier Procured** - JT pays directly
- **Partner Procured** - Third-party pays, invoiced back

### Viewing Details

Click any expense row to open the detail modal showing full information and edit capability.

---

## A.5 Resources

### Resource Information

- Name and contact details
- Role and SFIA level
- Daily rate (customer price)
- Cost price (supplier cost) - visible to Supplier PM/Admin only
- Partner association (for third-party resources)

### Resource Types

- **Internal** - JT employees
- **Third-Party** - Partner resources (linked to a Partner)

---

## A.6 Partners

### Partner Management

Partners are third-party companies providing resources:
- Company name and contact
- Payment terms
- Linked resources
- Invoice history

### Viewing Partner Details

Click a partner row to see:
- Partner information
- Associated resources
- Recent invoices
- Invoice generation tools

---

## A.7 Partner Invoicing

### Generating an Invoice

1. Go to Partner Detail page
2. Select date range
3. Click **Preview Invoice**
4. Review breakdown:
   - Timesheets by resource
   - Partner-procured expenses
   - Supplier-procured expenses (info only)
5. Click **Generate Invoice**

### Invoice Contents

- **Timesheet Hours**: Resource, date, hours, cost rate, status
- **Partner Expenses**: Expenses procured by partner
- **Supplier Expenses**: Shown for reference, not invoiced
- **Summary**: Total timesheets + expenses = invoice total

### Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Created, can be edited |
| Sent | Sent to partner for payment |
| Paid | Payment received |
| Cancelled | Voided |

---

## A.8 Milestones & Deliverables

### Milestones

Project phases with:
- Reference number
- Name and description
- Start/end dates
- Status (Not Started, In Progress, Completed)
- Billable amount

### Deliverables

Work items linked to milestones:
- Reference number
- Name and description
- Due date
- Workflow status (Draft → Submitted → Delivered)

---

## A.9 KPIs & Quality Standards

### KPIs

Key Performance Indicators:
- Target vs actual values
- Trend indicators
- RAG status (Red/Amber/Green)

### Quality Standards

Quality criteria linked to deliverables:
- Standard name
- Target percentage
- Current status

---

## A.10 AI Chat Assistant

### Using the Assistant

Click the chat bubble (bottom-right) to open the AI assistant.

### Rate Limiting

Limited to **20 requests per minute** for fair usage.

### Capabilities

- Answer questions about your project
- Explain features and functionality
- Help with data interpretation
- Provide workflow guidance

---

## A.11 Admin Features

### Audit Log

View all changes made to project data:
- Filter by table, action, user, date
- Expand rows to see old/new values
- Actions: Created, Updated, Deleted, Archived, Restored

### Deleted Items

View and recover soft-deleted records:
- Filter by table type
- **Restore** - return item to active
- **Purge** (Admin only) - permanent deletion

---

## A.12 Role Permissions Summary

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add timesheets | ✓ | ✓ | - | Own only | - |
| Approve timesheets | ✓ | - | ✓ | - | - |
| Add expenses | ✓ | ✓ | - | Own only | - |
| Validate chargeable | - | - | ✓ | - | - |
| Manage resources | ✓ | ✓ | - | - | - |
| Manage partners | ✓ | ✓ | - | - | - |
| Generate invoices | ✓ | ✓ | - | - | - |
| View Audit Log | ✓ | ✓ | - | - | - |
| Restore Deleted | ✓ | ✓ | - | - | - |
| Permanent Delete | ✓ | - | - | - | - |
| Manage users | ✓ | - | - | - | - |

---

# APPENDIX B: SQL DEPLOYMENT REFERENCE

## B.1 Scripts Deployed

| Script | Purpose | Deployed |
|--------|---------|----------|
| soft-delete-implementation.sql | Soft delete columns, indexes, views | ✅ 30 Nov |
| audit-triggers.sql | Audit logging triggers | ✅ 30 Nov |
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ 30 Nov |
| P5b-partner-invoices-rls.sql | Invoice RLS | ✅ 30 Nov |
| P6-enhanced-invoice-lines.sql | Enhanced schema | ✅ 30 Nov |
| data-integrity-constraints.sql | NOT NULL, indexes | ✅ 30 Nov |

## B.2 Verification Queries

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

## B.3 Soft Delete Tables

Tables with `is_deleted`, `deleted_at`, `deleted_by`:
- timesheets
- expenses
- resources
- partners
- milestones
- deliverables
- kpis
- quality_standards
- partner_invoices

## B.4 Audit Trigger Tables

Tables with automatic audit logging:
- timesheets
- expenses
- resources
- partners
- milestones
- deliverables
- kpis
- quality_standards
- partner_invoices

---

# APPENDIX C: QUICK REFERENCE CARDS

## C.1 Development Commands

```bash
# Start development
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Git workflow
git add -A
git commit -m "message"
git push origin main  # Auto-deploys to Vercel
```

## C.2 Key File Locations

| Purpose | Path |
|---------|------|
| Main App | src/App.jsx |
| Auth Logic | src/contexts/AuthContext.jsx |
| Permissions | src/lib/permissions.js |
| Services | src/services/*.service.js |
| Sanitisation | src/lib/sanitize.js |
| AI Chat | api/chat.js |
| SQL Scripts | sql/*.sql |

## C.3 Import Patterns

```javascript
// Services
import { partnersService, timesheetsService } from '../services';

// Toast notifications
import { useToast } from '../contexts/ToastContext';
const { showSuccess, showError } = useToast();

// Permissions
import { usePermissions } from '../hooks/usePermissions';
const { canManageResources, canSeeCostPrice } = usePermissions();

// Sanitisation
import { sanitizeEntity } from '../lib/sanitize';
const clean = sanitizeEntity('timesheet', data);

// Date formatting (UK)
date.toLocaleDateString('en-GB')
```

## C.4 Dashboard Links

| Service | URL |
|---------|-----|
| Vercel Project | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| Vercel Analytics | Vercel Dashboard → Analytics tab |
| Speed Insights | Vercel Dashboard → Speed Insights tab |
| Supabase | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
| GitHub | https://github.com/spac3man-G/amsf001-project-tracker |
| GitHub Security | GitHub → Security tab |

---

*End of AMSF001 Master Document v1.0*
