/**
 * AI Market Research - Vercel Serverless Function
 * 
 * Uses Claude AI to research potential vendors for an evaluation project
 * based on the project type, requirements, and industry context.
 * 
 * Features:
 * - Vendor identification based on project requirements
 * - Industry-specific market analysis
 * - Vendor strength/weakness analysis
 * - Market positioning insights
 * - AI task logging for audit trail
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8B - Market Research & AI Assistant (Task 8B.1)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 120, // 120 seconds for research
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = 'claude-opus-4-5-20251101';  // Updated to Opus 4.5 per BUG-007

// Initialize Supabase client
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// Token costs for monitoring
const TOKEN_COSTS = {
  input: 3.00,
  output: 15.00,
};

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: "researchVendors",
    description: "Research and identify potential vendors for the software procurement project based on project context, requirements, and industry.",
    input_schema: {
      type: "object",
      properties: {
        market_overview: {
          type: "object",
          description: "Overview of the market landscape",
          properties: {
            summary: {
              type: "string",
              description: "Executive summary of the market for this type of solution"
            },
            market_size_indicator: {
              type: "string",
              enum: ["emerging", "growing", "mature", "consolidating"],
              description: "Market maturity indicator"
            },
            key_trends: {
              type: "array",
              items: { type: "string" },
              description: "Key market trends relevant to this procurement"
            },
            buyer_considerations: {
              type: "array",
              items: { type: "string" },
              description: "Important considerations for buyers in this market"
            }
          }
        },
        vendor_recommendations: {
          type: "array",
          description: "Recommended vendors to evaluate",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Vendor/product name"
              },
              description: {
                type: "string",
                description: "Brief description of the vendor and their solution"
              },
              website: {
                type: "string",
                description: "Vendor website URL"
              },
              market_position: {
                type: "string",
                enum: ["leader", "challenger", "niche", "emerging"],
                description: "Vendor's market position"
              },
              target_market: {
                type: "string",
                enum: ["enterprise", "mid_market", "smb", "all_segments"],
                description: "Primary target market"
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Key strengths of this vendor"
              },
              considerations: {
                type: "array",
                items: { type: "string" },
                description: "Potential concerns or considerations"
              },
              fit_score: {
                type: "number",
                minimum: 1,
                maximum: 10,
                description: "Estimated fit for the project (1-10)"
              },
              fit_rationale: {
                type: "string",
                description: "Brief explanation of the fit score"
              },
              pricing_model: {
                type: "string",
                description: "Typical pricing model (e.g., subscription, perpetual, usage-based)"
              },
              deployment_options: {
                type: "array",
                items: { type: "string" },
                description: "Available deployment options (cloud, on-premise, hybrid)"
              }
            },
            required: ["name", "description", "market_position", "strengths", "fit_score", "fit_rationale"]
          }
        },
        evaluation_recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Recommendations for how to approach vendor evaluation"
        },
        additional_research_suggestions: {
          type: "array",
          items: { type: "string" },
          description: "Suggestions for additional research or discovery activities"
        },
        statistics: {
          type: "object",
          properties: {
            total_vendors_identified: { type: "integer" },
            leaders_count: { type: "integer" },
            challengers_count: { type: "integer" },
            niche_count: { type: "integer" },
            emerging_count: { type: "integer" }
          }
        }
      },
      required: ["market_overview", "vendor_recommendations", "evaluation_recommendations", "statistics"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert enterprise software analyst specializing in vendor research and market analysis for technology procurement.

Your task is to research and identify potential vendors based on the project requirements and context provided. Focus on providing actionable insights that help procurement teams make informed decisions.

Guidelines for vendor research:
1. **Relevance**: Only recommend vendors that genuinely fit the stated requirements
2. **Objectivity**: Present balanced views including both strengths and considerations
3. **Practicality**: Focus on vendors that are actually obtainable for the target market
4. **Currency**: Base recommendations on current market knowledge

Market position definitions:
- **Leader**: Established vendor with significant market share and comprehensive offering
- **Challenger**: Strong competitor aiming to displace leaders, often with innovative features
- **Niche**: Specialized vendor excelling in specific domains or verticals
- **Emerging**: Newer entrant with promising capabilities but less proven track record

Fit score guidelines (1-10):
- 9-10: Excellent fit - strongly matches requirements, recommended for shortlist
- 7-8: Good fit - matches most requirements, worth evaluating
- 5-6: Moderate fit - matches some requirements, conditional recommendation
- 3-4: Limited fit - significant gaps, only consider if few alternatives
- 1-2: Poor fit - major misalignment, not recommended

Target market segments:
- **Enterprise**: Large organizations (1000+ employees), complex needs
- **Mid-market**: Medium organizations (100-1000 employees)
- **SMB**: Small businesses (under 100 employees)
- **All segments**: Solutions that scale across organization sizes

Important: Base your analysis on your knowledge of real software vendors and their actual capabilities. Do not invent fictional vendors.

Always use the researchVendors tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAITask(supabase, evaluationProjectId, userId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'market_research',
      status: 'processing',
      input_data: {
        analysis_type: 'market_research'
      },
      initiated_by: userId,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create AI task:', error);
    return null;
  }
  return data;
}

async function updateAITask(supabase, taskId, status, outputData, usage, error = null) {
  const updateData = {
    status,
    output_data: outputData,
    completed_at: new Date().toISOString(),
    duration_ms: outputData?.duration_ms
  };

  if (usage) {
    updateData.input_tokens = usage.input_tokens;
    updateData.output_tokens = usage.output_tokens;
    updateData.model_used = MODEL;
  }

  if (error) {
    updateData.error_message = error.message || String(error);
    updateData.error_details = { stack: error.stack };
  }

  await supabase
    .from('ai_tasks')
    .update(updateData)
    .eq('id', taskId);
}

async function getEvaluationProject(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_projects')
    .select(`
      name,
      description,
      client_name,
      settings
    `)
    .eq('id', evaluationProjectId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch evaluation project: ${error.message}`);
  }
  return data;
}

async function getRequirementsSummary(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('requirements')
    .select(`
      id,
      title,
      description,
      priority,
      category:evaluation_categories(name)
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .in('priority', ['must_have', 'should_have'])
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch requirements: ${error.message}`);
  }
  return data || [];
}

async function getExistingVendors(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('name, status')
    .eq('evaluation_project_id', evaluationProjectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) {
    console.error('Failed to fetch existing vendors:', error);
    return [];
  }
  return data || [];
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Database service not configured' });
  }

  const startTime = Date.now();
  let aiTask = null;

  try {
    const { 
      evaluationProjectId, 
      userId,
      additionalContext  // Optional: specific requirements focus, budget range, etc.
    } = req.body;

    if (!evaluationProjectId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: evaluationProjectId, userId' 
      });
    }

    // Create AI task record
    aiTask = await createAITask(supabase, evaluationProjectId, userId);

    // Fetch project context
    const project = await getEvaluationProject(supabase, evaluationProjectId);
    
    // Fetch requirements for context
    const requirements = await getRequirementsSummary(supabase, evaluationProjectId);
    
    // Fetch existing vendors to avoid duplicates
    const existingVendors = await getExistingVendors(supabase, evaluationProjectId);

    // Format requirements by category
    const requirementsByCategory = {};
    requirements.forEach(req => {
      const catName = req.category?.name || 'General';
      if (!requirementsByCategory[catName]) {
        requirementsByCategory[catName] = [];
      }
      requirementsByCategory[catName].push({
        title: req.title,
        priority: req.priority
      });
    });

    // Build the research request
    const contextText = `
## Evaluation Project Context

**Project Name:** ${project.name}
**Client:** ${project.client_name || 'Not specified'}
**Industry:** ${additionalContext?.industry || 'Enterprise Software'}
**Project Type:** ${additionalContext?.projectType || 'Technology Procurement'}

${project.description ? `**Description:** ${project.description}` : ''}

${additionalContext?.budgetRange ? `**Budget Range:** ${additionalContext.budgetRange}` : ''}
${additionalContext?.timeline ? `**Timeline:** ${additionalContext.timeline}` : ''}
${additionalContext?.specificFocus ? `**Specific Focus:** ${additionalContext.specificFocus}` : ''}

## Key Requirements

${Object.entries(requirementsByCategory).map(([cat, reqs]) => `
### ${cat}
${reqs.map(r => `- [${r.priority === 'must_have' ? 'Must' : 'Should'}] ${r.title}`).join('\n')}
`).join('\n')}

## Existing Vendors (Already in System)
${existingVendors.length > 0
  ? existingVendors.map(v => `- ${v.name} (${v.status})`).join('\n')
  : 'None yet - this is initial market research'}

## Research Request
Please identify and recommend vendors suitable for this procurement. Exclude any vendors already listed above to avoid duplicates.

Focus on vendors that:
1. Address the key requirements listed
2. Serve the enterprise market
3. Would be appropriate for ${project.client_name || 'the client'}
`;

    const messages = [
      {
        role: "user",
        content: `Please conduct market research for the following software procurement project.\n\n${contextText}`
      }
    ];

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "researchVendors" },
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Extract tool use result
    let researchData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'researchVendors') {
        researchData = block.input;
        break;
      }
    }

    if (!researchData) {
      throw new Error('No market research result from AI');
    }

    // Add metadata
    researchData.duration_ms = duration;
    researchData.model = MODEL;
    researchData.researched_at = new Date().toISOString();
    researchData.existing_vendors_count = existingVendors.length;
    researchData.requirements_analyzed = requirements.length;

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', researchData, result.usage);
    }

    // Calculate cost
    const cost = result.usage 
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    return res.status(200).json({
      success: true,
      evaluationProjectId,
      ...researchData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Market research error:', error);
    
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform market research'
    });
  }
}
