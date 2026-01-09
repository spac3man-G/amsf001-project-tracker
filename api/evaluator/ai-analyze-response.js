/**
 * AI Response Analysis - Vercel Serverless Function
 *
 * Analyzes vendor responses using Claude to provide:
 * - Summary of response content
 * - Key points extraction
 * - Compliance gap identification
 * - Strengths and differentiators
 * - Suggested scoring with rationale
 * - Comparison notes (when other vendor responses provided)
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.2
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for analysis
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

// Token costs for Sonnet 4.5 (per 1M tokens)
const TOKEN_COSTS = {
  input: 3.00,
  output: 15.00,
};

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: "analyzeVendorResponse",
    description: "Analyze a vendor's response to an RFP question, providing summary, key points, gaps, strengths, and scoring recommendations.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-3 sentence summary of what the vendor is proposing or stating in their response"
        },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "3-5 key points extracted from the response (bullet points)"
        },
        gaps: {
          type: "array",
          description: "Potential compliance gaps or concerns identified",
          items: {
            type: "object",
            properties: {
              issue: {
                type: "string",
                description: "Description of the gap or concern"
              },
              severity: {
                type: "string",
                enum: ["minor", "moderate", "major"],
                description: "How significant is this gap"
              },
              suggestion: {
                type: "string",
                description: "What clarification or follow-up might address this"
              }
            },
            required: ["issue", "severity"]
          }
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "Strengths and differentiators identified in the response (2-4 items)"
        },
        suggestedScore: {
          type: "object",
          description: "Recommended score based on response quality",
          properties: {
            value: {
              type: "number",
              minimum: 0,
              maximum: 5,
              description: "Suggested score (0-5 scale)"
            },
            rationale: {
              type: "string",
              description: "Brief explanation for the suggested score"
            }
          },
          required: ["value", "rationale"]
        },
        confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "AI confidence in the analysis based on response clarity and completeness"
        },
        comparisonNotes: {
          type: "string",
          description: "How this response compares to other vendors (only if comparison data provided)"
        },
        followUpQuestions: {
          type: "array",
          items: { type: "string" },
          description: "Suggested follow-up questions to clarify gaps (1-3 questions)"
        }
      },
      required: ["summary", "keyPoints", "suggestedScore", "confidence"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert technology procurement analyst helping evaluate vendor responses to RFP questions.

Your task is to analyze vendor responses and provide structured analysis that helps evaluators:
1. Quickly understand what the vendor is proposing
2. Identify strengths and differentiators
3. Spot potential gaps or concerns
4. Get scoring guidance based on response quality

**Scoring Guidelines (0-5 scale):**
- **5 - Exceptional**: Exceeds requirements, innovative approach, comprehensive evidence
- **4 - Strong**: Fully meets requirements with clear evidence and good detail
- **3 - Adequate**: Meets basic requirements but lacks depth or evidence
- **2 - Partial**: Partially addresses requirements, significant gaps
- **1 - Weak**: Minimal response, major gaps, unclear how requirements are met
- **0 - Non-responsive**: Does not address the question or requirement

**Analysis Approach:**
- Be objective and balanced - note both strengths and weaknesses
- Focus on substance over marketing language
- Consider whether the response actually addresses what was asked
- Look for concrete evidence (case studies, metrics, certifications) vs. vague claims
- Identify areas needing clarification during vendor demos

**Gap Assessment:**
- Minor: Small omissions, easily clarified
- Moderate: Notable gaps that need follow-up but aren't deal-breakers
- Major: Significant concerns that could affect suitability

Always use the analyzeVendorResponse tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAITask(supabase, evaluationProjectId, userId, vendorId, responseId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'vendor_analysis',
      status: 'processing',
      input_data: {
        vendor_id: vendorId,
        response_id: responseId,
        analysis_type: 'response_analysis'
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

async function getVendorResponse(supabase, responseId) {
  const { data, error } = await supabase
    .from('vendor_responses')
    .select(`
      id,
      response_text,
      response_value,
      compliance_level,
      compliance_notes,
      status,
      vendor:vendors!inner(
        id,
        name,
        evaluation_project_id
      ),
      question:vendor_questions(
        id,
        question_text,
        question_type,
        section,
        guidance_for_vendors,
        scoring_guidance
      )
    `)
    .eq('id', responseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch vendor response: ${error.message}`);
  }
  return data;
}

async function getLinkedRequirement(supabase, questionId) {
  if (!questionId) return null;

  const { data, error } = await supabase
    .from('vendor_question_links')
    .select(`
      requirement:requirements(
        id,
        title,
        description,
        priority
      )
    `)
    .eq('question_id', questionId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.requirement;
}

async function getOtherVendorResponses(supabase, questionId, excludeVendorId) {
  if (!questionId) return [];

  const { data, error } = await supabase
    .from('vendor_responses')
    .select(`
      response_text,
      vendor:vendors!inner(name)
    `)
    .eq('question_id', questionId)
    .eq('status', 'submitted')
    .neq('vendor_id', excludeVendorId)
    .not('response_text', 'is', null);

  if (error) {
    console.error('Failed to fetch other vendor responses:', error);
    return [];
  }
  return data || [];
}

async function cacheAnalysisOnResponse(supabase, responseId, analysis, userId) {
  const { error } = await supabase
    .from('vendor_responses')
    .update({
      ai_analysis: analysis,
      ai_analyzed_at: new Date().toISOString(),
      ai_analyzed_by: userId
    })
    .eq('id', responseId);

  if (error) {
    console.error('Failed to cache analysis on response:', error);
  }
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
      responseId,
      userId,
      includeComparison = true,  // Include other vendor responses for comparison
      forceRefresh = false       // Re-analyze even if cached
    } = req.body;

    if (!responseId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: responseId, userId'
      });
    }

    // Fetch the vendor response with context
    const response = await getVendorResponse(supabase, responseId);

    if (!response) {
      return res.status(404).json({ error: 'Vendor response not found' });
    }

    if (!response.response_text && !response.response_value) {
      return res.status(400).json({
        error: 'Response has no content to analyze'
      });
    }

    // Check for cached analysis
    if (!forceRefresh) {
      const { data: cachedResponse } = await supabase
        .from('vendor_responses')
        .select('ai_analysis, ai_analyzed_at')
        .eq('id', responseId)
        .single();

      if (cachedResponse?.ai_analysis) {
        return res.status(200).json({
          success: true,
          responseId,
          vendorName: response.vendor.name,
          cached: true,
          analyzedAt: cachedResponse.ai_analyzed_at,
          ...cachedResponse.ai_analysis
        });
      }
    }

    const evaluationProjectId = response.vendor.evaluation_project_id;

    // Create AI task record
    aiTask = await createAITask(supabase, evaluationProjectId, userId, response.vendor.id, responseId);

    // Fetch linked requirement for context
    const linkedRequirement = await getLinkedRequirement(supabase, response.question?.id);

    // Fetch other vendor responses for comparison (anonymized)
    let otherResponses = [];
    if (includeComparison && response.question?.id) {
      otherResponses = await getOtherVendorResponses(supabase, response.question.id, response.vendor.id);
    }

    // Build the analysis request
    let contextText = `## Question Being Answered\n\n`;

    if (response.question) {
      contextText += `**Question:** ${response.question.question_text}\n`;
      if (response.question.section) {
        contextText += `**Section:** ${response.question.section}\n`;
      }
      if (response.question.scoring_guidance) {
        contextText += `**Scoring Guidance:** ${response.question.scoring_guidance}\n`;
      }
    }

    if (linkedRequirement) {
      contextText += `\n## Linked Requirement\n\n`;
      contextText += `**Title:** ${linkedRequirement.title}\n`;
      contextText += `**Description:** ${linkedRequirement.description}\n`;
      contextText += `**Priority:** ${linkedRequirement.priority}\n`;
    }

    contextText += `\n## Vendor Response\n\n`;
    contextText += `**Vendor:** ${response.vendor.name}\n\n`;

    // Handle different response types
    if (response.response_text) {
      contextText += `**Response:**\n${response.response_text}\n`;
    }

    if (response.response_value) {
      const valueStr = typeof response.response_value === 'object'
        ? JSON.stringify(response.response_value, null, 2)
        : String(response.response_value);
      contextText += `**Structured Response:**\n${valueStr}\n`;
    }

    if (response.compliance_level) {
      contextText += `\n**Vendor's Self-Assessment:** ${response.compliance_level}\n`;
      if (response.compliance_notes) {
        contextText += `**Compliance Notes:** ${response.compliance_notes}\n`;
      }
    }

    // Add comparison context if available
    if (otherResponses.length > 0) {
      contextText += `\n## Other Vendor Responses (for comparison)\n\n`;
      contextText += `*${otherResponses.length} other vendor(s) have responded to this question.*\n\n`;

      otherResponses.forEach((other, idx) => {
        // Anonymize vendor names for fair comparison
        contextText += `**Vendor ${String.fromCharCode(65 + idx)}:**\n`;
        contextText += `${other.response_text?.substring(0, 500)}${other.response_text?.length > 500 ? '...' : ''}\n\n`;
      });
    }

    const messages = [
      {
        role: "user",
        content: `Please analyze this vendor response and provide your assessment.\n\n${contextText}`
      }
    ];

    // Call Claude API
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "analyzeVendorResponse" },
        messages
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Claude API error: ${apiResponse.status} - ${errorText}`);
    }

    const result = await apiResponse.json();
    const duration = Date.now() - startTime;

    // Extract tool use result
    let analysisData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'analyzeVendorResponse') {
        analysisData = block.input;
        break;
      }
    }

    if (!analysisData) {
      throw new Error('No analysis result from AI');
    }

    // Add metadata
    analysisData.duration_ms = duration;
    analysisData.model = MODEL;
    analysisData.analyzed_at = new Date().toISOString();
    analysisData.question_id = response.question?.id;
    analysisData.has_comparison = otherResponses.length > 0;
    analysisData.vendors_compared = otherResponses.length;

    // Cache the analysis on the response
    await cacheAnalysisOnResponse(supabase, responseId, analysisData, userId);

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
      responseId,
      vendorName: response.vendor.name,
      cached: false,
      ...analysisData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Response analysis error:', error);

    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze vendor response'
    });
  }
}
