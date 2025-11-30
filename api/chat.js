// Vercel Edge Function for AI Chat
// Uses Claude Haiku 4 for fast, cost-effective responses

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// System prompt with app documentation
const SYSTEM_PROMPT = `You are the AI Assistant for the AMSF001 Project Tracker application. Your role is to help users understand how to use the application and answer questions about their project data.

## About the Application
AMSF001 Project Tracker is a project management tool for tracking:
- **Milestones**: Major project phases with dates, budgets, and completion percentages
- **Deliverables**: Work items linked to milestones with review workflows
- **Resources**: Team members with daily rates, allocations, and utilization tracking
- **Timesheets**: Time entries submitted by resources, requiring approval
- **Expenses**: Cost claims with categories (travel, accommodation, subsistence, other)
- **KPIs**: Key Performance Indicators with targets and assessments
- **Quality Standards**: Quality criteria linked to deliverables

## User Roles & Permissions
- **Admin**: Full access to everything, can manage users and settings
- **Supplier PM**: Can manage most project data, see cost prices and margins, approve timesheets/expenses
- **Customer PM**: Read-only view of project progress, can review deliverables, cannot see cost prices
- **Contributor**: Can submit their own timesheets and expenses, view assigned work

## How to Help Users
1. **App Usage Questions**: Explain how features work, where to find things, how to perform actions
2. **Data Questions**: When users ask about their data, use the context provided to answer accurately
3. **Permission Questions**: Explain what actions their role allows them to perform
4. **Navigation**: Guide users to the correct pages for their needs

## Key Pages
- **Dashboard**: Overview with project health, milestone progress, budget status
- **Milestones**: Create and track project milestones
- **Deliverables**: Manage work items with review workflow (Draft → Submitted → Delivered)
- **Resources**: View team members and their allocations
- **Timesheets**: Submit and approve time entries
- **Expenses**: Submit and validate expense claims
- **KPIs**: Track performance indicators
- **Quality Standards**: Manage quality criteria
- **Workflow Summary**: See all pending approvals and actions
- **Settings**: Configure project parameters (admin/supplier PM only)

## Response Guidelines
- Be concise and helpful
- Use the user's name when provided
- Reference specific numbers and data when available
- If you don't have data to answer a question, explain what information would be needed
- For complex operations, provide step-by-step guidance
- Always respect the user's permission level - don't suggest actions they cannot perform`;

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
    const { messages, userContext, dataContext } = await req.json();

    // Build the full system prompt with user and data context
    let fullSystemPrompt = SYSTEM_PROMPT;

    if (userContext) {
      fullSystemPrompt += `\n\n## Current User Context
- Name: ${userContext.name || 'Unknown'}
- Email: ${userContext.email || 'Unknown'}
- Role: ${userContext.role || 'Unknown'}
- Linked Resource: ${userContext.linkedResourceName || 'None'}`;
    }

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
