# AI Feature Guides Implementation Plan

**Document Version:** 1.1  
**Created:** 7 January 2026  
**Last Updated:** 7 January 2026  
**Status:** ✅ Complete  
**Actual Effort:** Single session implementation  

---

## How to Use This Document

This plan is structured for **incremental implementation** with context management in mind. Each segment is designed to be completed in a single Claude session.

### Working Process

1. **Start of Session:** Read the relevant segment section
2. **Implementation:** Complete the tasks listed
3. **Checkpoint:** Verify all items in the checkpoint checklist
4. **Handoff:** Update the progress tracker before ending session
5. **Next Session:** Review progress tracker, continue to next segment

### Progress Tracker

Update this section after completing each segment:

| Segment | Status | Completed Date | Notes |
|---------|--------|----------------|-------|
| 1 | ✅ Complete | 7 Jan 2026 | Infrastructure, tool definition, execution function |
| 2 | ✅ Complete | 7 Jan 2026 | System prompt updated, timesheets guide created |
| 3 | ✅ Complete | 7 Jan 2026 | Expenses guide created (526 lines) |
| 4 | ✅ Complete | 7 Jan 2026 | Milestones guide created (534 lines) |
| 5 | ✅ Complete | 7 Jan 2026 | Deliverables (434 lines), Resources (382 lines) guides created |
| 6 | ✅ Complete | 7 Jan 2026 | Variations guide created (599 lines) |
| 7 | ✅ Complete | 7 Jan 2026 | RAID Log guide created (631 lines) |
| 8 | ✅ Complete | 7 Jan 2026 | Quality Standards (380 lines), KPIs (399 lines) guides created |
| 9 | ✅ Complete | 7 Jan 2026 | WBS Planning (535 lines), Estimator (538 lines), Benchmarking (553 lines) guides created |
| 10 | ✅ Complete | 7 Jan 2026 | Billing (480 lines), Partner Invoices (620 lines) guides created |
| 11 | ✅ Complete | 7 Jan 2026 | Evaluation Setup (582 lines) guide created |
| 12 | ✅ Complete | 7 Jan 2026 | Requirements (490 lines), Vendors (520 lines) guides created |
| 13 | ✅ Complete | 7 Jan 2026 | Scoring (386 lines), Workshops (425 lines), Evaluator Reports (440 lines) guides created |
| 14 | ✅ Complete | 7 Jan 2026 | Organisation Admin (335 lines), Project Settings (382 lines), Team Members (418 lines), Audit Log (385 lines) guides created |
| 15 | ✅ Complete | 7 Jan 2026 | Navigation (334 lines), Roles & Permissions (387 lines), Workflows (432 lines) guides created |
| 16 | ✅ Complete | 7 Jan 2026 | TECH-SPEC-06 updated (Section 5.6, tool count 36), USER-GUIDE-CONTENT.md created |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⚠️ Blocked

**🎉 Implementation Complete!** All 27 feature guides implemented. Total: ~12,500 lines of documentation.

---

## Executive Summary

This plan adds comprehensive "how-to" documentation to the AI Assistant, transforming it from a data query tool into a full **interactive user guide**. 

**Scope:** 27 feature guides covering all application functionality  
**Approach:** New `getFeatureGuide` tool with structured knowledge base  
**Outcome:** Users can ask "How do I...?" and get step-by-step guidance

---

## Architecture Overview

### Hybrid Knowledge System

1. **Feature Guide Tool** - New `getFeatureGuide` tool retrieves documentation
2. **Knowledge Base** - Structured JS files in `/src/data/feature-guides/`
3. **System Prompt** - Enhanced with routing patterns for how-to questions

### File Structure

```
/api/
  chat.js                    # Add getFeatureGuide tool
  
/src/data/
  feature-guides/
    index.js                 # Guide registry and retrieval
    core/                    # Segment 3-5
    project-management/      # Segment 6-8
    planning/                # Segment 9
    finance/                 # Segment 10
    evaluator/               # Segment 11-13
    admin/                   # Segment 14
    general/                 # Segment 15
```

### Guide Template Structure

Each guide contains:
- `id` - Unique identifier
- `title` - Display name
- `category` - Grouping category
- `description` - Brief overview
- `navigation` - How to access in UI
- `howTo` - Step-by-step instructions for each action
- `fields` - Field reference with descriptions
- `workflow` - Status transitions and actors
- `permissions` - Role-based access
- `faq` - Common questions

---

## Phase 1: Foundation

### Segment 1: Infrastructure Setup
**Estimated Time:** 1.5-2 hours  
**Prerequisites:** None  
**Files to Create/Modify:**
- `/src/data/feature-guides/index.js` (new)
- `/api/chat.js` (modify)

#### Tasks

**1.1 Create Directory Structure**
```bash
mkdir -p src/data/feature-guides/core
mkdir -p src/data/feature-guides/project-management
mkdir -p src/data/feature-guides/planning
mkdir -p src/data/feature-guides/finance
mkdir -p src/data/feature-guides/evaluator
mkdir -p src/data/feature-guides/admin
mkdir -p src/data/feature-guides/general
```

**1.2 Create Guide Registry (`/src/data/feature-guides/index.js`)**

```javascript
// Feature Guide Registry
// Provides guide loading and search functionality

const guideRegistry = {
  // Core guides
  'timesheets': () => import('./core/timesheets.js'),
  'expenses': () => import('./core/expenses.js'),
  'milestones': () => import('./core/milestones.js'),
  'deliverables': () => import('./core/deliverables.js'),
  'resources': () => import('./core/resources.js'),
  
  // Project Management guides
  'variations': () => import('./project-management/variations.js'),
  'raid': () => import('./project-management/raid.js'),
  'quality-standards': () => import('./project-management/quality-standards.js'),
  'kpis': () => import('./project-management/kpis.js'),
  
  // Planning guides
  'wbs-planning': () => import('./planning/wbs-planning.js'),
  'estimator': () => import('./planning/estimator.js'),
  'benchmarking': () => import('./planning/benchmarking.js'),
  
  // Finance guides
  'billing': () => import('./finance/billing.js'),
  'partner-invoices': () => import('./finance/partner-invoices.js'),
  
  // Evaluator guides
  'evaluation-setup': () => import('./evaluator/evaluation-setup.js'),
  'requirements': () => import('./evaluator/requirements.js'),
  'vendors': () => import('./evaluator/vendors.js'),
  'scoring': () => import('./evaluator/scoring.js'),
  'workshops': () => import('./evaluator/workshops.js'),
  'evaluator-reports': () => import('./evaluator/evaluator-reports.js'),
  
  // Admin guides
  'organisation-admin': () => import('./admin/organisation-admin.js'),
  'project-settings': () => import('./admin/project-settings.js'),
  'team-members': () => import('./admin/team-members.js'),
  'audit-log': () => import('./admin/audit-log.js'),
  
  // General guides
  'navigation': () => import('./general/navigation.js'),
  'roles-permissions': () => import('./general/roles-permissions.js'),
  'workflows': () => import('./general/workflows.js'),
};

// Keyword to guide mapping for fuzzy matching
const keywordMapping = {
  'timesheet': 'timesheets',
  'time entry': 'timesheets',
  'hours': 'timesheets',
  'expense': 'expenses',
  'receipt': 'expenses',
  'claim': 'expenses',
  'milestone': 'milestones',
  'phase': 'milestones',
  'deliverable': 'deliverables',
  'work product': 'deliverables',
  'resource': 'resources',
  'team member': 'resources',
  'variation': 'variations',
  'change request': 'variations',
  'risk': 'raid',
  'issue': 'raid',
  'assumption': 'raid',
  'dependency': 'raid',
  'quality': 'quality-standards',
  'compliance': 'quality-standards',
  'kpi': 'kpis',
  'indicator': 'kpis',
  'plan': 'wbs-planning',
  'wbs': 'wbs-planning',
  'breakdown': 'wbs-planning',
  'estimate': 'estimator',
  'cost estimate': 'estimator',
  'rate': 'benchmarking',
  'benchmark': 'benchmarking',
  'sfia': 'benchmarking',
  'billing': 'billing',
  'invoice': 'billing',
  'partner invoice': 'partner-invoices',
  'evaluation': 'evaluation-setup',
  'evaluator': 'evaluation-setup',
  'requirement': 'requirements',
  'vendor': 'vendors',
  'supplier': 'vendors',
  'score': 'scoring',
  'scoring': 'scoring',
  'workshop': 'workshops',
  'report': 'evaluator-reports',
  'organisation': 'organisation-admin',
  'org admin': 'organisation-admin',
  'project setting': 'project-settings',
  'team': 'team-members',
  'user': 'team-members',
  'audit': 'audit-log',
  'log': 'audit-log',
  'navigate': 'navigation',
  'menu': 'navigation',
  'role': 'roles-permissions',
  'permission': 'roles-permissions',
  'workflow': 'workflows',
  'approval': 'workflows',
};

export async function loadGuide(guideId) {
  const loader = guideRegistry[guideId];
  if (!loader) return null;
  
  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    console.error(`Failed to load guide: ${guideId}`, error);
    return null;
  }
}

export function findGuideByKeyword(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  // Direct match
  if (guideRegistry[lowerKeyword]) {
    return lowerKeyword;
  }
  
  // Keyword mapping
  for (const [key, guideId] of Object.entries(keywordMapping)) {
    if (lowerKeyword.includes(key)) {
      return guideId;
    }
  }
  
  return null;
}

export function getAvailableGuides() {
  return Object.keys(guideRegistry);
}

export function getGuidesByCategory() {
  return {
    core: ['timesheets', 'expenses', 'milestones', 'deliverables', 'resources'],
    'project-management': ['variations', 'raid', 'quality-standards', 'kpis'],
    planning: ['wbs-planning', 'estimator', 'benchmarking'],
    finance: ['billing', 'partner-invoices'],
    evaluator: ['evaluation-setup', 'requirements', 'vendors', 'scoring', 'workshops', 'evaluator-reports'],
    admin: ['organisation-admin', 'project-settings', 'team-members', 'audit-log'],
    general: ['navigation', 'roles-permissions', 'workflows'],
  };
}
```

**1.3 Add getFeatureGuide Tool to chat.js**

Add to TOOLS array:
```javascript
{
  name: "getFeatureGuide",
  description: "Get detailed how-to guide for an application feature. Use when users ask how to do something, what fields mean, or how workflows work.",
  input_schema: {
    type: "object",
    properties: {
      feature: {
        type: "string",
        description: "Feature to get guide for (e.g., 'timesheets', 'variations', 'evaluator')"
      },
      section: {
        type: "string",
        enum: ["overview", "howTo", "fields", "workflow", "permissions", "faq", "all"],
        description: "Specific section to retrieve (default: all relevant)"
      },
      action: {
        type: "string",
        enum: ["create", "edit", "delete", "submit", "approve", "view", "configure"],
        description: "Specific action the user wants to perform"
      }
    },
    required: ["feature"]
  }
}
```

**1.4 Add Execution Function**

```javascript
async function executeGetFeatureGuide(params, context) {
  const { feature, section, action } = params;
  
  // Try to find the guide
  let guideId = feature.toLowerCase().replace(/\s+/g, '-');
  
  // Dynamic import from knowledge base
  let guide;
  try {
    const module = await import(`../src/data/feature-guides/${getGuidePath(guideId)}.js`);
    guide = module.default;
  } catch (e) {
    // Try keyword matching
    const matchedGuide = findGuideByKeyword(feature);
    if (matchedGuide) {
      try {
        const module = await import(`../src/data/feature-guides/${getGuidePath(matchedGuide)}.js`);
        guide = module.default;
      } catch (e2) {
        return {
          error: `Guide not found for "${feature}"`,
          availableGuides: getAvailableGuideList(),
          suggestion: "Try asking about: timesheets, expenses, variations, milestones, deliverables, resources, raid, evaluator"
        };
      }
    }
  }
  
  if (!guide) {
    return {
      error: `Guide not found for "${feature}"`,
      availableGuides: getAvailableGuideList()
    };
  }
  
  // Build response based on request
  const response = {
    feature: guide.id,
    title: guide.title,
    category: guide.category
  };
  
  // If specific action requested, return how-to for that action
  if (action && guide.howTo && guide.howTo[action]) {
    response.howTo = guide.howTo[action];
    response.relevantFields = getFieldsForAction(guide.fields, action);
    response.permissions = guide.permissions;
    return response;
  }
  
  // If specific section requested
  if (section && section !== 'all') {
    response[section] = guide[section];
    return response;
  }
  
  // Default: return overview with key sections
  response.description = guide.description;
  response.navigation = guide.navigation;
  response.howTo = guide.howTo;
  response.workflow = guide.workflow;
  response.permissions = guide.permissions?.[context.userContext?.role] || guide.permissions;
  response.faq = guide.faq?.slice(0, 5);
  
  return response;
}

function getGuidePath(guideId) {
  const pathMap = {
    'timesheets': 'core/timesheets',
    'expenses': 'core/expenses',
    'milestones': 'core/milestones',
    'deliverables': 'core/deliverables',
    'resources': 'core/resources',
    'variations': 'project-management/variations',
    'raid': 'project-management/raid',
    'quality-standards': 'project-management/quality-standards',
    'kpis': 'project-management/kpis',
    'wbs-planning': 'planning/wbs-planning',
    'estimator': 'planning/estimator',
    'benchmarking': 'planning/benchmarking',
    'billing': 'finance/billing',
    'partner-invoices': 'finance/partner-invoices',
    'evaluation-setup': 'evaluator/evaluation-setup',
    'requirements': 'evaluator/requirements',
    'vendors': 'evaluator/vendors',
    'scoring': 'evaluator/scoring',
    'workshops': 'evaluator/workshops',
    'evaluator-reports': 'evaluator/evaluator-reports',
    'organisation-admin': 'admin/organisation-admin',
    'project-settings': 'admin/project-settings',
    'team-members': 'admin/team-members',
    'audit-log': 'admin/audit-log',
    'navigation': 'general/navigation',
    'roles-permissions': 'general/roles-permissions',
    'workflows': 'general/workflows',
  };
  return pathMap[guideId] || guideId;
}

function getAvailableGuideList() {
  return [
    'timesheets', 'expenses', 'milestones', 'deliverables', 'resources',
    'variations', 'raid', 'quality-standards', 'kpis',
    'wbs-planning', 'estimator', 'benchmarking',
    'billing', 'partner-invoices',
    'evaluation-setup', 'requirements', 'vendors', 'scoring', 'workshops',
    'organisation-admin', 'project-settings', 'team-members', 'audit-log',
    'navigation', 'roles-permissions', 'workflows'
  ];
}
```

**1.5 Add to Tool Router**

```javascript
case 'getFeatureGuide':
  return await executeGetFeatureGuide(toolInput, context);
```

**1.6 Add to Error Messages**

```javascript
getFeatureGuide: 'retrieve feature guide',
```

#### Segment 1 Checkpoint

Before proceeding to Segment 2, verify:

- [ ] Directory structure created under `/src/data/feature-guides/`
- [ ] `index.js` created with registry and helper functions
- [ ] `getFeatureGuide` tool added to TOOLS array in chat.js
- [ ] `executeGetFeatureGuide` function added to chat.js
- [ ] Tool router updated with new case
- [ ] Error messages updated
- [ ] Code compiles without errors

**Test Command:**
```bash
# Verify directory structure
ls -la src/data/feature-guides/

# Verify tool count increased
grep -c 'name: "get' api/chat.js
# Should be 36 (was 35)
```

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 2**

---

### Segment 2: System Prompt & Placeholder Guide
**Estimated Time:** 1-1.5 hours  
**Prerequisites:** Segment 1 complete  
**Files to Modify:**
- `/api/chat.js` (system prompt)
- `/src/data/feature-guides/core/timesheets.js` (new - placeholder)

#### Tasks

**2.1 Update System Prompt**

Add to buildSystemPrompt function after the capabilities section:

```javascript
prompt += `

## Feature Guide Capability

You have access to detailed how-to guides for all application features. Use the getFeatureGuide tool when users ask:

- "How do I...?" questions
- "What does [field] mean?"
- "What's the workflow for...?"
- "Can I do X with my role?"
- "Where do I find...?"
- "What are the steps to...?"

**Available Feature Guides:**

| Category | Features |
|----------|----------|
| Core | timesheets, expenses, milestones, deliverables, resources |
| Project Management | variations, raid, quality-standards, kpis |
| Planning | wbs-planning, estimator, benchmarking |
| Finance | billing, partner-invoices |
| Evaluator | evaluation-setup, requirements, vendors, scoring, workshops, evaluator-reports |
| Admin | organisation-admin, project-settings, team-members, audit-log |
| General | navigation, roles-permissions, workflows |

**Important:** Always use the getFeatureGuide tool for how-to questions rather than guessing at procedures. The guides contain accurate, up-to-date information about the application.`;
```

**2.2 Create Placeholder Timesheet Guide**

Create `/src/data/feature-guides/core/timesheets.js`:

```javascript
// Timesheet Feature Guide
// Complete how-to documentation for timesheet functionality

const timesheetsGuide = {
  id: 'timesheets',
  title: 'Timesheets',
  category: 'core',
  description: 'Record and submit time worked on project tasks and deliverables.',
  
  navigation: {
    path: '/timesheets',
    sidebar: 'Time & Expenses → Timesheets',
    quickAccess: 'Dashboard → My Draft Timesheets widget'
  },
  
  howTo: {
    create: {
      title: 'Creating a Timesheet Entry',
      steps: [
        'Navigate to the Timesheets page from the sidebar',
        'Click the "New Entry" button in the top right',
        'Select the date the work was performed',
        'Choose the deliverable or task you worked on',
        'Enter the number of hours worked (e.g., 7.5)',
        'Add any notes or description (optional)',
        'Click "Save as Draft" to save for later, or "Submit" to send for validation'
      ],
      tips: [
        'You can use the weekly view to enter multiple days at once',
        'Draft entries can be edited until submitted',
        'Use the calendar picker to quickly navigate to dates'
      ]
    },
    edit: {
      title: 'Editing a Timesheet Entry',
      steps: [
        'Find the entry in your timesheet list',
        'Click the edit icon (pencil) on the row',
        'Make your changes',
        'Click "Save"'
      ],
      tips: [
        'Only Draft entries can be edited',
        'If an entry has been submitted, ask a PM to reject it first'
      ]
    },
    submit: {
      title: 'Submitting Timesheets',
      steps: [
        'Review your draft entries for accuracy',
        'Select the entries you want to submit (or use "Select All")',
        'Click the "Submit Selected" button',
        'Confirm the submission in the dialog'
      ],
      tips: [
        'Once submitted, entries cannot be edited',
        'You will receive a notification when entries are validated or rejected',
        'Submit regularly to ensure timely validation'
      ]
    },
    view: {
      title: 'Viewing Timesheets',
      steps: [
        'Navigate to the Timesheets page',
        'Use filters to narrow down: status, date range, resource',
        'Click on any row to see full details',
        'Use the summary cards at the top for quick totals'
      ],
      tips: [
        'The default view shows your own entries',
        'PMs can see all team entries using the resource filter',
        'Export to CSV for reporting'
      ]
    }
  },
  
  fields: {
    date: {
      name: 'Date',
      required: true,
      description: 'The date the work was performed',
      validation: 'Must be within the project date range and not in the future',
      tips: 'Use the calendar picker for easy selection'
    },
    deliverable_id: {
      name: 'Deliverable',
      required: true,
      description: 'The deliverable or task the time was spent on',
      validation: 'Must be an active deliverable in the current project',
      tips: 'Start typing to search deliverables by name'
    },
    hours_worked: {
      name: 'Hours Worked',
      required: true,
      description: 'Number of hours worked on this date',
      validation: 'Must be between 0.25 and 24 hours. Decimal values allowed.',
      tips: 'Use 0.5 for 30 minutes, 7.5 for 7 hours 30 minutes'
    },
    notes: {
      name: 'Notes',
      required: false,
      description: 'Additional details about the work performed',
      validation: 'Maximum 500 characters',
      tips: 'Helpful for validation and future reference'
    },
    status: {
      name: 'Status',
      required: false,
      description: 'Current validation status of the entry',
      values: ['Draft', 'Submitted', 'Validated', 'Approved', 'Rejected'],
      tips: 'Status is managed by the workflow, not edited directly'
    }
  },
  
  workflow: {
    title: 'Timesheet Approval Workflow',
    description: 'Timesheets follow a validation and approval process before being finalised.',
    statuses: [
      { name: 'Draft', description: 'Entry created but not yet submitted' },
      { name: 'Submitted', description: 'Entry submitted for validation' },
      { name: 'Validated', description: 'Entry validated by Supplier PM' },
      { name: 'Approved', description: 'Entry approved by Customer PM' },
      { name: 'Rejected', description: 'Entry rejected and returned to draft' }
    ],
    transitions: [
      { from: 'Draft', to: 'Submitted', action: 'Submit', actor: 'Creator (any role)' },
      { from: 'Submitted', to: 'Validated', action: 'Validate', actor: 'Supplier PM or Admin' },
      { from: 'Submitted', to: 'Rejected', action: 'Reject', actor: 'Supplier PM or Admin' },
      { from: 'Validated', to: 'Approved', action: 'Approve', actor: 'Customer PM' },
      { from: 'Validated', to: 'Rejected', action: 'Reject', actor: 'Customer PM' },
      { from: 'Rejected', to: 'Draft', action: 'Auto-revert', actor: 'System' }
    ],
    diagram: 'Draft → Submitted → Validated → Approved\n                ↘ Rejected → Draft'
  },
  
  permissions: {
    contributor: {
      canView: 'Own entries only',
      canCreate: true,
      canEdit: 'Own draft entries only',
      canDelete: 'Own draft entries only',
      canSubmit: true,
      canValidate: false,
      canApprove: false
    },
    supplier_pm: {
      canView: 'All entries in project',
      canCreate: true,
      canEdit: 'All draft entries',
      canDelete: 'All draft entries',
      canSubmit: true,
      canValidate: true,
      canApprove: false
    },
    customer_pm: {
      canView: 'All entries in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canValidate: false,
      canApprove: true
    },
    admin: {
      canView: 'All entries in project',
      canCreate: true,
      canEdit: 'All draft entries',
      canDelete: 'All draft entries',
      canSubmit: true,
      canValidate: true,
      canApprove: true
    },
    partner_user: {
      canView: 'Own partner entries only',
      canCreate: true,
      canEdit: 'Own draft entries only',
      canDelete: 'Own draft entries only',
      canSubmit: true,
      canValidate: false,
      canApprove: false
    }
  },
  
  faq: [
    {
      question: 'Can I edit a submitted timesheet?',
      answer: 'No, once submitted, entries cannot be edited. Ask a Supplier PM to reject it back to Draft status, then you can make changes and resubmit.'
    },
    {
      question: 'What happens if my timesheet is rejected?',
      answer: 'The entry returns to Draft status with rejection notes explaining why. Review the notes, make corrections, and resubmit.'
    },
    {
      question: 'Can I submit timesheets for future dates?',
      answer: 'No, you can only record time for dates up to and including today.'
    },
    {
      question: 'How do I see timesheets for my whole team?',
      answer: 'If you have PM or Admin role, use the Resource filter on the Timesheets page to view entries by team member. Contributors can only see their own entries.'
    },
    {
      question: 'What is the difference between Validated and Approved?',
      answer: 'Validated means the Supplier PM has confirmed the entry is accurate. Approved means the Customer PM has signed off on it for billing purposes.'
    },
    {
      question: 'Can I bulk submit multiple timesheet entries?',
      answer: 'Yes, use the checkboxes to select multiple Draft entries, then click "Submit Selected" to submit them all at once.'
    }
  ],
  
  related: ['expenses', 'deliverables', 'resources', 'billing', 'workflows']
};

export default timesheetsGuide;
```

**2.3 Test the Integration**

Start the dev server and test with these questions:
- "How do I create a timesheet?"
- "What's the timesheet approval workflow?"
- "Can I edit a submitted timesheet?"

#### Segment 2 Checkpoint

Before proceeding to Segment 3, verify:

- [ ] System prompt updated with feature guide capability
- [ ] System prompt lists all available guides
- [ ] Timesheets guide created at `/src/data/feature-guides/core/timesheets.js`
- [ ] Guide follows the standard template structure
- [ ] All sections populated: howTo, fields, workflow, permissions, faq
- [ ] Test query "How do I create a timesheet?" returns guide content
- [ ] Test query "What's the timesheet workflow?" returns workflow section

**Test Queries:**
```
"How do I create a timesheet?"
"What does the hours_worked field mean?"
"Can I edit a submitted timesheet?"
"What's the approval workflow for timesheets?"
```

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 3**

---

## Phase 2: Core Features

### Segment 3: Expenses Guide
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 2 complete  
**Files to Create:**
- `/src/data/feature-guides/core/expenses.js`

#### Tasks

**3.1 Create Expenses Guide**

Create `/src/data/feature-guides/core/expenses.js` with:

| Section | Content to Include |
|---------|-------------------|
| **overview** | Purpose, expense categories, chargeable vs non-chargeable |
| **navigation** | Path, sidebar location, dashboard widget |
| **howTo.create** | Steps to create expense claim |
| **howTo.uploadReceipt** | How to attach receipts |
| **howTo.aiScan** | Using AI receipt scanner |
| **howTo.submit** | Submission process |
| **howTo.edit** | Editing draft expenses |
| **howTo.view** | Viewing and filtering |
| **fields** | All fields: date, amount, category, receipt, notes, chargeable |
| **workflow** | Draft → Submitted → Validated → Approved |
| **permissions** | By role |
| **faq** | Receipt requirements, category selection, reimbursement |

**Key Content Points:**
- Categories: Travel, Accommodation, Sustenance, Equipment, Other
- Chargeable to customer flag
- Receipt requirement for amounts over threshold
- AI receipt scanner extracts merchant, amount, date

#### Segment 3 Checkpoint

- [ ] Expenses guide created with all sections
- [ ] AI receipt scanner documented in howTo
- [ ] All expense categories listed
- [ ] Chargeable vs non-chargeable explained
- [ ] Test: "How do I submit an expense?"
- [ ] Test: "How do I use the receipt scanner?"
- [ ] Test: "What expense categories are there?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 4**

---

### Segment 4: Milestones Guide
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 3 complete  
**Files to Create:**
- `/src/data/feature-guides/core/milestones.js`

#### Tasks

**4.1 Create Milestones Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Payment milestones, project phases, budget tracking |
| **navigation** | Path, sidebar, dashboard |
| **howTo.create** | Creating a milestone |
| **howTo.updateStatus** | Changing milestone status |
| **howTo.manageBudget** | Budget and billable amounts |
| **howTo.certificate** | Requesting sign-off certificate |
| **howTo.view** | Viewing milestone details |
| **fields** | name, dates, budget, billable, status, description |
| **workflow** | Not Started → In Progress → Completed |
| **certificateWorkflow** | Unsigned → Requested → Signed |
| **permissions** | By role |
| **faq** | Budget tracking, at-risk status, certificate process |

**Key Content Points:**
- Milestones represent payment points
- Budget vs Billable vs Actual Spend
- Certificate sign-off for customer approval
- At Risk status and automatic detection

#### Segment 4 Checkpoint

- [ ] Milestones guide created with all sections
- [ ] Certificate workflow documented
- [ ] Budget fields explained
- [ ] At Risk status explained
- [ ] Test: "How do I create a milestone?"
- [ ] Test: "What is a milestone certificate?"
- [ ] Test: "How does milestone budget tracking work?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 5**

---

### Segment 5: Deliverables & Resources Guides
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 4 complete  
**Files to Create:**
- `/src/data/feature-guides/core/deliverables.js`
- `/src/data/feature-guides/core/resources.js`

#### Tasks

**5.1 Create Deliverables Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Work products, review process |
| **navigation** | Path, sidebar, milestone detail |
| **howTo.create** | Creating deliverables |
| **howTo.updateStatus** | Status transitions |
| **howTo.submitForReview** | Submission process |
| **howTo.manageTasks** | Adding tasks to deliverables |
| **howTo.view** | Viewing and filtering |
| **fields** | name, milestone, status, dates, tasks |
| **workflow** | Not Started → In Progress → Awaiting Review → Review Complete → Delivered |
| **permissions** | By role |
| **faq** | Review process, task management, linking to milestones |

**5.2 Create Resources Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Team members, partners, user linking |
| **navigation** | Path, sidebar |
| **howTo.add** | Adding team members |
| **howTo.linkUser** | Linking resource to user account |
| **howTo.setRates** | Day rate configuration |
| **howTo.assignPartner** | Partner assignment |
| **howTo.viewAvailability** | Capacity allocation |
| **fields** | name, email, role, rates, partner, availability |
| **permissions** | By role |
| **faq** | Rate visibility, partner access, linking process |

#### Segment 5 Checkpoint

- [ ] Deliverables guide created with all sections
- [ ] Resources guide created with all sections
- [ ] Task management documented in deliverables
- [ ] User linking documented in resources
- [ ] Rate configuration documented
- [ ] Test: "How do I submit a deliverable for review?"
- [ ] Test: "How do I add a team member?"
- [ ] Test: "How do I link a resource to a user?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 6**

---

## Phase 3: Project Management Features

### Segment 6: Variations Guide
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 5 complete  
**Files to Create:**
- `/src/data/feature-guides/project-management/variations.js`

#### Tasks

**6.1 Create Variations Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Change requests, impact tracking, baseline changes |
| **navigation** | Path, sidebar, milestones page |
| **howTo.create** | Creating a variation request |
| **howTo.assessImpact** | Cost/timeline impact entry |
| **howTo.submit** | Submission for approval |
| **howTo.approve** | Approval process (for PMs) |
| **howTo.reject** | Rejection process |
| **howTo.implement** | Marking as implemented |
| **howTo.view** | Viewing variation details |
| **fields** | title, type, description, impact, justification, linked items |
| **types** | Scope Change, Timeline Change, Budget Change, Combined |
| **workflow** | Draft → Submitted → Under Review → Approved/Rejected → Implemented |
| **permissions** | By role |
| **businessRules** | Approval thresholds, required fields |
| **faq** | Impact calculation, rejected variations, baseline updates |

**Key Content Points:**
- Variation types and when to use each
- Cost and timeline impact tracking
- Link to affected milestones/deliverables
- Approval workflow with customer sign-off
- Baseline protection and updates

#### Segment 6 Checkpoint

- [ ] Variations guide created with all sections
- [ ] All variation types documented
- [ ] Impact assessment explained
- [ ] Approval workflow documented
- [ ] Test: "How do I create a variation?"
- [ ] Test: "What's the approval workflow for variations?"
- [ ] Test: "How do I assess the impact of a change request?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 7**

---

### Segment 7: RAID Log Guide
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 6 complete  
**Files to Create:**
- `/src/data/feature-guides/project-management/raid.js`

#### Tasks

**7.1 Create RAID Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Risks, Assumptions, Issues, Dependencies |
| **navigation** | Path, sidebar, dashboard widget |
| **howTo.createRisk** | Creating a risk with probability/impact |
| **howTo.createIssue** | Logging an issue |
| **howTo.createAssumption** | Documenting assumptions |
| **howTo.createDependency** | Tracking dependencies |
| **howTo.mitigate** | Adding mitigation actions |
| **howTo.close** | Closing resolved items |
| **howTo.view** | Viewing and filtering RAID items |
| **fields.risk** | title, description, probability, impact, owner, mitigation |
| **fields.issue** | title, description, priority, owner, resolution |
| **fields.assumption** | title, description, validated |
| **fields.dependency** | title, description, external/internal, status |
| **riskMatrix** | Probability × Impact explanation |
| **workflow** | Open → In Progress → Mitigated/Resolved → Closed |
| **permissions** | By role |
| **faq** | Risk vs Issue, priority levels, ownership |

**Key Content Points:**
- Clear distinction between R/A/I/D
- Risk scoring matrix (Probability × Impact)
- Owner assignment and accountability
- Mitigation vs Resolution actions

#### Segment 7 Checkpoint

- [ ] RAID guide created with all sections
- [ ] All 4 item types documented separately
- [ ] Risk matrix explained
- [ ] Mitigation process documented
- [ ] Test: "How do I log a risk?"
- [ ] Test: "What's the difference between a risk and an issue?"
- [ ] Test: "How do I close a RAID item?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 8**

---

### Segment 8: Quality Standards & KPIs Guides
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 7 complete  
**Files to Create:**
- `/src/data/feature-guides/project-management/quality-standards.js`
- `/src/data/feature-guides/project-management/kpis.js`

#### Tasks

**8.1 Create Quality Standards Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Compliance tracking, network standards |
| **howTo.add** | Adding quality standards |
| **howTo.assess** | Performing assessments |
| **howTo.evidence** | Adding compliance evidence |
| **howTo.view** | Viewing compliance status |
| **fields** | standard, category, status, evidence, assessor, date |
| **statuses** | Not Assessed, Compliant, Partially Compliant, Non-Compliant |
| **permissions** | By role |
| **faq** | Assessment frequency, evidence requirements |

**8.2 Create KPIs Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Key Performance Indicators |
| **howTo.create** | Adding KPIs |
| **howTo.update** | Recording KPI values |
| **howTo.setThresholds** | RAG threshold configuration |
| **howTo.view** | Viewing KPI dashboard |
| **fields** | name, target, actual, thresholds, trend, category |
| **ragStatus** | Red/Amber/Green calculation |
| **permissions** | By role |
| **faq** | Automatic vs manual KPIs, trend calculation |

#### Segment 8 Checkpoint

- [ ] Quality Standards guide created
- [ ] KPIs guide created
- [ ] RAG status calculation explained
- [ ] Assessment workflow documented
- [ ] Test: "How do I assess a quality standard?"
- [ ] Test: "How do I set up a KPI?"
- [ ] Test: "What do the RAG colours mean?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 9**

---

## Phase 4: Planning & Finance

### Segment 9: Planning Tools Guides
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 8 complete  
**Files to Create:**
- `/src/data/feature-guides/planning/wbs-planning.js`
- `/src/data/feature-guides/planning/estimator.js`
- `/src/data/feature-guides/planning/benchmarking.js`

#### Tasks

**9.1 Create WBS Planning Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Work Breakdown Structure, Excel-like grid |
| **howTo.navigate** | Grid navigation, keyboard shortcuts |
| **howTo.addItems** | Creating components, milestones, deliverables, tasks |
| **howTo.hierarchy** | Parent-child relationships, indentation |
| **howTo.aiGenerate** | Using AI to generate structure |
| **howTo.import** | Importing from documents |
| **howTo.baseline** | Creating and protecting baselines |
| **fields** | item_type, name, dates, effort, dependencies |
| **itemTypes** | Component → Milestone → Deliverable → Task |
| **keyboardShortcuts** | Tab, Enter, arrow keys, etc. |
| **permissions** | By role |
| **faq** | Baseline protection, bulk editing, AI generation tips |

**9.2 Create Estimator Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Cost estimation, SFIA 8 skills |
| **howTo.create** | Starting a new estimate |
| **howTo.addResources** | Resource allocation by skill/level |
| **howTo.effortGrid** | Monthly effort entry |
| **howTo.applyRates** | Rate lookup and application |
| **howTo.linkToPlan** | Connecting estimates to plan items |
| **fields** | skill, level, tier, monthly days, rate |
| **sfia8** | Skills framework explanation |
| **tiers** | Contractor, Prime, Mid, SME rates |
| **permissions** | By role |
| **faq** | Rate sources, quantity multipliers |

**9.3 Create Benchmarking Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Day rate benchmarks, SFIA skills |
| **howTo.view** | Browsing rate cards |
| **howTo.filter** | Filtering by skill/level/tier |
| **howTo.export** | Exporting rate data |
| **fields** | skill, level, tier, rate |
| **rateTiers** | Explanation of tier pricing |
| **permissions** | By role (rate visibility) |
| **faq** | Rate updates, custom rates |

#### Segment 9 Checkpoint

- [ ] WBS Planning guide created
- [ ] Estimator guide created
- [ ] Benchmarking guide created
- [ ] AI generation documented
- [ ] SFIA 8 framework explained
- [ ] Test: "How do I use the planning page?"
- [ ] Test: "How do I create a cost estimate?"
- [ ] Test: "What are the SFIA skill levels?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 10**

---

### Segment 10: Finance Guides
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 9 complete  
**Files to Create:**
- `/src/data/feature-guides/finance/billing.js`
- `/src/data/feature-guides/finance/partner-invoices.js`

#### Tasks

**10.1 Create Billing Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Project billing, milestone payments |
| **howTo.viewSummary** | Finance dashboard usage |
| **howTo.milestoneBilling** | Billing against milestones |
| **howTo.viewVariance** | Budget vs actual analysis |
| **fields** | billable, actual, variance, status |
| **permissions** | By role |
| **faq** | Variance explanation, chargeable items |

**10.2 Create Partner Invoices Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Partner billing, invoice management |
| **howTo.create** | Creating partner invoice |
| **howTo.addLineItems** | Invoice line entry |
| **howTo.submit** | Invoice submission |
| **howTo.recordPayment** | Payment recording |
| **howTo.view** | Viewing invoice status |
| **fields** | invoice fields, line item fields |
| **workflow** | Draft → Sent → Paid |
| **statuses** | Draft, Sent, Paid, Overdue, Cancelled |
| **permissions** | By role and partner |
| **faq** | Overdue handling, partial payments |

#### Segment 10 Checkpoint

- [ ] Billing guide created
- [ ] Partner Invoices guide created
- [ ] Invoice workflow documented
- [ ] Payment recording documented
- [ ] Test: "How do I view the budget status?"
- [ ] Test: "How do I create a partner invoice?"
- [ ] Test: "What happens when an invoice is overdue?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 11**

---

## Phase 5: Evaluator Module

### Segment 11: Evaluation Setup Guide
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 10 complete  
**Files to Create:**
- `/src/data/feature-guides/evaluator/evaluation-setup.js`

#### Tasks

**11.1 Create Evaluation Setup Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Software evaluation projects |
| **howTo.create** | New evaluation setup |
| **howTo.configure** | Scoring method, weights, deadlines |
| **howTo.categories** | Requirement categories setup |
| **howTo.stakeholders** | Stakeholder area configuration |
| **howTo.inviteTeam** | Adding evaluation team members |
| **howTo.view** | Evaluation dashboard |
| **fields** | All evaluation settings |
| **scoringMethods** | Weighted, simple, consensus |
| **permissions** | By role |
| **faq** | Evaluation lifecycle, team roles |

#### Segment 11 Checkpoint

- [ ] Evaluation Setup guide created
- [ ] Scoring methods documented
- [ ] Category setup documented
- [ ] Team invitation documented
- [ ] Test: "How do I set up an evaluation?"
- [ ] Test: "What scoring methods are available?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 12**

---

### Segment 12: Requirements & Vendors Guides
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 11 complete  
**Files to Create:**
- `/src/data/feature-guides/evaluator/requirements.js`
- `/src/data/feature-guides/evaluator/vendors.js`

#### Tasks

**12.1 Create Requirements Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Evaluation requirements, MoSCoW prioritisation |
| **howTo.create** | Manual requirement entry |
| **howTo.aiGenerate** | AI requirement suggestions |
| **howTo.import** | Document import |
| **howTo.categorise** | Category assignment |
| **howTo.prioritise** | MoSCoW priority setting |
| **howTo.approve** | Approval workflow |
| **fields** | All requirement fields |
| **moscow** | Must/Should/Could/Won't explanation |
| **workflow** | Draft → Review → Approved |
| **permissions** | By role |
| **faq** | Bulk editing, AI generation tips |

**12.2 Create Vendors Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Vendor management, RFP process |
| **howTo.add** | Vendor entry |
| **howTo.invite** | Vendor portal invitation |
| **howTo.trackResponse** | Response monitoring |
| **howTo.shortlist** | Shortlisting process |
| **howTo.view** | Vendor detail page |
| **fields** | Vendor fields, contact details |
| **portal** | Vendor portal explanation |
| **workflow** | Invited → Responding → Submitted → Shortlisted |
| **permissions** | By role |
| **faq** | Portal access, response tracking |

#### Segment 12 Checkpoint

- [ ] Requirements guide created
- [ ] Vendors guide created
- [ ] MoSCoW prioritisation explained
- [ ] Vendor portal documented
- [ ] AI generation documented
- [ ] Test: "How do I add requirements?"
- [ ] Test: "How do I invite a vendor?"
- [ ] Test: "What is MoSCoW prioritisation?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 13**

---

### Segment 13: Scoring, Workshops & Reports Guides
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 12 complete  
**Files to Create:**
- `/src/data/feature-guides/evaluator/scoring.js`
- `/src/data/feature-guides/evaluator/workshops.js`
- `/src/data/feature-guides/evaluator/evaluator-reports.js`

#### Tasks

**13.1 Create Scoring Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Vendor scoring process |
| **howTo.score** | Individual scoring |
| **howTo.evidence** | Evidence attachment |
| **howTo.consensus** | Consensus scoring workshops |
| **howTo.compare** | Vendor comparison |
| **fields** | score, evidence, confidence |
| **scoringScale** | 0-5 scale explanation |
| **weighting** | Category weight calculation |
| **permissions** | By role |
| **faq** | Score changes, weighted totals |

**13.2 Create Workshops Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Evaluation workshops |
| **howTo.schedule** | Creating workshops |
| **howTo.invite** | Attendee management |
| **howTo.run** | Workshop facilitation |
| **howTo.record** | Recording outcomes |
| **fields** | Workshop fields |
| **types** | Scoring, Demo, Consensus workshops |
| **permissions** | By role |
| **faq** | Scheduling tips, attendance tracking |

**13.3 Create Evaluator Reports Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Evaluation reporting |
| **howTo.generate** | Report generation |
| **howTo.customise** | Report customisation |
| **howTo.export** | PDF/Word export |
| **reportTypes** | Summary, detailed, comparison |
| **permissions** | By role |
| **faq** | Report distribution |

#### Segment 13 Checkpoint

- [ ] Scoring guide created
- [ ] Workshops guide created
- [ ] Evaluator Reports guide created
- [ ] Scoring scale documented
- [ ] Consensus process documented
- [ ] Test: "How do I score a vendor?"
- [ ] Test: "How do I schedule a workshop?"
- [ ] Test: "How do I generate an evaluation report?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 14**

---

## Phase 6: Administration

### Segment 14: Admin Guides
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 13 complete  
**Files to Create:**
- `/src/data/feature-guides/admin/organisation-admin.js`
- `/src/data/feature-guides/admin/project-settings.js`
- `/src/data/feature-guides/admin/team-members.js`
- `/src/data/feature-guides/admin/audit-log.js`

#### Tasks

**14.1 Create Organisation Admin Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Organisation management |
| **howTo.create** | Organisation creation |
| **howTo.invite** | Member invitation |
| **howTo.manageRoles** | Role assignment |
| **howTo.settings** | Organisation settings |
| **fields** | Organisation fields |
| **orgRoles** | Org admin, member, viewer |
| **permissions** | By org role |
| **faq** | Multi-org membership |

**14.2 Create Project Settings Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Project configuration |
| **howTo.configure** | Basic settings |
| **howTo.dates** | Date range setup |
| **howTo.budget** | Budget configuration |
| **howTo.categories** | Category customisation |
| **fields** | All project settings |
| **permissions** | By role |
| **faq** | Settings impact |

**14.3 Create Team Members Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Project team management |
| **howTo.add** | Adding team members |
| **howTo.setRole** | Project role assignment |
| **howTo.remove** | Removing members |
| **projectRoles** | All roles explained |
| **permissions** | By role |
| **faq** | Role changes, access control |

**14.4 Create Audit Log Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Activity tracking |
| **howTo.view** | Browsing audit log |
| **howTo.filter** | Filtering by action/user/date |
| **howTo.export** | Log export |
| **fields** | action, entity, user, timestamp |
| **permissions** | Admin only |
| **faq** | Retention, data tracked |

#### Segment 14 Checkpoint

- [ ] Organisation Admin guide created
- [ ] Project Settings guide created
- [ ] Team Members guide created
- [ ] Audit Log guide created
- [ ] All project roles documented
- [ ] Test: "How do I invite someone to my organisation?"
- [ ] Test: "How do I change project settings?"
- [ ] Test: "How do I view the audit log?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 15**

---

### Segment 15: General Guides
**Estimated Time:** 1.5 hours  
**Prerequisites:** Segment 14 complete  
**Files to Create:**
- `/src/data/feature-guides/general/navigation.js`
- `/src/data/feature-guides/general/roles-permissions.js`
- `/src/data/feature-guides/general/workflows.js`

#### Tasks

**15.1 Create Navigation Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Application navigation |
| **sidebar** | All sidebar sections and links |
| **header** | Project switcher, user menu, notifications |
| **keyboard** | Keyboard shortcuts |
| **mobile** | Mobile navigation |
| **search** | Global search functionality |

**15.2 Create Roles & Permissions Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Role-based access control |
| **roles** | All roles with descriptions |
| **permissionMatrix** | What each role can do |
| **dataVisibility** | What each role can see |
| **faq** | Role requests, escalation |

**15.3 Create Workflows Guide**

| Section | Content to Include |
|---------|-------------------|
| **overview** | Approval workflows |
| **timesheetFlow** | Full workflow diagram |
| **expenseFlow** | Full workflow diagram |
| **variationFlow** | Full workflow diagram |
| **deliverableFlow** | Full workflow diagram |
| **milestoneCertFlow** | Certificate workflow |
| **notifications** | Workflow notifications |

#### Segment 15 Checkpoint

- [ ] Navigation guide created
- [ ] Roles & Permissions guide created
- [ ] Workflows guide created
- [ ] All workflows documented with diagrams
- [ ] Complete permission matrix included
- [ ] Test: "How do I navigate the app?"
- [ ] Test: "What can a contributor do?"
- [ ] Test: "What's the expense approval workflow?"

**⏸️ STOP HERE - Update progress tracker and confirm before proceeding to Segment 16**

---

## Phase 7: Testing & Documentation

### Segment 16: Final Integration & Documentation
**Estimated Time:** 2 hours  
**Prerequisites:** Segment 15 complete  
**Files to Modify:**
- `/docs/TECH-SPEC-06-API-AI.md`
- `/docs/TECH-SPEC-07-Frontend-State.md`
- `/docs/USER-GUIDE-CONTENT.md` (new)

#### Tasks

**16.1 Comprehensive Testing**

Test each guide with sample questions:

| Guide | Test Questions |
|-------|----------------|
| timesheets | "How do I create a timesheet?", "What's the approval workflow?" |
| expenses | "How do I scan a receipt?", "What categories are available?" |
| milestones | "How do I request a certificate?", "What is 'at risk' status?" |
| deliverables | "How do I submit for review?", "How do I add tasks?" |
| resources | "How do I link a user?", "How do I set rates?" |
| variations | "How do I create a change request?", "What's the approval process?" |
| raid | "How do I log a risk?", "What's the difference between risk and issue?" |
| quality-standards | "How do I assess compliance?", "What evidence is needed?" |
| kpis | "How do I set up a KPI?", "What are RAG thresholds?" |
| wbs-planning | "How do I use the planning grid?", "How does AI generation work?" |
| estimator | "How do I create an estimate?", "What are SFIA levels?" |
| benchmarking | "What are the rate tiers?", "How do I view rates?" |
| billing | "How do I view budget status?", "What is variance?" |
| partner-invoices | "How do I create an invoice?", "How do I record payment?" |
| evaluation-setup | "How do I start an evaluation?", "What scoring methods exist?" |
| requirements | "How do I add requirements?", "What is MoSCoW?" |
| vendors | "How do I invite a vendor?", "How does the portal work?" |
| scoring | "How do I score vendors?", "How is weighting calculated?" |
| workshops | "How do I schedule a workshop?", "What types are there?" |
| evaluator-reports | "How do I generate a report?", "What report types exist?" |
| organisation-admin | "How do I invite members?", "How do I manage roles?" |
| project-settings | "How do I change settings?", "What settings are available?" |
| team-members | "How do I add team members?", "How do I change roles?" |
| audit-log | "How do I view the audit log?", "What is tracked?" |
| navigation | "How do I navigate the app?", "What are the keyboard shortcuts?" |
| roles-permissions | "What can I do with my role?", "What are the different roles?" |
| workflows | "What's the timesheet workflow?", "How do approvals work?" |

**16.2 Update Technical Documentation**

Update TECH-SPEC-06-API-AI.md:
- Add getFeatureGuide to tool catalog
- Document guide retrieval mechanism
- Add section on feature guide system

Update TECH-SPEC-07-Frontend-State.md:
- Document feature-guides data structure
- Add guide loading patterns

**16.3 Create USER-GUIDE-CONTENT.md**

Create a human-readable master reference document containing all guide content for:
- Manual reference
- Future maintenance
- Non-AI documentation needs

#### Segment 16 Checkpoint

- [ ] All 27 guides tested with sample questions
- [ ] Cross-feature questions tested
- [ ] Role-specific responses verified
- [ ] TECH-SPEC-06-API-AI.md updated
- [ ] TECH-SPEC-07-Frontend-State.md updated
- [ ] USER-GUIDE-CONTENT.md created
- [ ] Progress tracker shows all segments complete

**✅ IMPLEMENTATION COMPLETE**

---

## Appendix A: Complete Guide List

| # | Guide ID | Category | File Path |
|---|----------|----------|-----------|
| 1 | timesheets | core | core/timesheets.js |
| 2 | expenses | core | core/expenses.js |
| 3 | milestones | core | core/milestones.js |
| 4 | deliverables | core | core/deliverables.js |
| 5 | resources | core | core/resources.js |
| 6 | variations | project-management | project-management/variations.js |
| 7 | raid | project-management | project-management/raid.js |
| 8 | quality-standards | project-management | project-management/quality-standards.js |
| 9 | kpis | project-management | project-management/kpis.js |
| 10 | wbs-planning | planning | planning/wbs-planning.js |
| 11 | estimator | planning | planning/estimator.js |
| 12 | benchmarking | planning | planning/benchmarking.js |
| 13 | billing | finance | finance/billing.js |
| 14 | partner-invoices | finance | finance/partner-invoices.js |
| 15 | evaluation-setup | evaluator | evaluator/evaluation-setup.js |
| 16 | requirements | evaluator | evaluator/requirements.js |
| 17 | vendors | evaluator | evaluator/vendors.js |
| 18 | scoring | evaluator | evaluator/scoring.js |
| 19 | workshops | evaluator | evaluator/workshops.js |
| 20 | evaluator-reports | evaluator | evaluator/evaluator-reports.js |
| 21 | organisation-admin | admin | admin/organisation-admin.js |
| 22 | project-settings | admin | admin/project-settings.js |
| 23 | team-members | admin | admin/team-members.js |
| 24 | audit-log | admin | admin/audit-log.js |
| 25 | navigation | general | general/navigation.js |
| 26 | roles-permissions | general | general/roles-permissions.js |
| 27 | workflows | general | general/workflows.js |

---

## Appendix B: Question Routing Patterns

Add to system prompt or detection logic:

```javascript
const HOW_TO_PATTERNS = [
  /how (do|can|to|would) (i|we|you)/i,
  /what('s| is| are) the (steps|process|workflow|procedure)/i,
  /how does .* work/i,
  /can (i|you|we) .* (create|add|edit|delete|submit|approve)/i,
  /what (does|is|are) .* (field|mean|for)/i,
  /explain .* (feature|process|workflow)/i,
  /guide (me|to|for)/i,
  /help (me|with) .* (create|add|submit)/i,
  /where (do|can) i (find|access|go)/i,
  /what (permissions|access|role)/i,
  /walk me through/i,
  /show me how/i,
  /what are the requirements for/i,
];
```

---

## Appendix C: Session Planning

Recommended session breakdown:

| Session | Segments | Duration | Focus |
|---------|----------|----------|-------|
| 1 | 1-2 | 2-3 hours | Foundation + first guide |
| 2 | 3-5 | 3-4 hours | Core features |
| 3 | 6-8 | 3-4 hours | Project management |
| 4 | 9-10 | 2-3 hours | Planning & finance |
| 5 | 11-13 | 3-4 hours | Evaluator module |
| 6 | 14-15 | 2-3 hours | Admin & general |
| 7 | 16 | 2 hours | Testing & documentation |

---

*Plan Version: 1.1*  
*Last Updated: 7 January 2026*  
*Ready for implementation*
