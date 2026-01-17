/**
 * AI Document Generation API
 *
 * Generates formatted project documents from structured data:
 * - Status Reports (weekly/monthly project status)
 * - Project Summaries (executive overview)
 * - Milestone Reports (detailed milestone status)
 * - RAID Summary (risks, issues, decisions summary)
 * - Handover Documents (project transition pack)
 *
 * Uses Claude Opus 4.5 for high-quality document generation.
 * This is an advisory-only endpoint - generates content for review.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Intelligent Assistance
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

const DOCUMENT_TYPES = {
  status_report: {
    name: 'Status Report',
    description: 'Weekly or monthly project status update',
    sections: ['executive_summary', 'progress', 'milestones', 'risks_issues', 'next_steps', 'metrics']
  },
  project_summary: {
    name: 'Project Summary',
    description: 'Executive overview of project health and status',
    sections: ['overview', 'key_metrics', 'highlights', 'concerns', 'recommendations']
  },
  milestone_report: {
    name: 'Milestone Report',
    description: 'Detailed status report for a specific milestone',
    sections: ['overview', 'deliverables', 'progress', 'blockers', 'timeline', 'next_steps']
  },
  raid_summary: {
    name: 'RAID Summary',
    description: 'Summary of risks, assumptions, issues, and decisions',
    sections: ['critical_items', 'risks', 'issues', 'assumptions', 'decisions', 'action_items']
  },
  handover_document: {
    name: 'Handover Document',
    description: 'Project transition and handover pack',
    sections: ['project_overview', 'current_state', 'outstanding_items', 'contacts', 'documentation', 'recommendations']
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, documentType, options = {} } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  if (!documentType || !DOCUMENT_TYPES[documentType]) {
    return res.status(400).json({
      error: 'Valid documentType is required',
      validTypes: Object.keys(DOCUMENT_TYPES)
    });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const docConfig = DOCUMENT_TYPES[documentType];

    // Fetch project details
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch all related data in parallel
    const [
      milestonesResult,
      deliverablesResult,
      raidResult,
      kpisResult,
      timesheetsResult,
      variationsResult,
      teamResult
    ] = await Promise.all([
      supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('end_date', { ascending: true }),
      supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false'),
      supabase
        .from('raid')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: false }),
      supabase
        .from('kpis')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false'),
      supabase
        .from('timesheets')
        .select('hours_worked, date, status')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase
        .from('variations')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false'),
      supabase
        .from('user_projects')
        .select('role, users!inner(full_name, email)')
        .eq('project_id', projectId)
    ]);

    const milestones = milestonesResult.data || [];
    const deliverables = deliverablesResult.data || [];
    const raidItems = raidResult.data || [];
    const kpis = kpisResult.data || [];
    const timesheets = timesheetsResult.data || [];
    const variations = variationsResult.data || [];
    const team = teamResult.data || [];

    // Calculate metrics
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
    const overdueMilestones = milestones.filter(m =>
      m.status !== 'Completed' && m.end_date && m.end_date < today
    );

    const totalDeliverables = deliverables.length;
    const deliveredDeliverables = deliverables.filter(d => d.status === 'Delivered').length;

    const openRisks = raidItems.filter(r => r.category === 'Risk' && r.status !== 'Closed');
    const openIssues = raidItems.filter(r => r.category === 'Issue' && r.status !== 'Closed');
    const highSeverityItems = raidItems.filter(r =>
      (r.severity === 'High' || r.severity === 'Critical') && r.status !== 'Closed'
    );

    const totalHoursLogged = timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked || 0), 0);

    const pendingVariations = variations.filter(v =>
      ['draft', 'submitted', 'awaiting_customer', 'awaiting_supplier'].includes(v.status)
    );

    // Build context for AI
    const documentContext = {
      project: {
        name: project.name,
        reference: project.reference,
        description: project.description,
        status: project.status,
        startDate: project.start_date,
        endDate: project.end_date,
        totalBudget: project.total_budget,
        allocatedDays: project.allocated_days
      },
      metrics: {
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          inProgress: milestones.filter(m => m.status === 'In Progress').length,
          overdue: overdueMilestones.length,
          completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
        },
        deliverables: {
          total: totalDeliverables,
          delivered: deliveredDeliverables,
          completionRate: totalDeliverables > 0 ? Math.round((deliveredDeliverables / totalDeliverables) * 100) : 0
        },
        raid: {
          openRisks: openRisks.length,
          openIssues: openIssues.length,
          highSeverity: highSeverityItems.length
        },
        effort: {
          hoursLast30Days: Math.round(totalHoursLogged),
          pendingVariations: pendingVariations.length
        }
      },
      milestones: milestones.map(m => ({
        ref: m.milestone_ref,
        name: m.name,
        status: m.status,
        progress: m.progress || 0,
        startDate: m.start_date,
        endDate: m.end_date,
        forecastEndDate: m.forecast_end_date,
        isOverdue: m.status !== 'Completed' && m.end_date && m.end_date < today,
        baselineBreached: m.baseline_breached
      })),
      deliverables: deliverables.map(d => ({
        ref: d.deliverable_ref,
        name: d.name,
        status: d.status,
        progress: d.progress || 0,
        milestoneId: d.milestone_id
      })),
      raid: {
        risks: openRisks.slice(0, 10).map(r => ({
          ref: r.raid_ref,
          title: r.title,
          severity: r.severity,
          probability: r.probability,
          status: r.status,
          owner: r.owner
        })),
        issues: openIssues.slice(0, 10).map(i => ({
          ref: i.raid_ref,
          title: i.title,
          severity: i.severity,
          status: i.status,
          owner: i.owner
        })),
        assumptions: raidItems.filter(r => r.category === 'Assumption' && r.status !== 'Closed').slice(0, 5).map(a => ({
          ref: a.raid_ref,
          title: a.title,
          status: a.status
        })),
        decisions: raidItems.filter(r => r.category === 'Decision').slice(0, 5).map(d => ({
          ref: d.raid_ref,
          title: d.title,
          decision_date: d.decision_date
        }))
      },
      kpis: kpis.slice(0, 10).map(k => ({
        name: k.name,
        target: k.target_value,
        actual: k.actual_value,
        unit: k.unit,
        status: k.status
      })),
      variations: pendingVariations.map(v => ({
        ref: v.variation_ref,
        title: v.title,
        status: v.status,
        costImpact: v.total_cost_impact,
        daysImpact: v.total_days_impact
      })),
      team: team.map(t => ({
        name: t.users?.full_name,
        role: t.role
      })),
      options: {
        reportingPeriod: options.reportingPeriod || 'current',
        includeFinancials: options.includeFinancials !== false,
        tone: options.tone || 'professional',
        audienceLevel: options.audienceLevel || 'executive'
      },
      generatedAt: today
    };

    // Call Claude for document generation
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      tools: [{
        name: 'generateDocument',
        description: `Generate a ${docConfig.name} document with properly formatted sections`,
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Document title'
            },
            subtitle: {
              type: 'string',
              description: 'Document subtitle (e.g., date range, project reference)'
            },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  heading: { type: 'string' },
                  content: { type: 'string', description: 'Markdown-formatted content' },
                  type: { type: 'string', enum: ['text', 'list', 'table', 'metrics', 'callout'] }
                },
                required: ['heading', 'content', 'type']
              }
            },
            executiveSummary: {
              type: 'string',
              description: 'Brief executive summary (2-3 sentences)'
            },
            keyHighlights: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key highlights or achievements'
            },
            concerns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  recommendation: { type: 'string' }
                }
              },
              description: 'Areas of concern with recommendations'
            },
            nextSteps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  owner: { type: 'string' },
                  dueDate: { type: 'string' }
                }
              },
              description: 'Recommended next steps'
            },
            overallStatus: {
              type: 'string',
              enum: ['green', 'amber', 'red'],
              description: 'Overall project/report status'
            },
            confidenceLevel: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Confidence in the assessment'
            }
          },
          required: ['title', 'sections', 'executiveSummary', 'overallStatus']
        }
      }],
      tool_choice: { type: 'tool', name: 'generateDocument' },
      messages: [{
        role: 'user',
        content: `You are a professional project manager generating a ${docConfig.name} document.

Document Type: ${docConfig.name}
Purpose: ${docConfig.description}
Required Sections: ${docConfig.sections.join(', ')}

Project Data:
${JSON.stringify(documentContext, null, 2)}

Guidelines:
1. Write in ${documentContext.options.tone} tone appropriate for ${documentContext.options.audienceLevel} audience
2. Be factual and data-driven - cite specific metrics
3. Highlight achievements but don't gloss over problems
4. Make recommendations actionable and specific
5. Use clear, concise language
6. Format content in Markdown for each section
7. For tables, use Markdown table syntax
8. For metrics, present key numbers prominently
9. Include RAG status indicators where appropriate (Red/Amber/Green)
10. Date references should use format: DD MMM YYYY

Overall Status Guidelines:
- GREEN: Project on track, no significant issues
- AMBER: Some concerns requiring attention, manageable risks
- RED: Significant issues, project at risk, urgent action needed

Generate a comprehensive, professional document that tells the story of this project's current state.`
      }]
    });

    // Extract document from tool use
    const toolUse = response.content.find(c => c.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI did not generate document');
    }

    const document = toolUse.input;

    // Add metadata
    document.metadata = {
      projectId,
      projectName: project.name,
      projectRef: project.reference,
      documentType,
      documentTypeName: docConfig.name,
      generatedAt: new Date().toISOString(),
      model: MODEL,
      options: documentContext.options
    };

    return res.status(200).json({
      success: true,
      document
    });

  } catch (error) {
    console.error('AI document generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Document generation failed'
    });
  }
}
