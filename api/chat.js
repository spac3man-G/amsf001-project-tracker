// Vercel Edge Function for AI Chat Assistant
// Version 3.1 - Enhanced error handling, retry logic, and cost monitoring
// Uses Claude Haiku with function calling for database queries

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy Supabase client initialization
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// Helper to get supabase - all tool functions use this
const supabase = {
  from: (table) => getSupabase()?.from(table)
};

// ============================================
// COST MONITORING - Token Usage Logging
// ============================================

// Claude Haiku pricing (per 1M tokens, as of Dec 2024)
const TOKEN_COSTS = {
  input: 0.25,   // $0.25 per 1M input tokens
  output: 1.25,  // $1.25 per 1M output tokens
};

// In-memory usage stats (resets on cold start)
const usageStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  estimatedCostUSD: 0,
  startedAt: new Date().toISOString(),
  recentRequests: [], // Last 100 requests for analysis
};

function logTokenUsage(usage, userId, toolsUsed) {
  if (!usage) return;
  
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const costUSD = (inputTokens * TOKEN_COSTS.input / 1000000) + 
                  (outputTokens * TOKEN_COSTS.output / 1000000);
  
  // Update totals
  usageStats.totalRequests++;
  usageStats.totalInputTokens += inputTokens;
  usageStats.totalOutputTokens += outputTokens;
  usageStats.estimatedCostUSD += costUSD;
  
  // Track recent requests (keep last 100)
  usageStats.recentRequests.push({
    timestamp: new Date().toISOString(),
    userId: userId?.substring(0, 20) || 'anonymous',
    inputTokens,
    outputTokens,
    costUSD: costUSD.toFixed(6),
    toolsUsed,
  });
  
  if (usageStats.recentRequests.length > 100) {
    usageStats.recentRequests.shift();
  }
  
  // Log summary every 10 requests
  if (usageStats.totalRequests % 10 === 0) {
    console.log(`[Chat API Stats] Requests: ${usageStats.totalRequests}, ` +
                `Tokens: ${usageStats.totalInputTokens}/${usageStats.totalOutputTokens}, ` +
                `Est. Cost: $${usageStats.estimatedCostUSD.toFixed(4)}`);
  }
}

// ============================================
// RETRY LOGIC FOR DATABASE OPERATIONS
// ============================================

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'connection',
    'timeout',
    'network',
    '503',
    '502',
    '504',
  ],
};

function isRetryableError(error) {
  const errorString = String(error?.message || error).toLowerCase();
  return RETRY_CONFIG.retryableErrors.some(re => errorString.includes(re.toLowerCase()));
}

async function withRetry(operation, operationName) {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === RETRY_CONFIG.maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100,
        RETRY_CONFIG.maxDelayMs
      );
      
      console.warn(`[Retry] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================

const ERROR_MESSAGES = {
  'PGRST116': 'No matching records found for your query.',
  'PGRST301': 'Database connection issue. Please try again.',
  '42P01': 'The requested data table does not exist.',
  '42501': 'You do not have permission to access this data.',
  '23505': 'A record with this identifier already exists.',
  'timeout': 'The database query took too long. Try a more specific search.',
  'network': 'Network connection issue. Please check your connection.',
  'rate_limit': 'Too many requests. Please wait a moment and try again.',
};

function getUserFriendlyError(error, toolName) {
  const errorString = String(error?.message || error);
  const errorCode = error?.code || '';
  
  // Check for known error codes
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorCode.includes(code) || errorString.includes(code)) {
      return { 
        error: message, 
        tool: toolName, 
        recoverable: !['42P01', '42501'].includes(code) 
      };
    }
  }
  
  // Generic fallback with context
  const toolContext = {
    getUserProfile: 'fetch your profile',
    getTimesheets: 'retrieve timesheet data',
    getExpenses: 'retrieve expense data',
    getMilestones: 'fetch milestone information',
    getDeliverables: 'fetch deliverable status',
    getBudgetSummary: 'calculate budget summary',
    getResources: 'retrieve resource list',
    getKPIs: 'fetch KPI data',
  };
  
  const action = toolContext[toolName] || 'complete your request';
  return { 
    error: `Unable to ${action}. Please try again or rephrase your question.`,
    tool: toolName,
    recoverable: true,
    details: process.env.NODE_ENV === 'development' ? errorString : undefined
  };
}

// ============================================
// RESPONSE CACHING FOR COMMON QUERIES
// ============================================

const responseCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

function getCacheKey(toolName, toolInput, context) {
  // Only cache certain read-only, stable queries
  const cacheableTools = ['getUserProfile', 'getRolePermissions', 'getMilestones', 'getResources'];
  if (!cacheableTools.includes(toolName)) return null;
  
  return `${context.userContext?.email || 'anon'}:${toolName}:${JSON.stringify(toolInput)}`;
}

function getCachedResponse(cacheKey) {
  if (!cacheKey) return null;
  
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedResponse(cacheKey, data) {
  if (!cacheKey) return;
  
  // Limit cache size
  if (responseCache.size > 500) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  
  responseCache.set(cacheKey, { data, timestamp: Date.now() });
}

// ============================================
// RATE LIMITING
// ============================================

const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const rateLimitStore = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const key = `rl:${userId}`;
  let record = rateLimitStore.get(key);
  
  if (record && record.resetAt <= now) {
    rateLimitStore.delete(key);
    record = null;
  }
  
  if (!record) {
    record = { count: 1, resetAt: now + RATE_LIMIT.windowMs };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetAt: record.resetAt };
  }
  
  record.count++;
  if (record.count > RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count, resetAt: record.resetAt };
}

// ============================================
// INPUT SANITISATION
// ============================================

function sanitizeMessage(content) {
  if (!content || typeof content !== 'string') return '';
  let sanitized = content.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.trim();
  if (sanitized.length > 4000) sanitized = sanitized.substring(0, 4000);
  return sanitized;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-10)
    .filter(msg => msg && typeof msg === 'object')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeMessage(msg.content),
    }))
    .filter(msg => msg.content.length > 0);
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: "getUserProfile",
    description: "Get the current user's profile including name, email, role, partner association, and linked resource. Use this to answer questions about who the user is and what they can do.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "getMyPendingActions",
    description: "Get items requiring the current user's attention: draft timesheets to submit, draft expenses to submit, items awaiting their approval (if they're an approver), and summary counts. Use this for 'what do I need to do' or 'what's pending' queries.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "getRolePermissions",
    description: "Explain what capabilities and restrictions a role has. Use to answer 'what can I do' or 'what does my role allow' questions.",
    input_schema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: "Role to explain. If not provided, uses the current user's role.",
          enum: ["admin", "supplier_pm", "customer_pm", "partner_admin", "partner_user", "contributor"]
        }
      },
      required: []
    }
  },
  {
    name: "getTimesheets",
    description: "Query timesheet entries. Returns list of timesheets with dates, hours, resource names, rates, and totals. Automatically scoped to user's permissions.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Draft", "Submitted", "Approved", "Rejected", "all"],
          description: "Filter by approval status. Default is 'all'."
        },
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"],
          description: "Predefined date range filter."
        },
        resourceName: {
          type: "string",
          description: "Filter by resource name (partial match supported)"
        },
        mine: {
          type: "boolean",
          description: "If true, only return current user's timesheets (if they have a linked resource)"
        }
      },
      required: []
    }
  },
  {
    name: "getTimesheetSummary",
    description: "Get aggregated timesheet statistics. Use for questions about total hours, averages, or grouped summaries.",
    input_schema: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          enum: ["resource", "status", "week", "month"],
          description: "How to group the summary"
        },
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisYear", "all"]
        }
      },
      required: []
    }
  },
  {
    name: "getExpenses",
    description: "Query expense entries. Returns expenses with dates, amounts, categories, and approval status. Automatically scoped to user's permissions.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Draft", "Submitted", "Approved", "Rejected", "Paid", "all"],
          description: "Filter by status"
        },
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"]
        },
        category: {
          type: "string",
          enum: ["Travel", "Sustenance", "Equipment", "Materials", "Other"],
          description: "Filter by expense category"
        },
        resourceName: {
          type: "string",
          description: "Filter by resource name"
        },
        chargeableOnly: {
          type: "boolean",
          description: "Only return expenses marked as chargeable to customer"
        },
        mine: {
          type: "boolean",
          description: "Only return current user's expenses"
        }
      },
      required: []
    }
  },
  {
    name: "getExpenseSummary",
    description: "Get aggregated expense statistics by category, resource, or status.",
    input_schema: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          enum: ["resource", "category", "status", "month"],
          description: "How to group the summary"
        },
        dateRange: {
          type: "string",
          enum: ["thisMonth", "lastMonth", "thisYear", "all"]
        }
      },
      required: []
    }
  },
  {
    name: "getMilestones",
    description: "Get project milestones with status, progress percentage, dates, and budget information.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Not Started", "In Progress", "Completed", "At Risk", "all"]
        },
        overdueOnly: {
          type: "boolean",
          description: "Only return milestones past their planned end date that aren't completed"
        }
      },
      required: []
    }
  },
  {
    name: "getDeliverables",
    description: "Get project deliverables with status and milestone association.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Not Started", "In Progress", "Completed", "Blocked", "all"]
        },
        milestoneName: {
          type: "string",
          description: "Filter by milestone name"
        }
      },
      required: []
    }
  },
  {
    name: "getBudgetSummary",
    description: "Get budget vs actual spend comparison. Shows forecast, actual spend, variance, and percentage consumed.",
    input_schema: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          enum: ["overall", "milestone"],
          description: "Get overall project budget or breakdown by milestone"
        }
      },
      required: []
    }
  },
  {
    name: "getResources",
    description: "Get team members with their roles, daily rates, partner assignments, and utilisation.",
    input_schema: {
      type: "object",
      properties: {
        partnerName: {
          type: "string",
          description: "Filter by partner name"
        }
      },
      required: []
    }
  },
  {
    name: "getKPIs",
    description: "Get Key Performance Indicators with current values, targets, and status.",
    input_schema: {
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
];


// ============================================
// DATE HELPERS
// ============================================

function getDateRange(range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'thisWeek': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
    }
    case 'lastWeek': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() - 6);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    }
    default:
      return null;
  }
}

// ============================================
// TOOL EXECUTION FUNCTIONS
// ============================================

async function executeGetUserProfile(context) {
  const { userContext } = context;
  
  return {
    name: userContext.name || 'Unknown',
    email: userContext.email || 'Unknown',
    role: userContext.role || 'Unknown',
    roleDescription: getRoleDescription(userContext.role),
    linkedResource: userContext.linkedResourceName || null,
    linkedResourceId: userContext.linkedResourceId || null,
    partnerId: userContext.partnerId || null,
    partnerName: userContext.partnerName || null
  };
}

function getRoleDescription(role) {
  const descriptions = {
    'admin': 'Full system access including user management and settings',
    'supplier_pm': 'Project management, partner invoicing, full data visibility',
    'customer_pm': 'Timesheet approval, expense validation, deliverable review',
    'partner_admin': 'Partner data management and team oversight',
    'partner_user': 'View partner data, submit timesheets and expenses',
    'contributor': 'Submit own timesheets and expenses only'
  };
  return descriptions[role] || 'Standard user access';
}

async function executeGetRolePermissions(params, context) {
  const role = params.role || context.userContext.role;
  
  const permissions = {
    'admin': {
      canDo: [
        'Manage all users and assign roles',
        'Configure project settings',
        'View and edit all project data',
        'Manage partners and generate invoices',
        'Approve/reject all timesheets and expenses',
        'View cost prices and margins',
        'Access audit logs and deleted items'
      ],
      cannotDo: []
    },
    'supplier_pm': {
      canDo: [
        'Manage partners and generate invoices',
        'View and edit most project data',
        'See cost prices and margins',
        'Approve partner-related timesheets',
        'Validate non-chargeable expenses',
        'Manage milestones and deliverables'
      ],
      cannotDo: [
        'Manage users or change roles',
        'Modify system settings'
      ]
    },
    'customer_pm': {
      canDo: [
        'Approve/reject submitted timesheets',
        'Validate chargeable expenses',
        'Review and accept deliverables',
        'View project progress and budgets'
      ],
      cannotDo: [
        'See cost prices (only sale prices)',
        'Manage partners or invoices',
        'Edit resource allocations'
      ]
    },
    'partner_admin': {
      canDo: [
        'View own partner\'s resources and data',
        'Submit timesheets and expenses for team',
        'View invoices for own partner'
      ],
      cannotDo: [
        'See other partners\' data',
        'Approve timesheets or expenses',
        'View cost prices'
      ]
    },
    'partner_user': {
      canDo: [
        'View own partner\'s data',
        'Submit own timesheets and expenses'
      ],
      cannotDo: [
        'See other partners\' data',
        'Approve anything',
        'View financial details'
      ]
    },
    'contributor': {
      canDo: [
        'Submit own timesheets',
        'Submit own expenses',
        'View own submissions'
      ],
      cannotDo: [
        'See other users\' data',
        'Approve anything',
        'View project financials',
        'Access partner information'
      ]
    }
  };
  
  return permissions[role] || { 
    canDo: ['Basic read access'], 
    cannotDo: ['Most administrative functions'] 
  };
}

async function executeGetMyPendingActions(context) {
  const { projectId, userContext } = context;
  const result = {
    draftTimesheets: [],
    draftExpenses: [],
    awaitingMyApproval: { timesheets: 0, expenses: 0 },
    summary: ''
  };
  
  // Get user's draft timesheets (if they have a linked resource)
  if (userContext.linkedResourceId) {
    const { data: drafts } = await supabase
      .from('timesheets')
      .select('id, work_date, hours_worked')
      .eq('project_id', projectId)
      .eq('resource_id', userContext.linkedResourceId)
      .eq('status', 'Draft')
      .order('work_date', { ascending: false })
      .limit(10);
    
    if (drafts) {
      result.draftTimesheets = drafts.map(t => ({
        date: t.work_date,
        hours: t.hours_worked
      }));
    }
    
    // Get user's draft expenses
    const { data: expenseDrafts } = await supabase
      .from('expenses')
      .select('id, expense_date, amount, category')
      .eq('project_id', projectId)
      .eq('resource_id', userContext.linkedResourceId)
      .eq('status', 'Draft')
      .order('expense_date', { ascending: false })
      .limit(10);
    
    if (expenseDrafts) {
      result.draftExpenses = expenseDrafts.map(e => ({
        date: e.expense_date,
        amount: e.amount,
        category: e.category
      }));
    }
  }
  
  // Get items awaiting approval (if user is an approver)
  if (['admin', 'supplier_pm', 'customer_pm'].includes(userContext.role)) {
    const { count: tsCount } = await supabase
      .from('timesheets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'Submitted');
    
    const { count: expCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'Submitted');
    
    result.awaitingMyApproval.timesheets = tsCount || 0;
    result.awaitingMyApproval.expenses = expCount || 0;
  }
  
  // Build summary
  const parts = [];
  if (result.draftTimesheets.length > 0) {
    const totalHours = result.draftTimesheets.reduce((sum, t) => sum + t.hours, 0);
    parts.push(`${result.draftTimesheets.length} draft timesheet(s) (${totalHours} hours) to submit`);
  }
  if (result.draftExpenses.length > 0) {
    const totalAmount = result.draftExpenses.reduce((sum, e) => sum + e.amount, 0);
    parts.push(`${result.draftExpenses.length} draft expense(s) (£${totalAmount.toFixed(2)}) to submit`);
  }
  if (result.awaitingMyApproval.timesheets > 0) {
    parts.push(`${result.awaitingMyApproval.timesheets} timesheet(s) awaiting your approval`);
  }
  if (result.awaitingMyApproval.expenses > 0) {
    parts.push(`${result.awaitingMyApproval.expenses} expense(s) awaiting your approval`);
  }
  
  result.summary = parts.length > 0 ? parts.join('; ') : 'No pending actions';
  
  return result;
}

async function executeGetTimesheets(params, context) {
  const { projectId, userContext } = context;
  
  // Use left join for consistency (timesheets should always have resources but be safe)
  let query = supabase
    .from('timesheets')
    .select(`
      id, work_date, hours_worked, status, description, resource_id,
      resources(id, name, daily_rate, partner_id)
    `)
    .eq('project_id', projectId)
    .order('work_date', { ascending: false })
    .limit(50);
  
  // Apply permission scoping based on role
  if (userContext.role === 'contributor' && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  } else if (['partner_user', 'partner_admin'].includes(userContext.role) && userContext.partnerId) {
    query = query.not('resources', 'is', null)
                 .eq('resources.partner_id', userContext.partnerId);
  }
  // supplier_pm, admin, and other roles see all timesheets
  
  // Apply filters
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  if (params.mine && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  }
  
  if (params.resourceName) {
    query = query.ilike('resources.name', `%${params.resourceName}%`);
  }
  
  if (params.dateRange) {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('work_date', range.start).lte('work_date', range.end);
    }
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const timesheets = (data || []).map(t => ({
    date: t.work_date,
    resource: t.resources?.name,
    hours: t.hours_worked,
    status: t.status,
    dailyRate: t.resources?.daily_rate,
    total: (t.hours_worked / 8) * (t.resources?.daily_rate || 0),
    description: t.description
  }));
  
  const totalHours = timesheets.reduce((sum, t) => sum + t.hours, 0);
  const totalValue = timesheets.reduce((sum, t) => sum + t.total, 0);
  
  return {
    count: timesheets.length,
    totalHours,
    totalValue,
    timesheets: timesheets.slice(0, 20) // Limit detail for response size
  };
}


async function executeGetTimesheetSummary(params, context) {
  const { projectId, userContext } = context;
  
  // Use left join for consistency
  let query = supabase
    .from('timesheets')
    .select(`
      id, work_date, hours_worked, status, resource_id,
      resources(id, name, daily_rate, partner_id)
    `)
    .eq('project_id', projectId);
  
  // Apply permission scoping based on role
  if (userContext.role === 'contributor' && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  } else if (['partner_user', 'partner_admin'].includes(userContext.role) && userContext.partnerId) {
    query = query.not('resources', 'is', null)
                 .eq('resources.partner_id', userContext.partnerId);
  }
  // supplier_pm, admin, and other roles see all timesheets
  
  if (params.dateRange) {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('work_date', range.start).lte('work_date', range.end);
    }
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  const timesheets = data || [];
  const groupBy = params.groupBy || 'status';
  
  const groups = {};
  timesheets.forEach(t => {
    let key;
    switch (groupBy) {
      case 'resource':
        key = t.resources?.name || 'Unknown';
        break;
      case 'status':
        key = t.status;
        break;
      case 'week':
        const weekStart = new Date(t.work_date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = t.work_date.substring(0, 7);
        break;
      default:
        key = 'All';
    }
    
    if (!groups[key]) {
      groups[key] = { hours: 0, value: 0, count: 0 };
    }
    groups[key].hours += t.hours_worked;
    groups[key].value += (t.hours_worked / 8) * (t.resources?.daily_rate || 0);
    groups[key].count += 1;
  });
  
  return {
    groupBy,
    totalHours: timesheets.reduce((sum, t) => sum + t.hours_worked, 0),
    totalEntries: timesheets.length,
    breakdown: Object.entries(groups).map(([key, data]) => ({
      group: key,
      hours: data.hours,
      value: Math.round(data.value * 100) / 100,
      entries: data.count
    })).sort((a, b) => b.hours - a.hours)
  };
}

async function executeGetExpenses(params, context) {
  const { projectId, userContext } = context;
  
  // Simple query without complex joins for reliability
  let query = supabase
    .from('expenses')
    .select(`
      id, expense_date, amount, category, description, status, 
      is_chargeable, procurement_method, resource_id,
      resources(id, name, partner_id)
    `)
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false })
    .limit(50);
  
  // Apply permission scoping based on role
  // supplier_pm, admin, customer_pm see all expenses (no filter needed)
  if (userContext.role === 'contributor' && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  }
  // Note: Partner filtering requires post-processing since we use left join
  const filterByPartner = ['partner_user', 'partner_admin'].includes(userContext.role) && userContext.partnerId;
  
  // Apply filters
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.chargeableOnly) {
    query = query.eq('is_chargeable', true);
  }
  if (params.mine && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  }
  if (params.resourceName) {
    query = query.ilike('resources.name', `%${params.resourceName}%`);
  }
  if (params.dateRange) {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('expense_date', range.start).lte('expense_date', range.end);
    }
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Post-process for partner filtering if needed
  let filteredData = data || [];
  if (filterByPartner) {
    filteredData = filteredData.filter(e => 
      e.resources && e.resources.partner_id === userContext.partnerId
    );
  }
  
  const expenses = filteredData.map(e => ({
    date: e.expense_date,
    resource: e.resources?.name || 'Unassigned',
    category: e.category,
    amount: e.amount,
    status: e.status,
    chargeable: e.is_chargeable,
    paidBy: e.procurement_method === 'supplier' ? 'Supplier' : 'Partner',
    description: e.description
  }));
  
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const chargeableAmount = expenses.filter(e => e.chargeable).reduce((sum, e) => sum + e.amount, 0);
  
  return {
    count: expenses.length,
    totalAmount,
    chargeableAmount,
    nonChargeableAmount: totalAmount - chargeableAmount,
    expenses: expenses.slice(0, 20)
  };
}

async function executeGetExpenseSummary(params, context) {
  const { projectId, userContext } = context;
  
  // Simple query without complex joins for reliability
  let query = supabase
    .from('expenses')
    .select(`
      id, expense_date, amount, category, status, is_chargeable, resource_id,
      resources(id, name, partner_id)
    `)
    .eq('project_id', projectId);
  
  // Apply permission scoping based on role
  // supplier_pm, admin, customer_pm see all expenses
  if (userContext.role === 'contributor' && userContext.linkedResourceId) {
    query = query.eq('resource_id', userContext.linkedResourceId);
  }
  const filterByPartner = ['partner_user', 'partner_admin'].includes(userContext.role) && userContext.partnerId;
  
  if (params.dateRange) {
    const range = getDateRange(params.dateRange);
    if (range) {
      query = query.gte('expense_date', range.start).lte('expense_date', range.end);
    }
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Post-process for partner filtering if needed
  let expenses = data || [];
  if (filterByPartner) {
    expenses = expenses.filter(e => 
      e.resources && e.resources.partner_id === userContext.partnerId
    );
  }
  
  const groupBy = params.groupBy || 'category';
  
  const groups = {};
  expenses.forEach(e => {
    let key;
    switch (groupBy) {
      case 'resource':
        key = e.resources?.name || 'Unknown';
        break;
      case 'category':
        key = e.category || 'Other';
        break;
      case 'status':
        key = e.status;
        break;
      case 'month':
        key = e.expense_date.substring(0, 7);
        break;
      default:
        key = 'All';
    }
    
    if (!groups[key]) {
      groups[key] = { amount: 0, chargeable: 0, count: 0 };
    }
    groups[key].amount += e.amount;
    if (e.is_chargeable) groups[key].chargeable += e.amount;
    groups[key].count += 1;
  });
  
  return {
    groupBy,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    totalEntries: expenses.length,
    breakdown: Object.entries(groups).map(([key, data]) => ({
      group: key,
      amount: Math.round(data.amount * 100) / 100,
      chargeableAmount: Math.round(data.chargeable * 100) / 100,
      entries: data.count
    })).sort((a, b) => b.amount - a.amount)
  };
}

async function executeGetMilestones(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('milestones')
    .select('id, name, status, progress_percent, planned_start_date, planned_end_date, billable_amount, actual_spend')
    .eq('project_id', projectId)
    .order('planned_end_date', { ascending: true });
  
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  let milestones = (data || []).map(m => ({
    name: m.name,
    status: m.status,
    progress: m.progress_percent,
    startDate: m.planned_start_date,
    endDate: m.planned_end_date,
    budget: m.billable_amount,
    spent: m.actual_spend,
    variance: (m.billable_amount || 0) - (m.actual_spend || 0)
  }));
  
  if (params.overdueOnly) {
    const today = new Date().toISOString().split('T')[0];
    milestones = milestones.filter(m => m.endDate < today && m.status !== 'Completed');
  }
  
  return {
    count: milestones.length,
    milestones,
    summary: {
      completed: milestones.filter(m => m.status === 'Completed').length,
      inProgress: milestones.filter(m => m.status === 'In Progress').length,
      atRisk: milestones.filter(m => m.status === 'At Risk').length,
      notStarted: milestones.filter(m => m.status === 'Not Started').length
    }
  };
}

async function executeGetDeliverables(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('deliverables')
    .select(`
      id, name, status, due_date,
      milestones(id, name)
    `)
    .eq('project_id', projectId)
    .order('due_date', { ascending: true });
  
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  let deliverables = (data || []).map(d => ({
    name: d.name,
    status: d.status,
    dueDate: d.due_date,
    milestone: d.milestones?.name
  }));
  
  if (params.milestoneName) {
    deliverables = deliverables.filter(d => 
      d.milestone?.toLowerCase().includes(params.milestoneName.toLowerCase())
    );
  }
  
  return {
    count: deliverables.length,
    deliverables: deliverables.slice(0, 30),
    summary: {
      completed: deliverables.filter(d => d.status === 'Completed').length,
      inProgress: deliverables.filter(d => d.status === 'In Progress').length,
      blocked: deliverables.filter(d => d.status === 'Blocked').length,
      notStarted: deliverables.filter(d => d.status === 'Not Started').length
    }
  };
}

async function executeGetBudgetSummary(params, context) {
  const { projectId } = context;
  
  // Get project budget
  const { data: project } = await supabase
    .from('projects')
    .select('total_budget')
    .eq('id', projectId)
    .single();
  
  // Get milestone budgets and spend
  const { data: milestones } = await supabase
    .from('milestones')
    .select('name, billable_amount, actual_spend, status')
    .eq('project_id', projectId)
    .order('planned_end_date');
  
  const totalBudget = project?.total_budget || 0;
  const milestoneBudget = (milestones || []).reduce((sum, m) => sum + (m.billable_amount || 0), 0);
  const actualSpend = (milestones || []).reduce((sum, m) => sum + (m.actual_spend || 0), 0);
  
  if (params.groupBy === 'milestone') {
    return {
      projectBudget: totalBudget,
      milestones: (milestones || []).map(m => ({
        name: m.name,
        budget: m.billable_amount || 0,
        spent: m.actual_spend || 0,
        variance: (m.billable_amount || 0) - (m.actual_spend || 0),
        percentUsed: m.billable_amount ? Math.round((m.actual_spend || 0) / m.billable_amount * 100) : 0,
        status: m.status
      }))
    };
  }
  
  return {
    projectBudget: totalBudget,
    milestoneBudgetTotal: milestoneBudget,
    actualSpend,
    variance: milestoneBudget - actualSpend,
    percentUsed: milestoneBudget ? Math.round(actualSpend / milestoneBudget * 100) : 0
  };
}

async function executeGetResources(params, context) {
  const { projectId, userContext } = context;
  
  let query = supabase
    .from('resources')
    .select(`
      id, name, role, daily_rate, days_allocated, days_used,
      partners(id, name)
    `)
    .eq('project_id', projectId)
    .order('name');
  
  // Permission scoping for partner users
  if (['partner_user', 'partner_admin'].includes(userContext.role) && userContext.partnerId) {
    query = query.eq('partner_id', userContext.partnerId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  let resources = (data || []).map(r => ({
    name: r.name,
    role: r.role,
    dailyRate: ['admin', 'supplier_pm'].includes(userContext.role) ? r.daily_rate : null,
    daysAllocated: r.days_allocated,
    daysUsed: r.days_used,
    utilisation: r.days_allocated ? Math.round((r.days_used || 0) / r.days_allocated * 100) : 0,
    partner: r.partners?.name
  }));
  
  if (params.partnerName) {
    resources = resources.filter(r => 
      r.partner?.toLowerCase().includes(params.partnerName.toLowerCase())
    );
  }
  
  return {
    count: resources.length,
    resources,
    totalDaysAllocated: resources.reduce((sum, r) => sum + (r.daysAllocated || 0), 0),
    totalDaysUsed: resources.reduce((sum, r) => sum + (r.daysUsed || 0), 0)
  };
}

async function executeGetKPIs(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('kpis')
    .select('id, name, category, current_value, target_value, unit, status')
    .eq('project_id', projectId)
    .order('category, name');
  
  if (params.category) {
    query = query.ilike('category', `%${params.category}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  const kpis = (data || []).map(k => ({
    name: k.name,
    category: k.category,
    current: k.current_value,
    target: k.target_value,
    unit: k.unit,
    status: k.status,
    percentOfTarget: k.target_value ? Math.round(k.current_value / k.target_value * 100) : null
  }));
  
  return {
    count: kpis.length,
    kpis,
    summary: {
      onTrack: kpis.filter(k => k.status === 'On Track' || k.status === 'Green').length,
      atRisk: kpis.filter(k => k.status === 'At Risk' || k.status === 'Amber').length,
      offTrack: kpis.filter(k => k.status === 'Off Track' || k.status === 'Red').length
    }
  };
}


// ============================================
// TOOL EXECUTION DISPATCHER
// ============================================

async function executeTool(toolName, toolInput, context) {
  // Check cache first
  const cacheKey = getCacheKey(toolName, toolInput, context);
  const cachedResult = getCachedResponse(cacheKey);
  if (cachedResult) {
    console.log(`[Cache Hit] ${toolName}`);
    return cachedResult;
  }

  const executeToolOperation = async () => {
    switch (toolName) {
      case 'getUserProfile':
        return await executeGetUserProfile(context);
      case 'getRolePermissions':
        return await executeGetRolePermissions(toolInput, context);
      case 'getMyPendingActions':
        return await executeGetMyPendingActions(context);
      case 'getTimesheets':
        return await executeGetTimesheets(toolInput, context);
      case 'getTimesheetSummary':
        return await executeGetTimesheetSummary(toolInput, context);
      case 'getExpenses':
        return await executeGetExpenses(toolInput, context);
      case 'getExpenseSummary':
        return await executeGetExpenseSummary(toolInput, context);
      case 'getMilestones':
        return await executeGetMilestones(toolInput, context);
      case 'getDeliverables':
        return await executeGetDeliverables(toolInput, context);
      case 'getBudgetSummary':
        return await executeGetBudgetSummary(toolInput, context);
      case 'getResources':
        return await executeGetResources(toolInput, context);
      case 'getKPIs':
        return await executeGetKPIs(toolInput, context);
      default:
        return { error: `Unknown tool: ${toolName}`, recoverable: false };
    }
  };

  try {
    // Execute with retry logic for transient errors
    const result = await withRetry(executeToolOperation, toolName);
    
    // Cache successful results
    setCachedResponse(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return getUserFriendlyError(error, toolName);
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

function buildSystemPrompt(context) {
  const { userContext, projectContext } = context;
  
  return `You are an AI assistant for the AMSF001 Project Tracker application. You help users query their project data, understand their pending actions, and navigate the system.

## Your Capabilities
You have access to tools that query the project database. Use them to answer questions about:
- Timesheets and time tracking
- Expenses and expense claims
- Milestones and project progress
- Deliverables and their status
- Budget and spend analysis
- Resources and team members
- KPIs and performance metrics
- User's pending actions and responsibilities

## Current Context
- User: ${userContext?.name || 'Unknown'} (${userContext?.email || 'Unknown'})
- Role: ${userContext?.role || 'Unknown'}
- Project: ${projectContext?.name || 'AMSF001'} (${projectContext?.reference || 'Unknown'})
${userContext?.linkedResourceName ? `- Linked Resource: ${userContext.linkedResourceName}` : ''}
${userContext?.partnerName ? `- Partner: ${userContext.partnerName}` : ''}

## Response Guidelines
1. Be concise and helpful - get to the point quickly
2. Use UK date format (DD/MM/YYYY) and GBP currency (£)
3. When showing financial data, always be precise with figures
4. If you need to query data, use the appropriate tool
5. For "what do I need to do" questions, use getMyPendingActions
6. Respect the user's role - all data is automatically scoped to their permissions
7. If a query returns no results, say so clearly and suggest alternatives
8. Offer to drill down into details when appropriate
9. Don't repeat tool results verbatim - synthesise them into a helpful response

## Important Notes
- All queries are automatically filtered based on the user's role and permissions
- Partner users only see their own partner's data
- Contributors only see their own timesheets and expenses
- Cost prices are only visible to Admin and Supplier PM roles
- Always use tools to get current data rather than making assumptions`;
}

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req) {
  // GET request returns usage stats (for admin monitoring)
  if (req.method === 'GET') {
    // Only allow stats access with admin key or from localhost
    const adminKey = req.headers.get('x-admin-key');
    const isLocal = req.headers.get('host')?.includes('localhost');
    
    if (adminKey === process.env.ADMIN_API_KEY || isLocal) {
      return new Response(JSON.stringify({
        stats: {
          ...usageStats,
          cacheSize: responseCache.size,
          rateLimitEntries: rateLimitStore.size,
          uptime: `${((Date.now() - new Date(usageStats.startedAt).getTime()) / 1000 / 60).toFixed(1)} minutes`,
          averageTokensPerRequest: usageStats.totalRequests > 0 
            ? Math.round((usageStats.totalInputTokens + usageStats.totalOutputTokens) / usageStats.totalRequests)
            : 0,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Database connection not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, userContext, projectContext, projectId } = body;

    // Rate limiting
    const userId = userContext?.email || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait a moment.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitise messages
    const sanitizedMessages = sanitizeMessages(messages);
    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build context for tool execution
    const context = {
      projectId: projectId || projectContext?.id,
      userContext: userContext || {},
      projectContext: projectContext || {}
    };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Initial API call with tools
    let apiMessages = sanitizedMessages;
    let continueLoop = true;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops
    let finalResponse = null;

    while (continueLoop && iterations < maxIterations) {
      iterations++;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2048,
          system: systemPrompt,
          tools: TOOLS,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Claude API error:', errorData);
        throw new Error('AI service error');
      }

      const data = await response.json();
      
      // Check if we need to handle tool use
      if (data.stop_reason === 'tool_use') {
        // Find tool use blocks
        const toolUseBlocks = data.content.filter(block => block.type === 'tool_use');
        
        // Execute tools and collect results
        const toolResults = [];
        for (const toolUse of toolUseBlocks) {
          const result = await executeTool(toolUse.name, toolUse.input, context);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          });
        }
        
        // Add assistant response and tool results to messages
        apiMessages = [
          ...apiMessages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults }
        ];
      } else {
        // No more tool use, we have our final response
        continueLoop = false;
        finalResponse = data;
      }
    }

    if (!finalResponse) {
      throw new Error('Failed to get response after tool execution');
    }

    // Extract text response
    const textContent = finalResponse.content.find(block => block.type === 'text');
    const responseText = textContent?.text || 'I apologize, but I was unable to generate a response.';

    // Log token usage for cost monitoring
    logTokenUsage(finalResponse.usage, userId, iterations > 1);

    return new Response(JSON.stringify({
      message: responseText,
      usage: finalResponse.usage,
      toolsUsed: iterations > 1,
      cached: false
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Provide better error messages based on error type
    let userMessage = 'An error occurred while processing your request.';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      userMessage = 'AI service configuration error. Please contact support.';
    } else if (error.message?.includes('rate') || error.message?.includes('429')) {
      userMessage = 'AI service is temporarily busy. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Request took too long. Please try a simpler query.';
      statusCode = 504;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      recoverable: statusCode !== 500,
      retryAfter: statusCode === 429 ? 30 : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
