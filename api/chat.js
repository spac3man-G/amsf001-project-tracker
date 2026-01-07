// Vercel Edge Function for AI Chat Assistant
// Version 3.4 - Model routing: Haiku for simple queries, Sonnet for complex
// Uses Claude with function calling for database queries

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
  from: (table) => {
    const client = getSupabase();
    if (!client) {
      throw new Error('Database connection not available - check SUPABASE_SERVICE_ROLE_KEY');
    }
    return client.from(table);
  }
};

// ============================================
// COST MONITORING - Token Usage Logging
// ============================================

// Claude pricing (per 1M tokens, as of Dec 2024)
const TOKEN_COSTS = {
  // Sonnet - used for complex queries with tool use
  sonnet: {
    input: 3.00,
    output: 15.00,
  },
  // Haiku - used for simple queries from pre-fetched context
  haiku: {
    input: 0.25,
    output: 1.25,
  }
};

// Model selection
const MODELS = {
  HAIKU: 'claude-haiku-4-5-20250929',
  SONNET: 'claude-sonnet-4-5-20250929',
};

// In-memory usage stats (resets on cold start)
const usageStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  estimatedCostUSD: 0,
  haikuRequests: 0,
  sonnetRequests: 0,
  startedAt: new Date().toISOString(),
  recentRequests: [], // Last 100 requests for analysis
};

function logTokenUsage(usage, userId, toolsUsed, model = 'sonnet') {
  if (!usage) return;
  
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS.sonnet;
  const costUSD = (inputTokens * costs.input / 1000000) + 
                  (outputTokens * costs.output / 1000000);
  
  // Update totals
  usageStats.totalRequests++;
  usageStats.totalInputTokens += inputTokens;
  usageStats.totalOutputTokens += outputTokens;
  usageStats.estimatedCostUSD += costUSD;
  if (model === 'haiku') {
    usageStats.haikuRequests++;
  } else {
    usageStats.sonnetRequests++;
  }
  
  // Track recent requests (keep last 100)
  usageStats.recentRequests.push({
    timestamp: new Date().toISOString(),
    userId: userId?.substring(0, 20) || 'anonymous',
    inputTokens,
    outputTokens,
    costUSD: costUSD.toFixed(6),
    toolsUsed,
    model,
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
// QUERY TIMEOUT UTILITY
// ============================================

const QUERY_TIMEOUT_MS = 5000; // 5 second timeout for database queries

async function withTimeout(promise, timeoutMs = QUERY_TIMEOUT_MS, operationName = 'Operation') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
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
    getRaidItems: 'retrieve RAID log items',
    getRaidSummary: 'fetch RAID summary',
    getQualityStandards: 'retrieve quality standards',
    getQualityStandardsSummary: 'fetch quality standards summary',
    getPlanItems: 'retrieve plan items',
    getPlanSummary: 'fetch plan summary',
    getEstimates: 'retrieve cost estimates',
    getBenchmarkRates: 'fetch benchmark rates',
    getVariations: 'retrieve variations',
    getVariationsSummary: 'fetch variations summary',
    getDeliverableTasks: 'retrieve deliverable tasks',
    getMilestoneCertificates: 'fetch milestone certificates',
    // Segment 7: Partner & Invoicing
    getPartners: 'retrieve partner information',
    getPartnerInvoices: 'fetch partner invoices',
    // Segment 8: Resource & Availability
    getResourceAvailability: 'fetch resource availability',
    // Segment 9: Evaluator (Part 1)
    getEvaluationProjects: 'retrieve evaluation projects',
    getRequirements: 'fetch evaluation requirements',
    getVendors: 'retrieve vendor information',
    // Segment 10: Evaluator (Part 2)
    getScores: 'fetch vendor scores',
    getWorkshops: 'retrieve workshop information',
    getStakeholderAreas: 'fetch stakeholder areas',
    // Segment 12: Admin Tools
    getAuditLog: 'retrieve audit log entries',
    getOrganisationSummary: 'fetch organisation summary',
    // Segment 13: Feature Guide
    getFeatureGuide: 'retrieve feature guide',
  };
  
  const action = toolContext[toolName] || 'complete your request';
  
  // Log actual error for debugging
  console.error(`Chat tool error (${toolName}):`, errorString, 'Code:', errorCode);
  
  return { 
    error: `Unable to ${action}. Please try again or rephrase your question.`,
    tool: toolName,
    recoverable: true,
    // Include details temporarily for debugging
    debug: errorString.substring(0, 200)
  };
}

// ============================================
// RESPONSE CACHING FOR COMMON QUERIES
// ============================================

const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache (increased from 1 min for performance)

function getCacheKey(toolName, toolInput, context) {
  // Cache read-only, relatively stable queries
  const cacheableTools = [
    'getUserProfile', 
    'getRolePermissions', 
    'getMilestones', 
    'getResources',
    'getDeliverables',
    'getKPIs',
    'getBudgetSummary'
  ];
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
    description: "Get items requiring the current user's attention: draft timesheets to submit, draft expenses to submit, items awaiting their validation (if they're a validator), and summary counts. Use this for 'what do I need to do' or 'what's pending' queries.",
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
          enum: ["Draft", "Submitted", "Validated", "Approved", "Rejected", "all"],
          description: "Filter by validation status. Default is 'all'."
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
    description: "Query expense entries. Returns expenses with dates, amounts, categories, and validation status. Automatically scoped to user's permissions.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Draft", "Submitted", "Validated", "Approved", "Rejected", "Paid", "all"],
          description: "Filter by status"
        },
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "all"]
        },
        category: {
          type: "string",
          enum: ["Travel", "Accommodation", "Sustenance"],
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
          enum: ["Not Started", "In Progress", "Completed", "all"]
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
          enum: ["Not Started", "In Progress", "Submitted for Review", "Returned for More Work", "Review Complete", "Delivered", "all"]
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
  // ============================================
  // SEGMENT 7: Partner & Invoicing Tools
  // ============================================
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
  },
  // ============================================
  // SEGMENT 8: Resource & Availability Tools
  // ============================================
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
  },
  // ============================================
  // SEGMENT 9: Evaluator Tools (Part 1 - Core)
  // ============================================
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
  },
  // ============================================
  // SEGMENT 10: Evaluator Tools (Part 2 - Extended)
  // ============================================
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
  },
  // ============================================
  // SEGMENT 12: Admin Tools
  // ============================================
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
          enum: ["today", "thisWeek", "thisMonth", "all"],
          description: "Filter by date range"
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
  },
  // ============================================
  // SEGMENT 13: Feature Guide Tool
  // ============================================
  {
    name: "getFeatureGuide",
    description: "Get detailed how-to guide for an application feature. Use when users ask how to do something, what fields mean, how workflows work, or what they can do with their role. Always use this for procedural questions rather than guessing.",
    input_schema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Feature to get guide for (e.g., 'timesheets', 'variations', 'evaluator', 'raid', 'milestones')"
        },
        section: {
          type: "string",
          enum: ["overview", "howTo", "fields", "workflow", "permissions", "faq", "all"],
          description: "Specific section to retrieve. Default returns contextually relevant sections."
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
    'customer_pm': 'Timesheet validation, expense validation, deliverable review',
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
        'Validate/reject all timesheets and expenses',
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
        'Validate partner-related timesheets',
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
        'Validate/reject submitted timesheets',
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
        'Validate timesheets or expenses',
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
        'Validate anything',
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
        'Validate anything',
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
    awaitingMyValidation: { timesheets: 0, expenses: 0 },
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
      .or('is_deleted.is.null,is_deleted.eq.false')
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
      .or('is_deleted.is.null,is_deleted.eq.false')
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
  
  // Get items awaiting validation (if user is a validator)
  if (['admin', 'supplier_pm', 'customer_pm'].includes(userContext.role)) {
    const { count: tsCount } = await supabase
      .from('timesheets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'Submitted')
      .or('is_deleted.is.null,is_deleted.eq.false');
    
    const { count: expCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'Submitted')
      .or('is_deleted.is.null,is_deleted.eq.false');
    
    result.awaitingMyValidation.timesheets = tsCount || 0;
    result.awaitingMyValidation.expenses = expCount || 0;
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
  if (result.awaitingMyValidation.timesheets > 0) {
    parts.push(`${result.awaitingMyValidation.timesheets} timesheet(s) awaiting your validation`);
  }
  if (result.awaitingMyValidation.expenses > 0) {
    parts.push(`${result.awaitingMyValidation.expenses} expense(s) awaiting your validation`);
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
      resources(id, name, sell_price, partner_id)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
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
    dailyRate: t.resources?.sell_price,
    total: (t.hours_worked / 8) * (t.resources?.sell_price || 0),
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
      resources(id, name, sell_price, partner_id)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');
  
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
    groups[key].value += (t.hours_worked / 8) * (t.resources?.sell_price || 0);
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
  
  console.log('executeGetExpenses called with:', { projectId, role: userContext?.role, params });
  
  // Simple query without complex joins for reliability
  let query = supabase
    .from('expenses')
    .select(`
      id, expense_date, amount, category, description, status, 
      chargeable_to_customer, procurement_method, resource_id,
      resources(id, name, partner_id)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
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
    query = query.eq('chargeable_to_customer', true);
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
    chargeable: e.chargeable_to_customer !== false,
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
      id, expense_date, amount, category, status, chargeable_to_customer, resource_id,
      resources(id, name, partner_id)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false');
  
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
    if (e.chargeable_to_customer !== false) groups[key].chargeable += e.amount;
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
    .select('id, name, status, progress_percent, start_date, end_date, forecast_end_date, billable')
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('end_date', { ascending: true });
  
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  let milestones = (data || []).map(m => ({
    name: m.name,
    status: m.status,
    progress: m.progress_percent,
    startDate: m.start_date,
    endDate: m.end_date,
    forecastEndDate: m.forecast_end_date,
    budget: m.billable
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
    .or('is_deleted.is.null,is_deleted.eq.false')
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
    .or('is_deleted.is.null,is_deleted.eq.false')
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
      id, name, role, sell_price, days_allocated, days_used,
      partners(id, name)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
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
    dailyRate: ['admin', 'supplier_pm'].includes(userContext.role) ? r.sell_price : null,
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
    .or('is_deleted.is.null,is_deleted.eq.false')
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

async function executeGetRaidItems(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('raid_items')
    .select(`
      id, reference, type, title, description, status, priority,
      probability, impact, risk_score, mitigation_strategy,
      owner_user_id, owner_name, raised_date, target_date, closed_date,
      created_at, updated_at
    `)
    .eq('project_id', projectId)
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
  const { projectId } = context;
  
  const { data, error } = await supabase
    .from('raid_items')
    .select('id, type, status, priority, owner_name')
    .eq('project_id', projectId)
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

async function executeGetQualityStandards(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('quality_standards')
    .select(`
      id, reference, name, description, category, status,
      compliance_notes, owner, review_date,
      created_at, updated_at
    `)
    .eq('project_id', projectId)
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
  const { projectId } = context;
  
  const { data, error } = await supabase
    .from('quality_standards')
    .select('id, status, category')
    .eq('project_id', projectId)
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

async function executeGetPlanItems(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('plan_items')
    .select(`
      id, wbs_number, name, description, item_type, status, progress,
      start_date, end_date, duration_days, estimated_hours, actual_hours,
      assigned_to, parent_id, sort_order, is_baseline_locked,
      linked_milestone_id, linked_deliverable_id, linked_estimate_id,
      created_at, updated_at
    `)
    .eq('project_id', projectId)
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
  const { projectId } = context;
  
  const { data, error } = await supabase
    .from('plan_items')
    .select('id, item_type, status, progress, assigned_to, start_date, end_date, estimated_hours, actual_hours')
    .eq('project_id', projectId)
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

async function executeGetEstimates(params, context) {
  const { projectId } = context;
  
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
    .eq('project_id', projectId)
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

async function executeGetVariations(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('variations')
    .select(`
      id, reference, title, description, type, status,
      cost_impact, timeline_impact_days, justification,
      requested_by, requested_date, approved_by, approved_date,
      created_at, updated_at
    `)
    .eq('project_id', projectId)
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
  const { projectId } = context;
  
  const { data, error } = await supabase
    .from('variations')
    .select('id, status, type, cost_impact, timeline_impact_days')
    .eq('project_id', projectId)
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

async function executeGetDeliverableTasks(params, context) {
  const { projectId } = context;
  
  let query = supabase
    .from('deliverable_tasks')
    .select(`
      id, name, description, status, progress,
      assigned_to, estimated_hours, actual_hours,
      start_date, due_date, completed_date, comment,
      deliverable_id, sort_order,
      deliverables!inner (id, name, project_id)
    `)
    .eq('deliverables.project_id', projectId)
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
  const { projectId } = context;
  
  let query = supabase
    .from('milestone_certificates')
    .select(`
      id, certificate_number, status, amount, currency,
      issued_date, approved_date, paid_date,
      approved_by, notes,
      milestone_id,
      milestones!inner (id, name, project_id)
    `)
    .eq('milestones.project_id', projectId)
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


// ============================================
// SEGMENT 7: Partner & Invoicing Tool Functions
// ============================================

async function executeGetPartners(params, context) {
  const { projectId, userContext } = context;
  
  let query = supabase
    .from('partners')
    .select(`
      id, name, contact_name, contact_email, contact_phone,
      address, status, payment_terms, notes,
      created_at, updated_at,
      resources (id)
    `)
    .eq('project_id', projectId)
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
  const { projectId, userContext } = context;
  
  let query = supabase
    .from('partner_invoices')
    .select(`
      id, invoice_number, status, invoice_date, due_date, paid_date,
      subtotal, tax_amount, total_amount, currency, notes,
      partner_id,
      partners!inner (id, name, project_id),
      partner_invoice_lines (id, description, quantity, unit_price, line_total)
    `)
    .eq('partners.project_id', projectId)
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

// ============================================
// SEGMENT 8: Resource & Availability Tool Functions
// ============================================

async function executeGetResourceAvailability(params, context) {
  const { projectId, userContext } = context;
  
  let query = supabase
    .from('resource_availability')
    .select(`
      id, resource_id, week_start, available_hours, allocated_hours,
      notes,
      resources!inner (id, name, project_id, sell_price)
    `)
    .eq('resources.project_id', projectId)
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

// ============================================
// SEGMENT 9: Evaluator Tool Functions (Part 1 - Core)
// ============================================

async function executeGetEvaluationProjects(params, context) {
  const { userContext } = context;
  
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
  if (userContext?.organisationId) {
    query = query.eq('organisation_id', userContext.organisationId);
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

// ============================================
// SEGMENT 10: Evaluator Tool Functions (Part 2 - Extended)
// ============================================

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

// ============================================
// SEGMENT 12: Admin Tool Functions
// ============================================

async function executeGetAuditLog(params, context) {
  const { projectId, userContext } = context;
  
  // Admin only check
  if (!['admin'].includes(userContext?.role)) {
    return { error: "Audit log access requires admin role" };
  }
  
  let query = supabase
    .from('audit_log')
    .select(`
      id, action, entity_type, entity_id, 
      user_id, user_email, changes, ip_address,
      created_at
    `)
    .eq('project_id', projectId)
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
  const { userContext } = context;
  
  if (!['admin', 'supplier_pm'].includes(userContext?.role)) {
    return { error: "Organisation summary requires admin or supplier_pm role" };
  }
  
  const orgId = userContext?.organisationId;
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

// ============================================
// SEGMENT 13: Feature Guide Execution
// ============================================

// Guide registry - maps guide IDs to their file paths
const GUIDE_PATHS = {
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

// Keyword to guide mapping for fuzzy matching
const KEYWORD_TO_GUIDE = {
  'timesheet': 'timesheets', 'time entry': 'timesheets', 'hours': 'timesheets',
  'expense': 'expenses', 'receipt': 'expenses', 'claim': 'expenses',
  'milestone': 'milestones', 'phase': 'milestones', 'certificate': 'milestones',
  'deliverable': 'deliverables', 'work product': 'deliverables', 'task': 'deliverables',
  'resource': 'resources', 'team member': 'resources', 'staff': 'resources',
  'variation': 'variations', 'change request': 'variations', 'change control': 'variations',
  'risk': 'raid', 'issue': 'raid', 'assumption': 'raid', 'dependency': 'raid', 'raid': 'raid',
  'quality': 'quality-standards', 'compliance': 'quality-standards', 'standard': 'quality-standards',
  'kpi': 'kpis', 'indicator': 'kpis', 'metric': 'kpis',
  'plan': 'wbs-planning', 'planning': 'wbs-planning', 'wbs': 'wbs-planning', 'gantt': 'wbs-planning',
  'estimate': 'estimator', 'estimation': 'estimator', 'cost estimate': 'estimator',
  'benchmark': 'benchmarking', 'rate card': 'benchmarking', 'sfia': 'benchmarking', 'day rate': 'benchmarking',
  'billing': 'billing', 'budget': 'billing', 'finance': 'billing', 'invoice': 'billing',
  'partner invoice': 'partner-invoices', 'subcontractor': 'partner-invoices',
  'evaluation': 'evaluation-setup', 'evaluator': 'evaluation-setup', 'software evaluation': 'evaluation-setup',
  'requirement': 'requirements', 'moscow': 'requirements',
  'vendor': 'vendors', 'supplier': 'vendors', 'rfp': 'vendors',
  'score': 'scoring', 'scoring': 'scoring',
  'workshop': 'workshops', 'demo': 'workshops',
  'evaluation report': 'evaluator-reports',
  'organisation': 'organisation-admin', 'org admin': 'organisation-admin',
  'project setting': 'project-settings', 'project config': 'project-settings',
  'team': 'team-members', 'user': 'team-members', 'invite': 'team-members',
  'audit': 'audit-log', 'activity log': 'audit-log', 'history': 'audit-log',
  'navigate': 'navigation', 'menu': 'navigation', 'sidebar': 'navigation',
  'role': 'roles-permissions', 'permission': 'roles-permissions', 'access': 'roles-permissions',
  'workflow': 'workflows', 'approval': 'workflows', 'approval process': 'workflows',
};

function findGuideByKeyword(keyword) {
  if (!keyword) return null;
  const lowerKeyword = keyword.toLowerCase().trim();
  
  // Direct match on guide ID
  if (GUIDE_PATHS[lowerKeyword]) return lowerKeyword;
  
  // Exact keyword match
  if (KEYWORD_TO_GUIDE[lowerKeyword]) return KEYWORD_TO_GUIDE[lowerKeyword];
  
  // Partial match
  for (const [key, guideId] of Object.entries(KEYWORD_TO_GUIDE)) {
    if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
      return guideId;
    }
  }
  
  return null;
}

async function executeGetFeatureGuide(params, context) {
  const { feature, section, action } = params;
  
  // Try to find the guide
  let guideId = feature?.toLowerCase().replace(/\s+/g, '-');
  
  // Check direct match
  if (!GUIDE_PATHS[guideId]) {
    // Try keyword matching
    guideId = findGuideByKeyword(feature);
  }
  
  if (!guideId || !GUIDE_PATHS[guideId]) {
    return {
      error: `No guide found for "${feature}"`,
      availableGuides: Object.keys(GUIDE_PATHS),
      suggestion: "Try asking about: timesheets, expenses, variations, milestones, deliverables, resources, raid, evaluator, planning",
      tip: "You can ask things like 'How do I create a timesheet?' or 'What's the approval workflow for expenses?'"
    };
  }
  
  // Try to load the guide dynamically
  let guide;
  try {
    // Dynamic import from feature-guides directory
    const guidePath = GUIDE_PATHS[guideId];
    const module = await import(`../src/data/feature-guides/${guidePath}.js`);
    guide = module.default;
  } catch (error) {
    // Guide file doesn't exist yet
    return {
      guideId,
      status: 'not_implemented',
      message: `The ${guideId} guide is registered but not yet implemented.`,
      availableGuides: Object.keys(GUIDE_PATHS),
      tip: "This guide will be available soon. In the meantime, I can help answer questions based on the application's data."
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
    response.relevantFields = guide.fields;
    const userRole = context.userContext?.role;
    response.yourPermissions = guide.permissions?.[userRole] || guide.permissions;
    return response;
  }
  
  // If specific section requested
  if (section && section !== 'all') {
    if (section === 'permissions') {
      const userRole = context.userContext?.role;
      response.yourRole = userRole;
      response.permissions = guide.permissions?.[userRole] || guide.permissions;
    } else {
      response[section] = guide[section];
    }
    return response;
  }
  
  // Default: return overview with key sections
  response.description = guide.description;
  response.navigation = guide.navigation;
  response.howTo = guide.howTo;
  response.workflow = guide.workflow;
  
  // Add role-specific permissions
  const userRole = context.userContext?.role;
  if (guide.permissions) {
    response.yourPermissions = guide.permissions[userRole] || guide.permissions;
  }
  
  // Include FAQ if available
  if (guide.faq) {
    response.faq = guide.faq.slice(0, 5);
  }
  
  // Include related guides
  if (guide.related) {
    response.related = guide.related;
  }
  
  return response;
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
      case 'getRaidItems':
        return await executeGetRaidItems(toolInput, context);
      case 'getRaidSummary':
        return await executeGetRaidSummary(toolInput, context);
      case 'getQualityStandards':
        return await executeGetQualityStandards(toolInput, context);
      case 'getQualityStandardsSummary':
        return await executeGetQualityStandardsSummary(toolInput, context);
      case 'getPlanItems':
        return await executeGetPlanItems(toolInput, context);
      case 'getPlanSummary':
        return await executeGetPlanSummary(toolInput, context);
      case 'getEstimates':
        return await executeGetEstimates(toolInput, context);
      case 'getBenchmarkRates':
        return await executeGetBenchmarkRates(toolInput, context);
      case 'getVariations':
        return await executeGetVariations(toolInput, context);
      case 'getVariationsSummary':
        return await executeGetVariationsSummary(toolInput, context);
      case 'getDeliverableTasks':
        return await executeGetDeliverableTasks(toolInput, context);
      case 'getMilestoneCertificates':
        return await executeGetMilestoneCertificates(toolInput, context);
      // Segment 7: Partner & Invoicing
      case 'getPartners':
        return await executeGetPartners(toolInput, context);
      case 'getPartnerInvoices':
        return await executeGetPartnerInvoices(toolInput, context);
      // Segment 8: Resource & Availability
      case 'getResourceAvailability':
        return await executeGetResourceAvailability(toolInput, context);
      // Segment 9: Evaluator (Part 1)
      case 'getEvaluationProjects':
        return await executeGetEvaluationProjects(toolInput, context);
      case 'getRequirements':
        return await executeGetRequirements(toolInput, context);
      case 'getVendors':
        return await executeGetVendors(toolInput, context);
      // Segment 10: Evaluator (Part 2)
      case 'getScores':
        return await executeGetScores(toolInput, context);
      case 'getWorkshops':
        return await executeGetWorkshops(toolInput, context);
      case 'getStakeholderAreas':
        return await executeGetStakeholderAreas(toolInput, context);
      // Segment 12: Admin Tools
      case 'getAuditLog':
        return await executeGetAuditLog(toolInput, context);
      case 'getOrganisationSummary':
        return await executeGetOrganisationSummary(toolInput, context);
      // Segment 13: Feature Guide
      case 'getFeatureGuide':
        return await executeGetFeatureGuide(toolInput, context);
      default:
        return { error: `Unknown tool: ${toolName}`, recoverable: false };
    }
  };

  try {
    // Execute with timeout AND retry logic for transient errors
    // Timeout wraps retries so total time is bounded
    const result = await withTimeout(
      withRetry(executeToolOperation, toolName),
      QUERY_TIMEOUT_MS,
      toolName
    );
    
    // Cache successful results
    setCachedResponse(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return getUserFriendlyError(error, toolName);
  }
}

// ============================================
// MODEL ROUTING - Choose Haiku vs Sonnet
// ============================================

// Keywords that suggest a simple query answerable from pre-fetched context
const SIMPLE_QUERY_PATTERNS = [
  /budget|spend|cost|variance/i,
  /milestone.*(status|progress|summary|count|how many)/i,
  /deliverable.*(status|progress|summary|count|how many)/i,
  /timesheet.*(summary|total|hours|count|how many)/i,
  /expense.*(summary|total|amount|count|how many)/i,
  /pending|action|todo|to do|what.*(do|need)/i,
  /overview|summary|status|dashboard/i,
  /how.*(doing|going|progress)/i,
];

// Keywords that suggest a complex query needing specific tool calls
const COMPLEX_QUERY_PATTERNS = [
  /specific|detail|list|show me|find|search/i,
  /filter|between|from|to|date|week|month|year/i,
  /resource|person|team member|who/i,
  /partner|supplier/i,
  /compare|versus|vs/i,
  /kpi|quality|standard/i,
  /\d+/,  // Contains numbers (likely specific queries)
];

function shouldUseHaiku(message, prefetchedContext) {
  // Can't use Haiku if we don't have pre-fetched context
  if (!prefetchedContext) return false;
  
  const lastMessage = message.toLowerCase();
  
  // Check for complex patterns first (these need Sonnet + tools)
  for (const pattern of COMPLEX_QUERY_PATTERNS) {
    if (pattern.test(lastMessage)) {
      return false;
    }
  }
  
  // Check for simple patterns (can use Haiku with pre-fetched data)
  for (const pattern of SIMPLE_QUERY_PATTERNS) {
    if (pattern.test(lastMessage)) {
      return true;
    }
  }
  
  // Default to Sonnet for safety (better responses for unknown queries)
  return false;
}

// Build a simpler prompt for Haiku (no tools, just pre-fetched data)
function buildHaikuPrompt(context) {
  const { userContext, projectContext, prefetchedContext } = context;
  
  return `You are a helpful project assistant. Answer the user's question using ONLY the provided data below. Be concise and helpful. Use UK date format (DD/MM/YYYY) and GBP currency (£).

## User
- Name: ${userContext?.name || 'Unknown'}
- Role on this project: ${userContext?.role || 'Unknown'}

## Project: ${projectContext?.name || 'AMSF001'} (${projectContext?.reference || 'Unknown'})
Note: All data shown is specific to this project. The user may have different roles on other projects.

## Current Data
### Budget
- Project Budget: £${(prefetchedContext?.budgetSummary?.projectBudget || 0).toLocaleString()}
- Milestone Billable: £${(prefetchedContext?.budgetSummary?.milestoneBillable || 0).toLocaleString()}
- Actual Spend: £${(prefetchedContext?.budgetSummary?.actualSpend || 0).toLocaleString()}
- Variance: £${(prefetchedContext?.budgetSummary?.variance || 0).toLocaleString()}
- Budget Used: ${prefetchedContext?.budgetSummary?.percentUsed || 0}%

### Milestones (${prefetchedContext?.milestoneSummary?.total || 0} total)
- Completed: ${prefetchedContext?.milestoneSummary?.byStatus?.completed || 0}
- In Progress: ${prefetchedContext?.milestoneSummary?.byStatus?.inProgress || 0}
- At Risk: ${prefetchedContext?.milestoneSummary?.byStatus?.atRisk || 0}
- Not Started: ${prefetchedContext?.milestoneSummary?.byStatus?.notStarted || 0}

### Deliverables (${prefetchedContext?.deliverableSummary?.total || 0} total)
- Delivered: ${prefetchedContext?.deliverableSummary?.byStatus?.delivered || 0}
- Review Complete: ${prefetchedContext?.deliverableSummary?.byStatus?.reviewComplete || 0}
- Awaiting Review: ${prefetchedContext?.deliverableSummary?.byStatus?.awaitingReview || 0}
- In Progress: ${prefetchedContext?.deliverableSummary?.byStatus?.inProgress || 0}

### Timesheets
- Total Entries: ${prefetchedContext?.timesheetSummary?.totalEntries || 0}
- Total Hours: ${prefetchedContext?.timesheetSummary?.totalHours || 0}

### Expenses
- Total: £${(prefetchedContext?.expenseSummary?.totalAmount || 0).toLocaleString()}
- Chargeable: £${(prefetchedContext?.expenseSummary?.chargeableAmount || 0).toLocaleString()}

### Pending Actions
- Draft Timesheets: ${prefetchedContext?.pendingActions?.draftTimesheets || 0}
- Awaiting Validation: ${prefetchedContext?.pendingActions?.awaitingValidation || 0}

Answer naturally and helpfully. If asked about switching projects or other projects, explain the user can use the Project Switcher dropdown in the header bar. If you need more specific information than provided, say you can help find more details if they ask.`;
}

// ============================================
// SYSTEM PROMPT
// ============================================

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

  // Add pre-fetched context if available (allows instant responses without tool calls)
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
- Completed: ${prefetchedContext.milestoneSummary?.byStatus?.completed || 0}
- In Progress: ${prefetchedContext.milestoneSummary?.byStatus?.inProgress || 0}
- Not Started: ${prefetchedContext.milestoneSummary?.byStatus?.notStarted || 0}
- At Risk: ${prefetchedContext.milestoneSummary?.byStatus?.atRisk || 0}

### Deliverables (${prefetchedContext.deliverableSummary?.total || 0} total)
- Delivered: ${prefetchedContext.deliverableSummary?.byStatus?.delivered || 0}
- Review Complete: ${prefetchedContext.deliverableSummary?.byStatus?.reviewComplete || 0}
- Awaiting Review: ${prefetchedContext.deliverableSummary?.byStatus?.awaitingReview || 0}
- In Progress: ${prefetchedContext.deliverableSummary?.byStatus?.inProgress || 0}

### Timesheets
- Total Entries: ${prefetchedContext.timesheetSummary?.totalEntries || 0}
- Total Hours: ${prefetchedContext.timesheetSummary?.totalHours || 0}

### Expenses
- Total Amount: £${(prefetchedContext.expenseSummary?.totalAmount || 0).toLocaleString()}
- Chargeable: £${(prefetchedContext.expenseSummary?.chargeableAmount || 0).toLocaleString()}

### RAID Summary
- Open Risks: ${prefetchedContext.raidSummary?.openRisks || 0}
- Open Issues: ${prefetchedContext.raidSummary?.openIssues || 0}
- High Priority: ${prefetchedContext.raidSummary?.highPriority || 0}

### Quality Standards
- Total: ${prefetchedContext.qualityStandardsSummary?.total || 0}
- Compliant: ${prefetchedContext.qualityStandardsSummary?.compliant || 0}
- Non-Compliant: ${prefetchedContext.qualityStandardsSummary?.nonCompliant || 0}
- Compliance Rate: ${prefetchedContext.qualityStandardsSummary?.complianceRate || 0}%

### Pending Actions
- Draft Timesheets: ${prefetchedContext.pendingActions?.draftTimesheets || 0}
- Awaiting Validation: ${prefetchedContext.pendingActions?.awaitingValidation || 0}`;
  }

  prompt += `

## Feature Guide Capability

You have access to detailed how-to guides for all application features via the **getFeatureGuide** tool.

**Use getFeatureGuide when users ask:**
- "How do I...?" questions (e.g., "How do I create a timesheet?")
- "What does [field] mean?" questions
- "What's the workflow for...?" questions
- "Can I do X with my role?" questions
- "Where do I find...?" questions
- "What are the steps to...?" questions

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

**Important:** Always use getFeatureGuide for procedural/how-to questions rather than guessing. The guides contain accurate step-by-step instructions, field explanations, workflow diagrams, and role-specific permissions.

## Response Guidelines
1. Be concise and helpful
2. Use UK date format (DD/MM/YYYY) and GBP (£)
3. Use pre-loaded data when possible, tools for specific queries
4. Respect user's role - data is automatically permission-scoped
5. If a query returns no results, suggest alternatives
6. For "what do I need to do" - check pending actions first
7. Offer to drill down when appropriate
8. Don't repeat tool results verbatim - synthesise into helpful responses
9. For how-to questions, always use getFeatureGuide first`;

  return prompt;
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
    const { messages, userContext, projectContext, projectId, prefetchedContext } = body;

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

    // Build context for tool execution and system prompt
    const context = {
      projectId: projectId || projectContext?.id,
      userContext: userContext || {},
      projectContext: projectContext || {},
      prefetchedContext: prefetchedContext || null,
    };

    // Get the last user message for routing decision
    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';
    
    // Determine if we can use the fast Haiku path
    const useHaiku = shouldUseHaiku(lastUserMessage, prefetchedContext);
    
    if (useHaiku) {
      // FAST PATH: Use Haiku with pre-fetched data (no tools needed)
      console.log('[Chat] Using Haiku fast path with pre-fetched context');
      
      const haikuPrompt = buildHaikuPrompt(context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELS.HAIKU,
          max_tokens: 1024,
          system: haikuPrompt,
          messages: sanitizedMessages,
        }),
      });

      if (!response.ok) {
        console.warn('[Chat] Haiku failed, falling back to Sonnet');
        // Fall through to Sonnet path below
      } else {
        const data = await response.json();
        const textContent = data.content.find(block => block.type === 'text');
        const responseText = textContent?.text || 'I apologize, but I was unable to generate a response.';

        // Log token usage for Haiku
        logTokenUsage(data.usage, userId, false, 'haiku');

        return new Response(JSON.stringify({
          message: responseText,
          usage: data.usage,
          toolsUsed: false,
          cached: false,
          model: 'haiku',
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        });
      }
    }

    // STANDARD PATH: Use Sonnet with tools
    // Build system prompt (includes pre-fetched data if available)
    const systemPrompt = buildSystemPrompt(context);
    
    // Log if we have pre-fetched context
    if (prefetchedContext) {
      console.log('[Chat] Using Sonnet with pre-fetched context and tools');
    } else {
      console.log('[Chat] Using Sonnet with tools (no pre-fetched context)');
    }

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
          model: MODELS.SONNET,
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
        
        // Execute ALL tools in PARALLEL for better performance
        const toolPromises = toolUseBlocks.map(async (toolUse) => {
          const startTime = Date.now();
          try {
            const result = await executeTool(toolUse.name, toolUse.input, context);
            console.log(`[Tool] ${toolUse.name} completed in ${Date.now() - startTime}ms`);
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
              success: true
            };
          } catch (error) {
            console.error(`[Tool] ${toolUse.name} failed after ${Date.now() - startTime}ms:`, error.message);
            // Return partial result with error info so Claude can still respond
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ 
                error: `Unable to retrieve ${toolUse.name} data. The query timed out or failed.`,
                partial: true,
                recoverable: true
              }),
              success: false
            };
          }
        });
        
        // Wait for all tools to complete (success or failure)
        const toolResults = await Promise.all(toolPromises);
        
        // Log summary of tool execution
        const successCount = toolResults.filter(r => r.success).length;
        const failCount = toolResults.filter(r => !r.success).length;
        if (failCount > 0) {
          console.log(`[Tools] ${successCount}/${toolResults.length} succeeded, ${failCount} failed`);
        }
        
        // Remove the success flag before sending to API
        const cleanedResults = toolResults.map(({ success, ...rest }) => rest);
        
        // Add assistant response and tool results to messages
        apiMessages = [
          ...apiMessages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: cleanedResults }
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
    logTokenUsage(finalResponse.usage, userId, iterations > 1, 'sonnet');

    return new Response(JSON.stringify({
      message: responseText,
      usage: finalResponse.usage,
      toolsUsed: iterations > 1,
      cached: false,
      model: 'sonnet',
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
