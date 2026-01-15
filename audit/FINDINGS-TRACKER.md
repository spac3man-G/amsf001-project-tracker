# Security Audit - Consolidated Findings Tracker

**Purpose:** Single source of truth for all findings, sortable by severity and actionability.
**Last Updated:** 15 January 2026

---

## Quick Stats

| Severity | Count | Addressed | Remaining |
|----------|-------|-----------|-----------|
| Critical | 2 | 1 | 1 |
| High | 6 | 0 | 6 |
| Medium | 17 | 0 | 17 |
| Low | 14 | 0 | 14 |
| Info | 27 | - | - |
| **Total** | **66** | **1** | **38** |

---

## Critical Findings (Immediate Action)

| ID | Title | Location | Effort | Status |
|----|-------|----------|--------|--------|
| AUDIT-01-001 | Chat API Missing JWT Verification | `api/chat.js:3427` | High | Open |
| AUDIT-05-001 | React Router XSS Vulnerability | `package.json` | Low | **FIXED** |

---

## High Findings (30 Days)

| ID | Title | Location | Effort | Status |
|----|-------|----------|--------|--------|
| AUDIT-01-002 | Rate Limiting Bypassable | `api/chat.js:3432` | Low | Open |
| AUDIT-01-003 | Missing Security Headers | `vercel.json` | Low | Open |
| AUDIT-02-001 | No Data Retention/Deletion Mechanism | Database schema | High | Open |
| AUDIT-03-001 | XSS Vulnerability in Chat Components | `ChatWidget.jsx`, `MobileChat.jsx` | Low | Open |
| AUDIT-04-001 | Duplicate Base Service Classes | `base.service.js`, `base.evaluator.service.js` | Medium | Open |
| AUDIT-06-001 | Unit Tests Failing After Role Model Changes | `src/__tests__/` | Medium | Open |

---

## Medium Findings (90 Days)

| ID | Title | Location | Effort | Status |
|----|-------|----------|--------|--------|
| AUDIT-01-004 | Service Role Key Overuse | `api/chat.js:17` | Medium | Open |
| AUDIT-01-005 | Portal Tokens Not Signed | `api/evaluator/vendor-portal-auth.js:123` | Medium | Open |
| AUDIT-01-006 | Scan Receipt No Auth | `api/scan-receipt.js:108` | Low | Open |
| AUDIT-01-007 | Debug Info in Errors | `api/chat.js:270` | Low | Open |
| AUDIT-02-002 | Personal Data Scattered Across Tables | Multiple tables | Medium | Open |
| AUDIT-02-003 | Soft Delete Not Consistent | Various tables | Medium | Open |
| AUDIT-02-004 | Views May Expose Data Without RLS | Database views | Low | Open |
| AUDIT-03-002 | Sensitive Data in Client Storage | Contexts | Medium | Open |
| AUDIT-03-003 | Error Boundary Exposes Details | `ErrorBoundary.jsx` | Low | Open |
| AUDIT-04-002 | Inconsistent Service Patterns | `planItemsService.js`, `syncService.js` | Medium | Open |
| AUDIT-04-003 | AG Grid Not Standardized | `src/components/evaluator/*/` | Medium | Open |
| AUDIT-04-004 | Count Queries Fetch All Records | `base.service.js:460` | Low | Open |
| AUDIT-05-002 | Development Dependency Vulnerabilities | `package.json` devDependencies | Medium | Open |
| AUDIT-05-003 | Inconsistent Supabase URL Environment Variable | All API files | Low | Open |
| AUDIT-05-004 | No Request Validation Library | All API files | Medium | Open |
| AUDIT-06-002 | No Code Linting Configuration | Project root | Medium | Open |
| AUDIT-06-003 | Heavy Console Logging | 226 source files | Medium | Open |

---

## Low Findings (Backlog)

| ID | Title | Location | Effort | Status |
|----|-------|----------|--------|--------|
| AUDIT-01-008 | Weak Initial Passwords | `api/create-user.js:166` | Low | Open |
| AUDIT-01-009 | In-Memory Rate Limits | `api/chat.js:336` | Medium | Open |
| AUDIT-01-010 | Localhost Stats Bypass | `api/chat.js:3381` | Low | Open |
| AUDIT-02-005 | Audit Logs Lack Tamper Protection | Audit tables | Low | Open |
| AUDIT-02-006 | No Data Classification System | Schema | Low | Open |
| AUDIT-03-004 | External Links Missing rel Attributes | Various | Low | Open |
| AUDIT-03-005 | No CSP Enforcement | App-wide | Low | Open |
| AUDIT-04-005 | No Query State Management Library | `src/lib/cache.js` | High | Open |
| AUDIT-04-006 | Limited White-Labeling Support | Organisations table | Medium | Open |
| AUDIT-05-005 | Anthropic Model Version Inconsistency | Various API files | Low | Open |
| AUDIT-05-006 | No API Versioning | `/api/*` | Medium | Open |
| AUDIT-06-004 | Limited Unit Test Coverage | `src/__tests__/` | High | Open |
| AUDIT-06-005 | Backup Files in Source | `src/pages/Dashboard.jsx.backup` | Low | Open |
| AUDIT-06-006 | Error Message Exposure in ErrorBoundary | `ErrorBoundary.jsx:81` | Low | Open |

---

## Quick Wins (Low Effort, High/Medium Impact)

These can be fixed quickly:

1. **AUDIT-05-001** - Update react-router-dom to fix XSS vulnerability (~5 min) **CRITICAL**
2. **AUDIT-01-003** - Add security headers to vercel.json (~15 min)
3. **AUDIT-01-007** - Remove debug field from errors (~5 min)
4. **AUDIT-01-006** - Add auth check to scan-receipt.js (~30 min)
5. **AUDIT-01-002** - Fix rate limiting after JWT fix (~15 min)
6. **AUDIT-04-004** - Use Supabase count() instead of fetching all records (~30 min)
7. **AUDIT-05-003** - Standardize Supabase URL env var (~15 min)
8. **AUDIT-06-005** - Remove backup file from source (~1 min)
9. **AUDIT-06-006** - Use getUserMessage() in ErrorBoundary (~10 min)

---

## Findings by Phase

### Phase 1: Security Foundation (Complete)
- AUDIT-01-001 through AUDIT-01-010 (10 actionable + 4 info)

### Phase 2: Data Security (Complete)
- AUDIT-02-001 through AUDIT-02-006 (6 actionable + 5 info)
- Key GDPR concerns: No data retention policy, scattered PII

### Phase 3: Frontend Security (Complete)
- AUDIT-03-001 through AUDIT-03-005 (5 actionable + 4 info)
- Key concern: XSS in chat components, sensitive data in storage

### Phase 4: Architecture & Scalability (Complete)
- AUDIT-04-001 through AUDIT-04-006 (6 actionable + 5 info)
- Key concerns: Duplicate base service classes, AG Grid not standardized, count queries inefficient
- Strengths: Well-structured context hierarchy, good multi-tenancy foundation, feature flagging ready

### Phase 5: Technology & Integration (Complete)
- AUDIT-05-001 through AUDIT-05-006 (6 actionable + 4 info)
- **CRITICAL:** react-router-dom XSS vulnerability requires immediate update
- Key concerns: Development dependency vulnerabilities, inconsistent env vars, no request validation
- Strengths: Modern dependencies, minimal external services, good build configuration

### Phase 6: Code Quality (Complete)
- AUDIT-06-001 through AUDIT-06-006 (6 actionable + 5 info)
- Key concerns: 35 unit tests failing after v3.0 role changes, no ESLint config, heavy console logging
- Strengths: Excellent error handling architecture, good code organization, comprehensive documentation

---

## AUDIT COMPLETE

All 6 phases of the security and architecture audit are now complete.

**Total Findings:** 39 actionable (2 Critical, 6 High, 17 Medium, 14 Low) + 27 Informational

**Priority Actions:**
1. Update react-router-dom (Critical XSS vulnerability)
2. Add JWT verification to Chat API (Critical auth bypass)
3. Fix failing unit tests (High - CI/CD impact)
4. Add security headers to Vercel config (High - quick win)

---

## Remediation Progress Log

| Date | Finding ID | Action Taken | By |
|------|------------|--------------|-----|
| 15 Jan 2026 | AUDIT-05-001 | Updated react-router-dom from 6.30.2 to 6.30.3 - XSS vulnerability fixed | Claude |
| 15 Jan 2026 | AUDIT-06-005 | Removed src/pages/Dashboard.jsx.backup | Claude |
| 15 Jan 2026 | AUDIT-01-003 | Added security headers to vercel.json (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) | Claude |

---

*This tracker is updated after each audit phase and when findings are addressed.*
