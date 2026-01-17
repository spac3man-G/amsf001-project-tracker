/**
 * AI Portfolio Insights API
 *
 * Cross-project analysis for organisation-level intelligence:
 * - Resource utilization across projects
 * - Common risk patterns
 * - Budget performance trends
 * - Team performance metrics
 * - Strategic recommendations
 *
 * Uses Claude Opus 4.5 for strategic analysis and pattern synthesis.
 * This is an advisory-only endpoint - no data is modified.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Predictive Intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 90,
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

  const { organisationId, options = {} } = req.body;

  if (!organisationId) {
    return res.status(400).json({ error: 'organisationId is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all active projects for the organisation
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('organisation_id', organisationId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .in('status', ['Active', 'In Progress', 'On Hold']);

    if (projError) {
      console.error('Error fetching projects:', projError);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    if (!projects || projects.length === 0) {
      return res.status(200).json({
        success: true,
        insights: {
          summary: 'No active projects found for this organisation',
          projectCount: 0
        }
      });
    }

    const projectIds = projects.map(p => p.id);

    // Fetch aggregated data across all projects
    const [
      milestonesResult,
      deliverablesResult,
      raidResult,
      timesheetsResult,
      expensesResult,
      userProjectsResult
    ] = await Promise.all([
      // Milestones across all projects
      supabase
        .from('milestones')
        .select('id, project_id, name, status, progress, start_date, end_date, baseline_end_date, baseline_breached')
        .in('project_id', projectIds)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // Deliverables across all projects
      supabase
        .from('deliverables')
        .select('id, project_id, status, progress')
        .in('project_id', projectIds)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // RAID items across all projects
      supabase
        .from('raid')
        .select('id, project_id, category, severity, status, created_at')
        .in('project_id', projectIds)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // Timesheets (last 90 days)
      supabase
        .from('timesheets')
        .select('project_id, user_id, hours_worked, date, status')
        .in('project_id', projectIds)
        .gte('date', ninetyDaysAgo)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // Expenses (last 90 days)
      supabase
        .from('expenses')
        .select('project_id, amount, status, expense_date')
        .in('project_id', projectIds)
        .gte('expense_date', ninetyDaysAgo)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // Team assignments
      supabase
        .from('user_projects')
        .select('project_id, user_id, role')
        .in('project_id', projectIds)
    ]);

    const milestones = milestonesResult.data || [];
    const deliverables = deliverablesResult.data || [];
    const raidItems = raidResult.data || [];
    const timesheets = timesheetsResult.data || [];
    const expenses = expensesResult.data || [];
    const userProjects = userProjectsResult.data || [];

    // Calculate portfolio-level metrics
    const portfolioMetrics = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length,
        onHold: projects.filter(p => p.status === 'On Hold').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.total_budget || 0), 0),
        avgProgress: Math.round(
          projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length
        )
      },
      milestones: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'Completed').length,
        inProgress: milestones.filter(m => m.status === 'In Progress').length,
        overdue: milestones.filter(m =>
          m.status !== 'Completed' && m.end_date && m.end_date < today
        ).length,
        baselineBreached: milestones.filter(m => m.baseline_breached).length
      },
      deliverables: {
        total: deliverables.length,
        delivered: deliverables.filter(d => d.status === 'Delivered').length,
        completionRate: deliverables.length > 0
          ? Math.round((deliverables.filter(d => d.status === 'Delivered').length / deliverables.length) * 100)
          : 0
      },
      raid: {
        totalOpen: raidItems.filter(r => r.status !== 'Closed').length,
        openRisks: raidItems.filter(r => r.category === 'Risk' && r.status !== 'Closed').length,
        openIssues: raidItems.filter(r => r.category === 'Issue' && r.status !== 'Closed').length,
        criticalItems: raidItems.filter(r =>
          r.severity === 'Critical' && r.status !== 'Closed'
        ).length,
        highSeverity: raidItems.filter(r =>
          (r.severity === 'High' || r.severity === 'Critical') && r.status !== 'Closed'
        ).length
      },
      effort: {
        totalHours90Days: Math.round(
          timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked || 0), 0)
        ),
        totalHours30Days: Math.round(
          timesheets
            .filter(t => t.date >= thirtyDaysAgo)
            .reduce((sum, t) => sum + parseFloat(t.hours_worked || 0), 0)
        ),
        uniqueContributors: new Set(timesheets.map(t => t.user_id)).size
      },
      expenses: {
        total90Days: Math.round(
          expenses
            .filter(e => e.status === 'approved')
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
        ),
        pendingApproval: expenses.filter(e => e.status === 'pending').length
      },
      team: {
        totalAssignments: userProjects.length,
        uniqueMembers: new Set(userProjects.map(up => up.user_id)).size,
        avgProjectsPerMember: userProjects.length > 0
          ? Math.round((userProjects.length / new Set(userProjects.map(up => up.user_id)).size) * 10) / 10
          : 0
      }
    };

    // Project-level breakdown
    const projectBreakdown = projects.map(p => {
      const pMilestones = milestones.filter(m => m.project_id === p.id);
      const pDeliverables = deliverables.filter(d => d.project_id === p.id);
      const pRaid = raidItems.filter(r => r.project_id === p.id);
      const pTimesheets = timesheets.filter(t => t.project_id === p.id);

      const completedMs = pMilestones.filter(m => m.status === 'Completed').length;
      const overdueMs = pMilestones.filter(m =>
        m.status !== 'Completed' && m.end_date && m.end_date < today
      ).length;

      // Calculate project health score
      let healthScore = 100;
      if (overdueMs > 0) healthScore -= overdueMs * 15;
      if (pRaid.filter(r => r.severity === 'Critical' && r.status !== 'Closed').length > 0) healthScore -= 20;
      if (pRaid.filter(r => r.severity === 'High' && r.status !== 'Closed').length > 2) healthScore -= 10;
      if (pMilestones.filter(m => m.baseline_breached).length > 0) healthScore -= 15;
      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        id: p.id,
        name: p.name,
        reference: p.reference,
        status: p.status,
        progress: p.progress || 0,
        budget: p.total_budget,
        healthScore,
        milestones: {
          total: pMilestones.length,
          completed: completedMs,
          overdue: overdueMs
        },
        deliverables: {
          total: pDeliverables.length,
          delivered: pDeliverables.filter(d => d.status === 'Delivered').length
        },
        openRisks: pRaid.filter(r => r.category === 'Risk' && r.status !== 'Closed').length,
        openIssues: pRaid.filter(r => r.category === 'Issue' && r.status !== 'Closed').length,
        hoursLast30Days: Math.round(
          pTimesheets
            .filter(t => t.date >= thirtyDaysAgo)
            .reduce((sum, t) => sum + parseFloat(t.hours_worked || 0), 0)
        ),
        teamSize: new Set(userProjects.filter(up => up.project_id === p.id).map(up => up.user_id)).size
      };
    });

    // Sort by health score (worst first for attention)
    projectBreakdown.sort((a, b) => a.healthScore - b.healthScore);

    // Identify patterns
    const patterns = {
      atRiskProjects: projectBreakdown.filter(p => p.healthScore < 60),
      overdueProjects: projectBreakdown.filter(p => p.milestones.overdue > 0),
      highRiskProjects: projectBreakdown.filter(p => p.openRisks > 3),
      understaffedProjects: projectBreakdown.filter(p => p.teamSize < 2 && p.progress < 80),
      topPerformers: projectBreakdown.filter(p => p.healthScore >= 80).slice(0, 3)
    };

    // Build context for AI
    const portfolioContext = {
      organisationId,
      analysisDate: today,
      portfolioMetrics,
      projectBreakdown: projectBreakdown.slice(0, 20), // Limit for token efficiency
      patterns,
      options: {
        focusAreas: options.focusAreas || ['risks', 'resources', 'performance'],
        timeHorizon: options.timeHorizon || '90days'
      }
    };

    // Call Claude for strategic analysis
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      tools: [{
        name: 'generatePortfolioInsights',
        description: 'Generate strategic insights and recommendations for the project portfolio',
        input_schema: {
          type: 'object',
          properties: {
            executiveSummary: {
              type: 'string',
              description: 'Brief executive summary of portfolio health (2-3 sentences)'
            },
            overallHealth: {
              type: 'string',
              enum: ['healthy', 'concerns', 'at_risk', 'critical']
            },
            healthScore: {
              type: 'number',
              description: 'Portfolio health score 0-100'
            },
            keyMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  value: { type: 'string' },
                  trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
                  assessment: { type: 'string', enum: ['good', 'warning', 'critical'] }
                }
              },
              description: 'Key portfolio metrics with assessment'
            },
            projectsNeedingAttention: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  projectRef: { type: 'string' },
                  projectName: { type: 'string' },
                  urgency: { type: 'string', enum: ['immediate', 'this_week', 'this_month'] },
                  reason: { type: 'string' },
                  recommendation: { type: 'string' }
                }
              },
              description: 'Projects requiring management attention'
            },
            riskPatterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pattern: { type: 'string' },
                  affectedProjects: { type: 'number' },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  mitigation: { type: 'string' }
                }
              },
              description: 'Common risk patterns across projects'
            },
            resourceInsights: {
              type: 'object',
              properties: {
                utilizationAssessment: { type: 'string' },
                capacityConcerns: { type: 'array', items: { type: 'string' } },
                recommendations: { type: 'array', items: { type: 'string' } }
              }
            },
            strategicRecommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  category: { type: 'string', enum: ['risk', 'resource', 'process', 'financial', 'strategic'] },
                  recommendation: { type: 'string' },
                  rationale: { type: 'string' },
                  impact: { type: 'string' }
                }
              },
              description: 'Strategic recommendations for portfolio management'
            },
            trends: {
              type: 'object',
              properties: {
                delivery: { type: 'string', enum: ['improving', 'stable', 'declining'] },
                quality: { type: 'string', enum: ['improving', 'stable', 'declining'] },
                risk: { type: 'string', enum: ['improving', 'stable', 'increasing'] },
                summary: { type: 'string' }
              }
            },
            lookAhead: {
              type: 'object',
              properties: {
                upcomingMilestones: { type: 'number', description: 'Milestones due in next 30 days' },
                potentialBottlenecks: { type: 'array', items: { type: 'string' } },
                opportunities: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['executiveSummary', 'overallHealth', 'healthScore', 'keyMetrics', 'strategicRecommendations']
        }
      }],
      tool_choice: { type: 'tool', name: 'generatePortfolioInsights' },
      messages: [{
        role: 'user',
        content: `You are a portfolio management expert analyzing a portfolio of ${projects.length} projects.

Portfolio Data:
${JSON.stringify(portfolioContext, null, 2)}

Provide strategic insights focusing on:

1. **Executive Summary**: Brief assessment of overall portfolio health

2. **Key Metrics**: Highlight the most important metrics with trends and assessment

3. **Projects Needing Attention**: Identify projects that require immediate management focus, with specific reasons and recommendations

4. **Risk Patterns**: Look for common risk themes across projects (e.g., resource constraints, scope creep, technical debt)

5. **Resource Insights**: Assess team utilization, identify capacity issues, recommend rebalancing if needed

6. **Strategic Recommendations**: Actionable recommendations for improving portfolio performance, prioritized by impact

7. **Trends**: Overall trajectory of delivery, quality, and risk

8. **Look Ahead**: Upcoming milestones and potential issues in the next 30-90 days

Be direct, data-driven, and actionable. Focus on insights that a portfolio manager can act on.`
      }]
    });

    // Extract insights from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not return portfolio insights');
    }

    const insights = toolUse.input;

    // Add metadata
    insights.metadata = {
      organisationId,
      analyzedAt: new Date().toISOString(),
      model: MODEL,
      projectsAnalyzed: projects.length,
      dataPoints: {
        milestones: milestones.length,
        deliverables: deliverables.length,
        raidItems: raidItems.length,
        timesheetEntries: timesheets.length,
        teamMembers: portfolioMetrics.team.uniqueMembers
      }
    };

    // Include raw metrics for dashboard use
    insights.rawMetrics = portfolioMetrics;
    insights.projectBreakdown = projectBreakdown;

    return res.status(200).json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('AI portfolio insights error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Portfolio analysis failed'
    });
  }
}
