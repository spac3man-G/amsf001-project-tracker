# AMSF001 Technical Specification - API Layer & AI Integration

**Version:** 1.9
**Last Updated:** 17 January 2026
**Session:** 1.9.0
**Status:** Complete

> **Version 1.9 Updates (17 January 2026):**
> - AI Action Framework (Phase 1): Chat assistant can now execute actions, not just query
> - New action tools: 13 tools for submitting, updating, completing, and reassigning items
> - Confirmation workflow: All actions require explicit user confirmation before execution
> - Permission enforcement: Server-side validation of user permissions for each action
> - Files added: api/lib/ai-actions.js, api/lib/ai-action-schemas.js
> - Chat API upgraded to v4.0 with action detection and execution
> - Tool count increased from 36 to 49 (36 query + 13 action tools)

> **Version 1.8 Updates (17 January 2026):**
> - AI Enablement: Added 9 new AI endpoints for proactive intelligence
> - AI Enablement: Added Section 11: AI Enablement Services
> - Endpoints: ai-raid-categorize, ai-approval-assist, ai-anomaly-detect
> - Endpoints: ai-deliverable-assess, ai-variation-impact, ai-document-generate
> - Endpoints: ai-forecast, ai-schedule-risk, ai-portfolio-insights
> - Model routing: Opus 4.5 for complex reasoning, Sonnet 4.5 for classification
> - Design principle: AI advises, human decides (advisory-only, no auto-execution)

> **Version 1.7 Updates (7 January 2026):**
> - Chat AI: Added getFeatureGuide tool (tool count now 36)
> - Chat AI: Added Section 5.6 Feature Guide System documentation
> - Feature Guides: 27 guides implemented (~12,500 lines of documentation)
> - Feature Guides: Covers all application features with how-to instructions
> - Feature Guides: Includes workflows, permissions, FAQs for each feature

> **Version 1.6 Updates (7 January 2026):**
> - Chat AI: Expanded tool catalog from 12 to 35 tools (now 36 with getFeatureGuide)
> - Chat AI: Added RAID, Quality Standards, Planning, Estimator, Variations tools
> - Chat AI: Added Partner/Invoice, Resource Availability tools
> - Chat AI: Added Evaluator module query tools (6 tools)
> - Chat AI: Added Admin tools (getAuditLog, getOrganisationSummary)
> - Chat AI: Updated system prompt with comprehensive feature coverage
> - Chat AI: Pre-fetch context now includes RAID and Quality Standards summaries
> - Chat AI: Enhanced page-specific suggestions (30+ pages)

> **Version 1.5 Updates (7 January 2026):**
> - Added reference to TECH-SPEC-11-Evaluator.md for comprehensive Evaluator module documentation
> - Added Section 10: Evaluator API Endpoints (summary with cross-reference)
> - Added missing endpoints to Section 2.1: `/api/manage-project-users`, `/api/report-ai`
> - Updated endpoint summary table with all Evaluator endpoints

> **Version 1.4 Updates (6 January 2026):**
> - Planning AI: Upgraded from Claude Sonnet 4.5 to Claude Opus 4
> - Planning AI: Increased MAX_TOKENS from 8192 to 16384
> - Planning AI: Increased timeout from 120s to 300s (vercel.json)
> - Planning AI: Added `component` item type to tool schemas
> - Planning AI: Added `tool_choice` forcing to prevent text-only responses
> - Updated tool name from `generateProjectStructure` to `generate_wbs`

> **Version 1.3 Updates (28 December 2025):**
> - Added `/api/planning-ai` endpoint (AI-powered WBS generation)
> - Added Section 6.7: Planning AI API
> - Updated endpoint summary table
> - Updated architecture diagram  

> **Version 1.2 Updates (24 December 2025):**
> - Added `/api/create-organisation` endpoint (self-service org creation)
> - Added Section 6.6: Organisation Creation API
> - Updated endpoint summary table

> **Version 1.1 Updates (23 December 2025):**
> - Added `/api/create-project` endpoint (org-aware project creation)
> - Added Section 6.5: Project Creation API
> - Added Document History section

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Endpoint Reference](#2-api-endpoint-reference)
3. [Chat Assistant Architecture](#3-chat-assistant-architecture)
4. [Claude AI Integration](#4-claude-ai-integration)
5. [Tool System](#5-tool-system)
6. [User Management API](#6-user-management-api)
7. [Receipt Scanner API](#7-receipt-scanner-api)
8. [Security & Configuration](#8-security--configuration)
9. [Deployment & Monitoring](#9-deployment--monitoring)
10. [Evaluator API Endpoints](#10-evaluator-api-endpoints)
11. [AI Enablement Services](#11-ai-enablement-services)
12. [AI Action Framework](#12-ai-action-framework)

---

## 1. Overview

### 1.1 API Architecture

The AMSF001 Project Tracker uses **Vercel Edge Functions** for its serverless API layer. These functions provide:

- AI-powered chat assistant with database query capabilities
- Receipt scanning with Claude Vision
- Administrative user creation
- Context pre-fetching for instant responses

**Key Characteristics:**
- **Runtime:** Vercel Edge (globally distributed, low latency)
- **External Services:** Anthropic Claude API, Supabase
- **Authentication:** JWT tokens via Supabase Auth + Service Role Key for admin operations
- **Data Access:** Supabase client with Service Role Key (bypasses RLS for server-side operations)

### 1.2 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Serverless Runtime | Vercel Edge Functions | API hosting |
| AI Provider | Anthropic Claude API | Chat, vision, analysis |
| Database | Supabase PostgreSQL | Data storage |
| Authentication | Supabase Auth + JWT | User verification |
| Deployment | Vercel | CI/CD and hosting |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ChatWidget.jsx  │  ExpenseForm.jsx  │  Admin Pages             │
└────────┬─────────┴────────┬──────────┴─────────┬───────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Functions                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  /api/chat      │  /api/scan-     │  /api/create-user           │
│  /api/chat-     │  receipt        │                             │
│  stream         │                 │                             │
│  /api/chat-     │                 │                             │
│  context        │                 │                             │
└────────┬────────┴────────┬────────┴─────────────┬───────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────┐  ┌──────────────┐  ┌───────────────────────────┐
│  Anthropic API  │  │  Anthropic   │  │     Supabase Auth         │
│  (Claude 4.5)   │  │  Vision API  │  │     Service Role          │
└────────┬────────┘  └──────────────┘  └─────────────┬─────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                           │
│                    (via Service Role Key)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Reference

### 2.1 Endpoint Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/chat` | POST | AI chat with tool execution | Yes (JWT) |
| `/api/chat` | GET | Usage statistics (admin) | Admin Key |
| `/api/chat-stream` | POST | Streaming chat (Haiku) | Yes (JWT) |
| `/api/chat-context` | POST | Pre-fetch project context | Yes (JWT) |
| `/api/create-user` | POST | Create new user accounts | Admin JWT |
| `/api/create-project` | POST | Create project (org-aware) | Admin/Org Admin JWT |
| `/api/create-organisation` | POST | Create new organisation | Yes (JWT) |
| `/api/manage-project-users` | POST | Manage project team membership | Admin/Org Admin JWT |
| `/api/planning-ai` | POST | AI-powered WBS generation | Yes (JWT) |
| `/api/report-ai` | POST | AI report generation | Yes (JWT) |
| `/api/scan-receipt` | POST | AI receipt scanning | Yes (JWT) |
| `/api/evaluator/*` | Various | Evaluator module endpoints | Yes (JWT) |
| `/api/ai-raid-categorize` | POST | Auto-categorize RAID items | Yes (JWT) |
| `/api/ai-approval-assist` | POST | Approval recommendations | Yes (JWT) |
| `/api/ai-anomaly-detect` | POST | Detect data anomalies | Yes (JWT) |
| `/api/ai-deliverable-assess` | POST | Quality assessment | Yes (JWT) |
| `/api/ai-variation-impact` | POST | Change impact analysis | Yes (JWT) |
| `/api/ai-document-generate` | POST | Document generation | Yes (JWT) |
| `/api/ai-forecast` | POST | Project forecasting | Yes (JWT) |
| `/api/ai-schedule-risk` | POST | Schedule risk prediction | Yes (JWT) |
| `/api/ai-portfolio-insights` | POST | Portfolio intelligence | Org Admin JWT |

### 2.2 Vercel Routing Configuration

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

All `/api/*` routes are handled by Edge Functions. All other routes serve the React SPA.

---

## 3. Chat Assistant Architecture

### 3.1 System Design

The chat assistant implements a **hybrid architecture** with three response paths:

```
User Query
    │
    ▼
┌─────────────────┐
│ Query Analysis  │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌──────┐  ┌────────┐  ┌──────────────┐
│LOCAL │  │STREAMING│  │ STANDARD API │
│ PATH │  │  PATH  │  │    PATH      │
└──┬───┘  └───┬────┘  └──────┬───────┘
   │          │              │
   │          │              ▼
   │          │       ┌──────────────┐
   │          │       │  Claude API  │
   │          │       │  + Tools     │
   │          │       └──────┬───────┘
   │          │              │
   │          ▼              │
   │   ┌──────────────┐      │
   │   │ Chat-Stream  │      │
   │   │   (Haiku)    │      │
   │   └──────┬───────┘      │
   │          │              │
   ▼          ▼              ▼
┌─────────────────────────────────────┐
│         Response to User            │
└─────────────────────────────────────┘
```

### 3.2 Response Path Selection

**1. Local Path (Instant, No API Call)**
- Uses pre-fetched context from `/api/chat-context`
- Patterns: Budget summaries, milestone counts, pending actions
- Response time: ~100ms

**2. Streaming Path (Haiku via `/api/chat-stream`)**
- For simple queries answerable from pre-fetched context
- Streams response for better UX
- Model: Claude Haiku 4.5

**3. Standard API Path (`/api/chat`)**
- For complex queries requiring database tools
- Model: Claude Sonnet 4.5
- Supports tool execution loop (up to 5 iterations)

### 3.3 Context Pre-fetching

When chat opens, `/api/chat-context` is called to load project summary data:

```javascript
// Pre-fetched context structure
{
  budgetSummary: {
    projectBudget: 250000,
    milestoneBillable: 200000,
    actualSpend: 150000,
    variance: 50000,
    percentUsed: 75
  },
  milestoneSummary: {
    total: 10,
    byStatus: { completed: 4, inProgress: 3, notStarted: 2, atRisk: 1 }
  },
  deliverableSummary: {
    total: 25,
    byStatus: { delivered: 10, reviewComplete: 5, awaitingReview: 3, inProgress: 7 }
  },
  timesheetSummary: {
    totalEntries: 150,
    totalHours: 1200,
    byStatus: { submitted: 20, validated: 130 }
  },
  expenseSummary: {
    totalAmount: 15000,
    chargeableAmount: 12000,
    nonChargeableAmount: 3000
  },
  raidSummary: {
    total: 12,
    openRisks: 3,
    openIssues: 2,
    highPriority: 2,
    byType: { Risk: 5, Issue: 4, Assumption: 2, Dependency: 1 }
  },
  qualityStandardsSummary: {
    total: 8,
    compliant: 5,
    partiallyCompliant: 2,
    nonCompliant: 1,
    notAssessed: 0,
    needsAttention: 3,
    complianceRate: 63
  },
  pendingActions: {
    draftTimesheets: 3,
    awaitingValidation: 5
  }
}
```

### 3.4 Request/Response Flow

**Chat Request (POST /api/chat):**

```json
{
  "messages": [
    { "role": "user", "content": "Show my timesheets this week" }
  ],
  "userContext": {
    "name": "John Smith",
    "email": "john@example.com",
    "role": "contributor",
    "linkedResourceId": "uuid-here",
    "partnerId": "uuid-here"
  },
  "projectContext": {
    "id": "uuid-here",
    "reference": "AMSF001",
    "name": "My Project"
  },
  "projectId": "uuid-here",
  "prefetchedContext": { ... }
}
```

**Chat Response:**

```json
{
  "message": "Here are your timesheets for this week...",
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 450
  },
  "toolsUsed": true,
  "cached": false,
  "model": "sonnet"
}
```

### 3.5 Streaming Response Flow

For Haiku-eligible queries, the streaming endpoint provides real-time text updates:

```javascript
// Client-side streaming consumption
const response = await fetch('/api/chat-stream', {
  method: 'POST',
  body: JSON.stringify({ messages, userContext, projectContext, prefetchedContext })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = new TextDecoder().decode(value);
  updateUI(chunk); // Progressively update UI
}
```

---

## 4. Claude AI Integration

### 4.1 Model Selection & Routing

The system uses **intelligent model routing** to optimize cost and performance:

| Model | Use Case | Pricing (per 1M tokens) |
|-------|----------|-------------------------|
| Claude Haiku 4.5 | Simple queries from pre-fetched context | $0.25 input / $1.25 output |
| Claude Sonnet 4.5 | Complex queries requiring tool use | $3.00 input / $15.00 output |

**Model Selection Logic:**

```javascript
// Keywords suggesting simple queries (Haiku-eligible)
const SIMPLE_QUERY_PATTERNS = [
  /budget|spend|cost|variance/i,
  /milestone.*(status|progress|summary|count)/i,
  /deliverable.*(status|progress|summary|count)/i,
  /pending|action|todo|what.*(do|need)/i,
  /overview|summary|status|dashboard/i,
];

// Keywords requiring Sonnet + tools
const COMPLEX_QUERY_PATTERNS = [
  /specific|detail|list|show me|find|search/i,
  /filter|between|from|to|date|week|month/i,
  /resource|person|team member|who/i,
  /compare|versus|vs/i,
  /\d+/,  // Contains numbers (specific queries)
];
```

### 4.2 System Prompt Structure

The system prompt is dynamically constructed with:

1. **Role Definition** - AI assistant capabilities
2. **User Context** - Name, email, role, partner association
3. **Project Context** - Current project details
4. **Pre-fetched Data** - Budget, milestones, timesheets summary
5. **Response Guidelines** - UK date format, GBP currency, etc.

**System Prompt Template (Sonnet):**

```
You are an AI assistant for the AMSF001 Project Tracker application...

## Current Context
- User: {name} ({email})
- Project: {project_name} ({project_reference})
- Role on this project: {role}
- Linked Resource: {resource_name}
- Partner: {partner_name}

## Pre-loaded Data (use directly without tool calls when possible)
### Budget Summary
- Project Budget: £{budget}
- Actual Spend: £{spend}
...

## Response Guidelines
1. Be concise and helpful
2. Use UK date format (DD/MM/YYYY) and GBP currency (£)
3. If pre-loaded data can answer, use it directly
4. Only use tools for specific details not in pre-loaded data
...
```

### 4.3 Token Usage Tracking

The system implements comprehensive token tracking for cost monitoring:

```javascript
// In-memory usage stats
const usageStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  estimatedCostUSD: 0,
  haikuRequests: 0,
  sonnetRequests: 0,
  startedAt: new Date().toISOString(),
  recentRequests: [], // Last 100 requests
};

function logTokenUsage(usage, userId, toolsUsed, model) {
  const costs = TOKEN_COSTS[model];
  const costUSD = (usage.input_tokens * costs.input / 1000000) + 
                  (usage.output_tokens * costs.output / 1000000);
  // Update stats...
}
```

**Cost Estimation Formula:**
```
Cost = (input_tokens × input_rate / 1,000,000) + (output_tokens × output_rate / 1,000,000)
```

### 4.4 Error Handling & Fallbacks

```javascript
// User-friendly error messages
const ERROR_MESSAGES = {
  'PGRST116': 'No matching records found for your query.',
  'PGRST301': 'Database connection issue. Please try again.',
  '42501': 'You do not have permission to access this data.',
  'timeout': 'The database query took too long. Try a more specific search.',
  'rate_limit': 'Too many requests. Please wait a moment.',
};
```

**Fallback Strategy:**
1. If Haiku streaming fails → Fall back to Sonnet
2. If tool execution fails → Return partial data with error note
3. If all retries exhausted → Return user-friendly error message

---

## 5. Tool System

### 5.1 Tool Catalog

The chat assistant has access to **36 database query tools** organised by functional area:

#### Core Tools (User & Permissions)
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getUserProfile` | Get current user's profile | None |
| `getMyPendingActions` | Get items requiring user's attention | None |
| `getRolePermissions` | Explain role capabilities | `role?` |

#### Time & Expense Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getTimesheets` | Query timesheet entries | `status`, `dateRange`, `resourceName`, `mine` |
| `getTimesheetSummary` | Aggregated timesheet stats | `groupBy`, `dateRange` |
| `getExpenses` | Query expense entries | `status`, `dateRange`, `category`, `chargeableOnly`, `mine` |
| `getExpenseSummary` | Aggregated expense stats | `groupBy`, `dateRange` |

#### Project Progress Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getMilestones` | Get project milestones | `status`, `overdueOnly` |
| `getDeliverables` | Get project deliverables | `status`, `milestoneName` |
| `getDeliverableTasks` | Get tasks within deliverables | `deliverableId`, `status` |
| `getMilestoneCertificates` | Get milestone sign-off certificates | `milestoneId`, `status` |
| `getBudgetSummary` | Budget vs actual comparison | `groupBy` |

#### Resource & Team Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getResources` | Get team members | `partnerName` |
| `getResourceAvailability` | Query resource capacity allocation | `resourceId`, `dateRange`, `availableOnly` |
| `getKPIs` | Get KPI data | `category` |

#### RAID & Quality Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getRaidItems` | Query RAID log entries | `type`, `status`, `priority`, `ownerId` |
| `getRaidSummary` | Aggregated RAID statistics | None |
| `getQualityStandards` | Query quality standards | `status`, `category` |
| `getQualityStandardsSummary` | Aggregated quality stats | None |

#### Planning & Estimation Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getPlanItems` | Query WBS plan items | `itemType`, `parentId`, `milestoneId`, `search` |
| `getPlanSummary` | Aggregated plan statistics | None |
| `getEstimates` | Query cost estimates | `estimateId`, `status` |
| `getBenchmarkRates` | Query SFIA benchmark rates | `skill`, `level`, `tier` |

#### Change Control Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getVariations` | Query change requests | `status`, `type`, `dateRange` |
| `getVariationsSummary` | Aggregated variation statistics | None |

#### Partner & Finance Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getPartners` | Query partners | `status` |
| `getPartnerInvoices` | Query partner invoices | `partnerId`, `status`, `dateRange` |

#### Evaluator Module Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getEvaluationProjects` | Query evaluation projects | `status` |
| `getRequirements` | Query evaluation requirements | `evaluationId`, `priority`, `status`, `categoryId` |
| `getVendors` | Query vendors in evaluation | `evaluationId`, `status` |
| `getScores` | Query vendor scores | `evaluationId`, `vendorId`, `requirementId`, `consensusOnly` |
| `getWorkshops` | Query evaluation workshops | `evaluationId`, `status` |
| `getStakeholderAreas` | Query stakeholder areas | `evaluationId` |

#### Admin Tools (Restricted)
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getAuditLog` | Query audit log entries (admin only) | `action`, `entityType`, `userId`, `dateRange` |
| `getOrganisationSummary` | Get organisation overview (admin/PM only) | None |

#### Feature Guide Tools
| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getFeatureGuide` | Retrieve how-to documentation for application features | `guideId`, `keyword` |

> **Note:** The `getFeatureGuide` tool retrieves structured documentation from 27 feature guides covering all application functionality. Guides are stored in `/src/data/feature-guides/` and include step-by-step instructions, field references, workflow diagrams, and FAQs. See Section 5.6 for details.

### 5.2 Tool Definition Schema

```javascript
const TOOLS = [
  {
    name: "getTimesheets",
    description: "Query timesheet entries. Returns list with dates, hours, resources...",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Draft", "Submitted", "Validated", "Approved", "Rejected", "all"],
          description: "Filter by validation status"
        },
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"]
        },
        resourceName: {
          type: "string",
          description: "Filter by resource name (partial match)"
        },
        mine: {
          type: "boolean",
          description: "Only return current user's timesheets"
        }
      },
      required: []
    }
  },
  // ... other tools
];
```

### 5.3 Tool Execution Pattern

```javascript
async function executeTool(toolName, toolInput, context) {
  // 1. Check cache first
  const cacheKey = getCacheKey(toolName, toolInput, context);
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  // 2. Execute with timeout and retry
  const result = await withTimeout(
    withRetry(() => executeToolOperation(toolName, toolInput, context), toolName),
    QUERY_TIMEOUT_MS,
    toolName
  );

  // 3. Cache successful results
  setCachedResponse(cacheKey, result);
  
  return result;
}
```

**Parallel Tool Execution:**

When Claude requests multiple tools, they are executed in parallel:

```javascript
// Execute ALL tools in PARALLEL
const toolPromises = toolUseBlocks.map(async (toolUse) => {
  try {
    const result = await executeTool(toolUse.name, toolUse.input, context);
    return { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) };
  } catch (error) {
    return { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: '...' }) };
  }
});

const toolResults = await Promise.all(toolPromises);
```

### 5.4 Permission Scoping in Tools

Each tool automatically applies permission scoping based on user role:

```javascript
async function executeGetTimesheets(params, context) {
  let query = supabase.from('timesheets').select('...');
  
  // Permission scoping
  if (context.userContext.role === 'contributor' && context.userContext.linkedResourceId) {
    // Contributors only see their own
    query = query.eq('resource_id', context.userContext.linkedResourceId);
  } else if (['partner_user', 'partner_admin'].includes(context.userContext.role)) {
    // Partner users only see their partner's data
    query = query.eq('resources.partner_id', context.userContext.partnerId);
  }
  // Admin, supplier_pm, customer_pm see all
  
  // Apply filters...
  return query;
}
```

### 5.5 Response Caching

Cacheable tools (read-only queries) are cached for 5 minutes:

```javascript
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cacheableTools = [
  'getUserProfile', 
  'getRolePermissions', 
  'getMilestones', 
  'getResources',
  'getDeliverables',
  'getKPIs',
  'getBudgetSummary'
];
```

### 5.6 Feature Guide System

The `getFeatureGuide` tool provides structured "how-to" documentation for all application features, transforming the AI assistant into an interactive user guide.

#### Guide Architecture

```
/src/data/feature-guides/
├── index.js                    # Registry and search functions
├── core/                       # 5 guides: timesheets, expenses, milestones, deliverables, resources
├── project-management/         # 4 guides: variations, raid, quality-standards, kpis
├── planning/                   # 3 guides: wbs-planning, estimator, benchmarking
├── finance/                    # 2 guides: billing, partner-invoices
├── evaluator/                  # 6 guides: evaluation-setup, requirements, vendors, scoring, workshops, evaluator-reports
├── admin/                      # 4 guides: organisation-admin, project-settings, team-members, audit-log
└── general/                    # 3 guides: navigation, roles-permissions, workflows
```

**Total: 27 guides, ~12,500 lines of documentation**

#### Guide Structure

Each guide follows a consistent template:

```javascript
const guide = {
  id: 'timesheets',           // Unique identifier
  title: 'Timesheets',        // Display name
  category: 'core',           // Category for grouping
  description: '...',         // Brief overview
  
  navigation: {               // How to access in UI
    path: '/time/timesheets',
    sidebar: 'Time & Expenses → Timesheets'
  },
  
  howTo: {                    // Step-by-step instructions
    create: {
      title: 'Creating a Timesheet Entry',
      steps: ['Navigate to...', 'Click...', 'Enter...'],
      tips: ['Use Ctrl+D for...']
    },
    // ... other actions
  },
  
  fields: {                   // Field reference
    date: {
      name: 'Entry Date',
      type: 'date',
      required: true,
      description: 'The date for this time entry',
      validation: 'Must be within project dates',
      tips: 'Click to open calendar picker'
    },
    // ... other fields
  },
  
  workflow: {                 // Status transitions
    stages: ['Draft', 'Submitted', 'Validated', 'Approved'],
    transitions: [
      { from: 'Draft', to: 'Submitted', action: 'Submit', actor: 'Creator' }
    ]
  },
  
  permissions: {              // Role-based access
    contributor: { canCreate: true, canValidate: false },
    supplier_pm: { canCreate: true, canValidate: true }
  },
  
  faq: [                      // Common questions
    {
      question: 'Can I edit an approved timesheet?',
      answer: 'No, approved timesheets are locked...'
    }
  ],
  
  related: ['expenses', 'resources']  // Cross-references
};
```

#### Tool Implementation

```javascript
// Tool definition
{
  name: "getFeatureGuide",
  description: "Retrieve how-to documentation for a specific feature. Use when users ask 'how do I...?' questions.",
  input_schema: {
    type: "object",
    properties: {
      guideId: {
        type: "string",
        description: "Direct guide ID (e.g., 'timesheets', 'expenses')"
      },
      keyword: {
        type: "string",
        description: "Search keyword to find relevant guide"
      }
    },
    required: []
  }
}

// Execution function
async function executeGetFeatureGuide(params) {
  const { guideId, keyword } = params;
  
  // Priority: direct ID > keyword match
  let targetGuideId = guideId;
  if (!targetGuideId && keyword) {
    targetGuideId = findGuideByKeyword(keyword);
  }
  
  if (!targetGuideId) {
    return {
      error: 'Guide not found',
      availableGuides: getAvailableGuides(),
      suggestion: 'Try searching for: timesheets, expenses, milestones, etc.'
    };
  }
  
  // Dynamic import of guide module
  const guidePath = getGuidePath(targetGuideId);
  const guideModule = await import(`../src/data/feature-guides/${guidePath}.js`);
  
  return guideModule.default;
}
```

#### Keyword Mapping

The system supports fuzzy matching to help users find guides:

| User Keywords | Maps To |
|---------------|---------|
| "timesheet", "hours", "log time" | `timesheets` |
| "expense", "receipt", "claim" | `expenses` |
| "risk", "issue", "raid" | `raid` |
| "wbs", "planning", "gantt" | `wbs-planning` |
| "sfia", "day rate", "benchmark" | `benchmarking` |
| "approval", "workflow" | `workflows` |
| "role", "permission", "access" | `roles-permissions` |

#### System Prompt Integration

The system prompt routes how-to questions to the feature guide tool:

```
## How-To Questions
When users ask "how do I...?" or request help with a feature:
1. Use getFeatureGuide tool with relevant keyword
2. Extract relevant sections (howTo, fields, tips)
3. Present step-by-step instructions
4. Include relevant tips and warnings
5. Offer related guides for further help
```

---

## 6. User Management API

### 6.1 Endpoint: `/api/create-user`

Creates new user accounts with email confirmation and password requirements.

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "TempPass123!",
  "full_name": "New User",
  "role": "contributor",
  "projectId": "uuid-here",
  "adminToken": "jwt-token-of-requesting-admin"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "full_name": "New User",
    "role": "contributor",
    "must_change_password": true
  },
  "message": "User created. They will be required to set a new password on first login."
}
```

### 6.2 User Creation Workflow

```
Admin Request
      │
      ▼
┌─────────────────┐
│ Validate Input  │
│ - Email format  │
│ - Password min  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Admin    │
│ - Decode JWT    │
│ - Check role    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Auth User│
│ (Supabase Auth) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Profile  │
│ must_change_    │
│ password: true  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assign Project  │
│ (if projectId)  │
└────────┬────────┘
         │
         ▼
   Return Success
```

---

### 6.7 Planning AI API

> **Updated:** 6 January 2026 - Upgraded to Claude Opus 4 for improved document analysis

**File:** `api/planning-ai.js`

AI-powered Work Breakdown Structure (WBS) generation from natural language descriptions or uploaded documents.

**Endpoint:** `POST /api/planning-ai`

**Configuration:**
```javascript
// vercel.json
{
  "functions": {
    "api/planning-ai.js": {
      "maxDuration": 300  // 5 minutes for complex documents
    }
  }
}

// api/planning-ai.js
const MODEL = 'claude-opus-4-20250514';  // Upgraded from Sonnet 4.5 for better document analysis
const MAX_TOKENS = 16384;                // Increased from 8192 for larger structures
```

**Frontend Timeout:**
```javascript
// AIAssistantPanel.jsx
const PLANNING_AI_TIMEOUT = 330000; // 5.5 minutes (330 seconds)
```

**Model Selection Rationale:**
- Claude Opus 4 provides superior accuracy for complex project documents
- Better extraction of hierarchical structure from PDFs
- Improved understanding of technical requirements
- Cost increase: ~5x ($15/M input, $75/M output vs Sonnet's $3/$15)

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Create a plan for building a mobile app" }
  ],
  "projectContext": {
    "projectId": "uuid",
    "projectName": "Mobile App Project"
  },
  "currentStructure": [],
  "document": {
    "data": "base64-encoded-data",
    "mediaType": "application/pdf"
  }
}
```

**Field Details:**

| Field | Required | Description |
|-------|----------|-------------|
| `messages` | Yes | Conversation history array |
| `projectContext` | No | Current project info for context |
| `currentStructure` | No | Existing plan structure for refinement |
| `document` | No | Base64-encoded document (PDF/image) |

**Supported Document Types:**
- `application/pdf` - PDF documents
- `image/jpeg`, `image/png`, `image/webp`, `image/gif` - Images
- Maximum size: 10MB

**AI Tools Available:**

The API exposes 3 tools to Claude with **forced tool usage**:

```javascript
// Force Claude to use tools (prevents text-only responses)
tool_choice: { type: 'tool', name: 'generate_wbs' }
```

| Tool | Purpose | When Used |
|------|---------|----------|
| `generate_wbs` | Create new hierarchical WBS | New project descriptions |
| `refineStructure` | Modify existing structure | User feedback/refinement |
| `askClarification` | Request more info | Vague descriptions |

**Tool: generate_wbs**

```javascript
{
  name: "generate_wbs",
  input_schema: {
    type: "object",
    properties: {
      structure: {
        type: "array",
        description: "Hierarchical array: Components → Milestones → Deliverables → Tasks",
        items: {
          type: "object",
          properties: {
            item_type: { enum: ["component", "milestone", "deliverable", "task"] },
            name: { type: "string" },
            description: { type: "string" },
            duration_days: { type: "integer" },
            children: { type: "array" }  // Nested items
          },
          required: ["item_type", "name"]
        }
      },
      summary: { type: "string" },
      totalDurationDays: { type: "integer" },
      itemCounts: {
        type: "object",
        properties: {
          components: { type: "integer" },
          milestones: { type: "integer" },
          deliverables: { type: "integer" },
          tasks: { type: "integer" }
        }
      }
    },
    required: ["structure", "summary", "itemCounts"]
  }
}
```

**Item Type Hierarchy:**
```
component (optional top-level grouping, e.g., "Frontend", "Backend")
  └── milestone (payment milestone / phase)
        └── deliverable (work product)
              └── task (individual work item)
```
```

**Response (Structure Generated):**

```json
{
  "message": "I've created a project structure with 4 milestones...",
  "structure": [
    {
      "item_type": "milestone",
      "name": "Phase 1: Discovery",
      "description": "Requirements gathering and planning",
      "duration_days": 10,
      "children": [
        {
          "item_type": "deliverable",
          "name": "Requirements Document",
          "duration_days": 5,
          "children": [
            { "item_type": "task", "name": "Stakeholder interviews", "duration_days": 2 },
            { "item_type": "task", "name": "Document findings", "duration_days": 3 }
          ]
        }
      ]
    }
  ],
  "action": "generated",
  "itemCounts": { "milestones": 4, "deliverables": 12, "tasks": 36 },
  "totalDurationDays": 90,
  "stopReason": "end_turn"
}
```

**Response (Clarification Needed):**

```json
{
  "message": "I need more information to create an accurate plan.",
  "clarificationNeeded": true,
  "questions": [
    "What is the target platform (iOS, Android, or both)?",
    "Do you have an existing backend or need one built?",
    "What is the expected timeline?"
  ],
  "stopReason": "end_turn"
}
```

**Response (Structure Refined):**

```json
{
  "message": "I've added more detail to the Backend Development phase.",
  "structure": [...],
  "action": "refined",
  "refinementType": "add_detail",
  "targetArea": "Backend Development",
  "itemCounts": { "milestones": 4, "deliverables": 15, "tasks": 48 },
  "stopReason": "end_turn"
}
```

**System Prompt Highlights:**

```
You are a project planning assistant...

## Structure Rules
- Maximum 3 levels: Milestone → Deliverable → Task
- Each milestone: 2-5 deliverables
- Each deliverable: 2-8 tasks
- Names under 50 characters

## Duration Estimation
- Tasks: 0.5 to 5 days typically
- Include buffer for reviews
- Consider dependencies
```

**Document Analysis:**

When a document is provided, the system prompt is extended:

```
## Document Analysis

Analyze the document to:
1. Identify Project Scope
2. Extract Phases/Milestones
3. Find Deliverables
4. Discover Tasks
5. Note Timelines
6. Capture Dependencies

Supported document types:
- Project Brief → Extract objectives, scope, deliverables
- Requirements Document → Create deliverables from requirement groups
- Scope Document → Map scope items to milestones
- Proposal → Extract work packages and phases
```

**Token Cost Tracking:**

```javascript
const TOKEN_COSTS = {
  input: 3.00,   // per 1M tokens
  output: 15.00, // per 1M tokens
};

// Logged per request
console.log(`Planning AI - Tokens: ${input} in, ${output} out, Cost: ${cost.toFixed(4)}`);
```

**Error Handling:**

| Error | Cause | Recovery |
|-------|-------|----------|
| 400 | Invalid messages array | Fix request body |
| 400 | Unsupported document type | Use PDF/JPEG/PNG/WebP/GIF |
| 400 | Document too large | Reduce to <10MB |
| 500 | AI service not configured | Check ANTHROPIC_API_KEY |
| 500 | Claude API error | Retry request |

**Workflow Diagram:**

```
User Input (text/document)
         │
         ▼
┌─────────────────┐
│ Validate Input  │
│ - Messages      │
│ - Document size │
│ - Document type │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build System    │
│ Prompt          │
│ + Doc Analysis  │
│ + Current Plan  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude API      │
│ (Sonnet 4.5)    │
│ + 3 Tools       │
│ 120s timeout    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process Tool    │
│ Response        │
│ - Structure     │
│ - Clarification │
│ - Refinement    │
└────────┬────────┘
         │
         ▼
    Return JSON
```

**Integration with Planning Page:**

```javascript
// PlanningAIAssistant.jsx
const response = await fetch('/api/planning-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: conversationHistory,
    projectContext: { projectId, projectName },
    currentStructure: existingPlanItems,
    document: uploadedDocument
  })
});

const result = await response.json();
if (result.structure) {
  // Import generated structure into plan_items table
  await planItemsService.importStructure(projectId, result.structure);
}
```

### 6.3 Password Validation

```javascript
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};

// Weak patterns rejected
const weakPatterns = [
  /^password/i,
  /^123456/,
  /^qwerty/i,
  /(.)\1{3,}/, // 4+ repeated characters
];
```

Note: Initial passwords created by admin only require 8 characters minimum, but user must set a stronger password on first login.

---

### 6.5 Project Creation API (New - December 2025)

**File:** `api/create-project.js`

Creates new projects within an organisation. Requires organisation admin permissions or system admin role.

**Endpoint:** `POST /api/create-project`

**Request Body:**

```json
{
  "name": "New Project Name",
  "reference": "PROJ-001",
  "description": "Optional description",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "total_budget": 100000,
  "organisation_id": "uuid-of-organisation",
  "adminToken": "jwt-token"
}
```

**Permissions:**
- System admins can create projects in any organisation (or without org)
- Organisation owners/admins can create projects in their organisation
- Supplier PMs with org_admin role can create projects

**Validation:**
- Reference must be alphanumeric with hyphens only
- Reference must be unique within the organisation
- Organisation must exist and be active
- User must have appropriate permissions

**Response (Success):**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "reference": "PROJ-001",
    "name": "New Project Name",
    "organisation_id": "uuid"
  },
  "message": "Project created successfully"
}
```

**Response (Error):**

```json
{
  "error": "Insufficient permissions. Only organisation admins can create projects."
}
```

---

### 6.6 Organisation Creation API (New - December 2025)

**File:** `api/create-organisation.js`

Creates new organisations during the self-service signup flow. Any authenticated user can create an organisation.

**Endpoint:** `POST /api/create-organisation`

**Request Body:**

```json
{
  "name": "My Company Ltd",
  "slug": "my-company",
  "display_name": "My Company",
  "description": "Optional description",
  "adminToken": "jwt-token"
}
```

**Field Details:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Organisation name (used internally) |
| `slug` | No | URL-friendly identifier (auto-generated from name if not provided) |
| `display_name` | No | Display name for UI (defaults to name) |
| `description` | No | Organisation description |
| `adminToken` | Yes | JWT token from authenticated user |

**Permissions:**
- Any authenticated user can create an organisation
- Creator automatically becomes `org_admin`
- Organisation is set as user's default if they have no others

**Validation:**
- Name is required and must not be empty
- Slug must be unique across all organisations
- Slug must be URL-safe (lowercase alphanumeric and hyphens only)

**Response (Success):**

```json
{
  "success": true,
  "organisation": {
    "id": "uuid",
    "name": "My Company Ltd",
    "slug": "my-company",
    "display_name": "My Company",
    "subscription_tier": "free",
    "is_active": true,
    "settings": {
      "onboarding_completed": false
    }
  },
  "membership": {
    "id": "uuid",
    "org_role": "org_admin",
    "is_default": true
  },
  "message": "Organisation created successfully"
}
```

**Response (Error - Duplicate Slug):**

```json
{
  "error": "Organisation with this slug already exists",
  "code": "DUPLICATE_SLUG"
}
```

**Response (Error - Unauthorized):**

```json
{
  "error": "Unauthorized - valid authentication required"
}
```

**Workflow:**

```
User Request
      │
      ▼
┌─────────────────┐
│ Verify Auth     │
│ (JWT token)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Input  │
│ - Name required │
│ - Generate slug │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Slug      │
│ Uniqueness      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Org      │
│ tier: 'free'    │
│ active: true    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Creator as  │
│ org_admin       │
│ is_default: true│
└────────┬────────┘
         │
         ▼
   Return Success
```

---

## 7. Receipt Scanner API

### 7.1 Endpoint: `/api/scan-receipt`

Uses Claude Vision to extract data from receipt images.

**Request:**

```json
{
  "image": {
    "data": "base64-encoded-image-data",
    "mediaType": "image/jpeg"
  },
  "userId": "user-id-for-rate-limiting"
}
```

**Response:**

```json
{
  "merchant": "Costa Coffee",
  "amount": 12.50,
  "currency": "GBP",
  "date": "2025-12-01",
  "items": [
    { "name": "Large Latte", "quantity": 2, "price": 4.50 },
    { "name": "Croissant", "quantity": 1, "price": 3.50 }
  ],
  "paymentMethod": "card",
  "category": "Sustenance",
  "confidence": 0.92,
  "rawText": "COSTA COFFEE..."
}
```

### 7.2 AI Extraction Prompt

```
Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "Store/vendor name",
  "amount": 0.00,
  "currency": "GBP",
  "date": "YYYY-MM-DD",
  "items": [{"name": "item name", "quantity": 1, "price": 0.00}],
  "paymentMethod": "card/cash/unknown",
  "category": "Travel/Accommodation/Sustenance",
  "confidence": 0.0 to 1.0,
  "rawText": "All visible text from receipt"
}

Category definitions:
- Travel: Transport, fuel, parking, flights, trains, taxis
- Accommodation: Hotels, lodging, rentals
- Sustenance: Food, drinks, restaurants, cafes

Be conservative with confidence - only use high values (>0.8) when very certain.
```

### 7.3 Category Classification

The receipt scanner uses a learning system:

1. **Pattern Matching** - Built-in merchant patterns:
```javascript
const MERCHANT_HINTS = {
  'uber': 'Travel',
  'hotel': 'Accommodation',
  'costa': 'Sustenance',
  // ...
};
```

2. **Database Rules** - Project-specific learned rules
3. **AI Suggestion** - Claude's category recommendation
4. **User Correction** - Creates/updates classification rules

### 7.4 Integration with Expenses

```javascript
// Receipt scan → Expense creation flow
const scanResult = await receiptScannerService.processReceipt(imageData, projectId);

// Pre-populate expense form
const expenseData = {
  expense_date: scanResult.date,
  amount: scanResult.amount,
  category: scanResult.suggestedCategory,
  description: `${scanResult.merchant} - Receipt scan`,
  receipt_url: uploadedImageUrl
};
```

---

## 8. Security & Configuration

### 8.1 Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API authentication | Server-only |
| `VITE_SUPABASE_URL` | Supabase project URL | Client + Server |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Client-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access | Server-only |
| `ADMIN_API_KEY` | Usage stats endpoint auth | Server-only |

**Security Notes:**
- `VITE_` prefix exposes variables to client-side code
- `SUPABASE_SERVICE_ROLE_KEY` **bypasses RLS** - server-only!
- `ANTHROPIC_API_KEY` should never have `VITE_` prefix

### 8.2 Rate Limiting

**Chat API:**
```javascript
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};
```

**Receipt Scanner:**
```javascript
const RATE_LIMIT = {
  maxRequests: 10,     // Fewer (expensive vision API)
  windowMs: 60 * 1000,
};
```

**Implementation:**
```javascript
function checkRateLimit(userId) {
  const key = `rl:${userId}`;
  let record = rateLimitStore.get(key);
  
  if (record?.count > RATE_LIMIT.maxRequests) {
    return { allowed: false, retryAfter: record.resetAt };
  }
  // ...
}
```

### 8.3 Input Sanitization

All user input is sanitized before processing:

```javascript
function sanitizeMessage(content) {
  if (!content || typeof content !== 'string') return '';
  // Remove null bytes and control characters
  let sanitized = content.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.trim();
  // Limit message length
  if (sanitized.length > 4000) sanitized = sanitized.substring(0, 4000);
  return sanitized;
}
```

### 8.4 Service Role Usage

The API functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for:

1. **Chat tool execution** - Query any data based on user's role permissions (applied in code)
2. **User creation** - Admin API requires bypassing normal user restrictions
3. **Context pre-fetch** - Aggregate views for dashboard summaries

**Important:** Role-based filtering is implemented in the tool functions themselves, not via RLS:

```javascript
// Tool applies permission scoping manually
if (userContext.role === 'contributor') {
  query = query.eq('resource_id', userContext.linkedResourceId);
}
```

---

## 9. Deployment & Monitoring

### 9.1 Vercel Deployment

**Configuration:**
- Runtime: Edge (globally distributed)
- Function timeout: 10 seconds (Edge default)
- Memory: 128MB (Edge default)

**Environment Setup:**
```bash
# Set in Vercel Project Settings > Environment Variables
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_API_KEY=your-admin-key
```

### 9.2 Usage Statistics Endpoint

GET `/api/chat` with admin authentication returns usage stats:

```json
{
  "stats": {
    "totalRequests": 1250,
    "totalInputTokens": 2500000,
    "totalOutputTokens": 750000,
    "estimatedCostUSD": 12.50,
    "haikuRequests": 800,
    "sonnetRequests": 450,
    "cacheSize": 45,
    "rateLimitEntries": 12,
    "uptime": "4.5 hours",
    "averageTokensPerRequest": 2600,
    "recentRequests": [...]
  }
}
```

### 9.3 Logging & Debugging

```javascript
// Periodic stats logging
if (usageStats.totalRequests % 10 === 0) {
  console.log(`[Chat API Stats] Requests: ${usageStats.totalRequests}, ` +
              `Tokens: ${usageStats.totalInputTokens}/${usageStats.totalOutputTokens}, ` +
              `Est. Cost: $${usageStats.estimatedCostUSD.toFixed(4)}`);
}

// Tool execution logging
console.log(`[Tool] ${toolName} completed in ${Date.now() - startTime}ms`);
```

### 9.4 Performance Considerations

| Metric | Target | Implementation |
|--------|--------|----------------|
| Local response | <200ms | Pre-fetched context + pattern matching |
| Streaming first byte | <500ms | Haiku fast path |
| Tool query | <5s | Query timeout + parallel execution |
| Context pre-fetch | <4s | Aggregate view + parallel queries |

**Optimization Techniques:**
1. Response caching (5 min TTL)
2. Parallel tool execution
3. Pre-fetched context for instant responses
4. Aggregate database views for summaries
5. Model routing (Haiku for simple, Sonnet for complex)

---

## 10. Evaluator API Endpoints

> **Reference:** See **TECH-SPEC-11-Evaluator.md** for comprehensive Evaluator module documentation.

The Evaluator module provides a complete set of API endpoints for vendor evaluation functionality. All endpoints are located in `/api/evaluator/`.

### 10.1 Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/evaluator/ai-document-parse` | POST | Parse uploaded documents with AI (RFP, proposals, requirements) |
| `/api/evaluator/ai-gap-analysis` | POST | AI-powered gap analysis comparing vendor responses to requirements |
| `/api/evaluator/ai-market-research` | POST | AI market research for identifying potential vendors |
| `/api/evaluator/ai-requirement-suggest` | POST | AI-generated requirement suggestions based on context |
| `/api/evaluator/client-portal-auth` | POST | Client portal authentication for external stakeholders |
| `/api/evaluator/create-evaluation` | POST | Create new evaluation project with full structure |
| `/api/evaluator/generate-report` | POST | Generate evaluation report (PDF/DOCX format) |
| `/api/evaluator/vendor-portal-auth` | POST | Vendor portal authentication for external vendors |

### 10.2 Authentication Requirements

All Evaluator endpoints require JWT authentication. Portal endpoints (`client-portal-auth`, `vendor-portal-auth`) use token-based authentication for external users without full system accounts.

### 10.3 AI Endpoints

The four AI endpoints (`ai-document-parse`, `ai-gap-analysis`, `ai-market-research`, `ai-requirement-suggest`) all use Claude AI and follow the same patterns as the main chat API:

- **Model:** Claude Sonnet 4.5 (default) or Claude Opus 4 (document analysis)
- **Token tracking:** Same cost estimation as Section 4.3
- **Rate limiting:** Applied per-user per-endpoint
- **Error handling:** Standard API error responses

### 10.4 Integration with Evaluator Module

```javascript
// Example: Create new evaluation project
const response = await fetch('/api/evaluator/create-evaluation', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'CRM Vendor Selection 2026',
    client_name: 'Acme Corporation',
    description: 'Annual CRM platform evaluation',
    settings: {
      scoring_method: 'weighted',
      require_evidence: true
    }
  })
});
```

> **Full Documentation:** For complete request/response schemas, workflow diagrams, and implementation details, see **TECH-SPEC-11-Evaluator.md Section 3: API Layer**.

---

## 11. AI Enablement Services

> **Added:** 17 January 2026 - AI Enablement Strategy Implementation

The AI Enablement Services provide proactive intelligence, automated analysis, and intelligent assistance across the application. All endpoints follow the **advisory-only** design principle: AI analyzes and recommends, but never executes actions without explicit user approval.

### 11.1 Design Principles

**Core Philosophy:**
- AI advises, human decides
- Proactive analysis displayed on page load
- No automatic data modifications
- Recommendations include confidence levels
- Clear attribution ("AI-generated")

**Model Selection:**
| Model | Use Case | Rationale |
|-------|----------|-----------|
| Claude Opus 4.5 | Complex reasoning, document generation, forecasting | Highest quality for critical analysis |
| Claude Sonnet 4.5 | Classification, simple categorization | Cost-effective for straightforward tasks |

### 11.2 Endpoint Summary

| Endpoint | Model | Purpose | UI Location |
|----------|-------|---------|-------------|
| `/api/ai-raid-categorize` | Sonnet 4.5 | Auto-suggest RAID item category | RAID Log - Inline suggestions |
| `/api/ai-approval-assist` | Opus 4.5 | Approval recommendations | Dashboard - Sidebar widget |
| `/api/ai-anomaly-detect` | Opus 4.5 | Detect data anomalies | Dashboard - Alerts widget |
| `/api/ai-deliverable-assess` | Opus 4.5 | Quality assessment | Deliverable detail panel |
| `/api/ai-variation-impact` | Opus 4.5 | Change impact analysis | Variation detail page |
| `/api/ai-document-generate` | Opus 4.5 | Generate formatted documents | Reports page |
| `/api/ai-forecast` | Opus 4.5 | Project completion forecasting | Dashboard - Forecast panel |
| `/api/ai-schedule-risk` | Opus 4.5 | Schedule risk prediction | Dashboard - Forecast panel |
| `/api/ai-portfolio-insights` | Opus 4.5 | Cross-project analytics | Org Admin - Insights tab |

### 11.3 RAID Auto-Categorization

**File:** `api/ai-raid-categorize.js`

**Endpoint:** `POST /api/ai-raid-categorize`

Analyzes RAID item descriptions and suggests appropriate categorization.

**Request:**

```json
{
  "projectId": "uuid",
  "description": "The vendor might not deliver hardware on time",
  "existingItems": [
    { "id": "uuid", "type": "Risk", "description": "Supply chain delays" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "suggestions": {
    "type": "Risk",
    "typeConfidence": 0.95,
    "typeReasoning": "Uses future tense 'might not' indicating uncertainty, not a current issue",
    "severity": "High",
    "severityReasoning": "Affects project timeline directly",
    "probability": "Medium",
    "suggestedOwner": "Procurement Manager",
    "ownerReasoning": "Hardware delivery typically managed by procurement",
    "relatedItems": [
      { "id": "uuid", "type": "Risk", "description": "Supply chain delays", "similarity": 0.78 }
    ]
  }
}
```

**Tool Schema:**

```javascript
{
  name: "categorizeRaidItem",
  input_schema: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["Risk", "Assumption", "Issue", "Decision"] },
      typeConfidence: { type: "number", minimum: 0, maximum: 1 },
      typeReasoning: { type: "string" },
      severity: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
      probability: { type: "string", enum: ["High", "Medium", "Low"] },
      suggestedOwner: { type: "string" },
      relatedItemIds: { type: "array", items: { type: "string" } }
    },
    required: ["type", "typeConfidence", "typeReasoning", "severity"]
  }
}
```

### 11.4 Approval Assistant

**File:** `api/ai-approval-assist.js`

**Endpoint:** `POST /api/ai-approval-assist`

Analyzes pending approvals and provides recommendations for users with approval permissions.

**Request:**

```json
{
  "projectId": "uuid",
  "categories": ["timesheets", "expenses", "deliverables"]
}
```

**Response:**

```json
{
  "success": true,
  "analysis": {
    "summary": {
      "totalPending": 12,
      "recommendApprove": 9,
      "needsReview": 3
    },
    "categories": {
      "timesheets": {
        "total": 8,
        "totalValue": 12400,
        "recommendation": "6 entries look standard, recommend bulk approve. 2 flagged for review.",
        "flagged": [
          { "id": "uuid", "reason": "50-hour week exceeds normal capacity" },
          { "id": "uuid", "reason": "Sunday entry on non-weekend project" }
        ]
      },
      "expenses": {
        "total": 3,
        "totalValue": 2850,
        "recommendation": "2 have receipts attached, recommend approve. 1 missing documentation.",
        "flagged": [
          { "id": "uuid", "reason": "Missing receipt for $450 hotel charge" }
        ]
      },
      "deliverables": {
        "total": 1,
        "recommendation": "All acceptance criteria met, 3 reviewers approved. Ready for sign-off.",
        "flagged": []
      }
    },
    "insight": "Overall approval queue is healthy. Focus attention on the 2 flagged timesheets before batch approval."
  }
}
```

**Permission Requirements:**
- Only returns categories user can approve
- Checks `canApproveTimesheets`, `canApproveExpenses`, `canSignOffDeliverables`

### 11.5 Anomaly Detection

**File:** `api/ai-anomaly-detect.js`

**Endpoint:** `POST /api/ai-anomaly-detect`

Scans project data for anomalies across timesheets, expenses, milestones, deliverables, and RAID items.

**Request:**

```json
{
  "projectId": "uuid",
  "categories": ["timesheets", "expenses", "milestones", "deliverables", "raid"]
}
```

**Response:**

```json
{
  "success": true,
  "alerts": [
    {
      "id": "anomaly-001",
      "severity": "high",
      "category": "milestone_risk",
      "title": "Milestone 'Phase 1 Complete' at risk",
      "message": "2 of 5 deliverables incomplete, deadline in 4 days",
      "suggestedAction": "Review deliverable status or request deadline extension",
      "relatedEntity": { "type": "milestone", "id": "uuid", "name": "Phase 1 Complete" },
      "detectedAt": "2026-01-17T10:30:00Z"
    },
    {
      "id": "anomaly-002",
      "severity": "medium",
      "category": "expense_duplicate",
      "title": "Potential duplicate expenses",
      "message": "Two receipts for $47.50 at same vendor within 1 hour",
      "suggestedAction": "Review and confirm these are separate transactions",
      "relatedEntity": { "type": "expense", "ids": ["uuid1", "uuid2"] }
    },
    {
      "id": "anomaly-003",
      "severity": "low",
      "category": "raid_unowned",
      "title": "RAID items without owner",
      "message": "3 high-severity risks have no assigned owner",
      "suggestedAction": "Assign owners to ensure accountability",
      "relatedEntity": { "type": "raid", "ids": ["uuid1", "uuid2", "uuid3"] }
    }
  ],
  "summary": {
    "highCount": 1,
    "mediumCount": 1,
    "lowCount": 1,
    "lastAnalyzed": "2026-01-17T10:30:00Z"
  }
}
```

**Anomaly Categories:**

| Category | Description | Severity Range |
|----------|-------------|----------------|
| `milestone_risk` | Milestone approaching deadline with incomplete work | High-Critical |
| `deliverable_stalled` | Deliverable unchanged for extended period | Medium-High |
| `timesheet_unusual` | Unusual hours, duplicates, or policy violations | Medium-High |
| `expense_duplicate` | Potential duplicate expense entries | Medium |
| `expense_policy` | Expense exceeds policy limits | Medium |
| `raid_unowned` | High-severity RAID items without owner | Medium |
| `raid_escalating` | Risk probability or impact increased | Medium-High |

### 11.6 Deliverable Quality Assessment

**File:** `api/ai-deliverable-assess.js`

**Endpoint:** `POST /api/ai-deliverable-assess`

Evaluates deliverable readiness for sign-off based on acceptance criteria, attachments, and historical patterns.

**Request:**

```json
{
  "projectId": "uuid",
  "deliverableId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "assessment": {
    "readinessScore": 78,
    "status": "needs_attention",
    "criteriaAnalysis": {
      "met": [
        "All 5 required sections present",
        "Diagrams included",
        "Version history complete"
      ],
      "concerns": [
        "Security section is brief (200 words vs avg 800)",
        "No performance benchmarks included",
        "Missing sign-off from Technical Lead"
      ]
    },
    "documentQuality": {
      "completeness": 85,
      "formatting": 90,
      "technicalDepth": 65
    },
    "recommendation": "Address security section depth before requesting Customer sign-off",
    "suggestedActions": [
      "Expand security considerations section",
      "Add performance benchmark data",
      "Request Technical Lead review"
    ],
    "comparedToSimilar": {
      "averageScore": 82,
      "percentile": 45
    }
  }
}
```

**Scoring Logic:**

| Factor | Weight | Description |
|--------|--------|-------------|
| Acceptance Criteria | 40% | Percentage of criteria marked complete |
| Document Quality | 25% | Completeness, formatting, depth analysis |
| Review Status | 20% | Number and quality of reviews received |
| Historical Comparison | 15% | Comparison to similar deliverables |

### 11.7 Variation Impact Analysis

**File:** `api/ai-variation-impact.js`

**Endpoint:** `POST /api/ai-variation-impact`

Analyzes the impact of a proposed variation (change request) on timeline, budget, and dependencies.

**Request:**

```json
{
  "projectId": "uuid",
  "variationId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": {
    "overallImpact": "significant",
    "recommendation": "approve_with_conditions",
    "confidence": 0.82,
    "timeline": {
      "currentEndDate": "2026-06-30",
      "projectedEndDate": "2026-07-15",
      "delayDays": 15,
      "affectedMilestones": [
        { "id": "uuid", "name": "UAT Complete", "originalDate": "2026-06-15", "newDate": "2026-06-30" },
        { "id": "uuid", "name": "Go Live", "originalDate": "2026-06-30", "newDate": "2026-07-15" }
      ]
    },
    "budget": {
      "originalBudget": 250000,
      "additionalCost": 35000,
      "newTotal": 285000,
      "percentageIncrease": 14
    },
    "resources": {
      "additionalEffort": "120 hours",
      "roleBreakdown": [
        { "role": "Senior Developer", "hours": 80 },
        { "role": "QA Engineer", "hours": 40 }
      ],
      "availabilityIssues": ["Senior Developer at 90% capacity through June"]
    },
    "risks": [
      {
        "description": "Extended timeline overlaps with planned team leave",
        "severity": "medium",
        "mitigation": "Consider contractor support for July period"
      }
    ],
    "dependencies": [
      { "type": "external", "description": "Third-party API integration must complete by July 1" }
    ],
    "conditions": [
      "Secure contractor approval for additional capacity",
      "Confirm third-party API timeline"
    ]
  }
}
```

### 11.8 Document Generation

**File:** `api/ai-document-generate.js`

**Endpoint:** `POST /api/ai-document-generate`

Generates formatted project documents from structured data.

**Request:**

```json
{
  "projectId": "uuid",
  "documentType": "status_report",
  "options": {
    "dateRange": "thisMonth",
    "includeFinancials": true,
    "format": "markdown"
  }
}
```

**Supported Document Types:**

| Type | Description | Key Sections |
|------|-------------|--------------|
| `status_report` | Periodic status update | Executive summary, progress, milestones, risks, next steps, metrics |
| `project_summary` | High-level project overview | Overview, scope, timeline, team, key achievements |
| `milestone_report` | Milestone completion report | Deliverables, acceptance criteria, sign-offs, lessons learned |
| `raid_summary` | RAID log summary | Active risks, issues, decisions, trends |
| `handover_document` | Project handover pack | Full project documentation, contacts, outstanding items |

**Response:**

```json
{
  "success": true,
  "document": {
    "type": "status_report",
    "generatedAt": "2026-01-17T10:30:00Z",
    "content": "# Project Status Report\n\n## Executive Summary\n\n...",
    "sections": [
      {
        "title": "Executive Summary",
        "content": "Project is on track with 75% of milestones completed...",
        "ragStatus": "green"
      },
      {
        "title": "Key Highlights",
        "items": [
          "UAT phase completed ahead of schedule",
          "All critical bugs resolved"
        ]
      }
    ],
    "metadata": {
      "projectName": "AMSF001",
      "reportPeriod": "January 2026",
      "preparedBy": "AI Document Generator"
    }
  }
}
```

### 11.9 Project Forecasting

**File:** `api/ai-forecast.js`

**Endpoint:** `POST /api/ai-forecast`

Predicts project completion dates, budget outcomes, and identifies trajectory risks.

**Request:**

```json
{
  "projectId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "forecast": {
    "healthScore": 78,
    "healthTrend": "improving",
    "completion": {
      "plannedDate": "2026-06-30",
      "predictedDate": "2026-07-08",
      "confidenceInterval": { "low": "2026-06-28", "high": "2026-07-20" },
      "confidence": 0.75,
      "onScheduleProbability": 0.65
    },
    "budget": {
      "original": 250000,
      "currentSpend": 150000,
      "predictedFinal": 265000,
      "variance": 15000,
      "variancePercent": 6,
      "onBudgetProbability": 0.70
    },
    "velocity": {
      "current": 4.2,
      "required": 5.1,
      "trend": "stable",
      "unit": "deliverables/week"
    },
    "milestones": [
      {
        "id": "uuid",
        "name": "UAT Complete",
        "plannedDate": "2026-05-15",
        "predictedDate": "2026-05-18",
        "riskLevel": "low"
      },
      {
        "id": "uuid",
        "name": "Go Live",
        "plannedDate": "2026-06-30",
        "predictedDate": "2026-07-08",
        "riskLevel": "medium"
      }
    ],
    "keyFactors": [
      "Current velocity 18% below required rate",
      "2 blocking issues unresolved for >5 days",
      "Team capacity at 85% due to planned leave"
    ],
    "recommendations": [
      "Prioritize resolution of blocking issues",
      "Consider scope reduction for Phase 3",
      "Request additional resource for June"
    ]
  }
}
```

### 11.10 Schedule Risk Prediction

**File:** `api/ai-schedule-risk.js`

**Endpoint:** `POST /api/ai-schedule-risk`

Identifies milestones at risk of slippage with contributing factors and mitigations.

**Request:**

```json
{
  "projectId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "riskAssessment": {
    "overallRisk": "medium",
    "milestonesAtRisk": [
      {
        "milestone": {
          "id": "uuid",
          "name": "UAT Complete",
          "plannedDate": "2026-02-15"
        },
        "riskLevel": "high",
        "riskScore": 78,
        "predictedSlipDays": 13,
        "trajectory": {
          "currentCompletion": 0.45,
          "requiredCompletion": 0.65,
          "gap": 0.20
        },
        "contributingFactors": [
          {
            "factor": "Test coverage incomplete",
            "impact": "high",
            "detail": "3 of 8 test scenarios not started"
          },
          {
            "factor": "Resource constraint",
            "impact": "medium",
            "detail": "Testing team at 75% capacity"
          },
          {
            "factor": "Blocking dependencies",
            "impact": "high",
            "detail": "2 bugs blocking test execution"
          }
        ],
        "recommendations": [
          {
            "action": "Prioritize bug fixes",
            "effort": "3 days",
            "impact": "Unblocks 40% of remaining tests"
          },
          {
            "action": "Consider scope reduction",
            "effort": "1 day",
            "impact": "Defer 2 low-priority scenarios to Phase 2"
          },
          {
            "action": "Request extension",
            "effort": "Variation required",
            "impact": "1-week buffer reduces risk to low"
          }
        ]
      }
    ],
    "healthyMilestones": [
      { "id": "uuid", "name": "Design Complete", "riskLevel": "low" }
    ],
    "summary": {
      "totalMilestones": 8,
      "highRisk": 1,
      "mediumRisk": 2,
      "lowRisk": 5
    }
  }
}
```

### 11.11 Portfolio Insights

**File:** `api/ai-portfolio-insights.js`

**Endpoint:** `POST /api/ai-portfolio-insights`

Cross-project analysis for organisation-level strategic intelligence.

**Request:**

```json
{
  "organisationId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "insights": {
    "executiveSummary": "Portfolio of 12 active projects is performing well overall with 2 requiring attention.",
    "overallHealth": "good",
    "healthScore": 82,
    "keyMetrics": {
      "activeProjects": 12,
      "totalBudget": 3500000,
      "totalSpend": 2100000,
      "budgetUtilization": 60,
      "onTrackPercentage": 83,
      "averageHealthScore": 78
    },
    "projectsNeedingAttention": [
      {
        "project": { "id": "uuid", "name": "CRM Migration", "reference": "CRM-001" },
        "issues": ["30% over budget", "2 critical risks unresolved"],
        "recommendation": "Executive review recommended"
      }
    ],
    "riskPatterns": [
      {
        "pattern": "Resource contention",
        "affectedProjects": 4,
        "description": "Senior developers allocated to multiple concurrent projects",
        "recommendation": "Consider resource leveling across Q2 projects"
      }
    ],
    "resourceUtilization": {
      "overallUtilization": 87,
      "overallocatedResources": 3,
      "underallocatedResources": 2
    },
    "strategicRecommendations": [
      {
        "recommendation": "Stagger project start dates",
        "priority": "high",
        "impact": "Reduces resource contention by 40%",
        "effort": "Medium - requires stakeholder alignment"
      },
      {
        "recommendation": "Standardize risk management",
        "priority": "medium",
        "impact": "Early risk detection across portfolio",
        "effort": "Low - template and process update"
      }
    ],
    "trends": {
      "budgetVariance": { "trend": "improving", "change": -5 },
      "scheduleVariance": { "trend": "stable", "change": 0 },
      "qualityMetrics": { "trend": "improving", "change": 8 }
    }
  }
}
```

**Permission Requirements:**
- Requires `org_admin` or `supplier_pm` role at organisation level
- Only returns data for projects within user's organisation

### 11.12 UI Integration

The AI Enablement Services are integrated into the application through dedicated components:

| Component | Location | Endpoint |
|-----------|----------|----------|
| `AnomalyAlertsWidget` | Dashboard sidebar | `/api/ai-anomaly-detect` |
| `ApprovalAssistantWidget` | Dashboard sidebar | `/api/ai-approval-assist` |
| `ProjectForecastPanel` | Dashboard main area | `/api/ai-forecast`, `/api/ai-schedule-risk` |
| `AIDocumentGenerator` | Reports page | `/api/ai-document-generate` |
| `PortfolioInsightsPanel` | Org Admin > Insights tab | `/api/ai-portfolio-insights` |
| `QualityAssessment` | Deliverable detail panel | `/api/ai-deliverable-assess` |
| `ImpactAnalysis` | Variation detail page | `/api/ai-variation-impact` |
| `RaidAISuggestions` | RAID form inline | `/api/ai-raid-categorize` |

### 11.13 Error Handling

All AI Enablement endpoints follow consistent error handling:

```json
{
  "success": false,
  "error": "Analysis failed",
  "code": "AI_ANALYSIS_ERROR",
  "details": "Insufficient data for meaningful analysis"
}
```

**Error Codes:**

| Code | Description | Recovery |
|------|-------------|----------|
| `AI_ANALYSIS_ERROR` | AI processing failed | Retry or simplify request |
| `INSUFFICIENT_DATA` | Not enough data for analysis | Ensure project has sufficient data |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `PERMISSION_DENIED` | User lacks required permissions | Contact admin |
| `PROJECT_NOT_FOUND` | Invalid project ID | Verify project exists |

### 11.14 Token Usage & Costs

| Endpoint | Avg Input Tokens | Avg Output Tokens | Est. Cost/Request |
|----------|------------------|-------------------|-------------------|
| ai-raid-categorize | 800 | 300 | $0.02 |
| ai-approval-assist | 2,000 | 800 | $0.09 |
| ai-anomaly-detect | 3,000 | 1,000 | $0.12 |
| ai-deliverable-assess | 1,500 | 600 | $0.07 |
| ai-variation-impact | 2,500 | 1,200 | $0.13 |
| ai-document-generate | 4,000 | 3,000 | $0.28 |
| ai-forecast | 3,500 | 1,500 | $0.16 |
| ai-schedule-risk | 2,000 | 1,000 | $0.11 |
| ai-portfolio-insights | 5,000 | 2,000 | $0.26 |

**Estimated monthly cost:** $50-100 for moderate usage across all features.

---

## 12. AI Action Framework

> **Added:** 17 January 2026 - Phase 1 of AI Enablement Strategy

The AI Action Framework extends the chat assistant beyond query capabilities to enable **execution of actions** through natural language commands. All actions require explicit user confirmation before execution.

### 12.1 Design Principles

**Core Philosophy:**
- User initiates via natural language command
- AI presents preview of what will happen
- User must explicitly confirm before execution
- Server-side permission validation
- All actions are auditable

**Confirmation Workflow:**
```
User: "Submit my timesheets"
     ↓
AI: Calls submitAllTimesheets (without confirmed flag)
     ↓
Tool: Returns preview: "3 timesheets totaling 24 hours"
     ↓
AI: "I found 3 timesheets... Submit them for approval?"
     ↓
User: "Yes"
     ↓
AI: Calls submitAllTimesheets (with confirmed: true)
     ↓
Tool: Executes update, returns success
     ↓
AI: "Done! 3 timesheets submitted."
```

### 12.2 Files

| File | Purpose |
|------|---------|
| `api/lib/ai-action-schemas.js` | Action tool definitions, permission mappings |
| `api/lib/ai-actions.js` | Action execution handlers, entity lookup |
| `api/chat.js` (modified) | Tool array expanded, action execution integration |

### 12.3 Action Tools

| Tool | Entity | Actions | Permission Required |
|------|--------|---------|---------------------|
| `submitTimesheet` | Timesheet | Submit single draft | `timesheets.submit` |
| `submitAllTimesheets` | Timesheet | Submit all drafts | `timesheets.submit` |
| `submitExpense` | Expense | Submit single draft | `expenses.submit` |
| `submitAllExpenses` | Expense | Submit all drafts | `expenses.submit` |
| `updateMilestoneStatus` | Milestone | Change status | `milestones.edit` |
| `updateMilestoneProgress` | Milestone | Set progress % | `milestones.edit` |
| `updateDeliverableStatus` | Deliverable | Change status | `deliverables.edit` |
| `completeTask` | Task | Mark complete | `tasks.edit` |
| `updateTaskProgress` | Task | Set progress % | `tasks.edit` |
| `reassignTask` | Task | Change assignee | `tasks.edit` |
| `updateRaidStatus` | RAID | Change status | `raid.edit` |
| `resolveRaidItem` | RAID | Close with note | `raid.edit` |
| `assignRaidOwner` | RAID | Change owner | `raid.edit` |

### 12.4 Tool Schema Example

```javascript
{
  name: "submitAllTimesheets",
  description: "Submit all of the current user's draft timesheets for approval.",
  input_schema: {
    type: "object",
    properties: {
      dateRange: {
        type: "string",
        enum: ["thisWeek", "lastWeek", "thisMonth", "all"],
        description: "Optional date range filter"
      },
      confirmed: {
        type: "boolean",
        description: "Set to true only after user explicitly confirms"
      }
    },
    required: []
  }
}
```

### 12.5 Response Formats

**Preview Response (not confirmed):**
```json
{
  "requiresConfirmation": true,
  "preview": "Submit 3 timesheet(s) totaling 24 hours:\n  - Mon: 8h on API work\n  - Tue: 8h on Testing\n  - Wed: 8h on Documentation",
  "actionName": "submitAllTimesheets",
  "params": { "dateRange": "thisWeek" },
  "data": { "count": 3, "totalHours": 24 }
}
```

**Success Response (confirmed):**
```json
{
  "success": true,
  "message": "3 timesheet(s) submitted for approval (24 hours total)"
}
```

**Error Response:**
```json
{
  "error": "You don't have permission to submit timesheets"
}
```

### 12.6 Permission Enforcement

Actions validate permissions server-side before execution:

```javascript
const ROLE_PERMISSIONS = {
  supplier_pm: {
    timesheets: ['view', 'create', 'edit', 'submit', 'validate', 'approve'],
    milestones: ['view', 'create', 'edit', 'delete'],
    // ...
  },
  contributor: {
    timesheets: ['view', 'create', 'edit', 'submit'],
    milestones: ['view'],
    // ...
  },
  // ...
};
```

### 12.7 Entity Lookup

Actions support flexible entity identification:
- **UUID:** Exact match by ID
- **Name:** Case-insensitive partial match
- **Reference:** For RAID items, supports format like "R-001", "I-023"

If multiple entities match, the action returns an error asking for clarification.

### 12.8 System Prompt Integration

The chat assistant system prompt includes action documentation:

```markdown
## Action Capability (v4.0)

You can also **execute actions** on behalf of the user.

### CRITICAL: Confirmation Rules
- NEVER set `confirmed: true` on first call
- ONLY set `confirmed: true` after user explicitly confirms
- If user says "no", "cancel", "wait" - do NOT execute
```

### 12.9 Cost Considerations

Action tools use the same model as query tools (Opus 4.5 for complex, Haiku for simple). Typical action costs:

| Action | Tokens (In/Out) | Est. Cost |
|--------|-----------------|-----------|
| Submit timesheet | 1,500/500 | $0.06 |
| Update milestone | 1,500/300 | $0.05 |
| Resolve RAID | 1,500/400 | $0.05 |

---

## Appendix A: Tool Input Schemas

### getTimesheets
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["Draft", "Submitted", "Validated", "Approved", "Rejected", "all"] },
    "dateRange": { "type": "string", "enum": ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"] },
    "resourceName": { "type": "string" },
    "mine": { "type": "boolean" }
  }
}
```

### getExpenses
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["Draft", "Submitted", "Validated", "Approved", "Rejected", "Paid", "all"] },
    "dateRange": { "type": "string", "enum": ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"] },
    "category": { "type": "string", "enum": ["Travel", "Accommodation", "Sustenance"] },
    "resourceName": { "type": "string" },
    "chargeableOnly": { "type": "boolean" },
    "mine": { "type": "boolean" }
  }
}
```

### getMilestones
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["Not Started", "In Progress", "Completed", "all"] },
    "overdueOnly": { "type": "boolean" }
  }
}
```

### getDeliverables
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["Not Started", "In Progress", "Submitted for Review", "Returned for More Work", "Review Complete", "Delivered", "all"] },
    "milestoneName": { "type": "string" }
  }
}
```

### getBudgetSummary
```json
{
  "type": "object",
  "properties": {
    "groupBy": { "type": "string", "enum": ["overall", "milestone"] }
  }
}
```

---

## Appendix B: Error Codes

| Code | Message | Recovery |
|------|---------|----------|
| 400 | Invalid request | Fix input and retry |
| 401 | Unauthorized | Re-authenticate |
| 403 | Insufficient permissions | Contact admin |
| 429 | Rate limit exceeded | Wait and retry |
| 500 | Server error | Retry or contact support |
| 503 | Service unavailable | Retry after delay |
| 504 | Timeout | Simplify query or retry |

---

*Document generated for AMSF001 Project Tracker - Session 1.6*  
*Last updated: 23 December 2025*

---

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 11 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added `/api/create-project` endpoint, Project Creation API section (6.5) for org-aware project creation |
| 1.2 | 24 Dec 2025 | Claude AI | Added `/api/create-organisation` endpoint (self-service org creation), Section 6.6 |
| 1.3 | 28 Dec 2025 | Claude AI | Added `/api/planning-ai` endpoint (AI-powered WBS generation), Section 6.7 |
| 1.4 | 6 Jan 2026 | Claude AI | Planning AI: Upgraded to Claude Opus 4, increased MAX_TOKENS to 16384, added component item type |
| 1.5 | 7 Jan 2026 | Claude AI | Added Section 10: Evaluator API Endpoints, added `/api/manage-project-users` and `/api/report-ai` to endpoint summary, added cross-reference to TECH-SPEC-11-Evaluator.md |
| 1.6 | 7 Jan 2026 | Claude AI | Chat AI: Expanded tool catalog to 36 tools, added getFeatureGuide, enhanced page-specific suggestions |
| 1.7 | 7 Jan 2026 | Claude AI | Feature Guides: 27 guides implemented, Section 5.6 documentation added |
| 1.8 | 17 Jan 2026 | Claude AI | AI Enablement: Added Section 11 with 9 new AI endpoints (ai-raid-categorize, ai-approval-assist, ai-anomaly-detect, ai-deliverable-assess, ai-variation-impact, ai-document-generate, ai-forecast, ai-schedule-risk, ai-portfolio-insights), model selection (Opus 4.5/Sonnet 4.5), advisory-only design principle |
| 1.9 | 17 Jan 2026 | Claude AI | AI Action Framework: Added Section 12 with 13 action tools (submit, update, complete, reassign), confirmation workflow, permission enforcement, new files (ai-actions.js, ai-action-schemas.js), chat.js upgraded to v4.0 |
