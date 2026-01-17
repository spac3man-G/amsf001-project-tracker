/**
 * AI Approval Assistant - Vercel Serverless Function
 *
 * Uses Claude AI to analyze pending approval items and provide recommendations.
 * Helps PMs prioritize their approval queue with intelligent suggestions.
 *
 * Features:
 * - Summarizes pending approvals by category
 * - Identifies anomalies (unusual hours, missing receipts, etc.)
 * - Provides approval/rejection recommendations with rationale
 * - Suggests batch approval for routine items
 * - Flags items requiring closer review
 *
 * @version 1.0
 * @created January 17, 2026
 * @phase AI Enablement - Phase 2 (Quick Win)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for comprehensive analysis
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Opus 4.5 for high-quality risk assessment (per AI plan)
const MODEL = 'claude-opus-4-5-20251101';

// Initialize Supabase client
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// Token costs for Opus 4.5 (per 1M tokens)
const TOKEN_COSTS = {
  input: 15.00,
  output: 75.00,
};

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: "analyzeApprovals",
    description: "Analyze pending approval items and provide recommendations for each category.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          description: "High-level summary of pending approvals",
          properties: {
            total_items: { type: "number" },
            total_value_gbp: { type: "number" },
            items_requiring_attention: { type: "number" },
            recommended_batch_approvals: { type: "number" },
            executive_summary: {
              type: "string",
              description: "2-3 sentence summary for the approver"
            }
          },
          required: ["total_items", "executive_summary"]
        },
        timesheets: {
          type: "object",
          description: "Timesheet approval analysis",
          properties: {
            count: { type: "number" },
            total_hours: { type: "number" },
            total_value_gbp: { type: "number" },
            recommendation: {
              type: "string",
              enum: ["approve_all", "approve_most", "review_individually", "reject_all"],
              description: "Overall recommendation for this category"
            },
            routine_items: {
              type: "array",
              items: { type: "string" },
              description: "IDs of items that appear routine and can be batch approved"
            },
            flagged_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] }
                }
              },
              description: "Items requiring closer review"
            },
            anomalies: {
              type: "array",
              items: { type: "string" },
              description: "Detected anomalies (unusual hours, patterns, etc.)"
            }
          }
        },
        expenses: {
          type: "object",
          description: "Expense approval analysis",
          properties: {
            count: { type: "number" },
            total_value_gbp: { type: "number" },
            recommendation: {
              type: "string",
              enum: ["approve_all", "approve_most", "review_individually", "reject_all"]
            },
            routine_items: {
              type: "array",
              items: { type: "string" }
            },
            flagged_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            },
            policy_concerns: {
              type: "array",
              items: { type: "string" },
              description: "Potential policy violations or concerns"
            }
          }
        },
        deliverables: {
          type: "object",
          description: "Deliverable sign-off analysis",
          properties: {
            count: { type: "number" },
            recommendation: {
              type: "string",
              enum: ["approve_all", "approve_most", "review_individually", "reject_all"]
            },
            ready_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                }
              },
              description: "Items that appear ready for sign-off"
            },
            items_needing_review: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  concerns: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        variations: {
          type: "object",
          description: "Variation (change request) analysis",
          properties: {
            count: { type: "number" },
            total_impact_gbp: { type: "number" },
            recommendation: {
              type: "string",
              enum: ["approve_all", "approve_most", "review_individually", "reject_all"]
            },
            risk_assessment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  concerns: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        action_items: {
          type: "array",
          description: "Prioritized list of recommended actions",
          items: {
            type: "object",
            properties: {
              priority: { type: "number", minimum: 1, maximum: 10 },
              action: { type: "string" },
              category: { type: "string" },
              rationale: { type: "string" }
            }
          }
        }
      },
      required: ["summary", "action_items"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert project management assistant helping a Project Manager review and process their pending approval queue.

Your role is to analyze the pending items and provide intelligent recommendations that save time while ensuring proper governance.

## Analysis Guidelines

### Timesheets
- Standard working day: 7.5-8 hours
- Flag: >10 hours/day, weekend work, public holidays
- Flag: Large gaps between dates
- Flag: Unusually high total hours for period
- Consider: Team member's typical patterns

### Expenses
- Check for: Missing receipts (required >£25)
- Check for: Duplicate amounts same vendor/date
- Check for: Unusually high amounts for category
- Check for: Policy violations (alcohol, first class travel without approval)
- Consider: Project budget context

### Deliverables
- Check: All acceptance criteria addressed
- Check: Required attachments present
- Check: Previous reviewer comments addressed
- Consider: Milestone deadlines

### Variations (Change Requests)
- Assess: Budget impact relative to project size
- Assess: Timeline impact
- Assess: Scope creep patterns
- Consider: Cumulative variation impact

## Output Guidelines
1. Be concise but specific
2. Prioritize high-value/high-risk items
3. Provide clear rationale for recommendations
4. Suggest batch approval where appropriate to save time
5. Flag genuine concerns but avoid false alarms

Use GBP (£) for all currency values.
Always use the analyzeApprovals tool to structure your output.`;

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

async function fetchTimesheets(supabase, projectId, userRole) {
  try {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        id,
        submitted_date,
        hours_worked,
        date,
        status,
        notes,
        resource_id,
        user_id,
        hourly_rate,
        resources(id, name)
      `)
      .eq('project_id', projectId)
      .eq('status', 'Submitted')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('submitted_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(ts => ({
      id: ts.id,
      type: 'timesheet',
      date: ts.date,
      submittedDate: ts.submitted_date,
      hours: ts.hours_worked,
      value: ts.hours_worked * (ts.hourly_rate || 0),
      resourceName: ts.resources?.name || 'Unknown',
      notes: ts.notes
    }));
  } catch (err) {
    console.warn('Failed to fetch timesheets:', err.message);
    return [];
  }
}

async function fetchExpenses(supabase, projectId, userRole) {
  try {
    // Determine which expenses to fetch based on role
    let query = supabase
      .from('expenses')
      .select(`
        id,
        date,
        amount,
        category,
        description,
        receipt_url,
        status,
        submitted_date,
        is_chargeable,
        resource_id,
        resources(id, name)
      `)
      .eq('project_id', projectId)
      .eq('status', 'Submitted')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('submitted_date', { ascending: true });

    // Filter by chargeable based on role
    if (userRole === 'customer_pm') {
      query = query.eq('is_chargeable', true);
    } else if (userRole === 'supplier_pm') {
      // Supplier PM sees non-chargeable
      query = query.eq('is_chargeable', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(exp => ({
      id: exp.id,
      type: 'expense',
      date: exp.date,
      submittedDate: exp.submitted_date,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      hasReceipt: !!exp.receipt_url,
      resourceName: exp.resources?.name || 'Unknown',
      isChargeable: exp.is_chargeable
    }));
  } catch (err) {
    console.warn('Failed to fetch expenses:', err.message);
    return [];
  }
}

async function fetchDeliverables(supabase, projectId, userRole) {
  try {
    let statusFilter;
    if (userRole === 'customer_pm') {
      statusFilter = ['Review', 'Sign-off (Customer)'];
    } else if (userRole === 'supplier_pm') {
      statusFilter = ['Sign-off (Supplier)'];
    } else {
      statusFilter = ['Review', 'Sign-off (Supplier)', 'Sign-off (Customer)'];
    }

    const { data, error } = await supabase
      .from('deliverables')
      .select(`
        id,
        name,
        description,
        status,
        acceptance_criteria,
        planned_date,
        actual_date,
        milestone_id,
        milestones(id, name, milestone_ref)
      `)
      .eq('project_id', projectId)
      .in('status', statusFilter)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('planned_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(del => ({
      id: del.id,
      type: 'deliverable',
      name: del.name,
      description: del.description?.substring(0, 200),
      status: del.status,
      acceptanceCriteria: del.acceptance_criteria,
      plannedDate: del.planned_date,
      milestoneName: del.milestones?.name,
      milestoneRef: del.milestones?.milestone_ref
    }));
  } catch (err) {
    console.warn('Failed to fetch deliverables:', err.message);
    return [];
  }
}

async function fetchVariations(supabase, projectId, userRole) {
  try {
    let statusFilter;
    if (userRole === 'customer_pm') {
      statusFilter = ['Submitted', 'Awaiting Customer'];
    } else if (userRole === 'supplier_pm') {
      statusFilter = ['Awaiting Supplier'];
    } else {
      statusFilter = ['Submitted', 'Awaiting Supplier', 'Awaiting Customer'];
    }

    const { data, error } = await supabase
      .from('variations')
      .select(`
        id,
        variation_ref,
        title,
        description,
        status,
        cost_impact,
        time_impact_days,
        requested_date,
        requested_by
      `)
      .eq('project_id', projectId)
      .in('status', statusFilter)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('requested_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(v => ({
      id: v.id,
      type: 'variation',
      ref: v.variation_ref,
      title: v.title,
      description: v.description?.substring(0, 200),
      status: v.status,
      costImpact: v.cost_impact || 0,
      timeImpactDays: v.time_impact_days || 0,
      requestedDate: v.requested_date
    }));
  } catch (err) {
    console.warn('Failed to fetch variations:', err.message);
    return [];
  }
}

async function getProjectContext(supabase, projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('name, reference, budget, start_date, end_date')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Failed to fetch project:', err.message);
    return null;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req, res) {
  // Handle CORS
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

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Database service not configured' });
  }

  const startTime = Date.now();

  try {
    const {
      projectId,
      userRole = 'supplier_pm', // supplier_pm or customer_pm
      categories = ['timesheets', 'expenses', 'deliverables', 'variations']
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Fetch all pending items in parallel
    const [timesheets, expenses, deliverables, variations, projectContext] = await Promise.all([
      categories.includes('timesheets') ? fetchTimesheets(supabase, projectId, userRole) : [],
      categories.includes('expenses') ? fetchExpenses(supabase, projectId, userRole) : [],
      categories.includes('deliverables') ? fetchDeliverables(supabase, projectId, userRole) : [],
      categories.includes('variations') ? fetchVariations(supabase, projectId, userRole) : [],
      getProjectContext(supabase, projectId)
    ]);

    const totalItems = timesheets.length + expenses.length + deliverables.length + variations.length;

    // If no items, return early
    if (totalItems === 0) {
      return res.status(200).json({
        success: true,
        analysis: {
          summary: {
            total_items: 0,
            executive_summary: "No pending approvals in your queue. You're all caught up!"
          },
          action_items: []
        },
        metadata: {
          model: MODEL,
          durationMs: Date.now() - startTime,
          usage: null,
          estimatedCostUSD: "0.000000"
        }
      });
    }

    // Build context for AI
    let contextText = `## Pending Approvals Analysis Request

**Your Role:** ${userRole === 'customer_pm' ? 'Customer Project Manager' : 'Supplier Project Manager'}`;

    if (projectContext) {
      contextText += `
**Project:** ${projectContext.name} (${projectContext.reference || 'No ref'})
**Budget:** £${(projectContext.budget || 0).toLocaleString()}`;
    }

    // Timesheets section
    if (timesheets.length > 0) {
      const totalHours = timesheets.reduce((sum, t) => sum + t.hours, 0);
      const totalValue = timesheets.reduce((sum, t) => sum + t.value, 0);
      contextText += `

## Timesheets (${timesheets.length} items, ${totalHours} hours, £${totalValue.toFixed(2)})
${timesheets.map(t => `- [${t.id.substring(0, 8)}] ${t.resourceName}: ${t.hours}h on ${t.date}${t.notes ? ` - "${t.notes}"` : ''}`).join('\n')}`;
    }

    // Expenses section
    if (expenses.length > 0) {
      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
      contextText += `

## Expenses (${expenses.length} items, £${totalAmount.toFixed(2)})
${expenses.map(e => `- [${e.id.substring(0, 8)}] ${e.resourceName}: £${e.amount.toFixed(2)} ${e.category} on ${e.date}${!e.hasReceipt ? ' [NO RECEIPT]' : ''} - "${e.description || 'No description'}"`).join('\n')}`;
    }

    // Deliverables section
    if (deliverables.length > 0) {
      contextText += `

## Deliverables Awaiting Sign-off (${deliverables.length} items)
${deliverables.map(d => `- [${d.id.substring(0, 8)}] "${d.name}" (${d.status}) - Milestone: ${d.milestoneRef || 'None'}${d.acceptanceCriteria ? ` - Has acceptance criteria` : ' - NO acceptance criteria'}`).join('\n')}`;
    }

    // Variations section
    if (variations.length > 0) {
      const totalCostImpact = variations.reduce((sum, v) => sum + v.costImpact, 0);
      contextText += `

## Variations/Change Requests (${variations.length} items, £${totalCostImpact.toFixed(2)} total impact)
${variations.map(v => `- [${v.id.substring(0, 8)}] ${v.ref}: "${v.title}" - £${v.costImpact.toFixed(2)} impact, ${v.timeImpactDays} days`).join('\n')}`;
    }

    contextText += `

Please analyze these pending items and provide recommendations to help me process my approval queue efficiently.`;

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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "analyzeApprovals" },
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
    let analysis = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'analyzeApprovals') {
        analysis = block.input;
        break;
      }
    }

    if (!analysis) {
      throw new Error('No analysis result from AI');
    }

    // Calculate cost
    const cost = result.usage
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) +
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    // Build response
    return res.status(200).json({
      success: true,
      analysis: analysis,
      rawData: {
        timesheets: timesheets.length,
        expenses: expenses.length,
        deliverables: deliverables.length,
        variations: variations.length
      },
      metadata: {
        model: MODEL,
        durationMs: duration,
        usage: result.usage,
        estimatedCostUSD: cost.toFixed(6)
      }
    });

  } catch (error) {
    console.error('Approval assistant error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze approvals'
    });
  }
}
