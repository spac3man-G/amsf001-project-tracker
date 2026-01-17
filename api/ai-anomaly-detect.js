/**
 * AI Anomaly Detection - Vercel Serverless Function
 *
 * Proactively analyzes project data to identify potential issues and anomalies.
 * Returns alerts and recommendations - DOES NOT modify any data.
 *
 * Detects:
 * - Timesheet anomalies (unusual hours, gaps, patterns)
 * - Expense anomalies (duplicates, missing receipts, policy concerns)
 * - Milestone risks (approaching deadlines, blocked items)
 * - Deliverable concerns (stalled progress, overdue items)
 * - RAID issues (unowned risks, escalating items)
 *
 * @version 1.0
 * @created January 17, 2026
 * @phase AI Enablement - Phase 2 (Proactive Intelligence)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60, // 60 seconds for comprehensive analysis
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Opus 4.5 for pattern recognition and subtle issue detection
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
    name: "detectAnomalies",
    description: "Analyze project data and identify anomalies, risks, and items needing attention.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            total_alerts: { type: "number" },
            high_priority: { type: "number" },
            medium_priority: { type: "number" },
            low_priority: { type: "number" },
            headline: {
              type: "string",
              description: "One-line summary for dashboard display"
            }
          },
          required: ["total_alerts", "headline"]
        },
        alerts: {
          type: "array",
          description: "List of detected anomalies and concerns",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for this alert"
              },
              category: {
                type: "string",
                enum: ["timesheet", "expense", "milestone", "deliverable", "raid", "general"],
                description: "Category of the alert"
              },
              severity: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Severity level"
              },
              title: {
                type: "string",
                description: "Short title for the alert"
              },
              description: {
                type: "string",
                description: "Detailed description of the issue"
              },
              affected_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    type: { type: "string" },
                    name: { type: "string" }
                  }
                },
                description: "List of affected items with IDs for navigation"
              },
              suggested_action: {
                type: "string",
                description: "Recommended action to address this issue"
              },
              route: {
                type: "string",
                description: "Frontend route to view affected items (e.g., '/milestones/123')"
              }
            },
            required: ["id", "category", "severity", "title", "description"]
          }
        },
        patterns: {
          type: "array",
          description: "Identified patterns that may indicate systemic issues",
          items: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              frequency: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        }
      },
      required: ["summary", "alerts"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert project analyst helping identify potential issues and anomalies in project data.

Your role is to proactively surface concerns that project managers should be aware of. You analyze patterns and flag items needing attention.

## Analysis Guidelines

### Timesheets
- Flag: Days with >10 hours logged (unusual overtime)
- Flag: Weekend or public holiday entries without notes
- Flag: Team members with no entries for >5 business days
- Flag: Sudden changes in typical hours pattern
- Flag: Potential duplicate entries (same hours, same date)

### Expenses
- Flag: Missing receipts for amounts >£25
- Flag: Duplicate amounts from same vendor within 7 days
- Flag: Amounts significantly higher than category average
- Flag: Unusual categories for the project type
- Flag: Expenses without descriptions

### Milestones
- Flag: Milestones due within 7 days with incomplete deliverables
- Flag: Milestones with no progress update in 14+ days
- Flag: Baseline breaches (deliverables exceeding milestone dates)
- Flag: Milestones at risk based on current progress rate

### Deliverables
- Flag: Deliverables past due date still in progress
- Flag: No updates in 14+ days
- Flag: Missing acceptance criteria
- Flag: Blocked status with no linked RAID item

### RAID Items
- Flag: High severity risks/issues without assigned owner
- Flag: Open items past due date
- Flag: Risks with high probability AND high impact
- Flag: Items open for >30 days without status change

## Severity Guidelines

**High**: Immediate attention needed. Could impact project timeline, budget, or compliance.
**Medium**: Should be addressed soon. Potential to escalate if ignored.
**Low**: Worth noting. May indicate process improvements needed.

## Output Guidelines
1. Be specific - include names, dates, amounts where relevant
2. Provide actionable suggestions
3. Include item IDs for navigation
4. Don't cry wolf - only flag genuine concerns
5. Prioritize by business impact

Use GBP (£) for currency. Use DD/MM/YYYY for dates.
Always use the detectAnomalies tool to structure your output.`;

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

async function fetchTimesheetData(supabase, projectId, lookbackDays = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  try {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        id, date, hours_worked, status, notes, submitted_date,
        user_id, resource_id,
        resources(id, name)
      `)
      .eq('project_id', projectId)
      .gte('date', startDate.toISOString().split('T')[0])
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch timesheets:', err.message);
    return [];
  }
}

async function fetchExpenseData(supabase, projectId, lookbackDays = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id, date, amount, category, description, receipt_url, status,
        resource_id,
        resources(id, name)
      `)
      .eq('project_id', projectId)
      .gte('date', startDate.toISOString().split('T')[0])
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch expenses:', err.message);
    return [];
  }
}

async function fetchMilestoneData(supabase, projectId) {
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select(`
        id, name, milestone_ref, status, progress,
        planned_start, planned_end, actual_start, actual_end,
        baseline_breached, baseline_breach_reason,
        updated_at
      `)
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .in('status', ['Not Started', 'In Progress', 'At Risk'])
      .order('planned_end', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch milestones:', err.message);
    return [];
  }
}

async function fetchDeliverableData(supabase, projectId) {
  try {
    const { data, error } = await supabase
      .from('deliverables')
      .select(`
        id, name, deliverable_ref, status, progress,
        planned_date, actual_date, acceptance_criteria,
        milestone_id, updated_at,
        milestones(id, name, milestone_ref)
      `)
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .in('status', ['Not Started', 'In Progress', 'Review', 'Blocked'])
      .order('planned_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch deliverables:', err.message);
    return [];
  }
}

async function fetchRaidData(supabase, projectId) {
  try {
    const { data, error } = await supabase
      .from('raid_items')
      .select(`
        id, raid_ref, category, title, description,
        severity, probability, status, due_date,
        owner_user_id, created_at, updated_at
      `)
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .in('status', ['Open', 'In Progress'])
      .order('severity', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch RAID items:', err.message);
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
      categories = ['timesheets', 'expenses', 'milestones', 'deliverables', 'raid'],
      lookbackDays = 30
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Fetch all data in parallel
    const [timesheets, expenses, milestones, deliverables, raidItems, projectContext] = await Promise.all([
      categories.includes('timesheets') ? fetchTimesheetData(supabase, projectId, lookbackDays) : [],
      categories.includes('expenses') ? fetchExpenseData(supabase, projectId, lookbackDays) : [],
      categories.includes('milestones') ? fetchMilestoneData(supabase, projectId) : [],
      categories.includes('deliverables') ? fetchDeliverableData(supabase, projectId) : [],
      categories.includes('raid') ? fetchRaidData(supabase, projectId) : [],
      getProjectContext(supabase, projectId)
    ]);

    const today = new Date().toISOString().split('T')[0];

    // Build context for AI
    let contextText = `## Anomaly Detection Request

**Today's Date:** ${new Date().toLocaleDateString('en-GB')}
**Analysis Period:** Last ${lookbackDays} days`;

    if (projectContext) {
      contextText += `
**Project:** ${projectContext.name} (${projectContext.reference || 'No ref'})
**Budget:** £${(projectContext.budget || 0).toLocaleString()}`;
    }

    // Timesheets section
    if (timesheets.length > 0) {
      const byPerson = {};
      timesheets.forEach(ts => {
        const name = ts.resources?.name || 'Unknown';
        if (!byPerson[name]) byPerson[name] = [];
        byPerson[name].push(ts);
      });

      contextText += `

## Timesheet Data (${timesheets.length} entries, ${Object.keys(byPerson).length} team members)`;

      Object.entries(byPerson).forEach(([name, entries]) => {
        const totalHours = entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0);
        const maxDay = Math.max(...entries.map(e => e.hours_worked || 0));
        contextText += `
- ${name}: ${entries.length} entries, ${totalHours}h total, max ${maxDay}h/day`;

        // Flag specific concerns
        entries.filter(e => e.hours_worked > 10).forEach(e => {
          contextText += `
  * ${e.date}: ${e.hours_worked}h logged [ID: ${e.id.substring(0, 8)}]`;
        });
      });
    }

    // Expenses section
    if (expenses.length > 0) {
      const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const missingReceipts = expenses.filter(e => !e.receipt_url && e.amount > 25);

      contextText += `

## Expense Data (${expenses.length} entries, £${totalAmount.toFixed(2)} total)`;

      if (missingReceipts.length > 0) {
        contextText += `
**Missing Receipts (>£25):** ${missingReceipts.length} items`;
        missingReceipts.slice(0, 5).forEach(e => {
          contextText += `
- ${e.date}: £${e.amount.toFixed(2)} ${e.category} by ${e.resources?.name || 'Unknown'} [ID: ${e.id.substring(0, 8)}]`;
        });
      }

      // Check for potential duplicates
      const potentialDupes = [];
      for (let i = 0; i < expenses.length; i++) {
        for (let j = i + 1; j < expenses.length; j++) {
          if (expenses[i].amount === expenses[j].amount &&
              expenses[i].category === expenses[j].category &&
              Math.abs(new Date(expenses[i].date) - new Date(expenses[j].date)) < 7 * 24 * 60 * 60 * 1000) {
            potentialDupes.push([expenses[i], expenses[j]]);
          }
        }
      }
      if (potentialDupes.length > 0) {
        contextText += `
**Potential Duplicates:** ${potentialDupes.length} pairs found`;
      }
    }

    // Milestones section
    if (milestones.length > 0) {
      const upcomingDeadlines = milestones.filter(m => {
        const daysUntil = Math.ceil((new Date(m.planned_end) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 14 && daysUntil >= 0;
      });
      const breached = milestones.filter(m => m.baseline_breached);
      const stale = milestones.filter(m => {
        const daysSinceUpdate = Math.ceil((new Date() - new Date(m.updated_at)) / (1000 * 60 * 60 * 24));
        return daysSinceUpdate > 14;
      });

      contextText += `

## Milestone Data (${milestones.length} active milestones)`;

      if (upcomingDeadlines.length > 0) {
        contextText += `
**Due within 14 days:** ${upcomingDeadlines.length}`;
        upcomingDeadlines.forEach(m => {
          const daysUntil = Math.ceil((new Date(m.planned_end) - new Date()) / (1000 * 60 * 60 * 24));
          contextText += `
- ${m.milestone_ref}: "${m.name}" - ${daysUntil} days, ${m.progress || 0}% complete [ID: ${m.id.substring(0, 8)}]`;
        });
      }

      if (breached.length > 0) {
        contextText += `
**Baseline Breaches:** ${breached.length}`;
        breached.forEach(m => {
          contextText += `
- ${m.milestone_ref}: ${m.baseline_breach_reason || 'No reason recorded'} [ID: ${m.id.substring(0, 8)}]`;
        });
      }

      if (stale.length > 0) {
        contextText += `
**No updates in 14+ days:** ${stale.length} milestones`;
      }
    }

    // Deliverables section
    if (deliverables.length > 0) {
      const overdue = deliverables.filter(d => d.planned_date && new Date(d.planned_date) < new Date() && d.status !== 'Complete');
      const blocked = deliverables.filter(d => d.status === 'Blocked');
      const missingCriteria = deliverables.filter(d => !d.acceptance_criteria);

      contextText += `

## Deliverable Data (${deliverables.length} active deliverables)`;

      if (overdue.length > 0) {
        contextText += `
**Overdue:** ${overdue.length}`;
        overdue.slice(0, 5).forEach(d => {
          const daysOverdue = Math.ceil((new Date() - new Date(d.planned_date)) / (1000 * 60 * 60 * 24));
          contextText += `
- ${d.deliverable_ref || 'No ref'}: "${d.name}" - ${daysOverdue} days overdue [ID: ${d.id.substring(0, 8)}]`;
        });
      }

      if (blocked.length > 0) {
        contextText += `
**Blocked:** ${blocked.length}`;
      }

      if (missingCriteria.length > 0) {
        contextText += `
**Missing Acceptance Criteria:** ${missingCriteria.length}`;
      }
    }

    // RAID section
    if (raidItems.length > 0) {
      const highSeverity = raidItems.filter(r => r.severity === 'High');
      const unowned = raidItems.filter(r => !r.owner_user_id);
      const overdue = raidItems.filter(r => r.due_date && new Date(r.due_date) < new Date());

      contextText += `

## RAID Data (${raidItems.length} open items)`;

      if (highSeverity.length > 0) {
        contextText += `
**High Severity:** ${highSeverity.length}`;
        highSeverity.forEach(r => {
          contextText += `
- ${r.raid_ref} (${r.category}): "${r.title}"${r.owner_user_id ? '' : ' [NO OWNER]'} [ID: ${r.id.substring(0, 8)}]`;
        });
      }

      if (unowned.length > 0) {
        contextText += `
**Unassigned:** ${unowned.length} items have no owner`;
      }

      if (overdue.length > 0) {
        contextText += `
**Past Due Date:** ${overdue.length} items`;
      }
    }

    contextText += `

Please analyze this data and identify any anomalies, risks, or items requiring attention.`;

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
        tool_choice: { type: "tool", name: "detectAnomalies" },
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
      if (block.type === 'tool_use' && block.name === 'detectAnomalies') {
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
      dataScanned: {
        timesheets: timesheets.length,
        expenses: expenses.length,
        milestones: milestones.length,
        deliverables: deliverables.length,
        raidItems: raidItems.length
      },
      metadata: {
        model: MODEL,
        durationMs: duration,
        usage: result.usage,
        estimatedCostUSD: cost.toFixed(6),
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to detect anomalies'
    });
  }
}
