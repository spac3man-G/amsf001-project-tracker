# AUDIT-03: Frontend Security

**Application:** Tracker by Progressive
**Audit Phase:** 3 - Frontend Security
**Audit Date:** 15 January 2026
**Auditor:** Claude Opus 4.5
**Document Version:** 1.0

---

## Executive Summary

This audit examines frontend security including XSS prevention, input validation, client-side data handling, and secure coding practices in the React application.

The application demonstrates **strong input sanitization** through a comprehensive sanitization library, but has **XSS vulnerabilities in chat components** and **sensitive data exposure in client storage**.

### Key Statistics

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 2 |
| Informational | 4 |

---

## Strengths

### 1. Comprehensive Sanitization Library

`src/lib/sanitize.js` provides robust XSS protection:

```javascript
// HTML entity encoding
const HTML_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
};

export function escapeHtml(input) {
  return input.replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char]);
}
```

**Functions available:**
- `escapeHtml()` / `sanitizeForDisplay()` - HTML entity encoding
- `sanitizeText()` - Removes control characters, enforces length
- `sanitizeSingleLine()` / `sanitizeMultiLine()` - Field-specific
- `sanitizeEmail()` / `sanitizeUrl()` - Format validation
- `sanitizeEntity()` - Entity-type specific sanitization

### 2. Service Layer Sanitization

BaseService integrates sanitization automatically:

```javascript
// All services can define sanitization config
this.sanitizeConfig = options.sanitizeConfig || null;

// Applied on create/update
let sanitizedRecord = record;
if (this.sanitizeConfig) {
  sanitizedRecord = sanitizeEntity(this.sanitizeConfig, record);
}
```

**Services with sanitization:**
- timesheets, expenses, resources, deliverables
- milestones, variations, raid_items
- All evaluator services

### 3. React's Default XSS Protection

React automatically escapes content in JSX expressions, providing baseline XSS protection for most rendered content.

### 4. Proper URL Validation

```javascript
export function sanitizeUrl(url) {
  // Validates protocol, removes javascript:, data:, etc.
  // Only allows http/https protocols
}
```

---

## Findings

### High

#### AUDIT-03-001: XSS Vulnerability in Chat Components

**Severity:** High
**Category:** XSS
**Location:** `src/components/chat/ChatWidget.jsx:484-496`, `src/pages/MobileChat.jsx:399-411`

**Description:**

Chat components use `dangerouslySetInnerHTML` with minimal sanitization:

```javascript
// ChatWidget.jsx:504
function formatBold(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// Used directly in dangerouslySetInnerHTML
<p dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
```

The `formatBold` function only handles bold formatting but does NOT sanitize the input. If AI responses contain user-echoed content with HTML/JavaScript, it could execute.

**Evidence:**

The chat API echoes user context and could potentially include user-provided data in responses. The formatBold function creates HTML without escaping.

**Impact:**

- Stored XSS if malicious content saved in chat history
- Session hijacking via cookie theft
- Keylogging or form tampering

**Remediation:**

1. Sanitize before formatting:

```javascript
function formatBold(text) {
  // Escape HTML first, then apply formatting
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
```

2. Or use a library like DOMPurify:

```javascript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(formatBold(text), { ALLOWED_TAGS: ['strong', 'em'] });
```

**Compliance:**
- OWASP A03: Injection
- SOC 2 CC6.1: Security controls

**Effort:** Low

---

### Medium

#### AUDIT-03-002: Sensitive Data in Client Storage

**Severity:** Medium
**Category:** Data Exposure
**Location:** Multiple contexts

**Description:**

Sensitive data stored in localStorage/sessionStorage is accessible to XSS attacks:

| Storage Key | Data | Risk Level |
|------------|------|------------|
| `tracker_chat_history` | Full conversation history | Medium |
| `vendorPortalSession` | Session token, vendor data | High |
| `clientPortalSession` | Session token, user email | High |
| `tracker_viewas_role` | Role impersonation setting | Low |
| `tracker_selected_project` | Project UUID | Low |

**Impact:**

If XSS vulnerability is exploited (like AUDIT-03-001):
- Session tokens can be stolen
- Chat history with sensitive business data exposed
- Role impersonation data can be manipulated

**Remediation:**

1. For session tokens, use httpOnly cookies instead of sessionStorage
2. For sensitive data, consider encrypting before storage
3. Implement shorter expiry times
4. Clear sensitive storage on logout

```javascript
// On logout, ensure all sensitive storage is cleared
localStorage.removeItem('tracker_chat_history');
sessionStorage.removeItem('vendorPortalSession');
sessionStorage.removeItem('clientPortalSession');
```

**Compliance:**
- OWASP A02: Cryptographic Failures
- GDPR Art. 32: Appropriate security measures

**Effort:** Medium

---

#### AUDIT-03-003: Error Boundary Exposes Error Details

**Severity:** Medium
**Category:** Information Disclosure
**Location:** `src/components/common/ErrorBoundary.jsx:81`

**Description:**

The error boundary displays raw error messages to users:

```javascript
<p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
```

**Impact:**

Error messages may contain:
- Stack traces with file paths
- Database query details
- Internal variable names
- System information

**Remediation:**

Show generic message in production:

```javascript
<p>
  {process.env.NODE_ENV === 'development'
    ? this.state.error?.message
    : 'An unexpected error occurred. Please try again.'}
</p>
```

**Effort:** Low

---

### Low

#### AUDIT-03-004: External Links Missing Comprehensive rel Attributes

**Severity:** Low
**Category:** Security Headers
**Location:** Various components

**Description:**

Some external links have `target="_blank"` without full protection:

```javascript
// Some have proper attributes
<a href={url} target="_blank" rel="noopener noreferrer">

// Others may be missing
<a href={vendor.website} target="_blank">
```

**Impact:**

Without `rel="noopener noreferrer"`:
- Tabnabbing attacks possible
- Referrer information leakage

**Remediation:**

Ensure all external links include:
```javascript
target="_blank" rel="noopener noreferrer"
```

**Effort:** Low

---

#### AUDIT-03-005: No Content Security Policy Enforcement

**Severity:** Low
**Category:** Security Headers
**Location:** Application-wide (relates to AUDIT-01-003)

**Description:**

While covered in Phase 1, the lack of CSP headers means XSS vulnerabilities like AUDIT-03-001 have greater impact. CSP would provide defense-in-depth by restricting script execution.

**Remediation:**

Implement CSP headers as detailed in AUDIT-01-003.

**Effort:** Low (combined with AUDIT-01-003)

---

### Informational

#### AUDIT-03-006: Good Form Handling Practices

79 components implement proper form handling with `onSubmit`, `handleSubmit`, and `e.preventDefault()`, preventing unintended form submissions.

#### AUDIT-03-007: React Key Props Properly Used

List rendering uses proper key props, preventing rendering issues and potential security problems with component state.

#### AUDIT-03-008: No eval() or Function() Usage

No dangerous JavaScript execution patterns found (except innerHTML in specific, reviewed locations).

#### AUDIT-03-009: URL Construction Uses Origin Properly

```javascript
const acceptUrl = `${window.location.origin}/accept-invite?token=${token}`;
```

URL construction uses `window.location.origin` rather than string manipulation, reducing open redirect risks.

---

## Client Storage Inventory

| Key | Type | Contains | Sensitive |
|-----|------|----------|-----------|
| `tracker_selected_org` | localStorage | UUID | No |
| `tracker_selected_project` | localStorage | UUID | No |
| `tracker_selected_evaluation` | localStorage | UUID | No |
| `tracker_chat_history` | localStorage | Messages, tokens | **Yes** |
| `tracker_column_widths` | localStorage | UI preferences | No |
| `tracker_viewas_role` | sessionStorage | Role string | Low |
| `vendorPortalSession` | sessionStorage | Session object | **Yes** |
| `clientPortalSession` | sessionStorage | Session object | **Yes** |

---

## Recommendations

### Immediate (0-7 days)

1. **[HIGH]** Fix XSS in chat components - add HTML escaping before formatting
2. **[MEDIUM]** Hide error details in production ErrorBoundary

### Short-term (8-30 days)

3. **[MEDIUM]** Review and secure client storage usage
4. **[LOW]** Audit all external links for proper rel attributes

### Medium-term (31-90 days)

5. Consider adding DOMPurify for any HTML rendering
6. Implement CSP headers (combined with AUDIT-01-003)

---

**Document Status:** Complete
**Next Phase:** Phase 4 - Architecture & Scalability
**Prepared By:** Claude Opus 4.5
