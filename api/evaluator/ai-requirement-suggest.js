/**
 * AI Requirement Suggest - Vercel Serverless Function
 * 
 * Uses Claude AI to improve requirement language, suggest alternatives,
 * and provide recommendations for making requirements more clear and testable.
 * 
 * Features:
 * - Requirement language improvement
 * - Ambiguity detection and resolution
 * - Testability suggestions
 * - Similar requirement identification
 * - Priority recommendations
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8B - Market Research & AI Assistant (Task 8B.4, 8B.5)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for suggestion
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
    name: "improveRequirement",
    description: "Analyze a requirement and suggest improvements to make it clearer, more testable, and better structured.",
    input_schema: {
      type: "object",
      properties: {
        analysis: {
          type: "object",
          description: "Analysis of the original requirement",
          properties: {
            clarity_score: {
              type: "number",
              minimum: 1,
              maximum: 10,
              description: "Clarity score of original requirement (1-10)"
            },
            testability_score: {
              type: "number",
              minimum: 1,
              maximum: 10,
              description: "Testability score of original requirement (1-10)"
            },
            completeness_score: {
              type: "number",
              minimum: 1,
              maximum: 10,
              description: "Completeness score of original requirement (1-10)"
            },
            issues_found: {
              type: "array",
              items: { type: "string" },
              description: "Specific issues identified in the original requirement"
            },
            ambiguous_terms: {
              type: "array",
              items: { type: "string" },
              description: "Terms that are vague or ambiguous"
            }
          }
        },
        improved_requirement: {
          type: "object",
          description: "Improved version of the requirement",
          properties: {
            title: {
              type: "string",
              description: "Improved title (clear and concise)"
            },
            description: {
              type: "string",
              description: "Improved description with specific, measurable criteria"
            },
            acceptance_criteria: {
              type: "array",
              items: { type: "string" },
              description: "Suggested acceptance criteria for testing"
            }
          },
          required: ["title", "description"]
        },
        alternative_phrasings: {
          type: "array",
          description: "Alternative ways to express this requirement",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              emphasis: {
                type: "string",
                description: "What this alternative emphasizes (e.g., 'user-focused', 'technical', 'outcome-based')"
              }
            }
          }
        },
        priority_recommendation: {
          type: "object",
          properties: {
            suggested_priority: {
              type: "string",
              enum: ["must_have", "should_have", "could_have", "wont_have"],
              description: "Recommended priority based on requirement content"
            },
            rationale: {
              type: "string",
              description: "Reasoning for the priority recommendation"
            }
          }
        },
        category_suggestion: {
          type: "string",
          description: "Suggested category for this requirement"
        },
        related_requirements: {
          type: "array",
          items: { type: "string" },
          description: "Types of related requirements that should also be considered"
        },
        improvement_summary: {
          type: "string",
          description: "Summary of key improvements made"
        }
      },
      required: ["analysis", "improved_requirement", "improvement_summary"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert business analyst specializing in requirements engineering for enterprise software procurement.

Your task is to analyze requirements and suggest improvements to make them:
1. **Clear**: Unambiguous language that all stakeholders understand
2. **Testable**: Can be verified through demonstration or measurement
3. **Complete**: Contains all necessary information
4. **Consistent**: Doesn't contradict other requirements
5. **Atomic**: Addresses a single capability or constraint

Requirements quality guidelines:

**Common issues to look for:**
- Vague terms: "user-friendly", "fast", "easy", "flexible", "intuitive"
- Missing quantification: No specific numbers, percentages, or timeframes
- Compound requirements: Multiple requirements bundled together
- Implementation bias: Specifying HOW instead of WHAT
- Missing context: Who, what, when, where, why not clear

**Improvement strategies:**
- Replace vague terms with specific, measurable criteria
- Add acceptance criteria that can be demonstrated
- Split compound requirements into atomic ones
- Focus on business outcomes rather than technical solutions
- Include context and success criteria

**Priority indicators:**
- must_have: "shall", "must", "required", "mandatory", "critical", legal/compliance requirements
- should_have: "should", "expected", "important", key business value
- could_have: "may", "could", "nice to have", desirable enhancements
- wont_have: "will not", "future", explicitly deferred

Always use the improveRequirement tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAITask(supabase, evaluationProjectId, userId, requirementId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'requirement_suggest',
      status: 'processing',
      input_data: {
        requirement_id: requirementId
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

async function getRequirement(supabase, requirementId) {
  const { data, error } = await supabase
    .from('requirements')
    .select(`
      id,
      title,
      description,
      priority,
      status,
      category:evaluation_categories(id, name),
      stakeholder_area:stakeholder_areas(id, name),
      evaluation_project_id
    `)
    .eq('id', requirementId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch requirement: ${error.message}`);
  }
  return data;
}

async function getProjectContext(supabase, evaluationProjectId) {
  const { data, error } = await supabase
    .from('evaluation_projects')
    .select('name, description, settings')
    .eq('id', evaluationProjectId)
    .single();

  if (error) {
    console.error('Failed to fetch project context:', error);
    return null;
  }
  return data;
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
      requirementId,
      userId,
      // Alternative: provide requirement directly without ID
      requirementText
    } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId' 
      });
    }

    if (!requirementId && !requirementText) {
      return res.status(400).json({ 
        error: 'Either requirementId or requirementText is required' 
      });
    }

    let requirement;
    let evaluationProjectId;
    let projectContext = null;

    if (requirementId) {
      // Fetch existing requirement
      requirement = await getRequirement(supabase, requirementId);
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found' });
      }
      evaluationProjectId = requirement.evaluation_project_id;
      projectContext = await getProjectContext(supabase, evaluationProjectId);
    } else {
      // Use provided text
      requirement = {
        title: requirementText.title || 'Untitled Requirement',
        description: requirementText.description || requirementText.title,
        priority: requirementText.priority || null,
        category: requirementText.category ? { name: requirementText.category } : null
      };
      evaluationProjectId = requirementText.evaluationProjectId;
      if (evaluationProjectId) {
        projectContext = await getProjectContext(supabase, evaluationProjectId);
      }
    }

    // Create AI task record if we have a project ID
    if (evaluationProjectId) {
      aiTask = await createAITask(supabase, evaluationProjectId, userId, requirementId);
    }

    // Build the analysis request
    const contextText = `
## Requirement to Improve

**Title:** ${requirement.title}

**Description:** ${requirement.description || 'No description provided'}

${requirement.priority ? `**Current Priority:** ${requirement.priority}` : ''}
${requirement.category?.name ? `**Category:** ${requirement.category.name}` : ''}
${requirement.stakeholder_area?.name ? `**Stakeholder Area:** ${requirement.stakeholder_area.name}` : ''}

${projectContext ? `
## Project Context
**Project:** ${projectContext.name}
${projectContext.description ? `**Description:** ${projectContext.description}` : ''}
` : ''}

Please analyze this requirement and suggest improvements to make it clearer, more testable, and better structured.
`;

    const messages = [
      {
        role: "user",
        content: contextText
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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "improveRequirement" },
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
    let suggestionData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'improveRequirement') {
        suggestionData = block.input;
        break;
      }
    }

    if (!suggestionData) {
      throw new Error('No suggestion result from AI');
    }

    // Add metadata
    suggestionData.duration_ms = duration;
    suggestionData.model = MODEL;
    suggestionData.suggested_at = new Date().toISOString();
    suggestionData.original_requirement = {
      id: requirementId,
      title: requirement.title,
      description: requirement.description
    };

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', suggestionData, result.usage);
    }

    // Calculate cost
    const cost = result.usage 
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    return res.status(200).json({
      success: true,
      requirementId,
      ...suggestionData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Requirement suggestion error:', error);
    
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate suggestion'
    });
  }
}
