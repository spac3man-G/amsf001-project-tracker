/**
 * Vendor Intelligence - Vercel Serverless Function
 *
 * Uses Claude AI to generate viability assessments for vendors based on
 * manually entered or API-fetched intelligence data (financial, compliance,
 * reviews, market data).
 *
 * Features:
 * - Generate AI viability assessment from intelligence data
 * - Aggregate risk scoring
 * - Strength/weakness analysis
 * - Recommendation generation
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.5
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for analysis
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
    name: "assessVendorViability",
    description: "Generate a comprehensive viability assessment for a vendor based on available intelligence data.",
    input_schema: {
      type: "object",
      properties: {
        overall_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Overall viability score (0-100)"
        },
        financial_health_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Financial health score based on funding, revenue, growth (0-100)"
        },
        market_position_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Market position score based on reviews, presence, reputation (0-100)"
        },
        compliance_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Compliance and security score (0-100)"
        },
        customer_satisfaction_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Customer satisfaction based on reviews and ratings (0-100)"
        },
        risk_factors: {
          type: "array",
          description: "Identified risk factors",
          items: {
            type: "object",
            properties: {
              factor: {
                type: "string",
                description: "Description of the risk factor"
              },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Severity level of the risk"
              },
              mitigation: {
                type: "string",
                description: "Suggested mitigation approach"
              }
            },
            required: ["factor", "severity"]
          }
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "Key strengths identified from the intelligence data"
        },
        concerns: {
          type: "array",
          items: { type: "string" },
          description: "Key concerns or areas requiring attention"
        },
        recommendation: {
          type: "string",
          enum: ["recommended", "proceed_with_caution", "requires_review", "not_recommended"],
          description: "Overall recommendation for proceeding with this vendor"
        },
        recommendation_rationale: {
          type: "string",
          description: "Detailed explanation for the recommendation"
        },
        due_diligence_suggestions: {
          type: "array",
          items: { type: "string" },
          description: "Suggested due diligence activities before selection"
        },
        data_gaps: {
          type: "array",
          items: { type: "string" },
          description: "Important data points that are missing for a complete assessment"
        }
      },
      required: [
        "overall_score",
        "financial_health_score",
        "market_position_score",
        "compliance_score",
        "customer_satisfaction_score",
        "risk_factors",
        "strengths",
        "concerns",
        "recommendation",
        "recommendation_rationale"
      ]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert vendor viability analyst specializing in enterprise software procurement risk assessment.

Your task is to analyze vendor intelligence data and generate a comprehensive viability assessment. You evaluate vendors across four key dimensions:

1. **Financial Health** (0-100)
   - Funding history and runway
   - Revenue growth indicators
   - Profitability signals
   - Employee growth/stability
   - Investor quality

2. **Market Position** (0-100)
   - Customer review ratings
   - Market presence and reach
   - Industry recognition/awards
   - Partnership ecosystem
   - Competitive positioning

3. **Compliance & Security** (0-100)
   - Certifications (SOC 2, ISO 27001, etc.)
   - Regulatory compliance
   - Security posture
   - Data breach history
   - Sanctions/litigation concerns

4. **Customer Satisfaction** (0-100)
   - Aggregate review scores
   - Implementation satisfaction
   - Support quality
   - Willingness to recommend

Scoring Guidelines:
- 85-100: Excellent - Strong positive indicators across all available data
- 70-84: Good - Generally positive with minor concerns
- 55-69: Moderate - Mixed signals, requires additional scrutiny
- 40-54: Below Average - Significant concerns identified
- 0-39: Poor - Major red flags or critical gaps

Recommendation Levels:
- **recommended**: Strong viability indicators, low risk, proceed confidently
- **proceed_with_caution**: Generally viable but specific concerns need attention
- **requires_review**: Mixed signals, additional due diligence essential
- **not_recommended**: Significant viability concerns, recommend alternatives

Important:
- Base assessment ONLY on provided data - do not invent information
- Clearly identify data gaps that affect confidence in the assessment
- Be balanced and objective - highlight both positives and negatives
- Provide actionable due diligence suggestions

Always use the assessVendorViability tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getVendorWithIntelligence(supabase, vendorId) {
  // Get vendor details
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select(`
      id,
      name,
      description,
      website,
      status,
      evaluation_project_id
    `)
    .eq('id', vendorId)
    .single();

  if (vendorError) {
    throw new Error(`Failed to fetch vendor: ${vendorError.message}`);
  }

  // Get intelligence data
  const { data: intelligence, error: intelError } = await supabase
    .from('vendor_intelligence')
    .select('*')
    .eq('vendor_id', vendorId)
    .single();

  if (intelError && intelError.code !== 'PGRST116') { // Ignore "no rows" error
    throw new Error(`Failed to fetch intelligence: ${intelError.message}`);
  }

  return {
    vendor,
    intelligence: intelligence || {}
  };
}

async function updateViabilityAssessment(supabase, vendorId, assessment, userId) {
  const { error } = await supabase
    .from('vendor_intelligence')
    .update({
      viability_assessment: {
        ...assessment,
        generated_at: new Date().toISOString(),
        generated_by: 'ai'
      },
      updated_by: userId,
      last_refreshed_at: new Date().toISOString()
    })
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Failed to update viability assessment:', error);
  }
}

async function createAITask(supabase, evaluationProjectId, vendorId, userId) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'viability_assessment',
      status: 'processing',
      input_data: {
        vendor_id: vendorId,
        analysis_type: 'vendor_intelligence'
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

function formatIntelligenceForAI(vendor, intelligence) {
  const sections = [];

  sections.push(`## Vendor Overview
**Name:** ${vendor.name}
**Website:** ${vendor.website || 'Not specified'}
**Status:** ${vendor.status}
**Description:** ${vendor.description || 'No description provided'}
`);

  // Financial Data
  const financial = intelligence.financial_data || {};
  if (Object.keys(financial).length > 0) {
    sections.push(`## Financial Data
${financial.funding_total ? `**Total Funding:** $${(financial.funding_total / 1000000).toFixed(1)}M` : '**Total Funding:** Unknown'}
${financial.funding_stage ? `**Funding Stage:** ${financial.funding_stage}` : ''}
${financial.last_funding_date ? `**Last Funding:** ${financial.last_funding_date}` : ''}
${financial.revenue_range ? `**Revenue Range:** ${financial.revenue_range}` : ''}
${financial.employee_count ? `**Employees:** ${financial.employee_count}` : ''}
${financial.employee_growth_yoy ? `**YoY Growth:** ${financial.employee_growth_yoy}%` : ''}
${financial.profitability_indicator ? `**Profitability:** ${financial.profitability_indicator}` : ''}
${financial.investors?.length ? `**Key Investors:** ${financial.investors.join(', ')}` : ''}
`);
  } else {
    sections.push(`## Financial Data
No financial data available.
`);
  }

  // Compliance Data
  const compliance = intelligence.compliance_data || {};
  if (Object.keys(compliance).length > 0) {
    sections.push(`## Compliance & Security Data
${compliance.sanctions_check ? `**Sanctions Check:** ${compliance.sanctions_check}` : ''}
${compliance.risk_level ? `**Risk Level:** ${compliance.risk_level}` : ''}
${compliance.compliance_score ? `**Compliance Score:** ${compliance.compliance_score}/100` : ''}
${compliance.certifications?.length ? `**Certifications:** ${compliance.certifications.join(', ')}` : ''}
${compliance.regulatory_actions?.length ? `**Regulatory Actions:** ${compliance.regulatory_actions.length} on record` : ''}
${compliance.data_breach_history?.length ? `**Data Breaches:** ${compliance.data_breach_history.length} incidents` : ''}
`);
  } else {
    sections.push(`## Compliance & Security Data
No compliance data available.
`);
  }

  // Review Data
  const reviews = intelligence.review_data || {};
  if (Object.keys(reviews).length > 0) {
    sections.push(`## Product Reviews
${reviews.aggregate_rating ? `**Aggregate Rating:** ${reviews.aggregate_rating}/5` : ''}
${reviews.total_reviews ? `**Total Reviews:** ${reviews.total_reviews}` : ''}

${reviews.g2 ? `### G2
- Rating: ${reviews.g2.rating}/5 (${reviews.g2.review_count} reviews)
- Satisfaction: ${reviews.g2.satisfaction_score || 'N/A'}%
- Implementation: ${reviews.g2.implementation_score || 'N/A'}%
- Support: ${reviews.g2.support_score || 'N/A'}%
${reviews.g2.pros?.length ? `- Pros: ${reviews.g2.pros.join('; ')}` : ''}
${reviews.g2.cons?.length ? `- Cons: ${reviews.g2.cons.join('; ')}` : ''}` : ''}

${reviews.capterra ? `### Capterra
- Rating: ${reviews.capterra.rating}/5 (${reviews.capterra.review_count} reviews)
- Ease of Use: ${reviews.capterra.ease_of_use || 'N/A'}/5
- Value: ${reviews.capterra.value_score || 'N/A'}/5
- Customer Service: ${reviews.capterra.customer_service || 'N/A'}/5` : ''}

${reviews.gartner ? `### Gartner Peer Insights
- Rating: ${reviews.gartner.peer_insights_rating}/5
- Magic Quadrant: ${reviews.gartner.magic_quadrant_position || 'N/A'}
- Willingness to Recommend: ${reviews.gartner.willingness_to_recommend || 'N/A'}%` : ''}
`);
  } else {
    sections.push(`## Product Reviews
No review data available.
`);
  }

  // Market Data
  const market = intelligence.market_data || {};
  if (Object.keys(market).length > 0) {
    sections.push(`## Market Intelligence
${market.sentiment_summary ? `**Overall Sentiment:** ${market.sentiment_summary}` : ''}

${market.recent_news?.length ? `### Recent News
${market.recent_news.slice(0, 5).map(n =>
  `- [${n.sentiment || 'neutral'}] ${n.title} (${n.source}, ${n.published_at})`
).join('\n')}` : ''}

${market.awards?.length ? `### Awards & Recognition
${market.awards.map(a => `- ${a}`).join('\n')}` : ''}

${market.partnerships?.length ? `### Partnerships
${market.partnerships.map(p => `- ${p}`).join('\n')}` : ''}

${market.market_presence?.regions?.length ? `### Geographic Presence
Regions: ${market.market_presence.regions.join(', ')}` : ''}
`);
  } else {
    sections.push(`## Market Intelligence
No market data available.
`);
  }

  return sections.join('\n');
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
    const { vendorId, userId } = req.body;

    if (!vendorId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: vendorId, userId'
      });
    }

    // Fetch vendor and intelligence data
    const { vendor, intelligence } = await getVendorWithIntelligence(supabase, vendorId);

    // Create AI task record
    aiTask = await createAITask(supabase, vendor.evaluation_project_id, vendorId, userId);

    // Format intelligence data for AI analysis
    const intelligenceText = formatIntelligenceForAI(vendor, intelligence);

    const messages = [
      {
        role: "user",
        content: `Please analyze the following vendor intelligence data and generate a comprehensive viability assessment.

${intelligenceText}

Based on this data, assess the vendor's viability for a potential software procurement. Consider all available data points and identify any significant gaps that affect your confidence in the assessment.`
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
        tool_choice: { type: "tool", name: "assessVendorViability" },
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
    let assessmentData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'assessVendorViability') {
        assessmentData = block.input;
        break;
      }
    }

    if (!assessmentData) {
      throw new Error('No viability assessment result from AI');
    }

    // Add metadata
    assessmentData.duration_ms = duration;
    assessmentData.model = MODEL;
    assessmentData.generated_at = new Date().toISOString();
    assessmentData.generated_by = 'ai';

    // Save assessment to database
    await updateViabilityAssessment(supabase, vendorId, assessmentData, userId);

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', assessmentData, result.usage);
    }

    // Calculate cost
    const cost = result.usage
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) +
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    return res.status(200).json({
      success: true,
      vendorId,
      vendorName: vendor.name,
      assessment: assessmentData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Vendor intelligence error:', error);

    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate viability assessment'
    });
  }
}
