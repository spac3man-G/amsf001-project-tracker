/**
 * AI Matrix Insights Generation Endpoint
 * Part of: Evaluator Product Roadmap v1.0.x - Feature 0.8: Enhanced Traceability Matrix
 *
 * Analyzes the traceability matrix data and generates AI-powered insights
 * about vendor performance, evaluation coverage, and recommendations.
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = 'claude-opus-4-5-20251101';

// Initialize Supabase client
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

export default async function handler(req, res) {
  // Only allow POST
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

  try {
    const { evaluationProjectId, userId, analysisType = 'comprehensive' } = req.body;

    if (!evaluationProjectId) {
      return res.status(400).json({ error: 'Evaluation project ID is required' });
    }

    // Fetch comprehensive matrix data
    const matrixData = await fetchMatrixData(supabase, evaluationProjectId);

    if (!matrixData.requirements.length || !matrixData.vendors.length) {
      return res.status(400).json({
        error: 'Insufficient data for analysis',
        message: 'Need at least one requirement and one vendor with scores'
      });
    }

    // Generate AI insights
    const insights = await generateAIInsights(matrixData, analysisType);

    // Save insights to database
    if (insights.data && insights.data.length > 0) {
      const insightsToSave = insights.data.map(insight => ({
        evaluation_project_id: evaluationProjectId,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        supporting_data: insight.supportingData,
        vendor_id: insight.vendorId || null,
        category_id: insight.categoryId || null,
        requirement_id: insight.requirementId || null,
        priority: insight.priority,
        confidence: insight.confidence,
        generated_by: 'ai',
      }));

      const { error: saveError } = await supabase
        .from('traceability_insights')
        .insert(insightsToSave);

      if (saveError) {
        console.error('Error saving insights:', saveError);
        // Continue - return insights even if save fails
      }
    }

    return res.status(200).json({
      success: true,
      insights: insights.data,
      summary: {
        totalInsights: insights.data.length,
        byPriority: {
          critical: insights.data.filter(i => i.priority === 'critical').length,
          high: insights.data.filter(i => i.priority === 'high').length,
          medium: insights.data.filter(i => i.priority === 'medium').length,
          low: insights.data.filter(i => i.priority === 'low').length,
        },
        byType: insights.data.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {}),
      },
      usage: insights.usage,
    });

  } catch (error) {
    console.error('AI Matrix Insights error:', error);
    return res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message
    });
  }
}

/**
 * Fetch all matrix data needed for analysis
 */
async function fetchMatrixData(supabase, evaluationProjectId) {
  // Fetch project details
  const { data: project } = await supabase
    .from('evaluation_projects')
    .select('*, projects(name)')
    .eq('id', evaluationProjectId)
    .single();

  // Fetch vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, status')
    .eq('evaluation_project_id', evaluationProjectId)
    .eq('is_deleted', false);

  // Fetch categories
  const { data: categories } = await supabase
    .from('evaluation_categories')
    .select('id, name, weight, parent_id')
    .eq('evaluation_project_id', evaluationProjectId)
    .order('sort_order');

  // Fetch requirements
  const { data: requirements } = await supabase
    .from('requirements')
    .select('id, title, description, priority, moscow, category_id, weight')
    .eq('evaluation_project_id', evaluationProjectId)
    .eq('is_deleted', false)
    .order('sort_order');

  // Fetch all scores
  const { data: scores } = await supabase
    .from('evaluation_scores')
    .select(`
      id,
      requirement_id,
      vendor_id,
      score,
      rag_status,
      notes,
      is_consensus,
      evaluator_id,
      profiles(full_name)
    `)
    .eq('evaluation_project_id', evaluationProjectId);

  // Fetch evidence counts
  const { data: evidence } = await supabase
    .from('evaluation_evidence')
    .select('requirement_id, vendor_id')
    .eq('evaluation_project_id', evaluationProjectId);

  // Process data into a structured format
  const vendorMap = new Map(vendors?.map(v => [v.id, v]) || []);
  const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);
  const requirementMap = new Map(requirements?.map(r => [r.id, r]) || []);

  // Build score matrix
  const scoreMatrix = {};
  const evidenceCount = {};

  scores?.forEach(score => {
    const key = `${score.requirement_id}:${score.vendor_id}`;
    if (!scoreMatrix[key]) {
      scoreMatrix[key] = [];
    }
    scoreMatrix[key].push(score);
  });

  evidence?.forEach(e => {
    const key = `${e.requirement_id}:${e.vendor_id}`;
    evidenceCount[key] = (evidenceCount[key] || 0) + 1;
  });

  // Calculate vendor statistics
  const vendorStats = {};
  vendors?.forEach(vendor => {
    const vendorScores = scores?.filter(s => s.vendor_id === vendor.id && s.is_consensus) || [];
    const avgScore = vendorScores.length > 0
      ? vendorScores.reduce((sum, s) => sum + (s.score || 0), 0) / vendorScores.length
      : 0;

    const ragCounts = { green: 0, amber: 0, red: 0 };
    vendorScores.forEach(s => {
      if (s.rag_status) ragCounts[s.rag_status]++;
    });

    vendorStats[vendor.id] = {
      avgScore: Math.round(avgScore * 100) / 100,
      totalScored: vendorScores.length,
      coverage: requirements?.length ? (vendorScores.length / requirements.length * 100).toFixed(1) : 0,
      ragCounts,
    };
  });

  // Calculate category statistics
  const categoryStats = {};
  categories?.forEach(cat => {
    const catRequirements = requirements?.filter(r => r.category_id === cat.id) || [];
    const catScores = scores?.filter(s =>
      catRequirements.some(r => r.id === s.requirement_id) && s.is_consensus
    ) || [];

    categoryStats[cat.id] = {
      requirementCount: catRequirements.length,
      avgScore: catScores.length > 0
        ? Math.round(catScores.reduce((sum, s) => sum + (s.score || 0), 0) / catScores.length * 100) / 100
        : 0,
      coverage: catRequirements.length > 0 && vendors?.length
        ? ((catScores.length / (catRequirements.length * vendors.length)) * 100).toFixed(1)
        : 0,
    };
  });

  return {
    project,
    vendors: vendors || [],
    categories: categories || [],
    requirements: requirements || [],
    scores: scores || [],
    scoreMatrix,
    evidenceCount,
    vendorStats,
    categoryStats,
    totalRequirements: requirements?.length || 0,
    totalVendors: vendors?.length || 0,
    totalScores: scores?.filter(s => s.is_consensus).length || 0,
  };
}

/**
 * Generate AI-powered insights from matrix data
 */
async function generateAIInsights(matrixData, analysisType) {
  const systemPrompt = `You are an expert IT procurement advisor analyzing a vendor evaluation traceability matrix.
Your role is to identify actionable insights that help evaluation teams make better decisions.

Focus on:
1. Vendor strengths and weaknesses across requirement categories
2. Areas where vendors differentiate significantly
3. Coverage gaps that need attention
4. Risk areas where all vendors score poorly
5. Consensus issues where evaluator scores vary widely
6. Progress and completion recommendations

Be specific and actionable. Reference specific vendors, categories, and requirements by name.
Prioritize insights that impact the evaluation outcome.`;

  const userPrompt = `Analyze this vendor evaluation matrix data and generate insights:

## Project Overview
- Total Requirements: ${matrixData.totalRequirements}
- Total Vendors: ${matrixData.totalVendors}
- Total Consensus Scores: ${matrixData.totalScores}
- Overall Coverage: ${matrixData.totalRequirements && matrixData.totalVendors
    ? ((matrixData.totalScores / (matrixData.totalRequirements * matrixData.totalVendors)) * 100).toFixed(1)
    : 0}%

## Vendors
${matrixData.vendors.map(v => {
  const stats = matrixData.vendorStats[v.id];
  return `- ${v.name}: Avg Score ${stats.avgScore}/5, Coverage ${stats.coverage}%, RAG: ${stats.ragCounts.green}G/${stats.ragCounts.amber}A/${stats.ragCounts.red}R`;
}).join('\n')}

## Categories
${matrixData.categories.map(c => {
  const stats = matrixData.categoryStats[c.id];
  return `- ${c.name} (weight: ${c.weight || 1}): ${stats.requirementCount} requirements, Avg ${stats.avgScore}/5, Coverage ${stats.coverage}%`;
}).join('\n')}

## Requirements by Priority
- Critical: ${matrixData.requirements.filter(r => r.priority === 'critical').length}
- High: ${matrixData.requirements.filter(r => r.priority === 'high').length}
- Medium: ${matrixData.requirements.filter(r => r.priority === 'medium').length}
- Low: ${matrixData.requirements.filter(r => r.priority === 'low').length}

## Score Distribution Analysis
${analyzeScoreDistribution(matrixData)}

Generate ${analysisType === 'quick' ? '3-5' : '8-12'} insights. For each insight, provide the data in the exact JSON format requested.`;

  const tools = [
    {
      name: 'generate_insights',
      description: 'Generate structured insights about the evaluation matrix',
      input_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'vendor_strength',
                    'vendor_weakness',
                    'category_leader',
                    'consensus_needed',
                    'coverage_gap',
                    'risk_area',
                    'differentiator',
                    'common_strength',
                    'progress_update',
                    'recommendation'
                  ],
                  description: 'The type of insight'
                },
                title: {
                  type: 'string',
                  description: 'Short title for the insight (max 100 chars)'
                },
                description: {
                  type: 'string',
                  description: 'Detailed description of the insight and recommended action'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'How important this insight is'
                },
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Confidence score (0-1) based on data quality'
                },
                vendorName: {
                  type: 'string',
                  description: 'Name of related vendor if applicable'
                },
                categoryName: {
                  type: 'string',
                  description: 'Name of related category if applicable'
                },
                supportingData: {
                  type: 'object',
                  description: 'Any supporting metrics or data points'
                }
              },
              required: ['type', 'title', 'description', 'priority', 'confidence']
            }
          }
        },
        required: ['insights']
      }
    }
  ];

  // Call Claude API using fetch
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
      system: systemPrompt,
      tools,
      tool_choice: { type: 'tool', name: 'generate_insights' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`Claude API error: ${apiResponse.status} - ${errorText}`);
  }

  const response = await apiResponse.json();

  // Extract tool use result
  const toolUse = response.content.find(c => c.type === 'tool_use');
  if (!toolUse || !toolUse.input?.insights) {
    return { data: [], usage: response.usage };
  }

  // Map vendor/category names to IDs
  const insights = toolUse.input.insights.map(insight => {
    const vendorId = insight.vendorName
      ? matrixData.vendors.find(v => v.name.toLowerCase() === insight.vendorName.toLowerCase())?.id
      : null;
    const categoryId = insight.categoryName
      ? matrixData.categories.find(c => c.name.toLowerCase() === insight.categoryName.toLowerCase())?.id
      : null;

    return {
      type: insight.type,
      title: insight.title,
      description: insight.description,
      priority: insight.priority,
      confidence: insight.confidence,
      vendorId,
      categoryId,
      supportingData: insight.supportingData || {},
    };
  });

  return { data: insights, usage: response.usage };
}

/**
 * Analyze score distribution for insights
 */
function analyzeScoreDistribution(matrixData) {
  const analysis = [];

  // Find high variance requirements (potential consensus issues)
  const requirementVariance = {};
  matrixData.requirements.forEach(req => {
    const reqScores = matrixData.scores.filter(s =>
      s.requirement_id === req.id && s.is_consensus
    );
    if (reqScores.length >= 2) {
      const scores = reqScores.map(s => s.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
      if (variance > 1) {
        requirementVariance[req.id] = {
          title: req.title,
          variance: Math.round(variance * 100) / 100,
          scores: reqScores.map(s => ({
            vendor: matrixData.vendors.find(v => v.id === s.vendor_id)?.name,
            score: s.score
          }))
        };
      }
    }
  });

  if (Object.keys(requirementVariance).length > 0) {
    analysis.push(`High variance requirements (may need review): ${Object.keys(requirementVariance).length}`);
    const top3 = Object.values(requirementVariance)
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 3);
    top3.forEach(r => {
      analysis.push(`  - "${r.title}": variance ${r.variance}, scores: ${r.scores.map(s => `${s.vendor}=${s.score}`).join(', ')}`);
    });
  }

  // Find consistently low-scoring requirements (risk areas)
  const lowScoreRequirements = matrixData.requirements.filter(req => {
    const reqScores = matrixData.scores.filter(s =>
      s.requirement_id === req.id && s.is_consensus
    );
    if (reqScores.length === 0) return false;
    const avg = reqScores.reduce((sum, s) => sum + s.score, 0) / reqScores.length;
    return avg < 3;
  });

  if (lowScoreRequirements.length > 0) {
    analysis.push(`\nRequirements with low avg scores across vendors: ${lowScoreRequirements.length}`);
    lowScoreRequirements.slice(0, 3).forEach(r => {
      analysis.push(`  - "${r.title}" (${r.priority} priority)`);
    });
  }

  return analysis.join('\n');
}
