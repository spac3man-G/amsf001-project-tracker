-- AMSF001 Project Tracker - RAID Log Seed Data
-- P10b-raid-seed-data.sql
-- Date: 5 December 2025
-- 
-- Seeds RAID items from SoW v2.61 (GOJ/2025/2409)
-- Run AFTER P10-raid-log.sql
--
-- IMPORTANT: Replace 'YOUR_PROJECT_ID' with the actual project UUID
-- You can find this in the projects table or URL

-- ============================================
-- SEED DATA FROM SOW DOCUMENT
-- ============================================

-- First, get the project ID (uncomment to check)
-- SELECT id, name, reference FROM projects;

-- Using a CTE to make project_id substitution easier
WITH project AS (
  SELECT id FROM projects WHERE reference = 'GOJ/2025/2409' LIMIT 1
)
INSERT INTO raid_items (
  project_id,
  raid_ref,
  category,
  title,
  description,
  impact,
  probability,
  severity,
  mitigation,
  status,
  source,
  raised_date
)
SELECT 
  project.id,
  vals.raid_ref,
  vals.category,
  vals.title,
  vals.description,
  vals.impact,
  vals.probability,
  vals.severity,
  vals.mitigation,
  'Open',
  'SoW v2.61 - Appendix 3',
  '2025-10-15'
FROM project, (VALUES
  -- ============================================
  -- DEPENDENCIES
  -- ============================================
  (
    'D001',
    'Dependency',
    'Site Access',
    'GoJ will provide timely access to all sites and facilities for physical and logical surveys.',
    'Schedule delays if access is delayed.',
    'Medium',
    'High',
    'Submit access requests early; prioritise accessible sites first; maintain a live access tracker.'
  ),
  (
    'D002',
    'Dependency',
    'Network Documentation',
    'GoJ will provide existing network documentation, topology data, and standards templates in a reasonable timeframe.',
    'Incomplete data could slow standards creation.',
    'Medium',
    'Medium',
    'Identify documentation gaps early; validate data through discovery.'
  ),
  (
    'D003',
    'Dependency',
    'Review Timelines',
    'GoJ project leads will meet agreed review timelines to be agreed in initiation and agreed at monthly retrospectives.',
    'Delayed approvals risk milestone slippage.',
    'Medium',
    'High',
    'Pre-book review slots; define deemed approval after 5 days without feedback.'
  ),
  (
    'D004',
    'Dependency',
    'Collaboration Platforms',
    'Collaboration platforms will be available and configured for secure document exchange.',
    'Delay in documentation or audit trail management.',
    'Low',
    'Medium',
    'Confirm access before project start; validate document version control process.'
  ),
  (
    'D005',
    'Dependency',
    'Survey Tools Access',
    'Contractor access to approved survey and network discovery tools and/or tool output data (ClearPass, ManageEngine).',
    'Limited technical visibility or data accuracy.',
    'Medium',
    'High',
    'Obtain GoJ InfoSec approval for tool usage early.'
  ),
  (
    'D006',
    'Dependency',
    'Data Repositories',
    'Contractor can use approved data repositories to aid creation of data schema, automation of workflows and orchestration of data sanitisation.',
    'Limited technical visibility or data accuracy, potential delays without clear data schema.',
    'Medium',
    'Medium',
    'Obtain GoJ InfoSec approval for tool usage early.'
  ),
  (
    'D007',
    'Dependency',
    'PMO Governance',
    'GoJ PMO for governance and change control approval.',
    'Impact on scope and billing timelines.',
    'Medium',
    'Medium',
    'Weekly sync with PMO; maintain transparent change log.'
  ),
  (
    'D008',
    'Dependency',
    'Document Templates',
    'GoJ-provided document templates and standards library.',
    'Delay in producing consistent deliverables.',
    'Medium',
    'Medium',
    'Request templates at T0; draft interim structure if unavailable.'
  ),
  (
    'D009',
    'Dependency',
    'SME Availability',
    'GoJ will make identified SMEs available for interviews/workshops.',
    'Incomplete discovery; delayed deliverables; inability to validate technical accuracy.',
    'Medium',
    'High',
    'Identify required SME roles and availability requirements in contract; maintain booking calendar; escalate non-availability through governance.'
  ),

  -- ============================================
  -- ASSUMPTIONS
  -- ============================================
  (
    'A001',
    'Assumption',
    'Data Accuracy Responsibility',
    'Contractor will rely on data and documentation provided by GoJ for all assessments and designs. The accuracy of deliverables depends on the accuracy of GoJ-provided information.',
    'Deliverable accuracy depends on data quality; errors from GoJ data are GoJ responsibility.',
    'Medium',
    'Medium',
    'Establish data accountability in contract; maintain data receipt log; perform spot checks on high-impact data.'
  ),
  (
    'A002',
    'Assumption',
    'Architectural Principles Agreement',
    'Technical architectural principles need to be agreed and consolidated between all team members.',
    'Misalignment of expectations; increased rework.',
    'High',
    'Medium',
    'Conduct educational workshops; use clear visuals; validate early drafts.'
  ),

  -- ============================================
  -- RISKS
  -- ============================================
  (
    'R001',
    'Risk',
    'Dependency Delivery Timing',
    'The contractor is heavily dependent on Government of Jersey delivering dependencies in a timely fashion.',
    'Rescheduling and cost impact.',
    'Medium',
    'High',
    'Schedule sessions per deliverable; require sign-off and feedback.'
  ),
  (
    'R002',
    'Risk',
    'Logistical Disruption',
    'Environmental, travel, or logistical disruption (weather, public holidays).',
    'Rescheduling and cost impact.',
    'Low',
    'Medium',
    'Maintain contingency plan; use remote survey alternatives.'
  )

) AS vals(raid_ref, category, title, description, impact, probability, severity, mitigation)
ON CONFLICT (project_id, raid_ref) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  impact = EXCLUDED.impact,
  probability = EXCLUDED.probability,
  severity = EXCLUDED.severity,
  mitigation = EXCLUDED.mitigation,
  source = EXCLUDED.source,
  updated_at = NOW();

-- ============================================
-- VERIFY IMPORT
-- ============================================

-- Run this to verify the import
SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(raid_ref, ', ' ORDER BY raid_ref) as refs
FROM raid_items
WHERE source LIKE 'SoW%'
GROUP BY category
ORDER BY category;
