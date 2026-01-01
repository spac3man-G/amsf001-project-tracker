-- Migration: Seed test data for evaluator tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.18)
-- Description: Sample data for development and testing
-- Date: 2026-01-01

-- ============================================================================
-- NOTE: This seed data assumes the default organisation exists
-- It creates a sample evaluation project with realistic test data
-- ============================================================================

-- Get the default organisation ID (created by earlier migrations)
DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_eval_project_id UUID;
  v_category_func_id UUID;
  v_category_int_id UUID;
  v_category_cost_id UUID;
  v_category_support_id UUID;
  v_area_it_id UUID;
  v_area_ops_id UUID;
  v_area_finance_id UUID;
  v_vendor1_id UUID;
  v_vendor2_id UUID;
  v_vendor3_id UUID;
  v_workshop_id UUID;
BEGIN
  -- Get default organisation
  SELECT id INTO v_org_id FROM organisations LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organisation found, skipping evaluator seed data';
    RETURN;
  END IF;

  -- Get an admin user
  SELECT p.id INTO v_admin_id 
  FROM profiles p
  JOIN user_organisations uo ON p.id = uo.user_id
  WHERE uo.organisation_id = v_org_id
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'No user found in organisation, skipping evaluator seed data';
    RETURN;
  END IF;

  -- ============================================================================
  -- CREATE EVALUATION PROJECT
  -- ============================================================================
  
  INSERT INTO evaluation_projects (
    id, organisation_id, name, description, client_name, status,
    target_start_date, target_end_date, created_by, settings
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    'CSP Platform Replacement',
    'Evaluation of Corporate Service Provider platforms to replace ViewPoint. ' ||
    'This project will assess vendors across functional requirements, integration capabilities, ' ||
    'cost considerations, and support offerings.',
    'Carey Olsen',
    'requirements',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    v_admin_id,
    '{
      "requireApproval": true,
      "allowVendorPortal": true,
      "scoringScale": 5,
      "requireEvidence": true,
      "allowAIFeatures": true
    }'::jsonb
  )
  RETURNING id INTO v_eval_project_id;

  -- Add admin user to evaluation
  INSERT INTO evaluation_project_users (
    evaluation_project_id, user_id, role, is_default
  ) VALUES (
    v_eval_project_id, v_admin_id, 'admin', true
  );

  -- ============================================================================
  -- CREATE STAKEHOLDER AREAS
  -- ============================================================================

  INSERT INTO stakeholder_areas (id, evaluation_project_id, name, description, sort_order, color)
  VALUES 
    (gen_random_uuid(), v_eval_project_id, 'IT', 'Information Technology department', 1, '#3B82F6')
  RETURNING id INTO v_area_it_id;

  INSERT INTO stakeholder_areas (id, evaluation_project_id, name, description, sort_order, color)
  VALUES 
    (gen_random_uuid(), v_eval_project_id, 'CSP Operations', 'Corporate Services Provider operations team', 2, '#10B981')
  RETURNING id INTO v_area_ops_id;

  INSERT INTO stakeholder_areas (id, evaluation_project_id, name, description, sort_order, color)
  VALUES 
    (gen_random_uuid(), v_eval_project_id, 'Finance', 'Finance and accounting department', 3, '#F59E0B')
  RETURNING id INTO v_area_finance_id;

  INSERT INTO stakeholder_areas (evaluation_project_id, name, description, sort_order, color)
  VALUES 
    (v_eval_project_id, 'Compliance', 'Compliance and regulatory team', 4, '#EF4444');

  -- ============================================================================
  -- CREATE EVALUATION CATEGORIES
  -- ============================================================================

  INSERT INTO evaluation_categories (id, evaluation_project_id, name, description, weight, sort_order, color)
  VALUES (gen_random_uuid(), v_eval_project_id, 'Functionality', 
    'Core functional capabilities of the platform', 40.00, 1, '#3B82F6')
  RETURNING id INTO v_category_func_id;

  INSERT INTO evaluation_categories (id, evaluation_project_id, name, description, weight, sort_order, color)
  VALUES (gen_random_uuid(), v_eval_project_id, 'Integration',
    'Ability to integrate with existing systems', 25.00, 2, '#10B981')
  RETURNING id INTO v_category_int_id;

  INSERT INTO evaluation_categories (id, evaluation_project_id, name, description, weight, sort_order, color)
  VALUES (gen_random_uuid(), v_eval_project_id, 'Cost',
    'Total cost of ownership and pricing model', 20.00, 3, '#F59E0B')
  RETURNING id INTO v_category_cost_id;

  INSERT INTO evaluation_categories (id, evaluation_project_id, name, description, weight, sort_order, color)
  VALUES (gen_random_uuid(), v_eval_project_id, 'Support & Training',
    'Vendor support capabilities and training offerings', 15.00, 4, '#8B5CF6')
  RETURNING id INTO v_category_support_id;

  -- ============================================================================
  -- CREATE SCORING SCALE
  -- ============================================================================

  INSERT INTO scoring_scales (evaluation_project_id, value, label, description, color)
  VALUES 
    (v_eval_project_id, 1, 'Does Not Meet', 'Solution does not meet the requirement', '#EF4444'),
    (v_eval_project_id, 2, 'Partially Meets', 'Solution partially meets with significant gaps', '#F97316'),
    (v_eval_project_id, 3, 'Meets', 'Solution adequately meets the requirement', '#EAB308'),
    (v_eval_project_id, 4, 'Exceeds', 'Solution exceeds expectations', '#22C55E'),
    (v_eval_project_id, 5, 'Exceptional', 'Solution is exceptional and best-in-class', '#10B981');

  -- ============================================================================
  -- CREATE EVALUATION CRITERIA
  -- ============================================================================

  -- Functionality criteria
  INSERT INTO evaluation_criteria (evaluation_project_id, category_id, name, description, weight, sort_order)
  VALUES 
    (v_eval_project_id, v_category_func_id, 'Entity Management', 
     'Ability to manage corporate entities, directors, shareholders', 30.00, 1),
    (v_eval_project_id, v_category_func_id, 'Document Management',
     'Document storage, versioning, and workflow capabilities', 25.00, 2),
    (v_eval_project_id, v_category_func_id, 'Compliance Calendar',
     'Automated compliance tracking and reminders', 25.00, 3),
    (v_eval_project_id, v_category_func_id, 'Reporting',
     'Standard and custom reporting capabilities', 20.00, 4);

  -- Integration criteria
  INSERT INTO evaluation_criteria (evaluation_project_id, category_id, name, description, weight, sort_order)
  VALUES 
    (v_eval_project_id, v_category_int_id, 'API Capabilities',
     'REST/GraphQL API availability and documentation', 40.00, 1),
    (v_eval_project_id, v_category_int_id, 'Data Migration',
     'Tools and support for data migration from legacy systems', 35.00, 2),
    (v_eval_project_id, v_category_int_id, 'Third-party Integrations',
     'Pre-built integrations with common tools (O365, etc.)', 25.00, 3);

  -- Cost criteria
  INSERT INTO evaluation_criteria (evaluation_project_id, category_id, name, description, weight, sort_order)
  VALUES 
    (v_eval_project_id, v_category_cost_id, 'License Cost',
     'Annual licensing and subscription costs', 50.00, 1),
    (v_eval_project_id, v_category_cost_id, 'Implementation Cost',
     'One-time implementation and configuration costs', 30.00, 2),
    (v_eval_project_id, v_category_cost_id, 'Ongoing Costs',
     'Maintenance, support, and operational costs', 20.00, 3);

  -- Support criteria
  INSERT INTO evaluation_criteria (evaluation_project_id, category_id, name, description, weight, sort_order)
  VALUES 
    (v_eval_project_id, v_category_support_id, 'Support Availability',
     'Hours of support, SLAs, and response times', 40.00, 1),
    (v_eval_project_id, v_category_support_id, 'Training Programs',
     'User training and certification offerings', 30.00, 2),
    (v_eval_project_id, v_category_support_id, 'Documentation',
     'Quality of user documentation and knowledge base', 30.00, 3);

  -- ============================================================================
  -- CREATE SAMPLE REQUIREMENTS
  -- ============================================================================

  INSERT INTO requirements (
    evaluation_project_id, reference_code, title, description,
    category_id, stakeholder_area_id, priority, status, source_type, raised_by
  ) VALUES 
    (v_eval_project_id, 'REQ-001', 'Multi-jurisdictional entity support',
     'System must support entities across multiple jurisdictions including Jersey, Guernsey, BVI, and Cayman.',
     v_category_func_id, v_area_ops_id, 'must_have', 'approved', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-002', 'Document version control',
     'All documents must have full version history with ability to compare versions.',
     v_category_func_id, v_area_ops_id, 'must_have', 'approved', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-003', 'REST API for integration',
     'Platform must provide REST API for integration with internal systems.',
     v_category_int_id, v_area_it_id, 'must_have', 'approved', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-004', 'Automated compliance reminders',
     'System should send automated reminders for upcoming compliance deadlines.',
     v_category_func_id, v_area_ops_id, 'should_have', 'approved', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-005', 'Single sign-on support',
     'Platform should support SSO via SAML or OAuth.',
     v_category_int_id, v_area_it_id, 'should_have', 'under_review', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-006', 'Mobile application',
     'Mobile app for iOS and Android for basic entity information access.',
     v_category_func_id, v_area_ops_id, 'could_have', 'draft', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-007', 'Audit trail',
     'Complete audit trail of all user actions within the system.',
     v_category_func_id, v_area_finance_id, 'must_have', 'approved', 'manual', v_admin_id),
    (v_eval_project_id, 'REQ-008', 'Custom reporting',
     'Ability to create custom reports without IT involvement.',
     v_category_func_id, v_area_finance_id, 'should_have', 'approved', 'manual', v_admin_id);

  -- ============================================================================
  -- CREATE SAMPLE VENDORS
  -- ============================================================================

  INSERT INTO vendors (
    id, evaluation_project_id, name, description, website, status, headquarters_location
  ) VALUES (
    gen_random_uuid(), v_eval_project_id, 'ViewPoint CSP',
    'Current incumbent provider. Full-featured CSP platform with strong Jersey presence.',
    'https://viewpoint.com', 'short_list', 'Jersey'
  ) RETURNING id INTO v_vendor1_id;

  INSERT INTO vendors (
    id, evaluation_project_id, name, description, website, status, headquarters_location
  ) VALUES (
    gen_random_uuid(), v_eval_project_id, 'Diligent Entities',
    'Modern cloud-based entity management platform with global footprint.',
    'https://diligent.com', 'short_list', 'United States'
  ) RETURNING id INTO v_vendor2_id;

  INSERT INTO vendors (
    id, evaluation_project_id, name, description, website, status, headquarters_location
  ) VALUES (
    gen_random_uuid(), v_eval_project_id, 'EntityKeeper',
    'Specialist CSP platform focused on offshore jurisdictions.',
    'https://entitykeeper.com', 'short_list', 'Luxembourg'
  ) RETURNING id INTO v_vendor3_id;

  -- Add a long-list vendor
  INSERT INTO vendors (
    evaluation_project_id, name, description, website, status, headquarters_location
  ) VALUES (
    v_eval_project_id, 'CSC Global',
    'Large corporate services provider with proprietary technology.',
    'https://cscglobal.com', 'long_list', 'United States'
  );

  -- Add vendor contacts
  INSERT INTO vendor_contacts (vendor_id, name, email, job_title, is_primary, contact_type)
  VALUES 
    (v_vendor1_id, 'John Smith', 'john.smith@viewpoint.com', 'Account Manager', true, 'sales'),
    (v_vendor2_id, 'Sarah Johnson', 'sarah.j@diligent.com', 'Sales Director', true, 'sales'),
    (v_vendor2_id, 'Mike Chen', 'mike.chen@diligent.com', 'Solution Architect', false, 'technical'),
    (v_vendor3_id, 'Emma Wilson', 'emma@entitykeeper.com', 'Business Development', true, 'sales');

  -- ============================================================================
  -- CREATE SAMPLE WORKSHOP
  -- ============================================================================

  INSERT INTO workshops (
    id, evaluation_project_id, name, description, scheduled_date, status, facilitator_id
  ) VALUES (
    gen_random_uuid(), v_eval_project_id, 
    'Requirements Discovery Workshop',
    'Initial workshop to gather requirements from all stakeholder groups.',
    NOW() - INTERVAL '7 days',
    'complete',
    v_admin_id
  ) RETURNING id INTO v_workshop_id;

  -- ============================================================================
  -- LOG COMPLETION
  -- ============================================================================

  RAISE NOTICE 'Evaluator seed data created successfully';
  RAISE NOTICE 'Evaluation Project ID: %', v_eval_project_id;
  RAISE NOTICE 'Created: 4 stakeholder areas, 4 categories, 13 criteria, 8 requirements, 4 vendors';

END $$;
