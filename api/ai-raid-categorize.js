/**
 * AI RAID Categorization - Vercel Serverless Function
 *
 * Uses Claude AI to analyze RAID item text and suggest:
 * - Category (Risk, Assumption, Issue, Dependency)
 * - Severity/Impact (High, Medium, Low)
 * - Probability (for Risks)
 * - Suggested owner role based on content
 * - Related existing RAID items
 *
 * @version 1.0
 * @created January 17, 2026
 * @phase AI Enablement - Phase 3 (Quick Win)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30, // 30 seconds should be sufficient for categorization
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Sonnet 4.5 for straightforward classification (per AI plan)
const MODEL = 'claude-sonnet-4-5-20250929';

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
    name: "categorizeRaidItem",
    description: "Analyze a RAID item description and provide categorization suggestions including category, severity, probability, and related items.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["Risk", "Assumption", "Issue", "Dependency"],
          description: "The most appropriate RAID category for this item"
        },
        category_confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence score for the category suggestion (0-1)"
        },
        category_rationale: {
          type: "string",
          description: "Brief explanation of why this category was chosen"
        },
        severity: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Suggested severity/impact level"
        },
        severity_rationale: {
          type: "string",
          description: "Brief explanation of the severity assessment"
        },
        probability: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Probability of occurrence (primarily for Risks)"
        },
        probability_rationale: {
          type: "string",
          description: "Brief explanation of probability (if applicable)"
        },
        suggested_owner_role: {
          type: "string",
          description: "Suggested role that should own this item (e.g., 'Project Manager', 'Technical Lead', 'Procurement Manager')"
        },
        suggested_title: {
          type: "string",
          description: "Improved or suggested title if the provided one is unclear"
        },
        key_factors: {
          type: "array",
          items: { type: "string" },
          description: "Key factors identified that influenced the categorization"
        },
        mitigation_suggestions: {
          type: "array",
          items: { type: "string" },
          description: "Suggested mitigation actions or considerations"
        },
        related_item_keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to search for related existing RAID items"
        }
      },
      required: ["category", "category_confidence", "category_rationale", "severity", "severity_rationale"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert project risk analyst specializing in RAID (Risks, Assumptions, Issues, Dependencies) log management for enterprise IT projects.

Your task is to analyze text describing a potential RAID item and provide accurate categorization.

## RAID Category Definitions

**Risk** - Something that MIGHT happen in the future that would negatively impact the project
- Keywords: "might", "could", "may", "potential", "if", "chance", "probability"
- Example: "The vendor might not deliver the hardware on time"
- Example: "There is a risk that budget approval could be delayed"

**Assumption** - Something believed to be true for planning purposes but NOT yet confirmed
- Keywords: "assume", "expect", "believe", "should be", "will be available", "based on"
- Example: "We assume the client will provide test data by March"
- Example: "It is assumed that the existing infrastructure can support the new system"

**Issue** - Something that HAS ALREADY happened or IS currently happening that needs resolution
- Keywords: "is", "has", "currently", "now", "already", "discovered", "found"
- Example: "The server is down and blocking testing"
- Example: "We have discovered a security vulnerability in the API"

**Dependency** - Something the project depends on that is outside the project's direct control
- Keywords: "depends on", "waiting for", "requires", "blocked by", "prerequisite", "needs"
- Example: "This module depends on the authentication service from Team B"
- Example: "Deployment requires firewall changes from the infrastructure team"

## Severity Guidelines

**High**: Major impact on project timeline, budget, or scope. Could cause project failure.
**Medium**: Moderate impact requiring management attention. Workarounds may exist.
**Low**: Minor impact. Can likely be absorbed without significant project changes.

## Probability Guidelines (for Risks)

**High**: Very likely to occur (>70% chance)
**Medium**: Moderately likely (30-70% chance)
**Low**: Unlikely to occur (<30% chance)

## Important Notes

1. **Risk vs Issue**: A Risk hasn't happened yet; an Issue has already occurred
2. **Assumption vs Dependency**: An Assumption is an internal belief; a Dependency is an external reliance
3. If the text is ambiguous, prefer Risk over Issue (it's better to track proactively)
4. Consider the PROJECT CONTEXT if provided (milestones, team members, etc.)

Always use the categorizeRaidItem tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getExistingRaidItems(supabase, projectId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('raid_items')
      .select('id, raid_ref, category, title, description, severity, status')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .in('status', ['Open', 'In Progress'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch existing RAID items:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error fetching RAID items:', err.message);
    return [];
  }
}

async function getProjectContext(supabase, projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('name, reference, description')
      .eq('id', projectId)
      .single();

    if (error) {
      console.warn('Failed to fetch project context:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Error fetching project:', err.message);
    return null;
  }
}

function findRelatedItems(existingItems, suggestion) {
  if (!existingItems || existingItems.length === 0) return [];

  const keywords = suggestion.related_item_keywords || [];
  if (keywords.length === 0) return [];

  // Simple keyword matching
  const related = [];
  for (const item of existingItems) {
    const itemText = `${item.title} ${item.description || ''}`.toLowerCase();
    const matchCount = keywords.filter(kw => itemText.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      related.push({
        id: item.id,
        raid_ref: item.raid_ref,
        category: item.category,
        title: item.title,
        severity: item.severity,
        status: item.status,
        relevance_score: matchCount / keywords.length
      });
    }
  }

  // Sort by relevance and return top 5
  return related
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req, res) {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const startTime = Date.now();

  try {
    const {
      title,
      description,
      projectId,
      includeRelated = true
    } = req.body;

    // Validate input
    if (!title && !description) {
      return res.status(400).json({
        error: 'Either title or description is required'
      });
    }

    const itemText = `${title || ''} ${description || ''}`.trim();
    if (itemText.length < 5) {
      return res.status(400).json({
        error: 'Please provide more detail for accurate categorization'
      });
    }

    // Fetch context if projectId provided
    let existingItems = [];
    let projectContext = null;
    const supabase = getSupabase();

    if (projectId && supabase) {
      [projectContext, existingItems] = await Promise.all([
        getProjectContext(supabase, projectId),
        includeRelated ? getExistingRaidItems(supabase, projectId) : Promise.resolve([])
      ]);
    }

    // Build the analysis request
    let contextText = `## RAID Item to Categorize

**Title:** ${title || '(not provided)'}

**Description:** ${description || '(not provided)'}`;

    if (projectContext) {
      contextText += `

## Project Context
**Project:** ${projectContext.name} (${projectContext.reference || 'No ref'})
${projectContext.description ? `**Description:** ${projectContext.description}` : ''}`;
    }

    if (existingItems.length > 0) {
      contextText += `

## Existing Open RAID Items (for context)
${existingItems.map(item => `- [${item.raid_ref}] ${item.category}: ${item.title}`).join('\n')}`;
    }

    contextText += `

Please analyze this text and categorize it as the appropriate RAID item type.`;

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
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "categorizeRaidItem" },
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Extract tool use result
    let suggestion = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'categorizeRaidItem') {
        suggestion = block.input;
        break;
      }
    }

    if (!suggestion) {
      throw new Error('No categorization result from AI');
    }

    // Find related existing items
    const relatedItems = findRelatedItems(existingItems, suggestion);

    // Calculate cost
    const cost = result.usage
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) +
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    // Build response
    const responseData = {
      success: true,
      suggestion: {
        category: suggestion.category,
        categoryConfidence: suggestion.category_confidence,
        categoryRationale: suggestion.category_rationale,
        severity: suggestion.severity,
        severityRationale: suggestion.severity_rationale,
        probability: suggestion.probability || null,
        probabilityRationale: suggestion.probability_rationale || null,
        suggestedOwnerRole: suggestion.suggested_owner_role || null,
        suggestedTitle: suggestion.suggested_title || null,
        keyFactors: suggestion.key_factors || [],
        mitigationSuggestions: suggestion.mitigation_suggestions || []
      },
      relatedItems: relatedItems,
      metadata: {
        model: MODEL,
        durationMs: duration,
        usage: result.usage,
        estimatedCostUSD: cost.toFixed(6)
      }
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('RAID categorization error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to categorize RAID item'
    });
  }
}
