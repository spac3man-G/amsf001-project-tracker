# Security Audit Remediation Roadmap

**Document:** Prioritized Action Plan
**Date:** 15 January 2026
**Total Findings:** 39 actionable (2 Critical, 6 High, 17 Medium, 14 Low)
**Prepared By:** Claude Opus 4.5

---

## Executive Summary

This roadmap provides a prioritized plan to address all 39 actionable findings from the 6-phase security audit. Work is organized into four phases over approximately 8-12 weeks, with critical items requiring immediate attention.

**Estimated Total Effort:** 15-20 developer days

---

## Priority Matrix

| Priority | Timeline | Criteria | Findings |
|----------|----------|----------|----------|
| P0 - Critical | Immediate (24-48 hours) | Active vulnerabilities, data breach risk | 2 |
| P1 - High | Week 1-2 | Security gaps, compliance blockers | 6 |
| P2 - Medium | Week 3-6 | Best practices, technical debt | 17 |
| P3 - Low | Week 7-12 | Improvements, future-proofing | 14 |

---

## Phase 0: Critical (Immediate - 24-48 Hours)

**Goal:** Address active vulnerabilities that could be exploited today.

### AUDIT-05-001: React Router XSS Vulnerability
**Severity:** Critical | **Effort:** 15 minutes | **Risk:** Active XSS attack vector

**Current State:**
```json
"react-router-dom": "^6.20.0"  // Vulnerable to XSS via open redirects
```

**Remediation Steps:**
```bash
# Step 1: Update the dependency
npm update react-router-dom

# Step 2: Verify the fix
npm audit | grep react-router

# Step 3: Run tests to ensure no regressions
npm run test:run
npm run e2e:smoke

# Step 4: Deploy
git add package.json package-lock.json
git commit -m "fix(security): Update react-router-dom to fix XSS vulnerability (AUDIT-05-001)"
git push
```

**Verification:** `npm audit` should show no react-router vulnerabilities.

---

### AUDIT-01-001: Chat API Missing JWT Verification
**Severity:** Critical | **Effort:** 2-4 hours | **Risk:** Unauthorized API access

**Current State:** Chat API accepts requests without verifying JWT tokens from Supabase.

**Remediation Steps:**

```javascript
// api/chat.js - Add at the top of the handler

import { createClient } from '@supabase/supabase-js';

// Initialize admin client for token verification
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
  // Step 1: Extract the JWT from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);

  // Step 2: Verify the token with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Step 3: Continue with authenticated user
  const userId = user.id;
  // ... rest of handler
}
```

**Files to Update:**
- `api/chat.js`
- `api/chat-stream.js`
- `api/scan-receipt.js`

**Verification:** Test with invalid/missing tokens - should return 401.

---

## Phase 1: High Priority (Week 1-2)

**Goal:** Close security gaps and fix CI/CD blockers.

### Week 1 Sprint

#### AUDIT-01-003: Missing Security Headers
**Effort:** 30 minutes | **Impact:** High

**Remediation:**
```json
// vercel.json - Add headers configuration
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/planning-ai.js": { "maxDuration": 300 },
    "api/evaluator/check-deadlines.js": { "maxDuration": 60 }
  },
  "crons": [
    { "path": "/api/evaluator/check-deadlines", "schedule": "0 6 * * *" }
  ]
}
```

---

#### AUDIT-01-002: Rate Limiting Bypassable
**Effort:** 1-2 hours | **Impact:** High

**Remediation:**
```javascript
// api/chat.js - Fix rate limiting to use verified user ID

// Move rate limit check AFTER JWT verification
const rateLimitKey = `chat:${userId}`; // Use verified userId, not request param
const requests = rateLimitMap.get(rateLimitKey) || [];
const now = Date.now();
const windowRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);

if (windowRequests.length >= RATE_LIMIT_MAX) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    retryAfter: Math.ceil((windowRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil((windowRequests[0] + RATE_LIMIT_WINDOW - now) / 1000))
    }
  });
}
```

---

#### AUDIT-06-001: Unit Tests Failing After Role Model Changes
**Effort:** 2-3 hours | **Impact:** High (CI/CD blocker)

**Remediation Steps:**

1. Review each failing test and update expectations:
```javascript
// src/__tests__/unit/permissions.test.js

// BEFORE (v2.x model)
expect(canManageUsers(ROLES.SUPPLIER_PM)).toBe(false);
expect(canDeleteMilestone(ROLES.SUPPLIER_PM)).toBe(false);

// AFTER (v3.0 model - supplier_pm has admin capabilities)
expect(canManageUsers(ROLES.SUPPLIER_PM)).toBe(true);
expect(canDeleteMilestone(ROLES.SUPPLIER_PM)).toBe(true);
```

2. Run tests iteratively:
```bash
npm run test:run -- --reporter=verbose
```

3. Update test documentation to reflect v3.0 role model.

---

#### AUDIT-03-001: XSS Vulnerability in Chat Components
**Effort:** 1-2 hours | **Impact:** High

**Files to Update:**
- `src/components/chat/ChatWidget.jsx`
- `src/components/chat/MobileChat.jsx`

**Remediation:**
```javascript
// Replace dangerouslySetInnerHTML with safe rendering
import DOMPurify from 'dompurify';

// BEFORE
<div dangerouslySetInnerHTML={{ __html: message.content }} />

// AFTER - Option 1: Sanitize HTML
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />

// AFTER - Option 2: Use markdown renderer with sanitization
import ReactMarkdown from 'react-markdown';
<ReactMarkdown>{message.content}</ReactMarkdown>
```

**Dependencies to Add:**
```bash
npm install dompurify
# OR
npm install react-markdown
```

---

### Week 2 Sprint

#### AUDIT-02-001: No Data Retention/Deletion Mechanism
**Effort:** 4-6 hours | **Impact:** High (GDPR compliance)

**Remediation Steps:**

1. Create data retention policy document
2. Add database functions for data deletion:

```sql
-- supabase/migrations/YYYYMMDD_data_retention.sql

-- Function to delete user data (GDPR right to erasure)
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Anonymize audit logs (keep structure, remove PII)
  UPDATE audit_log SET
    user_id = NULL,
    details = jsonb_set(details, '{user_email}', '"[REDACTED]"')
  WHERE user_id = target_user_id;

  -- Delete user from projects
  DELETE FROM user_projects WHERE user_id = target_user_id;

  -- Delete user from organisations
  DELETE FROM user_organisations WHERE user_id = target_user_id;

  -- Delete profile
  DELETE FROM profiles WHERE id = target_user_id;

  -- Note: Supabase Auth user deletion handled separately via admin API
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purge old soft-deleted records
CREATE OR REPLACE FUNCTION purge_deleted_records(retention_days INTEGER DEFAULT 90)
RETURNS TABLE(table_name TEXT, deleted_count INTEGER) AS $$
DECLARE
  tbl RECORD;
  cnt INTEGER;
BEGIN
  FOR tbl IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.tablename
      AND c.column_name = 'deleted_at'
    )
  LOOP
    EXECUTE format(
      'DELETE FROM %I WHERE deleted_at < NOW() - INTERVAL ''%s days'' RETURNING 1',
      tbl.tablename, retention_days
    );
    GET DIAGNOSTICS cnt = ROW_COUNT;
    table_name := tbl.tablename;
    deleted_count := cnt;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Create admin UI for data deletion requests
4. Document data retention periods

---

#### AUDIT-04-001: Duplicate Base Service Classes
**Effort:** 3-4 hours | **Impact:** High (maintainability)

**Remediation:**

```javascript
// src/services/base.service.js - Make project field configurable

class BaseService {
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.projectField = options.projectField || 'project_id';
    this.supportsSoftDelete = options.supportsSoftDelete ?? true;
  }

  async getAll(projectId) {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq(this.projectField, projectId);

    if (this.supportsSoftDelete) {
      query = query.or('is_deleted.is.null,is_deleted.eq.false');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // ... rest of methods use this.projectField
}

// src/services/evaluator/*.service.js - Extend with custom field
class RequirementsService extends BaseService {
  constructor() {
    super('requirements', {
      projectField: 'evaluation_project_id',
      supportsSoftDelete: true
    });
  }
}
```

**Files to Update:**
- `src/services/base.service.js`
- Delete `src/services/evaluator/base.evaluator.service.js`
- Update all 19 evaluator services to extend BaseService

---

## Phase 2: Medium Priority (Week 3-6)

**Goal:** Implement best practices and reduce technical debt.

### Week 3-4: Security Hardening

#### AUDIT-01-004: Service Role Key Overuse
**Effort:** 4-6 hours

**Approach:** Create scoped service clients where possible.

```javascript
// For read-only operations, use anon key with RLS
// For admin operations, use service role with explicit checks

// api/chat.js - Use user's session for queries
const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${userToken}` } }
});

// Only use service role for specific admin operations
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

---

#### AUDIT-01-005: Portal Tokens Not Signed
**Effort:** 2-3 hours

**Remediation:** Implement JWT signing for portal tokens.

```javascript
// api/evaluator/vendor-portal-auth.js
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.PORTAL_JWT_SECRET);

async function generateSessionToken(vendorId, evaluationProjectId) {
  return await new SignJWT({
    vendorId,
    evaluationProjectId,
    type: 'vendor_portal'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}
```

---

#### AUDIT-01-006: Scan Receipt No Auth
**Effort:** 30 minutes

**Remediation:** Add same JWT verification as chat.js.

---

#### AUDIT-01-007: Debug Info in Errors
**Effort:** 15 minutes

```javascript
// api/chat.js - Remove debug field from error responses
return new Response(JSON.stringify({
  error: 'An error occurred',
  // Remove: debug: error.message, stack: error.stack
}), { status: 500 });
```

---

### Week 4-5: Architecture Improvements

#### AUDIT-04-002: Inconsistent Service Patterns
**Effort:** 3-4 hours

Convert object-based services to class pattern:

```javascript
// BEFORE: src/services/planItemsService.js (object pattern)
export const planItemsService = {
  async getAll(projectId) { ... }
};

// AFTER: Class extending BaseService
class PlanItemsService extends BaseService {
  constructor() {
    super('plan_items', { supportsSoftDelete: true });
  }

  // Custom methods specific to plan items
  async getHierarchy(projectId) { ... }
}

export const planItemsService = new PlanItemsService();
```

**Files to Convert:**
- `src/services/planItemsService.js`
- `src/services/syncService.js`
- `src/services/sfia8-reference-data.js`

---

#### AUDIT-04-003: AG Grid Not Standardized
**Effort:** 4-6 hours

**Create shared grid component:**

```jsx
// src/components/common/DataGrid/DataGrid.jsx
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

// Register modules once
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Default grid options
const DEFAULT_OPTIONS = {
  animateRows: true,
  rowSelection: 'multiple',
  suppressCellFocus: true,
  domLayout: 'autoHeight',
};

export function DataGrid({
  columns,
  data,
  onRowClick,
  onSelectionChange,
  enableDrag = false,
  height = 400,
  ...props
}) {
  const gridRef = useRef(null);

  return (
    <div style={{ height }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columns}
        rowData={data}
        {...DEFAULT_OPTIONS}
        {...props}
      />
    </div>
  );
}
```

**Migrate these components:**
- `RequirementsGridView.jsx`
- `QuestionsGridView.jsx`
- `VendorsGridView.jsx`
- `QAGridView.jsx`

---

#### AUDIT-04-004: Count Queries Fetch All Records
**Effort:** 1 hour

```javascript
// src/services/base.service.js - Fix count method
async count(projectId, filters = []) {
  let query = supabase
    .from(this.tableName)
    .select('*', { count: 'exact', head: true })
    .eq(this.projectField, projectId);

  if (this.supportsSoftDelete) {
    query = query.or('is_deleted.is.null,is_deleted.eq.false');
  }

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}
```

---

### Week 5-6: Code Quality & Testing

#### AUDIT-06-002: No Code Linting Configuration
**Effort:** 2-3 hours

```bash
# Install ESLint and Prettier
npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks prettier
```

```javascript
// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', console: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  }
];
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

```json
// package.json - Add scripts
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

---

#### AUDIT-05-002: Development Dependency Vulnerabilities
**Effort:** 1-2 hours

```bash
# Update development dependencies
npm update vite vitest @vitest/ui @vitest/coverage-v8

# Run tests to verify no breaking changes
npm run test:run
npm run e2e:smoke
```

---

#### AUDIT-05-004: No Request Validation Library
**Effort:** 4-6 hours

```bash
npm install zod
```

```javascript
// src/lib/validation.js
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  reference: z.string().min(1).max(20),
  organisationId: z.string().uuid(),
});

// Usage in API
const result = CreateUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten().fieldErrors });
}
```

---

#### AUDIT-02-002: Personal Data Scattered Across Tables
**Effort:** 2-3 hours (documentation)

Create data mapping document:

```markdown
# Personal Data Inventory

| Table | PII Fields | Purpose | Retention |
|-------|-----------|---------|-----------|
| profiles | email, first_name, last_name | User identity | Account lifetime |
| timesheets | notes | Work records | 7 years (financial) |
| expenses | description | Financial records | 7 years |
| audit_log | user_id, details | Compliance | 3 years |
```

---

#### AUDIT-02-003: Soft Delete Not Consistent
**Effort:** 2-3 hours

Audit all tables and add missing columns:

```sql
-- Add is_deleted to tables missing it
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
```

---

## Phase 3: Low Priority (Week 7-12)

**Goal:** Polish, optimize, and future-proof.

### Weeks 7-8: Security Polish

#### AUDIT-02-004: Views May Expose Data Without RLS
**Effort:** 2-3 hours

Review and add security to views:

```sql
-- Add SECURITY INVOKER to views (default in newer PostgreSQL)
CREATE OR REPLACE VIEW secure_view AS
SELECT * FROM table WHERE condition
WITH (security_invoker = true);
```

---

#### AUDIT-02-005: Audit Logs Lack Tamper Protection
**Effort:** 3-4 hours

```sql
-- Create append-only audit table
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON audit_log FROM service_role;

-- Add hash chain for integrity verification
ALTER TABLE audit_log ADD COLUMN hash TEXT;
ALTER TABLE audit_log ADD COLUMN previous_hash TEXT;

CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.previous_hash := (SELECT hash FROM audit_log ORDER BY created_at DESC LIMIT 1);
  NEW.hash := encode(sha256(
    (NEW.id || NEW.action || NEW.entity_type || COALESCE(NEW.previous_hash, ''))::bytea
  ), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### AUDIT-03-002: Sensitive Data in Client Storage
**Effort:** 2-3 hours

Review and minimize stored data:

```javascript
// Audit what's stored in contexts and localStorage
// Remove sensitive data that doesn't need to persist
// Use sessionStorage instead of localStorage for sensitive items
```

---

#### AUDIT-03-003: Error Boundary Exposes Details
**Effort:** 30 minutes

Already addressed in AUDIT-06-006.

---

#### AUDIT-03-004: External Links Missing rel Attributes
**Effort:** 1-2 hours

```jsx
// Search and replace external links
// BEFORE
<a href="https://external.com">Link</a>

// AFTER
<a href="https://external.com" target="_blank" rel="noopener noreferrer">Link</a>
```

---

#### AUDIT-03-005: No CSP Enforcement
**Effort:** 2-3 hours

```json
// vercel.json - Add Content-Security-Policy
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.anthropic.com; font-src 'self';"
        }
      ]
    }
  ]
}
```

---

### Weeks 9-10: Architecture Polish

#### AUDIT-04-005: No Query State Management Library
**Effort:** 8-12 hours (large refactor)

Consider adopting React Query for new features:

```bash
npm install @tanstack/react-query
```

```jsx
// Example migration for one service
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMilestones(projectId) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesService.getAll(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: milestonesService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['milestones', variables.projectId]);
    },
  });
}
```

---

#### AUDIT-04-006: Limited White-Labeling Support
**Effort:** 4-6 hours

Extend organisation settings:

```sql
-- Update organisations table settings
UPDATE organisations SET settings = settings || '{
  "branding": {
    "logo_url": null,
    "favicon_url": null,
    "primary_color": "#6366f1",
    "secondary_color": "#8b5cf6",
    "custom_css": null,
    "login_background_url": null,
    "email_header_html": null
  }
}'::jsonb;
```

---

#### AUDIT-05-003: Inconsistent Supabase URL Environment Variable
**Effort:** 1 hour

```javascript
// Update all API files
// BEFORE
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// AFTER
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
```

---

#### AUDIT-05-005: Anthropic Model Version Inconsistency
**Effort:** 1-2 hours

```javascript
// Create shared config
// src/lib/ai-config.js (for frontend)
// api/lib/ai-config.js (for API)

export const AI_MODELS = {
  FAST: 'claude-haiku-4-5-20250929',
  STANDARD: 'claude-sonnet-4-5-20250929',
  PREMIUM: 'claude-opus-4-5-20251101',
};

export const MODEL_FOR_TASK = {
  chat_simple: AI_MODELS.FAST,
  chat_complex: AI_MODELS.STANDARD,
  document_analysis: AI_MODELS.PREMIUM,
  gap_analysis: AI_MODELS.PREMIUM,
  report_generation: AI_MODELS.STANDARD,
};
```

---

#### AUDIT-05-006: No API Versioning
**Effort:** 4-6 hours (for new APIs)

```
# Future API structure
/api/v1/chat
/api/v1/users
/api/v1/projects
```

---

### Weeks 11-12: Code Quality

#### AUDIT-06-003: Heavy Console Logging
**Effort:** 4-6 hours (gradual)

```javascript
// src/lib/logger.js
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;

export const logger = {
  debug: (...args) => CURRENT_LEVEL <= LOG_LEVELS.DEBUG && console.log('[DEBUG]', ...args),
  info: (...args) => CURRENT_LEVEL <= LOG_LEVELS.INFO && console.log('[INFO]', ...args),
  warn: (...args) => CURRENT_LEVEL <= LOG_LEVELS.WARN && console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

// Gradually replace console.log with logger.debug
```

---

#### AUDIT-06-004: Limited Unit Test Coverage
**Effort:** Ongoing

Priority test additions:
1. BaseService methods
2. Utility functions (formatters.js, cache.js)
3. Permission edge cases
4. Form validation logic

---

#### AUDIT-06-005: Backup Files in Source
**Effort:** 1 minute

```bash
rm src/pages/Dashboard.jsx.backup
git add -A && git commit -m "chore: Remove backup file (AUDIT-06-005)"
```

---

#### AUDIT-06-006: Error Message Exposure in ErrorBoundary
**Effort:** 15 minutes

```jsx
// src/components/common/ErrorBoundary.jsx
import { getUserMessage } from '../../lib/errorHandler';

// In render()
<p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>
  {getUserMessage(this.state.error)}
</p>
```

---

#### AUDIT-02-006: No Data Classification System
**Effort:** 2-3 hours (documentation)

Create data classification policy:

```markdown
# Data Classification Policy

## Classification Levels

| Level | Description | Examples | Handling |
|-------|-------------|----------|----------|
| Public | Non-sensitive | Project names | No restrictions |
| Internal | Business data | Milestones, deliverables | Auth required |
| Confidential | Sensitive business | Financial data, invoices | Role-based access |
| Restricted | PII, credentials | Email, passwords | Encryption, audit |
```

---

#### AUDIT-01-008: Weak Initial Passwords
**Effort:** Already implemented (create-user.js has strong validation)

Verify existing implementation meets requirements.

---

#### AUDIT-01-009: In-Memory Rate Limits
**Effort:** 4-6 hours (optional enhancement)

Consider Vercel KV or Upstash Redis for distributed rate limiting:

```javascript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

const { success, limit, reset, remaining } = await ratelimit.limit(userId);
```

---

#### AUDIT-01-010: Localhost Stats Bypass
**Effort:** 15 minutes

```javascript
// api/chat.js - Remove localhost bypass in production
// Only allow stats access with valid admin key, regardless of origin
if (adminKey !== process.env.ADMIN_API_KEY) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Summary Timeline

```
Week 1:  Phase 0 (Critical) + Week 1 Sprint (High)
Week 2:  Week 2 Sprint (High)
Week 3-4: Security Hardening (Medium)
Week 5-6: Architecture Improvements + Code Quality (Medium)
Week 7-8: Security Polish (Low)
Week 9-10: Architecture Polish (Low)
Week 11-12: Code Quality (Low)
```

## Effort Summary

| Phase | Findings | Effort Estimate |
|-------|----------|-----------------|
| Phase 0 (Critical) | 2 | 4-6 hours |
| Phase 1 (High) | 6 | 15-20 hours |
| Phase 2 (Medium) | 17 | 40-50 hours |
| Phase 3 (Low) | 14 | 30-40 hours |
| **Total** | **39** | **89-116 hours** |

Approximately **15-20 developer days** spread over 8-12 weeks.

---

## Tracking Progress

Update `audit/FINDINGS-TRACKER.md` as each item is completed:

```markdown
## Remediation Progress Log

| Date | Finding ID | Action Taken | By |
|------|------------|--------------|-----|
| 2026-01-16 | AUDIT-05-001 | Updated react-router-dom | [Name] |
| 2026-01-16 | AUDIT-01-003 | Added security headers | [Name] |
```

---

**Document Status:** Complete
**Next Review:** After Phase 1 completion
**Prepared By:** Claude Opus 4.5
