# AI Chat Assistant - Requirements & Technical Specification

**Document Version:** 1.0  
**Created:** 1 December 2025  
**Status:** Approved for Development  
**Priority:** Phase 2 Feature

---

## 1. Executive Summary

### Overview
Enhance the existing chat widget to become a context-aware AI assistant that can query project data, understand user roles and permissions, and provide personalised guidance on pending actions.

### Business Value
- **Reduced Navigation Time** - Users get answers without clicking through multiple screens
- **Improved Data Discovery** - Natural language queries make data more accessible
- **Proactive Guidance** - "What do I need to do next?" surfaces pending actions
- **Role-Aware Responses** - Answers are scoped to user's permissions and context

### Cost Estimate
- **100 queries/month:** ~£0.40
- **500 queries/month:** ~£2.00
- **1,000 queries/month:** ~£4.00

---

## 2. User Personas & Use Cases

### Resource Users
| Query | Expected Response |
|-------|-------------------|
| "What timesheets do I need to submit?" | Lists draft timesheets with dates and hours |
| "How many hours have I logged this month?" | Total hours with weekly breakdown |
| "What expenses am I waiting on approval for?" | Submitted expenses pending approval |
| "What's my day rate?" | Resource rate and partner assignment |

### Partner Users
| Query | Expected Response |
|-------|-------------------|
| "What's our invoice total for November?" | Invoice summary with breakdown |
| "Which of our team has outstanding timesheets?" | List of resources with draft timesheets |
| "What's our spend against budget?" | Partner-specific budget vs actual |
| "Show me submitted expenses for our team" | Partner's resource expenses |

### Approvers
| Query | Expected Response |
|-------|-------------------|
| "What's waiting for my approval?" | Timesheets and expenses needing approval |
| "Show me submitted expenses over £100" | Filtered expense list |
| "Who hasn't submitted timesheets this week?" | Resource compliance report |

### Supplier PM
| Query | Expected Response |
|-------|-------------------|
| "What milestones are at risk?" | Milestones with risk status or overdue |
| "What's the project spend to date?" | Full budget summary |
| "Which deliverables are overdue?" | Deliverables past due date |
| "Show me KPI performance" | KPI summary with trends |

### Any User
| Query | Expected Response |
|-------|-------------------|
| "What can I do in this system?" | Role capabilities explanation |
| "What's my role?" | User's role and permissions |
| "What do I need to do next?" | Personalised action items |
| "Help me understand the KPIs" | KPI explanations and current values |

---

## 3. Functional Requirements

### FR-01: Data Query Capability
**Priority:** Must Have

The assistant must be able to query and return data from:
- Timesheets (with filtering by status, date, resource, partner)
- Expenses (with filtering by status, date, resource, category, chargeable)
- Milestones (with filtering by status, due date)
- Deliverables (with filtering by status, milestone)
- Resources (with partner filtering)
- Partners (list with linked resources)
- Budget summaries (by milestone, category, month)
- KPIs (current values and trends)

### FR-02: User Context Awareness
**Priority:** Must Have

The assistant must:
- Know the current user's name, role, and permissions
- Scope all queries to data the user is permitted to see
- Understand the user's partner association (if applicable)
- Know the user's linked resource record (if applicable)

### FR-03: Pending Actions Summary
**Priority:** Must Have

The assistant must provide personalised "What do I need to do next?" responses including:
- Draft timesheets needing submission
- Draft expenses needing submission
- Items awaiting user's approval (if approver)
- Unread notifications
- Overdue items relevant to user's role

### FR-04: Role & Permissions Explanation
**Priority:** Should Have

The assistant must be able to explain:
- What the user's role allows them to do
- What the user's role does not allow them to do
- Why certain data might not be visible
- How to request elevated access if needed

### FR-05: Notification Awareness
**Priority:** Should Have

The assistant must be able to:
- List unread notifications
- Summarise notification content
- Mark notifications as discussed (not automatically read)

### FR-06: Conversational Memory
**Priority:** Should Have

Within a single chat session, the assistant should:
- Remember context from earlier in the conversation
- Allow follow-up questions ("Just show Will's")
- Not persist conversation history between sessions

---

## 4. Non-Functional Requirements

### NFR-01: Response Time
- Target: < 3 seconds for simple queries
- Target: < 5 seconds for complex multi-tool queries
- Acceptable: < 8 seconds for data-heavy responses

### NFR-02: Accuracy
- Financial totals must be 100% accurate
- Date filtering must be precise
- Role scoping must be enforced at query level

### NFR-03: Security
- All queries must respect Row Level Security policies
- No data leakage between users/partners
- Audit logging for sensitive queries (optional)

### NFR-04: Availability
- Graceful degradation if AI service unavailable
- Clear error messages for users
- Fallback to "try again" messaging

### NFR-05: Cost Control
- Use Claude Haiku 3.5 (most cost-effective)
- Token usage monitoring
- Rate limiting per user if needed

---

## 5. Technical Specification

### 5.1 Architecture Overview

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Chat Widget   │────▶│  Supabase Edge      │────▶│   Claude     │
│   (React)       │◀────│  Function           │◀────│   Haiku      │
└─────────────────┘     └─────────────────────┘     └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Supabase   │
                        │   Database   │
                        └──────────────┘
```

### 5.2 Conversation Flow

1. User types question in chat widget
2. Widget sends message + context (userId, projectId, role) to Edge Function
3. Edge Function constructs system prompt with tool definitions
4. Claude receives prompt and decides which tool(s) to call
5. Edge Function executes database queries for requested tools
6. Results returned to Claude
7. Claude synthesises natural language response
8. Response sent back to chat widget

### 5.3 Tool Definitions

#### User Context Tools

```javascript
// getUserProfile
{
  name: "getUserProfile",
  description: "Get the current user's profile information including name, email, role, and associated partner/resource",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}

// getRolePermissions
{
  name: "getRolePermissions",
  description: "Get the list of capabilities and restrictions for a role. Use to answer questions about what the user can or cannot do.",
  parameters: {
    type: "object",
    properties: {
      role: {
        type: "string",
        description: "Role to get permissions for. Defaults to current user's role if not specified.",
        enum: ["Admin", "Supplier PM", "Partner Admin", "Partner User", "Resource"]
      }
    },
    required: []
  }
}

// getMyPendingActions
{
  name: "getMyPendingActions",
  description: "Get items requiring the current user's attention: draft timesheets to submit, draft expenses to submit, items awaiting approval, unread notifications. Use for 'what do I need to do' queries.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}

// getNotifications
{
  name: "getNotifications",
  description: "Get the user's notifications",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["unread", "all"],
        description: "Filter by read status"
      },
      limit: {
        type: "number",
        description: "Maximum notifications to return (default 10)"
      }
    },
    required: []
  }
}
```

#### Timesheet Tools

```javascript
// getTimesheets
{
  name: "getTimesheets",
  description: "Get timesheet entries with optional filtering. Returns list of timesheets with dates, hours, rates, and totals.",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Draft", "Submitted", "Approved", "Rejected", "all"],
        description: "Filter by approval status"
      },
      dateRange: {
        type: "string",
        enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "custom"],
        description: "Predefined date range"
      },
      startDate: {
        type: "string",
        description: "Start date for custom range (ISO format)"
      },
      endDate: {
        type: "string",
        description: "End date for custom range (ISO format)"
      },
      resourceId: {
        type: "string",
        description: "Filter by specific resource ID, or 'mine' for current user"
      },
      partnerId: {
        type: "string",
        description: "Filter by partner ID"
      }
    },
    required: []
  }
}

// getTimesheetSummary
{
  name: "getTimesheetSummary",
  description: "Get aggregated timesheet statistics grouped by a dimension",
  parameters: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["resource", "partner", "week", "month", "status"],
        description: "How to group the summary"
      },
      dateRange: {
        type: "string",
        enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "all"]
      }
    },
    required: ["groupBy"]
  }
}
```

#### Expense Tools

```javascript
// getExpenses
{
  name: "getExpenses",
  description: "Get expense entries with optional filtering",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Draft", "Submitted", "Approved", "Rejected", "Paid", "all"]
      },
      dateRange: {
        type: "string",
        enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "custom"]
      },
      startDate: { type: "string" },
      endDate: { type: "string" },
      resourceId: { type: "string" },
      category: {
        type: "string",
        enum: ["Travel", "Sustenance", "Equipment", "Materials", "Other"]
      },
      chargeableOnly: {
        type: "boolean",
        description: "Only return expenses chargeable to customer"
      },
      procurementMethod: {
        type: "string",
        enum: ["partner", "supplier"],
        description: "Who paid for the expense"
      }
    },
    required: []
  }
}

// getExpenseSummary
{
  name: "getExpenseSummary",
  description: "Get aggregated expense statistics",
  parameters: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["resource", "category", "partner", "month", "status"]
      },
      dateRange: { type: "string" }
    },
    required: ["groupBy"]
  }
}
```

#### Project Progress Tools

```javascript
// getMilestones
{
  name: "getMilestones",
  description: "Get project milestones with status, progress, and budget information",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Not Started", "In Progress", "Completed", "At Risk", "all"]
      },
      dueBefore: {
        type: "string",
        description: "Find milestones due before this date (ISO format)"
      },
      overdueOnly: {
        type: "boolean",
        description: "Only return overdue milestones"
      }
    },
    required: []
  }
}

// getDeliverables
{
  name: "getDeliverables",
  description: "Get deliverables with status and ownership information",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["Not Started", "In Progress", "Completed", "Blocked", "all"]
      },
      milestoneId: {
        type: "string",
        description: "Filter by specific milestone"
      },
      overdueOnly: { type: "boolean" }
    },
    required: []
  }
}

// getKPIs
{
  name: "getKPIs",
  description: "Get KPI current values, targets, and performance status",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter by KPI category"
      }
    },
    required: []
  }
}
```

#### Budget & Financial Tools

```javascript
// getBudgetSummary
{
  name: "getBudgetSummary",
  description: "Get budget vs actual spend comparison",
  parameters: {
    type: "object",
    properties: {
      groupBy: {
        type: "string",
        enum: ["milestone", "category", "month", "resource", "overall"]
      }
    },
    required: []
  }
}

// getPartnerInvoiceSummary
{
  name: "getPartnerInvoiceSummary",
  description: "Get invoice totals and breakdown for a partner",
  parameters: {
    type: "object",
    properties: {
      partnerId: { type: "string" },
      dateRange: { type: "string" }
    },
    required: []
  }
}
```

#### Resource & Partner Tools

```javascript
// getResources
{
  name: "getResources",
  description: "Get team members with roles, rates, and partner assignments",
  parameters: {
    type: "object",
    properties: {
      partnerId: { type: "string" },
      activeOnly: { type: "boolean" }
    },
    required: []
  }
}

// getPartners
{
  name: "getPartners",
  description: "Get partner organisations with resource counts",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}
```

### 5.4 Permission Scoping Matrix

| Role | Data Access |
|------|-------------|
| Resource | Own timesheets/expenses only |
| Partner User | Own partner's resources and data |
| Partner Admin | Same as Partner User + approval actions |
| Supplier PM | Full project visibility |
| Admin | Full access including system config |

### 5.5 System Prompt Template

```
You are an AI assistant for the AMSF001 Project Tracker. You help users query project data, understand their responsibilities, and navigate the system.

Current User Context:
- Name: {{userName}}
- Role: {{userRole}}
- Partner: {{partnerName}} (if applicable)
- Resource ID: {{resourceId}} (if applicable)

Guidelines:
1. Always be helpful and concise
2. If you're not sure what the user is asking, ask a clarifying question
3. For financial data, always show exact figures - don't round
4. When showing lists, summarise if more than 10 items
5. Proactively offer to drill down into details
6. If the user asks about data they can't access, explain why politely
7. Use British English and £ for currency

Available tools allow you to query timesheets, expenses, milestones, deliverables, KPIs, budgets, resources, and partners. All queries are automatically scoped to data this user can access.
```

### 5.6 Response Examples

**"What do I need to do next?" (Resource)**
```
You have a few things to take care of:

**Timesheets** - 3 draft timesheets for last week (18th-22nd Nov) need submitting. That's 24 hours unsubmitted.

**Expenses** - 2 expense claims are still in draft: a £45 travel receipt and a £23 sustenance claim.

Would you like me to show you the details, or remind you what the submission process is?
```

**"What's waiting for my approval?" (Approver)**
```
Here's what's waiting for your review:

**Timesheets** - 5 submitted timesheets from 3 team members:
- Will Kirby: 16 hours (£1,200)
- Glenn Nickols: 16 hours (£1,400)  
- Jack Randal: 8 hours (£600)

**Expenses** - 2 expenses totalling £127.50:
- Glenn Nickols: Travel £89.50
- Will Kirby: Sustenance £38.00

The oldest item has been waiting 3 days. Want me to break these down further?
```

**"What milestones are at risk?"**
```
I found 2 milestones that need attention:

1. **Technical Design** - Due in 5 days, currently 72% complete
   - 3 deliverables still in progress
   - Spend at 89% of budget

2. **Security Review** - Marked as "At Risk"
   - 2 deliverables blocked
   - Waiting on external dependency

Would you like more details on either of these?
```

---

## 6. Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Update Edge Function with tool calling loop
- [ ] Implement 4 core tools: getTimesheets, getExpenses, getMyPendingActions, getUserProfile
- [ ] Add user context passing from chat widget
- [ ] Basic error handling

### Phase 2: Extended Tools (Week 2)
- [ ] Implement milestone and deliverable tools
- [ ] Implement budget summary tools
- [ ] Implement KPI tools
- [ ] Add partner and resource tools

### Phase 3: Polish & Testing (Week 3)
- [ ] Refine system prompt based on testing
- [ ] Add role permissions explanation
- [ ] Improve error messages
- [ ] Performance optimisation
- [ ] User acceptance testing

### Phase 4: Documentation & Deployment (Week 4)
- [ ] Update user manual with AI assistant guide
- [ ] Create example query cheat sheet
- [ ] Deploy to production
- [ ] Monitor usage and costs

---

## 7. Success Criteria

### Functional
- [ ] Users can query all major data types via natural language
- [ ] "What do I need to do next?" returns accurate pending actions
- [ ] Role permissions are correctly explained
- [ ] All queries respect user's data access permissions

### Performance
- [ ] 95% of queries complete in < 5 seconds
- [ ] No timeout errors in normal operation
- [ ] Graceful handling of AI service unavailability

### User Experience
- [ ] Users report queries are easier than manual navigation
- [ ] Error messages are helpful and actionable
- [ ] Conversation context maintained within session

### Cost
- [ ] Monthly cost remains under £5 for typical usage
- [ ] No unexpected API cost spikes

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI gives incorrect financial totals | Medium | High | Always use database queries, never estimate |
| Users confused by AI limitations | Medium | Medium | Clear capability documentation |
| Cost overruns | Low | Medium | Rate limiting, usage monitoring |
| AI service outage | Low | Medium | Graceful degradation, retry logic |
| Data leakage between users | Low | Critical | Query-level permission scoping |

---

## 9. Future Enhancements (Out of Scope)

- Save queries as named reports
- Schedule regular report delivery via email
- Voice input/output
- Proactive notifications ("You usually submit timesheets on Friday...")
- Cross-project queries for multi-project users

---

## Appendix A: Token Usage Estimates

| Component | Estimated Tokens |
|-----------|------------------|
| System prompt | ~500 |
| Tool definitions (12 tools) | ~1,200 |
| User question | ~50 |
| Database results | ~500-2,000 |
| Claude response | ~200-500 |
| **Typical Total** | **~2,500-4,250** |

**Cost per query:** ~£0.003 - £0.005

---

## Appendix B: Existing Chat Infrastructure

**Current Files:**
- `api/chat.js` - Vercel Edge Function
- Chat widget component (location TBD)

**Current Model:** Claude 3.5 Haiku

**Required Changes:**
- Add tool definitions to Edge Function
- Implement tool execution loop
- Pass user context from frontend
- Handle multi-turn tool calls

---

## Appendix C: Mobile Chat Implementation (Added 6 Dec 2025)

### Overview

A dedicated full-screen mobile chat page at `/chat` provides an optimized experience for touch devices.

### Access

**URL:** `https://amsf001-project-tracker.vercel.app/chat`

### Quick Action Buttons

| Button | Query |
|--------|-------|
| 📊 Project Status | "What's the current project status?" |
| ✅ My Actions | "What do I need to do?" |
| ⏰ My Hours | "Show my timesheets this week" |
| 💵 Budget | "What's the budget status?" |
| 🎯 Milestones | "What milestones are due soon?" |
| ⚠️ At Risk | "What's at risk in the project?" |
| 📄 Deliverables | "Show deliverables awaiting review" |
| ❓ What Can I Do? | "What can my role do in this project?" |

### Mobile Optimizations

- Full viewport height (`100dvh`)
- Safe area insets for notched phones
- 44px+ touch targets
- Horizontal scrolling chips after first message
- Landscape mode (8-column grid)
- Desktop fallback (centered 420×700px card)

### Files

| File | Purpose |
|------|--------|
| `src/pages/MobileChat.jsx` | Main page component |
| `src/pages/MobileChat.css` | Touch-optimized styles |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 1 Dec 2025 | Claude/Glenn | Initial specification |
| 1.1 | 6 Dec 2025 | Claude/Glenn | Added Mobile Chat appendix |
