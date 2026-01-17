/**
 * AI Project Forecasting API
 *
 * Analyzes project data to predict:
 * - Estimated completion date with confidence intervals
 * - Budget forecast (expected final cost)
 * - Milestone completion predictions
 * - Team utilization forecast
 *
 * Uses Claude Opus 4.5 for statistical reasoning and trend analysis.
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

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    // Fetch project details
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch all milestones with stats
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('end_date', { ascending: true });

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Fetch timesheet data for velocity calculation (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('date, hours_worked, milestone_id, status')
      .eq('project_id', projectId)
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('date', { ascending: true });

    // Fetch expense data
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, expense_date, status')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    // Fetch applied variations for historical changes
    const { data: variations } = await supabase
      .from('variations')
      .select('total_cost_impact, total_days_impact, applied_at')
      .eq('project_id', projectId)
      .eq('status', 'applied');

    // Calculate metrics
    const today = new Date().toISOString().split('T')[0];

    // Milestone analysis
    const totalMilestones = (milestones || []).length;
    const completedMilestones = (milestones || []).filter(m => m.status === 'Completed').length;
    const inProgressMilestones = (milestones || []).filter(m => m.status === 'In Progress').length;
    const overdueMilestones = (milestones || []).filter(m =>
      m.status !== 'Completed' && m.end_date && m.end_date < today
    ).length;

    // Deliverable analysis
    const totalDeliverables = (deliverables || []).length;
    const deliveredDeliverables = (deliverables || []).filter(d => d.status === 'Delivered').length;

    // Calculate overall progress
    const milestoneProgress = totalMilestones > 0
      ? (milestones || []).reduce((sum, m) => sum + (m.progress || 0), 0) / totalMilestones
      : 0;

    // Timesheet velocity (hours per week over last 8 weeks)
    const weeklyHours = [];
    const weekMap = new Map();
    (timesheets || []).forEach(t => {
      const week = getWeekNumber(new Date(t.date));
      const key = `${new Date(t.date).getFullYear()}-${week}`;
      weekMap.set(key, (weekMap.get(key) || 0) + parseFloat(t.hours_worked || 0));
    });
    weekMap.forEach((hours, week) => weeklyHours.push({ week, hours }));

    const avgWeeklyHours = weeklyHours.length > 0
      ? weeklyHours.reduce((sum, w) => sum + w.hours, 0) / weeklyHours.length
      : 0;

    // Trend (is velocity increasing or decreasing?)
    let velocityTrend = 'stable';
    if (weeklyHours.length >= 4) {
      const firstHalf = weeklyHours.slice(0, Math.floor(weeklyHours.length / 2));
      const secondHalf = weeklyHours.slice(Math.floor(weeklyHours.length / 2));
      const firstAvg = firstHalf.reduce((s, w) => s + w.hours, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, w) => s + w.hours, 0) / secondHalf.length;
      if (secondAvg > firstAvg * 1.1) velocityTrend = 'increasing';
      else if (secondAvg < firstAvg * 0.9) velocityTrend = 'decreasing';
    }

    // Budget analysis
    const totalBudget = project.total_budget || 0;
    const allocatedDays = project.allocated_days || 0;
    const totalTimesheetHours = (timesheets || []).reduce((sum, t) => sum + parseFloat(t.hours_worked || 0), 0);
    const totalExpenses = (expenses || []).filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const variationCostImpact = (variations || []).reduce((sum, v) => sum + (v.total_cost_impact || 0), 0);

    // Milestone billable totals
    const totalMilestoneBillable = (milestones || []).reduce((sum, m) => sum + (m.billable || 0), 0);
    const completedBillable = (milestones || []).filter(m => m.status === 'Completed').reduce((sum, m) => sum + (m.billable || 0), 0);

    // Find project end date (last milestone end date)
    const projectEndDate = project.end_date ||
      (milestones && milestones.length > 0
        ? milestones.reduce((latest, m) => m.end_date > latest ? m.end_date : latest, milestones[0].end_date)
        : null);

    // Calculate days remaining
    const daysRemaining = projectEndDate
      ? Math.ceil((new Date(projectEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Build context for AI
    const forecastContext = {
      project: {
        name: project.name,
        reference: project.reference,
        startDate: project.start_date,
        plannedEndDate: projectEndDate,
        totalBudget,
        allocatedDays,
        daysRemaining
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        inProgress: inProgressMilestones,
        overdue: overdueMilestones,
        averageProgress: Math.round(milestoneProgress),
        list: (milestones || []).map(m => ({
          ref: m.milestone_ref,
          name: m.name,
          status: m.status,
          progress: m.progress || 0,
          plannedEnd: m.end_date,
          forecastEnd: m.forecast_end_date,
          baselineEnd: m.baseline_end_date,
          billable: m.billable,
          isOverdue: m.status !== 'Completed' && m.end_date && m.end_date < today
        }))
      },
      deliverables: {
        total: totalDeliverables,
        delivered: deliveredDeliverables,
        completionRate: totalDeliverables > 0 ? Math.round((deliveredDeliverables / totalDeliverables) * 100) : 0
      },
      velocity: {
        avgWeeklyHours: Math.round(avgWeeklyHours * 10) / 10,
        trend: velocityTrend,
        totalHoursLogged: Math.round(totalTimesheetHours),
        weeklyData: weeklyHours.slice(-8) // Last 8 weeks
      },
      budget: {
        totalBudget,
        totalMilestoneBillable,
        completedBillable,
        totalExpenses,
        variationImpact: variationCostImpact,
        burnRate: totalTimesheetHours > 0 && avgWeeklyHours > 0
          ? Math.round((totalTimesheetHours / avgWeeklyHours) * 10) / 10
          : null // weeks of burn so far
      },
      timeline: {
        today,
        projectStarted: project.start_date <= today,
        daysElapsed: project.start_date
          ? Math.ceil((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24))
          : 0,
        daysRemaining
      }
    };

    // Call Claude for forecasting
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      tools: [{
        name: 'generateProjectForecast',
        description: 'Generate a project completion forecast with predictions and confidence levels',
        input_schema: {
          type: 'object',
          properties: {
            completionForecast: {
              type: 'object',
              properties: {
                predictedEndDate: { type: 'string', description: 'ISO date string of predicted completion' },
                confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
                confidencePercent: { type: 'number', description: '0-100 confidence percentage' },
                optimisticDate: { type: 'string', description: 'Best case completion date' },
                pessimisticDate: { type: 'string', description: 'Worst case completion date' },
                daysVariance: { type: 'number', description: 'Days from planned end (positive = late)' },
                onTrack: { type: 'boolean' }
              },
              required: ['predictedEndDate', 'confidenceLevel', 'confidencePercent', 'onTrack']
            },
            budgetForecast: {
              type: 'object',
              properties: {
                predictedFinalCost: { type: 'number' },
                confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
                varianceFromBudget: { type: 'number', description: 'Positive = over budget' },
                variancePercent: { type: 'number' },
                burnRateAssessment: { type: 'string', enum: ['under', 'on_track', 'over'] },
                riskOfOverrun: { type: 'boolean' }
              },
              required: ['predictedFinalCost', 'confidenceLevel', 'burnRateAssessment']
            },
            milestoneForecasts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestoneRef: { type: 'string' },
                  status: { type: 'string' },
                  riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  predictedCompletion: { type: 'string' },
                  concerns: { type: 'array', items: { type: 'string' } }
                }
              },
              description: 'Forecasts for at-risk or in-progress milestones only'
            },
            summary: {
              type: 'string',
              description: 'Executive summary of the forecast (2-3 sentences)'
            },
            keyInsights: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key insights from the analysis'
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  recommendation: { type: 'string' },
                  rationale: { type: 'string' }
                }
              },
              description: 'Actionable recommendations to improve outcomes'
            },
            healthScore: {
              type: 'number',
              description: 'Overall project health score 0-100'
            },
            healthIndicators: {
              type: 'object',
              properties: {
                schedule: { type: 'string', enum: ['green', 'amber', 'red'] },
                budget: { type: 'string', enum: ['green', 'amber', 'red'] },
                scope: { type: 'string', enum: ['green', 'amber', 'red'] },
                velocity: { type: 'string', enum: ['green', 'amber', 'red'] }
              }
            }
          },
          required: ['completionForecast', 'budgetForecast', 'summary', 'keyInsights', 'healthScore', 'healthIndicators']
        }
      }],
      tool_choice: { type: 'tool', name: 'generateProjectForecast' },
      messages: [{
        role: 'user',
        content: `You are a project management expert analyzing project data to generate completion forecasts.

Analyze this project data and provide a comprehensive forecast:

${JSON.stringify(forecastContext, null, 2)}

Consider:
1. **Completion Forecast**: Based on current progress rate and milestone completion patterns, when will the project likely complete? Use the velocity trend to adjust predictions.

2. **Budget Forecast**: Based on burn rate and completion patterns, what's the expected final cost? Consider variations already applied.

3. **At-Risk Milestones**: Which milestones are at risk of slipping? Consider progress vs time remaining.

4. **Health Indicators**: Rate schedule, budget, scope, and velocity on a traffic light system.

5. **Recommendations**: What actions could improve the forecast?

Important:
- Be realistic, not optimistic
- If data is insufficient, reflect lower confidence
- For dates, use ISO format (YYYY-MM-DD)
- Overdue milestones are a strong signal of schedule risk
- Decreasing velocity trend suggests further delays likely`
      }]
    });

    // Extract forecast from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not return forecast');
    }

    const forecast = toolUse.input;

    // Add metadata
    forecast.metadata = {
      projectId,
      projectName: project.name,
      forecastedAt: new Date().toISOString(),
      model: MODEL,
      dataPoints: {
        milestonesAnalyzed: totalMilestones,
        deliverablesAnalyzed: totalDeliverables,
        timesheetWeeksAnalyzed: weeklyHours.length,
        totalHoursLogged: Math.round(totalTimesheetHours)
      }
    };

    return res.status(200).json({
      success: true,
      forecast
    });

  } catch (error) {
    console.error('AI project forecast error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Forecast failed'
    });
  }
}

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
