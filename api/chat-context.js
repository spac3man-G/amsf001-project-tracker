// Vercel Edge Function for Chat Context Pre-fetch
// Loads key project metrics when chat opens for instant responses
// Version 1.1 - Uses aggregate view for faster fetching

import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// Timeout wrapper for queries
const QUERY_TIMEOUT_MS = 4000;

async function withTimeout(promise, timeoutMs = QUERY_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fetch all context data in parallel
async function fetchContextBundle(projectId, userContext) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database not configured');

  // Try fast path using aggregate view first
  try {
    const fastResult = await fetchFromAggregateView(supabase, projectId, userContext);
    if (fastResult) {
      console.log('[Chat Context] Using aggregate view (fast path)');
      return fastResult;
    }
  } catch (err) {
    console.warn('[Chat Context] Aggregate view not available, using fallback:', err.message);
  }

  // Fallback to multiple queries
  return fetchWithMultipleQueries(supabase, projectId, userContext);
}

// Fast path: single query using aggregate view
async function fetchFromAggregateView(supabase, projectId, userContext) {
  const { data, error } = await withTimeout(
    supabase
      .from('chat_context_summary')
      .select('*')
      .eq('project_id', projectId)
      .single(),
    3000
  );

  if (error || !data) return null;

  // Also get user-specific pending items if they have a linked resource
  let userDraftCount = 0;
  if (userContext?.linkedResourceId) {
    const { count } = await supabase
      .from('timesheets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('resource_id', userContext.linkedResourceId)
      .eq('status', 'Draft')
      .or('is_deleted.is.null,is_deleted.eq.false');
    userDraftCount = count || 0;
  }

  return {
    project: {
      id: projectId,
      name: data.project_name,
      reference: data.project_reference,
    },
    budgetSummary: {
      projectBudget: data.budget_total,
      milestoneBillable: data.budget_milestone_billable,
      actualSpend: data.budget_actual_spend,
      variance: data.budget_variance,
      percentUsed: data.budget_percent_used,
    },
    milestoneSummary: {
      total: data.milestones_total,
      byStatus: {
        completed: data.milestones_completed,
        inProgress: data.milestones_in_progress,
        notStarted: data.milestones_not_started,
        atRisk: data.milestones_at_risk,
      },
    },
    deliverableSummary: {
      total: data.deliverables_total,
      byStatus: {
        delivered: data.deliverables_delivered,
        reviewComplete: data.deliverables_review_complete,
        awaitingReview: data.deliverables_awaiting_review,
        inProgress: data.deliverables_in_progress,
        notStarted: 0, // Can add to view if needed
      },
    },
    timesheetSummary: {
      totalEntries: data.timesheets_total,
      totalHours: data.timesheets_hours,
      byStatus: {
        submitted: data.timesheets_submitted,
        validated: data.timesheets_validated,
        approved: 0, // Can add to view if needed
      },
    },
    expenseSummary: {
      totalEntries: data.expenses_total,
      totalAmount: data.expenses_amount,
      chargeableAmount: data.expenses_chargeable,
      nonChargeableAmount: data.expenses_non_chargeable,
      byStatus: {
        submitted: 0,
        validated: 0,
        approved: 0,
      },
    },
    pendingActions: {
      draftTimesheets: userDraftCount,
      awaitingValidation: data.pending_timesheets + data.pending_expenses,
      hasPending: userDraftCount > 0 || data.pending_timesheets > 0 || data.pending_expenses > 0,
    },
    fetchedAt: new Date().toISOString(),
    source: 'aggregate_view',
  };
}

// Fallback: multiple parallel queries
async function fetchWithMultipleQueries(supabase, projectId, userContext) {
  const results = {
    project: null,
    budgetSummary: null,
    milestoneSummary: null,
    deliverableSummary: null,
    timesheetSummary: null,
    expenseSummary: null,
    pendingActions: null,
    raidSummary: null,
    qualityStandardsSummary: null,
    fetchedAt: new Date().toISOString(),
    source: 'multiple_queries',
  };

  // Run all queries in parallel
  const queries = await Promise.allSettled([
    // 1. Project info
    withTimeout(
      supabase
        .from('projects')
        .select('id, name, reference, total_budget, status')
        .eq('id', projectId)
        .single()
    ),
    
    // 2. Milestone summary
    withTimeout(
      supabase
        .from('milestones')
        .select('id, name, status, billable, actual_spend')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
    ),
    
    // 3. Deliverable summary
    withTimeout(
      supabase
        .from('deliverables')
        .select('id, status')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
    ),
    
    // 4. Timesheet summary (this month)
    withTimeout(
      supabase
        .from('timesheets')
        .select('id, hours_worked, status, resource_id')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .in('status', ['Submitted', 'Validated', 'Approved'])
    ),
    
    // 5. Expense summary
    withTimeout(
      supabase
        .from('expenses')
        .select('id, amount, status, chargeable_to_customer')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .in('status', ['Submitted', 'Validated', 'Approved'])
    ),
    
    // 6. User's pending items (if they have a linked resource)
    userContext?.linkedResourceId ? withTimeout(
      supabase
        .from('timesheets')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('resource_id', userContext.linkedResourceId)
        .eq('status', 'Draft')
    ) : Promise.resolve({ data: [] }),
    
    // 7. Items awaiting validation (for validators)
    ['admin', 'supplier_pm', 'customer_pm'].includes(userContext?.role) ? withTimeout(
      supabase
        .from('timesheets')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'Submitted')
    ) : Promise.resolve({ count: 0 }),
    
    // 8. RAID summary (Segment 11)
    withTimeout(
      supabase
        .from('raid_items')
        .select('id, type, status, priority')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .in('status', ['Open', 'In Progress'])
    ),
    
    // 9. Quality Standards summary (Segment 11)
    withTimeout(
      supabase
        .from('quality_standards')
        .select('id, status')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
    ),
  ]);

  // Process project info
  if (queries[0].status === 'fulfilled' && queries[0].value.data) {
    results.project = queries[0].value.data;
  }

  // Process milestone summary
  if (queries[1].status === 'fulfilled' && queries[1].value.data) {
    const milestones = queries[1].value.data;
    const totalBillable = milestones.reduce((sum, m) => sum + (m.billable || 0), 0);
    const totalSpent = milestones.reduce((sum, m) => sum + (m.actual_spend || 0), 0);
    
    results.milestoneSummary = {
      total: milestones.length,
      byStatus: {
        completed: milestones.filter(m => m.status === 'Completed').length,
        inProgress: milestones.filter(m => m.status === 'In Progress').length,
        notStarted: milestones.filter(m => m.status === 'Not Started').length,
        atRisk: milestones.filter(m => m.status === 'At Risk').length,
      },
      totalBillable,
      totalSpent,
      variance: totalBillable - totalSpent,
      percentUsed: totalBillable > 0 ? Math.round((totalSpent / totalBillable) * 100) : 0,
    };
    
    // Also set budget summary from milestones
    results.budgetSummary = {
      projectBudget: results.project?.total_budget || 0,
      milestoneBillable: totalBillable,
      actualSpend: totalSpent,
      variance: totalBillable - totalSpent,
      percentUsed: totalBillable > 0 ? Math.round((totalSpent / totalBillable) * 100) : 0,
    };
  }

  // Process deliverable summary
  if (queries[2].status === 'fulfilled' && queries[2].value.data) {
    const deliverables = queries[2].value.data;
    results.deliverableSummary = {
      total: deliverables.length,
      byStatus: {
        delivered: deliverables.filter(d => d.status === 'Delivered').length,
        reviewComplete: deliverables.filter(d => d.status === 'Review Complete').length,
        awaitingReview: deliverables.filter(d => d.status === 'Awaiting Review').length,
        returned: deliverables.filter(d => d.status === 'Returned').length,
        inProgress: deliverables.filter(d => d.status === 'In Progress').length,
        notStarted: deliverables.filter(d => d.status === 'Not Started').length,
      }
    };
  }

  // Process timesheet summary
  if (queries[3].status === 'fulfilled' && queries[3].value.data) {
    const timesheets = queries[3].value.data;
    results.timesheetSummary = {
      totalEntries: timesheets.length,
      totalHours: timesheets.reduce((sum, t) => sum + (t.hours_worked || 0), 0),
      byStatus: {
        submitted: timesheets.filter(t => t.status === 'Submitted').length,
        validated: timesheets.filter(t => t.status === 'Validated').length,
        approved: timesheets.filter(t => t.status === 'Approved').length,
      }
    };
  }

  // Process expense summary
  if (queries[4].status === 'fulfilled' && queries[4].value.data) {
    const expenses = queries[4].value.data;
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const chargeableAmount = expenses.filter(e => e.chargeable_to_customer !== false).reduce((sum, e) => sum + (e.amount || 0), 0);
    
    results.expenseSummary = {
      totalEntries: expenses.length,
      totalAmount,
      chargeableAmount,
      nonChargeableAmount: totalAmount - chargeableAmount,
      byStatus: {
        submitted: expenses.filter(e => e.status === 'Submitted').length,
        validated: expenses.filter(e => e.status === 'Validated').length,
        approved: expenses.filter(e => e.status === 'Approved').length,
      }
    };
  }

  // Process pending actions
  const draftTimesheets = queries[5].status === 'fulfilled' ? (queries[5].value.data?.length || 0) : 0;
  const awaitingValidation = queries[6].status === 'fulfilled' ? (queries[6].value.count || 0) : 0;
  
  results.pendingActions = {
    draftTimesheets,
    awaitingValidation,
    hasPending: draftTimesheets > 0 || awaitingValidation > 0,
  };

  // Process RAID summary (Segment 11)
  if (queries[7].status === 'fulfilled' && queries[7].value.data) {
    const items = queries[7].value.data;
    results.raidSummary = {
      total: items.length,
      openRisks: items.filter(i => i.type === 'Risk' && i.status === 'Open').length,
      openIssues: items.filter(i => i.type === 'Issue' && i.status === 'Open').length,
      highPriority: items.filter(i => i.priority === 'High').length,
      byType: {
        Risk: items.filter(i => i.type === 'Risk').length,
        Issue: items.filter(i => i.type === 'Issue').length,
        Assumption: items.filter(i => i.type === 'Assumption').length,
        Dependency: items.filter(i => i.type === 'Dependency').length,
      }
    };
  }

  // Process Quality Standards summary (Segment 11)
  if (queries[8].status === 'fulfilled' && queries[8].value.data) {
    const items = queries[8].value.data;
    results.qualityStandardsSummary = {
      total: items.length,
      compliant: items.filter(i => i.status === 'Compliant').length,
      partiallyCompliant: items.filter(i => i.status === 'Partially Compliant').length,
      nonCompliant: items.filter(i => i.status === 'Non-Compliant').length,
      notAssessed: items.filter(i => i.status === 'Not Assessed' || !i.status).length,
      needsAttention: items.filter(i => ['Non-Compliant', 'Partially Compliant'].includes(i.status)).length,
      complianceRate: items.length > 0 
        ? Math.round((items.filter(i => i.status === 'Compliant').length / items.length) * 100)
        : 0,
    };
  }

  return results;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { projectId, userContext } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();
    const context = await fetchContextBundle(projectId, userContext);
    const duration = Date.now() - startTime;

    console.log(`[Chat Context] Fetched in ${duration}ms for project ${projectId}`);

    return new Response(JSON.stringify({
      context,
      duration,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat context error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load context',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
