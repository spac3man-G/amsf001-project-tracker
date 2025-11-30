// Vercel Edge Function for AI Chat
// Uses Claude Haiku for fast, cost-effective responses
// Multi-tenant ready - project context injected dynamically
// Version 2.0 - Added rate limiting and input sanitisation

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ============================================
// RATE LIMITING (Simple in-memory for Edge)
// ============================================

// Rate limit configuration
const RATE_LIMIT = {
  maxRequests: 20,      // Maximum requests per window
  windowMs: 60 * 1000,  // 1 minute window
};

// Simple in-memory store (resets on cold start, but Edge functions are ephemeral)
// For production, consider using Vercel KV or Upstash Redis
const rateLimitStore = new Map();

/**
 * Check rate limit for a user
 * @param {string} userId - User identifier (email or IP)
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const key = `rl:${userId}`;
  
  let record = rateLimitStore.get(key);
  
  // Clean up old records
  if (record && record.resetAt <= now) {
    rateLimitStore.delete(key);
    record = null;
  }
  
  if (!record) {
    // Create new record
    record = {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    };
    rateLimitStore.set(key, record);
    
    return {
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetAt: record.resetAt,
    };
  }
  
  // Increment existing record
  record.count++;
  
  if (record.count > RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }
  
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

// ============================================
// INPUT SANITISATION
// ============================================

/**
 * Sanitise chat message content
 * @param {string} content - Message content
 * @returns {string} Sanitised content
 */
function sanitizeMessage(content) {
  if (!content || typeof content !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = content.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and limit length (prevent huge payloads)
  sanitized = sanitized.trim();
  if (sanitized.length > 4000) {
    sanitized = sanitized.substring(0, 4000);
  }
  
  return sanitized;
}

/**
 * Sanitise messages array
 * @param {Array} messages - Array of message objects
 * @returns {Array} Sanitised messages
 */
function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  
  return messages
    .slice(-10) // Limit to last 10 messages (prevent huge context)
    .filter(msg => msg && typeof msg === 'object')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeMessage(msg.content),
    }))
    .filter(msg => msg.content.length > 0);
}

// ============================================
// SYSTEM PROMPT
// ============================================

const BASE_SYSTEM_PROMPT = `You are the AI Assistant for this Project Tracker application. Your role is to help users understand how to use the application and answer questions about their project data.

## About the Application
This is a project management tool for tracking supplier/customer engagements including:
- **Milestones**: Major project phases with dates, budgets, and completion percentages
- **Deliverables**: Work items linked to milestones with review workflows
- **Resources**: Team members with daily rates, allocations, and utilisation tracking
- **Timesheets**: Time entries submitted by resources, requiring approval
- **Expenses**: Cost claims with categories (Travel, Accommodation, Sustenance)
- **Partners**: Third-party suppliers with invoice generation
- **KPIs**: Key Performance Indicators with targets and assessments
- **Quality Standards**: Quality criteria linked to deliverables

## User Roles & Permissions
- **Admin**: Full access to everything, can manage users and settings
- **Supplier PM**: Can manage most project data, see cost prices and margins, manage partners and invoices
- **Customer PM**: Approve timesheets, validate chargeable expenses, review deliverables
- **Contributor**: Can submit their own timesheets and expenses, view assigned work

## Workflow Overview
### Timesheet Workflow
1. Resource creates timesheet (Draft)
2. Resource submits for approval (Submitted)
3. Customer PM approves or rejects (Approved/Rejected)
4. Approved timesheets count towards project spend

### Expense Workflow
1. Resource creates expense (Draft)
2. Resource submits for validation (Submitted)
3. Chargeable expenses → Customer PM validates
4. Non-chargeable expenses → Supplier PM validates

### Partner Invoice Workflow
1. Resources (linked to partner) have approved timesheets
2. Partner-procured expenses are recorded
3. Supplier PM selects date range
4. Invoice generated with timesheet costs + expenses
5. Invoice sent to partner and tracked to payment

## How to Help Users
1. **App Usage Questions**: Explain how features work, where to find things, how to perform actions
2. **Data Questions**: When users ask about their data, use the context provided to answer accurately
3. **Permission Questions**: Explain what actions their role allows them to perform
4. **Navigation**: Guide users to the correct pages for their needs
5. **Calculations**: Help users understand how costs, utilisation, and margins are calculated

## Key Pages
- **Workflow Summary**: See all pending approvals and actions (appears first for action-oriented users)
- **Dashboard**: Overview with project health, milestone progress, budget status
- **Reports**: Detailed analytics and exportable summaries
- **Gantt Chart**: Visual timeline view of milestones
- **Milestones**: Create and track project milestones with budgets
- **Deliverables**: Manage work items with review workflow (Draft → Submitted → Delivered)
- **KPIs**: Track performance indicators against targets
- **Quality Standards**: Manage quality criteria
- **Resources**: View team members, allocations, and partner links
- **Timesheets**: Submit and approve time entries
- **Expenses**: Submit and validate expense claims
- **Partners**: Manage third-party suppliers and generate invoices (Supplier PM/Admin only)
- **Users**: User management (Admin/Supplier PM only)
- **Settings**: Configure project parameters (Admin/Supplier PM only)

## Response Guidelines
- Be concise and helpful
- Use the user's name when provided
- Reference specific numbers and data when available
- If you don't have data to answer a question, explain what information would be needed
- For complex operations, provide step-by-step guidance
- Always respect the user's permission level - don't suggest actions they cannot perform
- Use UK date format (DD/MM/YYYY) and GBP currency (£)`;

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for API key
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, userContext, dataContext, projectContext } = body;

    // Get user identifier for rate limiting
    const userId = userContext?.email || 
                   req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   'anonymous';

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait a moment before sending another message.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      });
    }

    // Sanitise input messages
    const sanitizedMessages = sanitizeMessages(messages);
    
    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build the full system prompt with dynamic context
    let fullSystemPrompt = BASE_SYSTEM_PROMPT;

    // Add project context if provided (multi-tenant support)
    if (projectContext) {
      fullSystemPrompt += `\n\n## Current Project Context
- Project Reference: ${sanitizeMessage(projectContext.reference) || 'Unknown'}
- Project Name: ${sanitizeMessage(projectContext.name) || 'Unknown'}
- Description: ${sanitizeMessage(projectContext.description) || 'N/A'}`;
    }

    // Add user context
    if (userContext) {
      fullSystemPrompt += `\n\n## Current User Context
- Name: ${sanitizeMessage(userContext.name) || 'Unknown'}
- Email: ${sanitizeMessage(userContext.email) || 'Unknown'}
- Role: ${sanitizeMessage(userContext.role) || 'Unknown'}
- Linked Resource: ${sanitizeMessage(userContext.linkedResourceName) || 'None'}`;
      
      // Add role-specific hints
      if (userContext.role === 'supplier_pm') {
        fullSystemPrompt += `\n- This user can manage partners, generate invoices, and see cost prices`;
      } else if (userContext.role === 'customer_pm') {
        fullSystemPrompt += `\n- This user approves timesheets and validates chargeable expenses`;
      } else if (userContext.role === 'contributor') {
        fullSystemPrompt += `\n- This user can only submit their own timesheets and expenses`;
      }
    }

    // Add data context (limit size)
    if (dataContext) {
      const sanitizedDataContext = sanitizeMessage(dataContext);
      if (sanitizedDataContext.length > 0) {
        fullSystemPrompt += `\n\n## Current Data Context
${sanitizedDataContext.substring(0, 2000)}`;
      }
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: sanitizedMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      message: data.content[0].text,
      usage: data.usage,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
