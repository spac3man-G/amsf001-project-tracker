/**
 * AI Vendor Response Validation - Vercel Serverless Function
 *
 * Validates vendor responses against requirements to identify:
 * - Scope gaps (missing required areas)
 * - Ambiguities (vague or unclear language)
 * - Exclusions (explicitly excluded items)
 * - Risk areas (commitment issues, roadmap items)
 * - Compliance gaps (regulatory/standard requirements)
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.2: Enhanced AI Gap Detection
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for validation
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
    name: "validateVendorResponse",
    description: "Validate a vendor's response against requirements to identify gaps, ambiguities, exclusions, and risks.",
    input_schema: {
      type: "object",
      properties: {
        completeness_score: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Overall completeness score (0-100) indicating how fully the vendor addressed requirements"
        },
        gaps: {
          type: "array",
          description: "List of identified gaps in the vendor response",
          items: {
            type: "object",
            properties: {
              gap_type: {
                type: "string",
                enum: ["scope", "ambiguity", "exclusion", "risk", "incomplete", "commitment", "compliance"],
                description: "Type of gap identified"
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Severity of the gap"
              },
              gap_title: {
                type: "string",
                description: "Brief title summarizing the gap"
              },
              gap_description: {
                type: "string",
                description: "Detailed description of the gap"
              },
              vendor_statement: {
                type: "string",
                description: "What the vendor actually said (quote or paraphrase)"
              },
              expected_statement: {
                type: "string",
                description: "What was expected based on requirements"
              },
              requirement_reference: {
                type: "string",
                description: "Reference to specific requirement or section"
              },
              recommended_action: {
                type: "string",
                description: "Recommended action for the evaluation team"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "AI confidence in this gap identification"
              }
            },
            required: ["gap_type", "severity", "gap_title", "gap_description", "recommended_action"]
          }
        },
        positive_findings: {
          type: "array",
          items: { type: "string" },
          description: "Areas where vendor response is strong or exceeds expectations"
        },
        clarification_questions: {
          type: "array",
          description: "Suggested clarification questions to send to vendor",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              related_gap: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["question", "priority"]
          }
        },
        risk_summary: {
          type: "object",
          properties: {
            overall_risk: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "Overall risk level based on identified gaps"
            },
            critical_gaps_count: { type: "integer" },
            high_gaps_count: { type: "integer" },
            medium_gaps_count: { type: "integer" },
            low_gaps_count: { type: "integer" },
            recommendation: {
              type: "string",
              description: "Overall recommendation (proceed, proceed with caution, address gaps first, reconsider)"
            }
          }
        },
        validation_notes: {
          type: "string",
          description: "Additional notes about the validation"
        }
      },
      required: ["completeness_score", "gaps", "risk_summary"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert procurement compliance analyst specializing in vendor response validation. Your task is to analyze vendor responses against stated requirements to identify gaps, ambiguities, exclusions, and risks.

**Gap Types to Identify:**

1. **Scope Gap** - Vendor did not address a required area
   - Missing functionality
   - Unaddressed requirements
   - Missing deliverables

2. **Ambiguity** - Response is vague or unclear
   - Non-committal language ("may", "might", "possibly")
   - Missing specifics or timelines
   - Unclear scope boundaries

3. **Exclusion** - Vendor explicitly excludes something
   - Items marked as "out of scope"
   - Additional cost items not included
   - Limitations stated

4. **Risk** - Identified risk areas
   - Unrealistic timelines
   - Dependency risks
   - Technical risks
   - Resource risks

5. **Incomplete** - Partial response only
   - Only part of requirement addressed
   - Missing details
   - Incomplete specifications

6. **Commitment** - Weak commitment language
   - Uses "will attempt" instead of "will"
   - Conditional statements
   - Best-effort language

7. **Compliance** - Regulatory/standard gaps
   - Missing certifications
   - Compliance unclear
   - Regulatory concerns

**Severity Guidelines:**

- **Critical**: Could cause project failure or significant business impact
- **High**: Significant issue that must be addressed before selection
- **Medium**: Notable gap that should be clarified
- **Low**: Minor concern, nice to clarify but not essential

**Recommended Actions:**

- "Request clarification from vendor"
- "Require written commitment"
- "Include in contract negotiations"
- "Request detailed implementation plan"
- "Verify certification/compliance"
- "Discuss in vendor demo"
- "Flag for risk assessment"

Always be thorough but fair - identify genuine gaps while acknowledging vendor strengths.
Use the validateVendorResponse tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAITask(supabase, evaluationProjectId, userId, vendorId, responseId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'vendor_response_validation',
      status: 'processing',
      input_data: {
        vendor_id: vendorId,
        response_id: responseId,
        analysis_type: 'gap_detection'
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

async function getLinkedRequirements(supabase, questionId) {
  if (!questionId) return [];

  const { data, error } = await supabase
    .from('vendor_question_links')
    .select(`
      requirement:requirements(
        id,
        reference_code,
        title,
        description,
        priority
      )
    `)
    .eq('question_id', questionId);

  if (error) {
    console.error('Failed to fetch linked requirements:', error);
    return [];
  }
  return data?.map(d => d.requirement).filter(Boolean) || [];
}

async function saveDetectedGaps(supabase, evaluationProjectId, vendorId, responseId, gaps, aiTaskId) {
  if (!gaps || gaps.length === 0) return [];

  const gapsToInsert = gaps.map(gap => ({
    evaluation_project_id: evaluationProjectId,
    vendor_id: vendorId,
    vendor_response_id: responseId,
    gap_type: gap.gap_type,
    severity: gap.severity,
    gap_title: gap.gap_title,
    gap_description: gap.gap_description,
    vendor_statement: gap.vendor_statement || null,
    expected_statement: gap.expected_statement || null,
    requirement_reference: gap.requirement_reference || null,
    recommended_action: gap.recommended_action,
    detected_by: 'ai',
    ai_confidence: gap.confidence || null,
    ai_analysis_id: aiTaskId
  }));

  const { data, error } = await supabase
    .from('vendor_response_gaps')
    .insert(gapsToInsert)
    .select();

  if (error) {
    console.error('Failed to save detected gaps:', error);
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
      responseId,
      userId,
      additionalRequirements = null, // Additional context/requirements to validate against
      saveGaps = true                 // Whether to save detected gaps to database
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
        error: 'Response has no content to validate'
      });
    }

    const evaluationProjectId = response.vendor.evaluation_project_id;

    // Create AI task record
    aiTask = await createAITask(supabase, evaluationProjectId, userId, response.vendor.id, responseId);

    // Fetch linked requirements for context
    const linkedRequirements = await getLinkedRequirements(supabase, response.question?.id);

    // Build the validation request
    let contextText = `## Question Being Answered\n\n`;

    if (response.question) {
      contextText += `**Question:** ${response.question.question_text}\n`;
      if (response.question.section) {
        contextText += `**Section:** ${response.question.section}\n`;
      }
      if (response.question.guidance_for_vendors) {
        contextText += `**Guidance Provided:** ${response.question.guidance_for_vendors}\n`;
      }
      if (response.question.scoring_guidance) {
        contextText += `**Scoring Criteria:** ${response.question.scoring_guidance}\n`;
      }
    }

    if (linkedRequirements.length > 0) {
      contextText += `\n## Related Requirements\n\n`;
      linkedRequirements.forEach((req, idx) => {
        contextText += `### Requirement ${idx + 1}: ${req.reference_code || ''} ${req.title}\n`;
        contextText += `- **Priority:** ${req.priority}\n`;
        contextText += `- **Description:** ${req.description}\n\n`;
      });
    }

    if (additionalRequirements) {
      contextText += `\n## Additional Requirements to Validate Against\n\n`;
      contextText += additionalRequirements;
    }

    contextText += `\n## Vendor Response\n\n`;
    contextText += `**Vendor:** ${response.vendor.name}\n\n`;

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

    const messages = [
      {
        role: "user",
        content: `Please validate this vendor response against the requirements and identify any gaps, ambiguities, exclusions, or risks.\n\n${contextText}`
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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "validateVendorResponse" },
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
    let validationData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'validateVendorResponse') {
        validationData = block.input;
        break;
      }
    }

    if (!validationData) {
      throw new Error('No validation result from AI');
    }

    // Add metadata
    validationData.duration_ms = duration;
    validationData.model = MODEL;
    validationData.validated_at = new Date().toISOString();
    validationData.response_id = responseId;
    validationData.vendor_id = response.vendor.id;
    validationData.vendor_name = response.vendor.name;

    // Save detected gaps to database if enabled
    let savedGaps = [];
    if (saveGaps && validationData.gaps && validationData.gaps.length > 0) {
      savedGaps = await saveDetectedGaps(
        supabase,
        evaluationProjectId,
        response.vendor.id,
        responseId,
        validationData.gaps,
        aiTask?.id
      );
      validationData.saved_gaps_count = savedGaps.length;
      validationData.saved_gap_ids = savedGaps.map(g => g.id);
    }

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', validationData, result.usage);
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
      ...validationData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Vendor response validation error:', error);

    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate vendor response'
    });
  }
}
