# Security & Architecture Audit Plan

**Application:** Tracker by Progressive
**Version:** As of January 2026
**Prepared:** 15 January 2026
**Jurisdiction:** Channel Islands (GDPR applicable)

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Audit Objectives](#2-audit-objectives)
3. [Scope & Boundaries](#3-scope--boundaries)
4. [Codebase Profile](#4-codebase-profile)
5. [Compliance Frameworks](#5-compliance-frameworks)
6. [Audit Phases](#6-audit-phases)
7. [Methodology](#7-methodology)
8. [Deliverable Structure](#8-deliverable-structure)
9. [Execution Strategy](#9-execution-strategy)
10. [Risk Classification](#10-risk-classification)
11. [Success Criteria](#11-success-criteria)
12. [Document Inventory](#12-document-inventory)

---

## 1. Executive Overview

### 1.1 Purpose

This document defines the plan for a comprehensive security and architecture audit of the Tracker by Progressive application. The audit serves two primary audiences:

1. **Code Owner/Development Team**: Technical findings with actionable recommendations for implementation
2. **Third-Party Evaluators**: Trust assessment for organisations considering adoption of the platform

### 1.2 Audit Philosophy

The audit follows a **comprehensive-first, deep-dive-on-critical** approach:
- All areas receive systematic review
- Critical findings trigger immediate deep-dive analysis
- Findings are documented with severity, impact, and remediation guidance

### 1.3 Application Context

Tracker by Progressive is an enterprise-grade, multi-tenant SaaS application for project portfolio management. Key characteristics:

- **Multi-tenant architecture** with organisation → project → entity isolation
- **Role-based access control** at organisation and project levels
- **AI-powered features** including chat assistant and document analysis
- **Financial operations** including timesheets, expenses, and invoicing
- **Vendor procurement module** (Evaluator) for IT procurement

---

## 2. Audit Objectives

### 2.1 Primary Objectives

| Objective | Description |
|-----------|-------------|
| **Security Posture** | Assess overall security architecture and identify vulnerabilities |
| **Data Protection** | Verify GDPR compliance and data isolation between tenants |
| **Scalability** | Evaluate architecture for multi-customer SaaS readiness |
| **Code Quality** | Identify technical debt and maintainability concerns |
| **Technology Fit** | Assess whether current technology choices remain appropriate |

### 2.2 Secondary Objectives

- Identify component reuse opportunities (e.g., AG Grid across modules)
- Document security strengths for third-party assurance
- Create remediation roadmap prioritised by risk
- Establish baseline for ongoing security monitoring

---

## 3. Scope & Boundaries

### 3.1 In Scope

| Area | Components |
|------|------------|
| **Frontend** | React application, state management, client-side security |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **API Layer** | Vercel Edge Functions, RPC calls |
| **Database** | Schema design, RLS policies, migrations |
| **Authentication** | Supabase Auth, session management, password policies |
| **Authorisation** | Permission matrix, role hierarchy, policy enforcement |
| **AI Integration** | Anthropic Claude API usage, prompt security |
| **Third-Party** | npm dependencies, external service integrations |
| **Infrastructure** | Vercel deployment, Supabase hosting |
| **Documentation** | Technical specifications, inline documentation |

### 3.2 Out of Scope

| Area | Reason |
|------|--------|
| Penetration Testing | Requires specialised tools and authorisation |
| Load Testing | Requires production-like environment |
| Physical Security | Cloud infrastructure (Supabase/Vercel managed) |
| Social Engineering | Out of technical audit scope |
| Mobile Applications | No mobile app exists |

### 3.3 Boundaries

- Audit is based on code review and documentation analysis
- No active exploitation of vulnerabilities
- Findings are theoretical until confirmed by testing
- Infrastructure security is limited to configuration review

---

## 4. Codebase Profile

### 4.1 Size Metrics

| Metric | Value |
|--------|-------|
| Source Files (JS/JSX) | 453 |
| Lines of Code | ~186,000 |
| Database Migrations | 92 |
| API Endpoint Files | 24 |
| Service Classes | 35 |
| React Contexts | 12 |
| Custom Hooks | 21 |
| Page Components | 73 |
| Technical Spec Documents | 11 |

### 4.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router |
| State Management | React Context + Custom Hooks |
| Backend | Supabase (PostgreSQL 15+) |
| Authentication | Supabase Auth (JWT) |
| File Storage | Supabase Storage |
| Serverless Functions | Vercel Edge Functions |
| AI Services | Anthropic Claude (Opus, Sonnet, Haiku) |
| Hosting | Vercel |
| Data Grid | AG Grid (Evaluator module) |
| Charts | Recharts |
| Testing | Vitest (Unit), Playwright (E2E) |

### 4.3 Major Modules

1. **Tracker Core**: Milestones, deliverables, tasks, sign-off workflows
2. **Financial Operations**: Timesheets, expenses, partner invoices
3. **Planning & Estimation**: WBS planner, SFIA 8 cost estimator
4. **Quality & Compliance**: KPIs, quality standards, RAID logs
5. **Variations**: Change control and contract variations
6. **Evaluator**: IT vendor procurement and evaluation platform
7. **AI Features**: Chat assistant, receipt OCR, planning AI
8. **Administration**: Organisation management, user management, settings

---

## 5. Compliance Frameworks

### 5.1 Mandatory: GDPR

As the application is based in the Channel Islands and handles personal data, GDPR compliance is mandatory.

**Key GDPR Requirements to Verify:**

| Article | Requirement | Audit Focus |
|---------|-------------|-------------|
| Art. 5 | Data processing principles | Purpose limitation, data minimisation |
| Art. 6 | Lawful basis for processing | Consent mechanisms, legitimate interest |
| Art. 12-14 | Transparency | Privacy notices, data collection disclosure |
| Art. 15-20 | Data subject rights | Access, rectification, erasure, portability |
| Art. 25 | Privacy by design | Technical and organisational measures |
| Art. 32 | Security of processing | Encryption, access controls, incident response |
| Art. 33-34 | Breach notification | Detection and notification procedures |
| Art. 35 | DPIA | High-risk processing assessment |
| Art. 44-49 | International transfers | Data location, transfer mechanisms |

### 5.2 Recommended: SOC 2 Type II

For enterprise SaaS serving multiple organisations, SOC 2 certification is increasingly expected.

**SOC 2 Trust Service Criteria:**

| Criteria | Description | Relevance |
|----------|-------------|-----------|
| **Security** | Protection against unauthorised access | High - Core requirement |
| **Availability** | System availability commitments | Medium - SLA dependent |
| **Processing Integrity** | System processing is complete and accurate | High - Financial data |
| **Confidentiality** | Confidential information protection | High - Multi-tenant |
| **Privacy** | Personal information handling | High - GDPR alignment |

**Gap Analysis Approach:**
- Audit will identify current state against SOC 2 controls
- Document remediation required for certification readiness

### 5.3 Recommended: ISO 27001

International standard for information security management.

**Key ISO 27001 Controls to Assess:**

| Domain | Controls |
|--------|----------|
| A.5 | Information security policies |
| A.6 | Organisation of information security |
| A.8 | Asset management |
| A.9 | Access control |
| A.10 | Cryptography |
| A.12 | Operations security |
| A.13 | Communications security |
| A.14 | System acquisition, development, maintenance |
| A.16 | Information security incident management |
| A.18 | Compliance |

### 5.4 Industry-Specific: Cyber Essentials (UK/CI)

For Channel Islands government contracts, Cyber Essentials may be required.

**Cyber Essentials Controls:**
1. Firewalls (N/A - cloud hosted)
2. Secure configuration
3. User access control
4. Malware protection
5. Patch management

### 5.5 Compliance Summary Matrix

| Framework | Status | Effort to Comply | Priority |
|-----------|--------|------------------|----------|
| GDPR | To be assessed | TBD | Mandatory |
| SOC 2 Type II | To be assessed | TBD | Recommended |
| ISO 27001 | To be assessed | TBD | Recommended |
| Cyber Essentials | To be assessed | TBD | If required |

---

## 6. Audit Phases

### Phase 1: Security Foundation

**Focus:** Core security architecture and authentication/authorisation mechanisms

**Areas Covered:**
- Authentication flow (Supabase Auth)
- JWT token handling and session management
- Password policies and account recovery
- API endpoint security (Edge Functions)
- Secret management (environment variables)
- CORS configuration and origin validation
- Rate limiting and abuse prevention
- Security headers

**GDPR Relevance:**
- Art. 32: Security of processing
- Art. 25: Privacy by design

**Deliverable:** `AUDIT-01-Security-Foundation.md`

**Estimated Duration:** 1 Claude session

---

### Phase 2: Data Security & Multi-Tenancy

**Focus:** Data isolation, RLS policies, and data protection

**Areas Covered:**
- RLS policy completeness audit (all tables)
- Organisation isolation verification
- Project isolation verification
- Cross-tenant data leakage analysis
- Soft delete implementation consistency
- Data retention and deletion capabilities
- Audit trail completeness
- Backup and recovery considerations
- Personal data inventory (GDPR Art. 30)

**GDPR Relevance:**
- Art. 5: Data minimisation, storage limitation
- Art. 17: Right to erasure
- Art. 30: Records of processing activities

**Deliverable:** `AUDIT-02-Data-Security.md`

**Estimated Duration:** 1-2 Claude sessions

---

### Phase 3: Frontend Security

**Focus:** Client-side security and data handling

**Areas Covered:**
- Input validation across all forms
- Output encoding (XSS prevention)
- Permission checks in UI components
- Sensitive data in browser storage
- Client-side data exposure risks
- Error message information leakage
- Third-party script security
- Content Security Policy assessment

**GDPR Relevance:**
- Art. 32: Appropriate technical measures

**Deliverable:** `AUDIT-03-Frontend-Security.md`

**Estimated Duration:** 1 Claude session

---

### Phase 4: Architecture & Scalability

**Focus:** System design and SaaS readiness

**Areas Covered:**
- Service layer patterns and consistency
- Component reusability analysis
  - AG Grid usage (Evaluator vs other modules)
  - Common UI patterns
  - Shared utility functions
- Context hierarchy and dependencies
- State management efficiency
- Database schema optimisation
- Query performance considerations
- Caching strategies
- Multi-tenant scaling considerations
- API design patterns

**SaaS Readiness Focus:**
- Tenant isolation at scale
- Resource consumption tracking
- Feature flagging capability
- White-labeling support

**Deliverable:** `AUDIT-04-Architecture.md`

**Estimated Duration:** 1-2 Claude sessions

---

### Phase 5: Technology & Integration Review

**Focus:** Technology choices and third-party integrations

**Areas Covered:**
- Supabase evaluation (pros, cons, limitations)
- Vercel Edge Functions assessment
- Anthropic Claude integration security
  - API key handling
  - Prompt injection prevention
  - Data sent to AI services
- Third-party npm dependency audit
  - Known vulnerabilities
  - Maintenance status
  - License compliance
- Technology alternatives assessment
- Future scaling considerations
- Vendor lock-in analysis

**Deliverable:** `AUDIT-05-Technology-Review.md`

**Estimated Duration:** 1 Claude session

---

### Phase 6: Code Quality & Maintainability

**Focus:** Code quality, patterns, and technical debt

**Areas Covered:**
- Consistent patterns across modules
- Error handling standardisation
- Logging practices
- Test coverage analysis
- Technical debt inventory
- Documentation completeness
- Code duplication analysis
- Component consolidation opportunities
- Accessibility compliance (WCAG)
- Internationalisation readiness

**Deliverable:** `AUDIT-06-Code-Quality.md`

**Estimated Duration:** 1 Claude session

---

### Final Synthesis

**Focus:** Consolidate findings into executive summary

**Deliverables:**
- `SECURITY-AUDIT-EXECUTIVE-SUMMARY.md` - High-level findings for all audiences
- `SECURITY-AUDIT-REMEDIATION-ROADMAP.md` - Prioritised action plan
- `SECURITY-AUDIT-COMPLIANCE-GAP-ANALYSIS.md` - GDPR/SOC 2/ISO 27001 gaps

**Estimated Duration:** 1 Claude session

---

## 7. Methodology

### 7.1 Review Approach

Each phase follows a structured methodology:

```
┌─────────────────────────────────────────────────────────────┐
│  1. SCOPE DEFINITION                                        │
│     Define specific files, patterns, and areas to review    │
├─────────────────────────────────────────────────────────────┤
│  2. DOCUMENTATION REVIEW                                    │
│     Review existing specs and inline documentation          │
├─────────────────────────────────────────────────────────────┤
│  3. CODE ANALYSIS                                           │
│     Systematic review of relevant code sections             │
├─────────────────────────────────────────────────────────────┤
│  4. PATTERN IDENTIFICATION                                  │
│     Identify common patterns (good and bad)                 │
├─────────────────────────────────────────────────────────────┤
│  5. VULNERABILITY ASSESSMENT                                │
│     Check against known vulnerability patterns              │
├─────────────────────────────────────────────────────────────┤
│  6. COMPLIANCE MAPPING                                      │
│     Map findings to compliance requirements                 │
├─────────────────────────────────────────────────────────────┤
│  7. FINDINGS DOCUMENTATION                                  │
│     Document with severity, impact, and remediation         │
├─────────────────────────────────────────────────────────────┤
│  8. RECOMMENDATIONS                                         │
│     Prioritised, actionable recommendations                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Analysis Techniques

| Technique | Description | Application |
|-----------|-------------|-------------|
| **Static Analysis** | Review code without execution | All phases |
| **Pattern Matching** | Search for known vulnerability patterns | Security phases |
| **Data Flow Analysis** | Trace data from input to storage | Data security |
| **Dependency Analysis** | Review third-party packages | Technology review |
| **Configuration Review** | Check security configurations | Infrastructure |
| **Documentation Comparison** | Compare code to documentation | All phases |

### 7.3 Reference Standards

| Standard | Usage |
|----------|-------|
| OWASP Top 10 | Web application vulnerabilities |
| OWASP ASVS | Application security verification |
| CWE/SANS Top 25 | Software weakness enumeration |
| NIST CSF | Cybersecurity framework |
| GDPR | Data protection requirements |
| SOC 2 TSC | Trust service criteria |

---

## 8. Deliverable Structure

### 8.1 Phase Document Template

Each phase produces a document following this structure:

```markdown
# AUDIT-0X: [Phase Name]

## Executive Summary
- 2-3 paragraph overview suitable for non-technical readers
- Key statistics (findings by severity)
- Overall assessment

## Scope
- Specific areas reviewed
- Files/components analysed
- Limitations

## Methodology
- Tools and techniques used
- Reference standards applied

## Strengths
- What the application does well
- Security controls that are effective
- Good patterns identified

## Findings

### Critical
[Findings requiring immediate attention]

### High
[Findings to address within 30 days]

### Medium
[Findings to address within 90 days]

### Low
[Best practice recommendations]

### Informational
[Observations without security impact]

## Finding Detail Template
For each finding:
- **ID**: AUDIT-XX-NNN
- **Title**: Brief description
- **Severity**: Critical/High/Medium/Low/Info
- **Category**: (e.g., Authentication, Authorisation, Data Protection)
- **Location**: File path and line numbers
- **Description**: Detailed explanation
- **Impact**: What could happen if exploited
- **Evidence**: Code snippets or references
- **Remediation**: How to fix
- **Compliance**: Relevant standards (GDPR article, SOC 2 criteria)
- **Effort**: Estimated remediation effort (Low/Medium/High)

## Compliance Mapping
- GDPR requirements addressed
- SOC 2 criteria addressed
- Gaps identified

## Recommendations
- Prioritised action items
- Quick wins vs long-term improvements

## Third-Party Trust Factors
- What external evaluators should know
- Assurances that can be provided
- Documentation for due diligence

## Appendix
- Full code references
- Supporting evidence
- Related documentation
```

### 8.2 Final Deliverables

| Document | Audience | Purpose |
|----------|----------|---------|
| `SECURITY-AUDIT-EXECUTIVE-SUMMARY.md` | All | High-level findings and recommendations |
| `SECURITY-AUDIT-REMEDIATION-ROADMAP.md` | Dev Team | Prioritised implementation plan |
| `SECURITY-AUDIT-COMPLIANCE-GAP-ANALYSIS.md` | Compliance | GDPR/SOC 2/ISO 27001 gaps |
| `SECURITY-AUDIT-THIRD-PARTY-ASSURANCE.md` | External | Trust documentation for evaluators |

---

## 9. Execution Strategy

### 9.1 Session Management

Due to context limitations, the audit will be executed across multiple Claude sessions:

```
Session 1: Phase 1 (Security Foundation)
    │
    ├── Output: AUDIT-01-Security-Foundation.md
    │
Session 2: Phase 2 (Data Security) - Part 1
    │
    ├── Output: AUDIT-02-Data-Security.md (draft)
    │
Session 3: Phase 2 (Data Security) - Part 2 (if needed)
    │
    ├── Output: AUDIT-02-Data-Security.md (complete)
    │
Session 4: Phase 3 (Frontend Security)
    │
    ├── Output: AUDIT-03-Frontend-Security.md
    │
Session 5: Phase 4 (Architecture) - Part 1
    │
    ├── Output: AUDIT-04-Architecture.md (draft)
    │
Session 6: Phase 4 (Architecture) - Part 2 (if needed)
    │
    ├── Output: AUDIT-04-Architecture.md (complete)
    │
Session 7: Phase 5 (Technology Review)
    │
    ├── Output: AUDIT-05-Technology-Review.md
    │
Session 8: Phase 6 (Code Quality)
    │
    ├── Output: AUDIT-06-Code-Quality.md
    │
Session 9: Final Synthesis
    │
    ├── Output: Executive Summary
    ├── Output: Remediation Roadmap
    ├── Output: Compliance Gap Analysis
    └── Output: Third-Party Assurance
```

### 9.2 Session Initiation Protocol

Each session should begin with:

1. **Context Loading**:
   ```
   Please review the audit plan at audit/SECURITY-AUDIT-PLAN.md
   and continue with Phase X. Previous phase findings are in
   audit/AUDIT-0Y-*.md
   ```

2. **Phase Confirmation**: Confirm scope before starting analysis

3. **Progress Checkpoints**: Save findings incrementally to prevent loss

### 9.3 Critical Finding Protocol

When a critical finding is identified:

1. **Immediate Documentation**: Document finding before continuing
2. **Deep Dive**: Investigate scope and impact thoroughly
3. **Related Search**: Check for similar issues elsewhere
4. **Remediation Priority**: Flag for immediate attention
5. **Continue Audit**: Resume systematic review

---

## 10. Risk Classification

### 10.1 Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| **Critical** | Exploitable vulnerability with severe impact; data breach risk | Immediate |
| **High** | Significant security weakness; compliance violation | 30 days |
| **Medium** | Security concern requiring attention; defence-in-depth gap | 90 days |
| **Low** | Best practice recommendation; minor improvement | Backlog |
| **Informational** | Observation; no direct security impact | Optional |

### 10.2 Impact Categories

| Category | Description |
|----------|-------------|
| **Confidentiality** | Unauthorised data access |
| **Integrity** | Unauthorised data modification |
| **Availability** | Service disruption |
| **Compliance** | Regulatory violation |
| **Reputation** | Brand/trust damage |
| **Financial** | Direct monetary loss |

### 10.3 Exploitability Factors

| Factor | Weight |
|--------|--------|
| Unauthenticated access | High |
| Authenticated user access | Medium |
| Requires admin access | Low |
| Requires physical access | Very Low |

---

## 11. Success Criteria

### 11.1 Audit Completion

The audit is considered complete when:

- [ ] All 6 phases documented
- [ ] All findings classified by severity
- [ ] Remediation recommendations provided
- [ ] Compliance gaps documented
- [ ] Executive summary produced
- [ ] Third-party assurance document created

### 11.2 Quality Criteria

Each phase deliverable must:

- Cover all areas defined in scope
- Provide evidence for all findings
- Include actionable remediation guidance
- Map findings to compliance requirements
- Be understandable by both technical and non-technical readers

### 11.3 Measurable Outcomes

| Metric | Target |
|--------|--------|
| Critical findings | 0 unaddressed |
| High findings | Remediation plan within 30 days |
| GDPR compliance gaps | Documented with remediation path |
| SOC 2 readiness | Gap analysis complete |
| Third-party documentation | Ready for due diligence |

---

## 12. Document Inventory

### 12.1 Existing Documentation to Review

| Document | Path | Relevance |
|----------|------|-----------|
| Architecture Overview | `docs/TECH-SPEC-01-Architecture.md` | Phase 4 |
| Database Core | `docs/TECH-SPEC-02-Database-Core.md` | Phase 2 |
| Database Operations | `docs/TECH-SPEC-03-Database-Operations.md` | Phase 2 |
| Database Supporting | `docs/TECH-SPEC-04-Database-Supporting.md` | Phase 2 |
| RLS & Security | `docs/TECH-SPEC-05-RLS-Security.md` | Phase 1, 2 |
| API & AI | `docs/TECH-SPEC-06-API-AI.md` | Phase 1, 5 |
| Frontend State | `docs/TECH-SPEC-07-Frontend-State.md` | Phase 3, 4 |
| Services | `docs/TECH-SPEC-08-Services.md` | Phase 4 |
| Testing | `docs/TECH-SPEC-09-Testing-Infrastructure.md` | Phase 6 |
| Evaluator | `docs/TECH-SPEC-11-Evaluator.md` | Phase 4 |
| CLAUDE.md | `CLAUDE.md` | All phases |

### 12.2 Audit Deliverables

| Document | Status | Phase | Completed |
|----------|--------|-------|-----------|
| `SECURITY-AUDIT-PLAN.md` | Complete | - | 15 Jan 2026 |
| `AUDIT-01-Security-Foundation.md` | **Complete** | 1 | 15 Jan 2026 |
| `AUDIT-02-Data-Security.md` | **Complete** | 2 | 15 Jan 2026 |
| `AUDIT-03-Frontend-Security.md` | **Complete** | 3 | 15 Jan 2026 |
| `AUDIT-04-Architecture.md` | **Complete** | 4 | 15 Jan 2026 |
| `AUDIT-05-Technology.md` | **Complete** | 5 | 15 Jan 2026 |
| `AUDIT-06-Code-Quality.md` | **Complete** | 6 | 15 Jan 2026 |
| `SECURITY-AUDIT-EXECUTIVE-SUMMARY.md` | Pending | Final | - |
| `SECURITY-AUDIT-REMEDIATION-ROADMAP.md` | **Complete** | Final | 15 Jan 2026 |
| `SECURITY-AUDIT-COMPLIANCE-GAP-ANALYSIS.md` | Pending | Final | - |
| `SECURITY-AUDIT-THIRD-PARTY-ASSURANCE.md` | Pending | Final | - |

### 12.3 Findings Summary (Running Tally)

| Phase | Critical | High | Medium | Low | Info |
|-------|----------|------|--------|-----|------|
| Phase 1 - Security Foundation | 1 | 2 | 4 | 3 | 4 |
| Phase 2 - Data Security | 0 | 1 | 3 | 2 | 5 |
| Phase 3 - Frontend Security | 0 | 1 | 2 | 2 | 4 |
| Phase 4 - Architecture | 0 | 1 | 3 | 2 | 5 |
| Phase 5 - Technology Review | 1 | 0 | 3 | 2 | 4 |
| Phase 6 - Code Quality | 0 | 1 | 2 | 3 | 5 |
| **Total** | **2** | **6** | **17** | **14** | **27** |

---

## Appendix A: Known Issues from CLAUDE.md

The following in-progress items from CLAUDE.md should be verified during the audit:

1. **Member Project Assignments Feature** (Status: BLOCKED)
   - Database function errors
   - RLS bypass using SECURITY DEFINER functions
   - Needs verification in Phase 2

---

## Appendix B: GitHub Security Alerts

The repository has 4 open Dependabot alerts (3 high, 1 moderate) that should be addressed as part of Phase 5 (Technology Review).

---

## Appendix C: Starting Phase 1

To begin Phase 1 in a new session, use this prompt:

```
I'm conducting a security audit of the Tracker by Progressive application.
Please review the audit plan at audit/SECURITY-AUDIT-PLAN.md and begin
Phase 1: Security Foundation.

Focus areas:
- Authentication flow (Supabase Auth)
- Session management
- API endpoint security
- Secret management
- Security headers

Document findings in audit/AUDIT-01-Security-Foundation.md
```

---

**Document Status:** Complete
**Next Step:** Begin Phase 1 in new Claude session
**Prepared By:** Claude Opus 4.5
**Review Required:** Yes - before starting Phase 1
