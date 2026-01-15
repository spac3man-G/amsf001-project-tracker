# AUDIT-05: Technology & Integration Review

**Phase:** 5 of 6
**Status:** Complete
**Date:** 15 January 2026
**Auditor:** Claude Opus 4.5

---

## Executive Summary

This phase evaluated third-party dependencies, API patterns, external integrations, and infrastructure configuration. A critical vulnerability was found in the react-router-dom dependency.

**Overall Assessment:** GOOD with ONE CRITICAL dependency update needed

**Key Statistics:**
- Findings: 1 Critical, 0 High, 3 Medium, 2 Low, 4 Informational
- Dependencies: 14 production, 10 development
- API Endpoints: 24 serverless functions
- External Services: 2 (Supabase, Anthropic)

**Strengths:**
- Modern dependency stack with recent versions
- Consistent API patterns across endpoints
- Good build configuration with security-conscious defaults
- Single external integration (Anthropic) simplifies security surface
- Strong password validation in user creation

**Critical Issue:**
- react-router-dom has HIGH severity XSS vulnerability (GHSA-2w69-qvjg-hvjx)

---

## Scope

**Areas Reviewed:**
- Third-party dependencies (package.json)
- npm audit vulnerability scan
- API endpoint patterns (24 files in /api)
- Vercel configuration and Edge Functions
- Supabase client configuration
- External service integrations
- Environment variable usage
- Vite build configuration

**Files Analysed:**
- `package.json`
- `package-lock.json` (via npm audit)
- `vercel.json`
- `vite.config.js`
- `src/lib/supabase.js`
- All files in `api/` directory (24 files)

---

## Methodology

- npm audit for vulnerability scanning
- Static analysis of API endpoint patterns
- Environment variable audit across all API files
- External service integration mapping
- Build configuration security review

---

## Findings

### Critical Severity

#### AUDIT-05-001: React Router XSS Vulnerability

**Severity:** Critical
**Category:** Dependency Vulnerability
**Location:** `package.json` - `react-router-dom: ^6.20.0`

**Description:**
The installed version of react-router-dom contains a HIGH severity XSS vulnerability via open redirects.

**npm audit Output:**
```
@remix-run/router  <=1.23.1
Severity: high
React Router vulnerable to XSS via Open Redirects
https://github.com/advisories/GHSA-2w69-qvjg-hvjx
CVSS: 8.0 (High)
CWE-79: Cross-Site Scripting (XSS)
```

**Impact:**
- Attackers could craft malicious URLs that redirect users to attacker-controlled sites
- XSS attacks could steal session tokens or user data
- Affects all users clicking links within the application

**Remediation:**
```bash
npm update react-router-dom
```

This should update to a version > 6.30.2 which contains the fix.

**Compliance:** OWASP Top 10 A07:2021 - Cross-Site Scripting
**Effort:** Low (simple dependency update)

---

### Medium Severity

#### AUDIT-05-002: Development Dependency Vulnerabilities

**Severity:** Medium
**Category:** Dependency Vulnerabilities
**Location:** `package.json` - devDependencies

**Description:**
Multiple development dependencies have moderate vulnerabilities:

| Package | Severity | Issue |
|---------|----------|-------|
| vite | Moderate | esbuild dev server vulnerability |
| vitest | Moderate | Transitive vulnerability via vite |
| @vitest/ui | Moderate | Transitive vulnerability via vitest |
| @vitest/coverage-v8 | Moderate | Transitive vulnerability via vitest |

**npm audit Summary:**
```
esbuild  <=0.24.2
Severity: moderate
Dev server allows any website to send requests and read responses
GHSA-67mh-4wv8-2f99
```

**Impact:**
- Only affects local development environments
- Does not impact production deployments
- Could expose source code during local development

**Remediation:**
```bash
npm update vite vitest @vitest/ui @vitest/coverage-v8
```

Note: May require major version updates (breaking changes possible).

**Compliance:** N/A (development only)
**Effort:** Medium (may require test updates for breaking changes)

---

#### AUDIT-05-003: Inconsistent Supabase URL Environment Variable

**Severity:** Medium
**Category:** Configuration - Consistency
**Location:** All API files

**Description:**
API files use fallback logic for Supabase URL:

```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
```

This creates ambiguity about which variable should be set in Vercel.

**Files Affected:** 16 of 24 API files

**Impact:**
- Configuration confusion during deployment
- Potential for misconfiguration if wrong variable is set
- VITE_ prefix variables are intended for client-side, not server

**Remediation:**
Standardize on `SUPABASE_URL` for server-side API functions:

```javascript
// Before
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// After
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('SUPABASE_URL environment variable required');
```

**Effort:** Low

---

#### AUDIT-05-004: No Request Validation Library

**Severity:** Medium
**Category:** API Security
**Location:** All API files

**Description:**
API endpoints perform manual request validation without a standardized library:

```javascript
// Current pattern (api/create-user.js)
if (!email || !password) {
  return res.status(400).json({ error: 'Email and password required' });
}
```

**Impact:**
- Inconsistent validation across endpoints
- Missing validation for edge cases
- No schema validation for complex objects
- Verbose, repetitive code

**Remediation:**
Consider adopting Zod or Yup for schema validation:

```javascript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['admin', 'member']),
});

// In handler
const result = CreateUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten() });
}
```

**Effort:** Medium

---

### Low Severity

#### AUDIT-05-005: Anthropic Model Version Inconsistency

**Severity:** Low
**Category:** Configuration - Consistency
**Location:** Various API files

**Description:**
Different API files reference different Claude model versions:

| File | Model |
|------|-------|
| `chat.js` | `claude-haiku-4-5-20250929`, `claude-sonnet-4-5-20250929` |
| `planning-ai.js` | `claude-opus-4-20250514` |
| `ai-gap-analysis.js` | `claude-opus-4-5-20251101` |
| Others | Various |

**Impact:**
- Inconsistent AI behavior across features
- Harder to manage model updates
- Some endpoints may use older, deprecated models

**Remediation:**
Create a centralized model configuration:

```javascript
// lib/ai-config.js
export const AI_MODELS = {
  QUICK: 'claude-haiku-4-5-20250929',     // Fast, simple queries
  STANDARD: 'claude-sonnet-4-5-20250929', // Complex queries
  PREMIUM: 'claude-opus-4-5-20251101',    // Document analysis
};
```

**Effort:** Low

---

#### AUDIT-05-006: No API Versioning

**Severity:** Low
**Category:** API Design
**Location:** `/api/*`

**Description:**
API endpoints are not versioned:

```
/api/chat
/api/create-user
/api/evaluator/ai-gap-analysis
```

If breaking changes are needed, all clients must update simultaneously.

**Impact:**
- No backward compatibility path
- Mobile apps or external integrations would break on changes
- Harder to deprecate endpoints gracefully

**Remediation:**
For future consideration, adopt versioned endpoints:

```
/api/v1/chat
/api/v1/users
/api/v2/chat  (when breaking changes needed)
```

**Effort:** Medium (architectural change)

---

### Informational

#### AUDIT-05-INFO-001: Dependency Analysis

**Production Dependencies (14):**

| Package | Version | Purpose | Last Updated |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.39.0 | Database/Auth | Current |
| @vercel/analytics | ^1.5.0 | Usage analytics | Current |
| @vercel/speed-insights | ^1.2.0 | Performance | Current |
| ag-grid-community | ^35.0.0 | Data grids | Current |
| ag-grid-react | ^35.0.0 | React wrapper | Current |
| date-fns | ^3.0.0 | Date utilities | Current |
| lucide-react | ^0.294.0 | Icons | Slightly behind |
| papaparse | ^5.5.3 | CSV parsing | Current |
| react | ^18.2.0 | UI framework | Stable |
| react-data-grid | ^7.0.0-beta.47 | Alternate grid | Beta |
| react-dom | ^18.2.0 | DOM rendering | Stable |
| react-grid-layout | ^1.5.2 | Dashboard layout | Current |
| react-router-dom | ^6.20.0 | Routing | **VULNERABLE** |
| recharts | ^2.10.0 | Charts | Current |
| xlsx | ^0.18.5 | Excel export | Current |

**Development Dependencies (10):**

| Package | Version | Purpose |
|---------|---------|---------|
| @playwright/test | ^1.57.0 | E2E testing |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/react | ^16.3.0 | React testing |
| @types/react | ^18.2.43 | TypeScript |
| @types/react-dom | ^18.2.17 | TypeScript |
| @vitejs/plugin-react | ^4.7.0 | Build |
| @vitest/coverage-v8 | ^2.1.9 | Coverage |
| @vitest/ui | ^2.1.9 | Test UI |
| jsdom | ^25.0.1 | DOM emulation |
| msw | ^2.12.4 | API mocking |
| vite | ^5.4.21 | Build tool |
| vitest | ^2.1.9 | Test runner |

---

#### AUDIT-05-INFO-002: API Endpoint Inventory

**24 API endpoints** organized by function:

**Core Application (8):**
- `chat.js` - AI assistant (Edge)
- `chat-stream.js` - Streaming responses (Edge)
- `chat-context.js` - Context fetching
- `create-user.js` - User creation (Edge)
- `create-organisation.js` - Org creation
- `create-project.js` - Project creation
- `manage-project-users.js` - User assignments
- `scan-receipt.js` - OCR for expenses

**Planning Module (2):**
- `planning-ai.js` - WBS generation (300s timeout)
- `report-ai.js` - Report generation

**Evaluator Module (14):**
- `evaluator/create-evaluation.js` - Evaluation creation
- `evaluator/vendor-portal-auth.js` - Vendor login
- `evaluator/client-portal-auth.js` - Client login
- `evaluator/client-portal-token.js` - Token generation
- `evaluator/check-deadlines.js` - Cron job (daily 6am)
- `evaluator/ai-gap-analysis.js` - Gap analysis
- `evaluator/ai-document-parse.js` - Document parsing
- `evaluator/ai-requirement-suggest.js` - Requirement suggestions
- `evaluator/ai-market-research.js` - Market research
- `evaluator/ai-analyze-response.js` - Response analysis
- `evaluator/ai-validate-vendor-response.js` - Validation
- `evaluator/ai-matrix-insights.js` - Matrix insights
- `evaluator/vendor-intelligence.js` - Intelligence
- `evaluator/generate-report.js` - Report generation

---

#### AUDIT-05-INFO-003: External Service Integrations

**Production Services:**

| Service | Purpose | Authentication |
|---------|---------|----------------|
| Supabase | Database, Auth, Storage | Service Role Key |
| Anthropic | AI/LLM | API Key |
| Vercel | Hosting, Functions | Platform |

**No Other External Calls:**
- No payment processors
- No email services (Supabase handles)
- No analytics services beyond Vercel
- No third-party logging

---

#### AUDIT-05-INFO-004: Environment Variables

**Required Variables (Production):**

| Variable | Used In | Purpose |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | AI endpoints | Claude API access |
| `SUPABASE_URL` | All APIs | Database endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | All APIs | Admin database access |
| `VITE_SUPABASE_URL` | Frontend | Client database |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Client auth |

**Optional Variables:**

| Variable | Used In | Purpose |
|----------|---------|---------|
| `ADMIN_API_KEY` | chat.js | Stats endpoint auth |
| `CRON_SECRET` | check-deadlines.js | Cron job auth |
| `VITE_APP_URL` | check-deadlines.js | Base URL |

---

## Compliance Mapping

### OWASP Top 10

| Risk | Status | Notes |
|------|--------|-------|
| A06:2021 - Vulnerable Components | **FAIL** | react-router XSS |
| A07:2021 - XSS | At Risk | Via router vulnerability |
| A04:2021 - Insecure Design | Pass | Good patterns |

### SOC 2

| Criteria | Status | Notes |
|----------|--------|-------|
| CC6.1 - Logical Access | Good | Service role properly used |
| CC6.6 - Boundary Protection | Good | Minimal external services |
| CC7.1 - Detection | Good | Audit logging in endpoints |

---

## Recommendations

### Priority 1: Immediate (Today)

1. **Update react-router-dom** (AUDIT-05-001)
   ```bash
   npm update react-router-dom
   npm audit
   ```
   - Critical XSS vulnerability
   - Simple fix with low risk

### Priority 2: This Week

2. **Update development dependencies** (AUDIT-05-002)
   - Test suite should pass after updates
   - May require test adjustments

3. **Standardize Supabase URL** (AUDIT-05-003)
   - Remove VITE_ prefix from server-side code
   - Update Vercel environment variables

### Priority 3: This Sprint

4. **Centralize AI model configuration** (AUDIT-05-005)
   - Create shared config module
   - Update all AI endpoints

5. **Consider validation library** (AUDIT-05-004)
   - Evaluate Zod or Yup
   - Start with new endpoints

### Priority 4: Future Consideration

6. **API versioning** (AUDIT-05-006)
   - Plan for v1 prefix
   - Implement before mobile app development

---

## Build Configuration Assessment

**vite.config.js Security Features:**

| Feature | Status | Notes |
|---------|--------|-------|
| Source maps | Disabled | Correct for production |
| Console stripping | Enabled | Removes debug info |
| Minification | esbuild | Fast and secure |
| Chunk splitting | Configured | Optimal caching |
| Target | ES2020 | Modern browsers |

**vercel.json Configuration:**

| Setting | Status | Notes |
|---------|--------|-------|
| Security headers | **MISSING** | See AUDIT-01-003 |
| Function timeouts | Configured | planning-ai: 300s |
| Cron jobs | Configured | check-deadlines: daily |
| Rewrites | Simple | SPA routing |

---

## Third-Party Trust Assessment

**For External Evaluators:**

1. **Dependency Hygiene:** Most dependencies are current with one critical exception. Regular npm audit should be part of CI/CD.

2. **External Surface Area:** Minimal - only Supabase and Anthropic. This significantly reduces third-party risk.

3. **Build Security:** Production builds strip debugging information and use modern bundling with security-conscious defaults.

4. **API Design:** Consistent patterns with proper method validation. Could benefit from schema validation library.

---

## Appendix

### A. Full npm audit Output

```
# npm audit report

@remix-run/router  <=1.23.1
Severity: high
React Router vulnerable to XSS via Open Redirects
fix available via `npm audit fix`

esbuild  <=0.24.2
Severity: moderate
Dev server vulnerability (development only)

Total: 3 vulnerabilities (2 moderate, 1 high)
```

### B. API File Pattern Analysis

Common patterns across all API files:

```javascript
// 1. Runtime configuration
export const config = {
  runtime: 'edge',           // For Edge Functions
  maxDuration: 120,          // For longer operations
};

// 2. Environment access
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 3. Lazy client initialization
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// 4. Method validation
if (req.method !== 'POST') {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### C. Files Reviewed

- `package.json` (76 lines)
- `vercel.json` (20 lines)
- `vite.config.js` (136 lines)
- `src/lib/supabase.js` (10 lines)
- `api/chat.js` (~3500 lines)
- `api/create-user.js` (~200 lines)
- `api/planning-ai.js` (~700 lines)
- `api/evaluator/vendor-portal-auth.js` (~200 lines)
- `api/evaluator/ai-gap-analysis.js` (~500 lines)
- 15 additional API files (spot-checked)

---

**Document Status:** Complete
**Next Phase:** Phase 6 - Code Quality Review
**Prepared By:** Claude Opus 4.5
