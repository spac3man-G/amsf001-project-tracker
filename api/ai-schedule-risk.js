/**
 * AI Schedule Risk Predictor API
 *
 * Identifies milestones at risk of slipping by analyzing:
 * - Current progress vs required progress rate
 * - Historical slip patterns
 * - Team capacity and allocation
 * - External dependencies and blockers
 *
 * Uses Claude Opus 4.5 for multi-factor risk calculation.
 * This is an advisory-only endpoint - no data is modified.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Predictive Intelligence
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

  const { projectId, milestoneId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    // Fetch milestones (optionally filter to single milestone)
    let query = supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .neq('status', 'Completed')
      .order('end_date', { ascending: true });

    if (milestoneId) {
      query = query.eq('id', milestoneId);
    }

    const { data: milestones, error: msError } = await query;

    if (msError) {
      console.error('Error fetching milestones:', msError);
      return res.status(500).json({ error: 'Failed to fetch milestones' });
    }

    if (!milestones || milestones.length === 0) {
      return res.status(200).json({
        success: true,
        riskAssessments: [],
        summary: 'No active milestones to analyze'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch deliverables for each milestone
    const milestoneIds = milestones.map(m => m.id);
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('id, name, status, progress, milestone_id, deliverable_ref')
      .in('milestone_id', milestoneIds)
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Fetch RAID items (risks/issues) affecting milestones
    const { data: raidItems } = await supabase
      .from('raid')
      .select('id, category, title, severity, status, milestone_id')
      .in('milestone_id', milestoneIds)
      .in('status', ['Open', 'In Progress'])
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Fetch recent timesheet activity per milestone
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('milestone_id, hours_worked, date')
      .in('milestone_id', milestoneIds)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Fetch pending variations affecting these milestones
    const { data: pendingVariations } = await supabase
      .from('variation_milestones')
      .select('milestone_id, variations!inner(status, variation_ref, title)')
      .in('milestone_id', milestoneIds)
      .in('variations.status', ['draft', 'submitted', 'awaiting_customer', 'awaiting_supplier']);

    // Calculate activity per milestone
    const milestoneActivity = new Map();
    (timesheets || []).forEach(t => {
      const current = milestoneActivity.get(t.milestone_id) || { hours: 0, lastActivity: null };
      current.hours += parseFloat(t.hours_worked || 0);
      if (!current.lastActivity || t.date > current.lastActivity) {
        current.lastActivity = t.date;
      }
      milestoneActivity.set(t.milestone_id, current);
    });

    // Build risk context for each milestone
    const milestoneRiskData = milestones.map(m => {
      const msDeliverables = (deliverables || []).filter(d => d.milestone_id === m.id);
      const msRaid = (raidItems || []).filter(r => r.milestone_id === m.id);
      const msVariations = (pendingVariations || []).filter(v => v.milestone_id === m.id);
      const activity = milestoneActivity.get(m.id) || { hours: 0, lastActivity: null };

      // Calculate time metrics
      const startDate = new Date(m.start_date || m.baseline_start_date);
      const endDate = new Date(m.end_date || m.baseline_end_date || m.forecast_end_date);
      const totalDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      const percentTimeElapsed = totalDuration > 0 ? Math.round((daysElapsed / totalDuration) * 100) : 0;

      // Calculate required vs actual progress
      const expectedProgress = Math.min(100, percentTimeElapsed);
      const actualProgress = m.progress || 0;
      const progressGap = expectedProgress - actualProgress;

      // Deliverable completion rate
      const totalDeliverables = msDeliverables.length;
      const completedDeliverables = msDeliverables.filter(d => d.status === 'Delivered').length;
      const deliverableCompletionRate = totalDeliverables > 0
        ? Math.round((completedDeliverables / totalDeliverables) * 100)
        : 100; // No deliverables = not blocked

      // High severity risks/issues
      const highSeverityRaid = msRaid.filter(r => r.severity === 'High' || r.severity === 'Critical');

      // Days since last activity
      const daysSinceActivity = activity.lastActivity
        ? Math.ceil((new Date() - new Date(activity.lastActivity)) / (1000 * 60 * 60 * 24))
        : 999; // No activity recorded

      return {
        id: m.id,
        ref: m.milestone_ref,
        name: m.name,
        status: m.status,
        startDate: m.start_date,
        endDate: m.end_date || m.baseline_end_date,
        forecastEndDate: m.forecast_end_date,
        baselineEndDate: m.baseline_end_date,
        isOverdue: daysRemaining < 0,
        daysOverdue: daysRemaining < 0 ? Math.abs(daysRemaining) : 0,
        daysRemaining: Math.max(0, daysRemaining),
        progress: actualProgress,
        expectedProgress,
        progressGap,
        percentTimeElapsed,
        deliverables: {
          total: totalDeliverables,
          completed: completedDeliverables,
          completionRate: deliverableCompletionRate,
          incomplete: msDeliverables.filter(d => d.status !== 'Delivered').map(d => ({
            ref: d.deliverable_ref,
            name: d.name,
            progress: d.progress
          }))
        },
        risks: {
          total: msRaid.filter(r => r.category === 'Risk').length,
          highSeverity: highSeverityRaid.filter(r => r.category === 'Risk').length,
          items: msRaid.filter(r => r.category === 'Risk').map(r => ({
            title: r.title,
            severity: r.severity
          }))
        },
        issues: {
          total: msRaid.filter(r => r.category === 'Issue').length,
          highSeverity: highSeverityRaid.filter(r => r.category === 'Issue').length,
          items: msRaid.filter(r => r.category === 'Issue').map(i => ({
            title: i.title,
            severity: i.severity
          }))
        },
        activity: {
          hoursLast30Days: Math.round(activity.hours),
          daysSinceLastActivity: daysSinceActivity,
          lastActivityDate: activity.lastActivity
        },
        pendingVariations: msVariations.map(v => ({
          ref: v.variations?.variation_ref,
          title: v.variations?.title,
          status: v.variations?.status
        })),
        hasBaselineBreach: m.baseline_breached || false
      };
    });

    // Call Claude for risk analysis
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      tools: [{
        name: 'assessScheduleRisks',
        description: 'Assess schedule risks for milestones and predict which are likely to slip',
        input_schema: {
          type: 'object',
          properties: {
            riskAssessments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestoneRef: { type: 'string' },
                  milestoneName: { type: 'string' },
                  riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  riskScore: { type: 'number', description: '0-100 risk score' },
                  predictedOutcome: { type: 'string', enum: ['on_track', 'at_risk', 'likely_late', 'severely_delayed'] },
                  predictedDelay: { type: 'number', description: 'Predicted days delay (0 if on track)' },
                  predictedCompletionDate: { type: 'string', description: 'ISO date of predicted completion' },
                  confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
                  primaryRiskFactors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Top risk factors for this milestone'
                  },
                  mitigationActions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        action: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        potentialDaysRecovered: { type: 'number' }
                      }
                    }
                  },
                  dependencyImpact: { type: 'string', description: 'How delay affects downstream milestones' }
                },
                required: ['milestoneRef', 'milestoneName', 'riskLevel', 'riskScore', 'predictedOutcome', 'primaryRiskFactors']
              }
            },
            summary: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                criticalCount: { type: 'number' },
                highRiskCount: { type: 'number' },
                mediumRiskCount: { type: 'number' },
                lowRiskCount: { type: 'number' },
                overallAssessment: { type: 'string' }
              }
            },
            topConcerns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Top 3 schedule concerns across all milestones'
            },
            recommendedFocus: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestoneRef: { type: 'string' },
                  reason: { type: 'string' },
                  urgency: { type: 'string', enum: ['immediate', 'this_week', 'next_week'] }
                }
              },
              description: 'Milestones requiring immediate attention'
            }
          },
          required: ['riskAssessments', 'summary', 'topConcerns']
        }
      }],
      tool_choice: { type: 'tool', name: 'assessScheduleRisks' },
      messages: [{
        role: 'user',
        content: `You are a project risk analyst specializing in schedule prediction. Analyze these milestones and assess which are at risk of slipping.

Milestone Data:
${JSON.stringify(milestoneRiskData, null, 2)}

Today's date: ${today}

Risk Assessment Guidelines:
1. **Progress Gap**: If actual progress is significantly behind expected progress (based on time elapsed), risk increases
2. **Overdue Status**: Already overdue milestones are critical
3. **Deliverable Completion**: Low deliverable completion rate with little time remaining = high risk
4. **Stalled Activity**: No timesheet activity for 7+ days on an active milestone suggests stalling
5. **Open Issues**: High severity issues directly impact schedule
6. **Pending Variations**: May indicate scope uncertainty
7. **Baseline Breach**: Already flagged as breaching baseline = confirmed risk

Risk Levels:
- **Critical**: >90% likelihood of delay, or already significantly overdue
- **High**: 60-90% likelihood of delay, or minor slippage already occurring
- **Medium**: 30-60% likelihood, concerning indicators present
- **Low**: <30% likelihood, on track with minor concerns

Provide specific, actionable mitigation recommendations with estimated days that could be recovered.`
      }]
    });

    // Extract assessment from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not return risk assessment');
    }

    const assessment = toolUse.input;

    // Add metadata
    assessment.metadata = {
      projectId,
      analyzedAt: new Date().toISOString(),
      model: MODEL,
      milestonesAnalyzed: milestones.length
    };

    return res.status(200).json({
      success: true,
      ...assessment
    });

  } catch (error) {
    console.error('AI schedule risk prediction error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Risk assessment failed'
    });
  }
}
