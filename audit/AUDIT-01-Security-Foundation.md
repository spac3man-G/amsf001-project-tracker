# AUDIT-01: Security Foundation

**Application:** Tracker by Progressive
**Audit Phase:** 1 - Security Foundation
**Audit Date:** 15 January 2026
**Auditor:** Claude Opus 4.5
**Document Version:** 1.0

---

## Executive Summary

This audit examines the security foundation of the Tracker by Progressive application, focusing on authentication, session management, API endpoint security, and secret management. The application demonstrates **good security practices** in several areas, particularly in session management and RLS policy design, but has **critical gaps** in API authentication that require immediate attention.

### Key Statistics

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 2 |
| Medium | 4 |
| Low | 3 |
| Informational | 4 |

### Overall Assessment

The security foundation has a **mixed posture**. The client-side authentication via Supabase Auth is well-implemented with proper session management, token refresh, and expiry handling. However, the server-side API endpoints (Vercel Edge Functions) have significant authentication gaps where user context is accepted from request bodies without server-side verification.

**Immediate Action Required:** The chat API's lack of JWT verification allows authenticated users to potentially access data from projects they don't belong to by manipulating the `projectId` and `userContext` fields.

---

## Scope

### Areas Reviewed

| Area | Files Analysed |
|------|---------------|
| Authentication Flow | `src/contexts/AuthContext.jsx`, `src/lib/supabase.js` |
| Session Management | `src/contexts/AuthContext.jsx` |
| API Endpoints | `api/chat.js`, `api/create-user.js`, `api/scan-receipt.js`, `api/create-project.js`, `api/create-organisation.js`, `api/manage-project-users.js` |
| Portal Authentication | `api/evaluator/vendor-portal-auth.js`, `api/evaluator/client-portal-auth.js` |
| Security Configuration | `vercel.json`, `index.html` |
| Documentation | `docs/TECH-SPEC-05-RLS-Security.md`, `docs/TECH-SPEC-06-API-AI.md` |

### Limitations

- No active penetration testing performed
- Cloud infrastructure (Vercel/Supabase) configuration not directly inspected
- Third-party dependency vulnerabilities assessed separately in Phase 5

---

## Methodology

1. **Static Code Analysis** - Manual review of authentication and API security code
2. **Pattern Matching** - Search for common vulnerability patterns (OWASP Top 10)
3. **Configuration Review** - Examination of security headers and CORS settings
4. **Data Flow Analysis** - Tracing authentication tokens from client to server
5. **Documentation Comparison** - Comparing actual implementation to documented design

### Reference Standards

- OWASP Top 10 (2021)
- OWASP API Security Top 10
- GDPR Article 32 (Security of Processing)
- SOC 2 Trust Service Criteria (Security)

---

## Strengths

### 1. Session Management (AuthContext.jsx)

The client-side session management is well-implemented:

```javascript
// Good: Regular session checks with automatic refresh
const SESSION_CHECK_INTERVAL = 60 * 1000;
const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000;

// Good: Proactive session refresh before expiry
if (timeUntilExpiry <= EXPIRY_WARNING_THRESHOLD) {
  const { data: refreshData } = await supabase.auth.refreshSession();
}
```

**Positive Aspects:**
- Automatic session monitoring every 60 seconds
- Session refresh 5 minutes before expiry
- Visibility change handling (re-checks on tab focus)
- Activity tracking for idle detection
- Clean session expiry handling with redirect

### 2. Input Sanitisation (chat.js)

The chat API implements proper input sanitisation:

```javascript
function sanitizeMessage(content) {
  // Good: Removes null bytes and control characters
  let sanitized = content.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Good: Enforces length limit
  if (sanitized.length > 4000) sanitized = sanitized.substring(0, 4000);
  return sanitized;
}
```

### 3. Password Policy (create-user.js)

Strong password validation for user-set passwords:

```javascript
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};
```

### 4. RLS Policy Design

The documented RLS policies are comprehensive with proper isolation:
- Three-tier multi-tenancy (Organisation → Project → Entity)
- SECURITY DEFINER functions avoid policy recursion
- `can_access_project()` helper used consistently across 33 policies

### 5. Admin API Authentication

Several admin APIs correctly verify JWT tokens:

```javascript
// Good: create-project.js validates admin token
const { data: { user: requestingUser }, error: authError } =
  await supabase.auth.getUser(adminToken);
```

---

## Findings

### Critical

#### AUDIT-01-001: Chat API Missing JWT Verification

**Severity:** Critical
**Category:** Authentication
**Location:** `api/chat.js:3427-3460`
**CVSS Score:** 8.1 (High)

**Description:**

The chat API accepts POST requests without verifying the user's JWT token. The `userContext` and `projectId` are accepted directly from the request body without server-side validation:

```javascript
const body = await req.json();
const { messages, userContext, projectContext, projectId, prefetchedContext } = body;

// ISSUE: userContext and projectId are used directly without verification
const context = {
  projectId: projectId || projectContext?.id,
  userContext: userContext || {},  // Accepted without validation!
  projectContext: projectContext || {},
};
```

**Impact:**

An authenticated user could:
1. Access data from ANY project by providing a different `projectId`
2. Impersonate ANY role by manipulating `userContext.role`
3. Access data as ANY user by manipulating `userContext.email` and `userContext.linkedResourceId`

**Evidence:**

The API uses service role key for all queries, bypassing RLS completely:

```javascript
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// ...
supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

Role-based filtering is done in code, but relies on unverified `userContext`:

```javascript
// api/chat.js:1617
if (userContext.role === 'contributor' && userContext.linkedResourceId) {
  query = query.eq('resource_id', userContext.linkedResourceId);
}
```

**Remediation:**

1. Extract and verify JWT from Authorization header:

```javascript
const authHeader = req.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

// Verify user has access to the requested project via database lookup
const { data: projectAccess } = await supabase
  .from('user_projects')
  .select('role')
  .eq('user_id', user.id)
  .eq('project_id', projectId)
  .single();
```

2. Derive userContext server-side from verified user identity

**Compliance:**
- GDPR Art. 32: Inadequate authentication controls
- SOC 2 CC6.1: Logical access security controls
- OWASP API1: Broken Object Level Authorization

**Effort:** High (requires changes to all API tool functions)

---

### High

#### AUDIT-01-002: Rate Limiting Bypassable via Client-Controlled Email

**Severity:** High
**Category:** Abuse Prevention
**Location:** `api/chat.js:3432-3433`

**Description:**

Rate limiting uses `userContext.email` which is provided by the client and not verified:

```javascript
const userId = userContext?.email || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
const rateLimit = checkRateLimit(userId);
```

**Impact:**

An attacker can bypass rate limits by:
1. Changing `userContext.email` in each request
2. Using different IP addresses (x-forwarded-for is easily spoofed through proxies)

This enables:
- Cost abuse through excessive AI API calls
- Denial of service for legitimate users
- Brute force attacks on data enumeration

**Remediation:**

Use the verified JWT token's user ID for rate limiting:

```javascript
// After JWT verification (from AUDIT-01-001 fix)
const userId = verifiedUser.id;  // Use verified user ID, not client-provided email
```

**Compliance:**
- SOC 2 CC7.2: System operations monitoring
- OWASP API4: Unrestricted Resource Consumption

**Effort:** Low (after JWT verification is implemented)

---

#### AUDIT-01-003: Missing Security Headers

**Severity:** High
**Category:** Security Headers
**Location:** `vercel.json`, `index.html`

**Description:**

The application lacks essential security headers. Neither `vercel.json` nor `index.html` configure:

- `Content-Security-Policy` (CSP)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy`
- `Permissions-Policy`

**Current `vercel.json`:**
```json
{
  "rewrites": [...],
  "functions": {...},
  "crons": [...]
  // No headers configuration
}
```

**Impact:**

- **XSS vulnerability amplification** - No CSP means XSS attacks can execute arbitrary scripts
- **Clickjacking** - No X-Frame-Options allows embedding in malicious iframes
- **MIME sniffing attacks** - No X-Content-Type-Options allows content-type confusion
- **Man-in-middle attacks** - No HSTS allows protocol downgrade attacks

**Remediation:**

Add security headers to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.anthropic.com; frame-ancestors 'none';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Compliance:**
- GDPR Art. 32: Appropriate technical measures
- SOC 2 CC6.6: Security configurations
- OWASP A05: Security Misconfiguration

**Effort:** Low

---

### Medium

#### AUDIT-01-004: Service Role Key Used for All Chat Queries

**Severity:** Medium
**Category:** Data Access
**Location:** `api/chat.js:17-33`

**Description:**

The chat API uses the Supabase service role key for all database queries, completely bypassing Row Level Security:

```javascript
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}
```

**Impact:**

If the AUDIT-01-001 authentication gap is not addressed, this configuration amplifies the risk. Even with proper authentication, using service role key for all queries is a defense-in-depth violation.

**Remediation:**

After fixing authentication, consider using the user's JWT token to create a client that respects RLS:

```javascript
// Create client with user's token for RLS-protected queries
const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${userToken}` } }
});
```

Keep service role key only for specific admin operations that genuinely need to bypass RLS.

**Compliance:**
- OWASP A01: Broken Access Control
- SOC 2 CC6.1: Principle of least privilege

**Effort:** Medium

---

#### AUDIT-01-005: Vendor Portal Session Token Not Cryptographically Signed

**Severity:** Medium
**Category:** Session Management
**Location:** `api/evaluator/vendor-portal-auth.js:123-127`

**Description:**

The vendor portal generates session tokens without cryptographic signing or server-side storage:

```javascript
// Generate a simple session token
// In production, you might want to use JWT or store sessions in DB
const sessionToken = generateSessionToken(vendor.id);
const sessionExpiresAt = new Date();
sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24);
```

The code comment acknowledges this is not production-ready.

**Impact:**

- Session tokens may be forgeable if generation is predictable
- No server-side session validation possible
- Cannot revoke compromised sessions

**Remediation:**

1. Use JWT with proper signing:
```javascript
const jwt = require('jsonwebtoken');
const sessionToken = jwt.sign(
  { vendorId: vendor.id, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) },
  process.env.JWT_SECRET
);
```

2. Or store sessions in database for server-side validation

**Compliance:**
- GDPR Art. 32: Pseudonymisation and encryption
- SOC 2 CC6.1: Secure session management

**Effort:** Medium

---

#### AUDIT-01-006: Scan Receipt API No Authentication

**Severity:** Medium
**Category:** Authentication
**Location:** `api/scan-receipt.js:108-165`

**Description:**

The scan-receipt API accepts requests without verifying authentication:

```javascript
export default async function handler(req) {
  // No authentication check before processing
  const body = await req.json();
  const { image, userId } = body;

  // userId is accepted from client without verification
  const userIdentifier = userId || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
```

**Impact:**

- Unauthenticated users could call this expensive AI vision API
- Rate limiting is bypassable (same issue as AUDIT-01-002)
- API costs could be abused

**Remediation:**

Add JWT verification to the endpoint:

```javascript
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

**Compliance:**
- SOC 2 CC6.1: Logical access controls

**Effort:** Low

---

#### AUDIT-01-007: Debug Information in Error Responses

**Severity:** Medium
**Category:** Information Leakage
**Location:** `api/chat.js:270-275`

**Description:**

Error responses include a debug field with internal error details:

```javascript
return {
  error: `Unable to ${action}. Please try again or rephrase your question.`,
  tool: toolName,
  recoverable: true,
  // Include details temporarily for debugging
  debug: errorString.substring(0, 200)  // ISSUE: Leaks internal info
};
```

**Impact:**

- Internal error messages may reveal database structure
- Stack traces could expose file paths and internal logic
- Aids attackers in reconnaissance

**Remediation:**

Remove debug field in production or gate behind environment check:

```javascript
const response = {
  error: `Unable to ${action}. Please try again.`,
  tool: toolName,
  recoverable: true,
};
if (process.env.NODE_ENV === 'development') {
  response.debug = errorString.substring(0, 200);
}
return response;
```

**Compliance:**
- OWASP A09: Security Logging and Monitoring Failures

**Effort:** Low

---

### Low

#### AUDIT-01-008: Weaker Initial Password Requirements

**Severity:** Low
**Category:** Password Policy
**Location:** `api/create-user.js:166-174`

**Description:**

Admin-created passwords only require 8 characters, while user-set passwords require 12:

```javascript
// Note: Initial password created by admin can be simpler since user must change it
if (password.length < 8) {
  return new Response(JSON.stringify({
    error: 'Initial password must be at least 8 characters'
  }), { status: 400 });
}
```

**Impact:**

Initial passwords are more susceptible to brute force before user changes them.

**Remediation:**

Consider generating random secure passwords server-side rather than allowing admin to set weak ones:

```javascript
const crypto = require('crypto');
const initialPassword = crypto.randomBytes(16).toString('base64');
```

**Effort:** Low

---

#### AUDIT-01-009: In-Memory Rate Limiting Resets on Cold Start

**Severity:** Low
**Category:** Abuse Prevention
**Location:** `api/chat.js:336`

**Description:**

Rate limiting uses an in-memory Map that resets on Edge Function cold starts:

```javascript
const rateLimitStore = new Map();
```

**Impact:**

- Rate limits reset when function scales down
- Coordinated attacks could exploit cold starts
- No persistence across multiple Edge instances

**Remediation:**

Consider using a distributed cache like Vercel KV or Upstash Redis:

```javascript
import { kv } from '@vercel/kv';
// Store rate limit data in distributed cache
```

**Effort:** Medium (requires infrastructure changes)

---

#### AUDIT-01-010: Localhost Bypass for Admin Stats

**Severity:** Low
**Category:** Authentication
**Location:** `api/chat.js:3381`

**Description:**

Admin stats endpoint allows access from localhost without API key:

```javascript
const isLocal = req.headers.get('host')?.includes('localhost');
if (adminKey === process.env.ADMIN_API_KEY || isLocal) {
  // Return stats
}
```

**Impact:**

If an attacker can spoof the Host header, they might access stats. However, this is primarily a development convenience and unlikely to be exploitable in production.

**Remediation:**

Remove localhost bypass in production builds:

```javascript
if (adminKey === process.env.ADMIN_API_KEY) {
  // Only API key authentication in production
}
```

**Effort:** Low

---

### Informational

#### AUDIT-01-011: Good Auth State Change Handling

The application properly handles Supabase auth state changes:

```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    setSessionExpiring(false);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
    setSessionExpiring(false);
  }
});
```

---

#### AUDIT-01-012: Proper Environment Variable Separation

Environment variables are properly separated:
- `VITE_` prefix for client-side variables only
- Service role key correctly server-side only
- ANTHROPIC_API_KEY correctly server-side only

---

#### AUDIT-01-013: Supabase Client Initialization Includes Required Checks

```javascript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}
```

---

#### AUDIT-01-014: Must-Change-Password Flow Implemented

The application implements a forced password change flow for admin-created users:

```javascript
// Profile flag
must_change_password: true,

// Client-side check
setMustChangePassword(profileData?.must_change_password === true);
```

---

## Compliance Mapping

### GDPR (Article 32 - Security of Processing)

| Requirement | Status | Findings |
|-------------|--------|----------|
| Pseudonymisation | Partial | User data not pseudonymised in logs |
| Encryption in transit | Pass | HTTPS enforced by Vercel |
| Confidentiality | Fail | AUDIT-01-001 allows data access bypass |
| Integrity | Partial | Input sanitisation good, but auth gap |
| Availability | Pass | Rate limiting implemented |
| Regular testing | Pending | This audit is first security review |

### SOC 2 Trust Service Criteria

| Criteria | Status | Gaps |
|----------|--------|------|
| CC6.1 Logical Access | Fail | API authentication missing |
| CC6.6 Security Config | Fail | Missing security headers |
| CC6.7 Data Transmission | Pass | HTTPS enforced |
| CC6.8 Malicious Software | N/A | Cloud platform managed |
| CC7.2 Monitoring | Partial | Rate limit monitoring, no intrusion detection |

---

## Recommendations

### Immediate (0-7 days)

1. **[CRITICAL]** Implement JWT verification in chat.js API
2. **[HIGH]** Add security headers to vercel.json
3. **[MEDIUM]** Remove debug field from production error responses

### Short-term (8-30 days)

4. **[HIGH]** Implement proper rate limiting with verified user IDs
5. **[MEDIUM]** Add authentication to scan-receipt.js
6. **[MEDIUM]** Sign vendor portal session tokens with JWT

### Medium-term (31-90 days)

7. **[MEDIUM]** Migrate rate limiting to distributed cache
8. **[LOW]** Generate random initial passwords server-side
9. **[LOW]** Review and tighten CSP policy after initial deployment

---

## Third-Party Trust Factors

### Assurances That Can Be Provided

1. **Session Management** - Proper session refresh and expiry handling
2. **Password Security** - Strong password requirements for user-set passwords
3. **RLS Architecture** - Comprehensive row-level security at database level
4. **Input Validation** - Proper sanitisation of user inputs

### Areas Requiring Improvement Before Third-Party Assurance

1. API endpoint authentication must be fixed
2. Security headers must be implemented
3. Penetration testing recommended after fixes

---

## Appendix A: Files Reviewed

| File | Lines | Focus |
|------|-------|-------|
| `src/contexts/AuthContext.jsx` | 339 | Session management |
| `src/lib/supabase.js` | 11 | Client configuration |
| `api/chat.js` | 3600+ | API security |
| `api/create-user.js` | 261 | User creation |
| `api/scan-receipt.js` | 250+ | Receipt processing |
| `api/create-project.js` | 200+ | Project creation |
| `api/create-organisation.js` | 200+ | Org creation |
| `api/evaluator/vendor-portal-auth.js` | 150+ | Portal auth |
| `vercel.json` | 21 | Configuration |
| `index.html` | 14 | HTML headers |

## Appendix B: Search Patterns Used

```bash
# Authentication patterns
grep -r "adminToken|Authorization|Bearer|auth\.getUser" api/

# Rate limiting
grep -r "rate.?limit|RATE_LIMIT" api/

# CORS/Headers
grep -r "CORS|Access-Control|origin" api/

# Environment variables
grep -r "VITE_|SUPABASE_|ANTHROPIC_|process\.env" src/
```

---

**Document Status:** Complete
**Next Phase:** Phase 2 - Data Security & Multi-Tenancy
**Prepared By:** Claude Opus 4.5
**Review Required:** Yes - Critical findings require immediate attention
