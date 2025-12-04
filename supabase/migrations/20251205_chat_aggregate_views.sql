-- Chat Aggregate Views
-- Pre-computed summaries for faster chat responses
-- Run this in Supabase SQL Editor

-- ============================================
-- View: project_budget_summary
-- Aggregates budget data from milestones
-- ============================================
DROP VIEW IF EXISTS project_budget_summary;
CREATE VIEW project_budget_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.total_budget as project_budget,
  COALESCE(SUM(m.billable), 0) as milestone_billable_total,
  COALESCE(SUM(m.actual_spend), 0) as actual_spend_total,
  COALESCE(SUM(m.billable), 0) - COALESCE(SUM(m.actual_spend), 0) as variance,
  CASE 
    WHEN COALESCE(SUM(m.billable), 0) > 0 
    THEN ROUND((COALESCE(SUM(m.actual_spend), 0) / SUM(m.billable)) * 100, 1)
    ELSE 0 
  END as percent_used
FROM projects p
LEFT JOIN milestones m ON m.project_id = p.id 
  AND (m.is_deleted IS NULL OR m.is_deleted = false)
GROUP BY p.id, p.name, p.total_budget;

-- ============================================
-- View: milestone_status_summary
-- Counts milestones by status per project
-- ============================================
DROP VIEW IF EXISTS milestone_status_summary;
CREATE VIEW milestone_status_summary AS
SELECT 
  project_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'Completed') as completed,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'Not Started') as not_started,
  COUNT(*) FILTER (WHERE status = 'At Risk') as at_risk,
  COUNT(*) FILTER (WHERE status = 'Approved') as approved,
  COUNT(*) FILTER (WHERE status = 'Awaiting Signatures') as awaiting_signatures,
  COUNT(*) FILTER (WHERE status = 'Awaiting Certificate') as awaiting_certificate
FROM milestones
WHERE is_deleted IS NULL OR is_deleted = false
GROUP BY project_id;

-- ============================================
-- View: deliverable_status_summary  
-- Counts deliverables by status per project
-- ============================================
DROP VIEW IF EXISTS deliverable_status_summary;
CREATE VIEW deliverable_status_summary AS
SELECT 
  project_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'Delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'Review Complete') as review_complete,
  COUNT(*) FILTER (WHERE status = 'Awaiting Review') as awaiting_review,
  COUNT(*) FILTER (WHERE status = 'Returned') as returned,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'Not Started') as not_started
FROM deliverables
WHERE is_deleted IS NULL OR is_deleted = false
GROUP BY project_id;

-- ============================================
-- View: timesheet_summary
-- Aggregates timesheet data per project
-- ============================================
DROP VIEW IF EXISTS timesheet_summary;
CREATE VIEW timesheet_summary AS
SELECT 
  project_id,
  COUNT(*) as total_entries,
  COALESCE(SUM(hours_worked), 0) as total_hours,
  COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'Submitted') as submitted_count,
  COUNT(*) FILTER (WHERE status = 'Validated') as validated_count,
  COUNT(*) FILTER (WHERE status = 'Approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
  COALESCE(SUM(hours_worked) FILTER (WHERE status IN ('Submitted', 'Validated', 'Approved')), 0) as billable_hours
FROM timesheets
WHERE is_deleted IS NULL OR is_deleted = false
GROUP BY project_id;

-- ============================================
-- View: expense_summary
-- Aggregates expense data per project
-- ============================================
DROP VIEW IF EXISTS expense_summary;
CREATE VIEW expense_summary AS
SELECT 
  project_id,
  COUNT(*) as total_entries,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE is_chargeable = true), 0) as chargeable_amount,
  COALESCE(SUM(amount) FILTER (WHERE is_chargeable = false OR is_chargeable IS NULL), 0) as non_chargeable_amount,
  COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'Submitted') as submitted_count,
  COUNT(*) FILTER (WHERE status = 'Validated') as validated_count,
  COUNT(*) FILTER (WHERE status = 'Approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
  COALESCE(SUM(amount) FILTER (WHERE status IN ('Submitted', 'Validated', 'Approved')), 0) as billable_amount
FROM expenses
WHERE is_deleted IS NULL OR is_deleted = false
GROUP BY project_id;

-- ============================================
-- View: pending_actions_summary
-- Counts items needing attention per project
-- ============================================
DROP VIEW IF EXISTS pending_actions_summary;
CREATE VIEW pending_actions_summary AS
SELECT 
  project_id,
  (SELECT COUNT(*) FROM timesheets t WHERE t.project_id = p.project_id AND t.status = 'Submitted' AND (t.is_deleted IS NULL OR t.is_deleted = false)) as timesheets_awaiting_validation,
  (SELECT COUNT(*) FROM expenses e WHERE e.project_id = p.project_id AND e.status = 'Submitted' AND (e.is_deleted IS NULL OR e.is_deleted = false)) as expenses_awaiting_validation,
  (SELECT COUNT(*) FROM deliverables d WHERE d.project_id = p.project_id AND d.status = 'Awaiting Review' AND (d.is_deleted IS NULL OR d.is_deleted = false)) as deliverables_awaiting_review
FROM (SELECT DISTINCT project_id FROM projects) p;

-- ============================================
-- Combined View: chat_context_summary
-- All summaries in one view for efficient fetching
-- ============================================
DROP VIEW IF EXISTS chat_context_summary;
CREATE VIEW chat_context_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.reference as project_reference,
  -- Budget
  COALESCE(b.project_budget, 0) as budget_total,
  COALESCE(b.milestone_billable_total, 0) as budget_milestone_billable,
  COALESCE(b.actual_spend_total, 0) as budget_actual_spend,
  COALESCE(b.variance, 0) as budget_variance,
  COALESCE(b.percent_used, 0) as budget_percent_used,
  -- Milestones
  COALESCE(m.total, 0) as milestones_total,
  COALESCE(m.completed, 0) as milestones_completed,
  COALESCE(m.in_progress, 0) as milestones_in_progress,
  COALESCE(m.at_risk, 0) as milestones_at_risk,
  COALESCE(m.not_started, 0) as milestones_not_started,
  -- Deliverables
  COALESCE(d.total, 0) as deliverables_total,
  COALESCE(d.delivered, 0) as deliverables_delivered,
  COALESCE(d.review_complete, 0) as deliverables_review_complete,
  COALESCE(d.awaiting_review, 0) as deliverables_awaiting_review,
  COALESCE(d.in_progress, 0) as deliverables_in_progress,
  -- Timesheets
  COALESCE(t.total_entries, 0) as timesheets_total,
  COALESCE(t.total_hours, 0) as timesheets_hours,
  COALESCE(t.submitted_count, 0) as timesheets_submitted,
  COALESCE(t.validated_count, 0) as timesheets_validated,
  -- Expenses
  COALESCE(e.total_entries, 0) as expenses_total,
  COALESCE(e.total_amount, 0) as expenses_amount,
  COALESCE(e.chargeable_amount, 0) as expenses_chargeable,
  COALESCE(e.non_chargeable_amount, 0) as expenses_non_chargeable,
  -- Pending
  COALESCE(pa.timesheets_awaiting_validation, 0) as pending_timesheets,
  COALESCE(pa.expenses_awaiting_validation, 0) as pending_expenses,
  COALESCE(pa.deliverables_awaiting_review, 0) as pending_deliverables
FROM projects p
LEFT JOIN project_budget_summary b ON b.project_id = p.id
LEFT JOIN milestone_status_summary m ON m.project_id = p.id
LEFT JOIN deliverable_status_summary d ON d.project_id = p.id
LEFT JOIN timesheet_summary t ON t.project_id = p.id
LEFT JOIN expense_summary e ON e.project_id = p.id
LEFT JOIN pending_actions_summary pa ON pa.project_id = p.id;

-- Grant access to authenticated users
GRANT SELECT ON project_budget_summary TO authenticated;
GRANT SELECT ON milestone_status_summary TO authenticated;
GRANT SELECT ON deliverable_status_summary TO authenticated;
GRANT SELECT ON timesheet_summary TO authenticated;
GRANT SELECT ON expense_summary TO authenticated;
GRANT SELECT ON pending_actions_summary TO authenticated;
GRANT SELECT ON chat_context_summary TO authenticated;
