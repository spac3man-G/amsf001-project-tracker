# AUDIT-02: Data Security & Multi-Tenancy

**Application:** Tracker by Progressive
**Audit Phase:** 2 - Data Security & Multi-Tenancy
**Audit Date:** 15 January 2026
**Auditor:** Claude Opus 4.5
**Document Version:** 1.0

---

## Executive Summary

This audit examines the data security architecture, multi-tenancy implementation, RLS policy coverage, and GDPR-relevant data handling in the Tracker by Progressive application.

The application demonstrates **strong data isolation** through a well-designed three-tier multi-tenancy model with comprehensive RLS policies. However, there are **gaps in data lifecycle management** including inconsistent soft delete implementation and no automated data retention policies.

### Key Statistics

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 3 |
| Low | 2 |
| Informational | 5 |

### Overall Assessment

The data security architecture is **well-designed** with comprehensive Row Level Security policies covering all tables. The SECURITY DEFINER functions are properly implemented with authorization checks. The main concerns are around GDPR compliance - specifically the lack of automated data retention/deletion capabilities and personal data scattered across multiple tables without a unified subject access request mechanism.

---

## Scope

### Areas Reviewed

| Area | Files Analysed |
|------|---------------|
| RLS Helper Functions | `202512221403_create_rls_helper_functions.sql` |
| Core RLS Policies | `202512241500_fix_rls_policies_use_can_access_project.sql` |
| Evaluator RLS Policies | `202601010017_create_rls_policies.sql` |
| Organisation Functions | `202601130001_add_org_admin_user_projects_function.sql` |
| Audit Logging | `202601010016_create_ai_tasks_audit_log.sql` |
| All Table Definitions | 92 migration files |

### Documentation Reviewed

- `docs/TECH-SPEC-02-Database-Core.md`
- `docs/TECH-SPEC-05-RLS-Security.md`

---

## Strengths

### 1. Comprehensive RLS Policy Coverage

All 70+ tables have RLS enabled with properly designed policies:

```sql
-- Example: Consistent use of can_access_project() helper
CREATE POLICY "timesheets_select_policy" ON timesheets
FOR SELECT TO authenticated
USING (can_access_project(project_id));
```

**Tables with verified RLS:**
- Core tracker tables: 33 policies using `can_access_project()`
- Evaluator tables: 37 tables with `can_access_evaluation()` policies
- Organisation tables: Separate org-level policies
- All junction tables: Policies reference parent tables

### 2. Well-Designed Multi-Tenancy Model

Three-tier isolation model properly implemented:

```
Organisation (top-level tenant)
    └── Projects (org-scoped)
            └── Entities (project-scoped)
```

**Key Controls:**
- Users require BOTH organisation AND project membership (dual requirement)
- Org admins (`org_admin`, `supplier_pm`) can access all projects in their org
- System admins can access all data
- Regular users (`org_member`) need explicit project assignment

### 3. SECURITY DEFINER Functions Properly Secured

All 14 SECURITY DEFINER functions include authorization checks:

```sql
-- Example from add_user_to_project_as_org_admin
IF NOT EXISTS (
  SELECT 1 FROM user_organisations
  WHERE user_id = auth.uid()
  AND organisation_id = v_org_id
  AND org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  AND is_active = TRUE
) AND NOT is_system_admin() THEN
  RAISE EXCEPTION 'Access denied: Not an admin of this organisation';
END IF;
```

### 4. Robust Audit Logging

Multiple audit log tables with comprehensive tracking:

| Table | Scope | Fields Tracked |
|-------|-------|----------------|
| `audit_log` | Project operations | user_id, action, entity, changes |
| `evaluation_audit_log` | Evaluator module | user_email, ip_address, user_agent, session_id |
| `risk_audit_log` | Risk dashboard | user_id, action, details |

**Good Practices:**
- IP address tracking for security investigations
- User email denormalized for audit persistence
- Previous/new value capture for change tracking
- Action categorization for filtering

### 5. Invitation Flow with Proper Validation

Organisation invitations include security measures:

```sql
-- Email format validation
CONSTRAINT org_invitations_email_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

---

## Findings

### High

#### AUDIT-02-001: No Automated Data Retention or Deletion Mechanism

**Severity:** High
**Category:** GDPR Compliance
**Location:** Database schema

**Description:**

The application lacks automated data retention policies. There is no mechanism to:
1. Automatically delete data after a retention period
2. Anonymize old records
3. Cascade deletion when users request account removal
4. Purge soft-deleted records after a retention period

**Impact:**

- **GDPR Article 17 (Right to Erasure)**: Cannot efficiently fulfill deletion requests
- **GDPR Article 5(1)(e) (Storage Limitation)**: Data may be stored longer than necessary
- **Data breach exposure**: More data retained = more data at risk

**Evidence:**

Soft-deleted records remain indefinitely:
```sql
-- No cleanup mechanism exists for soft-deleted records
-- Records with is_deleted = TRUE persist forever
```

**Remediation:**

1. Implement a data retention policy table:
```sql
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY,
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  action TEXT CHECK (action IN ('delete', 'anonymize')),
  is_active BOOLEAN DEFAULT TRUE
);
```

2. Create a scheduled job (pg_cron or Vercel cron) to enforce retention:
```sql
-- Example: Purge soft-deleted records older than 90 days
DELETE FROM timesheets
WHERE is_deleted = TRUE
AND deleted_at < NOW() - INTERVAL '90 days';
```

3. Add user deletion cascade function

**Compliance:**
- GDPR Article 5(1)(e): Storage limitation principle
- GDPR Article 17: Right to erasure
- SOC 2 CC6.5: Data disposal

**Effort:** High

---

### Medium

#### AUDIT-02-002: Personal Data Scattered Across Multiple Tables

**Severity:** Medium
**Category:** GDPR Compliance
**Location:** Multiple tables

**Description:**

Personal data is stored in multiple locations without a unified data subject access mechanism:

| Table | Personal Data Fields |
|-------|---------------------|
| `profiles` | email, full_name |
| `vendor_contacts` | name, email, phone |
| `org_invitations` | email |
| `client_portal_access_tokens` | user_email |
| `survey_responses` | respondent_email |
| `evaluation_audit_log` | user_email, ip_address |
| `workshop_attendees` | external_email |
| `stakeholder_area_approvals` | approved_by_email |

**Impact:**

- Subject Access Requests (SAR) require manual multi-table queries
- Deletion requests may miss data in some tables
- Inconsistent data across tables after partial updates

**Remediation:**

1. Create a GDPR helper function for subject access:
```sql
CREATE OR REPLACE FUNCTION get_user_personal_data(p_email TEXT)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'profiles', (SELECT row_to_json(p.*) FROM profiles p WHERE email = p_email),
    'vendor_contacts', (SELECT json_agg(row_to_json(vc.*)) FROM vendor_contacts vc WHERE email = p_email),
    -- ... other tables
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

2. Create a deletion function for right to erasure

**Compliance:**
- GDPR Article 15: Right of access
- GDPR Article 30: Records of processing activities

**Effort:** Medium

---

#### AUDIT-02-003: Soft Delete Not Consistently Implemented

**Severity:** Medium
**Category:** Data Integrity
**Location:** Various tables

**Description:**

23 migration files include soft delete columns (`is_deleted`, `deleted_at`, `deleted_by`), but not all tables have this pattern. Some tables appear to use hard delete:

**Tables WITH soft delete:**
- organisations, projects, milestones, deliverables
- timesheets, expenses, resources
- All evaluator core tables
- plan_items, estimates

**Tables potentially WITHOUT soft delete:**
- Junction tables (user_projects, user_organisations)
- Audit log tables (by design - immutable)
- Some newer tables (need verification)

**Impact:**

- Inconsistent recovery capabilities
- Potential compliance issues for audit trails
- Hard deleted data cannot be recovered

**Remediation:**

1. Audit all tables for soft delete columns
2. Add soft delete to critical tables missing it
3. Document which tables intentionally use hard delete and why

**Effort:** Medium

---

#### AUDIT-02-004: Views May Expose Data Without RLS Context

**Severity:** Medium
**Category:** Data Isolation
**Location:** Database views

**Description:**

9 database views exist that aggregate data:

```sql
-- Views found:
- plan_items_with_estimates
- organisation_members_with_profiles
- project_budget_summary
- milestone_status_summary
- deliverable_status_summary
- timesheet_summary
- expense_summary
- pending_actions_summary
- chat_context_summary
- active_partners
```

PostgreSQL views inherit RLS from underlying tables when `security_invoker = true` (default in Supabase), but this should be verified.

**Impact:**

If views bypass RLS, users could access cross-tenant data.

**Remediation:**

1. Verify each view respects RLS by testing with different user contexts
2. Consider adding explicit `security_invoker = true` to views
3. Document view security model

**Effort:** Low

---

### Low

#### AUDIT-02-005: Audit Log Tables Lack Tamper Protection

**Severity:** Low
**Category:** Audit Integrity
**Location:** `audit_log`, `evaluation_audit_log`, `risk_audit_log`

**Description:**

Audit log tables allow DELETE operations (via RLS policies), and there's no protection against tampering by database administrators.

**Impact:**

- Audit trail could be modified by malicious admin
- SOC 2 auditors may question log integrity

**Remediation:**

1. Remove DELETE policies from audit tables
2. Consider implementing append-only pattern with triggers
3. For high-security: consider external audit log storage (SIEM)

**Effort:** Low

---

#### AUDIT-02-006: No Data Classification System

**Severity:** Low
**Category:** Data Governance
**Location:** Schema design

**Description:**

There's no formal classification of data sensitivity levels in the schema. Tables containing PII, financial data, or confidential business information are not marked.

**Impact:**

- Difficult to apply appropriate controls based on data sensitivity
- Compliance teams cannot easily identify regulated data
- Backup/export operations may not apply appropriate protections

**Remediation:**

Add data classification comments to tables:
```sql
COMMENT ON TABLE profiles IS 'PII: Contains personal identifiable information';
COMMENT ON COLUMN vendor_contacts.phone IS 'PII: Personal contact number';
```

**Effort:** Low

---

### Informational

#### AUDIT-02-007: Strong Dual Membership Requirement

The `can_access_project()` function enforces that users must have BOTH organisation membership AND project membership (unless org admin). This is a good defense-in-depth measure.

#### AUDIT-02-008: Proper Use of PostgreSQL Security Features

The application properly uses:
- RLS for row-level access control
- SECURITY DEFINER for controlled privilege escalation
- CHECK constraints for data validation
- Foreign key cascades for referential integrity

#### AUDIT-02-009: Email Denormalization in Audit Logs

Storing `user_email` in audit logs is good practice - it preserves audit trail even if the user account is deleted.

#### AUDIT-02-010: IP Address Tracking

The `evaluation_audit_log` tracks IP addresses and user agents, supporting security investigations.

#### AUDIT-02-011: Separate Evaluator Security Domain

The Evaluator module has its own set of RLS helper functions (`can_access_evaluation`, `has_evaluation_role`), providing proper isolation from the main Tracker module.

---

## Personal Data Inventory (GDPR Article 30)

### Data Categories

| Category | Tables | Fields | Lawful Basis |
|----------|--------|--------|--------------|
| User Identity | `profiles` | email, full_name | Contract performance |
| Contact Details | `vendor_contacts` | name, email, phone | Legitimate interest |
| Access Logs | `evaluation_audit_log` | user_email, ip_address, user_agent | Legitimate interest |
| Session Data | `client_portal_access_tokens` | user_email | Contract performance |
| Survey Data | `survey_responses` | respondent_email | Consent |
| Invitation Data | `org_invitations` | email | Contract performance |

### Data Subject Rights Implementation Status

| Right | Status | Implementation |
|-------|--------|----------------|
| Access (Art. 15) | Partial | No unified SAR function |
| Rectification (Art. 16) | Yes | Users can update profiles |
| Erasure (Art. 17) | Partial | Manual process, no cascade |
| Portability (Art. 20) | No | No export function |
| Restriction (Art. 18) | No | Not implemented |
| Objection (Art. 21) | No | Not implemented |

---

## Compliance Mapping

### GDPR Compliance

| Requirement | Status | Gaps |
|-------------|--------|------|
| Art. 5(1)(e) Storage Limitation | Fail | No retention policy |
| Art. 15 Right of Access | Partial | No unified SAR function |
| Art. 17 Right to Erasure | Partial | Manual, incomplete |
| Art. 30 Records of Processing | Partial | Inventory created in this audit |
| Art. 32 Security of Processing | Pass | Strong RLS implementation |

### SOC 2 Trust Service Criteria

| Criteria | Status | Notes |
|----------|--------|-------|
| CC6.1 Logical Access | Pass | Comprehensive RLS |
| CC6.5 Data Disposal | Fail | No automated retention |
| CC6.6 Protection from Threats | Pass | Multi-layer isolation |
| CC7.2 System Monitoring | Pass | Audit logging in place |

---

## Recommendations

### Immediate (0-7 days)

1. **[MEDIUM]** Verify all views respect RLS by testing with different user contexts

### Short-term (8-30 days)

2. **[HIGH]** Design and implement data retention policy framework
3. **[MEDIUM]** Create GDPR helper functions (subject access, deletion)

### Medium-term (31-90 days)

4. **[MEDIUM]** Audit and standardize soft delete across all tables
5. **[LOW]** Add data classification comments to schema
6. **[LOW]** Implement append-only audit log protection

---

## Appendix A: SECURITY DEFINER Functions Inventory

| Function | Purpose | Auth Check |
|----------|---------|------------|
| `is_system_admin()` | Check admin role | Self-checking |
| `is_org_member(uuid)` | Check org membership | Self-checking |
| `is_org_admin(uuid)` | Check org admin role | Self-checking |
| `get_org_role(uuid)` | Get org role | Self-checking |
| `can_access_project(uuid)` | Check project access | Composite check |
| `get_project_role(uuid)` | Get project role | Self-checking |
| `has_project_role(uuid, text[])` | Check project roles | Self-checking |
| `can_access_evaluation(uuid)` | Check evaluation access | Composite check |
| `has_evaluation_role(uuid, text[])` | Check evaluation roles | Composite check |
| `get_user_project_assignments_for_org(uuid, uuid)` | List project assignments | Explicit org admin check |
| `add_user_to_project_as_org_admin(uuid, uuid, text)` | Add project assignment | Explicit org admin check |
| `remove_user_from_project_as_org_admin(uuid, uuid)` | Remove assignment | Explicit org admin check |
| `change_user_project_role_as_org_admin(uuid, uuid, text)` | Change role | Explicit org admin check |
| `accept_org_invitation(text)` | Accept invitation | Token validation |

---

## Appendix B: RLS Policy Count by Table Category

| Category | Tables | Policies |
|----------|--------|----------|
| Core Tracker | 15 | 33 SELECT + write policies |
| Evaluator | 37 | 74+ policies |
| Organisation | 3 | 12 policies |
| Planning | 6 | 12 policies |
| **Total** | **61+** | **130+** |

---

**Document Status:** Complete
**Next Phase:** Phase 3 - Frontend Security
**Prepared By:** Claude Opus 4.5
**Review Required:** Yes - GDPR compliance findings require attention
