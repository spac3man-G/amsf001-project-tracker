/**
 * AI Variation Impact Analyzer API
 *
 * Analyzes the impact of proposed variations (change requests) including:
 * - Timeline impacts on dependent milestones
 * - Cost implications and budget effects
 * - Resource and scope implications
 * - Risk assessment
 * - Approval recommendation
 *
 * Uses Claude Opus 4.5 for complex dependency analysis and risk calculation.
 * This is an advisory-only endpoint - no data is modified.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Quality Tools
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

const MODEL = 'claude-opus-4-5-20251101';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { variationId, projectId, proposedChanges } = req.body;

  // Either analyze an existing variation or proposed changes
  if (!projectId || (!variationId && !proposedChanges)) {
    return res.status(400).json({
      error: 'projectId required, plus either variationId or proposedChanges'
    });
  }

  try {
    let variationData = null;
    let affectedMilestones = [];

    // If analyzing an existing variation
    if (variationId) {
      // Fetch variation details
      const { data: variation, error: varError } = await supabase
        .from('variations')
        .select('*')
        .eq('id', variationId)
        .single();

      if (varError || !variation) {
        return res.status(404).json({ error: 'Variation not found' });
      }

      variationData = variation;

      // Fetch affected milestones
      const { data: varMilestones } = await supabase
        .from('variation_milestones')
        .select(`
          *,
          milestone:milestones(id, milestone_ref, name, baseline_start_date, baseline_end_date, baseline_billable, status)
        `)
        .eq('variation_id', variationId);

      affectedMilestones = varMilestones || [];
    } else {
      // Use proposed changes directly
      variationData = proposedChanges;
      affectedMilestones = proposedChanges.affectedMilestones || [];
    }

    // Fetch all project milestones for dependency analysis
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('baseline_end_date', { ascending: true });

    // Fetch project budget/financial info
    const { data: project } = await supabase
      .from('projects')
      .select('name, reference, budget, total_contracted_value, estimated_cost')
      .eq('id', projectId)
      .single();

    // Fetch existing applied variations for historical context
    const { data: appliedVariations } = await supabase
      .from('variations')
      .select('id, variation_ref, title, total_cost_impact, total_days_impact, applied_at')
      .eq('project_id', projectId)
      .eq('status', 'applied')
      .order('applied_at', { ascending: false })
      .limit(5);

    // Calculate impacts
    let totalCostChange = 0;
    let totalDaysChange = 0;
    const milestoneImpacts = [];

    for (const vm of affectedMilestones) {
      const costDiff = (vm.new_baseline_cost || 0) - (vm.original_baseline_cost || 0);
      totalCostChange += costDiff;

      let daysDiff = 0;
      if (vm.original_baseline_end && vm.new_baseline_end) {
        const origEnd = new Date(vm.original_baseline_end);
        const newEnd = new Date(vm.new_baseline_end);
        daysDiff = Math.round((newEnd - origEnd) / (1000 * 60 * 60 * 24));
        totalDaysChange += daysDiff;
      }

      milestoneImpacts.push({
        milestoneRef: vm.milestone?.milestone_ref || vm.milestoneRef,
        milestoneName: vm.milestone?.name || vm.milestoneName,
        costChange: costDiff,
        daysChange: daysDiff,
        originalEnd: vm.original_baseline_end,
        newEnd: vm.new_baseline_end
      });
    }

    // Identify downstream dependencies
    const affectedMilestoneIds = affectedMilestones.map(vm => vm.milestone_id || vm.milestoneId);
    const downstreamMilestones = [];

    if (allMilestones) {
      for (const m of allMilestones) {
        if (affectedMilestoneIds.includes(m.id)) continue;

        // Check if this milestone starts after any affected milestone ends
        for (const affected of affectedMilestones) {
          const affectedEnd = affected.new_baseline_end || affected.original_baseline_end;
          if (affectedEnd && m.baseline_start_date && m.baseline_start_date >= affectedEnd) {
            downstreamMilestones.push({
              milestoneRef: m.milestone_ref,
              milestoneName: m.name,
              currentStart: m.baseline_start_date,
              currentEnd: m.baseline_end_date,
              dependsOn: affected.milestone?.milestone_ref || affected.milestoneRef
            });
            break;
          }
        }
      }
    }

    // Calculate budget impact
    const currentBudget = project?.total_contracted_value || project?.budget || 0;
    const budgetImpactPercent = currentBudget > 0 ? (totalCostChange / currentBudget) * 100 : 0;
    const totalAppliedCostImpact = (appliedVariations || []).reduce((sum, v) => sum + (v.total_cost_impact || 0), 0);
    const cumulativeCostChange = totalAppliedCostImpact + totalCostChange;

    // Build analysis context
    const analysisContext = {
      variation: {
        ref: variationData.variation_ref,
        title: variationData.title,
        type: variationData.variation_type,
        description: variationData.description,
        reason: variationData.reason,
        status: variationData.status
      },
      impacts: {
        totalCostChange,
        totalDaysChange,
        budgetImpactPercent: Math.round(budgetImpactPercent * 100) / 100,
        milestoneCount: affectedMilestones.length,
        milestoneImpacts
      },
      dependencies: {
        downstreamMilestones,
        potentialCascadeCount: downstreamMilestones.length
      },
      project: {
        name: project?.name,
        currentBudget,
        cumulativeVariationCost: cumulativeCostChange,
        previousVariationsCount: (appliedVariations || []).length
      },
      history: {
        recentVariations: (appliedVariations || []).map(v => ({
          ref: v.variation_ref,
          title: v.title,
          costImpact: v.total_cost_impact,
          daysImpact: v.total_days_impact,
          appliedAt: v.applied_at
        }))
      }
    };

    // Call Claude for impact analysis
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2500,
      tools: [{
        name: 'analyzeVariationImpact',
        description: 'Analyze the impact of a proposed variation and provide recommendations',
        input_schema: {
          type: 'object',
          properties: {
            overallRisk: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Overall risk level of approving this variation'
            },
            recommendation: {
              type: 'string',
              enum: ['approve', 'approve_with_conditions', 'review_required', 'reject'],
              description: 'Recommendation for this variation'
            },
            recommendationRationale: {
              type: 'string',
              description: 'Explanation of the recommendation'
            },
            summary: {
              type: 'string',
              description: 'One-paragraph executive summary of the impact analysis'
            },
            timelineImpact: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['none', 'minor', 'moderate', 'major', 'critical'] },
                description: { type: 'string' },
                cascadeRisk: { type: 'boolean' },
                mitigationOptions: { type: 'array', items: { type: 'string' } }
              },
              required: ['severity', 'description', 'cascadeRisk']
            },
            budgetImpact: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['none', 'minor', 'moderate', 'major', 'critical'] },
                description: { type: 'string' },
                percentageChange: { type: 'number' },
                cumulativeRisk: { type: 'boolean' }
              },
              required: ['severity', 'description', 'percentageChange']
            },
            scopeImpact: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['none', 'minor', 'moderate', 'major', 'critical'] },
                description: { type: 'string' },
                qualityRisk: { type: 'boolean' }
              },
              required: ['severity', 'description']
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
                  impact: { type: 'string', enum: ['low', 'medium', 'high'] },
                  mitigation: { type: 'string' }
                },
                required: ['risk', 'likelihood', 'impact', 'mitigation']
              }
            },
            conditions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Conditions that should be met before approval (if applicable)'
            },
            stakeholderCommunication: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key points to communicate to stakeholders'
            }
          },
          required: ['overallRisk', 'recommendation', 'recommendationRationale', 'summary', 'timelineImpact', 'budgetImpact', 'scopeImpact', 'risks']
        }
      }],
      tool_choice: { type: 'tool', name: 'analyzeVariationImpact' },
      messages: [{
        role: 'user',
        content: `You are a project management expert analyzing a variation (change request) for a project.

Analyze this variation and provide a comprehensive impact assessment:

${JSON.stringify(analysisContext, null, 2)}

Consider:
1. **Timeline Impact**: How does this affect the project schedule? Are there downstream dependencies that could be affected?
2. **Budget Impact**: What's the financial impact? Is this within acceptable thresholds? Consider cumulative impact of all variations.
3. **Scope Impact**: Does this change the deliverables or quality expectations?
4. **Risk Analysis**: What risks does this variation introduce or mitigate?
5. **Historical Context**: How does this compare to previous variations on this project?

Provide:
- An overall risk assessment (low/medium/high/critical)
- A clear recommendation (approve/approve_with_conditions/review_required/reject)
- Specific risks with mitigation strategies
- Conditions for approval if applicable
- Key stakeholder communication points

Be thorough but practical. Focus on actionable insights that help decision-makers.`
      }]
    });

    // Extract analysis from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not return analysis');
    }

    const analysis = toolUse.input;

    // Add metadata
    analysis.metadata = {
      variationRef: variationData.variation_ref,
      variationTitle: variationData.title,
      analyzedAt: new Date().toISOString(),
      model: MODEL,
      rawMetrics: {
        totalCostChange,
        totalDaysChange,
        budgetImpactPercent: Math.round(budgetImpactPercent * 100) / 100,
        affectedMilestoneCount: affectedMilestones.length,
        downstreamDependencyCount: downstreamMilestones.length,
        previousVariationsCount: (appliedVariations || []).length,
        cumulativeVariationCost: cumulativeCostChange
      }
    };

    return res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('AI variation impact analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Analysis failed'
    });
  }
}
