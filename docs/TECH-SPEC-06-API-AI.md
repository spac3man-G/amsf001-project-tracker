# AMSF001 Technical Specification - API Layer & AI Integration

**Version:** 1.2  
**Last Updated:** 24 December 2025  
**Session:** 1.6  
**Status:** Complete  

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
| `/api/scan-receipt` | POST | AI receipt scanning | Yes (JWT) |

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

The chat assistant has access to 12 database query tools:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `getUserProfile` | Get current user's profile | None |
| `getMyPendingActions` | Get items requiring user's attention | None |
| `getRolePermissions` | Explain role capabilities | `role?` |
| `getTimesheets` | Query timesheet entries | `status`, `dateRange`, `resourceName`, `mine` |
| `getTimesheetSummary` | Aggregated timesheet stats | `groupBy`, `dateRange` |
| `getExpenses` | Query expense entries | `status`, `dateRange`, `category`, `chargeableOnly`, `mine` |
| `getExpenseSummary` | Aggregated expense stats | `groupBy`, `dateRange` |
| `getMilestones` | Get project milestones | `status`, `overdueOnly` |
| `getDeliverables` | Get project deliverables | `status`, `milestoneName` |
| `getBudgetSummary` | Budget vs actual comparison | `groupBy` |
| `getResources` | Get team members | `partnerName` |
| `getKPIs` | Get KPI data | `category` |

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
