# AI Assistant Comprehensive Update Plan

**Created:** 7 January 2026  
**Purpose:** Bring the AI chat assistant up to date with all current application features  
**Estimated Segments:** 12  
**Estimated Total Effort:** 6-8 hours across multiple sessions

---

## Executive Summary

The AI assistant currently supports 12 database tools covering ~40% of application features. This plan adds 18+ new tools, updates page suggestions for 20+ pages, and modernises the system prompt to reflect all current capabilities including Planning, Estimator, Evaluator, Variations, and more.

---

## Master Checklist

### Phase 1: Fix Broken Promises (Segments 1-2)
- [x] **Segment 1:** Add RAID Log tools
  - [x] Add `getRaidItems` tool definition
  - [x] Add `getRaidSummary` tool definition
  - [x] Implement tool execution functions
  - [ ] Test with sample queries
  
- [x] **Segment 2:** Add Quality Standards tools
  - [x] Add `getQualityStandards` tool definition
  - [x] Add `getQualityStandardsSummary` tool definition
  - [x] Implement tool execution functions
  - [ ] Test with sample queries

### Phase 2: Major Feature Support (Segments 3-6)
- [x] **Segment 3:** Add Planning tools
  - [x] Add `getPlanItems` tool definition
  - [x] Add `getPlanSummary` tool definition
  - [x] Implement tool execution functions
  - [x] Update page suggestions for `/planning`
  
- [x] **Segment 4:** Add Estimator tools
  - [x] Add `getEstimates` tool definition
  - [x] Add `getBenchmarkRates` tool definition
  - [x] Implement tool execution functions
  - [x] Update page suggestions for `/estimator`, `/benchmarking`
  
- [x] **Segment 5:** Add Variations tools
  - [x] Add `getVariations` tool definition
  - [x] Add `getVariationsSummary` tool definition
  - [x] Implement tool execution functions
  - [x] Update page suggestions for `/variations`
  
- [x] **Segment 6:** Add Deliverable Tasks & Certificates tools
  - [x] Add `getDeliverableTasks` tool definition
  - [x] Add `getMilestoneCertificates` tool definition
  - [x] Implement tool execution functions
  - [x] Enhance existing deliverable/milestone queries

### Phase 3: Complete Coverage (Segments 7-10)
- [x] **Segment 7:** Add Partner & Invoicing tools
  - [x] Add `getPartners` tool definition
  - [x] Add `getPartnerInvoices` tool definition
  - [x] Implement tool execution functions
  - [x] Update page suggestions for `/partners`, `/finance`
  
- [x] **Segment 8:** Add Resource & Availability tools
  - [x] Add `getResourceAvailability` tool definition
  - [x] Enhance existing `getResources` with utilisation
  - [x] Implement tool execution functions
  - [x] Update page suggestions for `/resources`
  
- [x] **Segment 9:** Add Evaluator tools (Part 1 - Core)
  - [x] Add `getEvaluationProjects` tool definition
  - [x] Add `getRequirements` tool definition
  - [x] Add `getVendors` tool definition
  - [x] Implement tool execution functions
  
- [x] **Segment 10:** Add Evaluator tools (Part 2 - Extended)
  - [x] Add `getScores` tool definition
  - [x] Add `getWorkshops` tool definition
  - [x] Add `getStakeholderAreas` tool definition
  - [x] Implement tool execution functions
  - [x] Update page suggestions for all `/evaluator/*` pages

### Phase 4: UX & Polish (Segments 11-12)
- [x] **Segment 11:** Update System Prompt & Pre-fetch
  - [x] Rewrite system prompt with all features
  - [x] Add feature-aware context detection
  - [x] Update pre-fetch to include RAID, QS summaries
  - [x] Add Evaluator context when on evaluator pages
  
- [x] **Segment 12:** Complete Page Suggestions & Admin tools
  - [x] Add suggestions for remaining pages (Calendar, Reports, Settings, Admin)
  - [x] Add `getAuditLog` tool (admin only)
  - [x] Add `getOrganisationSummary` tool
  - [x] Final testing and validation
  - [x] Update documentation

---

## Detailed Segment Specifications


---

## Segment 1: RAID Log Tools

**Priority:** 🔴 Critical (suggestions exist but tool missing)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`

### Tool Definitions to Add

```javascript
{
  name: "getRaidItems",
  description: "Query RAID log items (Risks, Assumptions, Issues, Dependencies). Returns items with status, owner, priority, and dates.",
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["Risk", "Assumption", "Issue", "Dependency", "all"],
        description: "Filter by RAID type"
      },
      status: {
        type: "string",
        enum: ["Open", "In Progress", "Mitigated", "Closed", "all"],
        description: "Filter by status"
      },
      priority: {
        type: "string",
        enum: ["High", "Medium", "Low", "all"],
        description: "Filter by priority"
      },
      ownerName: {
        type: "string",
        description: "Filter by owner name"
      }
    },
    required: []
  }
},
{
  name: "getRaidSummary",
  description: "Get aggregated RAID statistics. Counts by type, status, and priority.",
  input_schema: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["type", "status", "priority", "owner"],
        description: "How to group the summary"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetRaidItems(params, context) {
  let query = supabase
    .from('raid_items')
    .select(`
      id, reference, type, title, description, status, priority,
      probability, impact, risk_score, mitigation_strategy,
      owner_user_id, owner_name, raised_date, target_date, closed_date,
      created_at, updated_at
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.ownerName) {
    query = query.ilike('owner_name', `%${params.ownerName}%`);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  return {
    items: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetRaidSummary(params, context) {
  const { data, error } = await supabase
    .from('raid_items')
    .select('id, type, status, priority, owner_name')
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) throw error;
  
  const items = data || [];
  const groupBy = params.groupBy || 'type';
  
  const summary = {
    total: items.length,
    byType: {
      Risk: items.filter(i => i.type === 'Risk').length,
      Assumption: items.filter(i => i.type === 'Assumption').length,
      Issue: items.filter(i => i.type === 'Issue').length,
      Dependency: items.filter(i => i.type === 'Dependency').length,
    },
    byStatus: {
      Open: items.filter(i => i.status === 'Open').length,
      'In Progress': items.filter(i => i.status === 'In Progress').length,
      Mitigated: items.filter(i => i.status === 'Mitigated').length,
      Closed: items.filter(i => i.status === 'Closed').length,
    },
    byPriority: {
      High: items.filter(i => i.priority === 'High').length,
      Medium: items.filter(i => i.priority === 'Medium').length,
      Low: items.filter(i => i.priority === 'Low').length,
    },
    openHighPriority: items.filter(i => i.status === 'Open' && i.priority === 'High').length,
  };
  
  return summary;
}
```

### Testing Queries
- "Show open risks"
- "What issues need attention?"
- "List high-priority risks"
- "RAID summary"
- "Show assumptions"

### Completion Checklist
- [x] Tool definitions added to TOOLS array
- [x] Execution functions implemented
- [x] Tool router updated in executeTool switch
- [x] Error messages added for raid tools
- [ ] Tested with 5 sample queries

---

## Segment 2: Quality Standards Tools

**Priority:** 🔴 Critical (suggestions exist but tool missing)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`

### Tool Definitions to Add

```javascript
{
  name: "getQualityStandards",
  description: "Query quality standards with compliance status and assessments.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Compliant", "Partially Compliant", "Non-Compliant", "Not Assessed", "all"],
        description: "Filter by compliance status"
      },
      category: {
        type: "string",
        description: "Filter by quality standard category"
      }
    },
    required: []
  }
},
{
  name: "getQualityStandardsSummary",
  description: "Get aggregated quality standards compliance statistics.",
  input_schema: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["status", "category"],
        description: "How to group the summary"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetQualityStandards(params, context) {
  let query = supabase
    .from('quality_standards')
    .select(`
      id, reference, name, description, category, status,
      compliance_notes, owner, review_date,
      created_at, updated_at
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('category')
    .order('name');

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.category) {
    query = query.ilike('category', `%${params.category}%`);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  return {
    standards: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetQualityStandardsSummary(params, context) {
  const { data, error } = await supabase
    .from('quality_standards')
    .select('id, status, category')
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) throw error;
  
  const items = data || [];
  
  // Get unique categories
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  
  const summary = {
    total: items.length,
    byStatus: {
      Compliant: items.filter(i => i.status === 'Compliant').length,
      'Partially Compliant': items.filter(i => i.status === 'Partially Compliant').length,
      'Non-Compliant': items.filter(i => i.status === 'Non-Compliant').length,
      'Not Assessed': items.filter(i => i.status === 'Not Assessed' || !i.status).length,
    },
    categories: categories,
    complianceRate: items.length > 0 
      ? Math.round((items.filter(i => i.status === 'Compliant').length / items.length) * 100)
      : 0,
    needsAttention: items.filter(i => i.status === 'Non-Compliant' || i.status === 'Partially Compliant').length,
  };
  
  return summary;
}
```

### Testing Queries
- "Which quality standards need attention?"
- "Show quality compliance summary"
- "List non-compliant standards"
- "Quality standards by category"

### Completion Checklist
- [x] Tool definitions added to TOOLS array
- [x] Execution functions implemented
- [x] Tool router updated in executeTool switch
- [x] Error messages added
- [ ] Tested with sample queries

---

## Segment 1-2 Checkpoint

**After completing Segments 1-2:**

### Context Check
At this point, you've likely used **30-40%** of context window. Check:
- Can Claude still see the full chat.js file?
- Are responses still detailed and accurate?

### Validation Steps
1. Test RAID queries in the application
2. Test Quality Standards queries
3. Verify suggestions on `/raid` and `/quality-standards` pages now work

### Continue or New Chat?

**If context is getting constrained, use this AI continuation prompt:**

```
## AI Assistant Update - Continuation Prompt (After Segments 1-2)

I'm updating the AI chat assistant for the AMSF001 Project Tracker. 

### Completed:
- ✅ Segment 1: RAID Log tools (getRaidItems, getRaidSummary)
- ✅ Segment 2: Quality Standards tools (getQualityStandards, getQualityStandardsSummary)

### Next Up: Segment 3 - Planning Tools

Please read:
1. /Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-ASSISTANT-UPDATE-PLAN.md
2. /Users/glennnickols/Projects/amsf001-project-tracker/api/chat.js (to see current tool patterns)
3. /Users/glennnickols/Projects/amsf001-project-tracker/src/services/planItemsService.js (to understand plan_items structure)

Then implement Segment 3: Planning Tools according to the plan.
```

---


## Segment 3: Planning Tools

**Priority:** 🟠 High (major new feature)  
**Estimated Context:** 20-25%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getPlanItems",
  description: "Query Work Breakdown Structure (WBS) plan items. Returns hierarchical project plan with milestones, deliverables, and tasks.",
  input_schema: {
    type: "object",
    properties: {
      itemType: {
        type: "string",
        enum: ["component", "milestone", "deliverable", "task", "all"],
        description: "Filter by item type in the WBS hierarchy"
      },
      status: {
        type: "string",
        enum: ["Not Started", "In Progress", "Complete", "On Hold", "Cancelled", "all"],
        description: "Filter by status"
      },
      assignedTo: {
        type: "string",
        description: "Filter by assigned resource name"
      },
      parentId: {
        type: "string",
        description: "Get children of a specific parent item"
      },
      overdueOnly: {
        type: "boolean",
        description: "Only return items past their end date that aren't complete"
      }
    },
    required: []
  }
},
{
  name: "getPlanSummary",
  description: "Get aggregated planning statistics including item counts, progress, and timeline overview.",
  input_schema: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["type", "status", "assignee", "month"],
        description: "How to group the summary"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetPlanItems(params, context) {
  let query = supabase
    .from('plan_items')
    .select(`
      id, wbs_number, name, description, item_type, status, progress,
      start_date, end_date, duration_days, estimated_hours, actual_hours,
      assigned_to, parent_id, sort_order, is_baseline_locked,
      linked_milestone_id, linked_deliverable_id, linked_estimate_id,
      created_at, updated_at
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('sort_order', { ascending: true });

  if (params.itemType && params.itemType !== 'all') {
    query = query.eq('item_type', params.itemType);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.assignedTo) {
    query = query.ilike('assigned_to', `%${params.assignedTo}%`);
  }
  if (params.parentId) {
    query = query.eq('parent_id', params.parentId);
  }
  if (params.overdueOnly) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('end_date', today).neq('status', 'Complete');
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  
  return {
    items: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetPlanSummary(params, context) {
  const { data, error } = await supabase
    .from('plan_items')
    .select('id, item_type, status, progress, assigned_to, start_date, end_date, estimated_hours, actual_hours')
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) throw error;
  
  const items = data || [];
  const today = new Date().toISOString().split('T')[0];
  
  const summary = {
    total: items.length,
    byType: {
      component: items.filter(i => i.item_type === 'component').length,
      milestone: items.filter(i => i.item_type === 'milestone').length,
      deliverable: items.filter(i => i.item_type === 'deliverable').length,
      task: items.filter(i => i.item_type === 'task').length,
    },
    byStatus: {
      'Not Started': items.filter(i => i.status === 'Not Started').length,
      'In Progress': items.filter(i => i.status === 'In Progress').length,
      'Complete': items.filter(i => i.status === 'Complete').length,
      'On Hold': items.filter(i => i.status === 'On Hold').length,
    },
    overdue: items.filter(i => i.end_date < today && i.status !== 'Complete').length,
    averageProgress: items.length > 0 
      ? Math.round(items.reduce((sum, i) => sum + (i.progress || 0), 0) / items.length)
      : 0,
    totalEstimatedHours: items.reduce((sum, i) => sum + (i.estimated_hours || 0), 0),
    totalActualHours: items.reduce((sum, i) => sum + (i.actual_hours || 0), 0),
  };
  
  return summary;
}
```

### Page Suggestions to Add (chatSuggestions.js)

```javascript
// Planning
if (path === '/planning' || path.startsWith('/planning/')) {
  return [
    { text: "Show plan summary", category: "planning" },
    { text: "What tasks are overdue?", category: "planning" },
    { text: "Show items by status", category: "planning" },
    { text: "What's assigned to me?", category: "planning" },
    { text: "Show milestone progress", category: "planning" }
  ];
}
```

### Completion Checklist
- [x] Tool definitions added to TOOLS array
- [x] Execution functions implemented
- [x] Tool router updated
- [x] Page suggestions added for /planning
- [x] Category icon added for 'planning'
- [ ] Tested with sample queries

---

## Segment 4: Estimator Tools

**Priority:** 🟠 High (major new feature)  
**Estimated Context:** 20-25%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getEstimates",
  description: "Query project cost estimates with components, tasks, and resource allocations.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Draft", "In Review", "Approved", "Rejected", "all"],
        description: "Filter by estimate status"
      },
      linkedPlanItemId: {
        type: "string",
        description: "Get estimate linked to a specific plan item"
      }
    },
    required: []
  }
},
{
  name: "getBenchmarkRates",
  description: "Query SFIA 8 benchmark day rates by skill, level, and tier. Use this to look up rates for resource types.",
  input_schema: {
    type: "object",
    properties: {
      categoryId: {
        type: "string",
        description: "SFIA 8 category ID (e.g., 'STGY' for Strategy)"
      },
      skillId: {
        type: "string",
        description: "SFIA 8 skill ID (e.g., 'ARCH' for Solution Architecture)"
      },
      sfiaLevel: {
        type: "integer",
        description: "SFIA level (1-7)"
      },
      tier: {
        type: "string",
        enum: ["contractor", "boutique", "mid", "big4"],
        description: "Supplier tier"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetEstimates(params, context) {
  let query = supabase
    .from('estimates')
    .select(`
      id, name, description, status, version,
      total_days, total_cost, contingency_percent,
      linked_plan_item_id, approved_by, approved_at,
      created_at, updated_at,
      estimate_components (
        id, name, quantity, component_total_days, component_total_cost
      )
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('created_at', { ascending: false });

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.linkedPlanItemId) {
    query = query.eq('linked_plan_item_id', params.linkedPlanItemId);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;
  
  return {
    estimates: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetBenchmarkRates(params, context) {
  let query = supabase
    .from('benchmark_rates')
    .select(`
      id, category_id, category_name, subcategory_id, subcategory_name,
      skill_id, skill_name, sfia_level, tier, day_rate,
      description
    `)
    .order('category_name')
    .order('skill_name')
    .order('sfia_level');

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }
  if (params.skillId) {
    query = query.eq('skill_id', params.skillId);
  }
  if (params.sfiaLevel) {
    query = query.eq('sfia_level', params.sfiaLevel);
  }
  if (params.tier) {
    query = query.eq('tier', params.tier);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  
  return {
    rates: data || [],
    count: data?.length || 0,
    filters: params,
    note: "Rates are daily rates in GBP"
  };
}
```

### Page Suggestions to Add

```javascript
// Estimator
if (path === '/estimator' || path.startsWith('/estimator/')) {
  return [
    { text: "Show all estimates", category: "estimates" },
    { text: "What's the total estimated cost?", category: "estimates" },
    { text: "Show approved estimates", category: "estimates" },
    { text: "List estimate components", category: "estimates" }
  ];
}

// Benchmarking
if (path === '/benchmarking') {
  return [
    { text: "Show SFIA 8 rates", category: "rates" },
    { text: "What's the rate for a Level 5 Architect?", category: "rates" },
    { text: "Compare contractor vs Big 4 rates", category: "rates" },
    { text: "Show rates by category", category: "rates" }
  ];
}
```

### Completion Checklist
- [x] Tool definitions added to TOOLS array
- [x] Execution functions implemented
- [x] Tool router updated
- [x] Page suggestions for /estimator, /benchmarking
- [x] Category icons for 'estimates', 'rates'
- [ ] Tested with sample queries

---

## Segment 5: Variations Tools

**Priority:** 🟠 High (workflow feature)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getVariations",
  description: "Query project variations (change requests). Returns variations with status, cost impact, and approval workflow.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Implemented", "all"],
        description: "Filter by variation status"
      },
      type: {
        type: "string",
        enum: ["Scope Change", "Timeline Change", "Budget Change", "Resource Change", "all"],
        description: "Filter by variation type"
      }
    },
    required: []
  }
},
{
  name: "getVariationsSummary",
  description: "Get aggregated variation statistics including total cost impact and approval rates.",
  input_schema: {
    type: "object",
    properties: {
      includeImplemented: {
        type: "boolean",
        description: "Include implemented variations in totals"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetVariations(params, context) {
  let query = supabase
    .from('variations')
    .select(`
      id, reference, title, description, type, status,
      cost_impact, timeline_impact_days, justification,
      requested_by, requested_date, approved_by, approved_date,
      created_at, updated_at,
      variation_milestones (milestone_id),
      variation_deliverables (deliverable_id)
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('created_at', { ascending: false });

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  return {
    variations: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetVariationsSummary(params, context) {
  const { data, error } = await supabase
    .from('variations')
    .select('id, status, type, cost_impact, timeline_impact_days')
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) throw error;
  
  const items = data || [];
  const includeImpl = params.includeImplemented !== false;
  
  const relevantItems = includeImpl 
    ? items 
    : items.filter(i => i.status !== 'Implemented');
  
  const approved = items.filter(i => ['Approved', 'Implemented'].includes(i.status));
  
  const summary = {
    total: items.length,
    byStatus: {
      Draft: items.filter(i => i.status === 'Draft').length,
      Submitted: items.filter(i => i.status === 'Submitted').length,
      'Under Review': items.filter(i => i.status === 'Under Review').length,
      Approved: items.filter(i => i.status === 'Approved').length,
      Rejected: items.filter(i => i.status === 'Rejected').length,
      Implemented: items.filter(i => i.status === 'Implemented').length,
    },
    byType: {
      'Scope Change': items.filter(i => i.type === 'Scope Change').length,
      'Timeline Change': items.filter(i => i.type === 'Timeline Change').length,
      'Budget Change': items.filter(i => i.type === 'Budget Change').length,
      'Resource Change': items.filter(i => i.type === 'Resource Change').length,
    },
    totalCostImpact: relevantItems.reduce((sum, i) => sum + (i.cost_impact || 0), 0),
    approvedCostImpact: approved.reduce((sum, i) => sum + (i.cost_impact || 0), 0),
    totalTimelineImpact: relevantItems.reduce((sum, i) => sum + (i.timeline_impact_days || 0), 0),
    pendingCount: items.filter(i => ['Submitted', 'Under Review'].includes(i.status)).length,
  };
  
  return summary;
}
```

### Page Suggestions to Add

```javascript
// Variations
if (path === '/variations' || path.startsWith('/variations/')) {
  return [
    { text: "Show pending variations", category: "variations" },
    { text: "What's the total cost impact?", category: "variations" },
    { text: "List approved variations", category: "variations" },
    { text: "Show variations by type", category: "variations" },
    { text: "Variations summary", category: "variations" }
  ];
}
```

### Completion Checklist
- [x] Tool definitions added
- [x] Execution functions implemented
- [x] Tool router updated
- [x] Page suggestions for /variations
- [x] Category icon for 'variations'
- [ ] Tested

---

## Segment 6: Deliverable Tasks & Certificates Tools

**Priority:** 🟠 High (enhances existing features)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`

### Tool Definitions to Add

```javascript
{
  name: "getDeliverableTasks",
  description: "Query tasks within deliverables. Returns task breakdown with status, assignees, and completion.",
  input_schema: {
    type: "object",
    properties: {
      deliverableId: {
        type: "string",
        description: "Filter by specific deliverable"
      },
      status: {
        type: "string",
        enum: ["Not Started", "In Progress", "Complete", "Blocked", "all"],
        description: "Filter by task status"
      },
      assignedTo: {
        type: "string",
        description: "Filter by assigned resource"
      }
    },
    required: []
  }
},
{
  name: "getMilestoneCertificates",
  description: "Query milestone payment certificates with approval status and amounts.",
  input_schema: {
    type: "object",
    properties: {
      milestoneId: {
        type: "string",
        description: "Filter by specific milestone"
      },
      status: {
        type: "string",
        enum: ["Draft", "Submitted", "Approved", "Paid", "all"],
        description: "Filter by certificate status"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetDeliverableTasks(params, context) {
  let query = supabase
    .from('deliverable_tasks')
    .select(`
      id, name, description, status, progress,
      assigned_to, estimated_hours, actual_hours,
      start_date, due_date, completed_date, comment,
      deliverable_id, sort_order,
      deliverables!inner (id, name, project_id)
    `)
    .eq('deliverables.project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('sort_order');

  if (params.deliverableId) {
    query = query.eq('deliverable_id', params.deliverableId);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.assignedTo) {
    query = query.ilike('assigned_to', `%${params.assignedTo}%`);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  
  return {
    tasks: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetMilestoneCertificates(params, context) {
  let query = supabase
    .from('milestone_certificates')
    .select(`
      id, certificate_number, status, amount, currency,
      issued_date, approved_date, paid_date,
      approved_by, notes,
      milestone_id,
      milestones!inner (id, name, project_id)
    `)
    .eq('milestones.project_id', context.projectId)
    .order('issued_date', { ascending: false });

  if (params.milestoneId) {
    query = query.eq('milestone_id', params.milestoneId);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  const totalAmount = (data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const paidAmount = (data || []).filter(c => c.status === 'Paid').reduce((sum, c) => sum + (c.amount || 0), 0);
  
  return {
    certificates: data || [],
    count: data?.length || 0,
    totalAmount,
    paidAmount,
    outstandingAmount: totalAmount - paidAmount,
    filters: params
  };
}
```

### Completion Checklist
- [x] Tool definitions added
- [x] Execution functions implemented
- [x] Tool router updated
- [ ] Tested with sample queries

---

## Segment 3-6 Checkpoint

**After completing Segments 3-6:**

### Context Check
At this point, you've likely used **60-75%** of context window. This is a natural stopping point.

### Validation Steps
1. Test Planning queries ("Show plan summary", "What tasks are overdue?")
2. Test Estimator queries ("Show estimates", "What's the rate for Level 5 Architect?")
3. Test Variations queries ("Show pending variations", "Total cost impact")
4. Test new tools on respective pages

### Continue or New Chat?

**Use this AI continuation prompt for Phase 3:**

```
## AI Assistant Update - Continuation Prompt (After Phase 2)

I'm updating the AI chat assistant for the AMSF001 Project Tracker.

### Completed:
**Phase 1 - Fix Broken Promises:**
- ✅ Segment 1: RAID Log tools (getRaidItems, getRaidSummary)
- ✅ Segment 2: Quality Standards tools (getQualityStandards, getQualityStandardsSummary)

**Phase 2 - Major Feature Support:**
- ✅ Segment 3: Planning tools (getPlanItems, getPlanSummary)
- ✅ Segment 4: Estimator tools (getEstimates, getBenchmarkRates)
- ✅ Segment 5: Variations tools (getVariations, getVariationsSummary)
- ✅ Segment 6: Deliverable Tasks & Certificates (getDeliverableTasks, getMilestoneCertificates)

### Next Up: Phase 3 - Complete Coverage (Segments 7-10)

Please read:
1. /Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-ASSISTANT-UPDATE-PLAN.md
2. /Users/glennnickols/Projects/amsf001-project-tracker/api/chat.js (to see current state)
3. /Users/glennnickols/Projects/amsf001-project-tracker/src/services/evaluator/ (for Evaluator structure)

Implement Segments 7-10 according to the plan:
- Segment 7: Partner & Invoicing tools
- Segment 8: Resource & Availability tools  
- Segment 9: Evaluator tools (Part 1)
- Segment 10: Evaluator tools (Part 2)
```

---


## Segment 7: Partner & Invoicing Tools

**Priority:** 🟡 Medium (financial operations)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getPartners",
  description: "Query project partners with contact details, resource counts, and spend totals.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Active", "Inactive", "all"],
        description: "Filter by partner status"
      },
      withResources: {
        type: "boolean",
        description: "Include resource count for each partner"
      }
    },
    required: []
  }
},
{
  name: "getPartnerInvoices",
  description: "Query partner invoices with line items, amounts, and payment status.",
  input_schema: {
    type: "object",
    properties: {
      partnerId: {
        type: "string",
        description: "Filter by specific partner"
      },
      status: {
        type: "string",
        enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled", "all"],
        description: "Filter by invoice status"
      },
      dateRange: {
        type: "string",
        enum: ["thisMonth", "lastMonth", "thisQuarter", "thisYear", "all"],
        description: "Filter by invoice date range"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetPartners(params, context) {
  let query = supabase
    .from('partners')
    .select(`
      id, name, contact_name, contact_email, contact_phone,
      address, status, payment_terms, notes,
      created_at, updated_at,
      resources (id)
    `)
    .eq('project_id', context.projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  const partners = (data || []).map(p => ({
    ...p,
    resourceCount: p.resources?.length || 0,
    resources: undefined // Remove nested array from response
  }));
  
  return {
    partners,
    count: partners.length,
    filters: params
  };
}

async function executeGetPartnerInvoices(params, context) {
  let query = supabase
    .from('partner_invoices')
    .select(`
      id, invoice_number, status, invoice_date, due_date, paid_date,
      subtotal, tax_amount, total_amount, currency, notes,
      partner_id,
      partners!inner (id, name, project_id),
      partner_invoice_lines (id, description, quantity, unit_price, line_total)
    `)
    .eq('partners.project_id', context.projectId)
    .order('invoice_date', { ascending: false });

  if (params.partnerId) {
    query = query.eq('partner_id', params.partnerId);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.dateRange && params.dateRange !== 'all') {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('invoice_date', range.start).lte('invoice_date', range.end);
    }
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  const totalAmount = (data || []).reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const paidAmount = (data || []).filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
  
  return {
    invoices: data || [],
    count: data?.length || 0,
    totalAmount,
    paidAmount,
    outstandingAmount: totalAmount - paidAmount,
    filters: params
  };
}
```

### Page Suggestions to Add

```javascript
// Partners (already partially exists, enhance it)
if (path === '/partners' || path.startsWith('/partners/')) {
  return [
    { text: "Show all partners", category: "partners" },
    { text: "Partner spend breakdown", category: "partners" },
    { text: "List active partners", category: "partners" },
    { text: "Partner hours this month", category: "partners" },
    { text: "Show partner invoices", category: "invoices" }
  ];
}

// Finance Hub
if (path === '/finance' || path.startsWith('/finance/')) {
  return [
    { text: "Show outstanding invoices", category: "invoices" },
    { text: "Total invoiced this month", category: "invoices" },
    { text: "Invoice status summary", category: "invoices" },
    { text: "Budget vs actual spend", category: "budget" }
  ];
}
```

### Completion Checklist
- [x] Tool definitions added
- [x] Execution functions implemented
- [x] Tool router updated
- [x] Page suggestions for /partners, /finance
- [x] Category icon for 'invoices'
- [ ] Tested

---

## Segment 8: Resource & Availability Tools

**Priority:** 🟡 Medium (enhances existing)  
**Estimated Context:** 10-15%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getResourceAvailability",
  description: "Query resource availability and capacity allocation over time.",
  input_schema: {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "Filter by specific resource"
      },
      dateRange: {
        type: "string",
        enum: ["thisWeek", "nextWeek", "thisMonth", "nextMonth", "thisQuarter", "all"],
        description: "Time period for availability"
      },
      availableOnly: {
        type: "boolean",
        description: "Only show resources with available capacity"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetResourceAvailability(params, context) {
  let query = supabase
    .from('resource_availability')
    .select(`
      id, resource_id, week_start, available_hours, allocated_hours,
      notes,
      resources!inner (id, name, project_id, daily_rate_cost, daily_rate_sale)
    `)
    .eq('resources.project_id', context.projectId)
    .order('week_start', { ascending: true });

  if (params.resourceId) {
    query = query.eq('resource_id', params.resourceId);
  }
  if (params.dateRange && params.dateRange !== 'all') {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('week_start', range.start).lte('week_start', range.end);
    }
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  
  let availability = data || [];
  
  if (params.availableOnly) {
    availability = availability.filter(a => 
      (a.available_hours || 0) > (a.allocated_hours || 0)
    );
  }
  
  // Calculate summary
  const totalAvailable = availability.reduce((sum, a) => sum + (a.available_hours || 0), 0);
  const totalAllocated = availability.reduce((sum, a) => sum + (a.allocated_hours || 0), 0);
  
  return {
    availability,
    count: availability.length,
    totalAvailable,
    totalAllocated,
    utilisation: totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0,
    filters: params
  };
}
```

### Enhance Existing getResources

Add to `executeGetResources`:
```javascript
// Add utilisation calculation
const resourcesWithUtilisation = (data || []).map(r => ({
  ...r,
  // If resource has timesheets this month, calculate utilisation
  utilisationPercent: r.availability_hours > 0 
    ? Math.round((r.hours_logged || 0) / r.availability_hours * 100)
    : null
}));
```

### Page Suggestions Update

```javascript
// Resources (enhance existing)
if (path === '/resources' || path.startsWith('/resources/')) {
  return [
    { text: "Show resource utilization", category: "resources" },
    { text: "Who has availability this week?", category: "resources" },
    { text: "List resources by partner", category: "resources" },
    { text: "Show resource capacity", category: "resources" },
    { text: "Who's working on what?", category: "resources" }
  ];
}
```

### Completion Checklist
- [x] Tool definition added
- [x] Execution function implemented
- [x] Existing getResources enhanced
- [x] Tool router updated
- [x] Page suggestions updated
- [ ] Tested

---

## Segment 9: Evaluator Tools (Part 1 - Core)

**Priority:** 🟡 Medium (new module)  
**Estimated Context:** 20-25%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getEvaluationProjects",
  description: "Query software evaluation projects with status and summary metrics.",
  input_schema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Planning", "Requirements", "Vendor Selection", "Scoring", "Complete", "all"],
        description: "Filter by evaluation status"
      }
    },
    required: []
  }
},
{
  name: "getRequirements",
  description: "Query evaluation requirements with priority, category, and approval status.",
  input_schema: {
    type: "object",
    properties: {
      evaluationId: {
        type: "string",
        description: "Filter by evaluation project (required for most queries)"
      },
      priority: {
        type: "string",
        enum: ["Must Have", "Should Have", "Could Have", "Won't Have", "all"],
        description: "Filter by MoSCoW priority"
      },
      status: {
        type: "string",
        enum: ["Draft", "Pending Approval", "Approved", "Rejected", "all"],
        description: "Filter by approval status"
      },
      categoryId: {
        type: "string",
        description: "Filter by requirement category"
      }
    },
    required: []
  }
},
{
  name: "getVendors",
  description: "Query vendors in an evaluation with response status and scores.",
  input_schema: {
    type: "object",
    properties: {
      evaluationId: {
        type: "string",
        description: "Filter by evaluation project (required)"
      },
      status: {
        type: "string",
        enum: ["Invited", "Responding", "Submitted", "Under Review", "Shortlisted", "Rejected", "all"],
        description: "Filter by vendor status"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetEvaluationProjects(params, context) {
  // Note: Evaluations may be linked to an organisation, not just a project
  let query = supabase
    .from('evaluation_projects')
    .select(`
      id, name, description, client_name, status,
      start_date, end_date, settings,
      created_at, updated_at
    `)
    .order('created_at', { ascending: false });

  // Filter by org if user has org context
  if (context.userContext?.organisationId) {
    query = query.eq('organisation_id', context.userContext.organisationId);
  }
  
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;
  
  return {
    evaluations: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetRequirements(params, context) {
  if (!params.evaluationId) {
    return { error: "evaluationId is required to query requirements" };
  }
  
  let query = supabase
    .from('requirements')
    .select(`
      id, reference, title, description, priority, status,
      category_id, stakeholder_area_id, source, rationale,
      ai_generated, ai_confidence,
      created_at, updated_at,
      evaluation_categories (id, name),
      stakeholder_areas (id, name)
    `)
    .eq('evaluation_id', params.evaluationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('reference');

  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  
  // Summary stats
  const items = data || [];
  const summary = {
    total: items.length,
    byPriority: {
      'Must Have': items.filter(r => r.priority === 'Must Have').length,
      'Should Have': items.filter(r => r.priority === 'Should Have').length,
      'Could Have': items.filter(r => r.priority === 'Could Have').length,
      'Won\'t Have': items.filter(r => r.priority === 'Won\'t Have').length,
    },
    byStatus: {
      Draft: items.filter(r => r.status === 'Draft').length,
      'Pending Approval': items.filter(r => r.status === 'Pending Approval').length,
      Approved: items.filter(r => r.status === 'Approved').length,
    },
    aiGenerated: items.filter(r => r.ai_generated).length,
  };
  
  return {
    requirements: items,
    count: items.length,
    summary,
    filters: params
  };
}

async function executeGetVendors(params, context) {
  if (!params.evaluationId) {
    return { error: "evaluationId is required to query vendors" };
  }
  
  let query = supabase
    .from('vendors')
    .select(`
      id, name, contact_name, contact_email, website,
      status, shortlist_rank, notes,
      invited_date, response_due_date, submitted_date,
      created_at, updated_at
    `)
    .eq('evaluation_id', params.evaluationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('shortlist_rank', { nullsLast: true })
    .order('name');

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  return {
    vendors: data || [],
    count: data?.length || 0,
    shortlisted: (data || []).filter(v => v.status === 'Shortlisted').length,
    filters: params
  };
}
```

### Completion Checklist
- [x] Tool definitions added
- [x] Execution functions implemented
- [x] Tool router updated
- [ ] Tested with sample queries

---

## Segment 10: Evaluator Tools (Part 2 - Extended)

**Priority:** 🟡 Medium (new module)  
**Estimated Context:** 20-25%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`

### Tool Definitions to Add

```javascript
{
  name: "getScores",
  description: "Query vendor scores for requirements with individual and consensus scores.",
  input_schema: {
    type: "object",
    properties: {
      evaluationId: {
        type: "string",
        description: "Filter by evaluation project (required)"
      },
      vendorId: {
        type: "string",
        description: "Filter by specific vendor"
      },
      requirementId: {
        type: "string",
        description: "Filter by specific requirement"
      },
      consensusOnly: {
        type: "boolean",
        description: "Only return consensus scores"
      }
    },
    required: []
  }
},
{
  name: "getWorkshops",
  description: "Query evaluation workshops with attendees and survey responses.",
  input_schema: {
    type: "object",
    properties: {
      evaluationId: {
        type: "string",
        description: "Filter by evaluation project"
      },
      status: {
        type: "string",
        enum: ["Scheduled", "In Progress", "Completed", "Cancelled", "all"],
        description: "Filter by workshop status"
      }
    },
    required: []
  }
},
{
  name: "getStakeholderAreas",
  description: "Query stakeholder areas/departments for an evaluation.",
  input_schema: {
    type: "object",
    properties: {
      evaluationId: {
        type: "string",
        description: "Filter by evaluation project"
      }
    },
    required: []
  }
}
```

### Implementation Functions

```javascript
async function executeGetScores(params, context) {
  if (!params.evaluationId) {
    return { error: "evaluationId is required to query scores" };
  }
  
  if (params.consensusOnly) {
    // Get consensus scores
    let query = supabase
      .from('consensus_scores')
      .select(`
        id, requirement_id, vendor_id, score, weighted_score, notes,
        finalised_by, finalised_at,
        requirements (id, reference, title),
        vendors (id, name)
      `)
      .eq('evaluation_id', params.evaluationId);

    if (params.vendorId) {
      query = query.eq('vendor_id', params.vendorId);
    }
    if (params.requirementId) {
      query = query.eq('requirement_id', params.requirementId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return {
      scores: data || [],
      count: data?.length || 0,
      type: 'consensus',
      filters: params
    };
  } else {
    // Get individual scores
    let query = supabase
      .from('scores')
      .select(`
        id, requirement_id, vendor_id, scorer_id, score, weighted_score, notes,
        created_at,
        requirements (id, reference, title),
        vendors (id, name)
      `)
      .eq('evaluation_id', params.evaluationId);

    if (params.vendorId) {
      query = query.eq('vendor_id', params.vendorId);
    }
    if (params.requirementId) {
      query = query.eq('requirement_id', params.requirementId);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;
    
    return {
      scores: data || [],
      count: data?.length || 0,
      type: 'individual',
      filters: params
    };
  }
}

async function executeGetWorkshops(params, context) {
  let query = supabase
    .from('workshops')
    .select(`
      id, name, description, workshop_type, status,
      scheduled_date, duration_minutes, location, meeting_link,
      facilitator, notes,
      created_at, updated_at,
      workshop_attendees (id, user_id, attendance_status)
    `)
    .order('scheduled_date', { ascending: true });

  if (params.evaluationId) {
    query = query.eq('evaluation_id', params.evaluationId);
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  
  const workshops = (data || []).map(w => ({
    ...w,
    attendeeCount: w.workshop_attendees?.length || 0,
    workshop_attendees: undefined
  }));
  
  return {
    workshops,
    count: workshops.length,
    filters: params
  };
}

async function executeGetStakeholderAreas(params, context) {
  let query = supabase
    .from('stakeholder_areas')
    .select(`
      id, name, description, lead_user_id, weight,
      created_at
    `)
    .order('name');

  if (params.evaluationId) {
    query = query.eq('evaluation_id', params.evaluationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return {
    areas: data || [],
    count: data?.length || 0,
    filters: params
  };
}
```

### Page Suggestions for Evaluator

```javascript
// Evaluator Dashboard
if (path === '/evaluator' || path === '/evaluator/dashboard') {
  return [
    { text: "Show evaluation status", category: "evaluator" },
    { text: "How many requirements are approved?", category: "evaluator" },
    { text: "Which vendors are shortlisted?", category: "evaluator" },
    { text: "Show scoring progress", category: "evaluator" }
  ];
}

// Requirements Hub
if (path === '/evaluator/requirements' || path.startsWith('/evaluator/requirements/')) {
  return [
    { text: "Show all requirements", category: "evaluator" },
    { text: "List Must Have requirements", category: "evaluator" },
    { text: "Requirements pending approval", category: "evaluator" },
    { text: "Show AI-generated requirements", category: "evaluator" }
  ];
}

// Vendors Hub
if (path === '/evaluator/vendors' || path.startsWith('/evaluator/vendors/')) {
  return [
    { text: "Show all vendors", category: "evaluator" },
    { text: "Which vendors have submitted?", category: "evaluator" },
    { text: "Vendor response status", category: "evaluator" },
    { text: "Show shortlisted vendors", category: "evaluator" }
  ];
}

// Workshops Hub
if (path === '/evaluator/workshops') {
  return [
    { text: "Show upcoming workshops", category: "evaluator" },
    { text: "Workshop schedule", category: "evaluator" },
    { text: "Completed workshops", category: "evaluator" }
  ];
}

// Reports Hub
if (path === '/evaluator/reports') {
  return [
    { text: "Scoring summary by vendor", category: "evaluator" },
    { text: "Requirements coverage", category: "evaluator" },
    { text: "Vendor comparison", category: "evaluator" }
  ];
}
```

### Completion Checklist
- [x] Tool definitions added
- [x] Execution functions implemented  
- [x] Tool router updated
- [x] Page suggestions for all /evaluator/* pages
- [x] Category icon for 'evaluator'
- [ ] Tested with sample queries

---

## Segment 7-10 Checkpoint

**After completing Segments 7-10:**

### Context Check
At this point, you've likely used **85-95%** of context window. Strongly recommend new chat.

### Validation Steps
1. Test Partner/Invoice queries
2. Test Resource availability queries
3. Test all Evaluator queries
4. Verify page suggestions on all new pages

### Continue or New Chat?

**Use this AI continuation prompt for Phase 4:**

```
## AI Assistant Update - Continuation Prompt (After Phase 3)

I'm updating the AI chat assistant for the AMSF001 Project Tracker.

### Completed:
**Phase 1 - Fix Broken Promises:** ✅
- Segment 1: RAID Log tools
- Segment 2: Quality Standards tools

**Phase 2 - Major Feature Support:** ✅
- Segment 3: Planning tools
- Segment 4: Estimator tools
- Segment 5: Variations tools
- Segment 6: Deliverable Tasks & Certificates

**Phase 3 - Complete Coverage:** ✅
- Segment 7: Partner & Invoicing tools
- Segment 8: Resource & Availability tools
- Segment 9: Evaluator tools (Part 1)
- Segment 10: Evaluator tools (Part 2)

### Next Up: Phase 4 - UX & Polish (Segments 11-12)

Please read:
1. /Users/glennnickols/Projects/amsf001-project-tracker/docs/AI-ASSISTANT-UPDATE-PLAN.md
2. /Users/glennnickols/Projects/amsf001-project-tracker/api/chat.js
3. /Users/glennnickols/Projects/amsf001-project-tracker/api/chat-context.js
4. /Users/glennnickols/Projects/amsf001-project-tracker/src/lib/chatSuggestions.js

Implement Segments 11-12:
- Segment 11: Update System Prompt & Pre-fetch context
- Segment 12: Complete remaining page suggestions, Admin tools, Documentation
```

---


## Segment 11: Update System Prompt & Pre-fetch Context

**Priority:** 🟢 Polish (improves UX)  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`, `api/chat-context.js`

### System Prompt Updates

Replace the system prompt in `buildSystemPrompt()` to include all new features:

```javascript
function buildSystemPrompt(context) {
  const { userContext, projectContext, prefetchedContext } = context;
  
  let prompt = `You are an AI assistant for the AMSF001 Project Tracker, a comprehensive project management and software evaluation platform. You help users query data, understand workflows, and navigate the system.

## Your Capabilities

### Core Project Management
- **Timesheets & Expenses** - Query time entries, expenses, validation status
- **Milestones & Deliverables** - Track progress, certificates, task breakdowns
- **Resources & Capacity** - Team utilisation, availability, partner assignments
- **Budget & Finance** - Budget vs actual, partner invoicing, variations
- **RAID Log** - Risks, Assumptions, Issues, Dependencies
- **Quality Standards** - Compliance tracking and assessments
- **KPIs** - Performance indicators and RAG status

### Planning & Estimation
- **Work Breakdown Structure** - Hierarchical plan items (components, milestones, deliverables, tasks)
- **Estimating** - Cost estimates with SFIA 8 skill/level/tier rates
- **Benchmarking** - Day rate comparisons across supplier tiers

### Change Control
- **Variations** - Change requests with cost/timeline impact
- **Baseline Tracking** - Plan versioning and baseline protection

### Software Evaluation (Evaluator Module)
- **Evaluation Projects** - Multi-vendor software selection projects
- **Requirements** - MoSCoW prioritised requirements with approval workflow
- **Vendors** - Vendor management, RFP responses, evidence
- **Scoring** - Individual and consensus scoring with weighted calculations
- **Workshops & Surveys** - Stakeholder engagement and feedback collection

## Current Context
- **User:** ${userContext?.name || 'Unknown'} (${userContext?.email || 'Unknown'})
- **Project:** ${projectContext?.name || 'Unknown'} (${projectContext?.reference || 'Unknown'})
- **Role:** ${userContext?.role || 'Unknown'}
${userContext?.linkedResourceName ? `- **Linked Resource:** ${userContext.linkedResourceName}` : ''}
${userContext?.partnerName ? `- **Partner:** ${userContext.partnerName}` : ''}
${userContext?.organisationId ? `- **Organisation ID:** ${userContext.organisationId}` : ''}

## Navigation Help
Users can access different modules via the navigation:
- **Dashboard** - Project overview and key metrics
- **Milestones/Deliverables** - Work tracking and sign-offs
- **Timesheets/Expenses** - Time and cost capture
- **Resources** - Team and capacity management
- **Planning** - WBS editor (Excel-like grid)
- **Estimator** - Cost estimation tool
- **RAID Log** - Risk and issue management
- **Variations** - Change control
- **Evaluator** - Software evaluation projects (separate module)

## Multi-Tenancy
- Users can belong to multiple **organisations**
- Each organisation has multiple **projects**
- Users can have different roles on different projects
- The **Project Switcher** in the header allows switching projects
- All data queries are scoped to the current project`;

  // Add pre-fetched context section if available
  if (prefetchedContext) {
    prompt += `

## Current Project Data (Pre-loaded)
Use this data for quick answers without tool calls:

### Budget
- Project Budget: £${(prefetchedContext.budgetSummary?.projectBudget || 0).toLocaleString()}
- Actual Spend: £${(prefetchedContext.budgetSummary?.actualSpend || 0).toLocaleString()}
- Variance: £${(prefetchedContext.budgetSummary?.variance || 0).toLocaleString()}
- Budget Used: ${prefetchedContext.budgetSummary?.percentUsed || 0}%

### Milestones (${prefetchedContext.milestoneSummary?.total || 0} total)
${Object.entries(prefetchedContext.milestoneSummary?.byStatus || {}).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

### Deliverables (${prefetchedContext.deliverableSummary?.total || 0} total)
${Object.entries(prefetchedContext.deliverableSummary?.byStatus || {}).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

### Timesheets
- Total Hours: ${prefetchedContext.timesheetSummary?.totalHours || 0}
- Entries: ${prefetchedContext.timesheetSummary?.totalEntries || 0}

### RAID Summary
- Open Risks: ${prefetchedContext.raidSummary?.openRisks || 0}
- Open Issues: ${prefetchedContext.raidSummary?.openIssues || 0}
- High Priority: ${prefetchedContext.raidSummary?.highPriority || 0}

### Pending Actions
- Draft Timesheets: ${prefetchedContext.pendingActions?.draftTimesheets || 0}
- Awaiting Validation: ${prefetchedContext.pendingActions?.awaitingValidation || 0}`;
  }

  prompt += `

## Response Guidelines
1. Be concise and helpful
2. Use UK date format (DD/MM/YYYY) and GBP (£)
3. Use pre-loaded data when possible, tools for specific queries
4. Respect user's role - data is automatically permission-scoped
5. If a query returns no results, suggest alternatives
6. For "what do I need to do" - check pending actions first
7. Offer to drill down when appropriate
8. Don't repeat tool results verbatim - synthesise into helpful responses`;

  return prompt;
}
```

### Update Pre-fetch Context (chat-context.js)

Add RAID and Quality Standards to pre-fetched context:

```javascript
// Add to fetchWithMultipleQueries function

// 8. RAID summary
withTimeout(
  supabase
    .from('raid_items')
    .select('id, type, status, priority')
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .in('status', ['Open', 'In Progress'])
),

// 9. Quality Standards summary
withTimeout(
  supabase
    .from('quality_standards')
    .select('id, status')
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
),
```

Add to results processing:

```javascript
// Process RAID summary
if (queries[7].status === 'fulfilled' && queries[7].value.data) {
  const items = queries[7].value.data;
  results.raidSummary = {
    total: items.length,
    openRisks: items.filter(i => i.type === 'Risk' && i.status === 'Open').length,
    openIssues: items.filter(i => i.type === 'Issue' && i.status === 'Open').length,
    highPriority: items.filter(i => i.priority === 'High').length,
  };
}

// Process Quality Standards summary  
if (queries[8].status === 'fulfilled' && queries[8].value.data) {
  const items = queries[8].value.data;
  results.qualityStandardsSummary = {
    total: items.length,
    compliant: items.filter(i => i.status === 'Compliant').length,
    nonCompliant: items.filter(i => i.status === 'Non-Compliant').length,
    needsAttention: items.filter(i => ['Non-Compliant', 'Partially Compliant'].includes(i.status)).length,
  };
}
```

### Update Local Response Patterns

Add new patterns for local responses:

```javascript
const LOCAL_RESPONSE_PATTERNS = [
  // Existing patterns...
  
  // RAID patterns
  { pattern: /^how many (open )?(risks|issues)/i, type: 'raidCount' },
  { pattern: /raid.*(summary|overview)/i, type: 'raidSummary' },
  { pattern: /^(any|are there).*(risks|issues)/i, type: 'raidSummary' },
  
  // Quality Standards patterns
  { pattern: /quality.*(status|summary|compliance)/i, type: 'qualitySummary' },
  { pattern: /^(any|how many).*non.?compliant/i, type: 'qualitySummary' },
];
```

Add local response generators:

```javascript
case 'raidSummary':
  const raid = prefetchedContext.raidSummary;
  if (!raid || raid.total === 0) {
    return `✅ **No open RAID items.** The RAID log is clear.`;
  }
  return `**RAID Summary (Open Items):**

• **Risks:** ${raid.openRisks || 0} open
• **Issues:** ${raid.openIssues || 0} open  
• **High Priority:** ${raid.highPriority || 0}

${raid.highPriority > 0 ? '⚠️ There are high-priority items requiring attention.' : 'No high-priority items.'}`;

case 'qualitySummary':
  const qs = prefetchedContext.qualityStandardsSummary;
  if (!qs || qs.total === 0) {
    return `No quality standards defined for this project.`;
  }
  const complianceRate = Math.round((qs.compliant / qs.total) * 100);
  return `**Quality Standards Summary:**

• **Total Standards:** ${qs.total}
• **Compliant:** ${qs.compliant}
• **Non-Compliant:** ${qs.nonCompliant}
• **Compliance Rate:** ${complianceRate}%

${qs.needsAttention > 0 ? `⚠️ ${qs.needsAttention} standard(s) need attention.` : '✅ All standards are compliant.'}`;
```

### Completion Checklist
- [ ] System prompt rewritten with all features
- [ ] Pre-fetch context updated with RAID and QS
- [ ] Local response patterns added
- [ ] Local response generators added
- [ ] Tested instant responses for RAID/QS queries

---

## Segment 12: Complete Page Suggestions, Admin Tools & Documentation

**Priority:** 🟢 Polish  
**Estimated Context:** 15-20%  
**Files to Modify:** `api/chat.js`, `src/lib/chatSuggestions.js`, documentation

### Remaining Page Suggestions

Add to `chatSuggestions.js`:

```javascript
// Calendar
if (path === '/calendar') {
  return [
    { text: "What's happening this week?", category: "calendar" },
    { text: "Upcoming milestone dates", category: "milestones" },
    { text: "Show deadlines this month", category: "calendar" }
  ];
}

// Reports
if (path === '/reports') {
  return [
    { text: "Generate project status report", category: "reports" },
    { text: "Budget vs actual summary", category: "budget" },
    { text: "Resource utilisation report", category: "resources" }
  ];
}

// Team Members
if (path === '/team-members') {
  return [
    { text: "Show team members", category: "resources" },
    { text: "Who has which role?", category: "resources" },
    { text: "Team capacity overview", category: "resources" }
  ];
}

// Settings / Project Settings
if (path === '/settings' || path === '/project-settings') {
  return [
    { text: "What are my permissions?", category: "overview" },
    { text: "Explain my role", category: "overview" }
  ];
}

// Admin pages
if (path.startsWith('/admin')) {
  return [
    { text: "Show organisation summary", category: "admin" },
    { text: "User count by role", category: "admin" },
    { text: "Recent audit log entries", category: "admin" }
  ];
}

// Network Standards
if (path === '/network-standards') {
  return [
    { text: "Show network standards status", category: "quality" },
    { text: "Standards compliance summary", category: "quality" }
  ];
}

// Deleted Items
if (path === '/deleted-items') {
  return [
    { text: "Show recently deleted items", category: "admin" },
    { text: "What was deleted this week?", category: "admin" }
  ];
}

// Workflow Summary
if (path === '/workflow-summary') {
  return [
    { text: "What needs my approval?", category: "workflow" },
    { text: "Show pending submissions", category: "workflow" },
    { text: "Items awaiting validation", category: "workflow" }
  ];
}
```

### Admin-Only Tools

```javascript
{
  name: "getAuditLog",
  description: "Query audit log entries. Admin only. Shows who did what and when.",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "update", "delete", "login", "all"],
        description: "Filter by action type"
      },
      entityType: {
        type: "string",
        description: "Filter by entity type (e.g., 'milestone', 'timesheet')"
      },
      userId: {
        type: "string",
        description: "Filter by user ID"
      },
      dateRange: {
        type: "string",
        enum: ["today", "thisWeek", "thisMonth", "all"]
      }
    },
    required: []
  }
},
{
  name: "getOrganisationSummary",
  description: "Get organisation overview with user counts and project counts. Admin only.",
  input_schema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

### Implementation

```javascript
async function executeGetAuditLog(params, context) {
  // Admin only check
  if (!['admin'].includes(context.userContext?.role)) {
    return { error: "Audit log access requires admin role" };
  }
  
  let query = supabase
    .from('audit_log')
    .select(`
      id, action, entity_type, entity_id, 
      user_id, user_email, changes, ip_address,
      created_at
    `)
    .eq('project_id', context.projectId)
    .order('created_at', { ascending: false });

  if (params.action && params.action !== 'all') {
    query = query.eq('action', params.action);
  }
  if (params.entityType) {
    query = query.eq('entity_type', params.entityType);
  }
  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }
  if (params.dateRange && params.dateRange !== 'all') {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('created_at', range.start);
    }
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  
  return {
    entries: data || [],
    count: data?.length || 0,
    filters: params
  };
}

async function executeGetOrganisationSummary(params, context) {
  if (!['admin', 'supplier_pm'].includes(context.userContext?.role)) {
    return { error: "Organisation summary requires admin or supplier_pm role" };
  }
  
  const orgId = context.userContext?.organisationId;
  if (!orgId) {
    return { error: "No organisation context available" };
  }
  
  // Get org details
  const { data: org } = await supabase
    .from('organisations')
    .select('id, name, slug, subscription_tier, is_active')
    .eq('id', orgId)
    .single();
  
  // Get member count
  const { count: memberCount } = await supabase
    .from('user_organisations')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', orgId);
  
  // Get project count
  const { count: projectCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', orgId)
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  return {
    organisation: org,
    memberCount: memberCount || 0,
    projectCount: projectCount || 0
  };
}
```

### Update Category Icons

```javascript
export function getCategoryIcon(category) {
  const icons = {
    // Existing...
    planning: 'GitBranch',
    estimates: 'Calculator',
    rates: 'PoundSterling',
    variations: 'GitPullRequest',
    invoices: 'FileText',
    evaluator: 'ClipboardCheck',
    admin: 'Settings',
    calendar: 'Calendar',
    reports: 'FileBarChart',
  };
  
  return icons[category] || 'MessageCircle';
}
```

### Update Documentation

Update `TECH-SPEC-06-API-AI.md`:
- Add all new tools to Section 5.1 Tool Catalog
- Update tool count (12 → 30)
- Add Appendix entries for new tool schemas

Update `TECH-SPEC-07-Frontend-State.md`:
- Update ChatContext documentation
- Document new page suggestion patterns

### Final Testing Checklist
- [ ] Test queries on every page type
- [ ] Verify admin-only tools are restricted
- [ ] Test all new category icons render
- [ ] Verify pre-fetch includes RAID/QS
- [ ] Test local responses for all new patterns
- [ ] Documentation updated

---

## Final Checkpoint

**After completing all 12 segments:**

### Full Validation
1. Open chat on Dashboard - verify suggestions and quick responses
2. Navigate to each major page, verify relevant suggestions appear
3. Test each new tool with sample queries
4. Test permission restrictions (contributor can't see admin tools)
5. Test Evaluator queries (if Evaluator module is active)
6. Verify token usage tracking still works
7. Performance check - responses should be snappy

### Metrics After Update
| Metric | Before | After |
|--------|--------|-------|
| Tools | 12 | 30+ |
| Page Suggestions | 12 pages | 35+ pages |
| Pre-fetch Data | 6 summaries | 8 summaries |
| Local Response Patterns | 10 | 16+ |
| Feature Coverage | ~40% | ~95% |

---

## Appendix A: Quick Reference - All New Tools

| Tool | Segment | Tables | Priority |
|------|---------|--------|----------|
| getRaidItems | 1 | raid_items | 🔴 Critical |
| getRaidSummary | 1 | raid_items | 🔴 Critical |
| getQualityStandards | 2 | quality_standards | 🔴 Critical |
| getQualityStandardsSummary | 2 | quality_standards | 🔴 Critical |
| getPlanItems | 3 | plan_items | 🟠 High |
| getPlanSummary | 3 | plan_items | 🟠 High |
| getEstimates | 4 | estimates, estimate_components | 🟠 High |
| getBenchmarkRates | 4 | benchmark_rates | 🟠 High |
| getVariations | 5 | variations | 🟠 High |
| getVariationsSummary | 5 | variations | 🟠 High |
| getDeliverableTasks | 6 | deliverable_tasks | 🟠 High |
| getMilestoneCertificates | 6 | milestone_certificates | 🟠 High |
| getPartners | 7 | partners | 🟡 Medium |
| getPartnerInvoices | 7 | partner_invoices | 🟡 Medium |
| getResourceAvailability | 8 | resource_availability | 🟡 Medium |
| getEvaluationProjects | 9 | evaluation_projects | 🟡 Medium |
| getRequirements | 9 | requirements | 🟡 Medium |
| getVendors | 9 | vendors | 🟡 Medium |
| getScores | 10 | scores, consensus_scores | 🟡 Medium |
| getWorkshops | 10 | workshops | 🟡 Medium |
| getStakeholderAreas | 10 | stakeholder_areas | 🟡 Medium |
| getAuditLog | 12 | audit_log | 🟢 Polish |
| getOrganisationSummary | 12 | organisations | 🟢 Polish |

---

## Appendix B: Files Modified Per Segment

| Segment | Files |
|---------|-------|
| 1 | api/chat.js |
| 2 | api/chat.js |
| 3 | api/chat.js, src/lib/chatSuggestions.js |
| 4 | api/chat.js, src/lib/chatSuggestions.js |
| 5 | api/chat.js, src/lib/chatSuggestions.js |
| 6 | api/chat.js |
| 7 | api/chat.js, src/lib/chatSuggestions.js |
| 8 | api/chat.js, src/lib/chatSuggestions.js |
| 9 | api/chat.js |
| 10 | api/chat.js, src/lib/chatSuggestions.js |
| 11 | api/chat.js, api/chat-context.js |
| 12 | api/chat.js, src/lib/chatSuggestions.js, docs/*.md |

---

*Plan created: 7 January 2026*  
*Estimated completion: 6-8 hours across 3-4 sessions*
