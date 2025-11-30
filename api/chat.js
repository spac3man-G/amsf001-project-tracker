// Vercel Edge Function for AI Chat
// Uses Claude Haiku for fast, cost-effective responses
// Multi-tenant ready - project context injected dynamically

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Base system prompt - generic, multi-tenant ready
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
- **Dashboard**: Overview with project health, milestone progress, budget status
- **Milestones**: Create and track project milestones with budgets
- **Deliverables**: Manage work items with review workflow (Draft → Submitted → Delivered)
- **Resources**: View team members, allocations, and partner links
- **Partners**: Manage third-party suppliers and generate invoices (Supplier PM/Admin only)
- **Timesheets**: Submit and approve time entries
- **Expenses**: Submit and validate expense claims
- **KPIs**: Track performance indicators against targets
- **Quality Standards**: Manage quality criteria
- **Workflow Summary**: See all pending approvals and actions
- **Settings**: Configure project parameters (admin/supplier PM only)

## Response Guidelines
- Be concise and helpful
- Use the user's name when provided
- Reference specific numbers and data when available
- If you don't have data to answer a question, explain what information would be needed
- For complex operations, provide step-by-step guidance
- Always respect the user's permission level - don't suggest actions they cannot perform
- Use UK date format (DD/MM/YYYY) and GBP currency (£)`;

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
    const { messages, userContext, dataContext, projectContext } = await req.json();

    // Build the full system prompt with dynamic context
    let fullSystemPrompt = BASE_SYSTEM_PROMPT;

    // Add project context if provided (multi-tenant support)
    if (projectContext) {
      fullSystemPrompt += `\n\n## Current Project Context
- Project Reference: ${projectContext.reference || 'Unknown'}
- Project Name: ${projectContext.name || 'Unknown'}
- Description: ${projectContext.description || 'N/A'}`;
    }

    // Add user context
    if (userContext) {
      fullSystemPrompt += `\n\n## Current User Context
- Name: ${userContext.name || 'Unknown'}
- Email: ${userContext.email || 'Unknown'}
- Role: ${userContext.role || 'Unknown'}
- Linked Resource: ${userContext.linkedResourceName || 'None'}`;
      
      // Add role-specific hints
      if (userContext.role === 'supplier_pm') {
        fullSystemPrompt += `\n- This user can manage partners, generate invoices, and see cost prices`;
      } else if (userContext.role === 'customer_pm') {
        fullSystemPrompt += `\n- This user approves timesheets and validates chargeable expenses`;
      } else if (userContext.role === 'contributor') {
        fullSystemPrompt += `\n- This user can only submit their own timesheets and expenses`;
      }
    }

    // Add data context
    if (dataContext) {
      fullSystemPrompt += `\n\n## Current Data Context
${dataContext}`;
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
        messages: messages,
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
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
