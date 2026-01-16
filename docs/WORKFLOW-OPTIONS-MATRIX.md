# Project Workflow & Permissions Options Matrix

> **Document:** WORKFLOW-OPTIONS-MATRIX.md
> **Version:** 1.0 (Draft)
> **Created:** 16 January 2026
> **Purpose:** Define customizable project settings that impact workflow and permissions

---

## Executive Summary

This document defines a comprehensive matrix of project-level settings that control:
1. **Workflow behaviors** - What approvals/sign-offs are required
2. **Feature enablement** - Which modules are active for this project
3. **Approval authorities** - Who can approve what
4. **Process formality** - Level of governance required

The goal is to support diverse project types (internal, client-facing, agile, formal, etc.) with a single flexible system.

---

## 1. Current State Analysis

### 1.1 What Exists Today

| Level | Settings Location | Current Capabilities |
|-------|------------------|---------------------|
| **Organisation** | `organisations.settings` (JSONB) | Feature flags (AI chat, receipt scanner, variations, report builder), defaults (currency, hours/day, date format, timezone) |
| **Project** | `projects.settings` (JSONB) | currency, hoursPerDay, fiscalYearStart, requireTimesheetApproval, requireExpenseApproval, clientName, contractReference |

### 1.2 Current Hardcoded Behaviors

| Workflow | Current Behavior | Customizable? |
|----------|-----------------|---------------|
| Milestone Baseline | Requires both Supplier PM + Customer PM signatures | No |
| Milestone Certificate | Requires both Supplier PM + Customer PM signatures | No |
| Deliverable Sign-off | Requires both Supplier PM + Customer PM signatures | No |
| Variation Approval | Requires both Supplier PM + Customer PM signatures | No |
| Timesheet Approval | Customer PM only | Partially (on/off) |
| Expense Approval | Chargeable → Customer PM, Non-chargeable → Supplier PM | No |

---

## 2. Proposed Project Settings Schema

### 2.1 Settings Categories

```
project.settings = {
  general: { ... },           // Basic project configuration
  milestones: { ... },        // Milestone workflow options
  deliverables: { ... },      // Deliverable workflow options
  timesheets: { ... },        // Timesheet tracking options
  expenses: { ... },          // Expense tracking options
  variations: { ... },        // Change control options
  quality: { ... },           // Quality management options
  billing: { ... },           // Financial/billing options
  notifications: { ... },     // Notification preferences
  integrations: { ... }       // External system settings
}
```

---

## 3. Milestone Workflow Options

### 3.1 Baseline Management

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `milestones.baselines.required` | boolean | true/false | true | Whether formal milestone baselines are required |
| `milestones.baselines.approval` | enum | 'both', 'supplier_only', 'customer_only', 'none' | 'both' | Who must sign to lock a baseline |
| `milestones.baselines.variationsRequired` | boolean | true/false | true | Whether variations are required to change baselined milestones |
| `milestones.baselines.variationApproval` | enum | 'both', 'supplier_only', 'customer_only' | 'both' | Who must approve variations |
| `milestones.baselines.autoLockOnCommit` | boolean | true/false | false | Auto-lock baseline when committed to Tracker |

### 3.2 Billing & Financial

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `milestones.billing.enabled` | boolean | true/false | true | Whether milestones have billing amounts |
| `milestones.billing.type` | enum | 'fixed', 'estimate', 'none' | 'fixed' | Fixed price, estimate, or no assumed amount |
| `milestones.billing.autoBillableOnCertificate` | boolean | true/false | true | Auto-set billable when certificate is accepted |
| `milestones.billing.requireCertificateForBilling` | boolean | true/false | true | Certificate required before milestone can be billed |

### 3.3 Certificates & Acceptance

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `milestones.certificates.required` | boolean | true/false | true | Whether milestone certificates are required |
| `milestones.certificates.autoGenerateOnComplete` | boolean | true/false | false | Auto-generate certificate when all deliverables complete |
| `milestones.certificates.approval` | enum | 'both', 'supplier_only', 'customer_only' | 'both' | Who must sign to accept certificate |
| `milestones.certificates.requireAllDeliverablesComplete` | boolean | true/false | true | All deliverables must be 'Delivered' before certificate |

### 3.4 Milestone Decision Matrix

| Project Type | Baselines Required | Baseline Approval | Variations Required | Certificate Required | Certificate Approval |
|--------------|-------------------|-------------------|---------------------|---------------------|---------------------|
| **Formal Fixed-Price** | Yes | Both | Yes | Yes | Both |
| **Time & Materials** | No | N/A | No | Optional | Supplier Only |
| **Internal Project** | Optional | Supplier Only | No | No | N/A |
| **Agile/Iterative** | No | N/A | No | No | N/A |
| **Government Contract** | Yes | Both | Yes | Yes | Both |

---

## 4. Deliverable Workflow Options

### 4.1 Quality & Standards

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `deliverables.quality.standardsEnabled` | boolean | true/false | true | Whether quality standards can be linked |
| `deliverables.quality.standardsRequired` | boolean | true/false | false | Whether at least one standard must be linked |
| `deliverables.quality.kpisEnabled` | boolean | true/false | true | Whether KPIs can be linked |
| `deliverables.quality.kpisRequired` | boolean | true/false | false | Whether at least one KPI must be linked |
| `deliverables.quality.assessmentRequired` | boolean | true/false | false | Must assess quality/KPI before sign-off |

### 4.2 Approval & Sign-off

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `deliverables.approval.required` | boolean | true/false | true | Whether deliverables require approval to complete |
| `deliverables.approval.authority` | enum | 'both', 'supplier_only', 'customer_only' | 'both' | Who must sign to mark 'Delivered' |
| `deliverables.approval.reviewRequired` | boolean | true/false | true | Must go through 'Review Complete' before sign-off |
| `deliverables.approval.reviewAuthority` | enum | 'customer_only', 'supplier_only', 'either' | 'customer_only' | Who performs the review step |

### 4.3 Tasks & Progress

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `deliverables.tasks.enabled` | boolean | true/false | true | Whether deliverable tasks/checklists are available |
| `deliverables.tasks.autoProgressCalculation` | boolean | true/false | true | Auto-calculate progress from task completion |
| `deliverables.tasks.requiredForCompletion` | boolean | true/false | false | All tasks must be complete to mark delivered |

### 4.4 Deliverable Decision Matrix

| Project Type | Approval Required | Approval Authority | Review Required | Quality Standards |
|--------------|------------------|-------------------|-----------------|-------------------|
| **Formal Fixed-Price** | Yes | Both | Yes | Required |
| **Time & Materials** | Optional | Customer Only | No | Optional |
| **Internal Project** | No | N/A | No | Optional |
| **Agile/Iterative** | Optional | Supplier Only | No | Optional |
| **Regulated Industry** | Yes | Both | Yes | Required |

---

## 5. Timesheet Workflow Options

### 5.1 Tracking & Submission

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `timesheets.enabled` | boolean | true/false | true | Whether project tracks timesheets |
| `timesheets.submitRequired` | boolean | true/false | true | Whether timesheets must be formally submitted |
| `timesheets.minEntryHours` | number | 0.25-1.0 | 0.5 | Minimum hours per entry |
| `timesheets.maxEntryHours` | number | 8-24 | 12 | Maximum hours per single entry |
| `timesheets.requireMilestone` | boolean | true/false | true | Must associate timesheet with milestone |
| `timesheets.allowFutureEntries` | boolean | true/false | false | Allow logging time for future dates |
| `timesheets.lockPeriodDays` | number | 0-30 | 0 | Days after which entries are locked |

### 5.2 Approval

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `timesheets.approval.required` | boolean | true/false | true | Whether submitted timesheets require approval |
| `timesheets.approval.authority` | enum | 'customer_pm', 'supplier_pm', 'either', 'both' | 'customer_pm' | Who can approve timesheets |
| `timesheets.approval.autoApproveThreshold` | number | 0-40 | 0 | Hours below which auto-approve (0 = disabled) |
| `timesheets.approval.rejectionNotifySubmitter` | boolean | true/false | true | Notify submitter when rejected |

### 5.3 Timesheet Decision Matrix

| Project Type | Tracking | Approval Required | Approval Authority |
|--------------|----------|-------------------|-------------------|
| **Formal Fixed-Price** | Yes | Yes | Customer PM |
| **Time & Materials** | Yes | Yes | Customer PM |
| **Internal Project** | Optional | No | N/A |
| **Agile/Iterative** | Yes | Optional | Supplier PM |
| **Cost Reimbursable** | Yes | Yes | Both |

---

## 6. Expense Workflow Options

### 6.1 Tracking & Submission

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `expenses.enabled` | boolean | true/false | true | Whether project tracks expenses |
| `expenses.submitRequired` | boolean | true/false | true | Whether expenses must be formally submitted |
| `expenses.receiptRequired` | boolean | true/false | true | Whether receipt attachment is mandatory |
| `expenses.receiptThreshold` | number | 0-1000 | 25 | Expense amount above which receipt required |
| `expenses.categoriesEnabled` | boolean | true/false | true | Whether expense categories are used |
| `expenses.categoriesRequired` | boolean | true/false | true | Whether category selection is mandatory |

### 6.2 Approval

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `expenses.approval.required` | boolean | true/false | true | Whether submitted expenses require approval |
| `expenses.approval.authority` | enum | 'customer_pm', 'supplier_pm', 'either', 'both', 'conditional' | 'conditional' | Who can approve expenses |
| `expenses.approval.conditionalRules` | object | - | See below | Rules when authority is 'conditional' |
| `expenses.approval.autoApproveThreshold` | number | 0-100 | 0 | Amount below which auto-approve (0 = disabled) |
| `expenses.approval.escalationThreshold` | number | 0-10000 | 0 | Amount above which escalation required (0 = disabled) |

### 6.3 Conditional Approval Rules

```json
{
  "expenses.approval.conditionalRules": {
    "chargeable_to_customer": "customer_pm",
    "not_chargeable": "supplier_pm",
    "above_threshold": "both"
  }
}
```

### 6.4 Expense Decision Matrix

| Project Type | Tracking | Approval Required | Default Authority |
|--------------|----------|-------------------|-------------------|
| **Formal Fixed-Price** | Yes | Yes | Conditional |
| **Time & Materials** | Yes | Yes | Customer PM |
| **Internal Project** | Optional | Optional | Supplier PM |
| **Cost Reimbursable** | Yes | Yes | Both |

---

## 7. Variation (Change Control) Options

### 7.1 Configuration

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `variations.enabled` | boolean | true/false | true | Whether change control is used |
| `variations.approval.authority` | enum | 'both', 'supplier_only', 'customer_only' | 'both' | Who must approve variations |
| `variations.autoApplyOnApproval` | boolean | true/false | false | Auto-apply to baselines when approved |
| `variations.impactAssessmentRequired` | boolean | true/false | true | Must specify cost/time impact |
| `variations.requireAffectedItems` | boolean | true/false | true | Must link affected milestones/deliverables |

### 7.2 Types Enabled

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `variations.types.scopeExtension` | boolean | true/false | true | Enable scope extension type |
| `variations.types.scopeReduction` | boolean | true/false | true | Enable scope reduction type |
| `variations.types.timeExtension` | boolean | true/false | true | Enable time extension type |
| `variations.types.costAdjustment` | boolean | true/false | true | Enable cost adjustment type |
| `variations.types.combined` | boolean | true/false | true | Enable combined variation type |

---

## 8. Additional Workflow Options

### 8.1 RAID Log

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `raid.enabled` | boolean | true/false | true | Whether RAID log is used |
| `raid.riskEscalationEnabled` | boolean | true/false | false | Auto-escalate high-severity risks |
| `raid.riskReviewRequired` | boolean | true/false | false | Require periodic risk review |
| `raid.riskReviewPeriodDays` | number | 7-90 | 30 | Days between required reviews |
| `raid.issueResolutionTracking` | boolean | true/false | true | Track issue resolution dates |

### 8.2 Partner Invoicing

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `invoicing.enabled` | boolean | true/false | true | Whether partner invoicing is used |
| `invoicing.approval.required` | boolean | true/false | true | Whether invoices require approval |
| `invoicing.approval.authority` | enum | 'supplier_pm', 'supplier_finance', 'both' | 'supplier_pm' | Who can approve partner invoices |
| `invoicing.includeTimesheets` | boolean | true/false | true | Include timesheets in invoice |
| `invoicing.includeExpenses` | boolean | true/false | true | Include expenses in invoice |
| `invoicing.requireApprovedTimesheets` | boolean | true/false | true | Only include approved timesheets |
| `invoicing.requireApprovedExpenses` | boolean | true/false | true | Only include approved expenses |

### 8.3 Resources & Capacity

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `resources.capacityPlanningEnabled` | boolean | true/false | true | Whether capacity planning is used |
| `resources.availabilityTrackingEnabled` | boolean | true/false | true | Whether resource availability is tracked |
| `resources.overallocationWarning` | boolean | true/false | true | Warn when resource overallocated |
| `resources.overallocationBlock` | boolean | true/false | false | Block when resource overallocated |

### 8.4 Reports & Documents

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `reports.enabled` | boolean | true/false | true | Whether report builder is available |
| `reports.aiEnabled` | boolean | true/false | true | Whether AI report generation is available |
| `documents.templatesEnabled` | boolean | true/false | true | Whether document templates are used |
| `documents.certificateAutoGenerate` | boolean | true/false | false | Auto-generate certificates |

### 8.5 Planning & Estimator

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `planning.enabled` | boolean | true/false | true | Whether Planning tool is available |
| `planning.aiEnabled` | boolean | true/false | true | Whether AI planning assistant is available |
| `planning.commitApproval` | enum | 'none', 'supplier_only', 'both' | 'none' | Approval required to commit plan |
| `estimator.enabled` | boolean | true/false | true | Whether Estimator tool is available |
| `estimator.sfiaRatesEnabled` | boolean | true/false | true | Whether SFIA 8 rates are used |
| `benchmarking.enabled` | boolean | true/false | true | Whether benchmarking is available |

### 8.6 Notifications & Escalation

| Setting | Type | Options | Default | Description |
|---------|------|---------|---------|-------------|
| `notifications.emailEnabled` | boolean | true/false | true | Send email notifications |
| `notifications.workflowReminders` | boolean | true/false | true | Remind on pending workflow items |
| `notifications.reminderDays` | number | 1-7 | 3 | Days before sending reminder |
| `notifications.escalationEnabled` | boolean | true/false | false | Auto-escalate overdue items |
| `notifications.escalationDays` | number | 1-14 | 7 | Days before escalation |
| `notifications.escalationTarget` | enum | 'admin', 'org_admin', 'supplier_pm' | 'supplier_pm' | Who receives escalations |

---

## 9. Approval Authority Reference

### 9.1 Authority Options

| Value | Description | Applicable Roles |
|-------|-------------|------------------|
| `supplier_only` | Only Supplier PM can approve | supplier_pm |
| `customer_only` | Only Customer PM can approve | customer_pm |
| `both` | Both Supplier PM AND Customer PM must approve | supplier_pm + customer_pm |
| `either` | Either Supplier PM OR Customer PM can approve | supplier_pm OR customer_pm |
| `conditional` | Authority depends on item characteristics | Varies by rule |
| `none` | No approval required | N/A |

### 9.2 Current vs Proposed Authority Matrix

| Workflow Item | Current Authority | Proposed Options |
|--------------|-------------------|------------------|
| Milestone Baseline | Both (hardcoded) | both, supplier_only, customer_only, none |
| Milestone Certificate | Both (hardcoded) | both, supplier_only, customer_only |
| Deliverable Sign-off | Both (hardcoded) | both, supplier_only, customer_only, none |
| Deliverable Review | Customer (hardcoded) | customer_only, supplier_only, either |
| Variation Approval | Both (hardcoded) | both, supplier_only, customer_only |
| Timesheet Approval | Customer (hardcoded) | customer_pm, supplier_pm, either, both, none |
| Expense Approval | Conditional (hardcoded) | customer_pm, supplier_pm, either, both, conditional, none |
| Partner Invoice | Supplier (hardcoded) | supplier_pm, supplier_finance, both |

---

## 10. Project Type Templates

### 10.1 Predefined Templates

To simplify project setup, offer predefined templates that pre-configure all settings:

| Template | Description | Target Use Case |
|----------|-------------|-----------------|
| **Formal Fixed-Price** | Full governance, dual-signature, strict baselines | Government contracts, enterprise |
| **Time & Materials** | Flexible, customer approval focus | Consulting, professional services |
| **Internal Project** | Minimal governance, supplier-only | Internal IT, process improvement |
| **Agile/Iterative** | Light governance, frequent delivery | Software development, sprints |
| **Regulated Industry** | Maximum governance, audit trail | Healthcare, finance, legal |
| **Custom** | Start from scratch | Bespoke requirements |

### 10.2 Template: Formal Fixed-Price

```json
{
  "template": "formal_fixed_price",
  "milestones": {
    "baselines": {
      "required": true,
      "approval": "both",
      "variationsRequired": true,
      "variationApproval": "both"
    },
    "billing": {
      "enabled": true,
      "type": "fixed",
      "autoBillableOnCertificate": true,
      "requireCertificateForBilling": true
    },
    "certificates": {
      "required": true,
      "approval": "both",
      "requireAllDeliverablesComplete": true
    }
  },
  "deliverables": {
    "approval": {
      "required": true,
      "authority": "both",
      "reviewRequired": true
    },
    "quality": {
      "standardsEnabled": true,
      "kpisEnabled": true
    }
  },
  "timesheets": {
    "enabled": true,
    "approval": {
      "required": true,
      "authority": "customer_pm"
    }
  },
  "expenses": {
    "enabled": true,
    "approval": {
      "required": true,
      "authority": "conditional"
    }
  },
  "variations": {
    "enabled": true,
    "approval": {
      "authority": "both"
    }
  }
}
```

### 10.3 Template: Internal Project

```json
{
  "template": "internal_project",
  "milestones": {
    "baselines": {
      "required": false,
      "approval": "none"
    },
    "billing": {
      "enabled": false
    },
    "certificates": {
      "required": false
    }
  },
  "deliverables": {
    "approval": {
      "required": false,
      "authority": "none"
    }
  },
  "timesheets": {
    "enabled": true,
    "approval": {
      "required": false
    }
  },
  "expenses": {
    "enabled": false
  },
  "variations": {
    "enabled": false
  }
}
```

### 10.4 Template: Agile/Iterative

```json
{
  "template": "agile_iterative",
  "milestones": {
    "baselines": {
      "required": false,
      "approval": "none"
    },
    "billing": {
      "enabled": true,
      "type": "estimate"
    },
    "certificates": {
      "required": false
    }
  },
  "deliverables": {
    "approval": {
      "required": true,
      "authority": "supplier_only",
      "reviewRequired": false
    }
  },
  "timesheets": {
    "enabled": true,
    "approval": {
      "required": true,
      "authority": "supplier_pm"
    }
  },
  "expenses": {
    "enabled": true,
    "approval": {
      "required": true,
      "authority": "supplier_pm"
    }
  },
  "variations": {
    "enabled": false
  }
}
```

---

## 11. Implementation Considerations

### 11.1 Database Schema Changes

**Option A: Expand projects.settings JSONB**
- Pros: No schema migration, flexible
- Cons: No type safety, harder to query

**Option B: New project_settings table**
- Pros: Typed columns, easier querying, validation
- Cons: Schema migration, joins required

**Recommended:** Hybrid approach - core settings as columns, extended as JSONB

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  -- Core workflow flags (frequently queried)
  baselines_required BOOLEAN DEFAULT TRUE,
  baseline_approval TEXT DEFAULT 'both',
  certificates_required BOOLEAN DEFAULT TRUE,
  certificate_approval TEXT DEFAULT 'both',
  timesheets_enabled BOOLEAN DEFAULT TRUE,
  timesheet_approval_required BOOLEAN DEFAULT TRUE,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm',
  expenses_enabled BOOLEAN DEFAULT TRUE,
  expense_approval_required BOOLEAN DEFAULT TRUE,
  expense_approval_authority TEXT DEFAULT 'conditional',
  variations_enabled BOOLEAN DEFAULT TRUE,
  variation_approval TEXT DEFAULT 'both',

  -- Extended settings (less frequently accessed)
  workflow_settings JSONB DEFAULT '{}'::jsonb;
```

### 11.2 Frontend Changes

1. **Project Settings Page** - New "Workflow" tab with all options
2. **Project Creation Wizard** - Template selection step
3. **Workflow components** - Respect settings instead of hardcoded logic
4. **Permission hooks** - Check settings before allowing actions

### 11.3 Service Layer Changes

1. **WorkflowService** - Add settings-aware approval logic
2. **MilestonesService** - Check baseline/certificate settings
3. **DeliverablesService** - Check approval authority settings
4. **TimesheetsService** - Check approval settings
5. **ExpensesService** - Check approval settings

### 11.4 Migration Strategy

1. **Phase 1:** Add schema changes with defaults matching current behavior
2. **Phase 2:** Update services to read from settings
3. **Phase 3:** Add UI for project settings management
4. **Phase 4:** Add project templates
5. **Phase 5:** Migrate existing projects to explicit settings

---

## 12. Future Considerations

### 12.1 Multi-Level Approval Chains

Future enhancement: Support approval chains with multiple levels:

```json
{
  "deliverables.approval.chain": [
    { "role": "contributor", "action": "submit" },
    { "role": "supplier_pm", "action": "review" },
    { "role": "customer_pm", "action": "approve" }
  ]
}
```

### 12.2 Conditional Workflows

Future enhancement: Rule-based workflow routing:

```json
{
  "timesheets.approval.rules": [
    { "condition": "hours > 40", "authority": "both" },
    { "condition": "milestone.is_billable", "authority": "customer_pm" },
    { "default": "supplier_pm" }
  ]
}
```

### 12.3 Delegation

Future enhancement: Approval delegation when users are unavailable:

```json
{
  "delegation": {
    "enabled": true,
    "allowedRoles": ["supplier_pm", "customer_pm"],
    "maxDelegationDays": 30
  }
}
```

### 12.4 SLA & Escalation

Future enhancement: Automatic escalation based on SLAs:

```json
{
  "sla": {
    "timesheetApproval": { "targetDays": 3, "escalationDays": 5 },
    "expenseApproval": { "targetDays": 5, "escalationDays": 7 },
    "deliverableReview": { "targetDays": 5, "escalationDays": 10 }
  }
}
```

---

## 13. Complete Settings Reference

### 13.1 Full Schema (JSON)

```json
{
  "general": {
    "currency": "GBP",
    "hoursPerDay": 8,
    "fiscalYearStart": "01-01",
    "timezone": "Europe/London",
    "dateFormat": "DD/MM/YYYY",
    "clientName": null,
    "contractReference": null
  },

  "milestones": {
    "baselines": {
      "required": true,
      "approval": "both",
      "variationsRequired": true,
      "variationApproval": "both",
      "autoLockOnCommit": false
    },
    "billing": {
      "enabled": true,
      "type": "fixed",
      "autoBillableOnCertificate": true,
      "requireCertificateForBilling": true
    },
    "certificates": {
      "required": true,
      "autoGenerateOnComplete": false,
      "approval": "both",
      "requireAllDeliverablesComplete": true
    }
  },

  "deliverables": {
    "approval": {
      "required": true,
      "authority": "both",
      "reviewRequired": true,
      "reviewAuthority": "customer_only"
    },
    "quality": {
      "standardsEnabled": true,
      "standardsRequired": false,
      "kpisEnabled": true,
      "kpisRequired": false,
      "assessmentRequired": false
    },
    "tasks": {
      "enabled": true,
      "autoProgressCalculation": true,
      "requiredForCompletion": false
    }
  },

  "timesheets": {
    "enabled": true,
    "submitRequired": true,
    "minEntryHours": 0.5,
    "maxEntryHours": 12,
    "requireMilestone": true,
    "allowFutureEntries": false,
    "lockPeriodDays": 0,
    "approval": {
      "required": true,
      "authority": "customer_pm",
      "autoApproveThreshold": 0,
      "rejectionNotifySubmitter": true
    }
  },

  "expenses": {
    "enabled": true,
    "submitRequired": true,
    "receiptRequired": true,
    "receiptThreshold": 25,
    "categoriesEnabled": true,
    "categoriesRequired": true,
    "approval": {
      "required": true,
      "authority": "conditional",
      "conditionalRules": {
        "chargeable_to_customer": "customer_pm",
        "not_chargeable": "supplier_pm"
      },
      "autoApproveThreshold": 0,
      "escalationThreshold": 0
    }
  },

  "variations": {
    "enabled": true,
    "approval": {
      "authority": "both"
    },
    "autoApplyOnApproval": false,
    "impactAssessmentRequired": true,
    "requireAffectedItems": true,
    "types": {
      "scopeExtension": true,
      "scopeReduction": true,
      "timeExtension": true,
      "costAdjustment": true,
      "combined": true
    }
  },

  "raid": {
    "enabled": true,
    "riskEscalationEnabled": false,
    "riskReviewRequired": false,
    "riskReviewPeriodDays": 30,
    "issueResolutionTracking": true
  },

  "invoicing": {
    "enabled": true,
    "approval": {
      "required": true,
      "authority": "supplier_pm"
    },
    "includeTimesheets": true,
    "includeExpenses": true,
    "requireApprovedTimesheets": true,
    "requireApprovedExpenses": true
  },

  "resources": {
    "capacityPlanningEnabled": true,
    "availabilityTrackingEnabled": true,
    "overallocationWarning": true,
    "overallocationBlock": false
  },

  "reports": {
    "enabled": true,
    "aiEnabled": true
  },

  "documents": {
    "templatesEnabled": true,
    "certificateAutoGenerate": false
  },

  "planning": {
    "enabled": true,
    "aiEnabled": true,
    "commitApproval": "none"
  },

  "estimator": {
    "enabled": true,
    "sfiaRatesEnabled": true
  },

  "benchmarking": {
    "enabled": true
  },

  "notifications": {
    "emailEnabled": true,
    "workflowReminders": true,
    "reminderDays": 3,
    "escalationEnabled": false,
    "escalationDays": 7,
    "escalationTarget": "supplier_pm"
  }
}
```

---

## 14. Summary

This matrix provides **75+ configurable settings** across **12 categories** that allow each project to be tailored to its specific governance requirements. Key benefits:

1. **Flexibility** - Support diverse project types without code changes
2. **Templates** - Quick setup with predefined configurations
3. **Consistency** - Enforce governance standards across projects
4. **Scalability** - Add new settings without schema changes
5. **Audit** - Clear record of what approvals are required

The implementation should be phased, starting with the most impactful settings (approval authorities) and expanding to full coverage over time.

---

## Appendix A: Comparison with Industry Standards

| Framework | Key Governance Elements | Alignment |
|-----------|------------------------|-----------|
| **PRINCE2** | Stage gates, change control, quality review | Strong - supports all |
| **PMBoK** | Integrated change control, quality management | Strong - supports all |
| **Agile/Scrum** | Self-organizing, minimal governance | Supported via templates |
| **ITIL** | Change management, service validation | Strong - supports all |
| **ISO 27001** | Access control, audit trail | Strong - RLS + audit log |

---

*Document created 16 January 2026 for Progressive.gg Tracker project configuration planning.*
