/**
 * AI Deliverable Quality Assessment API
 *
 * Evaluates deliverable readiness before sign-off by analyzing:
 * - Task completion status
 * - KPI and Quality Standard linkages
 * - Progress vs timeline
 * - Description completeness
 * - Historical comparison with similar deliverables
 *
 * Uses Claude Opus 4.5 for nuanced evaluation and quality recommendations.
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

  const { deliverableId, projectId, includeComparison = true } = req.body;

  if (!deliverableId || !projectId) {
    return res.status(400).json({ error: 'deliverableId and projectId are required' });
  }

  try {
    // Fetch deliverable with all related data
    const { data: deliverable, error: delError } = await supabase
      .from('deliverables')
      .select(`
        *,
        milestones(id, name, milestone_ref, end_date, forecast_end_date, status),
        deliverable_kpis(kpi_id, kpis(id, kpi_ref, name, description, target_value, current_value)),
        deliverable_quality_standards(quality_standard_id, quality_standards(id, qs_ref, name, description))
      `)
      .eq('id', deliverableId)
      .single();

    if (delError) {
      console.error('Error fetching deliverable:', delError);
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    // Fetch tasks from plan_items for this deliverable
    const { data: planItems } = await supabase
      .from('plan_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('item_type', 'task')
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Find tasks that belong to this deliverable's plan item
    const { data: deliverableItem } = await supabase
      .from('plan_items')
      .select('id')
      .eq('published_deliverable_id', deliverableId)
      .single();

    let tasks = [];
    if (deliverableItem && planItems) {
      tasks = planItems.filter(t => t.parent_id === deliverableItem.id);
    }

    // Calculate task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.progress === 100).length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress' && t.progress < 100).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    // Fetch similar completed deliverables for comparison
    let comparisonData = null;
    if (includeComparison) {
      const { data: similarDeliverables } = await supabase
        .from('deliverables')
        .select('id, name, description, progress, status, delivered_date, created_at')
        .eq('project_id', projectId)
        .eq('status', 'Delivered')
        .neq('id', deliverableId)
        .limit(5);

      if (similarDeliverables && similarDeliverables.length > 0) {
        // Calculate average metrics from delivered deliverables
        comparisonData = {
          count: similarDeliverables.length,
          avgDescriptionLength: Math.round(
            similarDeliverables.reduce((sum, d) => sum + (d.description?.length || 0), 0) / similarDeliverables.length
          ),
          samples: similarDeliverables.map(d => ({
            name: d.name,
            descriptionLength: d.description?.length || 0
          }))
        };
      }
    }

    // Build context for AI
    const milestone = deliverable.milestones;
    const kpis = deliverable.deliverable_kpis?.map(dk => dk.kpis) || [];
    const qualityStandards = deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standards) || [];

    const dueDate = milestone?.forecast_end_date || milestone?.end_date;
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDate && dueDate < today && deliverable.status !== 'Delivered';

    // Build assessment context
    const assessmentContext = {
      deliverable: {
        ref: deliverable.deliverable_ref,
        name: deliverable.name,
        description: deliverable.description,
        status: deliverable.status,
        progress: deliverable.progress || 0,
        signOffStatus: deliverable.sign_off_status,
        supplierSigned: !!deliverable.supplier_pm_signed_at,
        customerSigned: !!deliverable.customer_pm_signed_at
      },
      milestone: milestone ? {
        ref: milestone.milestone_ref,
        name: milestone.name,
        dueDate: dueDate,
        status: milestone.status
      } : null,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        completionRate: Math.round(taskCompletionRate),
        items: tasks.map(t => ({
          name: t.name,
          status: t.status,
          progress: t.progress
        }))
      },
      kpis: kpis.map(k => ({
        ref: k?.kpi_ref,
        name: k?.name,
        description: k?.description,
        targetValue: k?.target_value,
        currentValue: k?.current_value
      })),
      qualityStandards: qualityStandards.map(qs => ({
        ref: qs?.qs_ref,
        name: qs?.name,
        description: qs?.description
      })),
      timeline: {
        dueDate,
        today,
        isOverdue,
        daysUntilDue: dueDate ? Math.ceil((new Date(dueDate) - new Date(today)) / (1000 * 60 * 60 * 24)) : null
      },
      comparison: comparisonData
    };

    // Call Claude for assessment
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      tools: [{
        name: 'assessDeliverableQuality',
        description: 'Assess deliverable readiness for sign-off and provide recommendations',
        input_schema: {
          type: 'object',
          properties: {
            readinessScore: {
              type: 'number',
              description: 'Overall readiness score from 0-100'
            },
            readinessLevel: {
              type: 'string',
              enum: ['ready', 'almost_ready', 'needs_work', 'not_ready'],
              description: 'Categorical readiness level'
            },
            summary: {
              type: 'string',
              description: 'One-line summary of readiness status'
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'What is going well with this deliverable'
            },
            concerns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  recommendation: { type: 'string' }
                },
                required: ['issue', 'severity', 'recommendation']
              },
              description: 'Areas of concern with recommendations'
            },
            checklistStatus: {
              type: 'object',
              properties: {
                tasksComplete: { type: 'boolean' },
                hasKPIs: { type: 'boolean' },
                hasQualityStandards: { type: 'boolean' },
                descriptionAdequate: { type: 'boolean' },
                progressAligned: { type: 'boolean' },
                timelineOnTrack: { type: 'boolean' }
              },
              description: 'Checklist of quality criteria'
            },
            signOffReadiness: {
              type: 'object',
              properties: {
                readyForSignOff: { type: 'boolean' },
                blockers: { type: 'array', items: { type: 'string' } },
                recommendation: { type: 'string' }
              },
              description: 'Specific sign-off readiness assessment'
            }
          },
          required: ['readinessScore', 'readinessLevel', 'summary', 'strengths', 'concerns', 'checklistStatus', 'signOffReadiness']
        }
      }],
      tool_choice: { type: 'tool', name: 'assessDeliverableQuality' },
      messages: [{
        role: 'user',
        content: `You are a project quality analyst assessing a deliverable's readiness for sign-off.

Analyze this deliverable and provide a comprehensive quality assessment:

${JSON.stringify(assessmentContext, null, 2)}

Consider:
1. Task completion - Are all tasks complete? What percentage?
2. KPI linkage - Are there linked KPIs? This indicates measurability.
3. Quality Standards - Are there linked QS? This indicates quality gates.
4. Description quality - Is the description clear and complete? Compare to average length if comparison data provided.
5. Progress alignment - Does reported progress match task completion?
6. Timeline - Is the deliverable on track for its due date?
7. Sign-off status - What's blocking or ready for sign-off?

Provide:
- A readiness score (0-100)
- A readiness level (ready, almost_ready, needs_work, not_ready)
- Specific strengths and concerns with actionable recommendations
- A sign-off specific assessment

Be honest but constructive. Focus on what will help the team deliver quality work.`
      }]
    });

    // Extract assessment from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not return assessment');
    }

    const assessment = toolUse.input;

    // Add metadata
    assessment.metadata = {
      deliverableRef: deliverable.deliverable_ref,
      deliverableName: deliverable.name,
      assessedAt: new Date().toISOString(),
      model: MODEL,
      rawMetrics: {
        taskCompletionRate: Math.round(taskCompletionRate),
        totalTasks,
        completedTasks,
        kpiCount: kpis.length,
        qsCount: qualityStandards.length,
        descriptionLength: deliverable.description?.length || 0,
        progress: deliverable.progress || 0,
        daysUntilDue: assessmentContext.timeline.daysUntilDue
      }
    };

    return res.status(200).json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('AI deliverable assessment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Assessment failed'
    });
  }
}
