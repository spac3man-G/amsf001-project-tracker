/**
 * AI Gap Analysis - Vercel Serverless Function
 * 
 * Analyzes existing requirements to identify gaps against industry standards
 * and best practices. Suggests additional requirements based on the
 * project type, industry, and common procurement criteria.
 * 
 * Features:
 * - Requirement completeness analysis
 * - Industry-specific gap identification
 * - Suggested requirements generation
 * - Category coverage analysis
 * - AI task logging for audit trail
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8A - Document Parsing & Gap Analysis (Task 8A.5)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 120, // 120 seconds for analysis
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = 'claude-sonnet-4-20250514';

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
    name: "analyzeGaps",
    description: "Analyze the existing requirements set to identify gaps, missing areas, and suggest additional requirements based on industry best practices.",
    input_schema: {
      type: "object",
      properties: {
        coverage_analysis: {
          type: "object",
          description: "Analysis of how well current requirements cover key areas",
          properties: {
            overall_score: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Overall coverage percentage (0-100)"
            },
            by_category: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  coverage_score: { type: "number", minimum: 0, maximum: 100 },
                  requirement_count: { type: "integer" },
                  assessment: { 
                    type: "string",
                    enum: ["excellent", "good", "adequate", "weak", "missing"],
                    description: "Assessment of category coverage"
                  },
                  notes: { type: "string" }
                }
              }
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "Areas where requirements are particularly strong"
            },
            critical_gaps: {
              type: "array",
              items: { type: "string" },
              description: "Critical areas that are missing or underrepresented"
            }
          }
        },
        suggested_requirements: {
          type: "array",
          description: "New requirements suggested to fill identified gaps",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Clear, concise requirement title"
              },
              description: {
                type: "string",
                description: "Detailed requirement description"
              },
              priority: {
                type: "string",
                enum: ["must_have", "should_have", "could_have"],
                description: "Recommended priority"
              },
              category_suggestion: {
                type: "string",
                description: "Suggested category for this requirement"
              },
              gap_addressed: {
                type: "string",
                description: "Which gap this requirement addresses"
              },
              rationale: {
                type: "string",
                description: "Why this requirement is important"
              },
              industry_reference: {
                type: "string",
                description: "Industry standard or best practice reference (if applicable)"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence that this requirement is needed"
              }
            },
            required: ["title", "description", "priority", "gap_addressed", "rationale"]
          }
        },
        analysis_summary: {
          type: "string",
          description: "Executive summary of the gap analysis"
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "High-level recommendations for improving requirement coverage"
        },
        statistics: {
          type: "object",
          properties: {
            total_existing: { type: "integer" },
            total_suggested: { type: "integer" },
            categories_covered: { type: "integer" },
            categories_missing: { type: "integer" }
          }
        }
      },
      required: ["coverage_analysis", "suggested_requirements", "analysis_summary", "statistics"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert business analyst specializing in requirements engineering and vendor evaluation for enterprise software procurement.

Your task is to analyze an existing set of requirements and identify gaps - areas that are missing, underrepresented, or inadequately covered. You should suggest additional requirements based on:

1. **Industry best practices** for the project type
2. **Common procurement criteria** that are often overlooked
3. **Regulatory and compliance requirements** that may apply
4. **Technical and operational considerations** for enterprise systems
5. **User experience and change management** aspects

Key areas to check for coverage:

**Functional Areas:**
- Core business functionality
- Workflow and process automation
- Data management and reporting
- User interface and experience

**Technical Areas:**
- System integration requirements
- Data migration needs
- Performance and scalability
- Infrastructure and hosting
- Security architecture

**Non-Functional Areas:**
- Security and access control
- Compliance and audit trails
- Availability and disaster recovery
- Performance benchmarks
- Scalability requirements

**Operational Areas:**
- Support and maintenance
- Training and documentation
- Implementation and deployment
- Upgrade path and roadmap
- Vendor stability and viability

**Commercial Areas:**
- Licensing and pricing model
- Contract terms
- SLA requirements
- Exit strategy

Gap severity guidelines:
- **Critical**: Missing requirements that could cause project failure
- **High**: Significant gaps that could impact success
- **Medium**: Notable omissions that should be addressed
- **Low**: Nice-to-have additions for completeness

Always use the analyzeGaps tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAITask(supabase, evaluationProjectId, userId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'gap_analysis',
      status: 'processing',
      input_data: {
        analysis_type: 'gap_analysis'
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

async function getExistingRequirements(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('requirements')
    .select(`
      id,
      title,
      description,
      priority,
      category:evaluation_categories(name),
      stakeholder_area:stakeholder_areas(name)
    `)
    .eq('evaluation_project_id', evaluationProjectId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) {
    throw new Error(`Failed to fetch requirements: ${error.message}`);
  }
  return data || [];
}

async function getEvaluationProject(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_projects')
    .select(`
      name,
      description,
      client_name,
      industry_type,
      project_type
    `)
    .eq('id', evaluationProjectId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch evaluation project: ${error.message}`);
  }
  return data;
}

async function getCategories(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_categories')
    .select('id, name, weight')
    .eq('evaluation_project_id', evaluationProjectId)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
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
      additionalContext  // Optional: industry type, project type, specific focus areas
    } = req.body;

    if (!evaluationProjectId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: evaluationProjectId, userId' 
      });
    }

    // Create AI task record
    aiTask = await createAITask(supabase, evaluationProjectId, userId);

    // Fetch existing requirements
    const requirements = await getExistingRequirements(supabase, evaluationProjectId);
    
    if (requirements.length === 0) {
      return res.status(400).json({
        error: 'No existing requirements found. Please add some requirements before running gap analysis.'
      });
    }

    // Fetch project context
    const project = await getEvaluationProject(supabase, evaluationProjectId);
    const categories = await getCategories(supabase, evaluationProjectId);

    // Format requirements for Claude
    const formattedRequirements = requirements.map(r => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      category: r.category?.name || 'Uncategorized',
      stakeholder_area: r.stakeholder_area?.name || 'General'
    }));

    // Group by category for summary
    const byCategory = formattedRequirements.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    // Build the analysis request
    const contextText = `
## Evaluation Project Context

**Project Name:** ${project.name}
**Client:** ${project.client_name || 'Not specified'}
**Industry:** ${project.industry_type || additionalContext?.industry || 'Enterprise Software'}
**Project Type:** ${project.project_type || additionalContext?.projectType || 'Technology Procurement'}

${project.description ? `**Description:** ${project.description}` : ''}

${additionalContext?.focusAreas ? `**Focus Areas:** ${additionalContext.focusAreas.join(', ')}` : ''}

## Available Categories
${categories.map(c => `- ${c.name} (weight: ${c.weight}%)`).join('\n')}

## Current Requirements Summary

**Total Requirements:** ${requirements.length}

**By Category:**
${Object.entries(byCategory).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

## Existing Requirements

${formattedRequirements.map((r, i) => `
### ${i + 1}. ${r.title}
- **Category:** ${r.category}
- **Priority:** ${r.priority}
- **Stakeholder Area:** ${r.stakeholder_area}
- **Description:** ${r.description}
`).join('\n')}
`;

    const messages = [
      {
        role: "user",
        content: `Please analyze the following requirements set for gaps and suggest additional requirements.\n\n${contextText}`
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
        tool_choice: { type: "tool", name: "analyzeGaps" },
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
    let analysisData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'analyzeGaps') {
        analysisData = block.input;
        break;
      }
    }

    if (!analysisData) {
      throw new Error('No gap analysis result from AI');
    }

    // Add metadata
    analysisData.duration_ms = duration;
    analysisData.model = MODEL;
    analysisData.analyzed_at = new Date().toISOString();
    analysisData.existing_requirements_count = requirements.length;

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', analysisData, result.usage);
    }

    // Calculate cost
    const cost = result.usage 
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    return res.status(200).json({
      success: true,
      evaluationProjectId,
      ...analysisData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Gap analysis error:', error);
    
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform gap analysis'
    });
  }
}
