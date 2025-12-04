// Vercel Edge Function for Streaming AI Chat
// Version 1.0 - Streaming responses for simple queries (Haiku fast path)

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Build a simpler prompt for Haiku (no tools, just pre-fetched data)
function buildHaikuPrompt(userContext, projectContext, prefetchedContext) {
  return `You are a helpful project assistant. Answer the user's question using ONLY the provided data below. Be concise and helpful. Use UK date format (DD/MM/YYYY) and GBP currency (£).

## User
- Name: ${userContext?.name || 'Unknown'}
- Role: ${userContext?.role || 'Unknown'}

## Project: ${projectContext?.name || 'AMSF001'}

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

Answer naturally and helpfully. If you need more specific information than provided, say you can help find more details if they ask.`;
}

export default async function handler(req) {
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

  try {
    const { messages, userContext, projectContext, prefetchedContext } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildHaikuPrompt(userContext, projectContext, prefetchedContext);

    // Call Anthropic with streaming enabled
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.slice(-10),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic streaming error:', error);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform the SSE stream into a simpler text stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle different event types
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                // Send just the text content
                controller.enqueue(encoder.encode(parsed.delta.text));
              } else if (parsed.type === 'message_stop') {
                // Message complete
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                // Could send usage stats at the end if needed
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      },
    });

    // Pipe the response through our transform
    const readableStream = response.body.pipeThrough(transformStream);

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Streaming error:', error);
    return new Response(JSON.stringify({ error: 'Streaming failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
